import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Length } from "class-validator";

export class UserLoginDto {

  @ApiProperty({ example: 'user.example@email.com' })
  @IsNotEmpty()
  @IsString()
  readonly email: string;

  @ApiProperty({ example: 'pass1234' })
  @IsNotEmpty()
  @IsString()
  @Length(8, 50)
  readonly password: string;
}