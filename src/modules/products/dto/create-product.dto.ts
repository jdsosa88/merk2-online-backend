import { 
  IsString, IsNumber, IsOptional, IsArray, IsBoolean, IsEnum, 
  IsMongoId, MinLength, MaxLength, Min, Max, ArrayMinSize, 
  ValidateNested, ArrayMaxSize, IsNotEmpty 
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ImageDto } from 'src/common/dto/image.dto';
import { ProductType, ProductColor } from '../schemas/product.schema';

export class CreateProductDto {
  @ApiProperty({ minLength: 2, maxLength: 150, example: 'Smartphone XYZ' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ maxLength: 250, example: 'High-quality smartphone with advanced features' })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  description?: string;

  @ApiProperty({ enum: ProductType, example: ProductType.SIMPLE })
  @IsEnum(ProductType)
  @IsNotEmpty()
  type: ProductType;

  @ApiPropertyOptional({ maxLength: 50, example: 'BrandX' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  brand?: string;

  @ApiProperty({ example: 299.99 })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  price: number;

  @ApiPropertyOptional({ type: [ImageDto], maxItems: 10 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => ImageDto)
  images?: ImageDto[];

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountValue?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @ApiPropertyOptional({ maxLength: 100, example: '2 years manufacturer warranty' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  warranty?: string;

  @ApiPropertyOptional({ maxLength: 50, example: 'Medium' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  size?: string;

  @ApiPropertyOptional({ enum: ProductColor, isArray: true, example: [ProductColor.BLACK, ProductColor.WHITE] })
  @IsOptional()
  @IsArray()
  @IsEnum(ProductColor, { each: true })
  colors?: ProductColor[];

  @ApiPropertyOptional({ maxLength: 50, example: '150g' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  weight?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ type: [String], description: 'IDs de productos agregos (solo para tipo SIMPLE)' })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  addons?: string[];

  @ApiPropertyOptional({ description: 'ID del producto padre (solo para tipo ADDON)' })
  @IsOptional()
  @IsString()
  @IsMongoId()
  parentProduct?: string;

  @ApiProperty({ example: 'PROD-001-SMART' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({ description: 'ID del business al que pertenece el producto' })
  @IsMongoId()
  @IsNotEmpty()
  business: string;

  @ApiProperty({ description: 'ID de la categoría del producto' })
  @IsMongoId()
  @IsNotEmpty()
  category: string;
}