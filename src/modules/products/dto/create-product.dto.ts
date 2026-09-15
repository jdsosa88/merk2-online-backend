import {
  IsString, IsNumber, IsOptional, IsArray, IsBoolean, IsEnum,
  IsMongoId, MinLength, MaxLength, Min, Max, ValidateNested, IsNotEmpty, ArrayMaxSize
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ProductType, ProductColor } from '../schemas/product.schema';
import { MoneyUtils } from 'src/common/utils/money.utils';

export class ProductVisualOptionInputDto {
  @ApiPropertyOptional({ description: 'Existing visual option id (required when updating an option)' })
  @IsOptional()
  @IsMongoId()
  _id?: string;

  @ApiProperty({ example: 'Floral dress', minLength: 1, maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  label: string;

  @ApiPropertyOptional({
    example: 0,
    description: 'Extra amount in decimal currency (e.g. 0 or 5.00)',
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceDelta?: number;

  @ApiPropertyOptional({ description: 'Image document id' })
  @IsOptional()
  @IsMongoId()
  image?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

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

  @ApiPropertyOptional({
    type: [String],
    description: 'Search tags for faster store lookup (phrases or keywords)',
    example: ['vestido azul flores blancas', 'estampado rojo azul verde'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  tags?: string[];

  @ApiProperty({ example: 299.99 })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  price: number;

  @ApiPropertyOptional({ example: 2.00 })
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

  @ApiPropertyOptional({
    example: 0.1,
    description: 'Peso influenciador para mensajería (0.1 = muy ligero, 2.5 = pesado)',
    default: 0.1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  influenceWeight?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Producto que requiere preparación (cakes, pizzas, etc.)' })
  @IsOptional()
  @IsBoolean()
  requiresElaboration?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Permite reservar el producto para un día/hora concreto' })
  @IsOptional()
  @IsBoolean()
  isReservable?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Exposes visual options and enabled store variety types on product detail',
  })
  @IsOptional()
  @IsBoolean()
  hasVarieties?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Exposes plate composition addons on product detail (simple products only)',
  })
  @IsOptional()
  @IsBoolean()
  hasAddons?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'For addon products: customer may increase quantity above plate base (1)',
  })
  @IsOptional()
  @IsBoolean()
  isReleased?: boolean;

  @ApiPropertyOptional({ type: [ProductVisualOptionInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVisualOptionInputDto)
  visualOptions?: ProductVisualOptionInputDto[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Store variety type ids enabled for this product',
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  enabledVarietyTypeIds?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Composition addon product ids (simple products only; shared across plates)',
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  addons?: string[];

  @ApiPropertyOptional({
    description: 'Optional parent product id (legacy; composition uses simple.addons[])',
  })
  @IsOptional()
  @IsString()
  @IsMongoId()
  parentProduct?: string;

  @ApiProperty({ example: 'PROD-001-SMART' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({ description: 'ID del store (punto de venta) al que pertenece el producto' })
  @IsMongoId()
  @IsNotEmpty()
  store: string;

  @ApiProperty({ description: 'ID de la categoría del producto' })
  @IsMongoId()
  @IsNotEmpty()
  category: string;

  static toCents(dto: CreateProductDto): CreateProductDto {
    return {
      ...dto,
      price: MoneyUtils.decimalToCents(dto.price),
      discountValue: dto.discountValue
        ? MoneyUtils.decimalToCents(dto.discountValue)
        : dto.discountPercent && dto.price > 0
          ? MoneyUtils.calculatePercentage(MoneyUtils.decimalToCents(dto.price), dto.discountPercent)
          : 0,
      discountPercent: dto.discountPercent
        ? Math.round(dto.discountPercent)
        : dto.discountValue && dto.price > 0
          ? MoneyUtils.calculatePercentageOfValue(
            MoneyUtils.decimalToCents(dto.discountValue),
            MoneyUtils.decimalToCents(dto.price)
          )
          : 0,
      visualOptions: dto.visualOptions?.map((option) => ({
        ...option,
        priceDelta: MoneyUtils.decimalToCents(option.priceDelta ?? 0),
      })),
    };
  }
}
