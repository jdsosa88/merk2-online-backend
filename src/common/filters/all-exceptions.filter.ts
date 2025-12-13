import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ExceptionLoggerMessage } from '../interfaces/error.interface';
import { ErrorResponseDto } from '../dto/error-response.dto';
import { log } from 'console';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest<Request>();
    this.logError(exception, request.url);
    const errorResponse = this.getErrorResponse(exception);
    response.status(errorResponse.statusCode).json(errorResponse);
  }
  
  private logError(exception: unknown, path: string) {
    const stackLines = exception instanceof Error && exception.stack
      ? exception.stack.split('\n').map((line) => line.trim())
      : [];
    const errorContext = this.getOriginClass(stackLines);
    const loggerMessage: ExceptionLoggerMessage = {
      status: exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR,
      message: exception instanceof Error ? exception.message : 'Unknown Error',
      stack: stackLines,
      path: path,
      timestamp: new Date().toISOString(),
    };
    Logger.error(loggerMessage, errorContext);
  }

  private getOriginClass(stackLines?: string[]): string {
    if (stackLines) {
      for (const line of stackLines) {
        if (line.startsWith('at ')) {
          return line.substring(line.indexOf('at ') + 2, line.indexOf('.')).trim();
        }
      }
    }
    return 'Unknown origin';
  }

  private getErrorResponse(exception: unknown): ErrorResponseDto {
    let status: number;
    let error: string;
    let message: string;
    let data: any;    
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      error =
        (exception.getResponse() as any)?.response?.error
        || (exception.getResponse() as any)?.error
        || "Internal Server Error";
        
      } else {      
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      error = "Internal Server Error";
    }

   const messageOrData = (exception as any)?.response?.message || (exception as any)?.message || exception;
  
   if ( typeof messageOrData === 'string') {
    message = messageOrData;
    data = null;
   } else if (
    typeof messageOrData === 'object' 
    && Array.isArray(messageOrData) 
    && messageOrData.length > 0
    && typeof messageOrData[0] === 'string'
  ){
    message = messageOrData[0];
    data = messageOrData; 
   } else {
    message = 'An error occurred';
    data = messageOrData;
   }

    return {
      timestamp: new Date().toISOString(),
      statusCode: status,
      error,
      message,
      data,
    };
  }
}