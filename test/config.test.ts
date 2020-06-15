import 'mocha';

import { expect } from 'chai';
import { join, normalize, resolve } from 'path';

import { DI } from '@spinajs/di';
import { Configuration, FrameworkConfiguration } from "@spinajs/configuration";
import { CliModule } from "../src/index";

function cli() {
    return DI.resolve<CliModule>(Configuration);
}

class TestConfiguration extends FrameworkConfiguration {
    protected CONFIG_DIRS: string[] = [
        // project path
        normalize(join(resolve(__dirname), "/mocks/config")),
    ];
}

describe("Cli tests", () => {

    beforeEach(() => {
        DI.clear();
        DI.register(TestConfiguration).as(Configuration);
    });

    it("Should load commands", async () => {
        const config = await cfgNoApp();
        const test = config.get(["test", "value2"]);
        expect(test).to.be.eq(666);
    });


    it("Should resolve commands", async () => {
        const config = await cfgNoApp();
        const test = config.get(["app", "appLoaded"]);
        expect(test).to.be.undefined;
    });


    it("Should run command", async () => {
        const config = await cfg();
        const test = config.get(["test"]);
        const json = config.get(["jsonentry"]);

        expect(test).to.not.be.undefined;
        expect(json).to.be.true;
    });

    it("Should run command with options", async () => {
        const config = await cfg();
        const test = config.get(["test"]);
        const json = config.get(["jsonentry"]);

        expect(test).to.not.be.undefined;
        expect(json).to.be.true;
    });


});
