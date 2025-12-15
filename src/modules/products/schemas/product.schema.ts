import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Business } from '../../business/schemas/business.schema';

export type ProductDocument = HydratedDocument<Product>;

export type ProductType = 'simple' | 'composite' | 'service';
export enum ProductTypes {
  SIMPLE = 'simple',
  COMPOSITE = 'composite',
  SERVICE = 'service',  
}
@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ enum: [ProductTypes.SIMPLE, ProductTypes.COMPOSITE, ProductTypes.SERVICE] })
  type: ProductType;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Product' }] })
  components: Product[];

  @Prop({ type: Types.ObjectId, ref: 'Business', required: true })
  business: Business;

  @Prop()
  price: number;

  @Prop()
  category: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);