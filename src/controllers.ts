import {
  IController,
  IControllerDescriptor,
  IPolicyDescriptor,
  BaseMiddleware,
  ParameterType,
  IRoute,
  RouteCallback,
  IMiddlewareDescriptor,
  BasePolicy,
} from './interfaces';
import { AsyncModule, IContainer, Autoinject, DI } from '@spinajs/di';
import * as express from 'express';
import { CONTROLLED_DESCRIPTOR_SYMBOL, SCHEMA_SYMBOL } from './decorators';
import { ValidationFailed, UnexpectedServerError, BadRequest, NotSupported } from '@spinajs/exceptions';
import { ClassInfo, TypescriptCompiler, ResolveFromFiles } from '@spinajs/reflection';
import { HttpServer } from './server';
import { Logger, Log } from '@spinajs/log';
import { IncomingForm, Files, Fields } from 'formidable';
import * as cs from 'cookie-signature';
import { Configuration } from '@spinajs/configuration';
import { DataValidator } from './schemas';
import { isFunction } from 'lodash';

export abstract class BaseController extends AsyncModule implements IController {
  /**
   * Array index getter
   */
  [action: string]: any;

  protected _router: express.Router;

  protected Container: IContainer;

  @Logger({ module: 'BaseController' })
  protected Log: Log;

  /**
   * Express router with middleware stack
   */
  public get Router(): express.Router {
    return this._router;
  }

  /**
   * Controller descriptor
   */
  public get Descriptor(): IControllerDescriptor {
    return Reflect.getMetadata(CONTROLLED_DESCRIPTOR_SYMBOL, this) as IControllerDescriptor;
  }

  /**
   * Base path for all controller routes eg. my/custom/path/
   *
   * It can be defined via `@BasePath` decorator, defaults to controller name without `Controller` part.
   */
  public get BasePath(): string {
    return this.Descriptor.BasePath ? this.Descriptor.BasePath : this.constructor.name.toLowerCase();
  }

  public async resolveAsync(container: IContainer) {
    const self = this;

    this.Container = container;
    this._router = express.Router();

    for (const [, route] of this.Descriptor.Routes) {
      const handlers: express.RequestHandler[] = [];
      const action: RouteCallback = this[route.Method];
      let path = '';
      if (route.Path) {
        if (route.Path === '/') {
          path = `/${this.BasePath}`;
        } else {
          path = `/${this.BasePath}/${route.Path}`;
        }
      } else {
        path = `/${this.BasePath}/${route.Method}`;
      }

      const middlewares = await Promise.all<BaseMiddleware>(
        this.Descriptor.Middlewares.concat(route.Middlewares || []).map((m: IMiddlewareDescriptor) => {
          return self.Container.resolve(m.Type, m.Options);
        }),
      );
      const policies = await Promise.all<BasePolicy>(
        this.Descriptor.Policies.concat(route.Policies || []).map((m: IPolicyDescriptor) => {
          return self.Container.resolve(m.Type, m.Options);
        }),
      );

      this.Log.trace(`Registering route ${route.Method}:${path}`);

      handlers.push(
        ...policies.filter(p => p.isEnabled(route, this)).map(p => _invokePolicyAction(p, p.execute.bind(p), route)),
      );
      handlers.push(
        ...middlewares.filter(m => m.isEnabled(route, this)).map(m => _invokeAction(m, m.onBeforeAction.bind(m))),
      );

      const acionWrapper = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
          const args = (await _extractRouteArgs(route, req, res)).concat([req, res, next]);
          res.locals.response = await action.call(this, ...args);
          next();
        } catch (err) {
          next(err);
        }
      };

      Object.defineProperty(acionWrapper, 'name', {
        value: this.constructor.name,
        writable: true,
      });

      handlers.push(acionWrapper);
      handlers.push(
        ...middlewares.filter(m => m.isEnabled(route, this)).map(m => _invokeAction(m, m.onAfterAction.bind(m))),
      );

