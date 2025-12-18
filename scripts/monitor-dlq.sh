#!/bin/bash

# Script de monitoramento da Dead Letter Queue (DLQ) do RabbitMQ
# Verifica o tamanho da DLQ e emite alerta se houver mais de 10 mensagens

set -e  # Exit on error

# Configurações (podem ser sobrescritas por variáveis de ambiente)
RABBITMQ_URL="${RABBITMQ_MANAGEMENT_URL:-http://localhost:15672}"
USERNAME="${RABBITMQ_USERNAME:-cotador_user}"
PASSWORD="${RABBITMQ_PASSWORD:-81Nw#I6+8an_}"
DLQ_NAME="${DLQ_NAME:-budget.created.dlq}"
ALERT_THRESHOLD="${ALERT_THRESHOLD:-10}"

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

log_alert() {
    echo -e "${RED}[ALERT]${NC} $1"
}

# Função para verificar se o RabbitMQ está online
check_rabbitmq_health() {
    if ! curl -s -u "${USERNAME}:${PASSWORD}" "${RABBITMQ_URL}/api/overview" > /dev/null 2>&1; then
        log_error "RabbitMQ não está acessível em ${RABBITMQ_URL}"
        log_error "Certifique-se de que o RabbitMQ está rodando e o Management Plugin está habilitado"
        exit 1
    fi
}

# Função para obter o tamanho da DLQ
get_dlq_size() {
    local queue_name=$1
    local response=$(curl -s -u "${USERNAME}:${PASSWORD}" \
        "${RABBITMQ_URL}/api/queues/%2F/${queue_name}")
    
    if [ $? -ne 0 ]; then
        log_error "Falha ao consultar queue ${queue_name}"
        return 1
    fi
    
    # Verificar se a resposta contém erro
    if echo "$response" | grep -q '"error"'; then
        log_error "Erro ao consultar queue ${queue_name}"
        if [ "$USE_JQ" = true ]; then
            echo "$response" | jq -r '.reason // "Unknown error"'
        else
            echo "$response" | grep -o '"reason":"[^"]*"' | sed 's/"reason":"\(.*\)"/\1/'
        fi
        return 1
    fi
    
    # Extrair o número de mensagens
    local messages
    if [ "$USE_JQ" = true ]; then
        # Usar jq para parsing mais robusto
        messages=$(echo "$response" | jq -r '.messages // .messages_ready // 0')
    else
        # Fallback: usar grep/sed
        messages=$(echo "$response" | grep -o '"messages":[0-9]*' | grep -o '[0-9]*')
        if [ -z "$messages" ]; then
            messages=$(echo "$response" | grep -o '"messages_ready":[0-9]*' | grep -o '[0-9]*')
        fi
        if [ -z "$messages" ]; then
            messages=0
        fi
    fi
    
    echo "$messages"
}

# Função principal de monitoramento
monitor_dlq() {
    log_info "Monitorando DLQ: ${DLQ_NAME}"
    log_info "Threshold de alerta: ${ALERT_THRESHOLD} mensagens"
    
    # Verificar se o RabbitMQ está online
    check_rabbitmq_health
    
    # Obter tamanho da DLQ
    local dlq_size=$(get_dlq_size "${DLQ_NAME}")
    
    if [ $? -ne 0 ]; then
        log_error "Falha ao obter tamanho da DLQ"
        exit 1
    fi
    
    log_info "Tamanho atual da DLQ: ${dlq_size} mensagens"
    
    # Verificar se excede o threshold
    if [ "$dlq_size" -gt "$ALERT_THRESHOLD" ]; then
        log_alert "═══════════════════════════════════════════════════════════"
        log_alert "  ALERTA: DLQ excedeu o threshold!"
        log_alert "═══════════════════════════════════════════════════════════"
        log_alert "Queue: ${DLQ_NAME}"
        log_alert "Mensagens na DLQ: ${dlq_size}"
        log_alert "Threshold configurado: ${ALERT_THRESHOLD}"
        log_alert "Excesso: $((dlq_size - ALERT_THRESHOLD)) mensagens"
        log_alert ""
        log_alert "Ação recomendada:"
        log_alert "  1. Verificar logs dos consumidores para identificar erros"
        log_alert "  2. Investigar mensagens na DLQ via painel: ${RABBITMQ_URL}"
        log_alert "  3. Corrigir problemas identificados e reprocessar mensagens se necessário"
        log_alert "═══════════════════════════════════════════════════════════"
        
        # Exit code 1 para indicar alerta (útil para integração com sistemas de monitoramento)
        exit 1
    else
        log_info "DLQ está dentro do limite aceitável ✓"
        exit 0
    fi
}

# Verificar se jq está disponível (opcional, para parsing mais robusto)
if command -v jq &> /dev/null; then
    USE_JQ=true
else
    USE_JQ=false
fi

# Executar monitoramento
monitor_dlq
