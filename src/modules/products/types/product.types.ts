import { Types } from "mongoose";
import { User } from "src/modules/users/schemas/user.schema";

export enum ProductType {
  SIMPLE = 'simple',
  ADDON = 'addon',
}

export enum ProductColor {
  RED = 'red',
  GREEN = 'green',
  BLUE = 'blue',
  YELLOW = 'yellow',
  BLACK = 'black',
  WHITE = 'white',
  GRAY = 'gray',
  OTHER = 'other',
}

export interface AddProductImagesParams {
  productId: string;
  user: User;
  images: Express.Multer.File[];
}

export interface DeleteProductImagesParams {
  productId: string;
  user: User;
  imageIds: string[];
}