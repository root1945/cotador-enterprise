# Cotador Enterprise - Design Document Técnico
## Versão 1.0 | Data: 2025-01-17

---

## Índice

1. [Produto (O Que e Por Quê)](#1-produto-o-que-e-por-quê)
2. [Design e Arquitetura (Como)](#2-design-e-arquitetura-como)
3. [Infraestrutura (Onde e Com o Quê)](#3-infraestrutura-onde-e-com-o-quê)
4. [Operacional (Como Manter)](#4-operacional-como-manter)
5. [Conhecimento e Referência (Como Trabalhar)](#5-conhecimento-e-referência-como-trabalhar)
6. [Plano de Ação Global (Roadmap de Engenharia)](#6-plano-de-ação-global-roadmap-de-engenharia)

---

## 1. Produto (O Que e Por Quê)

### 1.1 Problema de Negócio

A precificação manual de serviços em empresas de médio e grande porte apresenta desafios críticos que impedem escalabilidade e eficiência operacional:

**Desafios Identificados:**

- **Inconsistência de Preços**: Cálculos manuais estão sujeitos a erros humanos, resultando em variações de preço para o mesmo serviço em diferentes contextos.
- **Latência na Resposta**: O processo manual de criação de orçamentos pode levar horas ou dias, impactando negativamente a experiência do cliente e a velocidade de fechamento de vendas.
- **Complexidade Fiscal**: A aplicação correta de impostos (ICMS, ISS, PIS/COFINS) e margens variáveis por região, cliente ou tipo de serviço requer conhecimento especializado que não escala.
- **Rastreabilidade Limitada**: A falta de auditoria detalhada dificulta compliance regulatório e análise de performance comercial.
- **Baixa Produtividade**: Vendedores gastam tempo excessivo em tarefas operacionais (cálculos, formatação de documentos) ao invés de focar em relacionamento comercial.

**Solução Proposta:**

O Cotador Enterprise automatiza o ciclo completo de precificação, desde a criação do orçamento até a geração de documentos profissionais (PDFs), implementando um **Motor de Precificação Dinâmica** que aplica regras de negócio complexas de forma consistente e auditável.

### 1.2 Regras de Negócio Enterprise

#### 1.2.1 Motor de Precificação Dinâmica

O coração do sistema é um motor que calcula preços finais aplicando múltiplas camadas de regras:

**Camadas de Cálculo:**

1. **Preço Base do Serviço**
   - Definido por catálogo de serviços (multi-tenant)
   - Pode variar por região geográfica
   - Suporta descontos por volume ou tipo de cliente

2. **Aplicação de Impostos**
   - **ICMS**: Varia por estado (0% a 18%)
   - **ISS**: Varia por município (2% a 5%)
   - **PIS/COFINS**: Regime tributário (Simples Nacional vs. Lucro Presumido)
   - **IRRF**: Quando aplicável (retenção na fonte)

3. **Margem de Lucro Configurável**
   - Margem padrão por categoria de serviço
   - Margem customizada por cliente (negociação comercial)
   - Margem mínima garantida (compliance financeiro)

4. **Ajustes Dinâmicos**
   - Descontos promocionais com validade temporal
   - Surcharges por urgência ou complexidade
   - Ajustes sazonais automáticos

**Exemplo de Cálculo:**

```
Preço Base: R$ 1.000,00
+ Margem (15%): R$ 150,00
= Subtotal: R$ 1.150,00
+ ICMS (12%): R$ 138,00
+ ISS (5%): R$ 57,50
+ PIS/COFINS (3,65%): R$ 41,98
= Total Final: R$ 1.387,48
```

#### 1.2.2 Pipeline de Vendas Assíncrono

O sistema implementa um pipeline assíncrono para desacoplar operações críticas de operações pesadas:

**Fluxo de Eventos:**

1. **Criação do Orçamento** (Síncrono - < 200ms)
   - Validação de dados de entrada
   - Cálculo de preços via Motor de Precificação
   - Persistência no banco de dados
   - Retorno imediato ao cliente (mobile/web)

2. **Geração de Documento PDF** (Assíncrono - Worker)
   - Evento publicado no RabbitMQ após criação do orçamento
   - Worker processa a fila e gera PDF profissional
   - Upload do PDF para storage (S3/Azure Blob)
   - Atualização do orçamento com URL do documento

3. **Notificações** (Assíncrono - Worker)
   - Email para o cliente com PDF anexado
   - Notificação push no mobile do vendedor
   - Webhook para sistemas externos (CRM, ERP)

**Benefícios:**

- **Responsividade**: API responde rapidamente sem esperar geração de PDF
- **Escalabilidade**: Workers podem ser escalados independentemente
- **Resiliência**: Falhas na geração de PDF não bloqueiam criação de orçamentos
- **Observabilidade**: Cada etapa é rastreável via logs e métricas

#### 1.2.3 Sistema de Auditoria/Compliance

Todas as operações críticas são auditadas para garantir rastreabilidade e compliance:

**Eventos Auditados:**

- Criação, edição e aprovação de orçamentos
- Alterações em regras de precificação
- Acesso a dados sensíveis (multi-tenant)
- Alterações em configurações fiscais
- Exportação de relatórios

**Dados Capturados:**

- **Quem**: ID do usuário, tenant, role
- **O Que**: Tipo de operação, entidade afetada
- **Quando**: Timestamp com timezone
- **Como**: IP de origem, user-agent, método HTTP
- **Por Quê**: Contexto da operação (opcional)

**Armazenamento:**

- Tabela `audit_logs` no PostgreSQL (hot storage - últimos 90 dias)
- Archive para S3/Azure Blob (cold storage - compliance de longo prazo)
- Índices otimizados para consultas por tenant, data e tipo de evento

### 1.3 Multi-tenancy

O Cotador Enterprise suporta múltiplos clientes corporativos (tenants) com isolamento completo de dados e configurações.

#### 1.3.1 Modelo de Isolamento

**Estratégia: Row-Level Security (RLS) com Tenant ID**

Cada tabela crítica possui uma coluna `tenantId` que funciona como chave de isolamento:

```sql
-- Exemplo de schema
CREATE TABLE budgets (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  client_name VARCHAR(255),
  total DECIMAL(10,2),
  -- ... outros campos
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX idx_budgets_tenant_id ON budgets(tenant_id);
```

**Vantagens:**

- **Simplicidade**: Não requer múltiplos bancos de dados
- **Custo**: Infraestrutura compartilhada reduz custos operacionais
- **Manutenção**: Migrations e backups simplificados
- **Performance**: Índices otimizados por tenant garantem queries eficientes

**Segurança:**

- Middleware no NestJS valida `tenantId` em todas as requisições
- Prisma queries são automaticamente filtradas por tenant (via middleware)
- Redis cache é prefixado por tenant para evitar vazamento de dados

#### 1.3.2 Configurações por Tenant

Cada tenant possui configurações isoladas:

- **Regras Fiscais**: Impostos aplicáveis por região
- **Catálogo de Serviços**: Preços e descrições customizadas
- **Margens Padrão**: Por categoria de serviço
- **Branding**: Logo, cores, templates de PDF
- **Integrações**: Webhooks, APIs externas (CRM, ERP)

**Armazenamento:**

```typescript
// Exemplo de entidade Tenant
class Tenant {
  id: string;
  name: string;
  taxConfig: TaxConfiguration; // ICMS, ISS por estado/município
  pricingRules: PricingRule[]; // Margens, descontos
  branding: BrandingConfig; // Logo, cores
  integrations: IntegrationConfig[]; // Webhooks, APIs
}
```

---

## 2. Design e Arquitetura (Como)

### 2.1 Clean Architecture

A arquitetura do Cotador Enterprise segue os princípios da **Clean Architecture** de Robert C. Martin, garantindo que as regras de negócio sejam independentes de frameworks, UI e infraestrutura.

#### 2.1.1 Estrutura de Camadas

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│  (Controllers, DTOs, HTTP Adapters, GraphQL Resolvers)   │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                  Application Layer                       │
│  (Use Cases, Application Services, Command Handlers)    │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                    Domain Layer                          │
│  (Entities, Value Objects, Domain Services, Interfaces) │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                Infrastructure Layer                      │
│  (Repositories, External APIs, Message Queue, Cache)    │
└──────────────────────────────────────────────────────────┘
```

#### 2.1.2 Camada de Domínio (Domain Layer)

**Responsabilidade**: Contém as regras de negócio puras, sem dependências externas.

**Componentes:**

- **Entities**: Objetos de negócio com identidade única
  ```typescript
  // domain/entities/budget.entity.ts
  export class Budget {
    constructor(
      public id: string,
      public tenantId: string,
      public clientName: string,
      public items: BudgetItem[],
      public total: number,
      public status: BudgetStatus,
      public createdAt: Date,
    ) {}

    calculateTotal(): number {
      // Regra de negócio: cálculo de total
      return this.items.reduce((sum, item) => 
        sum + (item.unitPrice * item.quantity), 0
      );
    }

    canApprove(): boolean {
      // Regra de negócio: validação para aprovação
      return this.status === BudgetStatus.DRAFT && 
             this.items.length > 0 &&
             this.total > 0;
    }

    applyPricingRules(rules: PricingRule[]): void {
      // Regra de negócio: aplicação de regras de precificação
      // Implementação do Motor de Precificação Dinâmica
    }
  }
  ```

- **Value Objects**: Objetos imutáveis sem identidade
  ```typescript
  // domain/value-objects/money.vo.ts
  export class Money {
    constructor(
      public readonly amount: number,
      public readonly currency: string = 'BRL'
    ) {
      if (amount < 0) throw new Error('Amount cannot be negative');
    }

    add(other: Money): Money {
      if (this.currency !== other.currency) {
        throw new Error('Cannot add different currencies');
      }
      return new Money(this.amount + other.amount, this.currency);
    }
  }
  ```

- **Domain Services**: Lógica de negócio que não pertence a uma única entidade
  ```typescript
  // domain/services/pricing-engine.service.ts
  export class PricingEngine {
    calculateFinalPrice(
      basePrice: Money,
      taxes: Tax[],
      margin: Margin
    ): Money {
      // Lógica complexa de cálculo de preço final
      // Aplica impostos, margens, descontos
    }
  }
  ```

- **Repository Interfaces**: Contratos que definem como persistir entidades
  ```typescript
  // domain/repositories/budget-repository.interface.ts
  export interface IBudgetRepository {
    save(budget: Budget): Promise<void>;
    findById(id: string, tenantId: string): Promise<Budget | null>;
    findByTenant(tenantId: string): Promise<Budget[]>;
  }
  ```

**Princípios:**

- ✅ **Zero Dependências Externas**: Domain não importa frameworks, bibliotecas de infraestrutura ou UI
- ✅ **Testabilidade**: Regras de negócio podem ser testadas sem mocks complexos
- ✅ **Independência**: Mudanças em frameworks não afetam o domínio

#### 2.1.3 Camada de Aplicação (Application Layer)

**Responsabilidade**: Orquestra casos de uso, coordena entidades de domínio e aplica validações de aplicação.

**Componentes:**

- **Use Cases**: Casos de uso específicos do negócio
  ```typescript
  // application/use-cases/create-budget.use-case.ts
  export class CreateBudgetUseCase {
    constructor(
      private budgetRepo: IBudgetRepository,
      private pricingEngine: PricingEngine,
      private eventBus: IEventBus
    ) {}

    async execute(input: CreateBudgetDto): Promise<Budget> {
      // 1. Validação de entrada
      this.validateInput(input);

      // 2. Criação da entidade de domínio
      const budget = Budget.create(
        input.tenantId,
        input.clientName,
        input.items
      );

      // 3. Aplicação de regras de negócio
      budget.applyPricingRules(input.pricingRules);

      // 4. Persistência
      await this.budgetRepo.save(budget);

      // 5. Publicação de eventos
      await this.eventBus.publish(
        new BudgetCreatedEvent(budget.id, budget.tenantId)
      );

      return budget;
    }
  }
  ```

- **Application Services**: Serviços que coordenam múltiplos use cases
- **DTOs**: Data Transfer Objects para comunicação entre camadas

**Princípios:**

- ✅ **Thin Layer**: Aplicação não contém lógica de negócio, apenas orquestração
- ✅ **Dependency Injection**: Dependências são injetadas via interfaces
- ✅ **Transaction Management**: Controla transações de banco de dados

#### 2.1.4 Camada de Infraestrutura (Infrastructure Layer)

**Responsabilidade**: Implementa detalhes técnicos: persistência, mensageria, cache, APIs externas.

**Componentes:**

- **Repositories**: Implementações concretas dos contratos de domínio
  ```typescript
  // infra/database/repositories/prisma-budget.repository.ts
  @Injectable()
  export class PrismaBudgetRepository implements IBudgetRepository {
    constructor(private prisma: PrismaService) {}

    async save(budget: Budget): Promise<void> {
      await this.prisma.budget.create({
        data: {
          id: budget.id,
          tenantId: budget.tenantId,
          clientName: budget.clientName,
          total: budget.total,
          status: budget.status,
          items: {
            create: budget.items.map(item => ({
              description: item.description,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
            }))
          }
        }
      });
    }
  }
  ```

- **Message Queue Adapters**: Implementação de publicação/consumo de eventos
- **Cache Adapters**: Implementação de cache (Redis)
- **External API Clients**: Integrações com serviços externos

**Princípios:**

- ✅ **Implementa Interfaces**: Todas as dependências são abstraídas por interfaces do domínio
- ✅ **Isolamento**: Mudanças aqui não afetam outras camadas
- ✅ **Testabilidade**: Pode ser mockado facilmente em testes

### 2.2 Estratégia de Microsserviços

O Cotador Enterprise evolui de uma arquitetura monolítica modular para microsserviços, começando com a separação entre **API Core** e **Worker de Documentos**.

#### 2.2.1 API Core (api-core)

**Responsabilidades:**

- ✅ Recepção de requisições HTTP (REST API)
- ✅ Validação de entrada e autenticação/autorização
- ✅ Execução de casos de uso (criação de orçamentos, consultas)
- ✅ Cálculo de precificação (Motor de Precificação Dinâmica)
- ✅ Persistência de dados (PostgreSQL via Prisma)
- ✅ Publicação de eventos assíncronos (RabbitMQ)

**Stack Técnica:**

- **Framework**: NestJS 11.x
- **ORM**: Prisma 7.x
- **Database**: PostgreSQL 15
- **Message Queue**: RabbitMQ (AMQP)
- **Cache**: Redis
- **Language**: TypeScript 5.7+

**Endpoints Principais:**

```
POST   /api/v1/budgets              - Criar orçamento
GET    /api/v1/budgets/:id           - Consultar orçamento
GET    /api/v1/budgets               - Listar orçamentos (com paginação)
PUT    /api/v1/budgets/:id/approve   - Aprovar orçamento
GET    /api/v1/health                - Health check
GET    /api/v1/metrics               - Métricas Prometheus
```

#### 2.2.2 Worker de Documentos (document-worker)

**Responsabilidades:**

- ✅ Consumo de eventos de criação de orçamento (RabbitMQ)
- ✅ Geração de PDFs profissionais com branding do tenant
- ✅ Upload de documentos para storage (S3/Azure Blob)
- ✅ Publicação de eventos de conclusão (PDF gerado)
- ✅ Retry automático em caso de falhas

**Stack Técnica:**

- **Framework**: NestJS (para consistência com API Core)
- **PDF Generation**: Puppeteer ou PDFKit
- **Storage**: AWS S3 ou Azure Blob Storage
- **Message Queue**: RabbitMQ (AMQP)
- **Language**: TypeScript 5.7+

**Fluxo de Processamento:**

```
1. Worker recebe evento BudgetCreatedEvent
2. Busca dados completos do orçamento (API Core ou DB direto)
3. Aplica template de PDF com branding do tenant
4. Gera PDF em memória
5. Upload para S3/Azure Blob
6. Atualiza orçamento com URL do PDF
7. Publica evento DocumentGeneratedEvent
```

#### 2.2.3 Comunicação entre Serviços

**Padrão: Event-Driven Architecture (EDA)**

Os serviços se comunicam exclusivamente via eventos assíncronos através do RabbitMQ, garantindo desacoplamento e escalabilidade.

**Exchange e Filas:**

```
Exchange: cotador.events (Topic Exchange)

Queues:
- budget.created          → document-worker (durable, auto-ack: false)
- document.generated       → notification-worker (futuro)
- budget.approved         → crm-integration-worker (futuro)

Routing Keys:
- budget.created.{tenantId}
- document.generated.{tenantId}
- budget.approved.{tenantId}
```

**Formato de Eventos:**

```typescript
interface DomainEvent {
  eventId: string;        // UUID único do evento
  eventType: string;      // Tipo do evento (ex: "BudgetCreated")
  aggregateId: string;    // ID da entidade (ex: budget.id)
  tenantId: string;       // Tenant para isolamento
  occurredAt: Date;       // Timestamp do evento
  payload: Record<string, any>; // Dados específicos do evento
  metadata?: {
    userId?: string;
    correlationId?: string; // Para rastreamento distribuído
  };
}
```

**Exemplo de Evento:**

```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440000",
  "eventType": "BudgetCreated",
  "aggregateId": "123e4567-e89b-12d3-a456-426614174000",
  "tenantId": "tenant-abc-123",
  "occurredAt": "2025-01-17T10:30:00Z",
  "payload": {
    "budgetId": "123e4567-e89b-12d3-a456-426614174000",
    "clientName": "Acme Corp",
    "total": 15000.50,
    "status": "draft"
  },
  "metadata": {
    "userId": "user-xyz-789",
    "correlationId": "corr-123"
  }
}
```

**Benefícios do Desacoplamento:**

- ✅ **Escalabilidade Independente**: API Core e Workers podem escalar separadamente
- ✅ **Resiliência**: Falha em um worker não afeta a API
- ✅ **Flexibilidade**: Novos workers podem ser adicionados sem modificar a API
- ✅ **Performance**: API responde rapidamente sem esperar processamento pesado

### 2.3 Diagrama de Arquitetura Completo

```mermaid
graph TB
    subgraph "Client Layer"
        Mobile[Mobile App<br/>React Native/Expo]
        Web[Web App<br/>React/Next.js]
    end

    subgraph "API Gateway / Load Balancer"
        LB[Load Balancer<br/>AWS ALB / Azure App Gateway]
    end

    subgraph "API Core Service"
        API[API Core<br/>NestJS]
        API --> Domain[Domain Layer<br/>Entities, Value Objects]
        API --> App[Application Layer<br/>Use Cases]
        API --> Infra[Infrastructure Layer<br/>Repositories, Adapters]
    end

    subgraph "Message Queue"
        MQ[RabbitMQ<br/>AMQP Exchange]
    end

    subgraph "Workers"
        DocWorker[Document Worker<br/>PDF Generation]
        NotifWorker[Notification Worker<br/>Emails, Push]
    end

    subgraph "Data Layer"
        PG[(PostgreSQL<br/>Primary Database)]
        Redis[(Redis<br/>Cache & Sessions)]
    end

    subgraph "Storage"
        S3[AWS S3 / Azure Blob<br/>PDF Documents]
    end

    subgraph "Observability"
        Logs[Centralized Logs<br/>CloudWatch / Log Analytics]
        Metrics[Prometheus<br/>Grafana]
        Tracing[Distributed Tracing<br/>Jaeger / Application Insights]
    end

    Mobile --> LB
    Web --> LB
    LB --> API
    API --> PG
    API --> Redis
    API --> MQ
    MQ --> DocWorker
    MQ --> NotifWorker
    DocWorker --> S3
    DocWorker --> PG
    NotifWorker --> PG
    API --> Logs
    API --> Metrics
    API --> Tracing
    DocWorker --> Logs
    DocWorker --> Metrics
```

---

## 3. Infraestrutura (Onde e Com o Quê)

### 3.1 Local Development

O ambiente de desenvolvimento local utiliza **Docker Compose** para orquestrar todos os serviços necessários, garantindo consistência entre desenvolvedores.

#### 3.1.1 Stack em Containers

**docker-compose.yml:**

```yaml
version: '3.8'

services:
  # Banco de Dados Principal
  postgres:
    image: postgres:15-alpine
    container_name: cotador_db
    environment:
      POSTGRES_USER: cotador_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: cotador_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - cotador-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U cotador_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Message Queue
  rabbitmq:
    image: rabbitmq:3-management-alpine
    container_name: cotador_mq
    environment:
      RABBITMQ_DEFAULT_USER: cotador_user
      RABBITMQ_DEFAULT_PASS: ${MQ_PASSWORD}
    ports:
      - "5672:5672"    # AMQP
      - "15672:15672"  # Management UI
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    networks:
      - cotador-network
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Cache e Sessões
  redis:
    image: redis:7-alpine
    container_name: cotador_redis
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - cotador-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # API Core (desenvolvimento)
  api-core:
    build:
      context: ./apps/api-core
      dockerfile: Dockerfile.dev
    container_name: cotador_api
    environment:
      DATABASE_URL: postgresql://cotador_user:${DB_PASSWORD}@postgres:5432/cotador_db
      RABBITMQ_URL: amqp://cotador_user:${MQ_PASSWORD}@rabbitmq:5672
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      NODE_ENV: development
    ports:
      - "3000:3000"
    volumes:
      - ./apps/api-core:/app
      - /app/node_modules
    depends_on:
      postgres:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - cotador-network
    command: npm run start:dev

volumes:
  postgres_data:
  rabbitmq_data:
  redis_data:

networks:
  cotador-network:
    driver: bridge
```

#### 3.1.2 Scripts de Desenvolvimento

**package.json (root):**

```json
{
  "scripts": {
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "docker:logs": "docker-compose logs -f",
    "db:migrate": "cd apps/api-core && npx prisma migrate dev",
    "db:studio": "cd apps/api-core && npx prisma studio",
    "dev:api": "cd apps/api-core && npm run start:dev",
    "dev:worker": "cd apps/document-worker && npm run start:dev"
  }
}
```

#### 3.1.3 Variáveis de Ambiente

**.env.example:**

```bash
# Database
DB_PASSWORD=n)M[0pC24+{Z
DATABASE_URL=postgresql://cotador_user:${DB_PASSWORD}@localhost:5432/cotador_db

# Message Queue
MQ_PASSWORD=81Nw#I6+8an_
RABBITMQ_URL=amqp://cotador_user:${MQ_PASSWORD}@localhost:5672

# Redis
REDIS_PASSWORD=your_redis_password
REDIS_URL=redis://:${REDIS_PASSWORD}@localhost:6379

# Application
NODE_ENV=development
PORT=3000
JWT_SECRET=your_jwt_secret_key

# AWS/Azure (para desenvolvimento local, usar LocalStack ou Azurite)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
S3_BUCKET_NAME=cotador-documents-dev
```

### 3.2 Cloud Target (Produção)

A arquitetura de produção é projetada para alta disponibilidade, escalabilidade e resiliência.

#### 3.2.1 Arquitetura AWS

```mermaid
graph TB
    subgraph "CDN & Edge"
        CloudFront[CloudFront<br/>CDN & SSL Termination]
    end

    subgraph "Load Balancing"
        ALB[Application Load Balancer<br/>HTTPS, Health Checks]
    end

    subgraph "Compute - ECS Fargate"
        API1[API Core<br/>Task 1]
        API2[API Core<br/>Task 2]
        API3[API Core<br/>Task N<br/>Auto Scaling]
        Worker1[Document Worker<br/>Task 1]
        Worker2[Document Worker<br/>Task N<br/>Auto Scaling]
    end

    subgraph "Message Queue"
        MQ[Amazon MQ<br/>RabbitMQ Managed]
    end

    subgraph "Data Layer"
        RDS[(RDS PostgreSQL<br/>Multi-AZ, Read Replicas)]
        ElastiCache[(ElastiCache Redis<br/>Cluster Mode)]
    end

    subgraph "Storage"
        S3[S3 Buckets<br/>PDFs, Assets]
    end

    subgraph "Observability"
        CloudWatch[CloudWatch<br/>Logs, Metrics, Alarms]
        XRay[X-Ray<br/>Distributed Tracing]
    end

    CloudFront --> ALB
    ALB --> API1
    ALB --> API2
    ALB --> API3
    API1 --> RDS
    API2 --> RDS
    API3 --> RDS
    API1 --> ElastiCache
    API2 --> ElastiCache
    API3 --> ElastiCache
    API1 --> MQ
    API2 --> MQ
    API3 --> MQ
    MQ --> Worker1
    MQ --> Worker2
    Worker1 --> S3
    Worker2 --> S3
    Worker1 --> RDS
    Worker2 --> RDS
    API1 --> CloudWatch
    API2 --> CloudWatch
    API3 --> CloudWatch
    Worker1 --> CloudWatch
    Worker2 --> CloudWatch
    API1 --> XRay
    API2 --> XRay
    API3 --> XRay
```

**Componentes Principais:**

1. **ECS Fargate**
   - **API Core**: 2-10 tasks (auto-scaling baseado em CPU/Memory)
   - **Document Worker**: 1-5 tasks (auto-scaling baseado em tamanho da fila)
   - **Task Definition**: CPU 512-2048, Memory 1-4GB

2. **RDS PostgreSQL**
   - **Instance**: db.t3.medium (produção) ou db.t3.large (alta carga)
   - **Multi-AZ**: Habilitado para alta disponibilidade
   - **Read Replicas**: 1-2 réplicas para leitura
   - **Backup**: Automático diário, retenção de 30 dias
   - **Encryption**: At-rest e in-transit

3. **Amazon MQ (RabbitMQ)**
   - **Instance**: mq.t3.micro (dev) ou mq.m5.large (prod)
   - **High Availability**: Habilitado (2 brokers)
   - **Durability**: Queues e exchanges duráveis

4. **ElastiCache Redis**
   - **Cluster Mode**: Habilitado para escalabilidade
   - **Node Type**: cache.t3.micro (dev) ou cache.t3.medium (prod)
   - **Multi-AZ**: Habilitado

5. **S3**
   - **Bucket**: `cotador-documents-prod`
   - **Versioning**: Habilitado
   - **Lifecycle Policies**: Move para Glacier após 90 dias
   - **Encryption**: SSE-S3 ou SSE-KMS

#### 3.2.2 Arquitetura Azure

```mermaid
graph TB
    subgraph "CDN & Edge"
        CDN[Azure CDN<br/>SSL Termination]
    end

    subgraph "Load Balancing"
        AppGW[Application Gateway<br/>WAF, SSL]
    end

    subgraph "Compute - Container Instances / AKS"
        API1[API Core<br/>Container Instance 1]
        API2[API Core<br/>Container Instance 2]
        API3[API Core<br/>Auto Scaling]
        Worker1[Document Worker<br/>Container Instance 1]
        Worker2[Document Worker<br/>Auto Scaling]
    end

    subgraph "Message Queue"
        ServiceBus[Azure Service Bus<br/>Premium Tier]
    end

    subgraph "Data Layer"
        Postgres[(Azure Database<br/>for PostgreSQL<br/>Flexible Server)]
        Redis[(Azure Cache<br/>for Redis<br/>Premium)]
    end

    subgraph "Storage"
        Blob[Blob Storage<br/>PDFs, Assets]
    end

    subgraph "Observability"
        LogAnalytics[Log Analytics<br/>Workspace]
        AppInsights[Application Insights<br/>APM & Tracing]
    end

    CDN --> AppGW
    AppGW --> API1
    AppGW --> API2
    AppGW --> API3
    API1 --> Postgres
    API2 --> Postgres
    API3 --> Postgres
    API1 --> Redis
    API2 --> Redis
    API3 --> Redis
    API1 --> ServiceBus
    API2 --> ServiceBus
    API3 --> ServiceBus
    ServiceBus --> Worker1
    ServiceBus --> Worker2
    Worker1 --> Blob
    Worker2 --> Blob
    Worker1 --> Postgres
    Worker2 --> Postgres
    API1 --> LogAnalytics
    API2 --> LogAnalytics
    API3 --> LogAnalytics
    Worker1 --> LogAnalytics
    Worker2 --> LogAnalytics
    API1 --> AppInsights
    API2 --> AppInsights
    API3 --> AppInsights
```

**Componentes Principais:**

1. **Azure Container Instances (ACI) ou AKS**
   - **ACI**: Para workloads simples, sem necessidade de orquestração complexa
   - **AKS**: Para produção enterprise com auto-scaling avançado
   - **CPU/Memory**: Configurável por container

2. **Azure Database for PostgreSQL**
   - **Tier**: General Purpose ou Business Critical
   - **vCores**: 2-8 vCores
   - **Storage**: 32GB-16TB (auto-grow)
   - **Backup**: Automático, retenção de 7-35 dias
   - **High Availability**: Zone-redundant (Business Critical)

3. **Azure Service Bus**
   - **Tier**: Premium (para produção)
   - **Messaging Units**: 1-8 (auto-scaling)
   - **Features**: Dead-letter queues, duplicate detection

4. **Azure Cache for Redis**
   - **Tier**: Premium (para produção)
   - **Size**: C1 (1GB) até P5 (120GB)
   - **Clustering**: Habilitado para alta disponibilidade

5. **Azure Blob Storage**
   - **Tier**: Hot (acesso frequente) e Cool (arquivamento)
   - **Lifecycle Management**: Move para Archive após 90 dias
   - **Encryption**: SSE (Storage Service Encryption)

#### 3.2.3 Estratégia de Deploy

**Infrastructure as Code (IaC):**

- **AWS**: Terraform ou AWS CDK
- **Azure**: Terraform ou ARM Templates / Bicep

**Exemplo Terraform (AWS):**

```hcl
# ECS Cluster
resource "aws_ecs_cluster" "cotador" {
  name = "cotador-cluster"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# Task Definition - API Core
resource "aws_ecs_task_definition" "api_core" {
  family                   = "cotador-api-core"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  
  container_definitions = jsonencode([{
    name  = "api-core"
    image = "${aws_ecr_repository.api_core.repository_url}:latest"
    
    environment = [
      { name = "DATABASE_URL", value = var.database_url },
      { name = "RABBITMQ_URL", value = var.rabbitmq_url },
      { name = "REDIS_URL", value = var.redis_url }
    ]
    
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/cotador-api-core"
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])
}

# Auto Scaling
resource "aws_appautoscaling_target" "api_core" {
  max_capacity       = 10
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.cotador.name}/${aws_ecs_service.api_core.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "api_core_cpu" {
  name               = "api-core-cpu-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.api_core.resource_id
  scalable_dimension = aws_appautoscaling_target.api_core.scalable_dimension
  service_namespace  = aws_appautoscaling_target.api_core.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value       = 70.0
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
  }
}
```

---

## 4. Operacional (Como Manter)

### 4.1 Observabilidade

Observabilidade é fundamental para operar sistemas distribuídos em produção. O Cotador Enterprise implementa três pilares: **Logs**, **Métricas** e **Tracing**.

#### 4.1.1 Health Checks

Cada serviço expõe endpoints de health check para monitoramento de disponibilidade:

**Endpoint Padrão:**

```
GET /health
GET /health/live   # Liveness probe (Kubernetes)
GET /health/ready  # Readiness probe (Kubernetes)
```

**Resposta:**

```json
{
  "status": "healthy",
  "timestamp": "2025-01-17T10:30:00Z",
  "uptime": 3600,
  "services": {
    "database": {
      "status": "healthy",
      "latency": "2ms"
    },
    "rabbitmq": {
      "status": "healthy",
      "latency": "5ms"
    },
    "redis": {
      "status": "healthy",
      "latency": "1ms"
    }
  },
  "version": "1.0.0",
  "environment": "production"
}
```

**Implementação (NestJS):**

```typescript
// infra/controllers/health.controller.ts
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private rabbitmq: RabbitMQHealthIndicator,
    private redis: RedisHealthIndicator
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.rabbitmq.pingCheck('rabbitmq'),
      () => this.redis.pingCheck('redis'),
    ]);
  }
}
```

#### 4.1.2 Logs Centralizados

**Estratrutura de Logs:**

Todos os logs seguem o formato estruturado (JSON) para facilitar parsing e análise:

```json
{
  "timestamp": "2025-01-17T10:30:00.123Z",
  "level": "info",
  "service": "api-core",
  "tenantId": "tenant-abc-123",
  "userId": "user-xyz-789",
  "correlationId": "corr-123",
  "message": "Budget created successfully",
  "context": {
    "budgetId": "123e4567-e89b-12d3-a456-426614174000",
    "total": 15000.50
  },
  "metadata": {
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "requestId": "req-456"
  }
}
```

**Níveis de Log:**

- **ERROR**: Erros que requerem atenção imediata
- **WARN**: Situações anômalas que não impedem operação
- **INFO**: Eventos de negócio importantes (criação de orçamento, aprovação)
- **DEBUG**: Informações detalhadas para debugging (apenas em desenvolvimento)

**Implementação (Winston/Pino):**

```typescript
// infra/logging/logger.service.ts
import { LoggerService } from '@nestjs/common';
import * as winston from 'winston';

export class AppLogger implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        // Em produção, enviar para CloudWatch/Log Analytics
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
      ],
    });
  }

  log(message: string, context?: string, metadata?: any) {
    this.logger.info(message, { context, ...metadata });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }
}
```

**Agregação de Logs:**

- **AWS**: CloudWatch Logs com Log Groups por serviço
- **Azure**: Log Analytics Workspace com custom tables
- **Ferramentas**: ELK Stack (Elasticsearch, Logstash, Kibana) para análise avançada

#### 4.1.3 Monitoramento de Performance

**Métricas Principais:**

1. **Métricas de Aplicação**
   - Taxa de requisições por segundo (RPS)
   - Latência (p50, p95, p99)
   - Taxa de erro (4xx, 5xx)
   - Taxa de sucesso

2. **Métricas de Negócio**
   - Orçamentos criados por hora/dia
   - Taxa de conversão (draft → approved)
   - Valor total de orçamentos por tenant
   - Tempo médio de geração de PDF

3. **Métricas de Infraestrutura**
   - CPU e memória por container
   - Conexões de banco de dados
   - Tamanho das filas RabbitMQ
   - Hit rate do cache Redis

**Exposição de Métricas (Prometheus):**

```typescript
// NestJS com prom-client
import { Counter, Histogram, register } from 'prom-client';

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
});

