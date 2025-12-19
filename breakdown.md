# Task 2.3: Domain Events no API Core - Detailed Breakdown

## Overview

**Task**: Implement Domain Events abstraction in API Core
**Status**: Pending
**Phase**: 2 (Contratos e Domain Events Compartilhados)
**Complexity**: Medium
**Estimated Time**: 2-4 hours
**Dependencies**: Task 2.2 (Contrato TypeScript do Evento) ✅ Completed

## Objective

Create domain event abstractions following Domain-Driven Design (DDD) patterns to enable the API Core to publish business events (like `BudgetCreated`) to RabbitMQ. This maintains clean architecture by keeping domain logic independent of infrastructure concerns.

## Architecture Context

### Clean Architecture Compliance

This task implements the **Domain Events** pattern from Eric Evans' DDD:
- Domain layer defines event contracts (`IDomainEvent`, `DomainEvent`)
- Events are first-class domain objects representing business facts
- Infrastructure layer will later handle actual publishing (Phase 3)
- Maintains dependency inversion principle (DIP)

### Current State

```
apps/api-core/src/domain/
├── entities/
│   ├── budget.entity.ts           ✅ Exists
│   ├── server-status.entity.ts    ✅ Exists
├── exceptions/                     ✅ Exists
└── repositories/
    └── budget-repository.interface.ts  ✅ Exists

❌ Missing: domain/events/ directory and event abstractions
```

### Target State

```
apps/api-core/src/domain/
├── entities/
│   ├── budget.entity.ts
│   ├── server-status.entity.ts
├── events/                         🆕 NEW
│   ├── domain-event.interface.ts   🆕 NEW
│   └── budget-created.event.ts     🆕 NEW
├── exceptions/
└── repositories/
    └── budget-repository.interface.ts
```

## Subtasks Breakdown

### Subtask 2.3.1: Create Domain Event Abstraction

**Files to create:**
- `apps/api-core/src/domain/events/domain-event.interface.ts`

**Purpose**: Define base interface and abstract class for all domain events

**Implementation Steps:**

1. **Create directory structure**
   ```bash
   mkdir -p apps/api-core/src/domain/events
   ```

2. **Define `IDomainEvent` interface**

   Properties required:
   - `eventId: string` - Unique identifier (UUID)
   - `eventType: string` - Type discriminator (e.g., "BudgetCreated")
   - `aggregateId: string` - ID of the aggregate root that generated the event
   - `tenantId: string` - Tenant isolation (multi-tenancy support)
   - `occurredAt: Date` - Timestamp when event occurred
   - `version: string` - Schema version (e.g., "1.0")
   - `toJSON(): Record<string, any>` - Serialization method

3. **Create `DomainEvent` abstract class**

   Implementation requirements:
   - Implements `IDomainEvent`
   - Constructor auto-generates `eventId` using `crypto.randomUUID()`
   - Constructor sets `occurredAt` to current timestamp
   - All properties are `readonly` (immutability)
   - Abstract method `toJSON()` must be implemented by subclasses

**Code Template (from IMPLEMENTATION_PLAN.md):**

```typescript
/**
 * Interface base para todos os eventos de domínio
 *
 * Pattern: Domain Events (Eric Evans)
 * Garante que eventos são objetos de primeira classe no domínio
 */
export interface IDomainEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  tenantId: string;
  occurredAt: Date;
  version: string;
  toJSON(): Record<string, any>;
}

/**
 * Implementação base abstrata
 */
export abstract class DomainEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly eventType: string;
  public readonly aggregateId: string;
  public readonly tenantId: string;
  public readonly occurredAt: Date;
  public readonly version: string;

  constructor(
    aggregateId: string,
    tenantId: string,
    eventType: string,
    version: string = '1.0',
  ) {
    this.eventId = crypto.randomUUID();
    this.aggregateId = aggregateId;
    this.tenantId = tenantId;
    this.eventType = eventType;
    this.version = version;
    this.occurredAt = new Date();
  }

  abstract toJSON(): Record<string, any>;
}
```

**Quality Checks:**
- [ ] TypeScript strict mode compliance (no `any` except in `toJSON` return)
- [ ] All properties are `readonly`
- [ ] JSDoc comments explaining the pattern
- [ ] Imports use Node.js built-in `crypto` module

**Testing Considerations:**
- Unit tests not strictly required for abstract classes
- Will be tested indirectly through concrete implementations

