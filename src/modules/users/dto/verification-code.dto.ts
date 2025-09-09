import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumberString, Length } from "class-validator";

export class VerificationCodeDto {
    @ApiProperty({ minLength: 6, maxLength: 6, example: '123456' })  
    @IsNotEmpty() 
    @IsNumberString()
    @Length(6, 6)   
    readonly code: string;
}