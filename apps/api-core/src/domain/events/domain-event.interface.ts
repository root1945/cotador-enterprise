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

  constructor(aggregateId: string, tenantId: string, eventType: string, version: string = '1.0') {
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
