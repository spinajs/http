import {
  RouteType,
  IRouteParameter,
  ParameterType,
  IControllerDescriptor,
  BasePolicy,
  BaseMiddleware,
  IRoute,
  IUploadOptions,
} from './interfaces';
import { ArgHydrator } from './route-args/ArgHydrator';

export const CONTROLLED_DESCRIPTOR_SYMBOL = Symbol('CONTROLLER_SYMBOL');
export const SCHEMA_SYMBOL = Symbol('SCHEMA_SYMBOL');




function Controller(
  callback: (
    controller: IControllerDescriptor,
    target: any,
    propertyKey: symbol | string,
    indexOrDescriptor: number | PropertyDescriptor,
  ) => void,
) {
  return (target: any, propertyKey?: string | symbol, indexOrDescriptor?: number | PropertyDescriptor) => {
    let metadata: IControllerDescriptor = Reflect.getMetadata(CONTROLLED_DESCRIPTOR_SYMBOL, target.prototype || target);
    if (!metadata) {
      metadata = {
        BasePath: null,
        Middlewares: [],
        Policies: [],
        Routes: new Map<string, IRoute>(),
      };

      Reflect.defineMetadata(CONTROLLED_DESCRIPTOR_SYMBOL, metadata, target.prototype || target);
    }

    if (callback) {
      callback(metadata, target, propertyKey, indexOrDescriptor);
    }
  };
}

function Route(
  callback: (
    controller: IControllerDescriptor,
    route: IRoute,
    target: any,
    propertyKey?: string,
    indexOrDescriptor?: number | PropertyDescriptor,
  ) => void,
) {
  return Controller(
    (
      metadata: IControllerDescriptor,
      target: any,
      propertyKey: string,
      indexOrDescriptor: number | PropertyDescriptor,
    ) => {
      let route: IRoute = null;
      if (propertyKey) {
        if (metadata.Routes.has(propertyKey)) {
          route = metadata.Routes.get(propertyKey);
        } else {
          route = {
            InternalType: RouteType.UNKNOWN,
            Method: propertyKey,
            Middlewares: [],
            Parameters: new Map<number, IRouteParameter>(),
            Path: '',
            Policies: [],
            Type: RouteType.UNKNOWN,
            Options: null,
          };
        }

        metadata.Routes.set(propertyKey, route);
      }

      if (callback) {
        callback(metadata, route, target, propertyKey, indexOrDescriptor);
      }
    },
  );
}

function Parameter(type: ParameterType, schema?: any, options?: any) {
  return (_: IControllerDescriptor, route: IRoute, target: any, propertyKey: string, index: number) => {
    const param: IRouteParameter = {
      Index: index,
      Name: '',
      RuntimeType: Reflect.getMetadata('design:paramtypes', target.prototype || target, propertyKey)[index],
      Schema: schema,
      Options: options,
      Type: type,
    };

    route.Parameters.set(index, param);
  };
}

/**
 * Tells controller how to fill up incoming parameters in controller actions
 * 
 * @param hydrator hydrator class that will fill up incoming argument
 * @param options 
 */
export function ArgumentHydrator(hydrator: Constructor<ArgHydrator>, ...options: any[]) {
  return (target: any) => {
    if (!Reflect.getMetadata("custom:arg_hydrator", target)) {
      Reflect.defineMetadata("custom:arg_hydrator", {
        hydrator,
        options
      }, target);
    }
  };
}

export function Policy(policy: Constructor<BasePolicy>, ...options: any[]) {
  return Route(
    (controller: IControllerDescriptor, route: IRoute, _: any, _1: string, _2: number | PropertyDescriptor) => {
      const pDesc = {
        Options: options,
        Type: policy,
      };

      if (route) {
        route.Policies.push(pDesc);
      } else {
        controller.Policies.push(pDesc);
      }
    },
  );
}

export function Middleware(policy: Constructor<BaseMiddleware>, ...options: any[]) {
  return Route(
    (controller: IControllerDescriptor, route: IRoute, _: any, _1: string, _2: number | PropertyDescriptor) => {
      const pDesc = {
        Options: options,
        Type: policy,
      };

      if (route) {
        route.Middlewares.push(pDesc);
      } else {
        controller.Middlewares.push(pDesc);
      }
    },
  );
}

export function BasePath(path: string) {
  return Controller((metadata: IControllerDescriptor) => {
    metadata.BasePath = path;
  });
}

export function FromDI() {
  return Route(Parameter(ParameterType.FromDi));
}

/**
 * Route parameter taken from query string eg. route?id=1
 *
 * @param schema parameter json schema for optional validation
 */
export function Query(schema?: any) {
  return Route(Parameter(ParameterType.FromQuery, schema));
}

/**
 * Route parameter taken from message body (POST)
 *
 * @param schema parameter json schema for optional validation
 */
export function Body(schema?: any) {
  return Route(Parameter(ParameterType.FromBody, schema));
}

/**
 * Route parameter taken from url parameters eg. route/:id
 *
 * @param schema parameter json schema for optional validation
 */
