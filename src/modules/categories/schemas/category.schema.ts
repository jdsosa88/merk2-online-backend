import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;


@Schema({ timestamps: true })
export class Category {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true, trim: true, minlength: 2, maxlength: 100 })
  name: string;

  @Prop({ 
    type: [{ type: Types.ObjectId, ref: 'Category' }],
    default: []
  })
  subcategories: Types.ObjectId[];

  @Prop({ 
    type: [{ type: Types.ObjectId, ref: 'Category' }],
    default: []
  })
  parents: Types.ObjectId[];

  // Propiedades adicionales útiles
  @Prop({ type: Number, default: 0 })
  level: number; // Nivel en la jerarquía (0 para raíz)

  @Prop({ type: Boolean, default: false })
  isRoot: boolean; // Si es una categoría raíz

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: String, trim: true })
  description?: string;

  @Prop({ type: String, trim: true })
  icon?: string;

  @Prop({ type: String, trim: true })
  color?: string;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