---

### Subtask 2.3.2: Implement BudgetCreatedEvent

**Files to create:**
- `apps/api-core/src/domain/events/budget-created.event.ts`

**Purpose**: Concrete domain event representing budget creation

**Implementation Steps:**

1. **Import dependencies**
   ```typescript
   import { DomainEvent } from './domain-event.interface';
   import { Budget } from '../entities/budget.entity';
   ```

2. **Define class extending `DomainEvent`**

   Constructor parameters:
   - `budget: Budget` - The budget aggregate root
   - `tenantId: string` - Tenant identifier
   - `metadata?: object` - Optional tracing/correlation data
     - `userId?: string`
     - `correlationId?: string`
     - `traceId?: string`

3. **Implement `toJSON()` method**

   Must return structure matching `BudgetCreatedEvent` from `@cotador/shared`:
   ```typescript
   {
     eventId: string;
     eventType: 'BudgetCreated';
     aggregateId: string;
     tenantId: string;
     occurredAt: string; // ISO 8601
     version: string;
     payload: {
       budgetId: string;
       clientName: string;
       total: number;
       status: string;
       items: Array<{
         id: string;
         description: string;
         unitPrice: number;
         quantity: number;
       }>;
       createdAt: string; // ISO 8601
     };
     metadata: {
       userId?: string;
       correlationId?: string;
       source: string; // Always "api-core"
       traceId?: string;
     };
   }
   ```

4. **Handle item ID generation**

   Current `Budget.items` structure (from budget.entity.ts):
   ```typescript
   export class BudgetItem {
     constructor(
       public description: string,
       public unitPrice: number,
       public quantity: number,
     ) {}
   }
   ```

   **Issue**: `BudgetItem` doesn't have an `id` field yet

   **Solution Options:**
   - Option A: Generate UUID for each item in `toJSON()` (temporary)
   - Option B: Add `id` field to `BudgetItem` entity (better, but requires entity refactor)

   **Recommendation**: Use Option A for now, create follow-up task for Option B

**Code Template (from IMPLEMENTATION_PLAN.md):**

```typescript
import { DomainEvent } from './domain-event.interface';
import { Budget } from '../entities/budget.entity';

/**
 * Evento de Domínio: BudgetCreated
 *
 * Representa o fato de que um orçamento foi criado.
 * Este evento é publicado após a persistência bem-sucedida.
 */
export class BudgetCreatedEvent extends DomainEvent {
  constructor(
    public readonly budget: Budget,
    public readonly tenantId: string,
    public readonly metadata?: {
      userId?: string;
      correlationId?: string;
      traceId?: string;
    },
  ) {
    super(budget.id, tenantId, 'BudgetCreated', '1.0');
  }

  toJSON(): Record<string, any> {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      aggregateId: this.aggregateId,
      tenantId: this.tenantId,
      occurredAt: this.occurredAt.toISOString(),
      version: this.version,
      payload: {
        budgetId: this.budget.id,
        clientName: this.budget.clientName,
        total: this.budget.total,
        status: this.budget.status,
        items: this.budget.items.map((item) => ({
          id: crypto.randomUUID(), // TODO: Use persisted ID when available
          description: item.description,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
        })),
        createdAt: this.budget.createdAt.toISOString(),
      },
      metadata: {
        userId: this.metadata?.userId,
        correlationId: this.metadata?.correlationId,
        source: 'api-core',
        traceId: this.metadata?.traceId,
      },
    };
  }
}
```

**Quality Checks:**
- [ ] Extends `DomainEvent` correctly
- [ ] Constructor calls `super()` with correct parameters
- [ ] `toJSON()` returns structure matching `@cotador/shared` contract
- [ ] Dates converted to ISO 8601 strings
- [ ] `source` field hardcoded to "api-core"
- [ ] JSDoc comment explaining event purpose
- [ ] TypeScript strict mode compliance

**Testing Strategy:**
Create unit test file: `budget-created.event.spec.ts`

Test cases:
```typescript
describe('BudgetCreatedEvent', () => {
  it('should generate unique eventId', () => {
    // Create two events, verify different eventIds
  });

  it('should serialize to correct JSON structure', () => {
    // Create event, call toJSON(), verify all fields present
  });

  it('should use budget.id as aggregateId', () => {
    // Verify aggregateId matches budget.id
  });

  it('should convert dates to ISO 8601 strings', () => {
    // Verify occurredAt and createdAt are ISO formatted
  });

  it('should include optional metadata when provided', () => {
    // Create event with metadata, verify in toJSON() output
  });

  it('should handle missing metadata gracefully', () => {
    // Create event without metadata, verify no errors
  });
});
```

