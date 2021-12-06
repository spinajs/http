import { ParameterType, IRouteParameter, IRouteCall} from './../interfaces';
import * as express from "express";

export interface IRouteArgsResult 
{ 
    CallData : IRouteCall;
    Args : any;
}

export abstract class RouteArgs {

    abstract get SupportedType(): ParameterType | string;

    public abstract extract(callData : IRouteCall, route: IRouteParameter, req: express.Request, res : express.Response): Promise<IRouteArgsResult>;
}