import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Inject} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Business } from './schemas/business.schema';
import { BusinessStatus, BusinessStatusType } from './types/business.type';
import { Model, Types } from 'mongoose';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessByAdminDto, UpdateBusinessByOwnerDto } from './dto/update-business.dto';
import { UsersService } from '../users/users.service';
import { Role } from '../users/types/users.type';
import { UpdateUserAllDto } from '../users/dto/update-user.dto';
import { Provider } from '../users/schemas/provider.schema';
import { CategoriesService } from '../categories/categories.service';
import { ListBusinessQueryDto } from './dto/list-business-query.dto';
import { PaginatedListDto } from 'src/common/dto/paginated-list.dto';
import { createDiacriticInsensitiveRegex } from 'src/common/utils/text-regex';
import { EmploymentRequest } from './schemas/employment-request.schema';
import { ProductRepository } from '../products/repositories/product.repository';

type BusinessUpdateData = {
  id: string,
  updateBusinessDto: UpdateBusinessByOwnerDto | UpdateBusinessByAdminDto,
  userId?: string,
}

type RemoveCategoriesParams = {
  businessId: string,
  categoryIds: string[],
  userId: string,
  userRole: string,
}

@Injectable()
export class BusinessService {
  constructor(
    @InjectModel(Business.name) private businessModel: Model<Business | null>,
    @InjectModel(EmploymentRequest.name) private employmentRequestModel: Model<EmploymentRequest>,
    private readonly usersService: UsersService,
    private readonly categoriesService: CategoriesService,
    @Inject('ProductRepository') private readonly productRepository: ProductRepository,

  ) { }

  async requestCreateBusiness(
    createBusinessDto: CreateBusinessDto,
    userId: Types.ObjectId,
  ): Promise<Business> {
    const createdBusiness = new this.businessModel({
      ...createBusinessDto,
      owner: userId,
      status: BusinessStatus.REQUESTED,
    });
    return createdBusiness.save();
  }

  async updateBusinessByAdmin(updateData: BusinessUpdateData): Promise<Business> {
    const business = await this.findById(updateData.id);
    const businessDto = updateData.updateBusinessDto as UpdateBusinessByAdminDto;
    await this.validateCategories(businessDto.categories);
    if (!businessDto.categories) {
      businessDto.categories = [];
    }
    const existentCtegories = business.categories.map(category => category.toString());
    businessDto.categories = [...new Set([...existentCtegories, ...businessDto.categories])];
    const updatedBusiness = await this.businessModel.findByIdAndUpdate(
      updateData.id,
      businessDto,
      { new: true }
    ).exec();

    if (!updatedBusiness) throw new BadRequestException("Failed upadate operation");

    if (businessDto.status && businessDto.status === BusinessStatus.ACCEPTED) {
      await this.updateAcceptedBussinessOwnerData(updatedBusiness.owner, updatedBusiness._id);
    }
    return updatedBusiness;
  }

  async updateBusinessByOwner(updateData: BusinessUpdateData): Promise<Business> {
    const business = await this.findById(updateData.id);
    this.validateBusinessStatustoOwner(business.status);
    const updateDtoData = this.getValidUpdateBusinessByOwnerDto(updateData, business);
    await this.validateCategories(updateDtoData.categories);
    if (!updateDtoData.categories) {
      updateDtoData.categories = [];
    }
    const existentCtegories = business.categories.map(category => category.toString());
    updateDtoData.categories = [...new Set([...existentCtegories, ...updateDtoData.categories])];
    const updatedBusiness = await this.businessModel.findByIdAndUpdate(
      updateData.id,
      updateDtoData,
      { new: true }
    ).exec();

    if (!updatedBusiness) throw new BadRequestException("Failed upadate operation");
    return updatedBusiness;
  }

  async removeCategories(params: RemoveCategoriesParams): Promise<Business> {
    try {
      const { businessId, categoryIds, userId, userRole } = params;
      const _id = new Types.ObjectId(businessId);

      // Verificar que el negocio exista
      const business = await this.businessModel.findById(_id).populate('products', 'category');
      if (!business) {
        throw new NotFoundException('Business not found');
      }

      const isOwner = userId === business.owner.toString();
      if (!isOwner && userRole !== Role.ADMIN) throw new ForbiddenException('You are not an ADMIN or the owner of this business');


      // Verificar que el negocio tenga al menos una de las categorías
      const existingCategoryIds = business.categories.map(category => category.toString());
      const categoriesToRemove = categoryIds.filter(categoryId =>
        existingCategoryIds.includes(categoryId)
      );

      if (categoriesToRemove.length === 0) {
        throw new BadRequestException('None of the provided categories are associated with this business');
      }

      // Filtrar las categorías a remover
      const updatedCategories = business.categories.filter(
        categoryId => !categoriesToRemove.some(removeId => removeId.toString() === categoryId.toString())
      );

      //Eliminar productos relacionados a las categorias eliminadas
      const productsToRemove = business.products.filter((product: any) =>
        categoriesToRemove.includes(product.category.toString())
      ).map((product: any) => product._id);

     const deletedCategoriesTotal =  await this.productRepository.deleteManyByIds(productsToRemove);

      const updatedProducts = business.products.filter((product: any) =>
        !categoriesToRemove.includes(product.category.toString())
      ).map((product: any) => product._id);
      
      // Actualizar el negocio
      const updatedBusiness = await this.businessModel.findByIdAndUpdate(
        _id,
        { $set: { categories: updatedCategories, products: updatedProducts } },
        { new: true }
      ).exec();

      if (!updatedBusiness) {
        throw new BadRequestException('Failed to remove categories');
      }

      return updatedBusiness;
    } catch (error) {
      throw error;
    }
  }

