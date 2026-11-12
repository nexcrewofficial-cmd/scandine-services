module.exports = {
  apps: [
    {
      name: "scan-and-dine-backend",
      script: "dist/server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "development",
        PORT: 8080,
        SERVICE_NAME: "ALL",
        LOG_LEVEL: "debug",
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 8080,
        SERVICE_NAME: "ALL",
        LOG_LEVEL: "info",
      },
    },
  ],
};
