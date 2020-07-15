import { Schema } from '../decorators';

export const OrderDtoSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Order DTO',
  type: 'object',
  properties: [{ Column: { type: 'string', minLength: 0 } }, { Order: { type: 'string', enum: ['asc', 'dsc'] } }],
  required: ['Column', 'Order'],
};

/**
 * Order dto for queries
 */
@Schema(OrderDtoSchema)
export class OrderDto {
  /**
   * Column to sort
   */
  public Column: string;

  /**
   * Order - asc / desc
   */
  public Order: string;
}