      // register to express router
      (this._router as any)[route.InternalType as string](path, handlers);
    }

    function _invokeAction(source: any, action: any) {
      const wrapper = (req: express.Request, res: express.Response, next: express.NextFunction) => {
        action(req, res, self)
          .then(() => {
            next();
          })
          .catch((err: any) => {
            next(err);
          });
      };

      Object.defineProperty(wrapper, 'name', {
        value: source.constructor.name,
        writable: true,
      });
      return wrapper;
    }

    function _invokePolicyAction(source: any, action: any, route: IRoute) {
      const wrapper = (req: express.Request, _res: express.Response, next: express.NextFunction) => {
        action(req, route, self)
          .then(next)
          .catch((err: any) => {

            self.Log.trace(`route ${self.constructor.name}:${route.Method} ${self.BasePath}${route.Path} error ${err}, policy: ${source.constructor.name}`);

            next(err);
          });
      };

      Object.defineProperty(wrapper, 'name', {
        value: source.constructor.name,
        writable: true,
      });

      return wrapper;
    }

    async function _extractRouteArgs(route: IRoute, req: express.Request, res: express.Response) {
      const args = new Array<any>(route.Parameters.size);
      let multipartsCache: { fields: Fields; files: Files } = null;

      for (const [, param] of route.Parameters) {
        let source = null;

        switch (param.Type) {
          case ParameterType.FromBody:
            source = req.body;
            break;
          case ParameterType.FromParams:
            source = req.params;
            break;
          case ParameterType.FromQuery:
            source = req.query;
            break;
          case ParameterType.FromCookie:
            source = req.cookies;
            break;
          case ParameterType.FromModel:
            source = await _extractModel(param.Options, param.RuntimeType, req);
            break;
          case ParameterType.FromDi:
            source = await _inject(param.RuntimeType, param.Options);
            break;
          case ParameterType.FormField:
          case ParameterType.FromFile:
          case ParameterType.FromForm:
            source = await _extractMultipart(param.Options, req, param.Type);
            break;
          case ParameterType.Res:
            args[param.Index] = res;
            continue;
          case ParameterType.Req:
            args[param.Index] = req;
            continue;
        }

        // if parameter have name defined load it up
        if (param.Name) {
          // form fields goes to one
          if (param.Type === ParameterType.FromCookie) {
            const secret = DI.get(Configuration).get<string>('http.cookie.secret');
            const val = source[param.Name];

            if (!val) {
              args[param.Index] = null;
            } else {
              args[param.Index] = cs.unsign(val, secret);
            }
          } else if (param.Type === ParameterType.FromFile) {

            // map from formidable to our object
            // of type IUploadedFile
            const sourceFile = source[param.Name];
            args[param.Index] = {
              Size: sourceFile.size,
              Path: sourceFile.path,
              Name: sourceFile.name,
              Type: sourceFile.type,
              LastModifiedDate: sourceFile.lastModifiedDate,
              Hash: sourceFile.hash
            }
          }
          else if (param.Type === ParameterType.FromForm || param.Type === ParameterType.FromModel) {
            args[param.Index] = source;
          } else {
            args[param.Index] = source[param.Name];
          }
        } else {
          // no parameter name, all query params goes to one val
          args[param.Index] = source;
        }

        const dtoSchema = Reflect.getMetadata(SCHEMA_SYMBOL, param.RuntimeType);
        let schema = dtoSchema ?? param.Schema;

        // try gues schema if one of basic type
        if (!schema) {
          switch (param.RuntimeType.name) {
            case "Number":
              schema = {
                type: "number"
              }
              break;
            case "String":
              schema = {
                type: "string",
                maxLength: 512
              }
              break;
            case "Boolean":
              schema = {
                type: "boolean"
              }
              break;
          }
        }

        // query params are always sent as strings, even numbers,
        // we must try to parse them as integers / booleans first
        if (param.RuntimeType.name === 'Number') {
          args[param.Index] = Number((args as any)[param.Index]);
        }
        if (param.RuntimeType.name === 'Boolean' && typeof args[param.Index] === "string") {
          args[param.Index] = args[param.Index] === "true" ? true : false;
        }

        if (schema) {
          const validator = await self.Container.resolve<DataValidator>(DataValidator);
          if (!validator) {
            throw new UnexpectedServerError('validation service is not avaible');
          }

          const result = validator.validate(schema, args[param.Index]);
          if (!result.valid) {
            if (schema.required || schema.required === undefined) {
              throw new ValidationFailed(`parameter validation error ${param.Name}`, {
                param: param.Name,
                errors: result.errors,
              });
            }

          }
        }
      }

      return args;

      async function _inject(type: Constructor<any>, options: any) {
        return await self.Container.resolve(type, options)
      }

      async function _extractModel(options: any, type: Constructor<any>, req: express.Request) {
        if ((type as any).get === undefined) {
          throw new NotSupported(`${type.name} does not support method find, make sure its model type`);
        }

        const key = options.KeyName ?? 'Id';
        const pkVal = req.params[key] ?? req.query[key] ?? req.body[key];

        if (!pkVal) {
          throw new BadRequest(`key value invalid`);
        }

        return await (type as any).get.call(null, [pkVal]);
      }

      async function _extractMultipart(options: any, req: express.Request, type: ParameterType) {
        if (!multipartsCache) {
          multipartsCache = await _parse();
        }

        switch (type) {
          case ParameterType.FromFile:
            return multipartsCache.files;
          case ParameterType.FromForm:
          case ParameterType.FormField:
            return multipartsCache.fields;
        }

        async function  _parse(): Promise<{ fields: Fields; files: Files }> {

          const formOptions = options;
          
          if (options && options.uploadDir && isFunction(options.uploadDir)) {
            const cfg = DI.resolve(Configuration);
            formOptions.uploadDir = await options.uploadDir(cfg);
          }

          const form = new IncomingForm(formOptions);

          return new Promise((res, rej) => {
            form.parse(req, (err: any, fields: Fields, files: Files) => {
              if (err) {
                rej(err);
                return;
              }

              res({ fields, files });
            });
          });
        }
      }
    }
  }
}

