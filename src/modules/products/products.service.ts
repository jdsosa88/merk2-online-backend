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
import { StoresService } from '../stores/stores.service';
import { CategoriesService } from '../categories/categories.service';
import { PaginatedListDto } from 'src/common/dto/paginated-list.dto';
import { MoneyUtils } from 'src/common/utils/money.utils';
import { Store } from '../stores/schemas/store.schema';
import { StoreStatus } from '../stores/types/store.type';
import { User } from '../users/schemas/user.schema';
import { ImagesService } from '../images/images.service';
import { AddProductImagesParams, DeleteProductImagesParams } from './types/product.types';
import {
  VISUAL_VARIETY_TYPE_ID,
  VISUAL_VARIETY_TYPE_LABEL,
} from '../stores/types/variety.constants';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @Inject(forwardRef(() => StoresService)) private readonly storesService: StoresService,
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

      const store = await this.storesService.findById(createProductDto.store);
      if (!store) {
        throw new BadRequestException('Store not found');
      }

      if (store.status !== StoreStatus.ACTIVE) {
        throw new BadRequestException('Store is not active');
      }

      const isOwner = store.owner.toString() === userId;
      if (!isOwner) {
        throw new UnauthorizedException('Only store owner can create products.')
      }

      const category = await this.categoriesService.findOne(createProductDto.category);
      if (!category) {
        throw new BadRequestException('Category not found');
      }

      if (createProductDto.type === ProductType.SIMPLE) {
        if (createProductDto.addons && createProductDto.addons.length > 0) {
          await this.assertAddonsBelongToStore(
            createProductDto.store,
            createProductDto.addons,
          );
        }
      } else if (createProductDto.type === ProductType.ADDON) {
        // Addons are store catalog items; parentProduct is optional/legacy.
        if (createProductDto.parentProduct) {
          const parentProductId = new Types.ObjectId(createProductDto.parentProduct);
          const parentProduct = await this.productModel.findById(parentProductId);
          if (!parentProduct || parentProduct.type !== ProductType.SIMPLE) {
            throw new BadRequestException('Parent product not found or is not of type SIMPLE');
          }
          if (parentProduct.store.toString() !== createProductDto.store) {
            throw new BadRequestException('Addon must belong to the same store as parent product');
          }
        }
      }

      const productData = CreateProductDto.toCents(createProductDto);

      if (productData.enabledVarietyTypeIds?.length) {
        this.assertEnabledVarietyTypesBelongToStore(
          store,
          productData.enabledVarietyTypeIds,
        );
      }

      const isAddon = productData.type === ProductType.ADDON;
      const newProduct = new this.productModel({
        ...productData,
        sku: productData.sku.toUpperCase(),
        tags: this.normalizeTags(productData.tags),
        store: new Types.ObjectId(productData.store),
        category: new Types.ObjectId(productData.category),
        parentProduct: productData.parentProduct
          ? new Types.ObjectId(productData.parentProduct)
          : undefined,
        addons: isAddon
          ? []
          : productData.addons
            ? productData.addons.map((id: string) => new Types.ObjectId(id))
            : [],
        hasVarieties: isAddon ? false : productData.hasVarieties ?? false,
        hasAddons: isAddon ? false : productData.hasAddons ?? false,
        isReleased: isAddon ? productData.isReleased ?? false : false,
        enabledVarietyTypeIds: isAddon
          ? []
          : (productData.enabledVarietyTypeIds || []).map(
              (id) => new Types.ObjectId(id),
            ),
        visualOptions: isAddon
          ? []
          : this.mapVisualOptionsInput(productData.visualOptions),
      });

      const savedProduct = await newProduct.save();

      if (savedProduct.type === ProductType.ADDON && savedProduct.parentProduct) {
        await this.productModel.findByIdAndUpdate(
          savedProduct.parentProduct,
          { $addToSet: { addons: savedProduct._id } }
        );
      }

      await this.storesService.addProduct(createProductDto.store, savedProduct._id);
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
    StoreId?: string,
    categoryId?: string,
    type?: ProductType,
    includeInactive: boolean = false,
    page: number = 1,
    perPage: number = 25,
    deliveryZoneId?: string,
  ): Promise<PaginatedListDto<Product>> {
    const query: any = {};

    if (!includeInactive) {
      query.isActive = true;
    }

    if (deliveryZoneId) {
      const storeIds = await this.storesService.findStoreIdsDeliveringToZone(deliveryZoneId);
      if (StoreId) {
        const allowed = storeIds.some((id) => id.toString() === StoreId);
        if (!allowed) {
          return { items: [], total: 0, page, perPage, totalPages: 0 };
        }
        query.store = new Types.ObjectId(StoreId);
      } else if (!storeIds.length) {
        return { items: [], total: 0, page, perPage, totalPages: 0 };
      } else {
        query.store = { $in: storeIds };
      }
    } else if (StoreId) {
      query.store = new Types.ObjectId(StoreId);
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
        .populate('store', 'name _id')
        .populate('category', 'name _id level')
        .populate('addons', 'name price finalPrice sku isAvailable isReleased images')
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
      .populate('store', 'name _id')
      .populate('category', 'name _id level')
      .populate('addons', 'name price finalPrice sku isAvailable isReleased description images')
      .populate('parentProduct', 'name price finalPrice sku store')
      .exec();

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return this.attachAvailableVarietyTypes(product);
  }

  async findBySku(sku: string): Promise<Product> {
    const product = await this.productModel.findOne({ sku: sku.toUpperCase() })
      .populate('store', 'name _id')
      .populate('category', 'name _id level')
      .populate('addons', 'name price finalPrice sku isAvailable isReleased')
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
      .populate('store', 'name status owner messengers varietyTypes')
      .populate('addons', 'name price finalPrice sku isAvailable isReleased')
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

      const store = await this.storesService.findById(product.store.toString());
      if (!store) {
        throw new BadRequestException('Store not found');
      }
    }

    if (updateProductDto.type && updateProductDto.type !== product.type) {
      await this.changeProductType(product, updateProductDto.type);
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
    if (productDto.tags !== undefined) {
      product.tags = this.normalizeTags(productDto.tags);
    }
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
    if (productDto.influenceWeight !== undefined) {
      product.influenceWeight = productDto.influenceWeight;
    }
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
    if (productDto.requiresElaboration !== undefined) {
      product.requiresElaboration = productDto.requiresElaboration;
    }
    if (productDto.isReservable !== undefined) {
      product.isReservable = productDto.isReservable;
    }
    if (productDto.hasVarieties !== undefined) {
      product.hasVarieties = product.type === ProductType.ADDON ? false : productDto.hasVarieties;
    }
    if (productDto.hasAddons !== undefined) {
      product.hasAddons = product.type === ProductType.ADDON ? false : productDto.hasAddons;
    }
    if (productDto.isReleased !== undefined) {
      product.isReleased = product.type === ProductType.ADDON ? productDto.isReleased : false;
    }
    if (productDto.enabledVarietyTypeIds !== undefined) {
      if (product.type === ProductType.ADDON) {
        product.enabledVarietyTypeIds = [];
      } else {
        const store = await this.storesService.findById(product.store.toString());
        this.assertEnabledVarietyTypesBelongToStore(store, productDto.enabledVarietyTypeIds);
        product.enabledVarietyTypeIds = productDto.enabledVarietyTypeIds.map(
          (id) => new Types.ObjectId(id),
        );
      }
    }
    if (productDto.visualOptions !== undefined) {
      if (product.type === ProductType.ADDON) {
        product.visualOptions = [] as any;
      } else {
        product.visualOptions = this.mapVisualOptionsInput(productDto.visualOptions) as any;
      }
      product.markModified('visualOptions');
    }

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

    await this.storesService.removeProduct(deletedProduct.store.toString(), deletedProduct._id);

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

  async getStoreProducts(StoreId: string, type?: ProductType): Promise<Product[]> {
    const store = await this.storesService.findById(StoreId);
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const query: any = {
      store: new Types.ObjectId(StoreId),
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
      .populate('store', 'name _id')
      .populate('addons', 'name price sku')
      .sort({ finalPrice: 1 })
      .exec();
  }

  async searchProducts(
    searchTerm: string,
    StoreId?: string,
    categoryId?: string,
    type?: ProductType,
    minPrice?: number,
    maxPrice?: number,
    inStockOnly: boolean = false
  ): Promise<Product[]> {
    const tokens = (searchTerm || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 12);

    if (tokens.length === 0) {
      return [];
    }

    const escapeRegex = (value: string) =>
      value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const query: any = {
      isActive: true,
      isAvailable: true,
      // Every token must match name, description, brand, sku, or any tag
      $and: tokens.map((token) => {
        const pattern = escapeRegex(token);
        return {
          $or: [
            { name: { $regex: pattern, $options: 'i' } },
            { description: { $regex: pattern, $options: 'i' } },
            { brand: { $regex: pattern, $options: 'i' } },
            { sku: { $regex: pattern, $options: 'i' } },
            { tags: { $regex: pattern, $options: 'i' } },
          ],
        };
      }),
    };

    if (StoreId) {
      query.store = new Types.ObjectId(StoreId);
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
      .populate('store', 'name _id')
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

  private async changeProductType(
    product: ProductDocument,
    nextType: ProductType,
  ): Promise<void> {
    if (product.type === nextType) return;

    if (product.type === ProductType.SIMPLE && nextType === ProductType.ADDON) {
      if (product.addons?.length) {
        await this.productModel.updateMany(
          { _id: { $in: product.addons } },
          { $unset: { parentProduct: 1 } },
        );
      }
      product.addons = [];
      product.hasAddons = false;
      product.hasVarieties = false;
      product.enabledVarietyTypeIds = [];
      product.visualOptions = [] as any;
      product.requiresElaboration = false;
      product.isReservable = false;
      product.parentProduct = undefined;
      product.markModified('visualOptions');
      product.markModified('addons');
      product.markModified('enabledVarietyTypeIds');
    }

    if (product.type === ProductType.ADDON && nextType === ProductType.SIMPLE) {
      await this.productModel.updateMany(
        { addons: product._id },
        { $pull: { addons: product._id } },
      );
      product.parentProduct = undefined;
      product.isReleased = false;
    }

    product.type = nextType;
  }

  private async assertAddonsBelongToStore(
    storeId: string,
    addonIds: string[],
  ): Promise<ProductDocument[]> {
    const addonProducts = await this.productModel.find({
      _id: { $in: addonIds.map((id) => new Types.ObjectId(id)) },
      type: ProductType.ADDON,
      store: new Types.ObjectId(storeId),
    });

    if (addonProducts.length !== addonIds.length) {
      throw new BadRequestException(
        'One or more addons are invalid, not of type ADDON, or belong to another store',
      );
    }

    const unavailable = addonProducts.filter((addon) => addon.isAvailable === false);
    if (unavailable.length > 0) {
      throw new BadRequestException(
        `Unavailable addons cannot be used in plate composition: ${unavailable
          .map((a) => a.name)
          .join(', ')}`,
      );
    }

    return addonProducts;
  }

  private async updateProductAddons(product: ProductDocument, newAddonIds: string[]): Promise<Types.ObjectId[]> {
    const newAddons = newAddonIds.map((id) => new Types.ObjectId(id));
    await this.assertAddonsBelongToStore(product.store.toString(), newAddonIds);
    return newAddons;
  }

  private async updateParentProduct(product: ProductDocument, newParentId: string): Promise<Types.ObjectId> {
    const oldParentId = product.parentProduct;
    const newParent = new Types.ObjectId(newParentId);

    const parentProduct = await this.productModel.findById(newParent);
    if (!parentProduct || parentProduct.type !== ProductType.SIMPLE) {
      throw new BadRequestException('Parent product not found or is not of type SIMPLE');
    }

    if (!parentProduct.store.equals(product.store)) {
      throw new BadRequestException('Addon must belong to the same store as parent product');
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
    return validatedProduct;
  }

  async uploadVisualOptionImage(params: {
    productId: string;
    optionId: string;
    user: User;
    image: Express.Multer.File;
  }): Promise<Product> {
    try {
      const product = await this.getValidatedProduct(params.productId, params.user);
      const option = (product.visualOptions || []).find(
        (o) => o._id.toString() === params.optionId,
      );
      if (!option) {
        throw new NotFoundException(`Visual option ${params.optionId} not found`);
      }

      if (option.image) {
        await this.imagesService.delete(option.image.toString());
      }

      const created = await this.imagesService.createFromFile(
        params.image,
        `Visual option ${option.label}`,
      );
      option.image = created._id;
      product.markModified('visualOptions');
      await product.save();
      return product;
    } catch (error) {
      if (params.image?.filename) {
        this.imagesService.deleteImageFile(params.image.filename);
      }
      throw error;
    }
  }

  private async getValidatedProduct(productId: string, user: User): Promise<ProductDocument> {
    const _id = new Types.ObjectId(productId);
    const product = await this.productModel.findById(_id).populate('store');
    if (!product) throw new NotFoundException('Product not found');
    const store = product.store ? ((product as any).store as Store) : undefined;
    const isAdmin = user.role === 'ADMIN';
    const isOwner = store?.owner?.toString() === user._id.toString();
    if (!isAdmin && !isOwner) {
      throw new ForbiddenException(
        'Only store owner or system admin can access this endpoint'
      );
    }
    return product;
  }

  private async addImages(product: ProductDocument, images: Express.Multer.File[]): Promise<Product> {
    if (!images || images.length === 0) {
      throw new BadRequestException("You must add at least one image");
    }

    const totalStoreProducts = product.images.length;
    const newImagesCount = images ? images.length : 0;
    if (totalStoreProducts + newImagesCount > 10) {
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
    return product;
  }

  /**
   * Resolves checkout selectedOptions against product + store config.
   * Empty selection = baker's choice (base finalPrice only).
   */
  resolveCheckoutSelectedOptions(
    product: ProductDocument | Product,
    selectedOptions: Array<{ varietyTypeId: string; optionId: string }> | undefined,
  ): {
    selectedOptions: Array<{
      varietyTypeId: string;
      varietyTypeLabel: string;
      optionId: string;
      optionLabel: string;
      priceDelta: number;
    }>;
    unitPriceCents: number;
  } {
    const selections = selectedOptions || [];
    const basePrice = product.finalPrice;

    if (selections.length === 0) {
      return { selectedOptions: [], unitPriceCents: basePrice };
    }

    if (!product.hasVarieties) {
      throw new BadRequestException(
        `Product ${product.name} does not support variety selection`,
      );
    }

    const typeIds = selections.map((s) => s.varietyTypeId);
    if (new Set(typeIds).size !== typeIds.length) {
      throw new BadRequestException('Only one option per variety type is allowed');
    }

    const store = product.store as any;
    const storeVarietyTypes = store?.varietyTypes || [];
    const enabledIds = new Set(
      (product.enabledVarietyTypeIds || []).map((id) => id.toString()),
    );

    const resolved: Array<{
      varietyTypeId: string;
      varietyTypeLabel: string;
      optionId: string;
      optionLabel: string;
      priceDelta: number;
    }> = [];

    for (const selection of selections) {
      if (selection.varietyTypeId === VISUAL_VARIETY_TYPE_ID) {
        const option = (product.visualOptions || []).find(
          (o) => o._id.toString() === selection.optionId && o.isActive !== false,
        );
        if (!option) {
          throw new BadRequestException(
            `Visual option ${selection.optionId} is not available for ${product.name}`,
          );
        }
        resolved.push({
          varietyTypeId: VISUAL_VARIETY_TYPE_ID,
          varietyTypeLabel: VISUAL_VARIETY_TYPE_LABEL,
          optionId: option._id.toString(),
          optionLabel: option.label,
          priceDelta: option.priceDelta ?? 0,
        });
        continue;
      }

      if (!enabledIds.has(selection.varietyTypeId)) {
        throw new BadRequestException(
          `Variety type ${selection.varietyTypeId} is not enabled for ${product.name}`,
        );
      }

      const type = storeVarietyTypes.find(
        (t: any) => t._id.toString() === selection.varietyTypeId && t.isActive !== false,
      );
      if (!type) {
        throw new BadRequestException(
          `Variety type ${selection.varietyTypeId} not found on store`,
        );
      }

      const option = (type.options || []).find(
        (o: any) => o._id.toString() === selection.optionId && o.isActive !== false,
      );
      if (!option) {
        throw new BadRequestException(
          `Option ${selection.optionId} not found in variety type ${type.name}`,
        );
      }

      resolved.push({
        varietyTypeId: type._id.toString(),
        varietyTypeLabel: type.name,
        optionId: option._id.toString(),
        optionLabel: option.label,
        priceDelta: option.priceDelta ?? 0,
      });
    }

    for (const type of storeVarietyTypes) {
      const typeId = type._id.toString();
      if (!enabledIds.has(typeId)) continue;
      if (type.isActive === false) continue;
      if (type.isRequired === false) continue;
      const hasSelection = resolved.some((r) => r.varietyTypeId === typeId);
      if (!hasSelection) {
        throw new BadRequestException(
          `Variety type "${type.name}" is required when customizing ${product.name}`,
        );
      }
    }

    const totalDelta = resolved.reduce((sum, r) => sum + (r.priceDelta || 0), 0);
    return {
      selectedOptions: resolved,
      unitPriceCents: MoneyUtils.sumCents(basePrice, totalDelta),
    };
  }

  /**
   * Resolve plate composition addons.
   * Extra charge = Σ (qty - 1) * addon.finalPrice (cents).
   * Non-released addons must stay at qty 1.
   */
  resolveCheckoutSelectedAddons(
    product: ProductDocument | Product,
    selectedAddons: Array<{ addonId: string; quantity: number }> | undefined,
  ): {
    selectedAddons: Array<{
      addonId: Types.ObjectId;
      addonLabel: string;
      quantity: number;
      pricePerUnit: number;
      totalPrice: number;
    }>;
    extraCents: number;
  } {
    const selections = selectedAddons || [];
    const composition = (product.addons || []) as any[];

    if (!product.hasAddons) {
      if (selections.length > 0) {
        throw new BadRequestException(
          `Product ${product.name} does not support addon selection`,
        );
      }
      return { selectedAddons: [], extraCents: 0 };
    }

    if (!composition.length) {
      if (selections.length > 0) {
        throw new BadRequestException(
          `Product ${product.name} has no composition addons configured`,
        );
      }
      return { selectedAddons: [], extraCents: 0 };
    }

    const selectionById = new Map(
      selections.map((s) => [s.addonId, s.quantity]),
    );
    const compositionIds = new Set(
      composition.map((a) => (a._id || a).toString()),
    );

    for (const selection of selections) {
      if (!compositionIds.has(selection.addonId)) {
        throw new BadRequestException(
          `Addon ${selection.addonId} is not part of ${product.name}`,
        );
      }
    }

    const resolved: Array<{
      addonId: Types.ObjectId;
      addonLabel: string;
      quantity: number;
      pricePerUnit: number;
      totalPrice: number;
    }> = [];
    let extraCents = 0;

    for (const addonRef of composition) {
      const addonDoc = addonRef._id ? addonRef : null;
      const addonId = (addonRef._id || addonRef).toString();
      const quantity = selectionById.has(addonId)
        ? Number(selectionById.get(addonId))
        : 1;

      if (!Number.isFinite(quantity) || quantity < 1) {
        throw new BadRequestException(
          `Addon quantity must be at least 1 for ${product.name}`,
        );
      }

      const isReleased = addonDoc ? addonDoc.isReleased === true : false;
      if (!isReleased && quantity !== 1) {
        throw new BadRequestException(
          `Addon "${addonDoc?.name || addonId}" is not released; quantity must be 1`,
        );
      }

      const pricePerUnit = addonDoc
        ? Number(addonDoc.finalPrice ?? addonDoc.price ?? 0)
        : 0;
      const extraQty = Math.max(0, quantity - 1);
      const lineExtra = MoneyUtils.multiplyCents(pricePerUnit, extraQty);
      extraCents = MoneyUtils.sumCents(extraCents, lineExtra);

      resolved.push({
        addonId: new Types.ObjectId(addonId),
        addonLabel: addonDoc?.name || addonId,
        quantity,
        pricePerUnit,
        totalPrice: lineExtra,
      });
    }

    return { selectedAddons: resolved, extraCents };
  }

  /** Trim, lowercase, dedupe; drop empty; cap at 30 tags. */
  private normalizeTags(tags?: string[]): string[] {
    if (!tags?.length) return [];
    const seen = new Set<string>();
    const normalized: string[] = [];
    for (const raw of tags) {
      const tag = String(raw || '')
        .trim()
        .toLowerCase()
        .slice(0, 80);
      if (!tag || seen.has(tag)) continue;
      seen.add(tag);
      normalized.push(tag);
      if (normalized.length >= 30) break;
    }
    return normalized;
  }

  private mapVisualOptionsInput(
    options?: Array<{
      _id?: string;
      label: string;
      priceDelta?: number;
      image?: string;
      isActive?: boolean;
      sortOrder?: number;
    }>,
  ) {
    if (!options) return [];
    return options.map((option, index) => ({
      _id: option._id ? new Types.ObjectId(option._id) : new Types.ObjectId(),
      label: option.label.trim(),
      priceDelta: option.priceDelta ?? 0,
      image: option.image ? new Types.ObjectId(option.image) : undefined,
      isActive: option.isActive ?? true,
      sortOrder: option.sortOrder ?? index,
    }));
  }

  private assertEnabledVarietyTypesBelongToStore(
    store: Store | any,
    enabledVarietyTypeIds: string[],
  ) {
    const storeTypeIds = new Set(
      (store.varietyTypes || []).map((t: any) => t._id.toString()),
    );
    for (const typeId of enabledVarietyTypeIds) {
      if (!storeTypeIds.has(typeId)) {
        throw new BadRequestException(
          `Variety type ${typeId} does not belong to this store`,
        );
      }
    }
  }

  private async attachAvailableVarietyTypes(product: ProductDocument): Promise<any> {
    const storeId =
      (product.store as any)?._id?.toString?.() ||
      (product.store as any)?.toString?.() ||
      product.store?.toString();

    if (!storeId || !product.hasVarieties) {
      const json = product.toJSON();
      return {
        ...json,
        availableVarietyTypes: [],
      };
    }

    const store = await this.storesService.findById(storeId);
    const enabled = new Set(
      (product.enabledVarietyTypeIds || []).map((id) => id.toString()),
    );
    const storeJson = store.toJSON() as any;
    const availableVarietyTypes = (storeJson.varietyTypes || []).filter(
      (type: any) =>
        enabled.has(type._id.toString()) &&
        type.isActive !== false,
    );

    return {
      ...product.toJSON(),
      availableVarietyTypes,
    };
  }

}