import { RouteArgs } from "./RouteArgs";
import { IRouteParameter, ParameterType, IRouteCall } from "../interfaces";
import * as express from 'express';
import { Injectable } from "@spinajs/di";

@Injectable(RouteArgs)
export class FromBody extends RouteArgs {
    public get SupportedType(): ParameterType {
        return ParameterType.FromBody;
    }

    public async extract(_callData : IRouteCall,param: IRouteParameter, req: express.Request) {
        return req.body[param.Name];
    }

}