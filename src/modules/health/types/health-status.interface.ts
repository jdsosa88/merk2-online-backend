import { AppConfig } from './app-config.interface';

export interface HealthStatus {
  status: 'operational' | 'maintenance';
  timestamp: string;
  service: string;
  apiVersion: string;
  environment: string;
  uptime: number;
  dependencies: {
    database: boolean;
  };
  appConfig: AppConfig;
}