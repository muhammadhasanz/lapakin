# Lapakin — Online Shop & Order Management System

Fullstack Online Shop & Order Management System.

- **Backend (`lapakin-core`):** Node.js 24 + TypeScript, Hono web framework, PostgreSQL 17, Drizzle ORM, JWT authentication (short-lived access token + rotating refresh token in database), modular Domain-Driven Design (DDD) architecture.
- **Frontend Web (`lapakin-app`):** React 19 + Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui components (Radix primitives), TanStack Query v5, port `3001`. Manajemen produk, pelanggan, order wizard, dan dashboard analitik.

---

## 1. Tech Stack & Architectural Decisions

| Layer / Component | Technology | Rationale |
|---|---|---|
| **Backend Runtime** | Node.js 24 LTS | High-performance modern JavaScript runtime with native ESM support. |
| **Backend Framework**| Hono | Ultra-lightweight, high-throughput, type-safe web framework with clean routing. |
| **Database & ORM** | PostgreSQL 17 + Drizzle ORM | Relational database providing strict ACID transactions, row-level locking (`SELECT ... FOR UPDATE`), check constraints for inventory integrity, and declarative migrations via Drizzle Kit. |
| **Frontend Framework**| Next.js 15 (App Router) + React 19 | Industry-standard React framework offering optimized server-side routing, bundling, and latest React 19 capabilities. |
| **UI System** | Tailwind CSS + shadcn/ui (Radix UI) | Clean, accessible, composable component architecture without runtime CSS overhead. |
| **State & Data Fetching**| TanStack Query v5 | Automated server state caching, background refetching, and declarative mutation states. |
| **Authentication** | JWT (jose) + HttpOnly Cookies + Session Revocation | Dual-mode authentication: Web client uses HttpOnly Cookies (mitigating XSS token theft), while automated tests & API clients use Bearer headers. Refresh token is hashed (SHA-256) and tracked in database for instant session invalidation upon logout. |
| **Automated Testing**| Vitest | Fast native-ESM test runner verifying order business logic, concurrency, and validation error branches. |

---

## 2. Setup & Execution Guide

The project is orchestrated using **pnpm workspaces** at the root of the repository. You can run the entire system in **5 steps**:

```bash
# 1. Start PostgreSQL containers via Docker Compose
docker compose up -d db

# 2. Install dependencies across all workspace packages from the root
pnpm install

# 3. Copy backend environment configuration
cp lapakin-core/.env.example lapakin-core/.env

# 4. Run database migrations and database seeder
pnpm --filter lapakin-core db:migrate && pnpm --filter lapakin-core db:seed

# 5. Start both backend and frontend concurrently
pnpm dev
```

- **Frontend Portal:** `http://localhost:3001`
- **Backend API:** `http://localhost:3000`
- **Health Check:** `http://localhost:3000/health`

### Development Commands
```bash
# Jalankan seluruh stack (Core + App)
pnpm dev

# Atau jalankan per service
pnpm dev:core    # Backend API (:3000)
pnpm dev:app     # Frontend Web (:3001)
```

### Seeder Credentials
- **Email:** `admin@lapakin.id`
- **Password:** `Admin@12345`

*Note: A convenient "Fill Demo Seeder Credentials" button is provided on the web login page (`http://localhost:3001/login`) for quick 1-click evaluation.*

---

## 3. Running via Docker Compose (Bonus Feature)

To run the entire multi-container stack (PostgreSQL database, Backend API, and Next.js Web frontend) in isolated Docker containers:

```bash
docker compose up -d --build
```

Access the web application at `http://localhost:3001`. The `api` container runs migrations and seeds demo data automatically on first start (seeding is skipped when the DB already has data). Login with the seeder credentials above.

---

## 4. Business Logic & Order Transaction Flow

The order creation endpoint (`POST /api/orders`) is engineered with strict e-commerce data integrity guarantees:

1. **Declarative Request Validation:**
   Validated via `CreateOrderDTO`. Requires a valid active customer UUID and at least one order line item with an integer quantity $> 0$.
2. **Single Atomic Database Transaction (All-or-Nothing):**
   Customer verification, stock verification, row-level locking, inventory deduction, order numbering, and order items persistence run inside a **single database transaction** (`db.transaction`).
3. **Deadlock Prevention via Sorted Row-Level Locks:**
   Product IDs are sorted in ascending order (`sort((a,b) => a - b)`) before executing `SELECT ... FOR UPDATE`. This guarantees a deterministic locking order, preventing circular deadlocks during high-concurrency order spikes.
4. **All-or-Nothing Stock Validation & Error Field Mapping:**
   If any requested item exceeds available stock, the entire transaction is rolled back immediately (no inventory is deducted), returning an HTTP 422 Unprocessable Content with specific field errors:
   ```json
   {
     "success": false,
     "message": "Insufficient stock",
     "errors": {
       "items.0.quantity": ["Remaining stock for Pringles Original 107g is 2, requested 5"]
     }
   }
   ```
   On the frontend (`lapakin-app`), this error is mapped dynamically to display an error alert directly beneath the affected product row.
5. **Server-Side Pricing & Snapshot `unit_price`:**
   Prices and subtotals are calculated strictly on the server using integer cents to prevent IEEE 754 floating-point rounding inaccuracies. The historical price is captured in `order_items.unit_price` so subsequent catalog price updates never alter past orders.
