export interface ExceptionLoggerMessage {
  readonly status: number;
  readonly message: string;
  readonly stack: string[];
  readonly path: string;
  readonly timestamp: string;
}