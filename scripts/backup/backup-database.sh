#!/bin/bash

##############################################################################
# Script de Backup Automático do Banco de Dados PostgreSQL
# 
# Descrição:
#   - Faz backup do banco de dados PostgreSQL usando pg_dump
#   - Compacta o backup em .gz
#   - Mantém os últimos 7 backups locais
#   - Envia o backup para o Google Drive via rclone
#   - Registra logs de execução
#
# Uso: ./backup-database.sh
##############################################################################

set -euo pipefail  # Exit on error, undefined variables, and pipe failures

# ============================================================================
# CONFIGURAÇÕES
# ============================================================================

# Diretório base do projeto
PROJECT_DIR="/home/gustavorosa/projects/cp-sys"
BACKUP_DIR="${PROJECT_DIR}/backups"
LOG_DIR="${BACKUP_DIR}/logs"
SCRIPTS_DIR="${PROJECT_DIR}/scripts/backup"

# Criar diretórios se não existirem
mkdir -p "${BACKUP_DIR}"
mkdir -p "${LOG_DIR}"

# Arquivo de log
LOG_FILE="${LOG_DIR}/backup-$(date +%Y-%m-%d).log"

# Configurações do banco de dados
# Carregar variáveis do .env se existir
if [ -f "${PROJECT_DIR}/.env" ]; then
    source "${PROJECT_DIR}/.env"
else
    echo "⚠️  Arquivo .env não encontrado. Usando valores padrão."
    POSTGRES_DB="cobranca"
    POSTGRES_USER="gustavo"
    POSTGRES_PASSWORD="139150"
fi

# Nome do container do PostgreSQL
POSTGRES_CONTAINER="cobranca-postgres"

# Configurações de backup
BACKUP_RETENTION_DAYS=7  # Manter backups locais por 7 dias
GDRIVE_REMOTE_NAME="gdrive"  # Nome configurado no rclone
GDRIVE_BACKUP_PATH="Backups/cobranca-db"  # Pasta no Google Drive

# Data e nome do arquivo
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILENAME="cobranca_backup_${TIMESTAMP}.sql.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILENAME}"

# ============================================================================
# FUNÇÕES
# ============================================================================

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "${LOG_FILE}"
}

error() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ❌ ERROR: $*" | tee -a "${LOG_FILE}" >&2
}

success() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $*" | tee -a "${LOG_FILE}"
}

check_docker_container() {
    if ! docker ps | grep -q "${POSTGRES_CONTAINER}"; then
        error "Container PostgreSQL '${POSTGRES_CONTAINER}' não está rodando!"
        exit 1
    fi
}

check_rclone() {
    if ! command -v rclone &> /dev/null; then
        error "rclone não está instalado! Execute o script de instalação primeiro."
        exit 1
    fi
    
    if ! rclone listremotes | grep -q "^${GDRIVE_REMOTE_NAME}:"; then
        error "Remote '${GDRIVE_REMOTE_NAME}' não configurado no rclone!"
        error "Execute: rclone config"
        exit 1
    fi
}

create_backup() {
    log "🗄️  Iniciando backup do banco de dados..."
    
    # Fazer backup usando pg_dump via docker exec
    if docker exec -e PGPASSWORD="${POSTGRES_PASSWORD}" "${POSTGRES_CONTAINER}" \
        pg_dump -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" \
        --no-owner --no-acl --clean --if-exists | gzip > "${BACKUP_PATH}"; then
        
        # Verificar se o arquivo foi criado e tem tamanho > 0
        if [ -f "${BACKUP_PATH}" ] && [ -s "${BACKUP_PATH}" ]; then
            local size=$(du -h "${BACKUP_PATH}" | cut -f1)
            success "Backup criado com sucesso: ${BACKUP_FILENAME} (${size})"
            return 0
        else
            error "Backup criado mas está vazio ou não existe!"
            return 1
        fi
    else
        error "Falha ao criar backup!"
        return 1
    fi
}

upload_to_gdrive() {
    log "☁️  Enviando backup para Google Drive..."
    
    if rclone copy "${BACKUP_PATH}" "${GDRIVE_REMOTE_NAME}:${GDRIVE_BACKUP_PATH}" \
        --progress --log-level INFO 2>&1 | tee -a "${LOG_FILE}"; then
        success "Backup enviado para Google Drive: ${GDRIVE_BACKUP_PATH}/${BACKUP_FILENAME}"
        return 0
    else
        error "Falha ao enviar backup para Google Drive!"
        return 1
    fi
}

cleanup_old_backups() {
    log "🧹 Limpando backups antigos (mantendo últimos ${BACKUP_RETENTION_DAYS} dias)..."
    
    # Remover backups locais mais antigos que BACKUP_RETENTION_DAYS
    find "${BACKUP_DIR}" -name "cobranca_backup_*.sql.gz" -type f -mtime +${BACKUP_RETENTION_DAYS} -delete
    
    # Contar backups restantes
    local count=$(find "${BACKUP_DIR}" -name "cobranca_backup_*.sql.gz" -type f | wc -l)
    success "Backups locais restantes: ${count}"
    
    # Opcional: Limpar backups antigos no Google Drive (mantém últimos 30 dias)
    # Descomente se quiser habilitar
    # rclone delete "${GDRIVE_REMOTE_NAME}:${GDRIVE_BACKUP_PATH}" \
    #     --min-age 30d --rmdirs
}

cleanup_old_logs() {
    # Manter logs dos últimos 30 dias
    find "${LOG_DIR}" -name "backup-*.log" -type f -mtime +30 -delete
}

send_notification() {
    local status=$1
    local message=$2
    
    # Aqui você pode adicionar notificações via Telegram, email, etc.
    # Exemplo com telegram-send (se instalado):
    # if command -v telegram-send &> /dev/null; then
    #     telegram-send "${status}: ${message}"
    # fi
    
    log "📧 Notificação: ${status} - ${message}"
}

# ============================================================================
# EXECUÇÃO PRINCIPAL
# ============================================================================

main() {
    log "========================================="
    log "🚀 Iniciando processo de backup"
    log "========================================="
    log "Database: ${POSTGRES_DB}"
    log "Container: ${POSTGRES_CONTAINER}"
    log "Backup dir: ${BACKUP_DIR}"
    log "========================================="
    
    # Verificações
    check_docker_container
    check_rclone
    
    # Criar backup
    if ! create_backup; then
        error "Processo de backup falhou na criação do arquivo!"
        send_notification "FALHA" "Backup do banco de dados falhou"
        exit 1
    fi
    
    # Upload para Google Drive
    if ! upload_to_gdrive; then
        error "Processo de backup falhou no upload para Google Drive!"
        send_notification "PARCIAL" "Backup criado localmente mas falhou upload para Drive"
        exit 1
    fi
    
    # Limpeza
    cleanup_old_backups
    cleanup_old_logs
    
    log "========================================="
    success "🎉 Processo de backup concluído com sucesso!"
    log "========================================="
    
    send_notification "SUCESSO" "Backup do banco de dados concluído: ${BACKUP_FILENAME}"
}

# Executar função principal
main "$@"

