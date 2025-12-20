# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Cotador Enterprise is a high-scale SaaS platform for service pricing and management. It's built as a monorepo using **pnpm workspaces** with multiple apps and shared packages, following Clean Architecture principles with strict TypeScript enforcement.

### Package Manager

This project uses **pnpm** (not npm) for dependency management. pnpm provides efficient disk space usage through content-addressable storage and strict dependency resolution.

**Key Points:**

- All packages are scoped under `@cotador/*` namespace (e.g., `@cotador/shared`)
- pnpm commands don't require the `run` keyword for scripts: use `pnpm test` instead of `pnpm run test`
- Workspace dependencies are automatically linked by pnpm
- The `pnpm-workspace.yaml` file defines workspace packages

## Project Structure

```
cotador-enterprise/
├── apps/
│   ├── api-core/          # NestJS backend API
│   └── mobile/            # React Native mobile app
├── packages/
│   └── shared/            # Shared contracts, types, and event schemas
├── scripts/               # Infrastructure setup scripts
└── [documentation files]  # DESIGN_DOCUMENT.md, DEVELOPMENT_GUIDELINES.md, etc.
```

## Essential Commands

### Development

```bash
# Install dependencies (root and workspaces)
pnpm install

# Start infrastructure (PostgreSQL, RabbitMQ, Redis)
docker-compose up -d

# Check infrastructure health
docker-compose ps

# Stop infrastructure
docker-compose down

# View infrastructure logs
docker-compose logs -f [service_name]
```

### API Core (apps/api-core)

```bash
cd apps/api-core

# Development
pnpm start:dev             # Start with hot-reload
pnpm start:debug           # Start with debugger
pnpm build                 # Production build
pnpm start:prod            # Start production

# Database
pnpm prisma migrate dev    # Run migrations in dev
pnpm prisma migrate deploy # Run migrations in production
pnpm prisma studio         # Open Prisma Studio GUI
pnpm prisma generate       # Regenerate Prisma Client

# Testing
pnpm test                  # Run unit tests
pnpm test:watch            # Run tests in watch mode
pnpm test:cov              # Run with coverage
pnpm test:e2e              # Run e2e tests
pnpm test:debug            # Debug tests

# Code Quality
pnpm lint                  # Run ESLint
pnpm format                # Format with Prettier
```

### Shared Package (packages/shared)

```bash
cd packages/shared
pnpm build                 # Compile TypeScript
pnpm lint                  # Run linter
```

### Root Level

```bash
# Lint all workspaces
pnpm lint

# Format all files
pnpm format

# Test all workspaces
pnpm test

# Run command in specific workspace
pnpm --filter @cotador/api-core test
pnpm --filter @cotador/shared build
```

### Infrastructure Scripts

```bash
# Setup RabbitMQ exchanges, queues, and bindings
./scripts/setup-rabbitmq.sh

# Monitor Dead Letter Queue
./scripts/monitor-dlq.sh
```

## Architecture

### Clean Architecture Layers

The codebase follows Clean Architecture with strict dependency rules:

```
Infra (Controllers, Repositories) → Application (Use Cases) → Domain (Entities, Rules)
```

**CRITICAL**: Domain layer NEVER imports from Application or Infra layers.

**Directory Structure (api-core/src/):**

- `domain/` - Entities, value objects, domain exceptions, repository interfaces
- `application/` - Use cases, application DTOs
- `infra/` - Controllers, Prisma repositories, NestJS modules, config

### Multi-Tenancy

The system implements Row-Level Security (RLS) with `tenantId` on all critical tables. Every query must filter by tenant. Prisma middleware handles automatic tenant filtering.

### Event-Driven Architecture

- RabbitMQ for asynchronous operations
- Exchange: `cotador.events` (topic, durable)
- Queues: `budget.created`, `budget.pdf.ready`
- DLX: `cotador.dlx` with DLQs for failed messages
- Event contracts defined in `packages/shared/src/events/`

## Critical Development Rules

### TypeScript Strictness

- **NO `any` types allowed** - Use `unknown` with type guards if needed
- All strict compiler options enabled (see tsconfig.json)
- Use `interface` for objects/contracts, `type` for unions/intersections

### Code Quality

