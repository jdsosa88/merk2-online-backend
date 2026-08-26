import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SellerApplication } from './schemas/seller-application.schema';
import { CreateSellerApplicationDto, ReviewSellerApplicationDto } from './dto/seller-application.dto';
import { SellerApplicationStatus } from './types/seller-application.type';
import { UsersService } from '../users/users.service';
import { Role } from '../users/types/users.type';
import { UpdateUserAllDto } from '../users/dto/update-user.dto';

@Injectable()
export class SellerApplicationsService {
  constructor(
    @InjectModel(SellerApplication.name)
    private readonly sellerApplicationModel: Model<SellerApplication>,
    private readonly usersService: UsersService,
  ) {}

  async create(userId: string, dto: CreateSellerApplicationDto): Promise<SellerApplication> {
    const user = await this.usersService.findOne(userId);

    if (user.role === Role.PROVIDER) {
      throw new BadRequestException('User is already a provider');
    }
    if (user.role !== Role.CUSTOMER) {
      throw new ForbiddenException('Only customers can request to become a seller');
    }

    const pending = await this.sellerApplicationModel.findOne({
      user: new Types.ObjectId(userId),
      status: SellerApplicationStatus.PENDING,
    });
    if (pending) {
      throw new ConflictException('You already have a pending seller application');
    }

    const application = new this.sellerApplicationModel({
      ...dto,
      user: new Types.ObjectId(userId),
      status: SellerApplicationStatus.PENDING,
    });
    return application.save();
  }

  async findMine(userId: string): Promise<SellerApplication | null> {
    return this.sellerApplicationModel
      .findOne({ user: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async list(status?: string): Promise<SellerApplication[]> {
    const filter: Record<string, unknown> = {};
    if (status) {
      const statuses = status.split(',').map((s) => s.trim()).filter(Boolean);
      const valid = statuses.every((s) =>
        Object.values(SellerApplicationStatus).includes(s as SellerApplicationStatus),
      );
      if (!valid) {
        throw new BadRequestException('Invalid status filter');
      }
      filter.status = { $in: statuses };
    }
    return this.sellerApplicationModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async review(
    applicationId: string,
    adminId: string,
    dto: ReviewSellerApplicationDto,
  ): Promise<SellerApplication> {
    if (!Types.ObjectId.isValid(applicationId)) {
      throw new BadRequestException('Invalid seller application id');
    }

    // Prefer findOne + ObjectId: explicit @_id Prop in schema can make findById miss docs
    const application = await this.sellerApplicationModel
      .findOne({ _id: new Types.ObjectId(applicationId) })
      .exec();
    if (!application) {
      throw new NotFoundException('Seller application not found');
    }
    if (application.status !== SellerApplicationStatus.PENDING) {
      throw new BadRequestException('Only pending applications can be reviewed');
    }

    if (dto.status === 'rejected') {
      application.status = SellerApplicationStatus.REJECTED;
      application.rejectionReason = dto.rejectionReason || '';
      application.reviewedBy = new Types.ObjectId(adminId);
      application.reviewedAt = new Date();
      return application.save();
    }

    const providerData: UpdateUserAllDto = {
      role: Role.PROVIDER,
      isMessenger: false,
      stores: [],
      businesses: [],
      sellerProfile: {
        fullName: application.fullName,
        ci: application.ci,
        phone: application.phone,
        email: application.email,
        address: application.address,
        license: application.license,
      },
    };

    await this.usersService.saveUpdatedUser(application.user, providerData);

    application.status = SellerApplicationStatus.APPROVED;
    application.reviewedBy = new Types.ObjectId(adminId);
    application.reviewedAt = new Date();
    application.rejectionReason = undefined;
    return application.save();
  }
}
