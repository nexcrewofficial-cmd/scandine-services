# 🍽️ Scan & Dine — Modular Backend Platform

> **Scan & Dine Backend** is an enterprise-grade, multi-tenant SaaS backend modernizing restaurant, cafe, and food court operations with QR-based digital ordering, real-time kitchen display systems (KDS), floor staff cart mirroring, and automated billing.

---

## 🏛️ Architecture: Modular Architecture (Microservices-Ready)

The backend is organized as a clean **Modular Architecture**, where each business domain is strictly decoupled into its own folder under `src/modules/` and common infrastructure is shared in `src/shared/`:

```text
scan-and-dine-backend/
├── src/
│   ├── modules/                       # ── BUSINESS DOMAINS (Feature Folders) ──
│   │   ├── auth/                      # auth/, users/, customers/, shifts/ (each holds its own model, service, routes, interfaces, enums)
│   │   ├── menu/                      # venues/, categories/, menu-items/, inventory/, promos/, printers/
│   │   ├── orders/                    # orders/, cart/, transactions/, checkout/, kds/, dashboard/, webhooks/
│   │   └── websockets/                # Real-time Socket.io floor & kitchen event bus relay
│   │
│   ├── shared/                        # ── SHARED INFRASTRUCTURE ──
│   │   ├── types/                     # TypeScript interfaces, enums, & DTOs
│   │   ├── middlewares/               # JWT auth, RBAC, Tenancy, Geofencing, Zod validation
│   │   ├── event-bus/                 # Pub/Sub layer (Redis with silent local fallback)
│   │   └── logger/                    # Pino structured JSON logging & HTTP tracing
│   │
│   ├── config/                        # Unified environment & payment configurations
│   ├── docs/                          # OpenAPI / Swagger JSON specification
│   └── server.ts                      # Main entrypoint (Port 3000 unified or microservice runner)
│
├── .env.example                       # Environment configuration template
├── package.json                       # Single consolidated package.json
└── tsconfig.json                      # Single unified TypeScript configuration
```

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

### 3. Start Dev Server (Unified Mode - Port 3000)
Boots all APIs, Swagger docs, and WebSockets together on **Port 3000** in one second:
```bash
npm run dev
```

* **Base REST API**: `http://localhost:3000/api/v1/`
* **Swagger Docs**: `http://localhost:3000/api/docs`
* **WebSockets**: `ws://localhost:3000` (attached on same port)
* **Health Check**: `http://localhost:3000/api/v1/health`

---

### 4. Running as Independent Microservices
Because each module is 100% self-contained, you can run any individual service on its own port:

```bash
npm run start:auth     # Runs ONLY Auth domain on Port 3001
npm run start:menu     # Runs ONLY Menu domain on Port 3002
npm run start:orders   # Runs ONLY Orders domain on Port 3003
npm run start:ws       # Runs ONLY WebSockets on Port 3005
```

---

## 🔨 Building for Production

```bash
npm run build
npm start
```

---

## 📜 License
Private & Proprietary — Scan & Dine SaaS Platform.