const budgetsCreated = new Counter({
  name: 'budgets_created_total',
  help: 'Total number of budgets created',
  labelNames: ['tenant_id'],
});

// Endpoint /metrics
@Get('metrics')
async getMetrics() {
  return register.metrics();
}
```

**Dashboards (Grafana):**

- **API Performance**: Latência, throughput, erros
- **Worker Performance**: Taxa de processamento, tempo de geração de PDF
- **Infrastructure**: CPU, memória, rede
- **Business Metrics**: Orçamentos por tenant, conversão

#### 4.1.4 Monitoramento de Filas

**Métricas de Fila RabbitMQ:**

```typescript
// infra/monitoring/queue-monitor.service.ts
@Injectable()
export class QueueMonitorService {
  async getQueueMetrics(queueName: string) {
    const channel = await this.rabbitmqConnection.createChannel();
    const queue = await channel.checkQueue(queueName);
    
    return {
      name: queueName,
      messages: queue.messageCount,
      consumers: queue.consumerCount,
      rate: this.calculateProcessingRate(queueName),
    };
  }

  // Alertar se fila crescer muito
  async checkQueueHealth() {
    const metrics = await this.getQueueMetrics('budget.created');
    
    if (metrics.messages > 1000) {
      this.alertService.sendAlert({
        severity: 'warning',
        message: `Queue ${metrics.name} has ${metrics.messages} pending messages`,
      });
    }
  }
}
```

**Alertas Configurados:**

- **Fila Crescendo**: Mais de 1000 mensagens pendentes
- **Worker Down**: Nenhum consumer ativo por mais de 5 minutos
- **Taxa de Processamento Baixa**: Menos de 10 mensagens/minuto
- **Dead Letter Queue**: Mensagens na DLQ requerem investigação

### 4.2 CI/CD Pipeline

O pipeline de CI/CD automatiza testes, build e deploy para garantir qualidade e velocidade de entrega.

#### 4.2.1 Fluxo de Deploy Automatizado

```mermaid
graph LR
    A[Git Push] --> B[GitHub Actions<br/>CI Trigger]
    B --> C[Lint & Format Check]
    C --> D[Unit Tests]
    D --> E[Integration Tests]
    E --> F[Build Docker Image]
    F --> G[Push to ECR/ACR]
    G --> H{Environment?}
    H -->|dev| I[Deploy to Dev]
    H -->|staging| J[Deploy to Staging]
    H -->|prod| K[Manual Approval]
    K --> L[Deploy to Production]
    I --> M[Smoke Tests]
    J --> M
    L --> M
    M --> N[Health Check]
