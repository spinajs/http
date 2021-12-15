import { HYDRATOR_SYMBOL } from './../decorators';
import { RouteArgs } from "./RouteArgs";
import { IRouteParameter, ParameterType, IRouteCall, IRoute } from "../interfaces";
import * as express from 'express';
import { DI, Injectable } from "@spinajs/di";
import { ArgHydrator } from '.';

@Injectable(RouteArgs)
export class FromBody extends RouteArgs {
    public get SupportedType(): ParameterType {
        return ParameterType.FromBody;
    }

    public async extract(callData: IRouteCall, param: IRouteParameter, req: express.Request, _res: express.Response, route: IRoute) {
        const arg = req.body[param.Name] ? req.body[param.Name] : route.Parameters.size === 1 ? req.body : null;
        const hydrator = Reflect.getMetadata(HYDRATOR_SYMBOL, param.RuntimeType);
        let result = null;

        if(hydrator)
        {
            const hInstance = await DI.resolve<ArgHydrator>(hydrator);
            return hInstance.hydrate(arg);
        }

        switch (param.RuntimeType.name) {

            // query params are always sent as strings, even numbers,
            // we must try to parse them as integers / booleans / objects
            case "String":
            case "Number":
            case "Boolean":
            case "Object": result = arg;
                break;
            default: result = new param.RuntimeType(arg); break;
        }

        return { CallData: callData, Args: result };
    }

}