6. **Atomic Order Numbering `INV-YYYYMMDD-XXXX`:**
   Utilizes the `order_counters` table upserted within the order transaction. Sequences reset daily automatically without race conditions or duplicate order numbers.
7. **Soft Delete Preservation:**
   Soft-deleted products or customers cannot be selected in new transactions, but remain preserved and visible in historical order details.

---

## 5. Automated Integration Tests

Execute the complete integration test suite from the root:

```bash
pnpm test
```

20 test scenarios cover:
- **Auth:** Missing token rejection (401), valid login with seeder credentials, wrong password rejection, refresh token rotation, token reuse rejection, session revocation upon logout, and HttpOnly cookie authentication support.
- **Products:** Complete CRUD, numeric stock and price validation (422), duplicate product code rejection (409), pagination and search, soft delete behavior.
- **Customers:** List pagination, detail lookup, create validation for gender enum and birth date format.
- **Orders:** Successful atomic checkout, accurate inventory decrement, transaction rollback on insufficient stock, DTO validation, and historical detail lookup for soft-deleted products.
- **Dashboard:** Revenue summation, transaction count, top 5 bestsellers, and low stock alert thresholds (< 5 units).

---

## 6. API Documentation (Postman Collection)

A ready-to-import Postman Collection is available at the repository root:
📄 `lapakin.postman_collection.json`

Includes:
- All endpoints (Auth, Products, Customers, Orders, Dashboard, Health)
- Postman test scripts that automatically save `accessToken` and `refreshToken` into collection variables upon login.

---

## 7. Monorepo Project Structure

```
lapakin/
├── package.json              # Root workspace orchestrator
├── pnpm-workspace.yaml       # Monorepo workspace configuration
├── docker-compose.yml        # Multi-container orchestration (DB, API, Web)
├── lapakin.postman_collection.json
├── lapakin-core/             # Backend service (Hono + DDD enterprise structure)
│   ├── src/
│   │   ├── config/           # Application configuration & route whitelists
│   │   ├── infrastructure/
│   │   │   ├── database/     # Drizzle connection, models, migrate.ts, seed.ts
│   │   │   │   └── drizzle/
│   │   │   │       ├── migrations/ # Drizzle SQL migration files
│   │   │   │       ├── models/     # Per-model schema definitions
│   │   │   │       ├── index.ts    # pg Pool and Drizzle client
│   │   │   │       └── schema.ts   # Model re-exports
│   │   │   ├── http/         # App instance, middleware (auth, logger, traceId)
│   │   │   └── loaders/      # Database health check loader
│   │   ├── modules/          # DDD modules: auth, products, customers, orders, dashboard
│   │   │   └── <module>/
│   │   │       ├── domain/   # Entity, UniqueId, Domain Errors
│   │   │       ├── repos/    # Data Access Layer (Repository)
│   │   │       ├── mappers/  # Entity <-> DTO translation
│   │   │       └── useCases/ # Single-responsibility operation folder (UseCase, Controller, DTO)
│   │   ├── shared/           # Core framework primitives (Entity, Controller, Container)
│   │   └── index.ts          # Server entry point & graceful shutdown
│   └── tests/                # 20 Vitest integration test suites
└── lapakin-app/              # Frontend service (Next.js 15 + React 19 + shadcn/ui)
    ├── src/
    │   ├── app/
    │   │   ├── (dashboard)/
    │   │   │   ├── page.tsx            # KPI cards, bestsellers, low stock alerts
    │   │   │   ├── products/page.tsx   # Product catalog CRUD & soft delete
    │   │   │   ├── customers/page.tsx  # Customer profile CRUD
│   │   │   │   ├── orders/page.tsx     # Order history & date filters
    │   │   │   ├── orders/[id]/page.tsx   # Order detail view
    │   │   │   └── orders/new/page.tsx    # Dynamic order lines & real-time stock error alerts
    │   │   ├── login/page.tsx          # Login & 1-click demo button
    │   │   └── layout.tsx
    │   ├── components/ui/    # shadcn/ui primitives (Button, Table, Dialog, Select, etc.)
    │   ├── context/          # Auth Context & Session Provider
    │   └── lib/              # API Client (auto token & refresh) and formatting utilities
    └── Dockerfile
```

---

## 8. Assumptions & Limitations

- **Assumptions:** Order creation is performed by an authenticated store cashier or manager (back-office retail order management system scenario).
- **Current Limitations:** Third-party payment gateways (Midtrans / Xendit) are omitted as the technical assessment evaluates internal transactional consistency and inventory locking.
- **Future Roadmap:**
  - Export monthly transaction records to CSV / Excel format.
  - Caching layer using Redis for product catalog read queries with automated invalidation.

---

## 9. AI Usage Declaration

In compliance with technical test guidelines:
- **Tools Used:** GitHub Copilot (Code Model)
- **Assisted Areas:**
  - Scaffolding DDD modular use-case boilerplate (Entity, Controller, Mapper, Repository).
  - Generating initial product catalog & customer seed fixtures (30-day realistic orders).
  - Constructing integration test assertions in Vitest (covering concurrency, stock deduction, and error validation).
- **Candidate Ownership:** All core business logic, database transactions (`SELECT ... FOR UPDATE`), security hardening (HttpOnly cookies, Argon2 hashing), and code implementations were reviewed and verified directly by the candidate.