```

#### 4.2.2 Pipeline GitHub Actions

**.github/workflows/ci-cd.yml:**

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: cotador-enterprise

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          cd apps/api-core
          npm ci
      
      - name: Run linter
        run: |
          cd apps/api-core
          npm run lint
      
      - name: Run tests
        run: |
          cd apps/api-core
          npm run test:cov
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./apps/api-core/coverage/lcov.info

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY/api-core:$IMAGE_TAG ./apps/api-core
          docker push $ECR_REGISTRY/$ECR_REPOSITORY/api-core:$IMAGE_TAG

  deploy-dev:
    needs: build
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to ECS (Dev)
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: task-definition-dev.json
          service: cotador-api-core-dev
          cluster: cotador-cluster-dev
          wait-for-service-stability: true

  deploy-prod:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to ECS (Prod)
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: task-definition-prod.json
          service: cotador-api-core-prod
          cluster: cotador-cluster-prod
          wait-for-service-stability: true
      
      - name: Run smoke tests
        run: |
          npm run test:smoke -- --env=production
```

#### 4.2.3 Estratégias de Deploy

**Blue-Green Deployment:**

- Mantém duas versões da aplicação rodando simultaneamente
- Roteamento alterna entre versões após validação
- Rollback instantâneo em caso de problemas

