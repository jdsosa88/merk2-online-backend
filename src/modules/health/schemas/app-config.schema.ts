import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AppConfigDocument = HydratedDocument<AppConfig>;

@Schema({ _id: false, timestamps: false })
export class AppPlatformConfig {
  @Prop({ required: true, default: '1' })
  buildNumber: string;

  @Prop({ required: true, default: '1.0.0' })
  buildVersion: string;

  @Prop({ required: true, default: '1.0.0' })
  minVersion: string;
}

@Schema({ collection: 'app_configs', timestamps: true })
export class AppConfig { 
  @Prop({ type: AppPlatformConfig, required: true })
  android: AppPlatformConfig;

  @Prop({ type: AppPlatformConfig, required: true })
  ios: AppPlatformConfig;
}

export const AppPlatformConfigSchema = SchemaFactory.createForClass(AppPlatformConfig);
export const AppConfigSchema = SchemaFactory.createForClass(AppConfig);