export function Param(schema?: any) {
  return Route(Parameter(ParameterType.FromParams, schema));
}

export function FromModel(schema?: any) {
  return Route(Parameter(ParameterType.FromModel, schema));
}

export function FromHeader(schema?: any) {
  return Route(Parameter(ParameterType.FromHeader, schema));
}

/**
 *
 * Parameter as file
 *
 * @param options upload options
 */
export function File(options?: IUploadOptions) {
  return Route(Parameter(ParameterType.FromFile, null, options));
}

/**
 * Data taken from cvs file that is uploaded. Actions receives parsed data
 * 
 * @param options 
 * @param cvsParseOptions 
 * @param schema 
 */
export function CsvFile(options: IUploadOptions, cvsParseOptions?: any, schema?: any) {
  return Route(Parameter(ParameterType.FromCSV, schema, {
    uploadOptions: options,
    cvsOptions: cvsParseOptions
  }));
}

/**
 * Data taken from cvs file that is uploaded. Actions receives parsed data
 * 
 * @param options 
 * @param cvsParseOptions 
 * @param schema 
 */
export function JsonFile(options: IUploadOptions, schema?: any) {
  return Route(Parameter(ParameterType.FromJSONFile, schema, options));
}

/**
 *
 * Parameter taken from form data (multipart-form)
 *
 * @param options upload options
 */
export function Form(schema?: any) {
  return Route(Parameter(ParameterType.FromForm, schema));
}

/**
 *
 * Parameter taken from form data (multipart-form)
 *
 * @param options upload options
 */
export function FormField(schema?: any) {
  return Route(Parameter(ParameterType.FormField, schema));
}

/**
 *
 * Shortcut for parameter as autoincrement primary key ( number greater than 0)
 *
 */
export function IncPkey() {
  return Route(Parameter(ParameterType.FromParams, { type: 'number', minimum: 0 }));
}

/**
 *
 * Shortcut for parameter as uuid primary key ( string with 32 length )
 *
 */
export function UuidPkey() {
  return Route(Parameter(ParameterType.FromParams, { type: 'string', minLength: 32, maxLength: 32 }));
}

/**
 *
 *  Express request
 *
 */
export function Req() {
  return Route(Parameter(ParameterType.Req, null));
}

/**
 *
 *  Express res
 *
 */
export function Res() {
  return Route(Parameter(ParameterType.Res, null));
}

/**
 *
 * Parameter taken from model
 *
 * @param options upload options
 */
export function Model(model: Constructor<any>) {
  return Route(Parameter(ParameterType.FromModel, null, { type: model }));
}

/**
 *
 * Parameter taken from model
 *
 * @param options upload options
 */
export function Cookie() {
  return Route(Parameter(ParameterType.FromCookie, { type: 'string' }));
}

/**
 * Creates HEAD http request method
 * @param path - url path to method eg. /foo/bar/:id
 */
export function Head(path?: string) {
  return Route((_, route: IRoute) => {
    route.Type = RouteType.HEAD;
    route.InternalType = RouteType.HEAD;
    route.Path = path;
  });
}

/**
 * Creates PATCH http request method
 * @param path - url path to method eg. /foo/bar/:id
 */
export function Patch(path?: string) {
  return Route((_, route: IRoute) => {
    route.Type = RouteType.PATCH;
    route.InternalType = RouteType.PATCH;
    route.Path = path;
  });
}

/**
 * Creates DELETE http request method
 * @param path - url path to method eg. /foo/bar/:id
 * @param routeName - route name visible in api. If undefined, method name is taken
 */
export function Del(path?: string) {
  return Route((_, route: IRoute) => {
    route.Type = RouteType.DELETE;
    route.InternalType = RouteType.DELETE;
    route.Path = path;
  });
}

/**
 * Creates PUT http request method
 * @param path - url path to method eg. /foo/bar/:id
 */
export function Put(path?: string) {
  return Route((_, route: IRoute) => {
    route.Type = RouteType.PUT;
    route.InternalType = RouteType.PUT;
    route.Path = path;
  });
}

/**
 * Creates GET http request method
 * @param path - url path to method eg. /foo/bar/:id
 */
export function Get(path?: string) {
  return Route((_, route: IRoute) => {
    route.Type = RouteType.GET;
    route.InternalType = RouteType.GET;
    route.Path = path;
  });
}

/**
 * Creates POST http request method
 *
 * @param path - url path to method eg. /foo/bar
 */
export function Post(path?: string) {
  return Route((_, route: IRoute) => {
    route.Type = RouteType.GET;
    route.InternalType = RouteType.POST;
    route.Path = path;
  });
}

/**
 *
 * Add schema for object eg. model or dto. If schema is not provided,
 * It tries to build one based on reflected metadata from 
 * object
 *
 * @param schema schema for object
 */
export function Schema(schema?: any) {
  return (target: any) => {
    Reflect.defineMetadata(SCHEMA_SYMBOL, schema, target);
  };
}
