import { BaseController, BasePath, Get, Ok, Param, Body, Query, Post } from "../../src";
import moment from "moment";
@BasePath("sample-datetime/v1")
export class TestDateTime extends BaseController {

    @Get()
    public testDateFromParam(@Param() _from : Date, @Param() _to : Date) {
        return new Ok({ hello: "world" });
    }

    @Post()
    public testFromBody(@Body() _from : Date, @Body() _to : Date) {
        return new Ok({ hello: "world" });
    }

    @Get()
    public testFromQuery(@Query() _from : Date, @Query() _to : Date) {
        return new Ok({ hello: "world" });
    }


    @Get()
    public testMomentFromParam(@Param() _from : moment.Moment, @Param() _to : moment.Moment) {
        return new Ok({ hello: "world" });
    }

    @Post()
    public testMomentBody(@Body() _from : moment.Moment, @Body() _to : moment.Moment) {
        return new Ok({ hello: "world" });
    }

    @Get()
    public testMomentQuery(@Query() _from : moment.Moment, @Query() _to : moment.Moment) {
        return new Ok({ hello: "world" });
    }
}