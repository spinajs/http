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
chai.use(chaiHttp);


function req() {
    return chai.request("http://localhost:8888/");
}

class TestConfiguration extends FrameworkConfiguration {
    protected CONFIG_DIRS: string[] = [
        // project path
        normalize(join(resolve(__dirname), "./config")),
    ];
}

function ctr(){
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

    it("should load controllers from dir", async ()=>{
        const controllers = await ctr().Controllers;
        expect(controllers.length).to.eq(2);
    });

    it("should server static files", async ()=>{
        const response = await req().get("static/index.html");
        expect(response).to.have.status(200);
    });

    it("non existing static file should return 404", async ()=>{
        const response = await req().get("static/non-exists.html");
        expect(response).to.have.status(404);
    });

    it("should add routes", async ()=>{
        let response = await req().get("test2/testGet");
        expect(response).to.have.status(200);
    });

    it("should add routes with base path", ()=>{

    });

    it("middleware should run on controller", ()=>{

    });

    it("middleware should run on specific path", ()=>{

    });

    it("policy should run on controller", ()=>{

    });

    it("policy should run on specific path", ()=>{

    });

    it("html response should work", ()=>{

    });

    it("json response should work", ()=>{

    });

    it("response method should work", ()=>{

    });

    it("error handling should work", ()=>{

    });

    it("controller view should work", ()=>{

    });

    it("intl in view should work", ()=>{

    });
});
