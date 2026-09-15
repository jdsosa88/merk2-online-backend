import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsMongoId,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { DeliveryQuoteItemDto } from '../../delivery/dto/delivery-quote.dto';

export class PosDeliveryQuoteDto {
  @ApiProperty({ description: 'Store registering the POS / phone order' })
  @IsMongoId()
  @IsNotEmpty()
  storeId: string;

  @ApiProperty({ description: 'Selected delivery zone for the phone order' })
  @IsMongoId()
  @IsNotEmpty()
  deliveryZoneId: string;

  @ApiProperty({ type: [DeliveryQuoteItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DeliveryQuoteItemDto)
  items: DeliveryQuoteItemDto[];
}
