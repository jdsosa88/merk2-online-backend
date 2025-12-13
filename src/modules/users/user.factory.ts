import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { CreateManagerDto, CreateMessengerDto, CreateProviderDto, CreateUserDto } from "./dto/create-user.dto";
import { Role, User } from "./schemas/user.schema";
import { Provider } from "./schemas/provider.schema";
import { Manager } from "./schemas/manager.schema";
import { Messenger } from "./schemas/messenger.schema";
import { Model, Types } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { Geolocation } from "src/common/schemas/geolocation.schema";
import * as bcrypt from 'bcrypt';
import { ConvertToProviderDto } from "./dto/update-user.dto";

export type CreateUserFactoryDto = CreateUserDto | CreateProviderDto | CreateManagerDto | CreateMessengerDto;
type ProviderData = {
  role: Role,
  __t: string,
  isMessenger?: boolean,
  businesses?: Types.ObjectId[],
}

@Injectable()
export class UserFactory {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Provider.name) private providerModel: Model<Provider>,
    @InjectModel(Manager.name) private managerModel: Model<Manager>,
    @InjectModel(Messenger.name) private messengerModel: Model<Messenger>,
  ) { }

  async createUser(createUserDto: CreateUserFactoryDto): Promise<User> {
    const { role, password, geolocation, ...userData } = createUserDto;
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    switch (role) {
      case Role.PROVIDER:
        const providerDto = createUserDto as CreateProviderDto;
        const provider = new this.providerModel({
          ...providerDto,
          password: hashedPassword,
          geolocation: geolocation as Geolocation,
          role,
        });
        return await provider.save();

      case Role.MANAGER:
        const managerDto = createUserDto as CreateManagerDto;
        const manager = new this.managerModel({
          ...managerDto,
          password: hashedPassword,
          geolocation: geolocation as Geolocation,
          role,
        });
        return await manager.save();

      case Role.MESSENGER:
        const messengerDto = createUserDto as CreateMessengerDto;
        const messenger = new this.messengerModel({
          ...messengerDto,
          password: hashedPassword,
          geolocation: geolocation as Geolocation,
          role,
        });
        return await messenger.save();

      case Role.ADMIN:
      case Role.CUSTOMER:
        const user = new this.userModel({
          ...userData,
          password: hashedPassword,
          geolocation: geolocation as Geolocation,
          role,
        });
        return await user.save();

      default:
        throw new BadRequestException('Invalid or restricted user role');
    }
  }

  async convertUserToProvider(
    userId: Types.ObjectId,
    convertToProviderDto: ConvertToProviderDto
  ): Promise<Provider> {

    const customer = await this.getValidatedCustomerUser(userId);
    const updateData = this.getProviderModelData(convertToProviderDto, customer);
    const provider = this.updateCustomerToProvider(userId, updateData);
    return provider;

  }

  private async getValidatedCustomerUser(userId: Types.ObjectId): Promise<User> {    
    const user = await this.userModel.findById(userId).select('+password').exec();
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (user.role !== Role.CUSTOMER) {
      throw new BadRequestException('Solo usuarios CUSTOMER pueden convertirse en PROVIDER');
    }
    return user.toObject();
  }

  private getProviderModelData(
    convertToProviderDto: ConvertToProviderDto,
    customer: User
  ) {
    const updateData: ProviderData = {
      ...customer,
      role: Role.PROVIDER,
      __t: 'Provider',
      isMessenger: convertToProviderDto.isMessenger || false,
      businesses: convertToProviderDto.businesses || [],
    };
    return updateData;
  }

  private async updateCustomerToProvider(
    userId: Types.ObjectId,
    providerData: ProviderData
  ) {
    try {

      await this.userModel.findByIdAndDelete(userId);
      const provider = new this.providerModel(providerData);
      provider._id = userId; 
      await provider.save();
      return provider;
    } catch (error) {
      console.log(error);
      throw new BadRequestException("Error al convertir a Provider");
    }
  }

}