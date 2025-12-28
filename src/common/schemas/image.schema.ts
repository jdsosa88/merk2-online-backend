import { Prop, Schema } from "@nestjs/mongoose";

@Schema({ _id: false })
export class Image {
  @Prop({
    type: String,
    required: false,
  })
  filename?: string;

  @Prop({
    type: String,
    required: false,
  })
  mimeType?: string;

  @Prop({
    type: String,
    required: false,
  })
  size?: string;

  @Prop({
    type: String,
    required: false,
  })
  url?: string;
}