**Canary Deployment:**

- Deploy gradual: 10% → 50% → 100% do tráfego
- Monitoramento de métricas em cada etapa
- Rollback automático se métricas degradarem

**Rollback Automático:**

- Se health checks falharem após deploy
- Se taxa de erro aumentar acima de 5%
- Se latência p95 aumentar acima de 500ms

---

## 5. Conhecimento e Referência (Como Trabalhar)

### 5.1 Padrões de Qualidade

#### 5.1.1 Test Driven Development (TDD)

**Ciclo TDD (Red-Green-Refactor):**

1. **Red**: Escrever teste que falha
2. **Green**: Implementar código mínimo para passar
3. **Refactor**: Melhorar código mantendo testes passando

**Estrutura de Testes:**

```
apps/api-core/
├── src/
│   ├── domain/
│   │   └── entities/
│   │       └── budget.entity.spec.ts    # Unit tests
│   ├── application/
│   │   └── use-cases/
│   │       └── create-budget.use-case.spec.ts  # Unit tests
│   └── infra/
│       └── controllers/
│           └── budget.controller.spec.ts  # Integration tests
└── test/
    └── e2e/
        └── budgets.e2e-spec.ts           # E2E tests
```

**Exemplo de Teste Unitário:**

```typescript
// domain/entities/budget.entity.spec.ts
describe('Budget Entity', () => {
  it('should calculate total correctly', () => {
    const items = [
      new BudgetItem('Service A', 100, 2),
      new BudgetItem('Service B', 50, 3),
    ];
    
    const budget = new Budget(
      'id-1',
      'tenant-1',
      'Client ABC',
      items,
      0,
      BudgetStatus.DRAFT,
      new Date()
    );
    
    expect(budget.calculateTotal()).toBe(350);
  });

  it('should not allow approval if no items', () => {
    const budget = new Budget(
      'id-1',
      'tenant-1',
      'Client ABC',
      [],
      0,
      BudgetStatus.DRAFT,
      new Date()
    );
    
    expect(budget.canApprove()).toBe(false);
  });
});
```

