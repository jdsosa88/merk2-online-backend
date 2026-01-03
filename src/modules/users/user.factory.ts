import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { CreateManagerDto, CreateMessengerDto, CreateProviderDto } from "./dto/create-user.dto";
import { User } from "./schemas/user.schema";
import { Provider } from "./schemas/provider.schema";
import { Manager } from "./schemas/manager.schema";
import { Messenger } from "./schemas/messenger.schema";
import { Model, Types } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import * as bcrypt from 'bcrypt';
import { ChangeRoleParams, CreateUserParams, SchemaData, UpdateUserParams } from "./types/user-factory.type";
import { Geolocation } from "src/common/schemas/geolocation.schema";
import { GeolocationDto } from "src/common/dto/geolocation.dto";
import { IUpdateUserDto } from "./types/users.interface";
import { ImageDto } from "src/common/dto/image.dto";
import { Image } from "src/common/schemas/image.schema";
import { Role, UserRole } from "./types/users.type";


@Injectable()
export class UserFactory {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Provider.name) private providerModel: Model<Provider>,
    @InjectModel(Manager.name) private managerModel: Model<Manager>,
    @InjectModel(Messenger.name) private messengerModel: Model<Messenger>,
  ) { }

  async createUser(params: CreateUserParams): Promise<User> {
    const { createUserDto } = params;
    const { role, password, ...userData } = createUserDto;
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    switch (role) {
      case Role.ADMIN:
      case Role.CUSTOMER:
        const user = new this.userModel({
          ...userData,
          password: hashedPassword,
          role,
        });
        return await user.save();

      case Role.PROVIDER:
        const providerDto = createUserDto as CreateProviderDto;
        const provider = new this.providerModel({
          ...providerDto,
          password: hashedPassword,
          role,
        });
        return await provider.save();

      case Role.MANAGER:
        const managerDto = createUserDto as CreateManagerDto;
        const manager = new this.managerModel({
          ...managerDto,
          password: hashedPassword,
          role,
        });
        return await manager.save();

      case Role.MESSENGER:
        const messengerDto = createUserDto as CreateMessengerDto;
        const messenger = new this.messengerModel({
          ...messengerDto,
          password: hashedPassword,
          role,
        });
        return await messenger.save();

      default:
        throw new BadRequestException('Invalid or restricted user role');
    }
  }

  async updateUser(params: UpdateUserParams): Promise<User> {
    const { updateUserDto, userId } = params;

    const user = await this.getValidatedCustomerUser(userId);
    if (!user) throw new NotFoundException(`User with id: ${userId} not found`);

    updateUserDto.password = updateUserDto.password
      ? await bcrypt.hash(updateUserDto.password, 10)
      : undefined;

    const isRoleInDto = updateUserDto.role ? true : false;
    const hasDifferentRole = isRoleInDto && updateUserDto.role != user.role;

    const isAdminOrCustomerDto =
      isRoleInDto && (updateUserDto.role === Role.ADMIN || updateUserDto.role === Role.CUSTOMER);
    const isAdminOrCustomerSchema =
      user.role === Role.ADMIN || user.role === Role.CUSTOMER ? true : false;

    if (!hasDifferentRole || (isAdminOrCustomerDto && isAdminOrCustomerSchema)) {
      return this.updateUserWithoutSchemaChange({ updateUserDto, userId }, user.role)
    }
    return await this.updateUserWithSchemaChange({ updateUserDto, existentUser: user });
  }

  private async getValidatedCustomerUser(userId: Types.ObjectId): Promise<User> {
    const user = await this.userModel.findById(userId).select('+password').exec();
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user.toObject();
  }

  private async updateUserWithoutSchemaChange(params: UpdateUserParams, role: UserRole): Promise<User> {
    const { updateUserDto, userId } = params;

    switch (role) {
      case Role.CUSTOMER:
      case Role.ADMIN:
        const updatedUser = await this.userModel.findByIdAndUpdate(
          userId,
          updateUserDto,
          { new: true }
        ).exec();
        if (!updatedUser) throw new NotFoundException(`User with id: ${userId} not found`);
        return updatedUser;

      case Role.PROVIDER:
        const updatedProvider = await this.providerModel.findByIdAndUpdate(
          userId,
          updateUserDto,
          { new: true }
        ).exec();
        if (!updatedProvider) throw new NotFoundException(`Provider with id: ${userId} not found`);
        return updatedProvider;

      case Role.MANAGER:
        const updatedManager = await this.managerModel.findByIdAndUpdate(
          userId,
          updateUserDto,
          { new: true }
        ).exec();
        if (!updatedManager) throw new NotFoundException(`Manager with id: ${userId} not found`);
        return updatedManager;

      case Role.MESSENGER:
        const updatedMessenger = await this.messengerModel.findByIdAndUpdate(
          userId,
          updateUserDto,
          { new: true }
        ).exec();
        if (!updatedMessenger) throw new NotFoundException(`Messenger with id: ${userId} not found`);
        return updatedMessenger;

      default:
        throw new BadRequestException('Invalid or restricted user role');
    }
  }

  private async updateUserWithSchemaChange(params: ChangeRoleParams): Promise<User> {
    const updateData = this.getSchemaModelData(params);
    const updatedUser = await this.updateToOtherSchema(params.existentUser._id, updateData);
    return updatedUser;
  }

  private getSchemaModelData(params: ChangeRoleParams) {
    const { updateUserDto, existentUser } = params;
    const baseUser: User = {
      _id: existentUser._id,
      email: updateUserDto.email ? updateUserDto.email : existentUser.email,
      firstName: updateUserDto.firstName ? updateUserDto.firstName : existentUser.firstName,
      lastName: updateUserDto.lastName ? updateUserDto.lastName : existentUser.lastName,
      password: updateUserDto.password ? updateUserDto.password : existentUser.password,
      isActive: updateUserDto.isActive ? updateUserDto.isActive : existentUser.isActive,
      phone: updateUserDto.phone ? updateUserDto.phone : existentUser.phone,
      isPhoneVerified: updateUserDto.isPhoneVerified
        ? updateUserDto.isPhoneVerified
        : existentUser.isPhoneVerified,
      geolocation: updateUserDto.geolocation
        ? this.getGeolocationFromDto(updateUserDto.geolocation)
        : existentUser.geolocation,
      avatar: updateUserDto.avatar
        ? this.getImageFromDto(updateUserDto.avatar)
        : existentUser.avatar,
      role: updateUserDto.role ? updateUserDto.role : existentUser.role,
      googleId: (updateUserDto as IUpdateUserDto).googleId
        ? (updateUserDto as IUpdateUserDto).googleId
        : existentUser.googleId,
    }

    const discriminator = this.getShemaDiscriminator(updateUserDto.role);

    const updateData: SchemaData = {
      ...updateUserDto,
      ...(discriminator !== null && { __t: discriminator }),
      ...baseUser,
    };
    return updateData;
  }

  private getGeolocationFromDto(geolocationDto: GeolocationDto): Geolocation | undefined {
    if (!geolocationDto) return undefined;
    return {
      address: geolocationDto.address,
      latitude: geolocationDto.latitude ? geolocationDto.latitude : null,
      longitude: geolocationDto.longitude ? geolocationDto.longitude : null,
    }
  }

  private getImageFromDto(imageDto: ImageDto): Image | undefined {
    if (!imageDto) return undefined;
    return {
      filename: imageDto.filename,
      mimeType: imageDto.mimeType,
      size: imageDto.size,
      url: imageDto.url,
    };
  }

  private getShemaDiscriminator(role: UserRole | undefined): string | null {
    switch (role) {
      case Role.PROVIDER:
        return "Provider";
      case Role.MANAGER:
        return "Manager";
      case Role.MESSENGER:
        return "Messenger";
      default:
        return null;
    }
  }

  private async updateToOtherSchema(
    userId: Types.ObjectId,
    schemaData: SchemaData
  ): Promise<User> {
    try {
      await this.userModel.findByIdAndDelete(userId);

      switch (schemaData.role) {
        case Role.ADMIN:
        case Role.CUSTOMER:
          const user = new this.userModel(schemaData);
          return await user.save();

        case Role.PROVIDER:
          const provider = new this.providerModel(schemaData);
          return await provider.save();

        case Role.MANAGER:
          const manager = new this.managerModel(schemaData);
          return await manager.save();

        case Role.MESSENGER:
          const messenger = new this.messengerModel(schemaData);
          return await messenger.save();

        default:
          throw new BadRequestException('Invalid or restricted user role');
      }
    } catch (error) {
      throw new BadRequestException(`Error changing to other role${error.message ? `: ${error.message}` : ''}`);
    }
  }
}