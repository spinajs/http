import { IController, IControllerDescriptor, BaseMiddleware, ParameterType, IRoute, RouteCallback } from './interfaces';
import { AsyncModule, IContainer, Autoinject, DI } from "@spinajs/di";
import * as express from "express";
import { CONTROLLED_DESCRIPTOR_SYMBOL } from './decorators';
import { ValidationFailed, UnexpectedServerError } from "@spinajs/exceptions";
import { ClassInfo, TypescriptCompiler, ListFromFiles } from "@spinajs/reflection";
import { HttpServer } from './server';
import { Logger, Log } from '@spinajs/log';
import * as ajv from 'ajv';

export abstract class BaseController extends AsyncModule implements IController {

    /**
     * Array index getter
     */
    [action: string]: any;

    protected _router: express.Router;
    protected _name: string;

    protected Container: IContainer;

    /**
     * Express router with middleware stack
     */
    public get Router(): express.Router {
        return this._router;
    }

    /**
     * Controller name
     */
    public get Name(): string {
        return this._name;
    }

    /**
     * Controller descriptor
     */
    public get Descriptor(): IControllerDescriptor {
        return Reflect.getMetadata(CONTROLLED_DESCRIPTOR_SYMBOL, this) as IControllerDescriptor
    }

    /**
     * Base path for all controller routes eg. my/custom/path/
     * 
     * It can be defined via `@BasePath` decorator, defaults to controller name without `Controller` part.
     */
    public get BasePath(): string {
        return this.Descriptor.BasePath ? this.Descriptor.BasePath : this.Name.substring(0, this.Name.indexOf("Controller")).toLowerCase();
    }


    public async resolveAsync(container: IContainer) {

        const self = this;

        this.Container = container;

        for (const [, route] of this.Descriptor.Routes) {
            const handlers: express.RequestHandler[] = [];
            const action: RouteCallback = this[route.Method];
            const path = route.Path ? `/${this.BasePath}/${route.Path}` : `/${this.BasePath}/${route.Method}`;
            const middlewares = await Promise.all<BaseMiddleware>(this.Metadata.Middlewares.concat(route.Middlewares || []).map((m: any) => self.Container.resolve(m.Type, m.Options)));

            handlers.push(...middlewares.filter(m => m.isEnabled(route, this)).map(m => _invokeAction(m.onBeforeAction.bind(m))));
            handlers.push(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
                const args = (await _extractRouteArgs(route, req)).concat([req, res, next]);
                res.locals.response = await action.call(this, ...args);
            });
            handlers.push(...middlewares.filter(m => m.isEnabled(route, this)).map(m => _invokeAction(m.onAfterAction.bind(m))));

            // register to express router
            (this.router as any)[route.Type as string](path, handlers);
        }

        function _invokeAction(action: any) {
            return (req: express.Request, res: express.Response, next: express.NextFunction) => {
                action(req, res)
                    .then(() => {
                        next();
                    })
                    .catch((err: any) => {
                        next(err);
                    });
            };
        }

        async function _extractRouteArgs(route: IRoute, req: express.Request) {

            const args = new Array<any>(route.Parameters.size);

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
                }

                // if parameter have name defined load it up
                if (param.Name) {
                    // query params are always sent as strings, even numbers,
                    // we must try to parse them as integers first
                    if (param.RuntimeType.name.toLowerCase() === 'number') {
                        args[param.Index] = Number(source[param.Name]);
                    } else {
                        args[param.Index] = source[param.Name];
                    }
                } else {
                    // no parameter name, all query params goes to one val
                    args[param.Index] = source;
                }

                if (param.Schema) {

                    const validator = await self.Container.resolve<ajv.Ajv>("ControllerValidator");
                    if (!validator) {
                        throw new UnexpectedServerError("validation service is not avaible");
                    }

                    const result = validator.validate(param.Schema, args[param.Index]);
                    if (!result) {
                        throw new ValidationFailed(`parameter validation error`, validator.errors);
                    }
                }
            }

            return args;
        }
    }
}

export class Controllers extends AsyncModule {
    @Logger({ module: 'ORM' })
    protected Log: Log;

    protected Container: IContainer;

    @Autoinject()
    protected Server: HttpServer;
    /**
     * Loaded controllers
     */
    @ListFromFiles('/**/!(*.d).{ts,js}', 'system.dirs.controllers')
    protected Controllers: Promise<Array<ClassInfo<BaseController>>>;


    public async resolveAsync(container: IContainer): Promise<void> {
        this.Container = container;

        /**
         * globally register controller validator, we use ajv lib
         * we use factory func register as singlegon
         */
        DI.register(() => {
            return new ajv();
        })
            .as("ControllerValidator")
            .singleInstance();

        // extract parameters info from controllers source code & register in http server
        for (const controller of await this.Controllers) {

            this.Log.trace(`Loading controller: ${controller.name}`);

            const compiler = new TypescriptCompiler(controller.file);
            const members = compiler.getClassMembers(controller.name);

            for (const [name, route] of controller.instance.Descriptor.Routes) {
                if (members.has(name as string)) {

                    this.Log.trace(`Registering ${controller.name}:${route.Path}`);

                    const member = members.get(name as string);

                    for (const [index, rParam] of route.Parameters) {
                        const parameterInfo = member.parameters[index];
                        if (parameterInfo) {
                            rParam.Name = parameterInfo.name.getText();
                        }
                    }
                } else {
                    this.Log.error(`Controller ${controller.name} does not have member ${name as string} for route ${route.Path}`);
                }
            }

            this.Server.use(controller.instance.Router);
        }
    }
}