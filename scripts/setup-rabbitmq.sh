#!/bin/bash

# Script de configuração da topologia inicial do RabbitMQ
# Cria exchanges, filas e bindings necessários para o sistema de mensageria

set -e  # Exit on error

# Configurações (podem ser sobrescritas por variáveis de ambiente)
RABBITMQ_URL="${RABBITMQ_MANAGEMENT_URL:-http://localhost:15672}"
USERNAME="${RABBITMQ_USERNAME:-cotador_user}"
PASSWORD="${RABBITMQ_PASSWORD:-81Nw#I6+8an_}"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Função para verificar se o RabbitMQ está online
check_rabbitmq_health() {
    log_info "Verificando se o RabbitMQ está online..."
    
    if ! curl -s -u "${USERNAME}:${PASSWORD}" "${RABBITMQ_URL}/api/overview" > /dev/null 2>&1; then
        log_error "RabbitMQ não está acessível em ${RABBITMQ_URL}"
        log_error "Certifique-se de que o RabbitMQ está rodando e o Management Plugin está habilitado"
        exit 1
    fi
    
    log_info "RabbitMQ está online ✓"
}

# Função para verificar se exchange existe
exchange_exists() {
    local exchange_name=$1
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" -u "${USERNAME}:${PASSWORD}" \
        "${RABBITMQ_URL}/api/exchanges/%2F/${exchange_name}")
    [ "$http_code" -eq 200 ]
}

# Função para verificar se queue existe
queue_exists() {
    local queue_name=$1
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" -u "${USERNAME}:${PASSWORD}" \
        "${RABBITMQ_URL}/api/queues/%2F/${queue_name}")
    [ "$http_code" -eq 200 ]
}

# Função para criar exchange
create_exchange() {
    local exchange_name=$1
    local exchange_type=$2
    local durable=${3:-true}
    
    log_info "Criando exchange: ${exchange_name} (tipo: ${exchange_type})"
    
    local response=$(curl -s -w "\n%{http_code}" -u "${USERNAME}:${PASSWORD}" -X PUT \
        "${RABBITMQ_URL}/api/exchanges/%2F/${exchange_name}" \
        -H "Content-Type: application/json" \
        -d "{
            \"type\": \"${exchange_type}\",
            \"durable\": ${durable},
            \"auto_delete\": false
        }")
    
    local http_code=$(echo "$response" | tail -n1)
    local response_body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 201 ] || [ "$http_code" -eq 204 ]; then
        log_info "Exchange ${exchange_name} criada com sucesso ✓"
        # Aguardar um pouco para garantir que foi processada
        sleep 0.3
    elif [ "$http_code" -eq 400 ]; then
        log_warn "Exchange ${exchange_name} já existe ou dados inválidos"
        # Verificar se realmente existe
        if exchange_exists "${exchange_name}"; then
            log_info "Exchange ${exchange_name} existe e está acessível ✓"
        else
            log_error "Exchange ${exchange_name} não está acessível após criação"
            exit 1
        fi
    else
        log_error "Falha ao criar exchange ${exchange_name} (HTTP ${http_code})"
        log_error "Response: ${response_body}"
        exit 1
    fi
}

# Função para criar queue
create_queue() {
    local queue_name=$1
    local durable=${2:-true}
    local arguments=${3:-{}}
    
    log_info "Criando queue: ${queue_name}"
    
    local response=$(curl -s -w "\n%{http_code}" -u "${USERNAME}:${PASSWORD}" -X PUT \
        "${RABBITMQ_URL}/api/queues/%2F/${queue_name}" \
        -H "Content-Type: application/json" \
        -d "{
            \"durable\": ${durable},
            \"auto_delete\": false,
            \"arguments\": ${arguments}
        }")
    
    local http_code=$(echo "$response" | tail -n1)
    local response_body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 201 ] || [ "$http_code" -eq 204 ]; then
        log_info "Queue ${queue_name} criada com sucesso ✓"
        # Aguardar um pouco para garantir que foi processada
        sleep 0.3
    elif [ "$http_code" -eq 400 ]; then
        log_warn "Queue ${queue_name} já existe ou dados inválidos"
        # Verificar se realmente existe
        if queue_exists "${queue_name}"; then
            log_info "Queue ${queue_name} existe e está acessível ✓"
        else
            log_error "Queue ${queue_name} não está acessível após criação"
            exit 1
        fi
    else
        log_error "Falha ao criar queue ${queue_name} (HTTP ${http_code})"
        log_error "Response: ${response_body}"
        exit 1
    fi
}

