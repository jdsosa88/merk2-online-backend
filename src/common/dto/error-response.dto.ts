export class ErrorResponseDto {
  timestamp: string;
  statusCode: number;
  error: string;
  message: string;
  data?: any;
}