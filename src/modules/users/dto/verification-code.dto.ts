import { IsNotEmpty, IsNumberString, Length } from "class-validator";

export class VerificationCodeDto {   
    @IsNotEmpty() 
    @IsNumberString()
    @Length(6, 6)   
    readonly code: string;
}