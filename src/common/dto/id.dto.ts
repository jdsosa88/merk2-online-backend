import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class IdDto {
  @ApiProperty({example: '68bec9fdb83564195e6aa63d'})
  @IsString()
  @IsNotEmpty()
  id: string;
}