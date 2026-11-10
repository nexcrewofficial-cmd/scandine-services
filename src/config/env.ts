import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  serviceName: process.env.SERVICE_NAME || 'ALL', // 'ALL' (unified) or 'AUTH', 'MENU', 'ORDERS', 'WS'

  mongo: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/scan-and-dine',
    maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE) || 20,
  },
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/scan-and-dine',

  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  },
  redisHost: process.env.REDIS_HOST || '127.0.0.1',
  redisPort: Number(process.env.REDIS_PORT) || 6379,
  redisPassword: process.env.REDIS_PASSWORD || undefined,

  jwt: {
    secret: process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key_change_in_production',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  jwtSecret: process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key_change_in_production',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder',
  },
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder',

  corsOrigins: [
    process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:4000',
    process.env.NEXT_PUBLIC_WAITER_URL || 'http://localhost:4001',
    process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:4002',
    'http://localhost:3000',
  ],

  logLevel: process.env.LOG_LEVEL || 'info',
};
