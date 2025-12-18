# Documentação de Tarefas de Baixo Nível

## Integração de Mensageria e Worker de PDF - Cotador Enterprise

**Versão**: 1.0  
**Data**: 2025-01-17  
**Baseado em**: IMPLEMENTATION_PLAN.md

---

## Fase 1: Setup da Infraestrutura RabbitMQ

### 1.1 Configuração de Ambiente e Scripts

- [x] **Criar script de setup do RabbitMQ**
  - [x] Criar arquivo `scripts/setup-rabbitmq.sh`
  - [x] Adicionar shebang `#!/bin/bash` no início do script
  - [x] Definir variáveis de ambiente: `RABBITMQ_URL`, `USERNAME`, `PASSWORD`
  - [x] Adicionar comando curl para criar Exchange `cotador.events` (tipo: topic, durable: true)
  - [x] Adicionar comando curl para criar Queue `budget.created` (durable: true, com TTL de 24h)
  - [x] Adicionar comando curl para criar Queue `budget.pdf.ready` (durable: true)
  - [x] Adicionar comando curl para criar Dead Letter Exchange `cotador.dlx` (tipo: topic)
  - [x] Adicionar comando curl para criar Dead Letter Queue `budget.created.dlq` (durable: true)
  - [x] Adicionar comando curl para criar binding `budget.created.*` → `budget.created`
  - [x] Adicionar comando curl para criar binding `budget.pdf.ready.*` → `budget.pdf.ready`
  - [x] Adicionar comando curl para criar binding `budget.created.dlq` → `budget.created.dlq`
  - [x] Adicionar mensagem de sucesso no final do script
  - [x] Tornar script executável: `chmod +x scripts/setup-rabbitmq.sh`
  - [x] Adicionar verificação de saúde do RabbitMQ antes de executar
  - [x] Implementar tratamento de erros básico
  - [x] Adicionar suporte a variáveis de ambiente para configuração
  - [x] Implementar retry logic para verificação de recursos
  - [x] Melhorar tratamento de erros HTTP 400 e 404

- [x] **Criar script de monitoramento de DLQ**
  - [x] Criar arquivo `scripts/monitor-dlq.sh`
  - [x] Implementar consulta à API do RabbitMQ para obter tamanho da DLQ
  - [x] Adicionar lógica de alerta quando DLQ > 10 mensagens
  - [x] Tornar script executável: `chmod +x scripts/monitor-dlq.sh`
  - [x] Adicionar suporte a variáveis de ambiente para configuração
  - [x] Implementar verificação de saúde do RabbitMQ
  - [x] Adicionar suporte opcional a jq para parsing robusto de JSON
  - [x] Exit code 1 quando threshold é excedido (útil para sistemas de monitoramento)

---

## Fase 2: Contratos e Domain Events Compartilhados

### 2.1 Estrutura do Pacote Compartilhado

- [x] **Criar pacote compartilhado para contratos**
  - [x] Criar diretório `packages/shared/src/events/`
  - [x] Criar arquivo `packages/shared/package.json` com configuração básica
  - [x] Criar arquivo `packages/shared/tsconfig.json` com configuração TypeScript
  - [x] Configurar path mapping `@cotador/shared` no `tsconfig.json` da raiz do monorepo

### 2.2 Contrato TypeScript do Evento

- [x] **Criar interfaces do contrato BudgetCreatedEvent**
  - [x] Criar arquivo `packages/shared/src/events/budget-created.event.ts`
  - [x] Definir interface `BudgetItemPayload` conforme seção 1.1.2 do plano
  - [x] Definir interface `BudgetCreatedPayload` conforme seção 1.1.2 do plano
  - [x] Definir interface `EventMetadata` conforme seção 1.1.2 do plano
  - [x] Definir interface `BudgetCreatedEvent` conforme seção 1.1.2 do plano
  - [x] Adicionar comentário JSDoc explicando o propósito do evento

- [x] **Implementar validação com Zod (opcional)**
  - [x] Instalar dependência `zod` no pacote shared: `npm install zod`
  - [x] Criar schema `BudgetItemPayloadSchema` usando Zod
  - [x] Criar schema `BudgetCreatedPayloadSchema` usando Zod
  - [x] Criar schema `BudgetCreatedEventSchema` usando Zod
  - [x] Exportar schemas para uso em validação

### 2.3 Domain Events no API Core