export class Controllers extends AsyncModule {
  /**
   * Loaded controllers
   */
  @ResolveFromFiles('/**/!(*.d).{ts,js}', 'system.dirs.controllers')
  public Controllers: Promise<Array<ClassInfo<BaseController>>>;

  @Logger({ module: 'Controllers' })
  protected Log: Log;

  protected Container: IContainer;

  @Autoinject()
  protected Server: HttpServer;

  public async resolveAsync(container: IContainer): Promise<void> {
    this.Container = container;

    /**
     * globally register controller validator, we use ajv lib
     * we use factory func register as singlegon
     */

    DI.register(DataValidator).asSelf().singleInstance();


    // extract parameters info from controllers source code & register in http server
    for (const controller of await this.Controllers) {
      this.Log.trace(`Loading controller: ${controller.name}`);

      const compiler = new TypescriptCompiler(controller.file.replace('.js', '.d.ts'));
      const members = compiler.getClassMembers(controller.name);

      for (const [name, route] of controller.instance.Descriptor.Routes) {
        if (members.has(name as string)) {
          const member = members.get(name as string);

          for (const [index, rParam] of route.Parameters) {
            const parameterInfo = member.parameters[index];
            if (parameterInfo) {
              rParam.Name = (parameterInfo.name as any).text;
            }
          }
        } else {
          this.Log.error(
            `Controller ${controller.name} does not have member ${name as string} for route ${route.Path}`,
          );
        }
      }

      this.Server.use(controller.instance.Router);
    }
  }
}