  async requestDeleteBusiness(
    businessId: string,
    userId: string
  ): Promise<Business> {
    const business = await this.businessModel.findById(new Types.ObjectId(businessId));

    if (!business) throw new NotFoundException("Business not found");
    if (business.owner.toString() !== userId) {
      throw new ForbiddenException('Only the business owner can request deletion');
    }

    // Cambiar estado a DISABLED
    business.status = BusinessStatus.DISABLED;
    await business.save();

    // TODO: Aquí agregar lógica para notificar al admin

    return business;
  }

  async deleteBusiness( businessId: string ): Promise<void> {
    try {
      const business = await this.businessModel
        .findById(businessId)
        .populate('owner', 'businesses')
        .populate('employees.messengers', 'businesses isPlatformMessenger')
        .exec();

      if (!business) {
        throw new NotFoundException('Business not found');
      }

      if (business.products && business.products.length > 0) {
        await this.productRepository.deleteManyByIds(business.products);
      }

      await this.handleOwnerAfterBusinessDeletion(business.owner, business._id);

      if (business.employees) {
        if (business.employees.managers && business.employees.managers.length > 0) {
          await this.handleManagersAfterBusinessDeletion(business.employees.managers);
        }

        if (business.employees.messengers && business.employees.messengers.length > 0) {
          await this.handleMessengersAfterBusinessDeletion(
            business.employees.messengers,
            business._id
          );
        }

        if (business.employees.pendingEmployees && business.employees.pendingEmployees.length > 0) {
          await this.employmentRequestModel.deleteMany({
            _id: { $in: business.employees.pendingEmployees }
          });
        }
      }

      await this.businessModel.findByIdAndDelete(businessId);

    } catch (error) {
      console.error(`Error deleting business ${businessId}:`, error);
      throw error;
    }
  }

  private async handleOwnerAfterBusinessDeletion(
    owner: any,
    deletedBusinessId: Types.ObjectId
  ): Promise<void> {
    const hasOtherBusinesses = owner.businesses && owner.businesses.length > 1;
    if (hasOtherBusinesses) {
      const remainigBusinesses = owner.businesses.filter(
        (business: any) => business.toString() !== deletedBusinessId.toString()
      );
      await this.usersService.saveUpdatedUser(
        owner._id,
        { businesses: remainigBusinesses }
      );
    } else {
      await this.usersService.saveUpdatedUser(
        owner._id,
        { role: Role.CUSTOMER }
      );
    }
  }

  private async handleManagersAfterBusinessDeletion(
    managerIds: Types.ObjectId[]
  ): Promise<void> {
    for (const managerId of managerIds) {
      await this.usersService.saveUpdatedUser(
        managerId,
        { role: Role.CUSTOMER }
      );
    }
  }

  private async handleMessengersAfterBusinessDeletion(
    messengers: any[],
    deletedBusinessId: Types.ObjectId
  ): Promise<void> {
    for (const messenger of messengers) {
      if (messenger && messenger.businesses) {
        const hasOtherBusinesses = messenger.businesses.length > 1;
        if (hasOtherBusinesses) {
          const remainigBusinesses = messenger.businesses.filter(
            (business: any) => business.toString() !== deletedBusinessId.toString()
          );
          await this.usersService.saveUpdatedUser(
            messenger._id,
            { businesses: remainigBusinesses }
          );
          continue;
        }

        if (!messenger.isPlatformMessenger) {
          await this.usersService.saveUpdatedUser(
            messenger._id,
            { role: Role.CUSTOMER }
          );
        }
      }
    }
  }

  async findById(id: string): Promise<Business> {
    const business = await this.businessModel.findById(id);
    if (!business) throw new NotFoundException('Business not found');
    return business;
  }

