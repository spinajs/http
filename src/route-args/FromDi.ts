import { RouteArgs } from "./RouteArgs";
import { IRouteParameter, ParameterType, IRouteCall } from "../interfaces";
import * as express from 'express';
import { AsyncModule, IContainer, Injectable } from "@spinajs/di";

@Injectable(RouteArgs)
export class FromDi extends AsyncModule implements RouteArgs {
    
    protected _container: IContainer;

    async resolveAsync(container: IContainer): Promise<void> {
        this._container = container;
    }
   
    public get SupportedType(): ParameterType {
        return ParameterType.FromDi;
    }

    public async extract(callData : IRouteCall, param: IRouteParameter, _req: express.Request) {
        const srv = await this._container.resolve(param.RuntimeType, param.Options);
        return { CallData: callData, Args : srv };
    }

}