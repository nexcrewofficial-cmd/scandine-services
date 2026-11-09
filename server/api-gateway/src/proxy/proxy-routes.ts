import { Express } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from '../config/env.js';
import { logger } from '@scan-and-dine/logger';

export const setupProxyRoutes = (app: Express): void => {
  // Service Auth Routes
  app.use(
    ['/api/v1/auth', '/api/v1/public/auth', '/api/v1/admin/staff', '/api/v1/staff', '/api/v1/admin/payroll'],
    createProxyMiddleware({
      target: config.services.auth,
      changeOrigin: true,
      on: {
        error: (err, _req, res) => {
          logger.error({ err }, 'Proxy error to service-auth');
          (res as any).status(503).json({ success: false, error: 'Authentication Service Unavailable' });
        },
      },
    })
  );

  // Service Menu Routes
  app.use(
    ['/api/v1/admin/menu', '/api/v1/public/menu', '/api/v1/admin/inventory', '/api/v1/admin/promos', '/api/v1/admin/settings', '/api/v1/admin/printers'],
    createProxyMiddleware({
      target: config.services.menu,
      changeOrigin: true,
      on: {
        error: (err, _req, res) => {
          logger.error({ err }, 'Proxy error to service-menu');
          (res as any).status(503).json({ success: false, error: 'Menu & Catalog Service Unavailable' });
        },
      },
    })
  );

  // Service Orders & KDS Routes
  app.use(
    ['/api/v1/public/cart', '/api/v1/public/checkout', '/api/v1/public/orders', '/api/v1/public/waiter', '/api/v1/kds', '/api/v1/waiter', '/api/v1/admin/dashboard', '/api/v1/admin/analytics', '/api/v1/admin/transactions', '/api/v1/webhooks'],
    createProxyMiddleware({
      target: config.services.orders,
      changeOrigin: true,
      on: {
        error: (err, _req, res) => {
          logger.error({ err }, 'Proxy error to service-orders');
          (res as any).status(503).json({ success: false, error: 'Orders & Checkout Service Unavailable' });
        },
      },
    })
  );
};
