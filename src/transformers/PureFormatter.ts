import { DataTransformer } from "../interfaces";
import { Singleton } from "@spinajs/di";

/**
 * Default transformer that does nothing. Output data is exacly same as input.
 */
@Singleton()
export class PureDataTransformer<T> extends DataTransformer<T,T> {
    public transform(data: T, request: Express.Request) : T {
        return data;
    }
}