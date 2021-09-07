import * as express from 'express';
import { Constructor } from '@spinajs/di';

/**
 * Accept header enum
 */
export enum HttpAcceptHeaders {
  /**
   * Accept header for JSON
   */
  JSON = 1,

  /**
   * Accept header for HTML
   */
  HTML = 2,

  /**
   * Accept header for XML
   */
  XML = 4,

  /**
   * Accept all accept headers shorcut
   */
  ALL = 1 | 2 | 4,
}

/**
 * Config options for static files
 */
export interface IHttpStaticFileConfiguration {
  /**
   * virtual prefix in url eg. http://localhost:3000/static/images/kitten.jpg
   */
  Route: string;

  /**
   * full path to folder with static content
   */
  Path: string;
}

/**
 * Uploaded file fields
 */
export interface IUploadedFile {
  Size: number;
  Path: string;
  Name: string;
  Type: string;
  LastModifiedDate?: Date;
  Hash?: string;
}

/**
 * HTTP response statuses
 */
export enum HTTP_STATUS_CODE {
  /**
   * All ok with content
   */
  OK = 200,

  /**
   * Request is OK and new resource has been created.
   */
  CREATED = 201,

  /**
   * Request is accepted, but has not been completed yet.
   */
  ACCEPTED = 202,

  /**
   * ALl is ok & no content to return
   */
  NO_CONTENT = 204,

  /**
   * The server is delivering only part of the resource (byte serving) due to a range header
   * sent by the client. The range header is used by HTTP clients to enable resuming of
   * interrupted downloads, or split a download into multiple simultaneous streams.
   */
  PARTIAL_CONTENT = 206,

  /**
   * Resource is not modified
   */
  NOT_MODIFIED = 304,

  /**
   * Invalid request, eg. invalid parameters
   */
  BAD_REQUEST = 400,

  /**
   * Auth required
   */
  UNAUTHORIZED = 401,

  /**
   * No permission
   */
  FORBIDDEN = 403,

  /**
   * Resource not found
   */
  NOT_FOUND = 404,

  /**
   * Not acceptable request headers (Accept header)
   */
  NOT_ACCEPTABLE = 406,

  /**
   * Conflict
   */
  CONFLICT = 409,

  /**
   * Internal server error.
   */
  INTERNAL_ERROR = 500,

  /**
   * Method not implemented
   */
  NOT_IMPLEMENTED = 501,
}

/**
 * Avaible route types, match HTTP methods
 */
export enum RouteType {
  /**
   * POST method - used to create new resource or send data to server
   */
  POST = 'post',

  /**
   * GET method - used to retrieve data from server
   */
  GET = 'get',

  /**
   * PUT method - used to updates resource
   */
  PUT = 'put',

  /**
   * DELETE method - used to delete resource
   */
  DELETE = 'delete',

  /**
   * PATCH method - used to partially update resource eg. one field
   */
  PATCH = 'patch',

  /**
   * HEAD method - same as get, but returns no data. usefull for checking if resource exists etc.
   */
  HEAD = 'head',

  /**
   * FILE method - spine special route type. Internall its simple GET method, but informs that specified route returns binary file
   */
  FILE = 'file',

  UNKNOWN = 'unknown',
}

/**
 * Avaible route parameters type
 */
export enum ParameterType {

  /**
   * Parameter is injected from DI container & resolved
   */
  FromDi,

  /**
   * Parameter value is taken from query string eg. `?name=flavio`
   */
  FromQuery,

  /**
   * From message body, eg. POST json object
   */
  FromBody,

  /**
   * From url params eg: `/:id`
   */
  FromParams,

  /**
   * From form file field
   */
  FromFile,

  /**
   * From form
   */
  FromForm,

  /**
   * From form field
   */
  FormField,

  /**
   * From model object
   */
  FromModel,

  /**
   * Data from coockie
   */
  FromCookie,

  /**
   * Req from express
   */
  Req,

  // Res from express
  Res
}

export interface IUploadOptions {
  /**
   * default 1000; limit the number of fields that the Querystring parser will decode, set 0 for unlimited
   */
  maxFields?: number;

  /**
   *  default 20 * 1024 * 1024 (20mb); limit the amount of memory all fields together (except files) can allocate in bytes.
   */
  maxFieldsSize?: number;

  /**
   *  default 200 * 1024 * 1024 (200mb); limit the size of uploaded file.
   */
  maxFileSize?: number;

  /**
   * default false; to include the extensions of the original files or not
   */
  keepExtensions?: boolean;

  /**
   * default 'utf-8'; sets encoding for incoming form fields,
   */
  encoding?: string;

  /**
   * default false; include checksums calculated for incoming files, set this to some hash algorithm, see crypto.createHash for available algorithms
   */
  hash?: false;