---

## Integration Points

### Current System Integration

**Where this task fits in the workflow:**

1. **Phase 2 (Current)**: Define domain events
   - ✅ Task 2.1: Shared package structure
   - ✅ Task 2.2: Event contracts in `@cotador/shared`
   - 🔄 **Task 2.3**: Domain events in API Core (THIS TASK)

2. **Phase 3 (Next)**: Publish events to RabbitMQ
   - Task 3.1: Install RabbitMQ dependencies
   - Task 3.2: Create `RmqModule`
   - Task 3.3: Create `IEventBus` interface and `RabbitMQEventBus`
   - Task 3.4: Update `BudgetModule` to provide `IEventBus`
   - Task 3.5: Refactor `CreateBudgetUseCase` to publish events

**Future Usage (Phase 3):**

```typescript
// In CreateBudgetUseCase (Phase 3)
async execute(input: CreateBudgetDto): Promise<Budget> {
  // ... create budget logic ...
  await this.budgetRepo.save(budget);

  // Publish domain event (Phase 3)
  const event = new BudgetCreatedEvent(budget, tenantId, metadata);
  await this.eventBus.publish(event);

  return budget;
}
```

### Dependency Graph

```
Task 2.3 Domain Events
    ↓ depends on
Task 2.2 Event Contracts (@cotador/shared) ✅
    ↓ used by (future)
Task 3.5 CreateBudgetUseCase Refactoring
```

---

## Validation & Acceptance Criteria

### Definition of Done

- [ ] Directory `apps/api-core/src/domain/events/` created
- [ ] File `domain-event.interface.ts` created with:
  - [ ] `IDomainEvent` interface
  - [ ] `DomainEvent` abstract class
  - [ ] JSDoc comments
- [ ] File `budget-created.event.ts` created with:
  - [ ] `BudgetCreatedEvent` class
  - [ ] Correct inheritance from `DomainEvent`
  - [ ] `toJSON()` implementation matching shared contract
- [ ] Code passes linting: `npm run lint`
- [ ] Code is formatted: `npm run format`
- [ ] No TypeScript errors: `npm run build`
- [ ] Unit tests written and passing (optional for this phase)

### Manual Verification Steps

1. **Verify file structure:**
   ```bash
   ls -la apps/api-core/src/domain/events/
   # Should show: domain-event.interface.ts, budget-created.event.ts
   ```

2. **Verify TypeScript compilation:**
   ```bash
   cd apps/api-core
   npm run build
   # Should succeed without errors
   ```

3. **Test event instantiation (Node REPL):**
   ```bash
   cd apps/api-core
   node -r ts-node/register
   ```
   ```typescript
   import { BudgetCreatedEvent } from './src/domain/events/budget-created.event';
   import { Budget, BudgetItem } from './src/domain/entities/budget.entity';

   const budget = new Budget('uuid', 'Client', [new BudgetItem('Test', 100, 1)], 100, 'draft', new Date());
   const event = new BudgetCreatedEvent(budget, 'tenant-123', { userId: 'user-1' });
   console.log(event.toJSON());
   // Should output valid JSON structure
   ```

4. **Verify contract compatibility:**
   ```typescript
   import { BudgetCreatedEventSchema } from '@cotador/shared';
   const result = BudgetCreatedEventSchema.safeParse(event.toJSON());
   console.log(result.success); // Should be true
   ```

---

## Risks & Mitigations

### Risk 1: BudgetItem Missing ID Field

**Impact**: Medium
**Probability**: High (already confirmed)

**Issue**: Current `BudgetItem` entity doesn't have an `id` field, but the event contract requires it.

**Mitigation**:
- Short-term: Generate UUID in `toJSON()` method (implemented in template)
- Long-term: Add `id` field to `BudgetItem` entity (create follow-up task)

**Follow-up Task**:
```
Task 2.3.3: Add ID field to BudgetItem entity
- Update BudgetItem constructor to accept id parameter
- Update CreateBudgetUseCase to generate UUIDs for items
- Update Prisma schema to include item IDs
- Create migration
```

### Risk 2: Type Incompatibility with Shared Contract