- [ ] **Criar abstração de Domain Event**
  - [ ] Criar diretório `apps/api-core/src/domain/events/`
  - [ ] Criar arquivo `apps/api-core/src/domain/events/domain-event.interface.ts`
  - [ ] Definir interface `IDomainEvent` conforme seção 1.2 do plano
  - [ ] Criar classe abstrata `DomainEvent` implementando `IDomainEvent`
  - [ ] Implementar construtor que gera `eventId` usando `crypto.randomUUID()`
  - [ ] Implementar método abstrato `toJSON()` na classe base

- [ ] **Implementar BudgetCreatedEvent no domínio**
  - [ ] Criar arquivo `apps/api-core/src/domain/events/budget-created.event.ts`
  - [ ] Importar `DomainEvent` e entidade `Budget`
  - [ ] Criar classe `BudgetCreatedEvent` estendendo `DomainEvent`
  - [ ] Implementar construtor recebendo `budget`, `tenantId` e `metadata`
  - [ ] Implementar método `toJSON()` retornando estrutura conforme seção 1.2 do plano
  - [ ] Mapear propriedades do `budget` para o formato do payload

---

## Fase 3: Implementação no API Core (Producer)

### 3.1 Instalação de Dependências

- [ ] **Instalar dependências do RabbitMQ**
  - [ ] Navegar para `apps/api-core/`
  - [ ] Executar: `npm install @nestjs/microservices amqplib amqp-connection-manager`
  - [ ] Executar: `npm install --save-dev @types/amqplib`
  - [ ] Verificar se dependências foram adicionadas ao `package.json`

### 3.2 Módulo RabbitMQ

- [ ] **Criar RmqModule**
  - [ ] Criar diretório `apps/api-core/src/infra/messaging/`
  - [ ] Criar arquivo `apps/api-core/src/infra/messaging/rmq.module.ts`
  - [ ] Importar `Module`, `ClientsModule`, `Transport` do NestJS
  - [ ] Importar `ConfigModule` e `ConfigService`
  - [ ] Criar decorator `@Module` com `imports` contendo `ClientsModule.registerAsync`
  - [ ] Configurar `ClientsModule` com nome `'RABBITMQ_SERVICE'`
  - [ ] Configurar `transport: Transport.RMQ`
  - [ ] Configurar `urls` usando `ConfigService.get('RABBITMQ_URL')`
  - [ ] Configurar `queue: 'budget.created'`
  - [ ] Configurar `queueOptions` com `durable: true`, TTL de 24h, DLX e DLQ routing key
  - [ ] Configurar `socketOptions` com heartbeat e reconnect
  - [ ] Exportar `ClientsModule` no módulo

### 3.3 Event Bus Interface e Implementação

- [ ] **Criar interface IEventBus no domínio**
  - [ ] Criar arquivo `apps/api-core/src/domain/events/event-bus.interface.ts`
  - [ ] Importar `IDomainEvent`
  - [ ] Definir interface `IEventBus` com métodos `publish` e `publishAll`
  - [ ] Adicionar comentário explicando o padrão DIP

- [ ] **Implementar RabbitMQEventBus**
  - [ ] Criar arquivo `apps/api-core/src/infra/messaging/rabbitmq-event-bus.service.ts`
  - [ ] Importar `Injectable`, `Inject`, `Logger` do NestJS
  - [ ] Importar `ClientProxy` do `@nestjs/microservices`
  - [ ] Importar `IEventBus` e `IDomainEvent`
  - [ ] Importar `firstValueFrom`, `timeout` do RxJS
  - [ ] Criar classe `RabbitMQEventBus` implementando `IEventBus`
  - [ ] Adicionar decorator `@Injectable()`
  - [ ] Injetar `ClientProxy` com token `'RABBITMQ_SERVICE'` no construtor
  - [ ] Implementar método `publish` conforme seção 2.1.4 do plano
  - [ ] Implementar método `publishAll` usando `Promise.all`
  - [ ] Implementar método privado `getRoutingKey` para gerar routing key
  - [ ] Adicionar logging estruturado (debug, log, error)

### 3.4 Integração no BudgetModule

- [ ] **Atualizar BudgetModule**
  - [ ] Abrir arquivo `apps/api-core/src/infra/modules/budget.module.ts`
  - [ ] Importar `RmqModule` de `../messaging/rmq.module`
  - [ ] Importar `RabbitMQEventBus` de `../messaging/rabbitmq-event-bus.service`
  - [ ] Importar `IEventBus` de `../../domain/events/event-bus.interface`
  - [ ] Adicionar `RmqModule` no array `imports`
  - [ ] Adicionar provider para `'IEventBus'` usando `RabbitMQEventBus`
  - [ ] Atualizar factory do `CreateBudgetUseCase` para injetar `IEventBus`

