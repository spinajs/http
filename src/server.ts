 
import { AsyncModule, IContainer, Autoinject, Injectable } from "@spinajs/di";
import { Configuration } from "@spinajs/configuration";
import { Logger, Log } from "@spinajs/log";
import * as Express from 'express';
import { Server } from "http";
import { RequestHandler } from "express";
import { IHttpStaticFileConfiguration } from "./interfaces";
import * as fs from "fs";
import { UnexpectedServerError, AuthenticationFailed, Forbidden, InvalidArgument, BadRequest, ValidationFailed, JsonValidationFailed, ExpectedResponseUnacceptable, ResourceNotFound, IOFail, MethodNotImplemented } from "@spinajs/exceptions";
import { Unauthorized, NotFound, ServerError, BadRequest as BadRequestResponse, Forbidden as ForbiddenResponse  } from "./response-methods";


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
        this.Configuration.get<IHttpStaticFileConfiguration[]>('http.static', []).forEach(s => {

            if (!fs.existsSync(s.Path)) {
                this.Log.error(`static file path ${s.Path} not exists`);
                return;
            }

            this.Log.info(`Serving static content from: ${s.Path} at prefix: ${s.Route}`);
            this.Express.use(s.Route, Express.static(s.Path));
        });



    }

    public start() {

        // start http server & express
        const port = this.Configuration.get('http.port', 1337);
        return new Promise((res) => {
            this.Server = this.Express.listen(port, () => {
                this.Log.info(`Http server started at port ${port}`);
                res();
            });
        });
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
                next(new UnexpectedServerError(`Route not found ${req.method}:${req.originalUrl}`));
                return;
            }

            res.locals.execute(req, res, next);
        });
    }

    /**
     * Handles thrown exceptions in actions.
     */
    protected handleErrors() {
        this.Express.use((err: any, _req: Express.Request, res: Express.Response, next: Express.NextFunction) => {

            if(!err)
            {
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


            switch (err.constructor) {
                case AuthenticationFailed:
                    res.locals.response = new Unauthorized({ error: err });
                    break;
                case Forbidden:
                    res.locals.response = new ForbiddenResponse({ error: err });
                    break;
                case InvalidArgument:
                case BadRequest:
                case ValidationFailed:
                case JsonValidationFailed:
                case ExpectedResponseUnacceptable:
                    res.locals.response = new BadRequestResponse({ error: err });
                    break;
                case ResourceNotFound:
                    res.locals.response = new NotFound({ error: err });
                    break;
                case UnexpectedServerError:
                case IOFail:
                case MethodNotImplemented:
                default:
                    res.locals.response = new ServerError({ error: err });
                    break;
            }

            next(err);
        });
    }
}