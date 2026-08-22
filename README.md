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

## Seed accounts & Departments

Seed initializes **1 admin** account and **5 active departments** ready for manager and employee creation:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@sece.ac.in` | `Admin@123` |

### Initial Departments:
- **Plumbing** (SLA: 24h)
- **Electrical** (SLA: 24h)
- **Gardening** (SLA: 72h)
- **IT** (SLA: 8h)
- **Housekeeping** (SLA: 12h)

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