### 3.5 Refatoração do CreateBudgetUseCase

- [ ] **Atualizar CreateBudgetUseCase**
  - [ ] Abrir arquivo `apps/api-core/src/application/use-cases/create-budget.use-case.ts`
  - [ ] Importar `IEventBus` de `../../domain/events/event-bus.interface`
  - [ ] Importar `BudgetCreatedEvent` de `../../domain/events/budget-created.event`
  - [ ] Adicionar `eventBus: IEventBus` no construtor
  - [ ] Após `budgetRepo.save(budget)`, criar instância de `BudgetCreatedEvent`
  - [ ] Chamar `await this.eventBus.publish(event)` dentro de try-catch
  - [ ] Implementar tratamento de erro com log (best effort publishing)
  - [ ] Manter retorno do budget mesmo se publicação falhar

### 3.6 Atualização do Controller

- [ ] **Atualizar BudgetController**
  - [ ] Abrir arquivo `apps/api-core/src/infra/controllers/budget.controller.ts`
  - [ ] Verificar se método de criação recebe `tenantId` (via header ou body)
  - [ ] Verificar se método passa `metadata` (userId, correlationId, traceId) para o use case
  - [ ] Garantir que `tenantId` seja extraído corretamente (middleware ou decorator)

---

## Fase 4: Outbox Pattern (Opcional - Garantia de Entrega)

### 4.1 Schema do Banco de Dados

- [ ] **Adicionar tabela OutboxEvent no Prisma**
  - [ ] Abrir arquivo `apps/api-core/prisma/schema.prisma`
  - [ ] Adicionar model `OutboxEvent` conforme seção 2.3.2 do plano
  - [ ] Definir campos: `id`, `eventType`, `aggregateId`, `tenantId`, `payload`, `status`, `retryCount`, `lastError`, `createdAt`, `publishedAt`
  - [ ] Adicionar índices em `status` + `createdAt` e `tenantId`
  - [ ] Executar migration: `npx prisma migrate dev --name add_outbox_event`

### 4.2 Outbox Repository

- [ ] **Criar OutboxRepository**
  - [ ] Criar arquivo `apps/api-core/src/infra/messaging/outbox.repository.ts`
  - [ ] Importar `Injectable` do NestJS
  - [ ] Importar `PrismaService`
  - [ ] Importar `IDomainEvent`
  - [ ] Criar classe `OutboxRepository` com decorator `@Injectable()`
  - [ ] Injetar `PrismaService` no construtor
  - [ ] Implementar método `save(event: IDomainEvent)` criando registro no outbox
  - [ ] Implementar método `findPending(limit)` buscando eventos com status 'pending' e retryCount < 5
  - [ ] Implementar método `markAsPublished(id)` atualizando status para 'published'
  - [ ] Implementar método `markAsFailed(id, error)` atualizando status e incrementando retryCount

### 4.3 Outbox Processor

- [ ] **Criar OutboxProcessor**
  - [ ] Instalar `@nestjs/schedule`: `npm install @nestjs/schedule`
  - [ ] Criar arquivo `apps/api-core/src/infra/messaging/outbox-processor.service.ts`
  - [ ] Importar `Injectable`, `Logger` do NestJS
  - [ ] Importar `Cron`, `CronExpression` do `@nestjs/schedule`
  - [ ] Importar `OutboxRepository` e `RabbitMQEventBus`
  - [ ] Criar classe `OutboxProcessor` com decorator `@Injectable()`
  - [ ] Injetar `OutboxRepository` e `RabbitMQEventBus` no construtor
  - [ ] Implementar método `processPendingEvents()` com decorator `@Cron(CronExpression.EVERY_10_SECONDS)`
  - [ ] Buscar eventos pendentes usando `outboxRepo.findPending(100)`
  - [ ] Iterar sobre eventos e tentar publicar cada um
  - [ ] Marcar como publicado em caso de sucesso, ou como failed em caso de erro
  - [ ] Adicionar logging estruturado

### 4.4 Integração do Outbox no Use Case

- [ ] **Atualizar CreateBudgetUseCase para usar Outbox**
  - [ ] Abrir arquivo `apps/api-core/src/application/use-cases/create-budget.use-case.ts`
  - [ ] Importar `OutboxRepository` (se necessário)
  - [ ] Modificar método `execute` para salvar evento no outbox dentro da mesma transação do Prisma
  - [ ] Usar `prisma.$transaction` para garantir atomicidade
  - [ ] Manter tentativa de publicação imediata (best effort)
  - [ ] Se publicação imediata falhar, evento ficará no outbox para processamento posterior

