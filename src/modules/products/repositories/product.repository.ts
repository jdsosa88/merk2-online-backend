import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../schemas/product.schema';

export interface ProductRepository {
  deleteManyByIds(ids: Types.ObjectId[]): Promise<number>;
  findProductsByBusinessAndCategory(businessId: Types.ObjectId, categoryIds: Types.ObjectId[]): Promise<Types.ObjectId[]>;
}

@Injectable()
export class ProductMongoRepository implements ProductRepository {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async deleteManyByIds(ids: Types.ObjectId[]): Promise<number> {
    const result = await this.productModel.deleteMany({ _id: { $in: ids } });
    return result.deletedCount;
  }

  async findProductsByBusinessAndCategory(businessId: Types.ObjectId, categoryIds: Types.ObjectId[]): Promise<Types.ObjectId[]> {
    const products = await this.productModel.find({
      business: businessId,
      category: { $in: categoryIds }
    }).select('_id').lean();
    
    return products.map(p => p._id);
  }
}