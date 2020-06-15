import * as express from 'express';
import { Response, ResponseFunction } from '../responses';

/**
 * Redirects to another route ( simple alias for request.redirect for api consistency)
 * 
 * @param url - url path to another location
 */
export class Redirect extends Response {

  protected url: string;

  constructor(url: any) {
    super(null);

    this.url = url;
  }

  public async execute(_req: express.Request, res: express.Response): Promise<ResponseFunction | void> {
    res.redirect(this.url);
  }
}