### 4.5 Registrar OutboxProcessor no AppModule

- [ ] **Configurar ScheduleModule e OutboxProcessor**
  - [ ] Abrir arquivo `apps/api-core/src/app.module.ts`
  - [ ] Importar `ScheduleModule` do `@nestjs/schedule`
  - [ ] Importar `OutboxProcessor` de `./infra/messaging/outbox-processor.service`
  - [ ] Adicionar `ScheduleModule.forRoot()` no array `imports`
  - [ ] Adicionar `OutboxProcessor` no array `providers`

---

## Fase 5: Microservice Worker (micro-pdf)

### 5.1 Bootstrap do Projeto

- [ ] **Criar estrutura do projeto micro-pdf**
  - [ ] Criar diretório `apps/micro-pdf/`
  - [ ] Criar arquivo `apps/micro-pdf/package.json` conforme seção 3.1.2 do plano
  - [ ] Criar arquivo `apps/micro-pdf/tsconfig.json` (copiar de api-core e ajustar)
  - [ ] Criar arquivo `apps/micro-pdf/nest-cli.json` (copiar de api-core e ajustar)
  - [ ] Criar diretório `apps/micro-pdf/src/`
  - [ ] Criar estrutura de diretórios: `domain/`, `application/use-cases/`, `infra/consumers/`, `infra/storage/`, `infra/pdf/`

### 5.2 Instalação de Dependências

- [ ] **Instalar dependências do micro-pdf**
  - [ ] Navegar para `apps/micro-pdf/`
  - [ ] Executar: `npm install @nestjs/common @nestjs/core @nestjs/microservices @aws-sdk/client-s3 puppeteer rxjs`
  - [ ] Executar: `npm install --save-dev @types/node`
  - [ ] Verificar se dependências foram adicionadas ao `package.json`

### 5.3 Main.ts (Bootstrap do Microservice)

- [ ] **Criar main.ts**
  - [ ] Criar arquivo `apps/micro-pdf/src/main.ts`
  - [ ] Importar `NestFactory` do `@nestjs/core`
  - [ ] Importar `MicroserviceOptions`, `Transport` do `@nestjs/microservices`
  - [ ] Importar `AppModule`
  - [ ] Importar `Logger` do `@nestjs/common`
  - [ ] Criar função `bootstrap()` assíncrona
  - [ ] Criar microservice usando `NestFactory.createMicroservice` com `Transport.RMQ`
  - [ ] Configurar `urls` usando `process.env.RABBITMQ_URL`
  - [ ] Configurar `queue: 'budget.created'`
  - [ ] Configurar `queueOptions` com durable, TTL, DLX e DLQ
  - [ ] Configurar `socketOptions` com heartbeat e reconnect
  - [ ] Configurar `prefetchCount: 1`
  - [ ] Configurar logger
  - [ ] Chamar `await app.listen()`
  - [ ] Adicionar log de sucesso
  - [ ] Chamar `bootstrap()` no final do arquivo

### 5.4 App Module

- [ ] **Criar AppModule**
  - [ ] Criar arquivo `apps/micro-pdf/src/app.module.ts`
  - [ ] Importar `Module` do `@nestjs/common`
  - [ ] Importar `ConfigModule` do `@nestjs/config`
  - [ ] Importar `BudgetCreatedConsumer` de `./infra/consumers/budget-created.consumer`
  - [ ] Importar `GeneratePdfUseCase` de `./application/use-cases/generate-pdf.use-case`
  - [ ] Importar `PdfGeneratorService` de `./infra/pdf/pdf-generator.service`
  - [ ] Importar `S3StorageService` de `./infra/storage/s3-storage.service`
  - [ ] Importar `IStorageService` de `./domain/storage/storage.interface`
  - [ ] Criar decorator `@Module` com `imports: [ConfigModule.forRoot()]`
  - [ ] Adicionar `BudgetCreatedConsumer` no array `controllers`
  - [ ] Configurar providers com factory para `GeneratePdfUseCase`
  - [ ] Configurar provider para `'IStorageService'` usando `S3StorageService`
  - [ ] Adicionar `PdfGeneratorService` e `S3StorageService` nos providers

---

## Fase 6: Domain Logic no Worker

### 6.1 Storage Service Interface

