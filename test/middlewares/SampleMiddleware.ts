import { BaseMiddleware, IRoute, IController } from "../../src/interfaces";
import { Request  } from "express"

export class SampleMiddleware extends BaseMiddleware
{
    public static CalledBefore = false;
    public static CalledAfter = false;

    public isEnabled(_action: IRoute, _instance:  IController): boolean {
        return true;
    }    
    
    // tslint:disable-next-line: no-empty
    public async onBeforeAction(_req:  Request): Promise<void> {
        SampleMiddleware.CalledBefore = true;
    }
    
    // tslint:disable-next-line: no-empty
    public async onAfterAction(_req: Request): Promise<void> {
        SampleMiddleware.CalledAfter = true;

    }
    

    
}