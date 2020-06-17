import { SamplePolicy } from './policies/SamplePolicy';
import { SampleMiddleware } from './middlewares/SampleMiddleware';
import 'mocha';

import { expect } from 'chai';
import { join, normalize, resolve } from 'path';
import { DI } from '@spinajs/di';
import { Configuration, FrameworkConfiguration } from "@spinajs/configuration";
import chai from 'chai';
import chaiHttp from 'chai-http';
import { SpinaJsDefaultLog, LogModule } from '@spinajs/log';
import { Controllers, HttpServer } from '../src';
import { Intl } from "@spinajs/intl";
import sinon from 'sinon';
import chaiAsPromised from 'chai-as-promised';
import { SampleMiddleware2 } from './middlewares/SampleMiddleware2';
import { SamplePolicy2 } from './policies/SamplePolicy2';

chai.use(chaiHttp);
chai.use(chaiAsPromised);


function req() {
    return chai.request("http://localhost:8888/");
}

class TestConfiguration extends FrameworkConfiguration {
    protected CONFIG_DIRS: string[] = [
        // project path
        normalize(join(resolve(__dirname), "./config")),
    ];
}

function ctr() {
    return DI.get(Controllers);
}



describe("http & controller tests", () => {

    before(async () => {
        DI.register(TestConfiguration).as(Configuration);
        DI.register(SpinaJsDefaultLog).as(LogModule);

        await DI.resolve(LogModule);
        await DI.resolve(Intl);
        await DI.resolve<Controllers>(Controllers);
        const server = await DI.resolve<HttpServer>(HttpServer);

        server.start();
    });

    afterEach(() => {
        sinon.restore();
    });

    it("should load controllers from dir", async () => {
        const controllers = await ctr().Controllers;
        expect(controllers.length).to.eq(6);
    });

    it("should server static files", async () => {
        const response = await req().get("static/index.html");
        expect(response).to.have.status(200);
    });

    it("non existing static file should return 404", async () => {
        const response = await req().get("static/non-exists.html");
        expect(response).to.have.status(404);
    });

    it("should add routes", async () => {
        let response = await req().get("test2/testGet");
        expect(response).to.have.status(200);

        response = await req().post("test2/testPost");
        expect(response).to.have.status(200);

        response = await req().head("test2/testHead");
        expect(response).to.have.status(200);

        response = await req().patch("test2/testPatch");
        expect(response).to.have.status(200);

        response = await req().del("test2/testDel");
        expect(response).to.have.status(200);

        response = await req().get("test2/testFile");
        expect(response).to.have.status(200);

        response = await req().put("test2/testPut");
        expect(response).to.have.status(200);
    });

    it("should add routes with base path", async () => {
        let response = await req().get("sample-controller/v1/testGet");
        expect(response).to.have.status(200);

        response = await req().post("sample-controller/v1/testPost");
        expect(response).to.have.status(200);

        response = await req().head("sample-controller/v1/testHead");
        expect(response).to.have.status(200);

        response = await req().patch("sample-controller/v1/testPatch");
        expect(response).to.have.status(200);

        response = await req().del("sample-controller/v1/testDel");
        expect(response).to.have.status(200);

        response = await req().get("sample-controller/v1/testFile");
        expect(response).to.have.status(200);

        response = await req().put("sample-controller/v1/testPut");
        expect(response).to.have.status(200);
    });

    it("middleware should run on controller", async () => {
        const response = await req().get("testmiddleware/testGet");
        expect(response).to.have.status(200);

        expect(SampleMiddleware.CalledAfter).to.be.true;
        expect(SampleMiddleware.CalledBefore).to.be.true;
    });

    it("middleware should run on specific path", async () => {


        let response = await req().get("testmiddlewarepath/testGet2");
        expect(response).to.have.status(200);
        expect(SampleMiddleware2.CalledAfter).to.be.false;
        expect(SampleMiddleware2.CalledBefore).to.be.false;

        response = await req().get("testmiddlewarepath/testGet");
        expect(response).to.have.status(200);

        expect(SampleMiddleware2.CalledAfter).to.be.true;
        expect(SampleMiddleware2.CalledBefore).to.be.true;

    });

    it("policy should run on controller", async () => {
        const response = await req().get("testpolicy/testGet");
        expect(response).to.have.status(200);
        expect(SamplePolicy.Called).to.be.true;
    });

    it("policy should run on specific path", async () => {

        let response = await req().get("testpolicy2/testGet2");
        expect(response).to.have.status(200);
        expect(SamplePolicy2.Called).to.be.false;

        response = await req().get("testpolicy2/testGet");
        expect(response).to.have.status(403);

        expect(SamplePolicy2.Called).to.be.true;
    });

    it("html response should work", async () => {
        const response = await req().get("sample-controller/v1/testGet").set("Accept", "text/html").send();
        expect(response).to.have.status(200);
        expect(response).to.be.html;
        expect(response.text).to.eq('<html><head><link rel="icon" type="image/x-icon" href="/responses/favicon.png"/><title> All ok</title><link href="/responses/style.css" rel="stylesheet"/></head><body>   <div class="container"><div class="item"><div class="entry"><h1>200 - All ok</h1></div></div></div></body></html>');
    });

    it("json response should work", async () => {
        const response = await req().get("sample-controller/v1/testGet").set("Accept", "application/json").send();
        expect(response).to.have.status(200);
        expect(response).to.be.json;
        expect(response.body).to.be.not.null;
        expect(response.body).to.include({
            hello: "world"
        });
    });

    it("plain response should work", async () => {
        const response = await req().get("sample-controller/v1/testGet").set("Accept", "text/plain").send();
        expect(response).to.have.status(200);
        expect(response).to.be.text;
        expect(response.text).to.eq('{"hello":"world"}');
    });


    it("error handling should work", async () => {
        const response = await req().get("sample-controller/v1/testError");
        expect(response).to.have.status(500);
        expect(response.text).to.eq('<html><head><link rel="icon" type="image/x-icon" href="/responses/favicon.ico"/><title> Server error</title><link href="/responses/style.css" rel="stylesheet"/></head><body>   <div class="container"><div class="item"><div class="entry"><h1>500 - Server error</h1><div>sample error message</div></div></div></div></body></html>');
    });

    it("controller view should work", async () => {
        const response = await req().get("sample-controller/v1/testViewResponse");
        expect(response).to.have.status(200);
        expect(response.text).to.eq('<html><head><title> Sample view</title></head><body>   <p>sample view</p><p>hello world</p></body></html>');
    });

    it("intl in view should work", async () => {
        let response = await req().get("sample-controller/v1/testViewIntl").query({lang: "pl"});
        expect(response).to.have.status(200);
        expect(response.text).to.eq('<html><head><title> Sample view</title></head><body>   <p>sample view</p><p>witaj świecie</p></body></html>');

        response = await req().get("sample-controller/v1/testViewIntl").query({lang: "en"});
        expect(response).to.have.status(200);
        expect(response.text).to.eq('<html><head><title> Sample view</title></head><body>   <p>sample view</p><p>hello world</p></body></html>');

        response = await req().get("sample-controller/v1/testViewIntl");
        expect(response).to.have.status(200);
        expect(response.text).to.eq('<html><head><title> Sample view</title></head><body>   <p>sample view</p><p>witaj świecie</p></body></html>');
    });
});