- [ ] **Criar interface IStorageService**
  - [ ] Criar diretório `apps/micro-pdf/src/domain/storage/`
  - [ ] Criar arquivo `apps/micro-pdf/src/domain/storage/storage.interface.ts`
  - [ ] Definir interface `UploadOptions` conforme seção 3.2.3 do plano
  - [ ] Definir interface `IStorageService` com métodos `upload`, `delete`, `getUrl`
  - [ ] Adicionar tipos de retorno apropriados

### 6.2 PDF Generator Service

- [ ] **Criar PdfGeneratorService**
  - [ ] Criar arquivo `apps/micro-pdf/src/infra/pdf/pdf-generator.service.ts`
  - [ ] Importar `Injectable`, `Logger` do NestJS
  - [ ] Importar `puppeteer`
  - [ ] Importar `BudgetCreatedPayload` do contrato compartilhado
  - [ ] Criar classe `PdfGeneratorService` com decorator `@Injectable()`
  - [ ] Implementar método `generate(payload: BudgetCreatedPayload): Promise<Buffer>`
  - [ ] Inicializar Puppeteer com opções headless e args `--no-sandbox`, `--disable-setuid-sandbox`
  - [ ] Criar nova página no browser
  - [ ] Chamar método `renderTemplate` para gerar HTML
  - [ ] Usar `page.setContent` com `waitUntil: 'networkidle0'`
  - [ ] Gerar PDF usando `page.pdf` com formato A4, margens e `printBackground: true`
  - [ ] Retornar Buffer do PDF
  - [ ] Fechar browser no bloco `finally`
  - [ ] Implementar método privado `renderTemplate(payload)` retornando HTML string conforme seção 3.2.2 do plano

### 6.3 S3 Storage Service

- [ ] **Criar S3StorageService**
  - [ ] Criar arquivo `apps/micro-pdf/src/infra/storage/s3-storage.service.ts`
  - [ ] Importar `Injectable`, `Logger` do NestJS
  - [ ] Importar `S3Client`, `PutObjectCommand`, `DeleteObjectCommand` do `@aws-sdk/client-s3`
  - [ ] Importar `getSignedUrl` do `@aws-sdk/s3-request-presigner`
  - [ ] Importar `IStorageService`, `UploadOptions` da interface
  - [ ] Criar classe `S3StorageService` implementando `IStorageService`
  - [ ] Adicionar decorator `@Injectable()`
  - [ ] Inicializar `s3Client` e `bucketName` no construtor usando variáveis de ambiente
  - [ ] Implementar método `upload` conforme seção 3.2.4 do plano
  - [ ] Implementar método `delete` usando `DeleteObjectCommand`
  - [ ] Implementar método `getUrl` com lógica para bucket público ou signed URL
  - [ ] Adicionar tratamento de erros e logging

### 6.4 Generate PDF Use Case

- [ ] **Criar GeneratePdfUseCase**
  - [ ] Criar arquivo `apps/micro-pdf/src/application/use-cases/generate-pdf.use-case.ts`
  - [ ] Importar `Injectable`, `Logger` do NestJS
  - [ ] Importar `PdfGeneratorService` de `../../infra/pdf/pdf-generator.service`
  - [ ] Importar `IStorageService` de `../../domain/storage/storage.interface`
  - [ ] Importar `BudgetCreatedEvent` do contrato compartilhado
  - [ ] Criar classe `GeneratePdfUseCase` com decorator `@Injectable()`
  - [ ] Injetar `PdfGeneratorService` e `IStorageService` no construtor
  - [ ] Implementar método `execute(event: BudgetCreatedEvent): Promise<string>`
  - [ ] Chamar `pdfGenerator.generate(event.payload)` para obter Buffer
  - [ ] Construir nome do arquivo: `budgets/${tenantId}/${budgetId}.pdf`
  - [ ] Chamar `storage.upload` com buffer, contentType e metadata
  - [ ] Retornar URL do PDF
  - [ ] Adicionar tratamento de erros e logging estruturado

---

## Fase 7: Consumer e Integração

### 7.1 Budget Created Consumer

- [ ] **Criar BudgetCreatedConsumer**
  - [ ] Criar arquivo `apps/micro-pdf/src/infra/consumers/budget-created.consumer.ts`
  - [ ] Importar `Controller`, `Logger` do NestJS
  - [ ] Importar `EventPattern`, `Payload`, `Ctx`, `RmqContext` do `@nestjs/microservices`
  - [ ] Importar `GeneratePdfUseCase`
  - [ ] Importar `BudgetCreatedEvent` do contrato compartilhado
  - [ ] Criar classe `BudgetCreatedConsumer` com decorator `@Controller()`
  - [ ] Injetar `GeneratePdfUseCase` no construtor
  - [ ] Criar método `handleBudgetCreated` com decorator `@EventPattern('budget.created')`
  - [ ] Extrair `channel` e `originalMsg` do `RmqContext`
  - [ ] Chamar `generatePdfUseCase.execute(event)`
  - [ ] Fazer `channel.ack(originalMsg)` em caso de sucesso
  - [ ] Fazer `channel.nack(originalMsg, false, false)` em caso de erro
  - [ ] Adicionar logging estruturado

