/**
 * Evento de Domínio: BudgetCreated
 *
 * Publicado quando um orçamento é criado com sucesso.
 * Consumido pelo micro-pdf para gerar documento PDF.
 */

/**
 * Payload de um item do orçamento
 */
export interface BudgetItemPayload {
  id: string;
  description: string;
  unitPrice: number;
  quantity: number;
}

/**
 * Payload principal do evento BudgetCreated
 */
export interface BudgetCreatedPayload {
  budgetId: string;
  clientName: string;
  total: number;
  status: 'draft' | 'approved' | 'rejected';
  items: BudgetItemPayload[];
  createdAt: string; // ISO 8601
}

/**
 * Metadados do evento para rastreamento e auditoria
 */
export interface EventMetadata {
  userId?: string;
  correlationId?: string;
  source: string;
  traceId?: string;
}

/**
 * Estrutura completa do evento BudgetCreated
 */
export interface BudgetCreatedEvent {
  eventId: string; // UUID único do evento
  eventType: 'BudgetCreated';
  aggregateId: string; // ID do orçamento
  tenantId: string;
  occurredAt: string; // ISO 8601
  version: string; // Versão do schema do evento
  payload: BudgetCreatedPayload;
  metadata: EventMetadata;
}

/**
 * Validação do evento usando Zod (opcional, mas recomendado)
 */
import { z } from 'zod';

/**
 * Schema Zod para validação de BudgetItemPayload
 */
export const BudgetItemPayloadSchema = z.object({
  id: z.string().uuid(),
  description: z.string().min(1),
  unitPrice: z.number().positive(),
  quantity: z.number().int().positive(),
});

/**
 * Schema Zod para validação de BudgetCreatedPayload
 */
export const BudgetCreatedPayloadSchema = z.object({
  budgetId: z.string().uuid(),
  clientName: z.string().min(1),
  total: z.number().nonnegative(),
  status: z.enum(['draft', 'approved', 'rejected']),
  items: z.array(BudgetItemPayloadSchema).min(1),
  createdAt: z.string().datetime(),
});

/**
 * Schema Zod para validação completa do evento BudgetCreated
 */
export const BudgetCreatedEventSchema = z.object({
  eventId: z.string().uuid(),
  eventType: z.literal('BudgetCreated'),
  aggregateId: z.string().uuid(),
  tenantId: z.string().min(1),
  occurredAt: z.string().datetime(),
  version: z.string(),
  payload: BudgetCreatedPayloadSchema,
  metadata: z.object({
    userId: z.string().optional(),
    correlationId: z.string().optional(),
    source: z.string(),
    traceId: z.string().optional(),
  }),
});
