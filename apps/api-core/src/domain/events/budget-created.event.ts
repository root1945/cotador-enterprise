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
    }
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
