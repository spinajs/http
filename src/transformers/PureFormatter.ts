import { DataTransformer } from "../interfaces";
import { Singleton } from "@spinajs/di";

/**
 * Default transformer that does nothing. Output data is exacly same as input.
 */
@Singleton()
export class PureDataTransformer extends DataTransformer {
    public format(data: any) {
        return data;
    }
}