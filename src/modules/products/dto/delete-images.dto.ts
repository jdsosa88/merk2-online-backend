import { ApiPropertyOptional } from "@nestjs/swagger";
import { ArrayMaxSize, IsArray, IsNotEmpty, IsString } from "class-validator";

export class DeleteImagesDto {

  @ApiPropertyOptional({ type: [String], maxItems: 10 })
  @IsNotEmpty()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true }) 
  images: string[];

}