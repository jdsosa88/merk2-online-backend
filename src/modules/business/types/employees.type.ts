import { Role } from "src/modules/users/types/users.type";
import { AddEmployeeResponseDto } from "../dto/add-employee-response.dto";

export enum EmploymentRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted', 
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

export enum EmployeeType {
  MANAGER = Role.MANAGER,
  MESSENGER = Role.MESSENGER,
}

export type AddEmployeeResponse = {
  message: string;
  addEmployeeResponseDto: AddEmployeeResponseDto;
}