**Impact**: High
**Probability**: Low

**Issue**: Domain event `toJSON()` output might not match `@cotador/shared` contract.

**Mitigation**:
- Use Zod schema validation in unit tests
- Reference IMPLEMENTATION_PLAN.md for exact structure
- Manual verification step included in acceptance criteria

### Risk 3: Breaking Clean Architecture

**Impact**: High
**Probability**: Low

**Issue**: Accidentally importing infrastructure concerns into domain layer.

**Mitigation**:
- Strict review of imports (only domain entities, no infra)
- ESLint rules should catch violations
- Code review checklist item

---

## Code Review Checklist

When reviewing this task, verify:

### Clean Architecture Compliance
- [ ] No imports from `infra/` or `application/` in domain events
- [ ] Only imports from `domain/entities` and Node.js built-ins
- [ ] No framework decorators (NestJS) in domain layer

### TypeScript Quality
- [ ] No `any` types (except `toJSON()` return type)
- [ ] All properties are `readonly`
- [ ] Strict mode compliance
- [ ] Proper type annotations

### Domain Event Pattern
- [ ] Events are immutable (readonly properties)
- [ ] Events represent past facts (past tense naming: "Created", not "Create")
- [ ] Events contain all necessary data for consumers

### Contract Compliance
- [ ] `toJSON()` output matches `@cotador/shared` structure
- [ ] Date fields converted to ISO 8601 strings
- [ ] Required fields are present
- [ ] Optional fields handled correctly

### Documentation
- [ ] JSDoc comments on interfaces and classes
- [ ] Explanation of patterns used (Domain Events)
- [ ] TODOs for known issues (like BudgetItem ID)

---

## Resources & References

### Documentation
- **IMPLEMENTATION_PLAN.md** - Section 1.2 (Contrato de Interface - Domain Events)
- **DESIGN_DOCUMENT.md** - Section 2.1 (Clean Architecture)
- **DEVELOPMENT_GUIDELINES.md** - Section 2.1 (Regra de Dependência)

### Design Patterns
- **Domain Events** - Eric Evans, Domain-Driven Design
- **Dependency Inversion Principle** - SOLID principles
- **Clean Architecture** - Robert C. Martin

### External References
- NestJS Microservices: https://docs.nestjs.com/microservices/basics
- Domain Events: https://martinfowler.com/eaaDev/DomainEvent.html

---

## Next Steps

After completing Task 2.3:

1. **Immediate**: Mark task as complete in LOW_LEVEL_TASK_LIST.md
2. **Phase 3**: Begin Task 3.1 (Install RabbitMQ dependencies)
3. **Follow-up**: Create task for adding ID to BudgetItem entity

**Estimated Timeline:**
- Task 2.3: 2-4 hours
- Phase 3 (Tasks 3.1-3.6): 8-12 hours
- Total to working event publishing: ~16 hours

---

## Questions & Decisions Log

### Q1: Should BudgetItem have an ID field?
**Answer**: Yes, but implement later. Use temporary UUID generation in `toJSON()` for now.
**Rationale**: Separates concerns, allows Task 2.3 to proceed without entity refactoring.

### Q2: Where should event validation occur?
**Answer**: Consumer side using Zod schemas from `@cotador/shared`.
**Rationale**: Producer trusts its own domain events, consumers validate untrusted input.

### Q3: Should events be persisted (Event Sourcing)?
**Answer**: Not in Phase 2-3. Outbox Pattern (Phase 4) will handle persistence.
**Rationale**: Phased implementation, basic messaging first, reliability later.

---

## Appendix: File Templates

### A. domain-event.interface.ts (Complete)

