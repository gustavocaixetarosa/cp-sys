#!/bin/bash

##############################################################################
# Script de Backup Automático do Banco de Dados PostgreSQL
# 
# Descrição:
#   - Faz backup do banco de dados PostgreSQL usando pg_dump
#   - Compacta o backup em .gz
#   - Mantém os últimos 3 backups locais
#   - Envia o backup para AWS S3
#   - S3 Lifecycle Policy deleta automaticamente backups após 3 dias
#   - Registra logs de execução
#
# Pré-requisitos:
#   - AWS CLI instalado e configurado
#   - Variáveis de ambiente AWS configuradas no .env
#   - Bucket S3 criado com lifecycle policy de 3 dias
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
BACKUP_RETENTION_DAYS=3  # Manter backups locais por 3 dias
S3_BACKUP_BUCKET="${S3_BACKUP_BUCKET:-cobranca-backups}"  # Bucket S3 (pode ser definido no .env)
S3_BACKUP_PATH="backups"  # Prefixo/pasta no S3

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

check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        error "AWS CLI não está instalado!"
        error "Instale com: sudo apt-get install awscli (Ubuntu/Debian) ou brew install awscli (macOS)"
        exit 1
    fi
    
    # Verificar se as credenciais AWS estão configuradas
    if [ -z "${AWS_ACCESS_KEY_ID:-}" ] || [ -z "${AWS_SECRET_ACCESS_KEY:-}" ]; then
        error "Credenciais AWS não configuradas!"
        error "Configure AWS_ACCESS_KEY_ID e AWS_SECRET_ACCESS_KEY no arquivo .env"
        exit 1
    fi
    
    # Verificar se o bucket existe e é acessível
    if ! aws s3 ls "s3://${S3_BACKUP_BUCKET}" &>/dev/null; then
        error "Bucket S3 '${S3_BACKUP_BUCKET}' não existe ou não é acessível!"
        error "Verifique as credenciais e permissões AWS"
        exit 1
    fi
    
    success "AWS CLI configurado corretamente"
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

upload_to_s3() {
    log "☁️  Enviando backup para AWS S3..."
    
    local s3_key="${S3_BACKUP_PATH}/${BACKUP_FILENAME}"
    
    if aws s3 cp "${BACKUP_PATH}" "s3://${S3_BACKUP_BUCKET}/${s3_key}" \
        --storage-class STANDARD_IA \
        2>&1 | tee -a "${LOG_FILE}"; then
        success "Backup enviado para S3: s3://${S3_BACKUP_BUCKET}/${s3_key}"
        
        # Verificar se o arquivo foi realmente enviado
        if aws s3 ls "s3://${S3_BACKUP_BUCKET}/${s3_key}" &>/dev/null; then
            local s3_size=$(aws s3 ls "s3://${S3_BACKUP_BUCKET}/${s3_key}" | awk '{print $3}')
            success "Backup confirmado no S3 (${s3_size} bytes)"
            return 0
        else
            error "Backup não encontrado no S3 após upload!"
            return 1
        fi
    else
        error "Falha ao enviar backup para S3!"
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
    check_aws_cli
    
    # Criar backup
    if ! create_backup; then
        error "Processo de backup falhou na criação do arquivo!"
        send_notification "FALHA" "Backup do banco de dados falhou"
        exit 1
    fi
    
    # Upload para S3
    if ! upload_to_s3; then
        error "Processo de backup falhou no upload para S3!"
        send_notification "PARCIAL" "Backup criado localmente mas falhou upload para S3"
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

