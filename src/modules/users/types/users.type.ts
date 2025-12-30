export enum Role {
  ADMIN = 'ADMIN',
  PROVIDER = 'PROVIDER',
  MANAGER = 'MANAGER',
  MESSENGER = 'MESSENGER',
  CUSTOMER = 'CUSTOMER',
}
export type UserRole = keyof typeof Role;