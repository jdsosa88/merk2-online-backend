import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument, ProductType } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { BusinessService } from '../business/business.service';
import { CategoriesService } from '../categories/categories.service';
import { PaginatedListDto } from 'src/common/dto/paginated-list.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private readonly businessService: BusinessService,
    private readonly categoriesService: CategoriesService,
  ) { }

  async create(createProductDto: CreateProductDto, userId: string): Promise<Product> {
    try {
      const existingProduct = await this.productModel.findOne({
        sku: createProductDto.sku.toUpperCase()
      });

      if (existingProduct) {
        throw new ConflictException(`Product with SKU "${createProductDto.sku}" already exists`);
      }

      const business = await this.businessService.findById(createProductDto.business);
      if (!business) {
        throw new BadRequestException('Business not found');
      }

      const isOwner = business.owner.toString() === userId;
      const isManager = business.employees?.managers
        ? business.employees.managers.filter(id => id.toString() === userId).length > 0
        : false;

      if (!isOwner && !isManager) {
        throw new UnauthorizedException('Only business owner or manager can create products.')
      }

      if (!business.categories.map(category => category.toString()).includes(createProductDto.category)) {
        new BadRequestException('Category not included in business');
      }

      const category = await this.categoriesService.findOne(createProductDto.category);
      if (!category) {
        throw new BadRequestException('Category not found');
      }



      if (createProductDto.type === ProductType.SIMPLE) {
        if (createProductDto.addons && createProductDto.addons.length > 0) {
          const addonProducts = await this.productModel.find({
            _id: { $in: createProductDto.addons },
            type: ProductType.ADDON
          });

          if (addonProducts.length !== createProductDto.addons.length) {
            throw new BadRequestException('One or more addons are invalid or not of type ADDON');
          }

          const alreadyAssigned = addonProducts.filter(addon =>
            addon.parentProduct && addon.parentProduct.toString() !== createProductDto.business
          );

          if (alreadyAssigned.length > 0) {
            throw new BadRequestException('One or more addons are already assigned to another product');
          }
        }
      } else if (createProductDto.type === ProductType.ADDON) {
        if (!createProductDto.parentProduct) {
          throw new BadRequestException('Addon product must have a parent product');
        }
        const parentProductId = new Types.ObjectId(createProductDto.parentProduct);
        const parentProduct = await this.productModel.findById(parentProductId);
        if (!parentProduct || parentProduct.type !== ProductType.SIMPLE) {
          throw new BadRequestException('Parent product not found or is not of type SIMPLE');
        }

        if (parentProduct.business.toString() !== createProductDto.business) {
          throw new BadRequestException('Addon must belong to the same business as parent product');
        }
      }

      const newProduct = new this.productModel({
        ...createProductDto,
        sku: createProductDto.sku.toUpperCase(),
        business: new Types.ObjectId(createProductDto.business),
        category: new Types.ObjectId(createProductDto.category),
        parentProduct: createProductDto.parentProduct
          ? new Types.ObjectId(createProductDto.parentProduct)
          : undefined,
        addons: createProductDto.addons
          ? createProductDto.addons.map(id => new Types.ObjectId(id))
          : [],
      });

      const savedProduct = await newProduct.save();

      if (savedProduct.type === ProductType.ADDON && savedProduct.parentProduct) {
        await this.productModel.findByIdAndUpdate(
          savedProduct.parentProduct,
          { $addToSet: { addons: savedProduct._id } }
        );
      }

      await this.businessService.addProduct(createProductDto.business, savedProduct._id);
      return savedProduct;
    } catch (error) {
      if (
        error instanceof ConflictException
        || error instanceof UnauthorizedException
        || error instanceof BadRequestException
        || error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error creating product');
    }
  }

  async findAll(
    businessId?: string,
    categoryId?: string,
    type?: ProductType,
    includeInactive: boolean = false,
    page: number = 1,
    perPage: number = 20
  ): Promise<PaginatedListDto<Product>> {
    const query: any = {};

    if (!includeInactive) {
      query.isActive = true;
    }

    if (businessId) {
      query.business = new Types.ObjectId(businessId);
    }

    if (categoryId) {
      query.category = new Types.ObjectId(categoryId);
    }

    if (type) {
      query.type = type;
    }

    const skip = (page - 1) * perPage;

    const [products, total] = await Promise.all([
      this.productModel.find(query)
        .populate('business', 'name _id')
        .populate('category', 'name _id level')
        .populate('addons', 'name price finalPrice sku isAvailable')
        .populate('parentProduct', 'name price finalPrice sku')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .exec(),
      this.productModel.countDocuments(query).exec()
    ]);

    return {
      items: products,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage)
    };
  }

  async findOne(id: string): Promise<Product> {
    const _id = new Types.ObjectId(id);
    const product = await this.productModel.findById(_id)
      .populate('business', 'name _id')
      .populate('category', 'name _id level')
      .populate('addons', 'name price finalPrice sku isAvailable description images')
      .populate('parentProduct', 'name price finalPrice sku business')
      .exec();

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async findBySku(sku: string): Promise<Product> {
    const product = await this.productModel.findOne({ sku: sku.toUpperCase() })
      .populate('business', 'name _id')
      .populate('category', 'name _id level')
      .populate('addons', 'name price finalPrice sku isAvailable')
      .populate('parentProduct', 'name price finalPrice sku')
      .exec();

    if (!product) {
      throw new NotFoundException(`Product with SKU ${sku} not found`);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const _id = new Types.ObjectId(id);
    const product = await this.productModel.findById(_id);

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      const existingProduct = await this.productModel.findOne({
        sku: updateProductDto.sku.toUpperCase(),
        _id: { $ne: id }
      });

      if (existingProduct) {
        throw new ConflictException(`Product with SKU "${updateProductDto.sku}" already exists`);
      }
    }

    if (updateProductDto.category) {
      const category = await this.categoriesService.findOne(updateProductDto.category);
      if (!category) {
        throw new BadRequestException('Category not found');
      }

      const business = await this.businessService.findById(product.business.toString());
      if (!business) {
        throw new BadRequestException('Business not found');
      }

      if (!business.categories.map(category => category.toString()).includes(updateProductDto.category)) {
        new BadRequestException('Category not included in business');
      }
    }

    if (updateProductDto.type && updateProductDto.type !== product.type) {
      throw new BadRequestException('Cannot change product type');
    }

    // Only simple product
    if (updateProductDto.addons !== undefined && product.type === ProductType.SIMPLE) {
      product.addons = await this.updateProductAddons(product, updateProductDto.addons);
    }

    // Only addon product
    if (updateProductDto.parentProduct !== undefined && product.type === ProductType.ADDON) {
      product.parentProduct = await this.updateParentProduct(product, updateProductDto.parentProduct);
    }

    product.name = updateProductDto.name ? updateProductDto.name : product.name;
    product.description = updateProductDto.description
      ? updateProductDto.description
      : product.description;
    product.brand = updateProductDto.brand ? updateProductDto.brand : product.brand;
    product.price = updateProductDto.price ? updateProductDto.price : product.price;
    product.images = updateProductDto.images ? updateProductDto.images : product.images;
    product.discountValue = updateProductDto.discountValue
      ? updateProductDto.discountValue
      : product.discountValue;
    product.discountPercent = updateProductDto.discountPercent
      ? updateProductDto.discountPercent
      : product.discountPercent;
    product.warranty = updateProductDto.warranty ? updateProductDto.warranty : product.warranty;
    product.size = updateProductDto.size ? updateProductDto.size : product.size;
    product.colors = updateProductDto.colors ? updateProductDto.colors : product.colors;
    product.weight = updateProductDto.weight ? updateProductDto.weight : product.weight;
    product.stock = updateProductDto.stock ? updateProductDto.stock : product.stock;
    product.isAvailable = updateProductDto.isAvailable !== undefined
      ? updateProductDto.isAvailable
      : product.isAvailable;
    product.sku = updateProductDto.sku ? updateProductDto.sku : product.sku;
    product.category = updateProductDto.category
      ? new Types.ObjectId(updateProductDto.category)
      : product.category;
    product.averageRating = updateProductDto.averageRating
      ? updateProductDto.averageRating
      : product.averageRating;
    product.isActive = updateProductDto.isActive !== undefined
      ? updateProductDto.isActive : product.isActive;
    product.timesOrdered = updateProductDto.timesOrdered
      ? updateProductDto.timesOrdered
      : product.timesOrdered;

    return product.save();
  }

  async remove(id: string): Promise<Product> {
    const _id = new Types.ObjectId(id);
    const product = await this.productModel.findById(_id);

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Si es ADDON, remover del array de addons del producto padre
    if (product.type === ProductType.ADDON && product.parentProduct) {
      await this.productModel.findByIdAndUpdate(
        product.parentProduct,
        { $pull: { addons: product._id } }
      );
    }

    // Si es SIMPLE y tiene addons, remover las referencias parentProduct de los addons
    if (product.type === ProductType.SIMPLE && product.addons.length > 0) {
      await this.productModel.updateMany(
        { _id: { $in: product.addons } },
        { $unset: { parentProduct: 1 } }
      );
    }
    const deletedProduct = await this.productModel.findByIdAndDelete(_id);
    if (!deletedProduct) throw new BadRequestException('Prouct not found');

    await this.businessService.removeProduct(deletedProduct.business.toString(), deletedProduct._id);

    return deletedProduct;
  }

  async getBusinessProducts(businessId: string, type?: ProductType): Promise<Product[]> {
    const business = await this.businessService.findById(businessId);
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const query: any = {
      business: new Types.ObjectId(businessId),
      isActive: true
    };

    if (type) {
      query.type = type;
    }

    return this.productModel.find(query)
      .populate('category', 'name _id')
      .populate('addons', 'name price sku')
      .sort({ type: 1, name: 1 })
      .exec();
  }

  async getCategoryProducts(categoryId: string, type?: ProductType): Promise<Product[]> {
    const category = await this.categoriesService.findOne(categoryId);
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const query: any = {
      category: new Types.ObjectId(categoryId),
      isActive: true,
      isAvailable: true
    }

    if (type) {
      query.type = type;
    }

    return this.productModel.find(query)
      .populate('business', 'name _id')
      .populate('addons', 'name price sku')
      .sort({ finalPrice: 1 })
      .exec();
  }

  async searchProducts(
    searchTerm: string,
    businessId?: string,
    categoryId?: string,
    type?: ProductType,
    minPrice?: number,
    maxPrice?: number,
    inStockOnly: boolean = false
  ): Promise<Product[]> {
    const query: any = {
      isActive: true,
      isAvailable: true,
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { brand: { $regex: searchTerm, $options: 'i' } },
        { sku: { $regex: searchTerm, $options: 'i' } }
      ]
    };

    if (businessId) {
      query.business = new Types.ObjectId(businessId);
    }

    if (categoryId) {
      query.category = new Types.ObjectId(categoryId);
    }

    if (type) {
      query.type = type;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.finalPrice = {};
      if (minPrice !== undefined) query.finalPrice.$gte = minPrice;
      if (maxPrice !== undefined) query.finalPrice.$lte = maxPrice;
    }

    if (inStockOnly) {
      query.stock = { $gt: 0 };
    }

    return this.productModel.find(query)
      .populate('business', 'name _id')
      .populate('category', 'name _id')
      .populate('addons', 'name price sku')
      .sort({ finalPrice: 1 })
      .limit(50)
      .exec();
  }

  async updateStock(productId: string, quantity: number, operation: 'add' | 'subtract'): Promise<Product> {
    const _id = new Types.ObjectId(productId);
    const product = await this.productModel.findById(_id);

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    if (operation === 'add') {
      product.stock += quantity;
    } else if (operation === 'subtract') {
      if (product.stock < quantity) {
        throw new BadRequestException('Insufficient stock');
      }
      product.stock -= quantity;
    }

    // Si el stock llega a 0, marcar como no disponible
    if (product.stock === 0) {
      product.isAvailable = false;
    } else if (product.stock > 0 && !product.isAvailable) {
      product.isAvailable = true;
    }

    return product.save();
  }

  async addReview(productId: string, rating: number): Promise<Product> {
    const _id = new Types.ObjectId(productId);
    const product = await this.productModel.findById(_id);

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Actualizar promedio de rating
    const newTotalReviews = product.totalReviews + 1;
    const newAverageRating = ((product.averageRating * product.totalReviews) + rating) / newTotalReviews;

    product.averageRating = parseFloat(newAverageRating.toFixed(1));
    product.totalReviews = newTotalReviews;

    return product.save();
  }

  async incrementTimesOrdered(productId: string): Promise<Product> {
    const _id = new Types.ObjectId(productId);
    const product = await this.productModel.findByIdAndUpdate(
      _id,
      { $inc: { timesOrdered: 1 } },
      { new: true }
    ).exec();

    if (!product) throw new BadRequestException('Product not found');
    return product;
  }

  private async updateProductAddons(product: ProductDocument, newAddonIds: string[]): Promise<Types.ObjectId[]> {
    const oldAddons = [...product.addons];
    const newAddons = newAddonIds.map(id => new Types.ObjectId(id));

    const addonProducts = await this.productModel.find({
      _id: { $in: newAddons },
      type: ProductType.ADDON
    });

    if (addonProducts.length !== newAddons.length) {
      throw new BadRequestException('One or more addons are invalid or not of type ADDON');
    }

    const alreadyAssigned = addonProducts.filter(addon =>
      addon.parentProduct && !addon.parentProduct.equals(product._id)
    );

    if (alreadyAssigned.length > 0) {
      throw new BadRequestException('One or more addons are already assigned to another product');
    }

    const removedAddons = oldAddons.filter(
      id => !newAddons.some(newId => newId.equals(id))
    );

    if (removedAddons.length > 0) {
      // Remover referencia parentProduct de los addons removidos
      await this.productModel.updateMany(
        { _id: { $in: removedAddons } },
        { $unset: { parentProduct: 1 } }
      );
    }

    // Agregar addons nuevos
    const addedAddons = newAddons.filter(
      id => !oldAddons.some(oldId => oldId.equals(id))
    );

    if (addedAddons.length > 0) {
      // Agregar referencia parentProduct a los nuevos addons
      await this.productModel.updateMany(
        { _id: { $in: addedAddons } },
        { $set: { parentProduct: product._id } }
      );
    }
    return newAddons;
  }

  private async updateParentProduct(product: ProductDocument, newParentId: string): Promise<Types.ObjectId> {
    const oldParentId = product.parentProduct;
    const newParent = new Types.ObjectId(newParentId);

    const parentProduct = await this.productModel.findById(newParent);
    if (!parentProduct || parentProduct.type !== ProductType.SIMPLE) {
      throw new BadRequestException('Parent product not found or is not of type SIMPLE');
    }

    if (!parentProduct.business.equals(product.business)) {
      throw new BadRequestException('Addon must belong to the same business as parent product');
    }

    // Remover del addon array del padre antiguo
    if (oldParentId) {
      await this.productModel.findByIdAndUpdate(
        oldParentId,
        { $pull: { addons: product._id } }
      );
    }

    // Agregar al addon array del nuevo padre
    await this.productModel.findByIdAndUpdate(
      newParent,
      { $addToSet: { addons: product._id } }
    );

    return newParent;
  }
}