**Cobertura de Testes:**

- **Unit Tests**: > 80% de cobertura (domain e application layers)
- **Integration Tests**: Todos os endpoints e casos de uso críticos
- **E2E Tests**: Fluxos completos de usuário (criação → aprovação → PDF)

**Comando:**

```bash
npm run test:cov  # Gera relatório de cobertura
```

#### 5.1.2 Conventional Commits

**Formato:**

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Tipos:**

- **feat**: Nova funcionalidade
- **fix**: Correção de bug
- **docs**: Documentação
- **style**: Formatação (não afeta código)
- **refactor**: Refatoração
- **test**: Testes
- **chore**: Tarefas de manutenção

**Exemplos:**

```
feat(pricing): add dynamic tax calculation engine

Implementa motor de precificação que aplica impostos
variáveis por região e tipo de serviço.

Closes #123

---

fix(api): resolve tenant isolation issue in budget queries

Corrige vazamento de dados entre tenants ao consultar
orçamentos. Adiciona validação de tenantId em todas
as queries.

Fixes #456

---

refactor(domain): extract pricing rules to value objects

Move regras de precificação para value objects para
melhorar testabilidade e reutilização.

---

test(use-cases): add integration tests for create budget

Adiciona testes de integração cobrindo todos os cenários
de criação de orçamento, incluindo validações e eventos.
```

