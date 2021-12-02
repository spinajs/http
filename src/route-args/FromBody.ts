import { IRouteArgs } from "./RouteArgs";
import { IRouteParameter, ParameterType, IRouteCall } from "../interfaces";
import * as express from 'express';

export class FromBody implements IRouteArgs {
    public get SupportedType(): ParameterType {
        return ParameterType.FromBody;
    }

    public async extract(_callData : IRouteCall,param: IRouteParameter, req: express.Request) {
        return req.body[param.Name];
    }

}