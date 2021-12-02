import { IRouteArgs } from "./RouteArgs";
import { IRouteParameter, ParameterType, IRouteCall } from "../interfaces";
import * as express from 'express';

export class ArgAsRequest implements IRouteArgs {

    public get SupportedType(): ParameterType {
        return ParameterType.Req;
    }

    public async extract(callData : IRouteCall, _param: IRouteParameter, req: express.Request) {
        return { CallData: callData, Args: req };

    }

}