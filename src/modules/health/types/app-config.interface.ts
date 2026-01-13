export interface AppPlatformConfig {
  buildNumber: string;
  buildVersion: string;
  minVersion: string;
}

export interface AppConfig {  
  android: AppPlatformConfig;
  ios: AppPlatformConfig;  
}