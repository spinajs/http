import { BaseController, BasePath, Get, Ok, Param } from "../../src";
 
@BasePath("sample-datetime/v1")
export class TestDateTime extends BaseController {

    @Get()
    public testDateFromParam(@Param() from : DateTime, @Param() to : DateTime) {
        return new Ok({ hello: "world" });
    }

    @Post()
    public testFromBody(@Body() from : DateTime, @Body() to : DateTime) {
        return new Ok({ hello: "world" });
    }

    @Get()
    public testFromQuery(@Query() from : DateTime, @Query() to : DateTime) {
        return new Ok({ hello: "world" });
    }
}