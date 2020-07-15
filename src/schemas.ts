import { AsyncModule, IContainer } from "@spinajs/di";
import * as AJV from "ajv";
import { Configuration } from "@spinajs/configuration";
import * as fs from 'fs';
import * as glob from 'glob';
import * as path from 'path';
import { Logger, Log } from "@spinajs/log";

export interface IValidatorResult {
    valid: boolean;
    errors?: AJV.ErrorObject[]
};

export class DataValidator extends AsyncModule {
    protected Validator: AJV.Ajv;

    protected Schemas: any[];

    protected Configuration: Configuration;

    protected Container: IContainer;

    @Logger()
    protected Log: Log;

    public async resolveAsync(container: IContainer): Promise<void> {

        this.Container = container;
        this.Validator = new AJV.default();
        this.Configuration = await container.resolve(Configuration);

        // add $merge & $patch for json schema
        require("ajv-merge-patch")(this.Validator);

        this.Configuration.get<string[]>("system.dirs.schemas", [])
            .filter(dir => fs.existsSync(dir))
            .flatMap((d: string) => glob.sync(path.join(d, "*.json")))
            .map(f => {
                return {
                    schema: require(f),
                    file: path.basename(f)
                };
            })
            .filter(s => {
                const isValid = this.Validator.validateSchema(s.schema);

                if (!isValid) {
                    this.Log.warn(`Schema is not valid %s`, s.file);
                    return false;
                }

                return true;
            })
            .forEach(s => {
                const schemaId = s.schema.$id ?? path.basename(s.file);
                this.Log.trace(`Added schema ${schemaId}`);
                this.Validator.addSchema(s.schema, schemaId);
            });
    }

    /**
     * Validate data using schema
     * Schema will be compiled and cached (using serialized JSON as key, [fast-json-stable-stringify](https://github.com/epoberezkin/fast-json-stable-stringify) is used to serialize by default).
     * @param  {string|object|Boolean} schemaKeyRef key, ref or schema object
     * @param  {Any} data to be validated
     * @return {Boolean} validation result. Errors from the last validation will be available in `ajv.errors` (and also in compiled schema: `schema.errors`).
     */
    public validate(schemaKeyRef: object | string | boolean, data: any): IValidatorResult {
        const result = this.Validator.validate(schemaKeyRef, data);
        if (!result) {
            return {
                valid: false,
                errors: { ...this.Validator.errors }
            }
        }

        return {
            valid: true
        }
    }
}