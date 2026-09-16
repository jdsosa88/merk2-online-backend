import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  ProductVisualOption,
  ProductVisualOptionSchema,
} from './product-visual-option.schema';

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

  @Prop({ type: String, required: true, trim: true, minlength: 2, maxlength: 150 })
  name: string;

  @Prop({ type: String, trim: true, maxlength: 250, default: '' })
  description?: string;

  @Prop({
    type: String,
    required: true,
    enum: [ProductType.SIMPLE, ProductType.ADDON],
    default: ProductType.SIMPLE
  })
  type: ProductType;

  @Prop({ type: String, trim: true, maxlength: 50, default: '' })
  brand?: string;

  /**
   * Free-form search tags (e.g. "vestido azul flores blancas", "estampado rojo").
   * Stored lowercase/trimmed for case-insensitive matching.
   */
  @Prop({
    type: [String],
    default: [],
    validate: {
      validator: (tags: string[]) =>
        Array.isArray(tags) &&
        tags.length <= 30 &&
        tags.every((t) => typeof t === 'string' && t.length > 0 && t.length <= 80),
      message: 'tags must be at most 30 strings of 1–80 characters',
    },
  })
  tags: string[];

  @Prop({ type: Number, required: true, min: 0 })
  price: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Image' }], default: [] })
  images: Types.ObjectId[];

  @Prop({ type: Number, min: 0, default: 0 })
  discountValue?: number;

  @Prop({ type: Number, min: 0, max: 100, default: 0 })
  discountPercent?: number;

  @Prop({
    type: Number,
    min: 0,
    default: function () {
      const basePrice = this.price || 0;
      const discountVal = this.discountValue || 0;
      const discountPerc = this.discountPercent || 0;
      const discountFromPercent = Math.round((basePrice * discountPerc) / 100);
      const totalDiscount = discountVal + discountFromPercent;
      return Math.max(0, basePrice - totalDiscount);
    }
  })
  finalPrice: number;

  @Prop({ type: String, trim: true, maxlength: 100 })
  warranty?: string;

  @Prop({ type: String, trim: true, maxlength: 50 })
  size?: string;

  @Prop({ type: [String], enum: Object.values(ProductColor), default: [] })
  colors: ProductColor[];

  @Prop({ type: String, trim: true, maxlength: 50 })
  weight?: string;

  /**
   * Peso influenciador para cálculo de mensajería (ej. 0.1 ligero, 2.5 pesado).
   * Se multiplica por cantidad en el carrito.
   */
  @Prop({ type: Number, min: 0.1, default: 0.1 })
  influenceWeight: number;

  @Prop({ type: Number, min: 0, default: 0 })
  stock: number;

  @Prop({ type: Boolean, default: true })
  isAvailable: boolean;

  @Prop({ type: Boolean, default: false })
  requiresElaboration: boolean;

  @Prop({ type: Boolean, default: false })
  isReservable: boolean;

  /**
   * When true, product detail may expose visual options and enabled store variety types.
   * Quick add from listing can still omit selectedOptions (baker's choice).
   */
  @Prop({ type: Boolean, default: false })
  hasVarieties: boolean;

  /**
   * When true, customer can see plate composition addons and adjust released ones.
   * Composition lives in `addons[]` (each base qty = 1).
   */
  @Prop({ type: Boolean, default: false })
  hasAddons: boolean;

  /**
   * For type=addon: when true, customer may increase quantity above the plate base (1).
   */
  @Prop({ type: Boolean, default: false })
  isReleased: boolean;

  /** Selectable visual gallery options (system Visual type). */
  @Prop({ type: [ProductVisualOptionSchema], default: [] })
  visualOptions: ProductVisualOption[];

  /** Store variety type ids enabled for this product (custom types like Flavor). */
  @Prop({ type: [{ type: Types.ObjectId }], default: [] })
  enabledVarietyTypeIds: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Product' }], default: [] })
  addons: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'Product', required: false })
  parentProduct?: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true, trim: true, uppercase: true })
  sku: string;

  @Prop({ type: Types.ObjectId, ref: 'Store', required: true })
  store: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
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

ProductSchema.index({ store: 1, tags: 1 });
ProductSchema.index({ tags: 'text', name: 'text', description: 'text', brand: 'text', sku: 'text' });

/** Serialize Image refs as `{ _id, blurhash? }` when populated, else plain id string. */
function serializeImageRef(image: any): string | { _id: string; blurhash?: string } {
  if (!image) return String(image);
  if (typeof image === 'string') return image;
  if (image._bsontype === 'ObjectId') return image.toString();

  const id = image._id?.toString?.() || (typeof image === 'object' ? null : String(image));
  if (!id) return String(image);

  // Populated Image document (has blurhash and/or mimeType/filename).
  if (image.blurhash != null || image.mimeType != null || image.filename != null || image.url != null) {
    return image.blurhash
      ? { _id: id, blurhash: image.blurhash }
      : { _id: id };
  }

  return id;
}

ProductSchema.methods.toJSON = function () {
  const obj = this.toObject();

  obj.price = this.price / 100;
  obj.discountValue = this.discountValue ? this.discountValue / 100 : 0;
  obj.finalPrice = this.finalPrice / 100;

  obj.images = (obj.images || []).map(serializeImageRef);

  if (Array.isArray(obj.visualOptions)) {
    obj.visualOptions = obj.visualOptions.map((option: any) => ({
      ...option,
      priceDelta: (option.priceDelta ?? 0) / 100,
      image: option.image ? serializeImageRef(option.image) : undefined,
    }));
  }

  // Populated addons come as plain objects; convert money + image refs like the parent product.
  if (Array.isArray(obj.addons)) {
    obj.addons = obj.addons.map((addon: any) => {
      if (!addon || typeof addon === 'string' || addon._bsontype === 'ObjectId') {
        return addon;
      }
      return {
        ...addon,
        _id: addon._id?.toString?.() || addon._id,
        price: typeof addon.price === 'number' ? addon.price / 100 : addon.price,
        finalPrice:
          typeof addon.finalPrice === 'number' ? addon.finalPrice / 100 : addon.finalPrice,
        images: (addon.images || []).map(serializeImageRef),
      };
    });
  }

  return obj;
};

ProductSchema.pre('save', function (next) {
  const basePrice = this.price || 0;
  const discountVal = this.discountValue || 0;

  this.finalPrice = Math.max(0, basePrice - discountVal);
  next();
});
