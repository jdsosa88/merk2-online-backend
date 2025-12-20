import { GeolocationDto } from "src/common/dto/geolocation.dto";
import { UserRole } from "../schemas/user.schema";

export interface ICreateUser {  
    readonly firstName: string;
    readonly lastName: string;
    readonly email: string;  
    readonly googleId: string;
    readonly password: string;
    readonly phone?: string;  
    readonly role?: UserRole;
    readonly isActive: boolean;
    readonly isPhoneVerified: boolean;
    readonly geolocation?: GeolocationDto;
}