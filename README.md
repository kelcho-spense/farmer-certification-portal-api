# Farmer Certification Portal API

A RESTful API built with NestJS for managing farmer certification processes. This API provides authentication, authorization, and farmer certification management features.

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Database Schema](#database-schema)
- [Deployment](#deployment)
- [Project Structure](#project-structure)

## Features

- User registration and authentication with JWT tokens
- Role-based access control (Farmer and Admin roles)
- Farmer certification status management
- Secure password hashing with bcrypt
- Token refresh mechanism
- Swagger API documentation
- PostgreSQL database with TypeORM

## Technology Stack

- **Runtime**: Node.js 20+
- **Framework**: NestJS 11
- **Language**: TypeScript
- **Database**: PostgreSQL 16
- **ORM**: TypeORM
- **Authentication**: Passport.js with JWT strategy
- **Documentation**: Swagger/OpenAPI
- **Package Manager**: pnpm

## Prerequisites

- Node.js >= 20.9.0
- PostgreSQL 16 or higher
- pnpm (recommended) or npm

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd farmer-certification-portal-api
```

2. Install dependencies:

```bash
pnpm install
```

3. Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration values.

## Configuration

The application uses environment variables for configuration. Create a `.env` file with the following variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USERNAME` | Database username | `postgres` |
| `DB_PASSWORD` | Database password | `postgres` |
| `DB_NAME` | Database name | `farmer_certification` |
| `DB_SSL` | Enable SSL for database connection | `false` |
| `JWT_ACCESS_SECRET` | Secret key for access tokens | - |
| `JWT_ACCESS_EXPIRES_IN_SECONDS` | Access token expiration (seconds) | `900` |
| `JWT_REFRESH_SECRET` | Secret key for refresh tokens | - |
| `JWT_REFRESH_EXPIRES_IN_SECONDS` | Refresh token expiration (seconds) | `604800` |
| `PORT` | Application port | `8000` |
| `NODE_ENV` | Environment mode | `development` |

**Important**: For production, set `DB_SSL=true` when connecting to Azure PostgreSQL or other cloud databases.

## Running the Application

### Development

```bash
# Start in development mode with hot reload
pnpm run start:dev

# Start in debug mode
pnpm run start:debug
```

### Production

```bash
# Build the application
pnpm run build

# Start in production mode
pnpm run start:prod
```

### Database Seeding

To seed the database with an admin user:

```bash
pnpm run db:seed
```

This creates an admin user with the following credentials:
- Email: `admin@farmcert.com`
- Password: `Admin@123`

### Using Docker

```bash
# Build and run with Docker Compose (from project root)
docker-compose up --build
```

## API Documentation

Once the application is running, Swagger documentation is available at:

```
http://localhost:8000/api/docs
```

The Swagger UI provides interactive documentation for all API endpoints, including request/response schemas and the ability to test endpoints directly.

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register a new farmer | No |
| POST | `/api/auth/login` | Login and receive tokens | No |
| POST | `/api/auth/admin/register` | Register a new admin | No |
| POST | `/api/auth/logout` | Logout current user | Yes |
| POST | `/api/auth/refresh` | Refresh access token | Yes (Refresh Token) |

### Farmers

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/farmers` | List all farmers | Admin only |
| GET | `/api/farmers/me` | Get current user profile | Yes |
| GET | `/api/farmers/:id/status` | Get farmer certification status | Yes |
| PATCH | `/api/farmers/:id/status` | Update farmer certification status | Admin only |

## Authentication

The API uses JWT (JSON Web Tokens) for authentication with a dual-token strategy:

### Access Token
- Short-lived token (default: 15 minutes)
- Used for API authorization
- Sent in the `Authorization` header as `Bearer <token>`

### Refresh Token
- Long-lived token (default: 7 days)
- Used to obtain new access tokens
- Stored securely (hashed) in the database

### Token Flow

1. User logs in with email/password
2. Server returns access token and refresh token
3. Client includes access token in subsequent requests
4. When access token expires, client uses refresh token to get new tokens
5. On logout, refresh token is invalidated

### Example Request

```bash
curl -X GET "http://localhost:8000/api/farmers/me" \
  -H "Authorization: Bearer <access_token>"
```

## Database Schema

### User Entity

| Column | Type | Description |
|--------|------|-------------|
| `id` | integer | Primary key (auto-increment) |
| `email` | varchar | Unique email address |
| `password` | varchar | Hashed password |
| `name` | varchar | Full name |
| `farmSize` | decimal | Farm size in acres (nullable) |
| `cropType` | varchar | Type of crop grown (nullable) |
| `role` | enum | User role: `farmer` or `admin` |
| `status` | enum | Certification status: `pending`, `certified`, or `declined` |
| `hashedRefreshToken` | varchar | Hashed refresh token (nullable) |
| `createdAt` | timestamp | Record creation timestamp |
| `updatedAt` | timestamp | Record update timestamp |

## Deployment

### Azure App Service

1. Create an Azure App Service with Node.js 20 runtime

2. Configure environment variables in Azure Portal:
   - Navigate to Configuration > Application settings
   - Add all required environment variables
   - Set `DB_SSL=true` for Azure PostgreSQL

3. Deploy using GitHub Actions (workflow included in `.github/workflows/`)

### Environment Variables for Azure

Ensure the following are set in Azure App Service Configuration:

```
DB_HOST=<your-postgres-server>.postgres.database.azure.com
DB_PORT=5432
DB_USERNAME=<username>
DB_PASSWORD=<password>
DB_NAME=<database-name>
DB_SSL=true
JWT_ACCESS_SECRET=<secure-random-string>
JWT_REFRESH_SECRET=<secure-random-string>
JWT_ACCESS_EXPIRES_IN_SECONDS=900
JWT_REFRESH_EXPIRES_IN_SECONDS=604800
PORT=8000
NODE_ENV=production
```

## Project Structure

```
src/
├── auth/                    # Authentication module
│   ├── dto/                 # Data transfer objects
│   ├── guards/              # Auth guards
│   ├── strategies/          # Passport strategies
│   └── types/               # Type definitions
├── common/                  # Shared utilities
│   ├── decorators/          # Custom decorators
│   ├── enums/               # Enum definitions
│   └── guards/              # Common guards
├── database/                # Database utilities
│   └── seed.ts              # Database seeding script
├── farmers/                 # Farmers module
│   └── dto/                 # Data transfer objects
├── users/                   # Users module
│   └── entities/            # TypeORM entities
├── app.module.ts            # Root application module
├── app.controller.ts        # Root controller
├── app.service.ts           # Root service
└── main.ts                  # Application entry point
```

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm run build` | Build the application |
| `pnpm run start` | Start in production mode |
| `pnpm run start:dev` | Start in development mode with hot reload |
| `pnpm run start:debug` | Start in debug mode |
| `pnpm run start:prod` | Start the production build |
| `pnpm run lint` | Run ESLint |
| `pnpm run format` | Format code with Prettier |
| `pnpm run db:seed` | Seed the database |

## License

This project is UNLICENSED.
