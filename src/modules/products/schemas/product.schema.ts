import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Image } from 'src/common/schemas/image.schema';

export type ProductDocument = HydratedDocument<Product>;

export enum ProductType {
  SIMPLE = 'simple',
  ADDON = 'addon',
}

export enum ProductColor {
  RED = 'red',
  GREEN = 'green',
  BLUE = 'blue',
  YELLOW = 'yellow',
  BLACK = 'black',
  WHITE = 'white',
  GRAY = 'gray',
  OTHER = 'other',
}

@Schema({ timestamps: true, discriminatorKey: 'type' })
export class Product {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ 
    type: String, 
    required: true, 
    trim: true, 
    minlength: 2, 
    maxlength: 150 
  })
  name: string;

  @Prop({ 
    type: String, 
    trim: true, 
    maxlength: 250,
    default: ''
  })
  description?: string;

  @Prop({
    type: String,
    required: true,
    enum: [ProductType.SIMPLE, ProductType.ADDON],
    default: ProductType.SIMPLE
  })
  type: ProductType;

  @Prop({ 
    type: String, 
    trim: true, 
    maxlength: 50,
    default: ''
  })
  brand?: string;

  @Prop({ 
    type: Number, 
    required: true,
    min: 0
  })
  price: number;

  @Prop({ 
    type: [Image], 
    default: []
  })
  images: Image[];

  @Prop({ 
    type: Number, 
    min: 0,
    default: 0
  })
  discountValue?: number;

  @Prop({ 
    type: Number, 
    min: 0,
    max: 100,
    default: 0
  })
  discountPercent?: number;

  @Prop({ 
    type: Number, 
    min: 0,
    default: function() {
      const basePrice = this.price || 0;
      const discountVal = this.discountValue || 0;
      const discountPerc = this.discountPercent || 0;
      const discountFromPercent = Math.round((basePrice * discountPerc) / 100);
      const totalDiscount = discountVal + discountFromPercent;
      return Math.max(0, basePrice - totalDiscount);
    }
  })
  finalPrice: number;

  @Prop({ 
    type: String, 
    trim: true,
    maxlength: 100
  })
  warranty?: string;

  @Prop({ 
    type: String, 
    trim: true,
    maxlength: 50
  })
  size?: string;

  @Prop({ 
    type: [String], 
    enum: Object.values(ProductColor),
    default: []
  })
  colors: ProductColor[];

  @Prop({ 
    type: String, 
    trim: true,
    maxlength: 50
  })
  weight?: string;

  @Prop({ 
    type: Number, 
    min: 0,
    default: 0
  })
  stock: number;

  @Prop({ 
    type: Boolean, 
    default: true 
  })
  isAvailable: boolean;

  @Prop({ 
    type: [{ type: Types.ObjectId, ref: 'Product' }],
    default: []
  })
  addons: Types.ObjectId[]; 

  @Prop({ 
    type: Types.ObjectId, 
    ref: 'Product',
    required: false
  })
  parentProduct?: Types.ObjectId;

  @Prop({ 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    uppercase: true
  })
  sku: string;

  @Prop({ 
    type: Types.ObjectId, 
    ref: 'Business', 
    required: true 
  })
  business: Types.ObjectId;

  @Prop({ 
    type: Types.ObjectId, 
    ref: 'Category', 
    required: true 
  })
  category: Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  timesOrdered: number;

  @Prop({ type: Number, default: 0 })
  averageRating: number;

  @Prop({ type: Number, default: 0 })
  totalReviews: number;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Helper para convertir centavos a decimales en las respuestas
ProductSchema.methods.toJSON = function() {
  const obj = this.toObject();
  
  obj.price = this.price / 100;
  obj.discountValue = this.discountValue ? this.discountValue / 100 : 0;
  obj.finalPrice = this.finalPrice / 100;
  
  return obj;
};

// Pre-save hook para calcular finalPrice en centavos
ProductSchema.pre('save', function(next) {
  const basePrice = this.price || 0;
  const discountVal = this.discountValue || 0;
    
  this.finalPrice = Math.max(0, basePrice - discountVal);
  next();
});