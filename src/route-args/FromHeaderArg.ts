import { RouteArgs } from "./RouteArgs";
import { IRouteParameter, ParameterType, IRouteCall } from "../interfaces";
import * as express from 'express';
import { Injectable } from "@spinajs/di";

@Injectable(RouteArgs)
export class FromHeaderArg extends RouteArgs {
    public get SupportedType(): ParameterType {
        return ParameterType.FromHeader;
    }

    public async extract(callData : IRouteCall,param: IRouteParameter, req: express.Request) {
        return {
            CallData: callData,
            Args: req.headers[param.Name]
        }
    }
}