# TECHNICAL DESIGN DOCUMENT
# Ticket Management System (TMS)

**A Role-Based, Multi-Department Complaint & Task Resolution Platform**

| Field | Value |
| --- | --- |
| Technology Stack | MongoDB · Express.js · React.js · Node.js (MERN) · Tailwind CSS |
| Document Type | Software Requirements & Technical Design Specification |
| Project Name | Ticket Management System (TMS) |
| Version | 1.0 |
| Status | Draft for Review |
| Date | 08 August 2026 |
| Classification | Internal / Confidential |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Project Overview](#2-project-overview)
3. [Stakeholders & User Roles](#3-stakeholders--user-roles)
4. [System Architecture](#4-system-architecture)
5. [Functional Requirements](#5-functional-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Ticket Lifecycle & Workflow](#7-ticket-lifecycle--workflow)
8. [Database Design](#8-database-design)
9. [REST API Design](#9-rest-api-design)
10. [Frontend Design](#10-frontend-design-react--tailwind-css)
11. [File Handling](#11-file-handling--image--audio-attachments)
12. [Security Design](#12-security-design)
13. [Notification System Design](#13-notification-system-design)
14. [Deployment Architecture](#14-deployment-architecture)
15. [Testing Strategy](#15-testing-strategy)
16. [Project Plan & Delivery Milestones](#16-project-plan--delivery-milestones)
17. [Future Enhancements](#17-future-enhancements)
18. [Appendix](#18-appendix)

---

## 1. Introduction

### 1.1 Purpose

This document describes the complete technical design and software requirements specification for the Ticket Management System (TMS) — a production-grade, role-based complaint and task-management web application built on the MERN stack (MongoDB, Express.js, React.js, Node.js) with Tailwind CSS for the user interface. The document is intended to serve as the single source of truth for the development, quality assurance, DevOps, and product teams throughout the design, build, testing, and deployment phases of the project.

### 1.2 Scope

TMS enables any employee or member of an organization to raise a complaint or service request (a "ticket") against a specific department — for example Plumbing, Electrical, Gardening, IT, or Housekeeping — by filling a simple public-facing form. The system routes tickets through a structured workflow: a Manager of the relevant department triages and assigns the ticket to an Employee, the Employee resolves the issue and uploads proof of completion, and the ticket is closed. Administrators have complete organization-wide visibility and control: they manage departments, create Manager and Employee accounts, monitor every ticket in the system, and view analytics through a central dashboard.

The scope of this document covers functional requirements, non-functional requirements, system architecture, database schema, REST API contracts, frontend component design, security design, file-handling strategy (image and audio attachments), notification design, deployment architecture, and a phase-wise project delivery plan.

### 1.3 Intended Audience

- Backend and Frontend Engineers implementing the system
- QA Engineers designing test plans and test cases
- DevOps Engineers responsible for CI/CD and infrastructure
- Project Managers and Product Owners tracking delivery
- UI/UX Designers translating requirements into screens
- Client stakeholders reviewing and approving the solution design

### 1.4 Definitions, Acronyms & Abbreviations

| Term | Description |
| --- | --- |
| TMS | Ticket Management System — the application described in this document |
| MERN | MongoDB, Express.js, React.js, Node.js — the technology stack |
| JWT | JSON Web Token — used for stateless authentication |
| RBAC | Role-Based Access Control |
| SLA | Service Level Agreement — target time to resolve a ticket |
| Ticket | A single complaint / service request raised by a User |
| Department | An organizational unit ( , Plumbing, Electrical) that owns a category of tickets |
| Requester | The person (User) who raised the ticket; captured via name & contact, not necessarily a logged-in account |
| Assignee | The Employee to whom a ticket is assigned for resolution |
| REST | Representational State Transfer — the API architectural style used |
| CRUD | Create, Read, Update, Delete |

### 1.5 Document Conventions

Throughout this document, mandatory system behaviour is expressed using "shall"; recommended behaviour uses "should". API endpoints are written relative to the base path `/api/v1`. Database field names use camelCase. All timestamps are stored in UTC and rendered in the client's local timezone.

---

## 2. Project Overview

### 2.1 Problem Statement

Organizations that manage physical facilities (offices, campuses, residential complexes, factories) typically receive complaints — a leaking tap, a broken switchboard, an unkempt garden — through informal, untracked channels such as verbal requests, phone calls, or messaging apps. This leads to lost requests, no accountability, no visibility into resolution time, and no historical record for audits or facility-improvement decisions.

### 2.2 Proposed Solution

TMS provides one structured digital channel through which every complaint is logged, categorized by department, assigned to a specific employee, tracked through a defined lifecycle, and closed with photographic or audio proof of resolution. Every stakeholder — from the person raising the ticket to the organization's administrator — has a purpose-built interface appropriate to their role.

### 2.3 Objectives

1. Provide a frictionless, no-login ticket-raising form for end users capturing name, department, mobile number, complaint type, description, and a photo or voice-note attachment.
2. Give Managers full visibility and control over tickets and staff within their own department only.
3. Give Employees a simple worklist of tickets assigned to them, with the ability to update status and upload proof of completion.
4. Give Administrators universal control: department creation, user management across all roles, and a consolidated dashboard of every ticket in the organization.
5. Ensure the system is secure, scalable, auditable, and maintainable in a production environment.

### 2.4 Key Features Summary

| Feature Area | Highlights |
| --- | --- |
| Public Ticket Form | No login required; captures name, department, mobile, complaint type, description, image/audio upload |
| Admin Panel | Department CRUD, universal user management, all-ticket visibility, analytics dashboard, reports |
| Manager Panel | Department-scoped user (Employee) management, ticket triage & assignment, department dashboard |
| Employee Panel | Assigned ticket worklist, status updates, resolution proof upload (image/audio) |
| Notifications | Email and in-app alerts on ticket creation, assignment, and resolution |
| Authentication | JWT-based auth with role-based route protection for Admin, Manager, Employee |
| File Handling | Secure image/audio capture and storage via cloud object storage (Cloudinary / AWS S3) or local fallback |
| Reporting | Ticket volume, average resolution time, department performance, SLA breach tracking |

---

## 3. Stakeholders & User Roles

TMS defines four distinct roles, arranged in a strict organizational hierarchy. Access to data and functionality is scoped according to this hierarchy — a Manager can only see the department they belong to, and an Employee can only see tickets assigned to them.

### 3.1 Role Hierarchy

```
Admin  →  Manager (one per Department)  →  Employee (many per Department)  →  User (ticket requester, not a system account)
```

### 3.2 Admin

The Admin is the super-user of the platform with organization-wide authority.

- Create, update, deactivate and delete Departments ( , Plumbing, Electrical, Gardening, IT, Housekeeping).
- Create, update, and deactivate user accounts of any role — Manager or Employee — and assign a Manager to a Department.
- View, filter, search, and export every ticket raised across all departments.
- View the global analytics dashboard: open/closed ticket counts, average resolution time, department-wise load, SLA breaches.
- Reassign any ticket to a different department or manager if mis-categorized.
- Configure system-wide settings: complaint types, SLA thresholds, notification templates.

### 3.3 Manager

Each Department has exactly one Manager, who owns the operational triage of that department.

- View and manage Employees belonging only to their own department (create, update, deactivate).
- View all tickets raised for their department.
- Assign an incoming ticket to a specific Employee, and reassign if needed.
- Set priority and expected resolution date on a ticket.
- View a department-scoped dashboard: ticket backlog, employee workload, resolution metrics.
- Approve/close a ticket once an Employee marks it resolved (optional quality-check step).

### 3.4 Employee

Employees are the field staff who physically resolve tickets.

- View a personal worklist of tickets assigned to them by their Manager.
- Update ticket status: Accepted → In Progress → Resolved.
- Upload proof of resolution (image and/or audio note) and add completion remarks.
- View their own historical performance (tickets completed, average time taken).

### 3.5 User (Ticket Requester)

The User is the person raising a complaint — an employee of the organization, a resident, or a visitor. This role does not require a login account; the ticket-raising form is public. Optionally, the system can allow the User to track ticket status later using their mobile number and a generated ticket ID.

- Access a single public form to raise a ticket.
- Provide: full name, department, mobile number, type of complaint, description, and an image or audio attachment of the problem.
- Optionally check the status of a previously raised ticket via ticket ID + mobile number lookup.

### 3.6 Role–Permission Matrix

| Capability | Admin | Manager | Employee | User |
| --- | --- | --- | --- | --- |
| Raise a ticket | — | — | — | Yes |
| View all tickets (org-wide) | Yes | No | No | No |
| View department tickets | Yes | Yes (own dept.) | No | No |
| View assigned tickets only | — | — | Yes | No |
| Create / manage Departments | Yes | No | No | No |
| Create Managers | Yes | No | No | No |
| Create Employees | Yes | Yes (own dept.) | No | No |
| Assign ticket to Employee | Yes | Yes (own dept.) | No | No |
| Update ticket status | Yes | Yes | Yes (assigned only) | No |
| Upload resolution proof | No | No | Yes | No |
| View analytics dashboard | Global | Department-scoped | Personal | No |

---

## 4. System Architecture

### 4.1 Architectural Style

TMS follows a classic three-tier client–server architecture with a decoupled REST API. The React single-page application (SPA) is served independently from the Node.js/Express API server, communicating exclusively over HTTPS using JSON payloads. This separation allows the frontend and backend to be developed, deployed, scaled, and versioned independently.

#### 4.1.1 High-Level Architecture

| Layer | Responsibility | Technology |
| --- | --- | --- |
| Presentation Layer | Renders UI, manages client-side state and routing, calls REST APIs | React.js, React Router, Redux Toolkit, Tailwind CSS, Axios |
| Application / API Layer | Business logic, authentication, validation, orchestration | Node.js, Express.js, JWT, Multer, Zod |
| Data Layer | Persistent storage of users, tickets, departments, attachments metadata | MongoDB Atlas / local MongoDB, Mongoose ODM |
| File Storage Layer | Stores uploaded images and audio files | Cloudinary / local `uploads/` fallback |
| Notification Layer | Sends email / in-app notifications on ticket events | Nodemailer + SMTP (optional), in-app Notification collection |

#### 4.1.2 Request Flow

```
Browser (React + Tailwind SPA)
  → HTTPS/REST (Axios)
  → Express.js API Gateway
  → Middleware (CORS, Helmet, JWT Auth, Role Guard, Validation)
  → Controller → Service Layer → Mongoose Model → MongoDB
```

File uploads branch from the Controller to the Cloud Storage SDK (or local disk) before the attachment reference is persisted to MongoDB.

### 4.2 Technology Stack

| Category | Technology | Purpose |
| --- | --- | --- |
| Frontend Framework | React.js 19 (Vite) | Component-based SPA |
| Styling | Tailwind CSS 4 | Utility-first responsive styling |
| State Management | Redux Toolkit | Global application state |
| Routing | React Router v6/v7 | Client-side routing & protected routes |
| HTTP Client | Axios | REST API communication with interceptors for JWT |
| Backend Runtime | Node.js 20 LTS | JavaScript server runtime |
| Backend Framework | Express.js | REST API routing & middleware |
| Database | MongoDB | NoSQL document database |
| ODM | Mongoose | Schema modelling & validation for MongoDB |
| Authentication | JSON Web Tokens, bcrypt.js | Stateless auth & password hashing |
| File Upload | Multer | Handling multipart/form-data uploads |
| Cloud File Storage | Cloudinary (optional) | Storing ticket images and audio notes |
| Validation | Zod (backend + frontend) | Request & form validation |
| Email Notifications | Nodemailer + SMTP | Ticket lifecycle email alerts |
| Containerization | Docker, Docker Compose | Local parity & deployment packaging |

### 4.3 Backend Folder Structure

```
server/
├── src/
│   ├── config/          → db.js, cloudinary.js, email.js
│   ├── models/          → User.js, Department.js, Ticket.js, ActivityLog.js, Notification.js
│   ├── controllers/     → auth, ticket, user, department, dashboard, notification
│   ├── routes/          → auth, ticket, user, department, dashboard, notification
│   ├── middlewares/     → auth, role, upload, validate, error
│   ├── services/        → ticket, notification, auth, user, department, dashboard
│   ├── validators/      → zod schemas
│   ├── utils/           → apiResponse, apiError, generateToken, logger, upload
│   ├── scripts/         → seed.js
│   └── app.js
├── uploads/
├── server.js
├── .env.example
└── package.json
```

### 4.4 Frontend Folder Structure

```
Client/
├── src/
│   ├── components/      → common/, admin/, manager/, employee/, public/
│   ├── pages/           → Landing, Login, RaiseTicket, TrackTicket, role dashboards
│   ├── layouts/         → AdminLayout, ManagerLayout, EmployeeLayout, PublicLayout
│   ├── routes/          → AppRoutes, ProtectedRoute, RoleRoute
│   ├── redux/           → authSlice, store
│   ├── services/        → api, auth, ticket, user, department, dashboard
│   ├── hooks/
│   ├── utils/
│   ├── App.tsx
│   └── main.tsx
├── tailwind / vite config
└── package.json
```

---

## 5. Functional Requirements

### 5.1 Ticket Raising Module (Public / User)

| ID | Requirement |
| --- | --- |
| FR-TKT-01 | Public web form accessible without authentication |
| FR-TKT-02 | Capture: full name, department, mobile, complaint type, description, attachment |
| FR-TKT-03 | Mobile number validated for 10-digit format |
| FR-TKT-04 | Image (JPEG/PNG/WEBP, max 5 MB) or audio (MP3/WAV/M4A/WEBM, max 10 MB) |
| FR-TKT-05 | Generate unique Ticket ID ( , TMS-2026-000123) on submission |
| FR-TKT-06 | Optional email acknowledgement when contact email provided |
| FR-TKT-07 | Public Track Ticket page via Ticket ID + mobile |
| FR-TKT-08 | New tickets start in `new` status and appear in Manager queue |

### 5.2 Authentication & Authorization Module

| ID | Requirement |
| --- | --- |
| FR-AUTH-01 | Single login for Admin, Manager, Employee |
| FR-AUTH-02 | Passwords hashed with bcrypt; never stored plaintext |
| FR-AUTH-03 | JWT access token + refresh token (httpOnly cookie) |
| FR-AUTH-04 | Every protected API verifies JWT and RBAC |
| FR-AUTH-05 | Forgot Password via time-limited reset token |
| FR-AUTH-06 | Accounts lockable/deactivatable; access revoked |
| FR-AUTH-07 | Frontend redirects unauthenticated users to login; role-based dashboards |

### 5.3–5.7 Panel & Module Requirements

Admin: department CRUD, user management, org-wide tickets, analytics, export, settings.  
Manager: department-scoped employees, triage/assign, approve/reopen, department dashboard.  
Employee: assigned worklist, status transitions, resolution proof upload, personal KPIs.  
File Upload: MIME/size validation, cloud or local storage, URL-only persistence in MongoDB.  
Notifications: in-app + email on create/assign/resolve/SLA breach.

---

## 6. Non-Functional Requirements

- **Performance:** 95% of API responses ≤ 500 ms under normal load (excl. uploads); server-side pagination (default 20/page).
- **Scalability:** Stateless JWT auth; indexed MongoDB fields; horizontal API scaling.
- **Security:** HTTPS in production; bcrypt ≥ 10; RBAC on every protected endpoint; input validation; file MIME checks.
- **Availability:** Target 99.5% uptime; daily DB backups; graceful degradation if notifications fail.
- **Usability:** Mobile-first public form; WCAG 2.1 AA where practical.
- **Maintainability:** Layered architecture; ESLint/Prettier; OpenAPI docs (future).
- **Compatibility:** Latest two major versions of Chrome, Firefox, Edge, Safari.

---

## 7. Ticket Lifecycle & Workflow

### 7.1 Ticket Status States

| Status | Description | Set By |
| --- | --- | --- |
| New | Submitted; awaiting Manager triage | System |
| Assigned | Assigned to Employee | Manager |
| Accepted | Employee acknowledged | Employee |
| In Progress | Work started | Employee |
| Resolved | Work done + proof uploaded | Employee |
| Closed | Manager approved | Manager |
| Reopened | Resolution rejected | Manager / Admin |

### 7.2 Workflow

```
[User submits] → NEW → (Manager assigns) → ASSIGNED → ACCEPTED → IN PROGRESS
  → RESOLVED → (approve) CLOSED | (reject) REOPENED → back toward assignment
```

---

## 8. Database Design

### Collections

- **users** — Admin / Manager / Employee accounts (requesters are NOT stored here)
- **departments** — name, manager, complaintTypes, slaHours, isActive
- **tickets** — ticketCode, requester embed, department, status, assignment, attachments, resolution
- **activitylogs** — ticket timeline / audit trail
- **notifications** — in-app notification feed
- **counters** — sequential ticket code generation

### Sample Ticket Schema (Mongoose)

```js
const ticketSchema = new mongoose.Schema({
  ticketCode: { type: String, required: true, unique: true },
  requester: {
    name: { type: String, required: true },
    mobile: { type: String, required: true, match: /^[0-9]{10}$/ },
    email: { type: String },
  },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  complaintType: { type: String, required: true },
  description: { type: String, required: true, maxlength: 1000 },
  userAttachment: {
    url: String,
    type: { type: String, enum: ['image', 'audio'] },
    publicId: String,
  },
  priority: { type: String, enum: ['low','medium','high','urgent'], default: 'medium' },
  status: {
    type: String,
    enum: ['new','assigned','accepted','in_progress','resolved','closed','reopened'],
    default: 'new',
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  expectedResolutionAt: Date,
  resolution: {
    remarks: String,
    attachment: { url: String, type: String, publicId: String },
    resolvedAt: Date,
  },
  closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  closedAt: Date,
  reopenCount: { type: Number, default: 0 },
}, { timestamps: true });
```

---

## 9. REST API Design

All endpoints under `/api/v1`. Envelope: `{ success, data, message }` / `{ success: false, error: { code, message } }`.

### Key Endpoints

| Area | Endpoints |
| --- | --- |
| Auth | `POST /auth/login`, `/refresh`, `/logout`, `/forgot-password`, `/reset-password/:token`, `GET /auth/me` |
| Departments | `GET /departments`, `/departments/all`, `POST/PUT/PATCH/DELETE /departments/:id` |
| Users | `GET/POST /users`, `POST /users/employee`, status & password routes |
| Tickets (public) | `POST /tickets`, `GET /tickets/track` |
| Tickets (staff) | list, assign, reassign, status, resolve, close, reopen, comments, export |
| Dashboard | `/dashboard/admin`, `/manager`, `/employee` |
| Notifications | list, mark read, read-all |

### Standard Error Codes

| HTTP | Code | Meaning |
| --- | --- | --- |
| 400 | VALIDATION_ERROR | Validation failed |
| 401 | UNAUTHORIZED | Missing/invalid JWT |
| 403 | FORBIDDEN | Role lacks permission |
| 404 | NOT_FOUND | Resource missing |
| 409 | CONFLICT | Duplicate resource |
| 413 | PAYLOAD_TOO_LARGE | File too large |
| 415 | UNSUPPORTED_MEDIA_TYPE | MIME not allowed |
| 429 | RATE_LIMITED | Too many requests |
| 500 | INTERNAL_ERROR | Unhandled error |

---

## 10. Frontend Design (React + Tailwind CSS)

### Screens by Role

| Role | Screens |
| --- | --- |
| Public | Landing, Raise Ticket, Confirmation, Track Ticket, Login |
| Admin | Dashboard, Departments, Users, All Tickets, Ticket Detail |
| Manager | Dashboard, Employees, Ticket Queue, Assign, Ticket Detail |
| Employee | Dashboard, My Tickets, Ticket Detail & Resolution Upload |

### Routing

Role-guarded routes under `/admin/*`, `/manager/*`, `/employee/*`. Public routes for landing, raise, track, login.

### Tailwind Conventions

- Shared brand tokens: navy primary, teal accent
- Status badge color map fixed across panels
- Mobile-first responsive prefixes
- Reusable UI primitives (Button, Modal, Badge, etc.)

---

## 11. File Handling — Image & Audio Attachments

1. Client sends multipart/form-data.
2. Multer parses into memory; enforces size limits (5 MB image / 10 MB audio).
3. MIME allow-list validated server-side.
4. Upload to Cloudinary when configured; otherwise local `server/uploads` served at `/uploads`.
5. Only URL + type + publicId stored in MongoDB.

---

## 12. Security Design

- JWT access (~15 min) + refresh httpOnly cookie (7d)
- bcrypt cost ≥ 10; lock after 5 failed logins / 15 min
- RBAC middleware on every protected route; department scoping for managers/employees
- Zod validation; NoSQL injection hardening; Helmet; CORS allow-list; rate limiting
- Secrets via environment variables only

---

## 13. Notification System Design

| Event | Recipient | Channel |
| --- | --- | --- |
| New ticket | Department Manager | In-app + Email |
| Ticket assigned | Employee | In-app + Email |
| Resolved | Manager | In-app + Email |
| Closed | User (if email) | Email |
| Reopened | Employee | In-app + Email |
| SLA breach | Manager, Admin | In-app + Email |

---

## 14. Deployment Architecture

| Environment | Purpose |
| --- | --- |
| Development | Local MongoDB + Vite + Express |
| Staging | Atlas + Render/Vercel preview |
| Production | Atlas + hardened API + CDN SPA |

**Topology:** React SPA (Vercel/Netlify) → Express API (Render/EC2) → MongoDB Atlas + Cloudinary.

**Config:** `.env` for secrets; never commit production credentials.

---

## 15. Testing Strategy

- Unit: services, validators, utils (Jest)
- Integration: API routes with Supertest + test DB
- E2E: critical flows (raise → assign → resolve → close) via Cypress/Playwright
- **Definition of Done:** requirements met, RBAC verified, no critical lint/security issues, seed + smoke pass

---

## 16. Project Plan & Delivery Milestones

| Phase | Deliverable |
| --- | --- |
| 1 | Auth, departments, users, seed |
| 2 | Public ticket raise/track + file upload |
| 3 | Manager triage & Employee resolution |
| 4 | Dashboards, notifications, export |
| 5 | Hardening, Docker, docs, deploy |

### Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Spam public tickets | Rate limit + CAPTCHA (future) |
| Cloudinary outage | Local upload fallback |
| Scope creep | Strict FR IDs / phased delivery |

---

## 17. Future Enhancements

- SMS status updates (Twilio / MSG91)
- Socket.IO real-time dashboards
- OpenAPI/Swagger live docs
- Advanced SLA policies per complaint type
- Mobile native apps

---

## 18. Appendix

### 18.1 Complaint Type Examples by Department

| Department | Complaint Types |
| --- | --- |
| Plumbing | Leakage, Blockage, Fitting Damage |
| Electrical | Power Outage, Faulty Switch, Wiring |
| Gardening | Overgrown Lawn, Tree Trimming, Irrigation |
| IT | Hardware Failure, Network Down, Account Access |
| Housekeeping | Cleaning Request, Waste Collection, Pest Control |

### 18.2 Glossary

See §1.4.

### 18.3 References

- MERN stack documentation
- JWT RFC 7519
- OWASP ASVS (auth & upload guidance)

### 18.4 Document Revision History

| Version | Date | Author | Notes |
| --- | --- | --- | --- |
| 1.0 | 08 Aug 2026 | TMS Team | Initial draft for review |
| 1.1 | 10 Aug 2026 | TMS Team | Aligned with implemented codebase |