  /**
   * default os.tmpdir(); the directory for placing file uploads in. You can move them later by using fs.rename()
   */
  uploadDir?: string;

  /**
   * default false; when you call the .parse method, the files argument (of the callback) will contain arrays of files for inputs which submit multiple files using the HTML5 multiple attribute. Also, the fields argument will contain arrays of values for fields that have names ending with '[]'.
   */
  multiples?: boolean;

  enabledPlugins?: string[];
}

/**
 * Describes parameters passed to route.
 */
export interface IRouteParameter {
  /**
   * Parameter index in function args
   */
  Index: number;

  /**
   * Is value taken from query string, url params or message body
   */
  Type: ParameterType;

  /**
   * Schema for validation
   */
  Schema?: any;

  /**
   * Additional options
   */
  Options?: any;

  /**
   * Parameter runtime type eg. number or class
   */
  RuntimeType: any;

  /**
   * Name of parameter eg. `id`
   */
  Name: string;
}

export interface IRoute {
  /**
   * url path eg. /foo/bar/:id
   */
  Path: string;

  /**
   * HTTP request method, used internally. Not visible to others.
   */
  InternalType: RouteType;

  /**
   * SPINAJS API method type, mostly same as HTTP type, but can be non standard type eg. FILE
   * This type is visible outside in api discovery.
   */
  Type: RouteType;

  /**
   * Method name assigned to this route eg. `findUsers`
   */
  Method: string;

  /**
   * Custom route parameters taken from query string or message body
   */
  Parameters: Map<number, IRouteParameter>;

  /**
   * Assigned middlewares to route
   */
  Middlewares: IMiddlewareDescriptor[];

  /**
   * Assigned policies to route
   */
  Policies: IPolicyDescriptor[];

  /**
   * Additional route options eg. file size etc.
   */
  Options: any;
}

export interface IMiddlewareDescriptor {
  Type: Constructor<BaseMiddleware>;

  Options: any[];
}

export interface IController {
  /**
   * Express router with middleware stack
   */
  Router: express.Router;

  /**
   * Controller descriptor
   */
  Descriptor: IControllerDescriptor;

  /**
   * Base path for all controller routes eg. my/custom/path/
   *
   * It can be defined via `@BasePath` decorator, defaults to controller name without `Controller` part.
   */
  BasePath: string;
}

/**
 * Middlewares are classes that can change request object or perform specific task before & after route execution
 * eg. route parameter logging / headers check etc.
 */
export abstract class BaseMiddleware {
  /**
   * Inform, if middleware is enabled for given action
   */
  public abstract isEnabled(action: IRoute, instance: IController): boolean;

  /**
   * Called before action in middleware stack eg. to modify req or resp objects.
   */
  public abstract onBeforeAction(req: express.Request): Promise<void>;

  /**
   * Called after action in middleware stack eg. to modify response
   */
  public abstract onAfterAction(req: express.Request): Promise<void>;
}

/**
 * Descriptor for policies eg. attached routes, passed options eg. token etc.
 */
export interface IPolicyDescriptor {
  Type: Constructor<BasePolicy>;

  Options: any[];
}

/**
 * Base class for policies.
 *
 * Policies checks if route can be executed eg. user have proper role
 */
export abstract class BasePolicy {
  /**
   * Checks if policy is enabled for given action & controlle eg. user session exists
   *
   * @param action action that is executed ( route info )
   * @param instance controller instance
   */
  public abstract isEnabled(action: IRoute, instance: IController): boolean;

  /**
   *
   * Executes policy, when throws exception - route is not executed
   *
   * @param req express request object
   */
  public abstract execute(req: express.Request, action: IRoute, instance: IController): Promise<void>;
}

/**
 * Descriptor for controller
 */
export interface IControllerDescriptor {
  /**
   * Controller routes
   */
  Routes: Map<string | symbol, IRoute>;

  /**
   * Controller - wise middlewares
   */
  Middlewares: IMiddlewareDescriptor[];

  /**
   * Controller - wise policies
   */
  Policies: IPolicyDescriptor[];

  /**
   * Base url path for controller ( added for all child url's)
   */
  BasePath: string;
}

/**
 * Base class for data transformers.
 * 
 * Data formatter helps transforms data for desired format. 
 * Eg. we have API function that returns some data, but we want
 * to easily transform data for some client
 * eg. plain array to format that datatables.net can easily read
 */
export abstract class DataTransformer<T, U> {

  /**
   * Transforms data from one format to another
   * 
   * @param data input data
   */
  public abstract transform(data: T, request: express.Request): U

  public abstract get Type() : string;
}

export type RouteCallback = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => (req: express.Request, res: express.Response) => void;
