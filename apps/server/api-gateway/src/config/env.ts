import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: Number(process.env.PORT_GATEWAY) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  services: {
    auth: process.env.URL_SERVICE_AUTH || 'http://localhost:3001',
    menu: process.env.URL_SERVICE_MENU || 'http://localhost:3002',
    orders: process.env.URL_SERVICE_ORDERS || 'http://localhost:3003',
    websockets: process.env.URL_SERVICE_WEBSOCKETS || 'http://localhost:3005',
  },
  corsOrigins: [
    process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:4000',
    process.env.NEXT_PUBLIC_WAITER_URL || 'http://localhost:4001',
    process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:4002',
  ],
};
