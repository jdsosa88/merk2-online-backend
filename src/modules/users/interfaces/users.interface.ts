import { UserRole } from "../schemas/user.schema";

export interface ICreateUser {  
    readonly firstName: string;
    readonly lastName: string;
    readonly email: string;  
    readonly password: string;
    readonly phone?: string;  
    readonly role?: UserRole;
    readonly isActive: boolean;
    readonly isPhoneVerified: boolean;
}