```typescript
import { randomUUID } from 'node:crypto';

/**
 * Interface base para todos os eventos de domínio
 *
 * Pattern: Domain Events (Eric Evans, Domain-Driven Design)
 *
 * Eventos de domínio representam fatos que aconteceram no sistema.
 * São objetos de primeira classe no domínio e devem ser imutáveis.
 *
 * @see IMPLEMENTATION_PLAN.md Section 1.2
 */
export interface IDomainEvent {
  /** Identificador único do evento (UUID) */
  eventId: string;

  /** Tipo do evento (ex: "BudgetCreated") */
  eventType: string;

  /** ID da entidade agregada que gerou o evento */
  aggregateId: string;

  /** ID do tenant (isolamento multi-tenant) */
  tenantId: string;

  /** Momento em que o evento ocorreu */
  occurredAt: Date;

  /** Versão do schema do evento (versionamento) */
  version: string;

  /**
   * Serializa o evento para formato JSON
   * Usado para publicação em message broker
   */
  toJSON(): Record<string, any>;
}

/**
 * Classe abstrata base para eventos de domínio
 *
 * Implementa funcionalidades comuns:
 * - Geração automática de eventId
 * - Timestamp automático
 * - Imutabilidade (readonly)
 */
export abstract class DomainEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly eventType: string;
  public readonly aggregateId: string;
  public readonly tenantId: string;
  public readonly occurredAt: Date;
  public readonly version: string;

  constructor(
    aggregateId: string,
    tenantId: string,
    eventType: string,
    version: string = '1.0',
  ) {
    this.eventId = randomUUID();
    this.aggregateId = aggregateId;
    this.tenantId = tenantId;
    this.eventType = eventType;
    this.version = version;
    this.occurredAt = new Date();
  }

  /**
   * Subclasses devem implementar serialização específica
   * conforme contrato do evento
   */
  abstract toJSON(): Record<string, any>;
}
```

### B. budget-created.event.ts (Complete)

```typescript
import { randomUUID } from 'node:crypto';
import { DomainEvent } from './domain-event.interface';
import { Budget } from '../entities/budget.entity';

/**
 * Evento de Domínio: BudgetCreated
 *
 * Representa o fato de que um orçamento foi criado com sucesso.
 * Este evento é publicado após a persistência bem-sucedida no banco de dados.
 *
 * Consumidores:
 * - micro-pdf: Gera documento PDF do orçamento
 * - Future: Sistema de notificações, analytics, etc.
 *
 * @see packages/shared/src/events/budget-created.event.ts - Contrato do evento
 */
export class BudgetCreatedEvent extends DomainEvent {
  constructor(
    public readonly budget: Budget,
    tenantId: string,
    public readonly metadata?: {
      userId?: string;
      correlationId?: string;
      traceId?: string;
    },
  ) {
    super(budget.id, tenantId, 'BudgetCreated', '1.0');
  }

  /**
   * Serializa evento para formato JSON compatível com contrato
   *
   * Estrutura do JSON está definida em @cotador/shared
   * e validada por BudgetCreatedEventSchema (Zod)
   */
  toJSON(): Record<string, any> {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      aggregateId: this.aggregateId,
      tenantId: this.tenantId,
      occurredAt: this.occurredAt.toISOString(),
      version: this.version,
      payload: {
        budgetId: this.budget.id,
        clientName: this.budget.clientName,
        total: this.budget.total,
        status: this.budget.status,
        items: this.budget.items.map((item) => ({
          // TODO: Use persisted item ID when BudgetItem entity is updated
          id: randomUUID(),
          description: item.description,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
        })),
        createdAt: this.budget.createdAt.toISOString(),
      },
      metadata: {
        userId: this.metadata?.userId,
        correlationId: this.metadata?.correlationId,
        source: 'api-core',
        traceId: this.metadata?.traceId,
      },
    };
  }
}
```

### C. budget-created.event.spec.ts (Unit Tests)

