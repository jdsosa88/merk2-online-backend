import { IsNotEmpty, IsString } from "class-validator";

export class FindByFilenameDto {
  @IsNotEmpty()
  @IsString()
  filename: string;
}