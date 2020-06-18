import { ResponseFunction } from './responses';

import { AsyncModule, IContainer, Autoinject, Injectable } from "@spinajs/di";
import { Configuration } from "@spinajs/configuration";
import { Logger, Log } from "@spinajs/log";
import { Server } from "http";
import { RequestHandler } from "express";
import { IHttpStaticFileConfiguration } from "./interfaces";
import * as fs from "fs";
import { UnexpectedServerError, AuthenticationFailed, Forbidden, InvalidArgument, BadRequest, ValidationFailed, JsonValidationFailed, ExpectedResponseUnacceptable, ResourceNotFound, IOFail, MethodNotImplemented } from "@spinajs/exceptions";
import { Unauthorized, NotFound, ServerError, BadRequest as BadRequestResponse, Forbidden as ForbiddenResponse } from "./response-methods";
import Express = require("express");


@Injectable()
export class HttpServer extends AsyncModule {

    @Autoinject(Configuration)
    protected Configuration: Configuration;

    /**
     * Express app instance
     */
    protected Express: Express.Express;

    /**
     * Http socket server
     */
    protected Server: Server;

    /**
     * Logger for this module
     */
    @Logger({ module: 'HttpServer' })
    protected Log: Log;

    constructor() {
        super();
    }

    public async resolveAsync(_container: IContainer): Promise<void> {

        this.Express = Express();

        /**
         * Register default middlewares from cfg
         */

        this.Configuration.get<any[]>('http.middlewares', []).forEach(m => {
            this.use(m);
        });

        /**
         * Server static files
         */
        this.Configuration.get<IHttpStaticFileConfiguration[]>('http.Static', []).forEach(s => {

            if (!fs.existsSync(s.Path)) {
                this.Log.error(`static file path ${s.Path} not exists`);
                return;
            }

            this.Log.info(`Serving static content from: ${s.Path} at prefix: ${s.Route}`);
            this.Express.use(s.Route, Express.static(s.Path));
        });



    }

    /**
     * Starts http server & express
     */
    public start() {

        // start http server & express
        const port = this.Configuration.get('http.port', 1337);
        return new Promise((res) => {

            this.handleResponse();
            this.handleErrors();

            this.Server = this.Express.listen(port, () => {
                this.Log.info(`Http server started at port ${port}`);
                res();
            });
        });
    }

    public stop() {
        if (this.Server) {
            this.Server.close();
            this.Server = null;
        }
    }

    /**
     * Registers global middleware to express app
     *
     * @param middleware - middleware function
     */
    public use(middleware: RequestHandler): void {
        this.Express.use(middleware);
    }

    /**
     * Executes response
     */
    protected handleResponse() {
        this.Express.use((req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
            if (!res.locals.response) {
                next(new ResourceNotFound(`Route not found ${req.method}:${req.originalUrl}`));
                return;
            }

            res.locals.response.execute(req, res).then((callback: ResponseFunction) => {
                if (callback) {
                    callback(req, res);
                }
            });
        });
    }

    /**
     * Handles thrown exceptions in actions.
     */
    protected handleErrors() {
        this.Express.use((err: any, req: Express.Request, res: Express.Response, next: Express.NextFunction) => {

            if (!err) {
                return next();
            }

            this.Log.error(`Route error: ${err}, stack: ${err.stack}`, err.parameter);

            const error = {
                message: err.message,
                parameters: err.parameter,
                stack: {},
            };

            if (process.env.NODE_ENV === 'development') {
                error.stack = err.stack ? err.stack : err.parameter && err.parameter.stack;
            }

            let response = null;

            switch (err.constructor) {
                case AuthenticationFailed:
                    response = new Unauthorized({ error: err });
                    break;
                case Forbidden:
                    response = new ForbiddenResponse({ error: err });
                    break;
                case InvalidArgument:
                case BadRequest:
                case ValidationFailed:
                case JsonValidationFailed:
                case ExpectedResponseUnacceptable:
                    response = new BadRequestResponse({ error: err });
                    break;
                case ResourceNotFound:
                    response = new NotFound({ error: err });
                    break;
                case UnexpectedServerError:
                case IOFail:
                case MethodNotImplemented:
                default:
                    response = new ServerError({ error: err });
                    break;
            }

            response.execute(req, res).then((callback: ResponseFunction) => {
                callback(req, res);
            });
        });
    }
}