### 7.2 Retry Logic no Consumer

- [ ] **Implementar retry logic com backoff exponencial**
  - [ ] Abrir arquivo `apps/micro-pdf/src/infra/consumers/budget-created.consumer.ts`
  - [ ] Extrair `retryCount` dos headers da mensagem (`originalMsg.properties.headers['x-retry-count']`)
  - [ ] Definir constante `maxRetries = 3`
  - [ ] No bloco catch, verificar se `retryCount < maxRetries`
  - [ ] Calcular delay exponencial: `Math.pow(2, retryCount) * 1000`
  - [ ] Atualizar header `x-retry-count` incrementando o valor
  - [ ] Usar `setTimeout` para reenfileirar após delay
  - [ ] Chamar `channel.nack(originalMsg, false, true)` para reenfileirar
  - [ ] Se `retryCount >= maxRetries`, chamar `channel.nack(originalMsg, false, false)` para enviar para DLQ
  - [ ] Adicionar logging para cada tentativa

---

## Fase 8: Feedback Loop (BudgetPdfReady Event)

### 8.1 Publicação do Evento BudgetPdfReady

- [ ] **Criar RmqPublisherService no micro-pdf**
  - [ ] Criar arquivo `apps/micro-pdf/src/infra/messaging/rmq-publisher.service.ts`
  - [ ] Importar `Injectable`, `Logger` do NestJS
  - [ ] Importar `ClientProxy`, `ClientProxyFactory`, `Transport` do `@nestjs/microservices`
  - [ ] Criar classe `RmqPublisherService` com decorator `@Injectable()`
  - [ ] Inicializar `client` no construtor usando `ClientProxyFactory.create` com configuração RMQ
  - [ ] Configurar queue `budget.pdf.ready` com durable: true
  - [ ] Implementar método `publishPdfReady(budgetId, tenantId, pdfUrl)`
  - [ ] Criar objeto evento com estrutura conforme seção 3.4.1 do plano
  - [ ] Chamar `client.emit('budget.pdf.ready', event)`
  - [ ] Adicionar logging

### 8.2 Integrar Publicação no Use Case

- [ ] **Atualizar GeneratePdfUseCase para publicar evento**
  - [ ] Abrir arquivo `apps/micro-pdf/src/application/use-cases/generate-pdf.use-case.ts`
  - [ ] Importar `RmqPublisherService` de `../../infra/messaging/rmq-publisher.service`
  - [ ] Injetar `RmqPublisherService` no construtor
  - [ ] Após upload bem-sucedido, chamar `rmqPublisher.publishPdfReady(budgetId, tenantId, pdfUrl)`
  - [ ] Adicionar tratamento de erro (não falhar o use case se publicação falhar)

### 8.3 Registrar RmqPublisherService no AppModule

- [ ] **Adicionar RmqPublisherService nos providers**
  - [ ] Abrir arquivo `apps/micro-pdf/src/app.module.ts`
  - [ ] Importar `RmqPublisherService` de `./infra/messaging/rmq-publisher.service`
  - [ ] Adicionar `RmqPublisherService` no array `providers`

### 8.4 Schema do Banco - Campo pdfUrl

- [ ] **Adicionar campo pdfUrl no schema Prisma**
  - [ ] Abrir arquivo `apps/api-core/prisma/schema.prisma`
  - [ ] Localizar model `Budget`
  - [ ] Adicionar campo `pdfUrl String?` (opcional)
  - [ ] Executar migration: `npx prisma migrate dev --name add_pdf_url_to_budget`

### 8.5 Consumer BudgetPdfReady na API Core

- [ ] **Criar consumer para BudgetPdfReady**
  - [ ] Criar arquivo `apps/api-core/src/infra/consumers/budget-pdf-ready.consumer.ts`
  - [ ] Importar `Controller`, `Logger` do NestJS
  - [ ] Importar `EventPattern`, `Payload`, `Ctx`, `RmqContext` do `@nestjs/microservices`
  - [ ] Importar `PrismaService`
  - [ ] Criar classe `BudgetPdfReadyConsumer` com decorator `@Controller()`
  - [ ] Injetar `PrismaService` no construtor
  - [ ] Criar método `handlePdfReady` com decorator `@EventPattern('budget.pdf.ready')`
  - [ ] Extrair `budgetId` e `pdfUrl` do payload do evento
  - [ ] Atualizar budget usando `prisma.budget.update` com `pdfUrl`
  - [ ] Fazer `channel.ack(originalMsg)` em caso de sucesso
  - [ ] Fazer `channel.nack(originalMsg, false, false)` em caso de erro
  - [ ] Adicionar logging

