# Manual de Desenvolvimento - Cotador Enterprise

## Regras de Ouro para Desenvolvimento de Software

**Versão**: 1.0  
**Data**: 2025-01-17  
**Aplicável a**: Todos os microsserviços (NestJS) e Frontend (React Native)

---

> ⚠️ **IMPORTANTE**: Este documento contém **REGRAS OBRIGATÓRIAS**. Desvios só são permitidos após aprovação explícita do Tech Lead ou Staff Engineer.

---

## Índice

1. [Padrões de Código](#1-padrões-de-código-coding-standards)
2. [Regras de Arquitetura](#2-regras-de-arquitetura-clean-architecture-enforcement)
3. [Fluxo de Trabalho](#3-fluxo-de-trabalho-git-workflow)
4. [Estratégia de Testes](#4-estratégia-de-testes-quality-assurance)
5. [Tratamento de Erros e Logs](#5-tratamento-de-erros-e-logs)
6. [Segurança e Performance](#6-segurança-e-performance)

---

## 1. Padrões de Código (Coding Standards)

### 1.1 TypeScript Strictness

#### ❌ PROIBIDO: Uso de `any`

**NUNCA** use `any`. Se você não sabe o tipo, use `unknown` e faça type guards.

```typescript
// ❌ ERRADO
function processData(data: any) {
  return data.value;
}

// ✅ CORRETO
function processData(data: unknown) {
  if (typeof data === "object" && data !== null && "value" in data) {
    return (data as { value: number }).value;
  }
  throw new Error("Invalid data structure");
}
```

#### ✅ OBRIGATÓRIO: TypeScript Strict Mode

Configure `tsconfig.json` com todas as opções strict habilitadas:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

#### ✅ REGRA: Interfaces vs Types

**Use `interface` para contratos (objetos, classes, DTOs):**

```typescript
// ✅ CORRETO - Interface para contratos
interface CreateBudgetDto {
  clientName: string;
  items: BudgetItemDto[];
}

interface IBudgetRepository {
  save(budget: Budget): Promise<void>;
  findById(id: string): Promise<Budget | null>;
}
```

**Use `type` para uniões, interseções e tipos primitivos:**

```typescript
// ✅ CORRETO - Type para uniões e tipos complexos
type BudgetStatus = "draft" | "approved" | "rejected";
type Nullable<T> = T | null;
type EventPayload = BudgetCreatedEvent | BudgetUpdatedEvent;
```

**❌ NUNCA** use `type` quando `interface` é mais apropriado:

```typescript
// ❌ ERRADO
type CreateBudgetDto = {
  clientName: string;
};

// ✅ CORRETO
interface CreateBudgetDto {
  clientName: string;
}
```

### 1.2 Naming Conventions

#### Arquivos e Diretórios: `kebab-case`

```typescript
// ✅ CORRETO
create-budget.use-case.ts
budget-repository.interface.ts
prisma-budget.repository.ts

// ❌ ERRADO
CreateBudget.ts
budgetRepository.ts
```

#### Classes: `PascalCase`

```typescript
// ✅ CORRETO
export class CreateBudgetUseCase {}
export class BudgetController {}
export class PrismaBudgetRepository {}

// ❌ ERRADO
export class createBudgetUseCase {}
export class budget_controller {}
```

#### Variáveis e Funções: `camelCase`

```typescript
// ✅ CORRETO
const budgetId = "123";
const clientName = "Acme Corp";
function calculateTotal() {}

// ❌ ERRADO
const budget_id = "123";
const ClientName = "Acme Corp";
function CalculateTotal() {}
```

#### Constantes: `UPPER_SNAKE_CASE`

```typescript
// ✅ CORRETO
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_TIMEOUT_MS = 5000;
const API_BASE_URL = "https://api.cotador.enterprise";

// ❌ ERRADO
const maxRetryAttempts = 3;
const defaultTimeout = 5000;
```

#### Interfaces: Prefixo `I` apenas para contratos de domínio

```typescript
// ✅ CORRETO - Interfaces de domínio (repositórios, serviços)
interface IBudgetRepository {}
interface IEventBus {}
interface IStorageService {}

// ✅ CORRETO - DTOs e entidades não usam prefixo
interface CreateBudgetDto {}
interface BudgetResponse {}
class Budget {}

// ❌ ERRADO
interface BudgetRepository {} // Falta I para contrato
interface ICreateBudgetDto {} // DTO não precisa I
```

### 1.3 Linting & Formatting

#### ✅ OBRIGATÓRIO: ESLint + Prettier

**Configuração mínima do ESLint:**

```javascript
// eslint.config.mjs
export default {
  rules: {
    "@typescript-eslint/no-explicit-any": "error", // PROIBIDO any
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/await-thenable": "error",
    "prefer-const": "error",
    "no-var": "error",
  },
};
```

**Configuração do Prettier (.prettierrc):**

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

#### ✅ OBRIGATÓRIO: Pre-commit Hook (Husky)

**Configure Husky para rodar lint e testes antes de cada commit:**

```json
// package.json
{
  "scripts": {
    "prepare": "husky install",
    "lint": "eslint \"src/**/*.ts\" --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "test": "jest"
  },
  "devDependencies": {
    "husky": "^8.0.0",
    "lint-staged": "^13.0.0"
  }
}
```

```json
// .lintstagedrc.json
{
  "*.ts": [
    "eslint --fix",
    "prettier --write",
    "jest --findRelatedTests --passWithNoTests"
  ]
}
```

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

**❌ PROIBIDO**: Commits que quebram o lint ou testes. O hook **DEVE** bloquear.

---

## 2. Regras de Arquitetura (Clean Architecture Enforcement)

### 2.1 Regra de Dependência (Dependency Rule)

#### ✅ REGRA DE OURO: Domain NUNCA importa de Infra ou Application

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│  (Controllers, DTOs, HTTP Adapters)                       │
│                    ↓ imports                             │
┌─────────────────────────────────────────────────────────┐
│                  Application Layer                       │
│  (Use Cases, Application Services)                       │
│                    ↓ imports                             │
┌─────────────────────────────────────────────────────────┐
│                    Domain Layer                          │
│  (Entities, Value Objects, Interfaces)                  │
│                    ↑ NUNCA importa de cima              │
└─────────────────────────────────────────────────────────┘
```

#### ❌ PROIBIDO: Importações Violando a Regra

```typescript
// ❌ ERRADO - Domain importando de Infra
// domain/entities/budget.entity.ts
import { PrismaService } from "../../infra/database/prisma/prisma.service"; // ❌ PROIBIDO

// ❌ ERRADO - Domain importando de Application
// domain/entities/budget.entity.ts
import { CreateBudgetUseCase } from "../../application/use-cases/create-budget.use-case"; // ❌ PROIBIDO

// ✅ CORRETO - Domain só importa de Domain
// domain/entities/budget.entity.ts
import { BudgetItem } from "./budget-item.entity"; // ✅ OK
import { Money } from "../value-objects/money.vo"; // ✅ OK
```

#### ✅ CORRETO: Fluxo de Dependências

```typescript
// ✅ CORRETO - Application importa Domain
// application/use-cases/create-budget.use-case.ts
import { Budget } from "../../domain/entities/budget.entity"; // ✅ OK
import { IBudgetRepository } from "../../domain/repositories/budget-repository.interface"; // ✅ OK

// ✅ CORRETO - Infra importa Domain e Application
// infra/database/repositories/prisma-budget.repository.ts
import { IBudgetRepository } from "../../../domain/repositories/budget-repository.interface"; // ✅ OK
import { Budget } from "../../../domain/entities/budget.entity"; // ✅ OK

// ✅ CORRETO - Controllers importam Application
// infra/controllers/budget.controller.ts
import { CreateBudgetUseCase } from "../../application/use-cases/create-budget.use-case"; // ✅ OK
```

### 2.2 Injeção de Dependência

#### ❌ PROIBIDO: Instanciação Manual de Dependências

```typescript
// ❌ ERRADO - Instanciação manual
export class CreateBudgetUseCase {
  async execute(input: CreateBudgetDto) {
    const repository = new PrismaBudgetRepository(); // ❌ PROIBIDO
    const eventBus = new RabbitMQEventBus(); // ❌ PROIBIDO
  }
}

// ✅ CORRETO - Injeção via construtor
export class CreateBudgetUseCase {
  constructor(
    private readonly budgetRepo: IBudgetRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: CreateBudgetDto) {
    // Usa this.budgetRepo e this.eventBus
  }
}
```

#### ✅ OBRIGATÓRIO: Provider Pattern no NestJS

```typescript
// ✅ CORRETO - Módulo configurando providers
@Module({
  providers: [
    {
      provide: "IBudgetRepository",
      useClass: PrismaBudgetRepository,
    },
    {
      provide: "IEventBus",
      useClass: RabbitMQEventBus,
    },
    {
      provide: CreateBudgetUseCase,
      useFactory: (repo: IBudgetRepository, eventBus: IEventBus) =>
        new CreateBudgetUseCase(repo, eventBus),
      inject: ["IBudgetRepository", "IEventBus"],
    },
  ],
})
export class BudgetModule {}
```

### 2.3 DTOs (Data Transfer Objects)

#### ❌ PROIBIDO: Passar Objetos Puros do Body para UseCase

```typescript
// ❌ ERRADO - Sem DTO e validação
@Controller("budgets")
export class BudgetController {
  @Post()
  async create(@Body() body: any) {
    // ❌ any e sem validação
    return this.useCase.execute(body); // ❌ Objeto não validado
  }
}

// ✅ CORRETO - DTO com validação
// infra/dtos/create-budget.dto.ts
import {
  IsString,
  IsArray,
  ValidateNested,
  MinLength,
  IsNumber,
  Min,
} from "class-validator";
import { Type } from "class-transformer";

class BudgetItemDto {
  @IsString()
  @MinLength(1)
  description!: string;

  @IsNumber()
  @Min(0.01)
  price!: number;

  @IsNumber()
  @Min(1)
  qty!: number;
}

export class CreateBudgetDto {
  @IsString()
  @MinLength(1)
  clientName!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BudgetItemDto)
  items!: BudgetItemDto[];
}

// infra/controllers/budget.controller.ts
@Controller("budgets")
export class BudgetController {
  @Post()
  async create(@Body() dto: CreateBudgetDto) {
    // ✅ DTO tipado
    return this.useCase.execute(dto); // ✅ Validado pelo ValidationPipe
  }
}
```

#### ✅ OBRIGATÓRIO: ValidationPipe Global

```typescript
// main.ts
import { ValidationPipe } from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove propriedades não definidas no DTO
      forbidNonWhitelisted: true, // Rejeita requisições com propriedades extras
      transform: true, // Transforma payloads para instâncias de DTO
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.listen(3000);
}
```

#### ✅ REGRA: DTOs na Camada de Infraestrutura

```typescript
// ✅ CORRETO - DTOs em infra/dtos/
// infra/dtos/create-budget.dto.ts
export class CreateBudgetDto {}

// ✅ CORRETO - Use Case recebe interface simples
// application/use-cases/create-budget.use-case.ts
interface CreateBudgetInput {
  clientName: string;
  items: { description: string; price: number; qty: number }[];
}

export class CreateBudgetUseCase {
  async execute(input: CreateBudgetInput) {
    // Use Case não conhece DTOs de infra
  }
}

// ✅ CORRETO - Controller converte DTO para Input
@Controller("budgets")
export class BudgetController {
  @Post()
  async create(@Body() dto: CreateBudgetDto) {
    return this.useCase.execute({
      clientName: dto.clientName,
      items: dto.items,
    });
  }
}
```

---

## 3. Fluxo de Trabalho (Git Workflow)

### 3.1 Branch Strategy

#### ✅ OBRIGATÓRIO: Feature Branches (Git Flow Simplificado)

```
main (produção)
  ↑
develop (desenvolvimento)
  ↑
feature/feat-name (features)
  ↑
bugfix/bug-name (correções)
```

**Regras:**

1. **`main`**: Apenas código em produção. Protegida, merge apenas via Pull Request aprovado.
2. **`develop`**: Branch de desenvolvimento. Todas as features são mergeadas aqui primeiro.
3. **`feature/*`**: Branches para novas funcionalidades. Nome: `feature/add-budget-validation`
4. **`bugfix/*`**: Branches para correções. Nome: `bugfix/fix-pdf-generation-error`

#### ❌ PROIBIDO: Commits Diretos em `main` ou `develop`

```bash
# ❌ ERRADO
git checkout main
git commit -m "Add feature" # ❌ PROIBIDO

# ✅ CORRETO
git checkout -b feature/add-budget-validation
# ... desenvolve ...
git commit -m "feat(api-core): add budget validation"
git push origin feature/add-budget-validation
# Abre Pull Request para develop
```

### 3.2 Conventional Commits

#### ✅ OBRIGATÓRIO: Formato Semântico

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Tipos permitidos:**

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação (não afeta código)
- `refactor`: Refatoração
- `test`: Testes
- `chore`: Tarefas de manutenção
- `perf`: Melhoria de performance
- `ci`: Mudanças em CI/CD

**Exemplos:**

```bash
# ✅ CORRETO
feat(api-core): add budget validation
fix(micro-pdf): resolve PDF generation timeout
refactor(domain): extract pricing rules to value objects
test(use-cases): add integration tests for create budget
docs(readme): update setup instructions

# ❌ ERRADO
Add feature # ❌ Sem tipo
fix: bug # ❌ Sem escopo
feat: add stuff # ❌ Mensagem vaga
```

#### ✅ OBRIGATÓRIO: Commitizen (Opcional mas Recomendado)

```bash
npm install -D commitizen cz-conventional-changelog

# package.json
{
  "config": {
    "commitizen": {
      "path": "./node_modules/cz-conventional-changelog"
    }
  },
  "scripts": {
    "commit": "cz"
  }
}
```

### 3.3 Code Review Guidelines

#### ✅ Checklist Obrigatório para Revisores

**1. Segurança**

- [ ] Não há credenciais hardcoded (senhas, tokens, API keys)
- [ ] Validação de entrada adequada (SQL injection, XSS)
- [ ] Autorização verificada (usuário pode acessar recurso?)
- [ ] Dados sensíveis não são logados

**2. Performance**

- [ ] Queries de banco otimizadas (índices, N+1 queries evitadas)
- [ ] Operações assíncronas usadas corretamente (async/await)
- [ ] Cache utilizado quando apropriado
- [ ] Não há loops aninhados desnecessários

**3. Testes**

- [ ] Novas funcionalidades têm testes unitários
- [ ] Casos de erro são testados
- [ ] Cobertura de testes mantida (>80%)
- [ ] Testes de integração para endpoints críticos

**4. Legibilidade**

- [ ] Código segue padrões de nomenclatura
- [ ] Funções pequenas e com responsabilidade única
- [ ] Comentários explicam "por quê", não "o quê"
- [ ] Magic numbers substituídos por constantes

**5. Arquitetura**

- [ ] Regra de dependência respeitada (Domain não importa Infra)
- [ ] Use Cases não têm lógica de infraestrutura
- [ ] DTOs validados com class-validator
- [ ] Injeção de dependência usada corretamente

**6. TypeScript**

- [ ] Nenhum `any` usado
- [ ] Tipos explícitos quando necessário
- [ ] Interfaces vs Types usados corretamente

#### ✅ Processo de Review

1. **Criador do PR**: Adiciona descrição clara do que foi feito e por quê
2. **Revisor**: Revisa seguindo checklist acima
3. **Aprovação**: Mínimo de 1 aprovação obrigatória (2 para mudanças críticas)
4. **Merge**: Apenas após aprovação e CI passando

#### ❌ PROIBIDO: Auto-merge sem Review

```bash
# ❌ ERRADO - Merge sem aprovação
git checkout develop
git merge feature/my-feature --no-ff # ❌ Sem review

# ✅ CORRETO - Via Pull Request com aprovação
# Criar PR no GitHub/GitLab
# Aguardar aprovação
# Merge após CI passar
```

---

## 4. Estratégia de Testes (Quality Assurance)

### 4.1 Testing Pyramid

#### ✅ OBRIGATÓRIO: Proporção Esperada

```
        /\
       /  \      E2E Tests (10%)
      /____\     Poucos, críticos
     /      \
    /________\   Integration Tests (20%)
   /          \  Controllers, Repositories
  /____________\ Unit Tests (70%)
                 Use Cases, Helpers, Entities
```

**Meta de Cobertura:**

- **Unit Tests**: >80% de cobertura
- **Integration Tests**: Todos os endpoints e repositórios
- **E2E Tests**: Fluxos críticos de negócio

### 4.2 Unit Tests (Jest)

#### ✅ OBRIGATÓRIO: Testes para Regras de Negócio

```typescript
// ✅ CORRETO - Teste unitário de Use Case
// application/use-cases/create-budget.use-case.spec.ts
import { CreateBudgetUseCase } from "./create-budget.use-case";
import { IBudgetRepository } from "../../domain/repositories/budget-repository.interface";
import { IEventBus } from "../../domain/events/event-bus.interface";

describe("CreateBudgetUseCase", () => {
  let useCase: CreateBudgetUseCase;
  let mockRepository: jest.Mocked<IBudgetRepository>;
  let mockEventBus: jest.Mocked<IEventBus>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
    } as any;

    mockEventBus = {
      publish: jest.fn(),
    } as any;

    useCase = new CreateBudgetUseCase(mockRepository, mockEventBus);
  });

  it("should create budget with correct total", async () => {
    const input = {
      tenantId: "tenant-1",
      clientName: "Acme Corp",
      items: [
        { description: "Service A", price: 100, qty: 2 },
        { description: "Service B", price: 50, qty: 3 },
      ],
    };

    const result = await useCase.execute(input);

    expect(result.total).toBe(350);
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
  });

  it("should throw error if clientName is empty", async () => {
    const input = {
      tenantId: "tenant-1",
      clientName: "",
      items: [{ description: "Service A", price: 100, qty: 1 }],
    };

    await expect(useCase.execute(input)).rejects.toThrow(
      "ClientName is required",
    );
  });
});
```

#### ✅ OBRIGATÓRIO: Testes para Entidades de Domínio

```typescript
// ✅ CORRETO - Teste de entidade de domínio
// domain/entities/budget.entity.spec.ts
import { Budget, BudgetItem } from "./budget.entity";

describe("Budget Entity", () => {
  it("should calculate total correctly", () => {
    const items = [
      new BudgetItem("Service A", 100, 2),
      new BudgetItem("Service B", 50, 3),
    ];

    const budget = new Budget(
      "id-1",
      "Client ABC",
      items,
      0,
      "draft",
      new Date(),
    );

    expect(budget.calculateTotal()).toBe(350);
  });

  it("should not allow approval if no items", () => {
    const budget = new Budget("id-1", "Client ABC", [], 0, "draft", new Date());

    expect(budget.canApprove()).toBe(false);
  });
});
```

#### ❌ PROIBIDO: Testes Unitários Baterem em APIs Externas

```typescript
// ❌ ERRADO - Teste unitário fazendo chamada HTTP real
it("should create budget", async () => {
  const response = await fetch("http://api.external.com/data"); // ❌ PROIBIDO
  // ...
});

// ✅ CORRETO - Mock de dependência externa
it("should create budget", async () => {
  const mockExternalService = {
    getData: jest.fn().mockResolvedValue({ data: "test" }),
  };

  const useCase = new CreateBudgetUseCase(mockExternalService);
  // ...
});
```

### 4.3 Integration Tests (Supertest)

#### ✅ OBRIGATÓRIO: Testes de Controllers

```typescript
// ✅ CORRETO - Teste de integração de controller
// test/integration/budget.controller.spec.ts
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../../src/app.module";

describe("BudgetController (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /budgets should create budget", () => {
    return request(app.getHttpServer())
      .post("/budgets")
      .send({
        clientName: "Acme Corp",
        items: [{ description: "Service A", price: 100, qty: 2 }],
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty("id");
        expect(res.body.total).toBe(200);
      });
  });

  it("POST /budgets should reject invalid data", () => {
    return request(app.getHttpServer())
      .post("/budgets")
      .send({
        clientName: "", // ❌ Inválido
        items: [],
      })
      .expect(400);
  });
});
```

#### ✅ OBRIGATÓRIO: Testes de Repositórios

```typescript
// ✅ CORRETO - Teste de integração de repositório
// test/integration/budget.repository.spec.ts
import { PrismaService } from "../../src/infra/database/prisma/prisma.service";
import { PrismaBudgetRepository } from "../../src/infra/database/repositories/prisma-budget.repository";

describe("PrismaBudgetRepository (integration)", () => {
  let repository: PrismaBudgetRepository;
  let prisma: PrismaService;

  beforeAll(async () => {
    prisma = new PrismaService();
    repository = new PrismaBudgetRepository(prisma);
    // Setup: limpar banco de testes
    await prisma.budgetItem.deleteMany();
    await prisma.budget.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should save budget", async () => {
    const budget = new Budget(/* ... */);
    await repository.save(budget);

    const saved = await repository.findById(budget.id);
    expect(saved).not.toBeNull();
    expect(saved?.clientName).toBe(budget.clientName);
  });
});
```

### 4.4 Mocks e Test Doubles

#### ✅ REGRA: Quando Mockar

**Mock quando:**

- Dependência externa (API, banco de dados, fila)
- Operação lenta (não queremos esperar em testes unitários)
- Efeitos colaterais indesejados (envio de email, logs)

**Não mock quando:**

- Value Objects (são objetos simples)
- Entidades de domínio (teste comportamento real)
- Helpers puros (funções sem efeitos colaterais)

```typescript
// ✅ CORRETO - Mock de repositório (dependência externa)
const mockRepository: jest.Mocked<IBudgetRepository> = {
  save: jest.fn(),
  findById: jest.fn(),
};

