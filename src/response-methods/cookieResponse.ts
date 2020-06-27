import * as express from 'express';
import { Response, ResponseFunction, httpResponse } from '../responses';
import { Configuration } from '@spinajs/configuration';
import { DI } from '@spinajs/di';
import * as cs from 'cookie-signature';
import { HTTP_STATUS_CODE } from '../interfaces';

/**
 * Simpel wrapper for coockie response for api consistency.
 * It also signs cookie with coockie-secure
 */
export class CookieResponse extends Response {
  constructor(protected name: string, protected value: string, protected cookieLifetime: number, protected data?: any) {
    super(value);
  }

  public async execute(_req: express.Request, res: express.Response): Promise<ResponseFunction> {
    const cfg: Configuration = DI.resolve(Configuration);
    const cookieOpt = this.cookieLifetime ? this.cookieLifetime * 60 : cfg.get<string>('http.cookie.options');

    if (!this.responseData) {
      res.clearCookie(this.name, cookieOpt);
    } else {
      const secureKey = cfg.get<string>('http.cookie.secret');
      const signed = cs.sign(this.responseData, secureKey);

      res.cookie(this.name, signed, cookieOpt as any);
    }

    return httpResponse(this.data, HTTP_STATUS_CODE.OK, 'responses/ok');
  }
}
