import { IsNotEmpty, IsString } from "class-validator";

export class IdDto {
  @IsNotEmpty()
  @IsString()
  id: string;
}