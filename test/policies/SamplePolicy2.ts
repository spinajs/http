import { BasePolicy, IController, IRoute } from "../../src";
import { Request } from "express";

export class SamplePolicy2 extends BasePolicy
{
    public static Called = false;

    public isEnabled(_action: IRoute, _instance: IController): boolean {
        return true;
    }   
    
    public async execute(_req: Request): Promise<boolean> {

        SamplePolicy2.Called = true;
        return false;
    }
}