import { Schema } from "../decorators";

export const LimitDtoSchema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "Limit DTO",
    type: "object",
    properties: [
        { Page: { type: "number", minimum: 0 } },
        { PerPage: { type: "number", minimum: 1 } },
    ],
    required: ["PerPage", "Page"]
}

/**
 * Limit dto for queries
 */
@Schema(LimitDtoSchema)
export class LimitDto {
    
    /**
     * Page to get
     */
    public Page: number;

    /**
     * How much to take. min is 1
     */
    public PerPage: number;
}

