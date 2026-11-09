# 🍽️ Scan & Dine — Backend Microservices Platform

> **Scan & Dine Backend** is an enterprise-grade, multi-tenant SaaS backend modernizing restaurant, cafe, and food court operations with QR-based digital ordering, real-time kitchen display systems (KDS), floor staff cart mirroring, and automated billing.

---

## 🏛️ Architecture & Services Overview

The repository is structured with `server/` and `packages/`:

```text
scan-and-dine-backend/
│
├── server/                                   # ── BACKEND MICROSERVICES ──
│   ├── api-gateway/ (Port 3000)              # Public reverse proxy, rate limiting, CORS, Swagger (/api/docs)
│   ├── service-auth/ (Port 3001)             # Users, RBAC, 4-digit PIN login, HR shifts, device UUID
│   ├── service-menu/ (Port 3002)             # Menu CMS, categories, 86-ing stock toggles, inventory, promos
│   ├── service-orders/ (Port 3003)           # Cart, checkout, Stripe payment intents, KDS SLA timers, ledger
│   └── service-websockets/ (Port 3005)       # Socket.io + Redis adapter, rooms for venue, KDS, & tables
│
├── packages/                                 # ── SHARED LIBRARIES ──
│   ├── shared-types/                         # TypeScript interfaces, enums, & DTOs
│   ├── shared-middlewares/                   # JWT, RBAC, Tenancy, Feature Flags, Zod validator
│   ├── event-bus/                            # Redis Pub/Sub wrapper with graceful offline fallback
│   └── logger/                               # Pino JSON structured logging & HTTP tracing
│
├── ecosystem.config.cjs                      # Production PM2 Cluster Configuration
├── package.json                              # Dedicated backend workspaces & dev runners
└── tsconfig.base.json                        # Shared TypeScript base configuration
```

---

## 🔌 Port & Service Mapping

| Service | Default Port | Internal Role | Accessible By |
| :--- | :---: | :--- | :--- |
| **`api-gateway`** | `3000` | Reverse Proxy, Rate Limiter, Swagger Docs (`/api/docs`) | **Public Clients / Frontends** |
| **`service-auth`** | `3001` | Authentication, RBAC, PINs, Shifts | Gateway Only |
| **`service-menu`** | `3002` | Catalog, 86-ing, Inventory, Promos | Gateway Only |
| **`service-orders`** | `3003` | Carts, Checkout, KDS, Ledger | Gateway Only |
| **`service-websockets`** | `3005` | Socket.io Real-Time Engine | **Direct Socket Connections** |

---

## 🚀 Running in Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Run All Microservices Concurrently
```bash
npm run dev
```

### 4. Or Run Any Single Service Individually
```bash
npm run dev:gateway   # Port 3000
npm run dev:auth      # Port 3001
npm run dev:menu      # Port 3002
npm run dev:orders    # Port 3003
npm run dev:ws        # Port 3005
```

---

## 🔨 Building the Backend

```bash
npm run build
```

---

## 🌐 Running in Production (PM2)

```bash
npm run build
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

---

## 📜 License
Private & Proprietary — Scan & Dine SaaS Platform.