### 8.6 Configurar Microservice Consumer na API Core

- [ ] **Configurar API Core para consumir eventos**
  - [ ] Abrir arquivo `apps/api-core/src/main.ts`
  - [ ] Importar `MicroserviceOptions`, `Transport` do `@nestjs/microservices`
  - [ ] Após criar app HTTP, chamar `app.connectMicroservice` com configuração RMQ
  - [ ] Configurar queue `budget.pdf.ready` com durable: true
  - [ ] Chamar `app.startAllMicroservices()` antes de `app.listen()`
  - [ ] Registrar `BudgetPdfReadyConsumer` no módulo apropriado (AppModule ou BudgetModule)

---

## Fase 9: Configuração de Ambiente e Variáveis

### 9.1 Variáveis de Ambiente - API Core

- [ ] **Configurar variáveis de ambiente**
  - [ ] Criar ou atualizar arquivo `.env.example` na raiz do projeto
  - [ ] Adicionar `RABBITMQ_URL=amqp://localhost:5672`
  - [ ] Adicionar comentários explicando cada variável
  - [ ] Documentar valores padrão

### 9.2 Variáveis de Ambiente - Micro-PDF

- [ ] **Configurar variáveis de ambiente do micro-pdf**
  - [ ] Criar arquivo `apps/micro-pdf/.env.example`
  - [ ] Adicionar `RABBITMQ_URL=amqp://localhost:5672`
  - [ ] Adicionar `S3_BUCKET_NAME=cotador-documents`
  - [ ] Adicionar `AWS_REGION=us-east-1`
  - [ ] Adicionar `AWS_ACCESS_KEY_ID=`
  - [ ] Adicionar `AWS_SECRET_ACCESS_KEY=`
  - [ ] Adicionar `S3_PUBLIC_BUCKET=false`
  - [ ] Adicionar comentários explicativos

---

## Fase 10: Testes

### 10.1 Testes Unitários - API Core

- [ ] **Testes do RabbitMQEventBus**
  - [ ] Criar arquivo `apps/api-core/src/infra/messaging/rabbitmq-event-bus.service.spec.ts`
  - [ ] Mock do `ClientProxy`
  - [ ] Testar método `publish` com sucesso
  - [ ] Testar método `publish` com erro
  - [ ] Testar método `publishAll` com múltiplos eventos
  - [ ] Testar geração de routing key

- [ ] **Testes do BudgetCreatedEvent**
  - [ ] Criar arquivo `apps/api-core/src/domain/events/budget-created.event.spec.ts`
  - [ ] Criar mock da entidade `Budget`
  - [ ] Testar método `toJSON()` retorna estrutura correta
  - [ ] Testar geração de `eventId` único
  - [ ] Testar formatação de `occurredAt` como ISO string

- [ ] **Testes do CreateBudgetUseCase**
  - [ ] Abrir ou criar arquivo `apps/api-core/src/application/use-cases/create-budget.use-case.spec.ts`
  - [ ] Mock do `IBudgetRepository`
  - [ ] Mock do `IEventBus`
  - [ ] Testar criação de budget e publicação de evento
  - [ ] Testar que evento não é publicado se save falhar
  - [ ] Testar que budget é retornado mesmo se publicação falhar

### 10.2 Testes Unitários - Micro-PDF

- [ ] **Testes do PdfGeneratorService**
  - [ ] Criar arquivo `apps/micro-pdf/src/infra/pdf/pdf-generator.service.spec.ts`
  - [ ] Mock do Puppeteer
  - [ ] Testar geração de PDF retorna Buffer
  - [ ] Testar renderização do template HTML
  - [ ] Testar tratamento de erros

- [ ] **Testes do S3StorageService**
  - [ ] Criar arquivo `apps/micro-pdf/src/infra/storage/s3-storage.service.spec.ts`
  - [ ] Mock do `S3Client`
  - [ ] Testar upload retorna URL
  - [ ] Testar geração de signed URL
  - [ ] Testar tratamento de erros

