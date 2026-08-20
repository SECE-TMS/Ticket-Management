# Ticket Management System (TMS)

Role-based, multi-department complaint & task resolution platform built with the **MERN** stack (MongoDB, Express.js, React, Node.js) and Tailwind CSS.

Full specification: [`docs/TECHNICAL_DESIGN.md`](docs/TECHNICAL_DESIGN.md)

## Features

- **Public** raise-ticket form (no login) + track by ticket ID + mobile
- **Admin** — departments, users, org-wide tickets, analytics
- **Manager** — department triage, assign/reassign, close/reopen, employee management
- **Employee** — assigned worklist, status updates, resolution proof upload
- JWT auth (access + httpOnly refresh), RBAC, file uploads (Cloudinary or local)
- In-app notifications + optional email (Nodemailer)

## Quick start

### Prerequisites

- Node.js 20+
- MongoDB running locally **or** a MongoDB Atlas URI

### 1. Backend (TypeScript)

```bash
cd server
cp .env.example .env
# set MONGODB_URI if not using mongodb://127.0.0.1:27017/ticket_management_system
npm install
npm run seed
npm run dev
```

API: `http://localhost:5000/api/v1`

Production build: `npm run build && npm start`

### 2. Frontend

```bash
cd Client
cp .env.example .env
npm install
npm run dev
```

App: `http://localhost:5173`

### Docker (API + MongoDB)

```bash
docker compose up --build
```

Then run the Client separately with `VITE_API_URL=http://localhost:5000/api/v1`.

## Seed accounts

Seed creates **1 admin**, **5 managers**, **10 employees**, and **15 tickets** across all departments and statuses (`new` → `closed` / `reopened`), plus activity logs and notifications.

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@tms.local` | `Admin@123` |
| Manager (Plumbing) | `manager.plumbing@tms.local` | `Manager@123` |
| Employee | `emp1.plumbing@tms.local` / `emp2.plumbing@tms.local` | `Employee@123` |
| Manager (Electrical) | `manager.electrical@tms.local` | `Manager@123` |
| Employee | `emp1.electrical@tms.local` / `emp2.electrical@tms.local` | `Employee@123` |
| Manager (Gardening) | `manager.gardening@tms.local` | `Manager@123` |
| Employee | `emp1.gardening@tms.local` / `emp2.gardening@tms.local` | `Employee@123` |
| Manager (IT) | `manager.it@tms.local` | `Manager@123` |
| Employee | `emp1.it@tms.local` / `emp2.it@tms.local` | `Employee@123` |
| Manager (Housekeeping) | `manager.housekeeping@tms.local` | `Manager@123` |
| Employee | `emp1.housekeeping@tms.local` / `emp2.housekeeping@tms.local` | `Employee@123` |

## Project structure

```
Ticket_Management_System/
├── Client/                 # React + Vite + Tailwind SPA
├── server/                 # Express + Mongoose API (TypeScript)
├── docs/TECHNICAL_DESIGN.md
└── docker-compose.yml
```

## Environment

**Server** (`server/.env`): `PORT`, `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CLIENT_URL`, optional `CLOUDINARY_*`, `SMTP_*`.

**Client** (`Client/.env`): `VITE_API_URL=http://localhost:5000/api/v1`

## Ticket lifecycle

`new` → `assigned` → `accepted` → `in_progress` → `resolved` → `closed` (or `reopened`)

## License

Internal / Confidential — project use only.
