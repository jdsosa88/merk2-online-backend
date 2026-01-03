// src/modules/business/services/employee.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Business, BusinessDocument } from './schemas/business.schema';
import { AddEmployeeDto } from './dto/add-employee.dto';
import { EmploymentRequest } from './schemas/employment-request.schema';
import { User } from '../users/schemas/user.schema';
import { Manager } from '../users/schemas/manager.schema';
import { Messenger } from '../users/schemas/messenger.schema';
import { UsersService } from '../users/users.service';
import { CreateManagerDto, CreateMessengerDto } from '../users/dto/create-user.dto';
import { BusinessStatus } from './types/business.type';
import { Role } from '../users/types/users.type';
import { AddEmployeeResponse, EmployeeType, EmploymentRequestStatus } from './types/employees.type';
import { generateRandomPassword } from 'src/common/utils/random-utils';
import { ICreateManager, ICreateMessenger } from '../users/types/users.interface';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectModel(Business.name) private businessModel: Model<Business>,
    @InjectModel(EmploymentRequest.name) private employmentRequestModel: Model<EmploymentRequest>,    
    private readonly usersService: UsersService,
  ) { }

  async addEmployee(
    businessId: string,
    addEmployeeDto: AddEmployeeDto,
    requestedByUserId: string
  ): Promise<AddEmployeeResponse> {
    const _id = new Types.ObjectId(businessId);
    const business = await this.businessModel.findById(_id);
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    if (business.status !== BusinessStatus.ACCEPTED) {
      throw new BadRequestException('Business must have status ACCEPTED to add employees');
    }

    const requestedByUser = await this.usersService.findOne(requestedByUserId);
    if (!requestedByUser) {
      throw new NotFoundException('User not found');
    }

    const isAdmin = requestedByUser.role === Role.ADMIN;
    const isOwner = business.owner.toString() === requestedByUserId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('Only business owner or admin can add employees');
    }

    if(!business.employees){
      business.employees = {
        messengers: [],
        managers: [],
        pendingEmployees: [],
      }
    }

    let employeeUser = await this.usersService.findByEmail(addEmployeeDto.email.toLowerCase(), false);

    if (!employeeUser) {
      return await this.createNewEmployeeAndAddToBusiness(business, addEmployeeDto, requestedByUserId, isAdmin);
    }

    return await this.handleExistingUser(business, employeeUser, addEmployeeDto, requestedByUserId, isAdmin);
  }

  private async createNewEmployeeAndAddToBusiness(
    business: BusinessDocument,
    addEmployeeDto: AddEmployeeDto,
    requestedByUserId: string,
    isAdmin: boolean
  ): Promise<AddEmployeeResponse> {
    
    if (!addEmployeeDto.firstName || !addEmployeeDto.lastName) {
      throw new BadRequestException('First name and last name are required to create a new user');
    }

    let newUser;
    const tempPassword = generateRandomPassword();

    if (addEmployeeDto.employeeType === EmployeeType.MANAGER) {
      const createManagerDto: ICreateManager = {
        firstName: addEmployeeDto.firstName,
        lastName: addEmployeeDto.lastName,
        email: addEmployeeDto.email,
        password: tempPassword,
        phone: addEmployeeDto.phone,
        isActive: true,
        role: Role.MANAGER,
        isMessenger: addEmployeeDto.isMessenger || false,
        business: business._id,
      };
      newUser = await this.usersService.create(createManagerDto, Role.MANAGER);

      if (!business.employees.managers.includes(newUser._id)) {
        business.employees.managers.push(newUser._id);
      }

    } else if (addEmployeeDto.employeeType === EmployeeType.MESSENGER) {
      const createMessengerDto: ICreateMessenger = {
        firstName: addEmployeeDto.firstName,
        lastName: addEmployeeDto.lastName,
        email: addEmployeeDto.email,
        password: tempPassword,
        phone: addEmployeeDto.phone,
        isActive: true,
        role: Role.MESSENGER,
        isPlatformMessenger: isAdmin ? (addEmployeeDto.isPlatformMessenger || false) : false,
        businesses: [business._id],
      };
      newUser = await this.usersService.create(createMessengerDto, Role.MESSENGER);

      if (!business?.employees?.messengers?.includes(newUser._id)) {
        business.employees.messengers.push(newUser._id);
      }
    }

    await business.save();

    // TODO: Enviar email al nuevo usuario con la contraseña temporal e instrucciones

    return {      
      message: `New ${addEmployeeDto.employeeType.toLowerCase()} created and added to business successfully. Temporary password sent to email.`,
      addEmployeeResponseDto: {
        business,
      }
    };
  }

  private async handleExistingUser(
    business: BusinessDocument,
    employeeUser: User,
    addEmployeeDto: AddEmployeeDto,
    requestedByUserId: string,
    isAdmin: boolean
  ): Promise<AddEmployeeResponse> {

    if (employeeUser.role === Role.CUSTOMER) {
      return await this.createEmploymentRequest(business, employeeUser, addEmployeeDto, requestedByUserId);
    }

    if (addEmployeeDto.employeeType === EmployeeType.MANAGER) {
      if (employeeUser.role !== Role.MANAGER) {
        throw new BadRequestException(`User is ${employeeUser.role}, cannot be assigned as Manager`);
      }
      const manager = employeeUser as Manager;

      if (manager.business) {
        throw new BadRequestException('Manager is already assigned to a business');
      }

      manager.business = business._id;
      await this.usersService.saveUpdatedUser(manager._id, manager);

      if (!business.employees.managers.includes(employeeUser._id)) {
        business.employees.managers.push(employeeUser._id);
      }

      await business.save();
      return {
        message: 'Manager added to business successfully',
        addEmployeeResponseDto: { business }
      };

    } else if (addEmployeeDto.employeeType === EmployeeType.MESSENGER) {
      if (employeeUser.role !== Role.MESSENGER) {
        throw new BadRequestException(`User is ${employeeUser.role}, cannot be assigned as Messenger`);
      }

      const messenger = employeeUser as Messenger;

      if (messenger.isPlatformMessenger && !isAdmin) {
        throw new ForbiddenException('Only admin can assign platform messengers');
      }

      if (messenger.businesses.includes(business._id)) {
        throw new BadRequestException('Messenger is already associated with this business');
      }

      if (!messenger.isPlatformMessenger) {
        const otherBusinesses = await this.businessModel.find({
          _id: { $in: messenger.businesses },
          owner: business.owner
        });

        if (otherBusinesses.length !== messenger.businesses.length) {
          throw new BadRequestException('Messenger is already working for a different provider');
        }
      }

      messenger.businesses.push(business._id);
      this.usersService.update(messenger._id.toString(), {businesses: messenger.businesses});

      if (!business.employees.messengers.includes(employeeUser._id)) {
        business.employees.messengers.push(employeeUser._id);
      }

      await business.save();
      return {
        message: 'Messenger added to business successfully',
        addEmployeeResponseDto: { business }
      };
    }

    throw new BadRequestException('Invalid employee type or user role');
  }

  private async createEmploymentRequest(
    business: BusinessDocument,
    employeeUser: User,
    addEmployeeDto: AddEmployeeDto,
    requestedByUserId: string
  ): Promise<AddEmployeeResponse> {

    const existingRequest = await this.employmentRequestModel.findOne({
      business: business._id,
      user: employeeUser._id,
      status: EmploymentRequestStatus.PENDING
    });

    if (existingRequest) {
      throw new BadRequestException('A pending employment request already exists for this user');
    }


    const employmentRequest = new this.employmentRequestModel({
      business: business._id,
      user: employeeUser._id,
      employeeType: addEmployeeDto.employeeType,
      status: EmploymentRequestStatus.PENDING,
      invitedBy: new Types.ObjectId(requestedByUserId),
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Expira en 3 días
    });

    await employmentRequest.save();
    
    if (!business.employees.pendingEmployees.includes(employmentRequest._id)) {
      business.employees.pendingEmployees.push(employmentRequest._id);
    }
    await business.save();

    // TODO: Enviar notificación al usuario (email, push, etc.)

    return {
      message: `Employment request sent to ${employeeUser.email}. User must accept the offer to become ${addEmployeeDto.employeeType.toLowerCase()}.`,
      addEmployeeResponseDto: {
        business,
        employmentRequest,
      }
    };
  }
}