export class ApiResponseDto<T = any> {
  readonly timestamp: string;
  readonly message?: string;
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