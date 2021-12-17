import { DateTime } from "luxon";
import { ArgHydrator, ArgumentHydrator, BaseController, BasePath, Body, Form, Uuid, FormField, Get, File, Header, IUploadedFile, Ok, Param, Post, Query, Schema, PKey, Cookie, JsonFile, CsvFile } from "../../src";

interface SampleObject {
    id: number;
    name: string;
}

export class SampleModel {
    public id: number;
    public name: string;
    public args: number[];

    constructor(data: any) {
        Object.assign(this, data);
    }
}

@Schema({
    type: "object",
    properties: {
        id: { type: "number" },
        name: { type: "string" },
        args: { type: "array", items: { type: "number" } }
    },
    required: ["id", "name", "args"]
})
export class SampleModelWithSchema {
    public id: number;
    public name: string;
    public args: number[];

    constructor(data: any) {
        Object.assign(this, data);
    }
}

@Schema()
export class SampleModelWithGeneratedSchema {
    public id: number;
    public name: string;
    public args: number[];

    constructor(data: any) {
        Object.assign(this, data);
    }
}

export class ModelArgHydrator extends ArgHydrator {
    public async hydrate(input: any): Promise<any> {
        return new SampleModelWithHydrator(input);
    }
}

@ArgumentHydrator(ModelArgHydrator)
export class SampleModelWithHydrator {
    public id: number;
    public name: string;
    public args: number[];

    constructor(data: any) {
        Object.assign(this, data);
    }
}

@BasePath("params/v1")
export class Params extends BaseController {

    @Get()
    public query(@Query() a: string, @Query() b: boolean, @Query() c: number) {
        return new Ok({ a, b, c });
    }

    @Get()
    public queryObject(@Query() a: SampleObject) {
        return new Ok({ a });
    }

    @Get()
    public queryModel(@Query() a: SampleModel) {
        return new Ok({ a });
    }

    @Get()
    public queryModelWithHydrator(@Query() a: SampleModelWithHydrator) {
        return new Ok({ a });
    }

    @Get()
    public headerParamObject(@Header("x-custom-header") _val: SampleObject) {
        return new Ok();
    }

    @Get()
    public headerParamModel(@Header("x-custom-header") _val: SampleModel) {
        return new Ok();
    }

    @Get()
    public headerParamModelWithHydrator(@Header("x-custom-header") _val: SampleModelWithHydrator) {
        return new Ok();
    }

    @Get()
    public headerParamNoName(@Header() customHeaderName: string) {
        return new Ok({ customHeaderName });
    }

    @Get()
    public headerParam(@Header("x-custom-header") _val: string) {
        return new Ok();
    }

    @Get("/:id")
    public param(@Param() id: number) {
        return new Ok({ id });
    }

    @Get("/:id")
    public paramWithHydrator(@Param() model: SampleModelWithHydrator) {
        return new Ok({ model });
    }


    @Get("/:id/:id2")
    public multipleParam(@Param() id: number, @Param() id2: string) {
        return new Ok({ id, id2 });
    }

    @Post()
    public body(@Body() id: number) {
        return new Ok({ id });
    }

    @Post()
    public bodyObject(@Body() object: SampleObject) {
        return new Ok({ object });
    }

    @Post()
    public multipleBodyObjects(@Body() object1: SampleObject, @Body() object2: SampleObject) {
        return new Ok({ object1, object2 });
    }

    @Post()
    public bodyModel(@Body() object1: SampleModel) {
        return new Ok({ object1 });
    }

    @Post()
    public multipleBodyModel(@Body() object1: SampleModel, @Body() object2: SampleModel) {
        return new Ok({ object1, object2 });
    }

    @Post()
    public bodyArray(@Body() objects: SampleModel[]) {
        return new Ok({ objects });
    }

    @Post()
    public bodyModelWithHydrator(@Body() object: SampleModelWithHydrator) {
        return new Ok({ object });
    }

    @Post()
    public formField(@FormField() name: string) {
        return new Ok({ name });
    }

    @Post()
    public multipleFormField(@FormField() name: string, @FormField() name2: string) {
        return new Ok({ name, name2 });
    }

    @Post()
    public formObject(@Form() model: SampleObject) {
        return new Ok({ model });
    }

    @Post()
    public formModel(@Form() model: SampleModel) {
        return new Ok({ model });
    }

    @Post()
    public formModelWithHydrator(@Form() model: SampleModelWithHydrator) {
        return new Ok({ model });
    }

    @Post("/:id")
    public mixedArgs(@Body() model: SampleModel, @Param() id: number, @Header("x-header") header: string, @Query() queryString: string) {
        return new Ok({ model, id, header, queryString })
    }

    @Post()
    public formWithFile(@Form() _contact: any, @File() _index: IUploadedFile) {
        return new Ok();
    }

    @Post()
    public fileArray(@File() _files: IUploadedFile[]) {
        return new Ok();
    }

    @Post()
    public objectWithCustomSchema(@Body({
        type: "object",
        properties: {
            id: { type: "number" },
            name: { type: "string" },
            args: { type: "array", items: { type: "number" } }
        },
        required: ["id", "name", "args"]
    }) model: SampleModel) {

        return new Ok({ model });
    }

    @Post()
    public objectWithSchema(@Body() model: SampleModelWithSchema) {
        return new Ok({ model })
    }

    @Post()
    public objectWithGeneratedSchema(@Body() model: SampleModelWithGeneratedSchema) {
        return new Ok({ model })
    }

    @Get()
    public date(@Query() date: DateTime) {
        return new Ok({ date })
    }

    @Get()
    public uuid(@Uuid() id: string) {
        return new Ok({ id })
    }

    @Get("/:id")
    public pkey(@PKey() id: number) {
        return new Ok({ id })
    }

    @Get()
    public cockie(@Cookie() name: string) {
        return new Ok({ name })
    }


    @Post()
    public objectsFromJsonFile(@JsonFile() objects: SampleObject) {
        return new Ok({ objects })
    }

    @Post()
    public modelsFromJsonFile(@JsonFile() objects: SampleModel) {
        return new Ok({ objects })
    }

    @Post()
    public modelsFromJsonFileWithSchema(@JsonFile() objects: SampleModelWithSchema) {
        return new Ok({ objects })
    }

    @Post()
    public modelsFromJsonFileWithHydrator(@JsonFile() objects: SampleModelWithHydrator) {
        return new Ok({ objects })
    }

    @Post()
    public objectsFromCvs(@CsvFile() objects: SampleObject) {
        return new Ok({ objects })
    }

    @Post()
    public modelsFromCvs(@CsvFile() objects: SampleModel) {
        return new Ok({ objects });
    }

    @Post()
    public modelsFromCvsWithSchema(@CsvFile() objects: SampleModelWithSchema) {
        return new Ok({ objects })
    }

    @Post()
    public modelsFromCvsWithHydrator(@CsvFile() objects: SampleModelWithHydrator) {
        return new Ok({ objects })
    }
}


