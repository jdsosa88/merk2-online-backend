import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppConfig, AppConfigDocument } from './schemas/app-config.schema';
import { CreateAppConfigDto } from './dto/create-app-config.dto';
import { UpdateAppConfigDto } from './dto/update-app-config.dto';

@Injectable()
export class AppConfigService {
  constructor(
    @InjectModel(AppConfig.name) private appConfigModel: Model<AppConfig>,
  ) {}

  async create(createAppConfigDto: CreateAppConfigDto): Promise<AppConfig> {
    const existingConfig = await this.appConfigModel.findOne().exec();
    if (existingConfig) {
      throw new Error('App configuration already exists. Use update instead.');
    }
    
    const createdConfig = new this.appConfigModel(createAppConfigDto);
    return createdConfig.save();
  }

  async findOne(): Promise<AppConfig> {
    let config = await this.appConfigModel.findOne().exec();    
   
    if (!config) {
      config = await this.createDefaultConfig();
    }
    
    return config;
  }

  async update(updateAppConfigDto: UpdateAppConfigDto): Promise<AppConfig> {
    let config = await this.appConfigModel.findOne().exec();
    
    if (!config) {      
      config = await this.createDefaultConfig();
    }   
    
    if (updateAppConfigDto.android) {
      config.android = { ...config.android, ...updateAppConfigDto.android };
    }
    
    if (updateAppConfigDto.ios) {
      config.ios = { ...config.ios, ...updateAppConfigDto.ios };
    }
    
    return config.save();
  }

  async remove(): Promise<AppConfig> {
    const config = await this.appConfigModel.findOneAndDelete().exec();
    if (!config) {
      throw new NotFoundException('App configuration not found');
    }
    return config;
  }

  private async createDefaultConfig(): Promise<AppConfigDocument> {
    const defaultConfig: CreateAppConfigDto = {
      android: {
        buildNumber: '1',
        buildVersion: '1.0.0',
        minVersion: '1.0.0',
      },
      ios: {
        buildNumber: '1',
        buildVersion: '1.0.0',
        minVersion: '1.0.0',
      },
    };
    
    const createdConfig = new this.appConfigModel(defaultConfig);
    return createdConfig.save();
  }
}