**Husky + Commitlint:**

```json
// package.json
{
  "scripts": {
    "commit": "git-cz",
    "prepare": "husky install"
  },
  "devDependencies": {
    "@commitlint/cli": "^17.0.0",
    "@commitlint/config-conventional": "^17.0.0",
    "commitizen": "^4.2.4",
    "husky": "^8.0.0"
  }
}
```

#### 5.1.3 Documentação via Swagger

**OpenAPI/Swagger:**

Todas as APIs REST são documentadas com OpenAPI 3.0:

```typescript
// infra/controllers/budget.controller.ts
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Budgets')
@Controller('budgets')
export class BudgetController {
  @Post()
  @ApiOperation({ 
    summary: 'Create a new budget',
    description: 'Creates a budget with items and applies pricing rules'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Budget created successfully',
    type: BudgetResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid input data' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  async create(@Body() body: CreateBudgetDto) {
    // ...
  }
}
```

**Acesso:**

- **Desenvolvimento**: `http://localhost:3000/api/docs`
- **Produção**: `https://api.cotador.enterprise/api/docs`

**Geração Automática:**

```typescript
// main.ts
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('Cotador Enterprise API')
  .setDescription('API para gestão e precificação de serviços')
  .setVersion('1.0')
  .addBearerAuth()
  .addTag('Budgets', 'Budget management endpoints')
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

### 5.2 Guia de Contribuição

**Workflow Git:**

1. Criar branch a partir de `develop`: `git checkout -b feat/nome-da-feature`
2. Desenvolver seguindo TDD
3. Commitar com Conventional Commits
4. Push e criar Pull Request
5. Code review obrigatório
6. Merge após aprovação

**Code Review Checklist:**

- ✅ Código segue padrões de Clean Architecture?
- ✅ Testes cobrem a funcionalidade?
- ✅ Documentação atualizada (Swagger)?
- ✅ Sem breaking changes (ou documentados)?
- ✅ Performance considerada?

---

## 6. Plano de Ação Global (Roadmap de Engenharia)

### 6.1 Visão de Alto Nível

O desenvolvimento do Cotador Enterprise está organizado em **3 Sprints principais**, cada uma com duração de 2-3 semanas, focando em entregas incrementais de valor.

```mermaid
gantt
    title Roadmap Cotador Enterprise
    dateFormat  YYYY-MM-DD
    section Sprint 1 - Fundação
    Setup Docker Compose           :2025-01-20, 3d
    Clean Architecture Core        :2025-01-23, 5d
    Prisma + PostgreSQL            :2025-01-23, 5d
    Motor Precificação Básico      :2025-01-28, 4d
    section Sprint 2 - Mensageria
    RabbitMQ Setup                 :2025-02-03, 2d
    Event Producers                :2025-02-05, 3d
    Document Worker                :2025-02-08, 5d
    PDF Generation                 :2025-02-08, 5d
    section Sprint 3 - Enterprise
    Sistema Auditoria              :2025-02-17, 4d
    Dashboard Métricas             :2025-02-21, 3d
    Multi-tenancy                  :2025-02-24, 4d
    Refinamento Mobile UX          :2025-02-28, 3d
