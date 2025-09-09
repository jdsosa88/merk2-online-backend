import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ApiResponseDto<T = any> {
  @ApiProperty()
  readonly timestamp: string;

  @ApiPropertyOptional()
  readonly message?: string;

  @ApiPropertyOptional()
  readonly data?: T;


  
  constructor(messageOrData?: string | T, data?: T) {
    this.timestamp = new Date().toISOString();
    if (typeof messageOrData === 'string') {
      this.message = messageOrData;
      this.data = data;
    } else {
      this.data = messageOrData as T;
    }
  }
}