import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { EmployeeType, EmploymentRequestStatus } from "../types/employees.type";

export type EmploymentRequestDocument = HydratedDocument<EmploymentRequest>;

@Schema({ 
  collection: "employment_requests",
  timestamps: true 
})
export class EmploymentRequest {
  @Prop({ type: Types.ObjectId, ref: 'Business', required: true })
  business: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ 
    type: String, 
    required: true,
    enum: [EmployeeType.MANAGER, EmployeeType.MESSENGER]
  })
  employeeType: EmployeeType;

  @Prop({
    type: String,
    required: true,
    enum: [EmploymentRequestStatus.PENDING, EmploymentRequestStatus.ACCEPTED, EmploymentRequestStatus.REJECTED, EmploymentRequestStatus.EXPIRED],
    default: EmploymentRequestStatus.PENDING
  })
  status: EmploymentRequestStatus;

  @Prop({ type: Date })
  expiresAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  invitedBy: Types.ObjectId;
}

export const EmploymentRequestSchema = SchemaFactory.createForClass(EmploymentRequest);