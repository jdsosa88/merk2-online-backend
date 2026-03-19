import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
  Inject,
  forwardRef,
  ForbiddenException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument, ProductType } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { BusinessService } from '../business/business.service';
import { CategoriesService } from '../categories/categories.service';
import { PaginatedListDto } from 'src/common/dto/paginated-list.dto';
import { MoneyUtils } from 'src/common/utils/money.utils';
import { Business } from '../business/schemas/business.schema';
import { User } from '../users/schemas/user.schema';
import { ImagesService } from '../images/images.service';
import { AddProductImagesParams, DeleteProductImagesParams } from './types/product.types';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @Inject(forwardRef(() => BusinessService)) private readonly businessService: BusinessService,
    private readonly categoriesService: CategoriesService,
    private readonly imagesService: ImagesService,
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

      const productData = CreateProductDto.toCents(createProductDto);

      const newProduct = new this.productModel({
        ...productData,
        sku: productData.sku.toUpperCase(),
        business: new Types.ObjectId(productData.business),
        category: new Types.ObjectId(productData.category),
        parentProduct: productData.parentProduct
          ? new Types.ObjectId(productData.parentProduct)
          : undefined,
        addons: productData.addons
          ? productData.addons.map((id: string) => new Types.ObjectId(id))
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
    perPage: number = 25
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
      .populate('images')
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

  async findProductsByIds(productIds: string[]): Promise<Product[]> {
    const ids = productIds.map(id => new Types.ObjectId(id));
    return this.productModel.find({ _id: { $in: ids } })
      .populate('business', 'name status owner employees images')
      .exec();
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
    const productDto = UpdateProductDto.toCents(updateProductDto);
    product.name = productDto.name ? productDto.name : product.name;
    product.description = productDto.description
      ? productDto.description
      : product.description;
    product.brand = productDto.brand ? productDto.brand : product.brand;
    product.price = productDto.price ? productDto.price : product.price;
    product.discountValue = productDto.discountValue
      ? productDto.discountValue
      : productDto.discountPercent && product.price > 0
        ? MoneyUtils.calculatePercentage(product.price, productDto.discountPercent)
        : product.discountValue;
    product.discountPercent = productDto.discountPercent
      ? productDto.discountPercent
      : productDto.discountValue && product.price > 0
        ? MoneyUtils.calculatePercentageOfValue(productDto.discountValue, product.price)
        : product.discountPercent;
    product.warranty = productDto.warranty ? productDto.warranty : product.warranty;
    product.size = productDto.size ? productDto.size : product.size;
    product.colors = productDto.colors ? productDto.colors : product.colors;
    product.weight = productDto.weight ? productDto.weight : product.weight;
    product.stock = productDto.stock ? productDto.stock : product.stock;
    product.isAvailable = productDto.isAvailable !== undefined
      ? productDto.isAvailable
      : product.isAvailable;
    product.sku = productDto.sku ? productDto.sku : product.sku;
    product.category = productDto.category
      ? new Types.ObjectId(productDto.category)
      : product.category;
    product.averageRating = productDto.averageRating
      ? productDto.averageRating
      : product.averageRating;
    product.isActive = productDto.isActive !== undefined
      ? productDto.isActive : product.isActive;
    product.timesOrdered = productDto.timesOrdered
      ? productDto.timesOrdered
      : product.timesOrdered;

    return product.save();
  }

  private calculateDiscountPercent(discountValue: number | undefined, price: number | undefined) {
    if (discountValue !== undefined && discountValue !== null && price !== undefined && price !== null && price > 0) {
      return MoneyUtils.calculatePercentageOfValue(discountValue, price);
    }
    return 0;
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

  async removeMany(productIds: Types.ObjectId[]): Promise<{ totalDeleted: number }> {
    try {
      const deleteResult = await this.productModel.deleteMany(
        { _id: { $in: productIds } },
      );
      return { totalDeleted: deleteResult.deletedCount };
    } catch (error) {
      return { totalDeleted: 0 };
    }

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

  async addProductImages(params: AddProductImagesParams): Promise<Product> {
    try {
      const validatedProduct = await this.getValidatedProduct(params.productId, params.user);
      return await this.addImages(validatedProduct, params.images);
    } catch (error) {
      for (let i = 0; i < params.images.length; i++) {
        const image = params.images[i];
        this.imagesService.deleteImageFile(image.filename);
      }
      throw error;
    }
  }

  async deleteProductImages(params: DeleteProductImagesParams): Promise<Product> {
    const validatedProduct = await this.getValidatedProduct(params.productId, params.user);
    const productImages = validatedProduct.images.map((image: Types.ObjectId) => image.toString());
    const validImageIdsToDelete = params.imageIds.filter(
      (image: string) => productImages.includes(image));

    const deletedImages = await Promise.all(
      validImageIdsToDelete.map((id: string, index: number) => {
        this.imagesService.delete(id);
        return index;
      })
    );

    if (deletedImages.length !== validImageIdsToDelete.length) {
      throw new BadRequestException("Errors occurred deleting product images");
    }

    const remainingImages = validatedProduct.images.filter(
      (image: Types.ObjectId) => validImageIdsToDelete.includes(image.toString()) === false
    );

    validatedProduct.images = remainingImages;
    await validatedProduct.save();
    await validatedProduct.populate('images');
    return validatedProduct;
  }

  private async getValidatedProduct(productId: string, user: User): Promise<ProductDocument> {
    const _id = new Types.ObjectId(productId);
    const product = await this.productModel.findById(_id).populate('business');
    if (!product) throw new NotFoundException('Product not found');
    const business = product.business ? ((product as any).business as Business) : undefined;
    const isAdmin = user.role === 'ADMIN' ? true : false;
    const isOwner = business?.owner.toString() === user._id.toString() ? true : false;
    const businessManager = business?.employees?.managers?.filter((manager) => manager.toString() === user._id.toString());
    const isBusinessManager = businessManager && businessManager.length > 0 ? true : false;
    if (!isAdmin && !isOwner && !isBusinessManager) {
      throw new ForbiddenException(
        'Only business owner, manager or system admin can access this endpoint'
      );
    }
    return product;
  }

  private async addImages(product: ProductDocument, images: Express.Multer.File[]): Promise<Product> {
    if (!images || images.length === 0) {
      throw new BadRequestException("You must add at least one image");
    }

    const totalBusinessProducts = product.images.length;
    const newImagesCount = images ? images.length : 0;
    if (totalBusinessProducts + newImagesCount > 10) {
      throw new BadRequestException(
        'You have exceeded the maximum number of images allowed per product. The image limit per product is 10.'
      );
    }

    const imageIds = await Promise.all(
      images.map(file =>
        this.imagesService.createFromFile(file, `Product image`).then(img => img._id)
      )
    );
    product.images.push(...imageIds);
    await product.save();
    return product.populate('images');
  }

}