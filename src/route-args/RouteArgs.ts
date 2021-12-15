import { ParameterType, IRouteParameter, IRouteCall, IRoute} from './../interfaces';
import * as express from "express";

export interface IRouteArgsResult 
{ 
    CallData : IRouteCall;
    Args : any;
}

export abstract class RouteArgs {

    abstract get SupportedType(): ParameterType | string;

    public abstract extract(callData : IRouteCall, routeParameter: IRouteParameter, req: express.Request, res : express.Response, route? : IRoute): Promise<IRouteArgsResult>;
}