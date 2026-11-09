import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: Number(process.env.PORT_MENU) || 3002,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/scan-and-dine-menu',
  jwtSecret: process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production',
};
