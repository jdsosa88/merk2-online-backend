export interface HealthStatus {
  status: 'operational' | 'maintenance';
  timestamp: string;
  service: string;
  version: string;
  environment: string;
  uptime: number;
  dependencies: {
    database: boolean;
  };
}