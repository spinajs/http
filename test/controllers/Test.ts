import { PugResponse } from './../../src';
import { ServerError } from './../../src';
import { BaseController, BasePath, Get, Post, Head, Patch, Del, Put, File, Ok } from "../../src";


@BasePath("sample-controller/v1")
export class Test extends BaseController {

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

    @File()
    public testFile() {
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
}