  async findAllPaginated(query: ListBusinessQueryDto): Promise<PaginatedListDto<Business>> {
    try {
      const page: number = Number(query.page) || 1;
      const perPage: number = Number(query.perPage) || 25;

      const filter: any = {};

      // Filtro por estados (status)
      if (query.status && query.status.trim().length > 0) {
        const statuses = query.status.split(',').map(s => s.trim()).filter((status) => {
          return status === BusinessStatus.REQUESTED ||
            status === BusinessStatus.ACCEPTED ||
            status === BusinessStatus.PENDING ||
            status === BusinessStatus.DISABLED;
        });
        if (statuses.length > 0) {
          filter.status = { $in: statuses };
        }
      }

      // Filtro por nombre (búsqueda parcial, insensible a mayúsculas, minusculas y diacriticos)
      if (query.name && query.name.trim().length > 0) {
        const regex = createDiacriticInsensitiveRegex(query.name);
        filter.name = { $regex: regex };
      }

      // Filtro por categorías
      if (query.categories && query.categories.trim().length > 0) {
        const categoryIds = query.categories.split(',').map(id => id.trim()).filter(id => Types.ObjectId.isValid(id));
        if (categoryIds.length > 0) {
          filter.categories = { $in: categoryIds.map(id => new Types.ObjectId(id)) };
        }
      }

      // Filtro por dueño (owner)
      if (query.owner && query.owner.trim().length > 0 && Types.ObjectId.isValid(query.owner)) {
        filter.owner = new Types.ObjectId(query.owner);
      }

      const items: Business[] = await this.businessModel
        .find(filter)
        .skip((page - 1) * perPage)
        .limit(perPage)
        .populate('owner', 'firstName lastName email')
        .populate('categories', 'name')
        .exec();

      const total: number = await this.businessModel.countDocuments(filter).exec();
      const totalPages: number = Math.ceil(total / perPage) || 1;

      const paginatedList: PaginatedListDto<Business> = {
        items,
        total,
        page,
        perPage,
        totalPages,
      };

      return paginatedList;
    } catch (error) {
      throw error;
    }
  }

  async addProduct(businessId: string, productId: Types.ObjectId) {
    const _id = new Types.ObjectId(businessId);
    const business = await this.businessModel.findOne(_id);
    if (!business) throw new BadRequestException('Business not found');
    business.products.forEach((existentProductId) => {
      if (existentProductId.toString() === productId.toString()) {
        throw new ConflictException('Product already exists');
      }
    });
    business.products.push(productId);
    await business.save();
  }

  async removeProduct(businessId: string, productId: Types.ObjectId) {
    const _id = new Types.ObjectId(businessId);
    const business = await this.businessModel.findOne(_id);
    if (!business) throw new BadRequestException('Business not found');

    business.products = business.products.filter(
      id => id.toString() !== productId.toString()
    );

    await business.save();
  }

  private async updateAcceptedBussinessOwnerData(
    ownerId: Types.ObjectId,
    businessId: Types.ObjectId
  ): Promise<void> {

    let ownerUser = await this.usersService.findOne(ownerId.toString());
    const providerData: UpdateUserAllDto = {
      role: Role.PROVIDER,
      businesses: [businessId],
      isMessenger: false,
    };

    if (ownerUser.role === Role.PROVIDER) {
      const ownerProvider = ownerUser as Provider;
      if (providerData.businesses && providerData.businesses.length > 0) {
        providerData.businesses = new Array().concat(
          ownerProvider.businesses,
          providerData.businesses
        );
      }
      await this.usersService.saveUpdatedUser(ownerId, providerData)
    } else if (ownerUser.role === Role.CUSTOMER) {
      await this.usersService.saveUpdatedUser(ownerId, providerData);
    } else {
      throw new BadRequestException(
        "User can not be updated because invalid role field, only CUSTOMER and PROVIDER can request create a new business"
      );
    }
  }

  private async validateCategories(categories: string[] | undefined): Promise<void> {
    if (categories) {
      const areValidCategories = await this.categoriesService.existAllCategories(categories);
      if (!areValidCategories) throw new BadRequestException("You have at least an invalid category id");
    }
  }

  private validateBusinessStatustoOwner(businessStatus: BusinessStatusType): void {
    if (businessStatus !== BusinessStatus.ACCEPTED) {
      throw new ForbiddenException('Your business have not accepted status yet');
    }
  }

  private getValidUpdateBusinessByOwnerDto(updateData: BusinessUpdateData, business: Business): UpdateBusinessByOwnerDto {

    const isOwner = updateData.userId && updateData.userId === business.owner.toString();
    if (!isOwner) throw new ForbiddenException('You are not the owner of this business');

    const updateDtoData = updateData.updateBusinessDto as UpdateBusinessByOwnerDto;
    const incorrectDtoBusinessStatus =
      updateDtoData.status
      && updateDtoData.status !== BusinessStatus.REQUESTED
      && updateDtoData.status !== BusinessStatus.DISABLED;

    if (incorrectDtoBusinessStatus) {
      throw new BadRequestException(
        'Business status can only be updated when status is requested or disabled'
      );
    }

    return updateDtoData;
  }
}