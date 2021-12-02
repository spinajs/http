import { IRouteArgs } from "./RouteArgs";
import { IRouteParameter, ParameterType, IRouteCall } from "../interfaces";
import * as express from 'express';

export class FromQuery implements IRouteArgs {
    public get SupportedType(): ParameterType {
        return ParameterType.FromQuery;
    }

    public async extract(callData: IRouteCall, param: IRouteParameter, req: express.Request) {
        return { CallData: callData, Args : req.query[param.Name] };
    }

}