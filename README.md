# Project Hub — Backend

Express + TypeScript + Prisma (PostgreSQL) + JWT auth.

## Stack
- **Runtime:** Node.js 20+
- **Framework:** Express 4
- **ORM:** Prisma (PostgreSQL)
- **Validation:** Zod
- **Auth:** JWT (access + refresh)
- **Logging:** Winston + Morgan
- **Security:** helmet, cors, express-rate-limit, bcryptjs

## Project structure

```
backend/
├── prisma/
│   └── schema.prisma         # DB schema (User, Project)
└── src/
    ├── server.ts             # Bootstraps app, handles signals
    ├── app.ts                # Express app composition
    ├── config/
    │   ├── env.ts            # Zod-validated env vars
    │   └── logger.ts         # Winston logger
    ├── db/
    │   └── prisma.ts         # Prisma client singleton
    ├── routes/
    │   └── index.ts          # /api/v1 root router
    ├── middlewares/
    │   ├── auth.middleware.ts
    │   ├── error.middleware.ts
    │   ├── notFound.middleware.ts
    │   └── validate.middleware.ts
    ├── modules/
    │   ├── auth/             # register/login/refresh/me
    │   ├── users/            # list/get users
    │   └── projects/         # CRUD example resource
    └── utils/
        ├── ApiError.ts
        ├── catchAsync.ts
        ├── jwt.ts
        └── password.ts
```

## Getting started

```powershell
cd backend
copy .env.example .env       # then edit .env
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run dev
```

API will be available at `http://localhost:4000/api/v1`.

## Endpoints

| Method | Path                       | Auth      | Description              |
| ------ | -------------------------- | --------- | ------------------------ |
| GET    | `/api/v1/health`           | —         | Health check             |
| POST   | `/api/v1/auth/register`    | —         | Create account           |
| POST   | `/api/v1/auth/login`       | —         | Sign in, returns tokens  |
| POST   | `/api/v1/auth/refresh`     | —         | Exchange refresh token   |
| GET    | `/api/v1/auth/me`          | Bearer    | Current user payload     |
| GET    | `/api/v1/users`            | ADMIN     | List users               |
| GET    | `/api/v1/users/:id`        | Bearer    | Get user by id           |
| GET    | `/api/v1/projects`         | Bearer    | List own projects        |
| POST   | `/api/v1/projects`         | Bearer    | Create project           |
| GET    | `/api/v1/projects/:id`     | Bearer    | Get own project          |
| PATCH  | `/api/v1/projects/:id`     | Bearer    | Update own project       |
| DELETE | `/api/v1/projects/:id`     | Bearer    | Delete own project       |

## Scripts
- `npm run dev` — start with hot reload via ts-node-dev
- `npm run build` — compile to `dist/`
- `npm start` — run compiled output
- `npm run prisma:migrate` — create/apply migrations
- `npm run prisma:studio` — open Prisma Studio