```typescript
import { BudgetCreatedEvent } from './budget-created.event';
import { Budget, BudgetItem } from '../entities/budget.entity';
import { BudgetCreatedEventSchema } from '@cotador/shared';

describe('BudgetCreatedEvent', () => {
  const createTestBudget = (): Budget => {
    return new Budget(
      'budget-123',
      'Test Client',
      [
        new BudgetItem('Item 1', 100, 2),
        new BudgetItem('Item 2', 50, 1),
      ],
      250,
      'draft',
      new Date('2025-01-17T10:00:00Z'),
    );
  };

  describe('constructor', () => {
    it('should create event with unique eventId', () => {
      const budget = createTestBudget();
      const event1 = new BudgetCreatedEvent(budget, 'tenant-1');
      const event2 = new BudgetCreatedEvent(budget, 'tenant-1');

      expect(event1.eventId).toBeDefined();
      expect(event2.eventId).toBeDefined();
      expect(event1.eventId).not.toBe(event2.eventId);
    });

    it('should set eventType to BudgetCreated', () => {
      const budget = createTestBudget();
      const event = new BudgetCreatedEvent(budget, 'tenant-1');

      expect(event.eventType).toBe('BudgetCreated');
    });

    it('should use budget.id as aggregateId', () => {
      const budget = createTestBudget();
      const event = new BudgetCreatedEvent(budget, 'tenant-1');

      expect(event.aggregateId).toBe('budget-123');
    });

    it('should set tenantId correctly', () => {
      const budget = createTestBudget();
      const event = new BudgetCreatedEvent(budget, 'tenant-xyz');

      expect(event.tenantId).toBe('tenant-xyz');
    });

    it('should set version to 1.0', () => {
      const budget = createTestBudget();
      const event = new BudgetCreatedEvent(budget, 'tenant-1');

      expect(event.version).toBe('1.0');
    });

    it('should set occurredAt to current timestamp', () => {
      const before = new Date();
      const budget = createTestBudget();
      const event = new BudgetCreatedEvent(budget, 'tenant-1');
      const after = new Date();

      expect(event.occurredAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(event.occurredAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('toJSON', () => {
    it('should serialize to correct structure', () => {
      const budget = createTestBudget();
      const event = new BudgetCreatedEvent(budget, 'tenant-1', {
        userId: 'user-123',
        correlationId: 'corr-456',
        traceId: 'trace-789',
      });

      const json = event.toJSON();

      expect(json).toHaveProperty('eventId');
      expect(json).toHaveProperty('eventType', 'BudgetCreated');
      expect(json).toHaveProperty('aggregateId', 'budget-123');
      expect(json).toHaveProperty('tenantId', 'tenant-1');
      expect(json).toHaveProperty('occurredAt');
      expect(json).toHaveProperty('version', '1.0');
      expect(json).toHaveProperty('payload');
      expect(json).toHaveProperty('metadata');
    });

    it('should convert dates to ISO 8601 strings', () => {
      const budget = createTestBudget();
      const event = new BudgetCreatedEvent(budget, 'tenant-1');

      const json = event.toJSON();

      expect(typeof json.occurredAt).toBe('string');
      expect(json.occurredAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(typeof json.payload.createdAt).toBe('string');
      expect(json.payload.createdAt).toBe('2025-01-17T10:00:00.000Z');
    });

    it('should map budget properties correctly', () => {
      const budget = createTestBudget();
      const event = new BudgetCreatedEvent(budget, 'tenant-1');

      const json = event.toJSON();

      expect(json.payload.budgetId).toBe('budget-123');
      expect(json.payload.clientName).toBe('Test Client');
      expect(json.payload.total).toBe(250);
      expect(json.payload.status).toBe('draft');
      expect(json.payload.items).toHaveLength(2);
    });

    it('should generate UUIDs for items', () => {
      const budget = createTestBudget();
      const event = new BudgetCreatedEvent(budget, 'tenant-1');

      const json = event.toJSON();

      expect(json.payload.items[0].id).toBeDefined();
      expect(json.payload.items[1].id).toBeDefined();
      expect(json.payload.items[0].id).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('should include metadata when provided', () => {
      const budget = createTestBudget();
      const event = new BudgetCreatedEvent(budget, 'tenant-1', {
        userId: 'user-123',
        correlationId: 'corr-456',
        traceId: 'trace-789',
      });

      const json = event.toJSON();

      expect(json.metadata.userId).toBe('user-123');
      expect(json.metadata.correlationId).toBe('corr-456');
      expect(json.metadata.traceId).toBe('trace-789');
      expect(json.metadata.source).toBe('api-core');
    });

    it('should handle missing metadata gracefully', () => {
      const budget = createTestBudget();
      const event = new BudgetCreatedEvent(budget, 'tenant-1');

      const json = event.toJSON();

      expect(json.metadata.userId).toBeUndefined();
      expect(json.metadata.correlationId).toBeUndefined();
      expect(json.metadata.traceId).toBeUndefined();
      expect(json.metadata.source).toBe('api-core');
    });

    it('should validate against shared contract schema', () => {
      const budget = createTestBudget();
      const event = new BudgetCreatedEvent(budget, 'tenant-1', {
        userId: 'user-123',
      });

      const json = event.toJSON();
      const result = BudgetCreatedEventSchema.safeParse(json);

      expect(result.success).toBe(true);
    });
  });
});
```

---

**End of Breakdown Document**

This document should be used as the primary reference when implementing Task 2.3. Refer to IMPLEMENTATION_PLAN.md for additional context and LOW_LEVEL_TASK_LIST.md for checklist tracking.
