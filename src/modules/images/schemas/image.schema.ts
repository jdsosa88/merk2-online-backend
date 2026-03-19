import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ImageDocument = HydratedDocument<Image>;

export enum ImageProvider {
  LOCAL = 'local',
  EXTERNAL = 'external',
}

@Schema({ timestamps: true })
export class Image {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({
    required: false,
    unique: true,
    sparse: true,
    index: true,
  })
  filename?: string;

  @Prop({ required: false })
  mimeType?: string;

  @Prop({ required: false })
  size?: number;

  @Prop({ required: true })
  url: string;

  @Prop({ required: false })
  alt?: string;

  @Prop({ enum: ImageProvider, default: ImageProvider.LOCAL })
  provider: ImageProvider;
}

export const ImageSchema = SchemaFactory.createForClass(Image);