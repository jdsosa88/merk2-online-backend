import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ProductType, ProductColor } from '../schemas/product.schema';
import { Image } from 'src/common/schemas/image.schema';

class AddonProductDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  finalPrice: number;

  @ApiProperty()
  sku: string;

  @ApiProperty()
  isAvailable: boolean;
}

class BusinessInfoDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  name: string;
}

class CategoryInfoDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  level: number;
}

export class ProductResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ enum: ProductType })
  type: ProductType;

  @ApiProperty({ required: false })
  brand?: string;

  @ApiProperty()
  price: number;

  @ApiProperty({ type: [Image] })
  @Type(() => Image)
  images: Image[];

  @ApiProperty({ required: false })
  discountValue?: number;

  @ApiProperty({ required: false })
  discountPercent?: number;

  @ApiProperty()
  finalPrice: number;

  @ApiProperty({ required: false })
  warranty?: string;

  @ApiProperty({ required: false })
  size?: string;

  @ApiProperty({ enum: ProductColor, isArray: true })
  colors: ProductColor[];

  @ApiProperty({ required: false })
  weight?: string;

  @ApiProperty()
  stock: number;

  @ApiProperty()
  isAvailable: boolean;

  @ApiProperty({ type: [AddonProductDto], required: false })
  @Type(() => AddonProductDto)
  addons?: AddonProductDto[];

  @ApiProperty({ required: false })
  parentProduct?: string;

  @ApiProperty()
  sku: string;

  @ApiProperty({ type: BusinessInfoDto })
  @Type(() => BusinessInfoDto)
  business: BusinessInfoDto;

  @ApiProperty({ type: CategoryInfoDto })
  @Type(() => CategoryInfoDto)
  category: CategoryInfoDto;

  @ApiProperty()
  timesOrdered: number;

  @ApiProperty()
  averageRating: number;

  @ApiProperty()
  totalReviews: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}