# SecureFile Storage

> Production-grade secure file storage service built with TypeScript, Node.js, and Redis — following DDD/Clean Architecture principles.

[![CI](https://github.com/your-org/securefile-storage/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/securefile-storage/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Features

- 🔐 **JWT Authentication** — Access + Refresh token rotation with Redis blacklisting
- 📁 **File Upload & Download** — Multer-based upload with stream download
- 🗂️ **File Versioning** — Full version history with change notes
- 🔗 **Temporary Share URLs** — Token-based sharing with expiry, max downloads, and email restrictions
- 🦠 **Virus Scan** — ClamAV integration (MockProvider in dev)
- 🛡️ **Rate Limiting** — Global + auth + upload limiters via `express-rate-limit`
- 🔒 **Brute-force Protection** — Redis-backed login attempt counters
- 📊 **Structured Logging** — Pino with redaction of sensitive fields
- 🗄️ **Storage Backends** — Local filesystem or S3-compatible (AWS S3 / MinIO)
- 🐘 **PostgreSQL + TypeORM** — Connection pooling, migrations, typed repositories
- 🐳 **Docker** — Multi-stage build with non-root user + `dumb-init`
- 🤖 **CI/CD** — GitHub Actions: lint → unit tests → E2E → Docker build

---

## Architecture

This project follows **Domain-Driven Design (DDD) + Clean Architecture**:

```
src/
├── domain/           # Business rules (entities, value objects, repo interfaces)
│   ├── user/
│   ├── file/
│   └── share/
├── application/      # Use cases, ports (interfaces)
│   ├── auth/
│   ├── file/
│   └── share/
├── infrastructure/   # DB, providers (JWT, Redis, S3/local, bcrypt)
│   ├── database/typeorm/
│   └── providers/
├── presentation/     # HTTP controllers, routes, middlewares
│   └── http/
└── shared/           # Logger, config, DI container, errors
```

**Dependency rule:** Outer layers depend on inner layers. Domain has zero external dependencies.

---

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose

### 1. Clone & Install

```bash
git clone https://github.com/your-org/securefile-storage.git
cd securefile-storage
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env — fill in DB credentials and generate JWT secrets:
openssl rand -hex 32  # run twice for ACCESS and REFRESH secrets
```

### 3. Start Services

```bash
# Start PostgreSQL + Redis
docker-compose up postgres redis -d

# Run in development mode (hot reload)
npm run dev
```

### 4. Run Tests

```bash
# Unit tests
npm test

# Unit tests with coverage
npm run test:coverage

# E2E tests (requires docker-compose.test.yml services)
docker-compose -f docker-compose.test.yml up -d
npm run test:e2e
```

### 5. Production

```bash
# Full stack with Docker Compose
docker-compose up -d
```

---

## API Reference

### Auth

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/register` | Register new account | Public |
| POST | `/api/v1/auth/login` | Login, receive tokens | Public |
| POST | `/api/v1/auth/refresh` | Rotate refresh token | Public |
| POST | `/api/v1/auth/logout` | Blacklist tokens | 🔒 Required |
| GET | `/api/v1/auth/me` | Get current user | 🔒 Required |

### Files

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/files` | Upload file (multipart/form-data) | 🔒 Required |
| GET | `/api/v1/files` | List files (paginated) | 🔒 Required |
| GET | `/api/v1/files/:id/download` | Download file | 🔒 Required |
| GET | `/api/v1/files/:id/versions` | Get version history | 🔒 Required |
| DELETE | `/api/v1/files/:id` | Soft/hard delete | 🔒 Required |

### Shares

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/files/:fileId/shares` | Generate share URL | 🔒 Required |
| GET | `/api/v1/shares/:token` | Access shared file | Public |

---

## Environment Variables

See [`.env.example`](.env.example) for all configuration options with descriptions.

---

## Security

- JWT tokens verified on every request; blacklisted on logout via Redis
- Refresh token rotation prevents replay attacks
- Brute-force login protection (5 attempts → 15-min lockout)
- Helmet CSP headers on all responses
- File virus scan before storage (ClamAV in production)
- Non-root Docker user
- No secrets in source code or version control

---

## License

[MIT](LICENSE)
