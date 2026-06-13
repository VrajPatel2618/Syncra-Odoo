# Syncra ERP

**Where Inventory Meets Intelligence**

Next-generation Enterprise AI + Blockchain Smart Manufacturing ERP for **Shiv Furniture Works**.

## Architecture

```
Frontend (Next.js) → Backend API (Express) → PostgreSQL → Blockchain Audit Layer (Polygon)
                                                      ↓
                                              AI Services (OpenAI / Gemini)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS, ShadCN UI, Framer Motion, Recharts, Zustand, React Query |
| Backend | Node.js, Express, TypeScript, Prisma, JWT, RBAC |
| Database | PostgreSQL |
| Blockchain | Polygon, Solidity, Hardhat, Ethers.js |
| AI | OpenAI API, Gemini API |

## Quick Start

### Prerequisites
- Node.js 18+
- Docker (optional, only if you switch Prisma back to PostgreSQL)

### 1. Backend Setup
```bash
cd backend
npm install
npm run db:setup
npm run dev
```

The backend runs at `http://localhost:5000` and health is available at `http://localhost:5000/api/health`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:3000` and reads `NEXT_PUBLIC_API_URL` from `frontend/.env.local`.

### 3. Blockchain (Optional)
```bash
cd blockchain
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network hardhat
```

## Demo Login

- **Email:** admin@shivfurniture.com
- **Password:** admin123

## Core Modules

- **Inventory Core** — Products, Inventory, Warehouses, Stock Timeline
- **Sales & CRM** — Sales Orders, Customers, Deliveries, Invoices, Payments
- **Procurement** — Purchase Orders, Vendors, Automation
- **Manufacturing** — MO, BoM, Work Centers, Kanban
- **Intelligence** — AI Copilot, AI Analytics, Blockchain Traceability, Audit Logs
- **System** — Users, Roles, Security, Settings, Reports

## Inventory Formula

```
Free To Use Qty = On Hand Qty − Reserved Qty
```

## Business Flows

**Sales:** Draft → Confirmed (reserve stock) → Delivered (reduce stock)

**Purchase:** Draft → Confirmed → Received (increase stock)

**Manufacturing:** Create MO → Reserve components → Produce → Consume components + Add finished goods

## API Endpoints

- `POST /api/auth/login` — Authentication
- `GET /api/dashboard/stats` — Dashboard KPIs
- `GET /api/products` — Product management
- `GET /api/inventory` — Stock levels
- `GET /api/sales` — Sales orders
- `POST /api/system/chat` — AI Copilot
- `GET /api/system/blockchain/logs` — Blockchain audit trail

## License

MIT — Shiv Furniture Works © 2026
