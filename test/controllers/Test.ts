import { IUploadedFile } from './../../src/interfaces';
import { PugResponse, Query, Body, Param, Form, File, FileResponse } from './../../src';
import { ServerError } from './../../src';
import { BaseController, BasePath, Get, Post, Head, Patch, Del, Put, Ok } from "../../src";
import { join, normalize, resolve } from 'path';
import { Inject } from '@spinajs/di';
import { SomeService } from '../service/SomeService';

@BasePath("sample-controller/v1")
export class Test extends BaseController {
    public static QueryParams: any;
    public static BodyBarams: any;
    public static ParamsParams: any;

    public static ParamsMultiForm: any;
    public static ParamsForm: any;
    public static ParamsFile: IUploadedFile;
    public static SomeService : SomeService;


    @Get()
    public testGet() {
        return new Ok({ hello: "world" });
    }

    @Post()
    public testPost() {
        return new Ok();
    }

    @Head()
    public testHead() {
        return new Ok();
    }

    @Patch()
    public testPatch() {
        return new Ok();
    }


    @Del()
    public testDel() {
        return new Ok();
    }

    @Put()
    public testPut() {
        return new Ok();
    }

    @Get()
    public testError() {
        return new ServerError({ error: true, message: "sample error message" });
    }

    @Get()
    public testViewResponse() {
        return new PugResponse("test-view.pug", { sampleText: "hello world" });
    }

    @Get()
    public testViewIntl() {
        return new PugResponse("test-view-intl.pug", { sampleText: "witaj świecie" });
    }



    @Get()
    public testQueryParam(@Query() first: string, @Query() second: string) {

        Test.QueryParams = {
            first,
            second
        };

        return new Ok();
    }

    @Post()
    public testPostParam(@Body() first: string, @Body() second: string) {

        Test.BodyBarams = {
            first,
            second
        };

        return new Ok();
    }

    @Get("testParamsParams/:id")
    public testParamsParams(@Param() id: number) {

        Test.ParamsParams = {
            id
        };

        return new Ok({
            id
        });
    }

    @Post()
    public testForm(@Form() contact: any) {
        Test.ParamsForm = contact;
        return new Ok();
    }

    @Post()
    public testMultipartForm(@Form() contact: any, @File({}) index: IUploadedFile) {

        Test.ParamsMultiForm = contact;
        Test.ParamsFile = index;

        return new Ok();
    }

    @Get()
    public testFileResponse() {
        return new FileResponse(normalize(join(resolve(__dirname), "./../public/index.html")), "index.html");
    }

    @Get()
    public testValidation(@Query({
        type: "integer"
    }) id: number) {
        return new Ok({
            id
        });
    }

    @Get()
    public testInject(@Inject() someService : SomeService)
    {
        this.SomeService = someService;

        return new Ok();
    }

    @Post()
    public testValidation2(@Body({
        type: "object",
        properties: {
            id: { type: "number" }
        },
        required: ["id"]
    }) data: any) {
        return new Ok({
            data
        });
    }
}