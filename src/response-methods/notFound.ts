import * as express from 'express';
import { HTTP_STATUS_CODE } from '../interfaces';
import { httpResponse, Response, ResponseFunction } from '../responses';

/**
 * Internall response function.
 * Returns HTTP 404 NOT FOUND ERROR
 * @param err - error to send
 */
export class NotFound extends Response {
  constructor(data: any) {
    super(data);
  }

  public async execute(_req: express.Request, _res: express.Response): Promise<ResponseFunction> {
    return httpResponse(this.responseData, HTTP_STATUS_CODE.NOT_FOUND, 'responses/notFound');
  }
}