// ✅ CORRETO - Mock de event bus (dependência externa)
const mockEventBus: jest.Mocked<IEventBus> = {
  publish: jest.fn(),
};

// ❌ ERRADO - Mock de entidade de domínio
const mockBudget = jest.fn(); // ❌ Não mockar entidades
// ✅ CORRETO - Criar instância real
const budget = new Budget(/* ... */);
```

---

## 5. Tratamento de Erros e Logs

### 5.1 Exception Filters

#### ✅ OBRIGATÓRIO: Filtro Global de Exceções

```typescript
// ✅ CORRETO - Exception Filter Global
// infra/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : "Internal server error";

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: typeof message === "string" ? message : (message as any).message,
      // RFC 7807 format
      type: `https://cotador.enterprise/errors/${status}`,
      instance: request.url,
    };

    // Log erro completo (com stack trace)
    this.logger.error(
      `${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : JSON.stringify(exception),
    );

    response.status(status).json(errorResponse);
  }
}

// main.ts
app.useGlobalFilters(new AllExceptionsFilter());
```

#### ✅ OBRIGATÓRIO: Exceções Customizadas de Domínio

```typescript
// ✅ CORRETO - Exceções de domínio
// domain/exceptions/budget-not-found.exception.ts
export class BudgetNotFoundException extends HttpException {
  constructor(budgetId: string) {
    super(
      {
        statusCode: 404,
        message: `Budget with ID ${budgetId} not found`,
        error: "Not Found",
      },
      404,
    );
  }
}

// Use Case lança exceção de domínio
export class GetBudgetUseCase {
  async execute(budgetId: string) {
    const budget = await this.repository.findById(budgetId);

    if (!budget) {
      throw new BudgetNotFoundException(budgetId); // ✅ Exceção tipada
    }

    return budget;
  }
}
```

#### ❌ PROIBIDO: Erros Genéricos sem Contexto

```typescript
// ❌ ERRADO
throw new Error("Error"); // ❌ Muito genérico

// ✅ CORRETO
throw new BudgetNotFoundException(budgetId); // ✅ Específico e tipado
```

### 5.2 Logging

#### ❌ PROIBIDO: `console.log`, `console.error`, `console.warn`

```typescript
// ❌ ERRADO
console.log("Budget created"); // ❌ PROIBIDO
console.error("Error:", error); // ❌ PROIBIDO

// ✅ CORRETO - Usar Logger do NestJS
import { Logger } from "@nestjs/common";

export class CreateBudgetUseCase {
  private readonly logger = new Logger(CreateBudgetUseCase.name);

  async execute(input: CreateBudgetDto) {
    this.logger.log(`Creating budget for client ${input.clientName}`);

    try {
      // ...
      this.logger.log(`Budget created successfully: ${budget.id}`);
    } catch (error) {
      this.logger.error(`Failed to create budget`, error.stack); // ✅ Com stack trace
      throw error;
    }
  }
}
```

#### ✅ OBRIGATÓRIO: Logs Estruturados

```typescript
// ✅ CORRETO - Logs estruturados com contexto
this.logger.log("Budget created", {
  budgetId: budget.id,
  tenantId: input.tenantId,
  total: budget.total,
});

this.logger.error("Failed to publish event", {
  eventId: event.eventId,
  error: error.message,
  stack: error.stack,
});
```

#### ✅ OBRIGATÓRIO: O Que Logar

**✅ DEVE ser logado:**

- Erros com stack trace completo
- Início e fim de operações críticas (jobs, processos longos)
- Eventos de negócio importantes (criação de orçamento, aprovação)
- Acesso a recursos sensíveis (com contexto, sem dados sensíveis)

**❌ NUNCA logar:**

- Senhas, tokens, API keys
- Dados de cartão de crédito
- Informações pessoais sensíveis (CPF completo, dados médicos)
- Credenciais de autenticação

```typescript
// ❌ ERRADO - Logando dados sensíveis
this.logger.log("User login", {
  email: user.email,
  password: user.password, // ❌ PROIBIDO
  apiKey: user.apiKey, // ❌ PROIBIDO
});

// ✅ CORRETO - Log sem dados sensíveis
this.logger.log("User login", {
  userId: user.id,
  email: user.email, // ✅ OK (email não é sensível neste contexto)
  // password e apiKey NUNCA logados
});
```

---

## 6. Segurança e Performance

### 6.1 Secrets e Credenciais

#### ❌ PROIBIDO TERMINANTEMENTE: Credenciais Hardcoded

```typescript
// ❌ ERRADO - Credenciais no código
const dbPassword = "senha123"; // ❌ PROIBIDO
const apiKey = "sk_live_abc123"; // ❌ PROIBIDO

// ✅ CORRETO - Variáveis de ambiente
const dbPassword = process.env.DATABASE_PASSWORD; // ✅ OK
const apiKey = process.env.API_KEY; // ✅ OK
```

#### ✅ OBRIGATÓRIO: Validação de Secrets no Startup

```typescript
// ✅ CORRETO - Validar variáveis de ambiente obrigatórias
// infra/config/validate-env.ts
import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";
import { IsString, IsNotEmpty } from "class-validator";

class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  RABBITMQ_URL!: string;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET!: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}

// main.ts
import { validate } from "./infra/config/validate-env";

const config = validate(process.env);
```

#### ✅ OBRIGATÓRIO: Pre-commit Hook para Detectar Secrets

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Detectar possíveis secrets no código
if git diff --cached | grep -E "(password|secret|api[_-]?key|token)" | grep -v "process.env"; then
  echo "❌ PROIBIDO: Possível credencial hardcoded detectada!"
  echo "Use variáveis de ambiente (process.env.*)"
  exit 1
fi
```

### 6.2 Async/Await

#### ❌ PROIBIDO: Callback Hell e Promises Não Tratadas

```typescript
// ❌ ERRADO - Callback Hell
function createBudget(data, callback) {
  validateData(data, (err, validated) => {
    if (err) return callback(err);
    saveToDb(validated, (err, saved) => {
      if (err) return callback(err);
      publishEvent(saved, (err) => {
        callback(err, saved);
      });
    });
  });
}

// ❌ ERRADO - Promise não tratada
function createBudget(data) {
  saveToDb(data).then(() => {
    publishEvent(); // ❌ Erro não tratado
  });
}

// ✅ CORRETO - Async/Await
async function createBudget(data: CreateBudgetDto): Promise<Budget> {
  try {
    const validated = await this.validateData(data);
    const saved = await this.saveToDb(validated);
    await this.publishEvent(saved);
    return saved;
  } catch (error) {
    this.logger.error("Failed to create budget", error);
    throw error;
  }
}
```

#### ✅ OBRIGATÓRIO: Tratamento de Erros em Async

```typescript
// ✅ CORRETO - Try/Catch em operações async
async function processBudget(budgetId: string) {
  try {
    const budget = await this.repository.findById(budgetId);
    if (!budget) {
      throw new BudgetNotFoundException(budgetId);
    }

    await this.processBudget(budget);
  } catch (error) {
    if (error instanceof BudgetNotFoundException) {
      throw error; // Re-throw exceções de domínio
    }

    this.logger.error("Unexpected error processing budget", error);
    throw new InternalServerErrorException("Failed to process budget");
  }
}
```

#### ✅ OBRIGATÓRIO: Promise.all para Operações Paralelas

```typescript
// ✅ CORRETO - Operações paralelas com Promise.all
async function processMultipleBudgets(budgetIds: string[]) {
  const budgets = await Promise.all(
    budgetIds.map((id) => this.repository.findById(id)),
  );

  // Processa todos em paralelo
  await Promise.all(budgets.map((budget) => this.processBudget(budget)));
}

// ✅ CORRETO - Promise.allSettled para operações independentes
async function sendNotifications(userIds: string[]) {
  const results = await Promise.allSettled(
    userIds.map((id) => this.notificationService.send(id)),
  );

  // Processa resultados (sucessos e falhas)
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      this.logger.warn(
        `Failed to notify user ${userIds[index]}`,
        result.reason,
      );
    }
  });
}
```

### 6.3 Performance

#### ✅ OBRIGATÓRIO: Índices no Banco de Dados

```prisma
// ✅ CORRETO - Índices para queries frequentes
model Budget {
  id         String   @id @default(uuid())
  tenantId   String
  status     String
  createdAt  DateTime @default(now())

  @@index([tenantId]) // ✅ Para filtrar por tenant
  @@index([status]) // ✅ Para filtrar por status
  @@index([tenantId, status]) // ✅ Índice composto
  @@map("budgets")
}
```

#### ✅ OBRIGATÓRIO: Evitar N+1 Queries

```typescript
// ❌ ERRADO - N+1 Query
const budgets = await this.prisma.budget.findMany();
for (const budget of budgets) {
  const items = await this.prisma.budgetItem.findMany({
    where: { budgetId: budget.id },
  }); // ❌ Query dentro de loop
}

