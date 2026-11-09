import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: Number(process.env.PORT_AUTH) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/scan-and-dine-auth',
  jwtSecret: process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key_change_in_production',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
};
