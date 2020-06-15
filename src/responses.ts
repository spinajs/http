import * as express from "express";
import { HTTP_STATUS_CODE, HttpAcceptHeaders } from "./interfaces";
import { Configuration } from "@spinajs/configuration";
import { DI } from "@spinajs/di";
import { LogModule, Log } from "@spinajs/log";
import * as pugTemplate from 'pug';
import { join, normalize } from 'path';
import * as fs from 'fs';
import * as _ from "lodash";
import { IOFail } from "@spinajs/exceptions";
import * as randomstring from 'randomstring';
import { Intl } from "@spinajs/intl";

const __ = (DI.get<Intl>(Intl)).__;
const __n = (DI.get<Intl>(Intl)).__n;
const __l = (DI.get<Intl>(Intl)).__l;
const __h = (DI.get<Intl>(Intl)).__h;

export type ResponseFunction = (req: express.Request, res: express.Response) => void;
 

export abstract class Response {
    protected responseData: any;

    constructor(responseData: any) {
        this.responseData = responseData;
    }

    public abstract async execute(req: express.Request, res: express.Response, next? : express.NextFunction): Promise<ResponseFunction | void>;
}

/**
 * Sends data & sets proper header as json
 *
 * @param model - data to send
 * @param status - status code
 */
export function jsonResponse(model: any, status?: HTTP_STATUS_CODE) {
    return (_req: express.Request, res: express.Response) => {
        res.status(status ? status : HTTP_STATUS_CODE.OK);

        if (model) {
            res.json(model);
        }
    };
}

/**
 * Sends html response & sets proper header. If template is not avaible, handles proper error rendering.
 *
 * @param file - template file path
 * @param model - data passed to template
 * @param status - optional status code
 */
export function pugResponse(file: string, model: any, status?: HTTP_STATUS_CODE) {
    const log: Log = DI.get<LogModule>('LogModule').getLogger();
    const cfg: Configuration = DI.get('Configuration');

    return (_req: express.Request, res: express.Response) => {
        res.set('Content-Type', 'text/html');

        try {
            try {
                _render(file, model, status);
            } catch (err) {
                log.warn(`Cannot render pug file ${file}, error: ${err.message}:${err.stack}`, err);

                // try to render server error response
                _render('responses/serverError.pug', err, HTTP_STATUS_CODE.INTERNAL_ERROR);
            }
        } catch (err) {
            // final fallback rendering error fails, we render embedded html error page
            const ticketNo = randomstring.generate(7);

            log.warn(`Cannot render pug file error: ${err.message}, ticket: ${ticketNo}`, err);

            res.status(HTTP_STATUS_CODE.INTERNAL_ERROR);
            res.send(cfg.get<string>('http.FatalTemplate').replace('{ticket}', ticketNo));
        }

        function _render(f: string, m: any, c: HTTP_STATUS_CODE) {
            const view = getView(f);

            const content = pugTemplate.renderFile(
                view,
                _.merge(m, {
                    // add i18n functions as globals
                    __,
                    __n,
                    __l,
                    __h,
                }),
            );

            res.status(c ? c : HTTP_STATUS_CODE.OK);
            res.send(content);
        }

        function getView(viewFile: string) {
            const views = cfg.get<string[]>('system.dirs.views')
                .map(p => normalize(join(p, viewFile)))
                .filter(f => fs.existsSync(f));

            if (_.isEmpty(views)) {
                throw new IOFail(`View file ${viewFile} not exists.`);
            }

            // return last merged path, eg. if application have own view files (override standard views)
            return views[views.length - 1];
        }
    };
}


/**
 * Default response handling. Checks `Accept` header & matches proper response
 * For now its supports html & json responses
 *
 * @param model - data to send
 * @param code - status code
 * @param template - template to render without extension eg. `views/responses/ok`. It will try to match .pug, .xml or whatever to match response
 *                  to `Accept` header
 */
export function httpResponse(model: any, code: HTTP_STATUS_CODE, template: string) {
    const cfg: Configuration = DI.get('Configuration');
    const acceptedHeaders = cfg.get<HttpAcceptHeaders>('http.AcceptHeaders');

    return (req: express.Request, res: express.Response) => {
        if (req.accepts('html') && (acceptedHeaders & HttpAcceptHeaders.HTML) === HttpAcceptHeaders.HTML) {
            pugResponse(`${template}.pug`, model, code)(req, res);
        } else if (req.accepts('json') && (acceptedHeaders & HttpAcceptHeaders.HTML) === HttpAcceptHeaders.JSON) {
            jsonResponse(model, code)(req, res);
        } else {
            jsonResponse(model, code)(req, res);
        }
    };
}