- [ ] **Testes do GeneratePdfUseCase**
  - [ ] Criar arquivo `apps/micro-pdf/src/application/use-cases/generate-pdf.use-case.spec.ts`
  - [ ] Mock do `PdfGeneratorService`
  - [ ] Mock do `IStorageService`
  - [ ] Testar orquestração de geração e upload
  - [ ] Testar tratamento de erros

### 10.3 Testes de Integração

- [ ] **Teste de integração - Fluxo completo**
  - [ ] Criar arquivo `apps/api-core/test/integration/budget-created-flow.e2e-spec.ts`
  - [ ] Configurar Testcontainers para RabbitMQ e PostgreSQL
  - [ ] Testar: criar budget → verificar evento na fila → verificar PDF gerado → verificar URL salva
  - [ ] Testar cenário de falha no RabbitMQ (outbox pattern)
  - [ ] Testar cenário de falha no storage (DLQ)

- [ ] **Teste de integração - Worker**
  - [ ] Criar arquivo `apps/micro-pdf/test/integration/pdf-generation.e2e-spec.ts`
  - [ ] Configurar Testcontainers para RabbitMQ
  - [ ] Publicar evento manualmente na fila
  - [ ] Verificar consumo e geração de PDF
  - [ ] Verificar publicação de evento BudgetPdfReady

---

## Fase 11: Documentação e Deploy

### 11.1 Dockerfile - Micro-PDF

- [ ] **Criar Dockerfile para micro-pdf**
  - [ ] Criar arquivo `apps/micro-pdf/Dockerfile`
  - [ ] Usar imagem base Node.js (ex: `node:20-alpine`)
  - [ ] Instalar dependências do sistema para Puppeteer (Chromium)
  - [ ] Copiar `package.json` e `package-lock.json`
  - [ ] Executar `npm ci --production`
  - [ ] Copiar código fonte
  - [ ] Compilar TypeScript: `npm run build`
  - [ ] Configurar comando de start: `node dist/main`
  - [ ] Adicionar healthcheck (opcional)

### 11.2 Docker Compose

- [ ] **Atualizar docker-compose.yml**
  - [ ] Abrir arquivo `docker-compose.yml` na raiz
  - [ ] Adicionar serviço `rabbitmq` se não existir
  - [ ] Adicionar serviço `micro-pdf` com build context apontando para `apps/micro-pdf`
  - [ ] Configurar variáveis de ambiente do micro-pdf
  - [ ] Configurar dependências (micro-pdf depende de rabbitmq)
  - [ ] Adicionar volume para persistência do RabbitMQ

### 11.3 Documentação

- [ ] **Atualizar README.md**
  - [ ] Abrir arquivo `README.md`
  - [ ] Adicionar seção sobre mensageria
  - [ ] Documentar como executar `scripts/setup-rabbitmq.sh`
  - [ ] Documentar variáveis de ambiente necessárias
  - [ ] Adicionar diagrama de fluxo (opcional)

- [ ] **Criar documentação de troubleshooting**
  - [ ] Criar arquivo `docs/TROUBLESHOOTING.md`
  - [ ] Documentar problemas comuns com RabbitMQ
  - [ ] Documentar como verificar DLQ
  - [ ] Documentar como debugar eventos não publicados
  - [ ] Documentar como monitorar filas

---

## Checklist de Validação Final

- [ ] **Validação de Funcionalidade**
  - [ ] Criar budget via API e verificar evento publicado no RabbitMQ Management
  - [ ] Verificar consumo do evento pelo micro-pdf
  - [ ] Verificar geração de PDF e upload para S3
  - [ ] Verificar atualização do budget com pdfUrl na API Core
  - [ ] Verificar logs estruturados em todos os serviços

- [ ] **Validação de Resiliência**
  - [ ] Testar com RabbitMQ offline (verificar outbox)
  - [ ] Testar com S3 offline (verificar DLQ)
  - [ ] Testar retry logic (simular erro temporário)
  - [ ] Verificar que mensagens vão para DLQ após max retries

- [ ] **Validação de Performance**
  - [ ] Verificar que múltiplos budgets são processados em paralelo
  - [ ] Verificar que prefetchCount está configurado corretamente
  - [ ] Monitorar uso de memória do Puppeteer

- [ ] **Validação de Segurança**
  - [ ] Verificar que credenciais não estão hardcoded
  - [ ] Verificar que PDFs são armazenados com ACL privada
  - [ ] Verificar que signed URLs têm expiração adequada

---

**Documento gerado em**: 2025-01-17  
**Baseado em**: IMPLEMENTATION_PLAN.md v1.0
