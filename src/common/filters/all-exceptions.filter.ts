import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { error } from 'console';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    console.error(exception);

    let status, error;
     if (exception instanceof HttpException) {
      status = exception.getStatus();
      error = 
        (exception.getResponse() as any)?.response?.error 
        || (exception.getResponse() as any)?.error 
        || "Internal server error";
      
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      error = "Internal server error";
    }

    response.status(status).json({
      timestamp: new Date().toISOString(),
      statusCode: status,
      error,
      message: (exception as any)?.response?.message || (exception as any)?.message || exception,      
    });
  }
}