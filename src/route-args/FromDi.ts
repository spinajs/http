import { IRouteArgs } from "./RouteArgs";
import { IRouteParameter, ParameterType, IRouteCall } from "../interfaces";
import * as express from 'express';
import { AsyncModule, IContainer } from "@spinajs/di";

export class FromDi extends AsyncModule implements IRouteArgs {
    
    protected _container: IContainer;

    resolveAsync(container: IContainer): Promise<void> {
        this._container = container;
        return;
    }
   
    public get SupportedType(): ParameterType {
        return ParameterType.FromDi;
    }

    public async extract(callData : IRouteCall, param: IRouteParameter, _req: express.Request) {
        const srv = this._container.resolve(param.RuntimeType, param.Options);
        return { CallData: callData, Args : srv };
    }

}