import { Prop, Schema } from "@nestjs/mongoose";

@Schema({ _id: false })
export class Geolocation {
  @Prop({
    type: String,
    required: true,
    maxlength: 250,
  })
  address: string;
  
  @Prop({
    type: Number,
    default: null,
  })
  latitude: number | null;
  
  @Prop({
    type: Number,
    default: null,
  })
  longitude: number | null;
}