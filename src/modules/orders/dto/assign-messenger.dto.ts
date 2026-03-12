import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class AssignMessengerDto {
  @ApiProperty({
    description: 'Order ID to assign the messenger',
    example: '60d5f9f8f8b7a12c3c4d3eTq'
  })
  @IsMongoId()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({
    description: 'Messenger ID to assign to the order',
    example: '60d5f9f8f8b7a12c3c4d5e6f'
  })
  @IsMongoId()
  @IsNotEmpty()
  messengerId: string;
}