# Função para criar binding
create_binding() {
    local exchange_name=$1
    local queue_name=$2
    local routing_key=$3
    
    log_info "Criando binding: ${exchange_name} -> ${queue_name} (routing_key: ${routing_key})"
    
    # Verificar se exchange existe
    if ! exchange_exists "${exchange_name}"; then
        log_error "Exchange '${exchange_name}' não existe. Não é possível criar binding."
        exit 1
    fi
    
    # Verificar se queue existe
    if ! queue_exists "${queue_name}"; then
        log_error "Queue '${queue_name}' não existe. Não é possível criar binding."
        exit 1
    fi
    
    # Aguardar um pouco para garantir que recursos estão prontos
    sleep 0.5
    
    local response=$(curl -s -w "\n%{http_code}" -u "${USERNAME}:${PASSWORD}" -X POST \
        "${RABBITMQ_URL}/api/bindings/%2F/e/${exchange_name}/q/${queue_name}" \
        -H "Content-Type: application/json" \
        -d "{
            \"routing_key\": \"${routing_key}\"
        }")
    
    local http_code=$(echo "$response" | tail -n1)
    local response_body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 201 ] || [ "$http_code" -eq 204 ]; then
        log_info "Binding criado com sucesso ✓"
    elif [ "$http_code" -eq 400 ]; then
        log_warn "Binding já existe ou dados inválidos (pode ser ignorado)"
    elif [ "$http_code" -eq 404 ]; then
        log_error "Falha ao criar binding: Exchange '${exchange_name}' ou Queue '${queue_name}' não encontrada"
        log_error "Response: ${response_body}"
        exit 1
    else
        log_error "Falha ao criar binding (HTTP ${http_code})"
        log_error "Response: ${response_body}"
        exit 1
    fi
}

# Verifica se o RabbitMQ está online
check_rabbitmq_health

log_info "Iniciando configuração da topologia do RabbitMQ..."

# 1. Criar Exchange principal: cotador.events (tipo: topic, durable: true)
create_exchange "cotador.events" "topic" true

# 2. Criar Dead Letter Exchange: cotador.dlx (tipo: topic, durable: true)
create_exchange "cotador.dlx" "topic" true

# 3. Criar Queue: budget.created (durable: true, com TTL de 24h e DLX configurado)
create_queue "budget.created" true '{
    "x-message-ttl": 86400000,
    "x-dead-letter-exchange": "cotador.dlx",
    "x-dead-letter-routing-key": "budget.created.dlq"
}'

# 4. Criar Queue: budget.pdf.ready (durable: true)
create_queue "budget.pdf.ready" true

# 5. Criar Dead Letter Queue: budget.created.dlq (durable: true)
create_queue "budget.created.dlq" true

# 6. Criar Bindings
# Binding: cotador.events -> budget.created (routing_key: budget.created.*)
create_binding "cotador.events" "budget.created" "budget.created.*"

# Binding: cotador.events -> budget.pdf.ready (routing_key: budget.pdf.ready.*)
create_binding "cotador.events" "budget.pdf.ready" "budget.pdf.ready.*"

# Binding: cotador.dlx -> budget.created.dlq (routing_key: budget.created.dlq)
create_binding "cotador.dlx" "budget.created.dlq" "budget.created.dlq"

log_info ""
log_info "═══════════════════════════════════════════════════════════"
log_info "  Topologia do RabbitMQ configurada com sucesso! ✓"
log_info "═══════════════════════════════════════════════════════════"
log_info ""
log_info "Exchanges criadas:"
log_info "  - cotador.events (topic, durable)"
log_info "  - cotador.dlx (topic, durable)"
log_info ""
log_info "Filas criadas:"
log_info "  - budget.created (durable, TTL: 24h, DLX configurado)"
log_info "  - budget.pdf.ready (durable)"
log_info "  - budget.created.dlq (durable)"
log_info ""
log_info "Bindings criados:"
log_info "  - cotador.events -> budget.created (routing_key: budget.created.*)"
log_info "  - cotador.events -> budget.pdf.ready (routing_key: budget.pdf.ready.*)"
log_info "  - cotador.dlx -> budget.created.dlq (routing_key: budget.created.dlq)"
log_info ""
log_info "Acesse o painel de gerenciamento em: ${RABBITMQ_URL}"
log_info ""
