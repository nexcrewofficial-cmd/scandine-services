import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: Number(process.env.PORT_ORDERS) || 3003,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/scan-and-dine-orders',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock_key',
  jwtSecret: process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production',
};