```

### 6.2 Sprint 1: Fundação (Semanas 1-3)

**Objetivo**: Estabelecer a base técnica sólida com Clean Architecture, banco de dados e motor de precificação básico.

#### 6.2.1 Setup de Infraestrutura (Docker)

**Tarefas:**

1. ✅ Configurar `docker-compose.yml` com PostgreSQL, RabbitMQ, Redis
2. ✅ Criar Dockerfiles para desenvolvimento e produção
3. ✅ Configurar variáveis de ambiente (.env.example)
4. ✅ Documentar comandos de desenvolvimento (`npm run docker:up`)

**Entregas:**

- Ambiente de desenvolvimento local funcional
- Documentação de setup para novos desenvolvedores

**Critérios de Aceite:**

- ✅ Todos os serviços sobem com `docker-compose up`
- ✅ Health checks respondem corretamente
- ✅ Conexões entre serviços funcionam

#### 6.2.2 Clean Architecture no Core

**Tarefas:**

1. ✅ Estruturar pastas seguindo Clean Architecture:
   ```
   apps/api-core/src/
   ├── domain/
   │   ├── entities/
   │   ├── value-objects/
   │   ├── services/
   │   └── repositories/
   ├── application/
   │   └── use-cases/
   └── infra/
       ├── controllers/
       ├── database/
       └── modules/
   ```

2. ✅ Implementar entidades de domínio (`Budget`, `BudgetItem`)
3. ✅ Criar interfaces de repositório
4. ✅ Implementar use cases (`CreateBudgetUseCase`)
5. ✅ Implementar repositórios Prisma
6. ✅ Configurar módulos NestJS

**Entregas:**

- Estrutura de Clean Architecture implementada
- Caso de uso de criação de orçamento funcionando
- Testes unitários para entidades de domínio

**Critérios de Aceite:**

- ✅ Código de domínio sem dependências externas
- ✅ Use cases testáveis com mocks
- ✅ Cobertura de testes > 80% na camada de domínio

#### 6.2.3 Integração Prisma/PostgreSQL

**Tarefas:**

1. ✅ Configurar Prisma schema com modelos:
   - `Tenant`
   - `Budget`
   - `BudgetItem`
   - `AuditLog` (preparação para Sprint 3)

2. ✅ Criar migrations iniciais
3. ✅ Implementar repositórios Prisma
4. ✅ Configurar conexão com pool de conexões
5. ✅ Implementar transações para operações complexas

**Entregas:**

- Schema de banco de dados versionado
- Repositórios funcionando com Prisma
- Migrations aplicadas

**Critérios de Aceite:**

- ✅ Migrations executam sem erros
- ✅ Queries otimizadas com índices
- ✅ Suporte a multi-tenancy (tenantId em todas as tabelas)

#### 6.2.4 Motor de Precificação Básico

**Tarefas:**

1. ✅ Criar `PricingEngine` service no domínio
2. ✅ Implementar cálculo de preço base
3. ✅ Implementar aplicação de impostos (ICMS, ISS, PIS/COFINS)
4. ✅ Implementar aplicação de margem
5. ✅ Criar value objects (`Money`, `Tax`, `Margin`)
6. ✅ Testes unitários para todos os cálculos

**Entregas:**

- Motor de precificação funcional
- Testes cobrindo todos os cenários de cálculo
- Documentação de regras de negócio

**Critérios de Aceite:**

- ✅ Cálculos corretos para todos os impostos
- ✅ Suporte a configurações por tenant
- ✅ Testes com casos reais de negócio

**Métricas de Sucesso:**

- ✅ Latência de criação de orçamento < 200ms (p95)
- ✅ Cobertura de testes > 80%
- ✅ Zero erros de cálculo em testes

### 6.3 Sprint 2: Mensageria (Semanas 4-6)

**Objetivo**: Implementar comunicação assíncrona entre serviços e worker de geração de documentos.

#### 6.3.1 Implementação de Producers/Consumers no RabbitMQ

**Tarefas:**

1. ✅ Configurar conexão RabbitMQ no NestJS
2. ✅ Criar módulo de mensageria (`MessagingModule`)
3. ✅ Implementar `EventBus` interface no domínio
4. ✅ Implementar `RabbitMQEventBus` na infraestrutura
5. ✅ Criar eventos de domínio (`BudgetCreatedEvent`, `DocumentGeneratedEvent`)
6. ✅ Publicar eventos após criação de orçamento
7. ✅ Implementar retry e dead-letter queue

**Entregas:**

- Sistema de eventos funcionando
- Eventos publicados após operações críticas
- Configuração de filas e exchanges

**Critérios de Aceite:**

- ✅ Eventos publicados corretamente no RabbitMQ
- ✅ Retry automático em caso de falha
- ✅ Dead-letter queue configurada
- ✅ Logs estruturados para todos os eventos

#### 6.3.2 Worker de Geração de Arquivos

**Tarefas:**

1. ✅ Criar projeto `document-worker` (NestJS)
2. ✅ Configurar consumer de eventos `BudgetCreatedEvent`
3. ✅ Implementar busca de dados do orçamento (via API ou DB direto)
4. ✅ Integrar biblioteca de geração de PDF (Puppeteer ou PDFKit)
5. ✅ Criar templates de PDF com branding do tenant
6. ✅ Implementar upload para S3/Azure Blob
7. ✅ Atualizar orçamento com URL do PDF
8. ✅ Publicar evento `DocumentGeneratedEvent`

**Entregas:**

- Worker funcionando end-to-end
- PDFs gerados com qualidade profissional
- Upload para storage funcionando

**Critérios de Aceite:**

- ✅ PDF gerado em < 5 segundos
- ✅ PDF contém todas as informações do orçamento
- ✅ Branding do tenant aplicado corretamente
- ✅ URL do PDF salva no banco de dados
- ✅ Worker processa fila continuamente

**Métricas de Sucesso:**

- ✅ Taxa de processamento > 10 PDFs/minuto por worker
- ✅ Taxa de erro < 1%
- ✅ Tempo médio de geração < 3 segundos

### 6.4 Sprint 3: Enterprise Ready (Semanas 7-9)

**Objetivo**: Tornar o sistema pronto para produção enterprise com auditoria, métricas e multi-tenancy completo.

#### 6.4.1 Sistema de Auditoria

**Tarefas:**

1. ✅ Criar entidade `AuditLog` no domínio
2. ✅ Implementar `AuditService` que intercepta operações
3. ✅ Criar decorator `@Audit()` para métodos críticos
4. ✅ Implementar repositório de auditoria
5. ✅ Criar índices otimizados para consultas
6. ✅ Implementar archive para S3/Azure (cold storage)
7. ✅ Criar endpoints de consulta de auditoria (com paginação)

**Entregas:**

- Sistema de auditoria completo
- Todos os eventos críticos auditados
- Consultas de auditoria funcionando

**Critérios de Aceite:**

- ✅ Todas as operações críticas são auditadas
- ✅ Consultas por tenant, data e tipo funcionam
- ✅ Performance de consultas < 500ms (p95)
- ✅ Archive automático após 90 dias

#### 6.4.2 Dashboard de Métricas

**Tarefas:**

1. ✅ Expor métricas Prometheus em `/metrics`
2. ✅ Implementar métricas de negócio (orçamentos criados, conversão)
3. ✅ Configurar Grafana com dashboards:
   - API Performance (latência, throughput, erros)
   - Worker Performance (taxa de processamento, filas)
   - Business Metrics (orçamentos por tenant, conversão)
4. ✅ Configurar alertas (Slack, PagerDuty)
5. ✅ Implementar health checks avançados

**Entregas:**

- Dashboards de métricas funcionando
- Alertas configurados
- Documentação de métricas

**Critérios de Aceite:**

- ✅ Métricas expostas corretamente
- ✅ Dashboards atualizados em tempo real
- ✅ Alertas disparam em cenários críticos
- ✅ Health checks cobrem todos os serviços

#### 6.4.3 Refinamento de UX no Mobile

**Tarefas:**

1. ✅ Implementar loading states durante criação de orçamento
2. ✅ Adicionar notificações push quando PDF é gerado
3. ✅ Melhorar tratamento de erros (mensagens amigáveis)
4. ✅ Implementar cache offline (React Query)
5. ✅ Otimizar performance (lazy loading, memoization)
6. ✅ Adicionar animações e transições suaves

**Entregas:**

- UX refinada no mobile
- Performance otimizada
- Experiência offline melhorada

**Critérios de Aceite:**

- ✅ Tempo de carregamento de telas < 1 segundo
- ✅ Animações a 60 FPS
- ✅ Funcionalidade offline básica
- ✅ Feedback visual claro para todas as ações

**Métricas de Sucesso:**

- ✅ NPS de usuários mobile > 8
- ✅ Taxa de conclusão de orçamento > 90%
- ✅ Tempo médio de criação de orçamento < 30 segundos

### 6.5 Critérios de Sucesso Globais

#### 6.5.1 Métricas Técnicas

| Métrica | Meta | Como Medir |
|---------|------|------------|
| **Latência API (p95)** | < 200ms | Prometheus + Grafana |
| **Latência API (p99)** | < 500ms | Prometheus + Grafana |
| **Disponibilidade** | > 99.9% | Uptime monitoring |
| **Taxa de Erro** | < 0.1% | Logs + Métricas |
| **Cobertura de Testes** | > 80% | Jest coverage |
| **Tempo de Deploy** | < 10 minutos | CI/CD pipeline |
| **Tempo de Geração de PDF** | < 5 segundos | Worker logs |

#### 6.5.2 Métricas de Negócio

| Métrica | Meta | Como Medir |
|---------|------|------------|
| **Orçamentos Criados/Dia** | > 1000 | Database queries |
| **Taxa de Conversão** | > 30% | Analytics |
| **Tempo Médio de Criação** | < 30 segundos | Mobile analytics |
| **Satisfação do Usuário (NPS)** | > 8 | Surveys |

#### 6.5.3 Métricas de Qualidade de Código

| Métrica | Meta | Ferramenta |
|---------|------|------------|
| **Code Smells** | < 5 por módulo | SonarQube |
| **Complexidade Ciclomática** | < 10 por função | ESLint |
| **Debt Ratio** | < 5% | SonarQube |
| **Security Vulnerabilities** | 0 críticas | Snyk / Dependabot |

### 6.6 Riscos e Mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| **Performance do Banco** | Alto | Média | Read replicas, índices otimizados, cache Redis |
| **Falha no RabbitMQ** | Alto | Baixa | High availability, dead-letter queues, monitoring |
| **Escalabilidade de Workers** | Médio | Média | Auto-scaling baseado em tamanho de fila |
| **Vazamento de Dados Multi-tenant** | Crítico | Baixa | Testes automatizados, validação em todas as queries |
| **Complexidade do Motor de Precificação** | Médio | Alta | TDD rigoroso, testes com casos reais, documentação |

### 6.7 Próximos Passos (Pós-Sprint 3)

**Futuras Melhorias:**

1. **Notificação Worker**: Envio de emails e push notifications
2. **Integração CRM/ERP**: Webhooks e APIs para sistemas externos
3. **Analytics Avançado**: Dashboards de business intelligence
4. **Machine Learning**: Sugestão automática de preços
5. **API GraphQL**: Para queries complexas e mobile
6. **Kubernetes**: Migração de ECS/ACI para Kubernetes (se necessário)

---

## Conclusão

Este Design Document estabelece a base técnica e estratégica para o Cotador Enterprise, uma plataforma SaaS moderna e escalável para gestão e precificação de serviços. A arquitetura proposta, baseada em Clean Architecture e microsserviços, garante:

- ✅ **Escalabilidade**: Sistema pode crescer horizontalmente
- ✅ **Manutenibilidade**: Código organizado e testável
- ✅ **Resiliência**: Falhas isoladas não afetam o sistema todo
- ✅ **Observabilidade**: Visibilidade completa da operação
- ✅ **Qualidade**: TDD, code review e documentação garantem excelência

O Plano de Ação Global organiza o desenvolvimento em 3 Sprints focadas, com entregas incrementais de valor e métricas claras de sucesso.

---

**Documento mantido por**: Engineering Team  
**Última atualização**: 2025-01-17  
**Próxima revisão**: Após Sprint 1