- Pre-commit hooks (Husky) run lint and tests - commits WILL be blocked if they fail
- Minimum 80% test coverage required
- Conventional Commits format mandatory: `feat(api-core): description`

### Testing

- Unit tests: Place `.spec.ts` files next to source files
- E2E tests: Place in `apps/api-core/test/` directory
- Always test domain logic and use cases
- Mock external dependencies (database, message queue)

### Domain Layer Rules

**NEVER:**

- Import from `infra/` or `application/` in `domain/`
- Use framework decorators in entities
- Access database directly from domain

**ALWAYS:**

- Keep business logic in domain layer
- Define repository interfaces in `domain/repositories/`
- Throw domain exceptions from `domain/exceptions/`

### Database Migrations

1. Modify `apps/api-core/prisma/schema.prisma`
2. Run `pnpm prisma migrate dev --name descriptive_migration_name`
3. Review generated SQL in `prisma/migrations/`
4. Commit both schema and migration files
5. Team members run `pnpm prisma migrate deploy` after pulling

### Shared Package

Event contracts and types go in `packages/shared/`:

- Event schemas with Zod validation
- Shared TypeScript interfaces
- Common DTOs used across services

After changes:

```bash
cd packages/shared
pnpm build
```

## Important Files

- **DESIGN_DOCUMENT.md** - Complete architecture, business rules, and technical decisions
- **DEVELOPMENT_GUIDELINES.md** - Mandatory coding standards, architecture rules, and patterns (READ THIS FIRST)
- **IMPLEMENTATION_PLAN.md** - Messaging and worker implementation roadmap
- **LOW_LEVEL_TASK_LIST.md** - Detailed task checklist for current implementation phase
- **CODE_REVIEW_CHECKLIST.md** - Required checks before PR approval

## Environment Setup

### Required Services

- Node.js 20+
- pnpm 8+ (install globally: `npm install -g pnpm`)
- Docker and Docker Compose
- PostgreSQL 15+ (via Docker)
- RabbitMQ 3+ (via Docker)
- Redis (via Docker)

### Environment Variables

Copy `apps/api-core/.env.example` to `apps/api-core/.env` and configure:

- Database connection string
- RabbitMQ connection string
- Redis connection string
- JWT secrets
- External API keys (if applicable)

## Workflow

### Git Branching

1. Create feature branch: `git checkout -b feature/description` or `fix/description`
2. Make changes following development guidelines
3. Commit with conventional format: `feat(scope): description`
4. Push and create Pull Request
5. Code review required before merge
6. Main branch: `main`

### Before Committing

1. Ensure lint passes: `pnpm lint`
2. Ensure tests pass: `pnpm test`
3. Pre-commit hooks will enforce this automatically

### Common Patterns

**Creating a new use case:**

1. Define repository interface in `domain/repositories/`
2. Create use case in `application/use-cases/`
3. Implement repository in `infra/database/repositories/`
4. Create controller in `infra/controllers/`
5. Register in appropriate NestJS module

**Adding a new domain entity:**

1. Create entity class in `domain/entities/`
2. Add validation logic and business rules in entity methods
3. Create/update repository interface
4. Write unit tests for entity behavior

## Common Issues

**Prisma Client out of sync:**

```bash
cd apps/api-core
pnpm prisma generate
```

**Port conflicts:**
Check if ports 5432 (PostgreSQL), 5672/15672 (RabbitMQ), 6379 (Redis) are available.

**Module resolution errors:**
Ensure `@cotador/shared` is built: `cd packages/shared && pnpm build`

**pnpm workspace issues:**
If dependencies aren't resolving correctly, try:

```bash
pnpm install --force
```

**Database connection errors:**
Verify Docker containers are running: `docker-compose ps`
Check `.env` file has correct connection strings.

## Performance Considerations

- Use Redis for caching (prefix with tenantId)
- Implement pagination for large result sets
- Use database indexes on tenantId columns
- Async operations via RabbitMQ for heavy tasks (e.g., PDF generation)

## Security

- NEVER commit credentials or secrets
- Use environment variables for sensitive data
- Validate all user inputs at controller level
- Apply tenant isolation on all database queries
- Don't log sensitive information (passwords, tokens, PII)
