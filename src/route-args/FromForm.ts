import { IRouteArgs } from "./RouteArgs";
import { IRouteParameter, ParameterType, IRouteCall } from "../interfaces";
import * as express from 'express';
import { Fields, Files, IncomingForm } from "formidable";
import { Configuration } from "@spinajs/configuration";
import { isFunction } from "lodash";
import { DI } from "@spinajs/di";

interface FormData {
    Fields: Fields;
    Files: Files;
}

export type FormOptionsCallback = (conf: Configuration) => Promise<FormOptions>

export interface FormOptions {
    encoding?: string;
    uploadDir?: string;
    keepExtensions?: boolean;
    maxFileSize?: number;
    maxFieldsSize?: number;
    maxFields?: number;
    hash?: string | boolean;
    multiples?: boolean;
    type?: string;
}

export class FromFormBase {
    protected Data: FormData;

    protected async parseForm(callData: IRouteCall, param: IRouteParameter, req: express.Request) {

        if (callData && callData.Payload && callData.Payload.Form) {
            this.Data = callData.Payload.Form;
        }

        if (!this.Data) {
            await this.parse(req, param.Options)
        }

    }

    protected async parse(req: express.Request, options: FormOptions | FormOptionsCallback) {
        if (!this.Data) {

            let opts: any = options;

            if (options && isFunction(options)) {
                opts = await options(DI.get(Configuration));
            }

            this.Data = await this._parse(req, opts);
        }
    }

    private _parse(req: express.Request, options: any) {
        const form = new IncomingForm(options);
        return new Promise<FormData>((res, rej) => {
            form.parse(req, (err: any, fields: Fields, files: Files) => {
                if (err) {
                    rej(err);
                    return;
                }

                res({ Fields: fields, Files: files });
            });
        })
    }
}

export class FromFile extends FromFormBase implements IRouteArgs {

    public get SupportedType(): ParameterType {
        return ParameterType.FromQuery;
    }

    public async extract(callData: IRouteCall, param: IRouteParameter, req: express.Request) {

        if (!this.Data) {
            await this.parseForm(callData, param, req);
        }

        // map from formidable to our object
        // of type IUploadedFile
        const sourceFile = this.Data.Files[param.Name];
        const file = {
            Size: sourceFile.size,
            Path: sourceFile.path,
            Name: sourceFile.name,
            Type: sourceFile.type,
            LastModifiedDate: sourceFile.lastModifiedDate,
            Hash: sourceFile.hash
        };

        return {
            CallData: {
                ...callData,
                Payload: {
                    Form: this.Data
                }
            },
            Args: file
        }
    }

}

export class FromForm extends FromFormBase implements IRouteArgs {
    public get SupportedType(): ParameterType {
        return ParameterType.FromQuery;
    }

    public async extract(callData: IRouteCall, param: IRouteParameter, req: express.Request) {
        
        if (!this.Data) {
            await this.parseForm(callData, param, req);
        }

        return {
            CallData: {
                ...callData,
                Payload: {
                    Form: this.Data
                }
            },
            Args: this.Data.Fields[param.Name]
        }
    }
}