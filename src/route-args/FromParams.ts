import { IRouteArgs } from "./RouteArgs";
import { IRouteParameter, ParameterType, IRouteCall } from "../interfaces";
import * as express from 'express';

export class FromParams implements IRouteArgs {
    public get SupportedType(): ParameterType {
        return ParameterType.FromParams;
    }

    public async extract(callData : IRouteCall, param: IRouteParameter, req: express.Request) {
        const arg = req.params[param.Name];

        // query params are always sent as strings, even numbers,
        // we must try to parse them as integers / booleans / objects
        if(param.RuntimeType === 'Number')
        {
            return Number(arg);
        }

        if(param.RuntimeType === 'Boolean')
        {
            return (arg.toLowerCase() === "true") ? true : false;
        }

        if(param.RuntimeType === "Object"){
            return JSON.parse(arg);
        }

        return { CallData: callData, Args : arg };
    }

}