// ✅ CORRETO - Include relacionamentos
const budgets = await this.prisma.budget.findMany({
  include: {
    items: true, // ✅ Carrega tudo em uma query
  },
});
```

#### ✅ OBRIGATÓRIO: Cache para Dados Frequentemente Acessados

```typescript
// ✅ CORRETO - Cache com Redis
@Injectable()
export class BudgetService {
  constructor(
    private readonly repository: IBudgetRepository,
    private readonly cache: RedisService,
  ) {}

  async findById(id: string): Promise<Budget> {
    const cacheKey = `budget:${id}`;

    // Tenta cache primeiro
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Se não estiver em cache, busca no banco
    const budget = await this.repository.findById(id);

    // Salva no cache (TTL de 5 minutos)
    await this.cache.set(cacheKey, JSON.stringify(budget), 300);

    return budget;
  }
}
```

---

## Checklist de Conformidade

Antes de fazer merge de qualquer PR, verifique:

- [ ] ✅ TypeScript strict mode habilitado
- [ ] ✅ Nenhum `any` no código
- [ ] ✅ Naming conventions seguidas (kebab-case, PascalCase, camelCase)
- [ ] ✅ ESLint e Prettier passando
- [ ] ✅ Pre-commit hook configurado
- [ ] ✅ Domain não importa de Infra ou Application
- [ ] ✅ Dependências injetadas via construtor (não `new Service()`)
- [ ] ✅ DTOs com validação (class-validator)
- [ ] ✅ Commits seguem Conventional Commits
- [ ] ✅ Code review aprovado
- [ ] ✅ Testes unitários (>80% cobertura)
- [ ] ✅ Testes de integração para endpoints
- [ ] ✅ Exception filter global configurado
- [ ] ✅ Logger usado (não `console.log`)
- [ ] ✅ Nenhuma credencial hardcoded
- [ ] ✅ Async/await usado corretamente
- [ ] ✅ Índices no banco para queries frequentes

---

## Conclusão

Este manual estabelece as **Regras de Ouro** para desenvolvimento no Cotador Enterprise. Seguir estas diretrizes garante:

- ✅ **Qualidade**: Código testável, manutenível e escalável
- ✅ **Segurança**: Proteção contra vulnerabilidades comuns
- ✅ **Performance**: Otimizações aplicadas desde o início
- ✅ **Consistência**: Todos os desenvolvedores seguem os mesmos padrões

**Desvios só são permitidos após aprovação explícita do Tech Lead ou Staff Engineer.**

---

**Documento mantido por**: Tech Lead / Staff Engineer  
**Última atualização**: 2025-01-17  
**Próxima revisão**: Trimestral ou quando necessário
