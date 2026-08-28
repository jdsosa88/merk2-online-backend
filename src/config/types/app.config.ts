export const appConfig = () => ({
  app: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3001', 10),
    name: 'Merk2 Online',
    status: process.env.APP_STATUS || 'operational',
    apiVersion: process.env.APP_VERSION || '1.0.0',
  },
});