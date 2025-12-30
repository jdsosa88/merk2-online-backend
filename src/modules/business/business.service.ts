import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Business,
  BusinessStatus
} from './schemas/business.schema';
import { Model, Types } from 'mongoose';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessByAdminDto, UpdateBusinessByOwnerDto } from './dto/update-business.dto';
import { UsersService } from '../users/users.service';
import { Role } from '../users/types/users.type';
import { UpdateUserAllDto } from '../users/dto/update-user.dto';
import { Provider } from '../users/schemas/provider.schema';

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

    const updatedBusiness = await this.businessModel.findByIdAndUpdate(
      updateData.id,
      updateDtoData,
      { new: true }
    ).exec();

    if (!updatedBusiness) throw new BadRequestException("Failed upadate operation");
    return updatedBusiness;
  }

  async findById(id: string, userId: string): Promise<Business> {
    const business = await this.businessModel.findById(id);
    if (!business) throw new NotFoundException('Business not found');    
    return business;
  }

  private async updateAcceptedBussinessOwnerData(
    ownerId: Types.ObjectId,
    businessId: Types.ObjectId
  ): Promise<void> {

    let ownerUser = await this.usersService.findOne(ownerId.toString());
    const providerData: UpdateUserAllDto = {
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