import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // App
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(3001),
  APP_STATUS: Joi.string()
    .valid('operational', 'maintenance')
    .default('operational'),
  API_VERSION: Joi.string().default('1.0.0'),

  // Database (REQUERIDO)
  MONGO_URI: Joi.string().uri().required(),

  // Api key Auth
  API_KEY:Joi.string().min(32).required(),
  
  // JWT Auth (REQUERIDO)
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRATION: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRATION: Joi.string().default('1d'),

  // Google OAuth (opcional para desarrollo)
  GOOGLE_CLIENT_ID: Joi.string().optional(),
  GOOGLE_CLIENT_SECRET: Joi.string().optional(),
  GOOGLE_CALLBACK_URL: Joi.string().uri().optional(),

  // Mailer (REQUERIDO para producción)
  MAILER_HOST: Joi.string().hostname().required(),
  MAILER_PORT: Joi.number().port().default(587),
  MAILER_SECURE: Joi.boolean().default(false),
  MAILER_AUTH_USER: Joi.string().email().required(),
  MAILER_AUTH_PASS: Joi.string().required(),
  MAILER_EMAIL_FROM_NAME: Joi.string().required(),
  MAILER_EMAIL_FROM_DOMAIN: Joi.string().email().required(),

  // Business
  BUSINESS_MAX_EMPLOYEES: Joi.number().integer().min(1).max(500).default(50),
  BUSINESS_MAX_PRODUCTS: Joi.number().integer().min(1).max(10000).default(1000),
  // Products
  PRODUCT_MAX_IMAGES: Joi.number().integer().min(1).max(50).default(10),
  // Users
  USER_PHONE_VERIFICATION_REQUIRED: Joi.boolean().default(true),
  //VerificationCode
  VERIFICATION_CODE_EXPIRES_HOURS: Joi.number().integer().min(1).max(72).default(3),

  // Expo Push (opcional; recomendado en producción)
  EXPO_ACCESS_TOKEN: Joi.string().optional(),
});