import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Business } from './schemas/business.schema';
import { BusinessStatus } from './types/business.type';
import { Model, Types } from 'mongoose';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessByAdminDto, UpdateBusinessByOwnerDto } from './dto/update-business.dto';
import { UsersService } from '../users/users.service';
import { Role } from '../users/types/users.type';
import { UpdateUserAllDto } from '../users/dto/update-user.dto';
import { Provider } from '../users/schemas/provider.schema';
import { CategoriesService } from '../categories/categories.service';

type BusinessUpdateData = {
  id: string,
  updateBusinessDto: UpdateBusinessByOwnerDto | UpdateBusinessByAdminDto,
  userId?: string,
}

@Injectable()
export class BusinessService {
  constructor(
    @InjectModel(Business.name) private businessModel: Model<Business | null>,
    private readonly usersService: UsersService,
    private readonly categoriesService: CategoriesService,
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
    const business = await this.businessModel.findById(updateData.id);
    const businessDto = updateData.updateBusinessDto as UpdateBusinessByAdminDto;
    if (!business) throw new NotFoundException('Business not found');
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
    const business = await this.businessModel.findById(updateData.id);
    if (!business) throw new NotFoundException('Business not found');

    if (business.status !== BusinessStatus.ACCEPTED) {
      throw new ForbiddenException('Your business have not accepted status yet');
    }

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

    if (updateDtoData.categories) {
      const areValidCategories = await this.categoriesService.existAllCategories(updateDtoData.categories);
      if (!areValidCategories) throw new BadRequestException("You have at least an invalid category id");
    }

    const updatedBusiness = await this.businessModel.findByIdAndUpdate(
      updateData.id,
      updateDtoData,
      { new: true }
    ).exec();

    if (!updatedBusiness) throw new BadRequestException("Failed upadate operation");
    return updatedBusiness;
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
      id  => id.toString() !== productId.toString()
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
}