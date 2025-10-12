
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const statusCode = response.statusCode;
    const endpoint = `${request.method} ${request.originalUrl}`;
    const ip = `ip: ${request.ip}`;
    const controllerName = context.getClass().name;
    const now = Date.now();
    
    return next
      .handle()
      .pipe(
        tap(() => Logger.log(`${endpoint} status: ${statusCode} ${ip} duration: +${Date.now() - now}ms`, controllerName))
      );
  }
}
