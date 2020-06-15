import { RouteType, IRouteParameter, ParameterType, IControllerDescriptor, BasePolicy, BaseMiddleware, IRoute, IFileOptions } from "./interfaces";


export const CONTROLLED_DESCRIPTOR_SYMBOL = Symbol("CONTROLLER_SYMBOL");

export function Controller(callback: (controller: IControllerDescriptor, target: any, propertyKey: symbol | string, indexOrDescriptor: number | PropertyDescriptor) => void): any {
    return (target: any, propertyKey: string | symbol, indexOrDescriptor: number | PropertyDescriptor) => {
        let metadata: IControllerDescriptor = Reflect.getMetadata(CONTROLLED_DESCRIPTOR_SYMBOL, target.prototype || target);
        if (!metadata) {
            metadata = {
                BasePath: null,
                Middlewares: [],
                Policies: [],
                Routes: new Map<string, IRoute>()
            };

            Reflect.defineMetadata(CONTROLLED_DESCRIPTOR_SYMBOL, metadata, target.prototype || target);
        }

        if (callback) {
            callback(metadata, target.prototype || target, propertyKey, indexOrDescriptor)
        }
    }
}


function Route(callback: (controller: IControllerDescriptor, route: IRoute, target: any, propertyKey: string, indexOrDescriptor: number | PropertyDescriptor) => void) {
    return Controller((metadata: IControllerDescriptor, target: any, propertyKey: string, indexOrDescriptor: number | PropertyDescriptor) => {

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
                    Path: "",
                    Policies: [],
                    Type: RouteType.UNKNOWN,
                    Options: null
                }
            }
        }

        if (callback) {
            callback(metadata, route, target, propertyKey, indexOrDescriptor);
        }
    });
}

function Parameter(type: ParameterType, schema: any) {
    return (_: IControllerDescriptor, route: IRoute, target: any, propertyKey: string, index: number) => {
        const param: IRouteParameter = {
            Index: index,
            Name: "",
            RuntimeType: Reflect.getMetadata("design:paramtypes", target.prototype || target, propertyKey)[index],
            Schema: schema,
            Type: type,
        };

        route.Parameters.set(index, param);
    }
}

export function Policy(policy: Constructor<BasePolicy>, ...options: any[]) {
    return Route((controller: IControllerDescriptor, route: IRoute, _: any, _1: string, _2: number | PropertyDescriptor) => {
        const pDesc = {
            Options: options,
            Type: policy,
        };

        if (route) {
            route.Policies.push(pDesc);
        } else {
            controller.Policies.push(pDesc);
        }
    });
}

export function Middleware(policy: Constructor<BaseMiddleware>, ...options: any[]) {
    return Route((controller: IControllerDescriptor, route: IRoute, _: any, _1: string, _2: number | PropertyDescriptor) => {
        const pDesc = {
            Options: options,
            Type: policy,
        };

        if (route) {
            route.Middlewares.push(pDesc);
        } else {
            controller.Middlewares.push(pDesc);
        }
    });
}



export function BasePath(path: string) {
    return Controller((metadata: IControllerDescriptor) => {
        metadata.BasePath = path;
    });
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

/**
 * Creates HEAD http request method
 * @param path - url path to method eg. /foo/bar/:id
 * @param routeName - route name visible in api. If undefined, method name is taken
 */
export function Head(path?: string, routeName?: string) {
    return Route((_, route: IRoute) => {
        route.Type = RouteType.HEAD;
        route.InternalType = RouteType.HEAD;
        route.Path = path;
        route.Method = routeName;
    });
}

/**
 * Creates PATCH http request method
 * @param path - url path to method eg. /foo/bar/:id
 * @param routeName - route name visible in api. If undefined, method name is taken
 */
export function Patch(path?: string, routeName?: string) {
    return Route((_, route: IRoute) => {
        route.Type = RouteType.PATCH;
        route.InternalType = RouteType.PATCH;
        route.Path = path;
        route.Method = routeName;
    });
}

/**
 * Creates DELETE http request method
 * @param path - url path to method eg. /foo/bar/:id
 * @param routeName - route name visible in api. If undefined, method name is taken
 */
export function Del(path?: string, routeName?: string) {
    return Route((_, route: IRoute) => {
        route.Type = RouteType.DELETE;
        route.InternalType = RouteType.DELETE;
        route.Path = path;
        route.Method = routeName;
    });
}

/**
 * Creates FILE http request method
 * @param path - url path to method eg. /foo/bar/:id
 * @param routeName - route name visible in api. If undefined, method name is taken
 */
export function File(options?: IFileOptions, path?: string, routeName?: string) {
    return Route((_, route: IRoute) => {
        route.Type = RouteType.FILE;
        route.InternalType = RouteType.GET;
        route.Path = path;
        route.Method = routeName;
        route.Options = options;
    });
}

/**
 * Creates PUT http request method
 * @param path - url path to method eg. /foo/bar/:id
 * @param routeName - route name visible in api. If undefined, method name is taken
 */
export function Put(path?: string, routeName?: string) {
    return Route((_, route: IRoute) => {
        route.Type = RouteType.PUT;
        route.InternalType = RouteType.PUT;
        route.Path = path;
        route.Method = routeName;
    });
}

/**
 * Creates GET http request method
 * @param path - url path to method eg. /foo/bar/:id
 * @param routeName - route name visible in api. If undefined, method name is taken
 */
export function Get(path?: string, routeName?: string) {
    return Route((_, route: IRoute) => {
        route.Type = RouteType.GET;
        route.InternalType = RouteType.GET;
        route.Path = path;
        route.Method = routeName;
    });
}

/**
 * Creates POST http request method
 *
 * @param path - url path to method eg. /foo/bar
 * @param routeName - route name visible in api. If undefined, method name is taken
 */
export function Post(path?: string, routeName?: string) {
    return Route((_, route: IRoute) => {
        route.Type = RouteType.GET;
        route.InternalType = RouteType.GET;
        route.Path = path;
        route.Method = routeName;
    });
}

