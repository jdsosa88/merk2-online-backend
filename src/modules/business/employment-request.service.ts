
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EmploymentRequest, EmploymentRequestDocument } from './schemas/employment-request.schema';
import { Business, BusinessDocument } from './schemas/business.schema';
import { User } from '../users/schemas/user.schema';
import { Manager } from '../users/schemas/manager.schema';
import { Messenger } from '../users/schemas/messenger.schema';
import { UsersService } from '../users/users.service';
import { EmployeeType, EmploymentRequestStatus } from './types/employees.type';
import { Role } from '../users/types/users.type';
import { EmploymentRequestResponseDto } from './dto/employment-request-response.dto';

type EmploymentRequestResponseParams = {
  requestId: string;
  user: User;
  isAccepted: boolean;
}

type AcceptRequestParams = {
  request: EmploymentRequestDocument;
  user: User;
  business: BusinessDocument;
}

@Injectable()
export class EmploymentRequestService {
  constructor(
    @InjectModel(EmploymentRequest.name) private employmentRequestModel: Model<EmploymentRequest>,
    @InjectModel(Business.name) private businessModel: Model<Business>,
    private readonly usersService: UsersService,
  ) { }

  async manageEmploymentRequestResponse(params: EmploymentRequestResponseParams): Promise<EmploymentRequestResponseDto> {
    const request = await this.employmentRequestModel.findById(params.requestId);

    if (!request) {
      throw new NotFoundException('Employment request not found');
    }
console.log({req: request.user, user: params.user._id});

    if (request.user.toString() !== params.user._id.toString()) {
      throw new ForbiddenException('You can only accept your own employment requests');
    }

    if (request.status !== EmploymentRequestStatus.PENDING) {
      throw new BadRequestException(`Request is already ${request.status.toLowerCase()}`);
    }

    if (request.expiresAt && request.expiresAt < new Date()) {
      request.status = EmploymentRequestStatus.EXPIRED;
      await request.save();
      throw new BadRequestException('Employment request has expired');
    }

    const business = await this.businessModel.findById(request.business);
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    if (params.isAccepted === true) {
      return await this.acceptRequest({ request, user: params.user, business });
    }
    return await this.rejectRequest(request, business);
  }

  private async acceptRequest(params: AcceptRequestParams): Promise<EmploymentRequestResponseDto> {
    const { request, user, business } = params;
    
    if (user.role !== Role.CUSTOMER) {
      throw new BadRequestException('Only customers can accept employment requests');
    }

    let updatedUser;

    if (request.employeeType === EmployeeType.MANAGER) {      
      const updateData = {
        role: Role.MANAGER,
        business: business._id,
        isMessenger: false, // Por defecto
      };
      updatedUser = await this.usersService.saveUpdatedUser(user._id, updateData);
     
      if (!business.employees.managers.includes(updatedUser._id)) {
        business.employees.managers.push(updatedUser._id);
      }

    } else if (request.employeeType === EmployeeType.MESSENGER) {      
      const updateData = {
        role: Role.MESSENGER,
        businesses: [business._id],
        isPlatformMessenger: false,
      };
      updatedUser = await this.usersService.saveUpdatedUser(user._id, updateData);
      
      if (!business.employees.messengers.includes(updatedUser._id)) {
        business.employees.messengers.push(updatedUser._id);
      }
    }

    request.status = EmploymentRequestStatus.ACCEPTED;
    await request.save();
    
    business.employees.pendingEmployees = business.employees.pendingEmployees.filter(
      reqId => reqId.toString() !== request._id.toString()
    );
    await business.save();

    return {
      user: updatedUser,
      business,
      request,
    };
  }

  private async rejectRequest(request: EmploymentRequestDocument, business: BusinessDocument): Promise<EmploymentRequestResponseDto> {

    request.status = EmploymentRequestStatus.REJECTED;
    await request.save();

    business.employees.pendingEmployees = business.employees.pendingEmployees.filter(
      reqId => reqId.toString() !== request._id.toString()
    );
    await business.save();

    return {
      request,
    };
  }
}