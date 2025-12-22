#!/bin/bash

##############################################################################
# Script de Restauração de Backup do Banco de Dados
# 
# Uso: ./restore-backup.sh [arquivo_backup.sql.gz]
# 
# Se nenhum arquivo for especificado, lista os backups disponíveis
##############################################################################

set -euo pipefail

# Diretório de backups
PROJECT_DIR="/home/gustavorosa/projects/cp-sys"
BACKUP_DIR="${PROJECT_DIR}/backups"

# Configurações do banco
if [ -f "${PROJECT_DIR}/.env" ]; then
    source "${PROJECT_DIR}/.env"
else
    POSTGRES_DB="cobranca"
    POSTGRES_USER="gustavo"
    POSTGRES_PASSWORD="139150"
fi

POSTGRES_CONTAINER="cobranca-postgres"

# ============================================================================
# FUNÇÕES
# ============================================================================

list_local_backups() {
    echo "========================================="
    echo "📦 Backups Locais Disponíveis"
    echo "========================================="
    echo ""
    
    local backups=($(find "${BACKUP_DIR}" -name "cobranca_backup_*.sql.gz" -type f | sort -r))
    
    if [ ${#backups[@]} -eq 0 ]; then
        echo "❌ Nenhum backup local encontrado em: ${BACKUP_DIR}"
        return 1
    fi
    
    local i=1
    for backup in "${backups[@]}"; do
        local filename=$(basename "$backup")
        local size=$(du -h "$backup" | cut -f1)
        local date=$(stat -c %y "$backup" | cut -d' ' -f1,2 | cut -d'.' -f1)
        echo "  [$i] $filename"
        echo "      Tamanho: $size | Data: $date"
        echo ""
        ((i++))
    done
    
    return 0
}

list_gdrive_backups() {
    echo "========================================="
    echo "☁️  Backups no Google Drive"
    echo "========================================="
    echo ""
    
    if ! command -v rclone &> /dev/null; then
        echo "⚠️  rclone não está instalado"
        return 1
    fi
    
    if ! rclone listremotes | grep -q "^gdrive:"; then
        echo "⚠️  Google Drive não está configurado"
        return 1
    fi
    
    echo "Listando backups no Drive..."
    rclone ls gdrive:Backups/cobranca-db | grep "\.sql\.gz$" | sort -r | head -n 10
    echo ""
}

download_from_gdrive() {
    local filename=$1
    
    echo "📥 Baixando backup do Google Drive..."
    
    if rclone copy "gdrive:Backups/cobranca-db/${filename}" "${BACKUP_DIR}" --progress; then
        echo "✅ Backup baixado: ${BACKUP_DIR}/${filename}"
        return 0
    else
        echo "❌ Falha ao baixar backup do Google Drive"
        return 1
    fi
}

confirm_restore() {
    echo ""
    echo "⚠️  ATENÇÃO: Esta operação irá SUBSTITUIR o banco de dados atual!"
    echo ""
    read -p "Tem certeza que deseja restaurar este backup? Digite 'CONFIRMAR': " confirm
    
    if [ "$confirm" != "CONFIRMAR" ]; then
        echo "❌ Operação cancelada."
        exit 0
    fi
}

backup_current_db() {
    echo ""
    echo "📦 Criando backup do banco atual antes da restauração..."
    
    local timestamp=$(date +%Y-%m-%d_%H-%M-%S)
    local pre_restore_backup="${BACKUP_DIR}/pre_restore_${timestamp}.sql.gz"
    
    if docker exec -e PGPASSWORD="${POSTGRES_PASSWORD}" "${POSTGRES_CONTAINER}" \
        pg_dump -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" \
        --no-owner --no-acl | gzip > "${pre_restore_backup}"; then
        echo "✅ Backup de segurança criado: $(basename ${pre_restore_backup})"
    else
        echo "⚠️  Falha ao criar backup de segurança!"
        read -p "Continuar mesmo assim? [s/N]: " continue_choice
        if [[ ! "$continue_choice" =~ ^[Ss]$ ]]; then
            exit 1
        fi
    fi
}

restore_backup() {
    local backup_file=$1
    
    echo ""
    echo "🔄 Restaurando backup..."
    echo "   Arquivo: $(basename ${backup_file})"
    echo ""
    
    # Descompactar e restaurar
    if gunzip -c "${backup_file}" | docker exec -i -e PGPASSWORD="${POSTGRES_PASSWORD}" \
        "${POSTGRES_CONTAINER}" psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" > /dev/null 2>&1; then
        echo "✅ Backup restaurado com sucesso!"
        return 0
    else
        echo "❌ Falha ao restaurar backup!"
        return 1
    fi
}

# ============================================================================
# MENU INTERATIVO
# ============================================================================

interactive_mode() {
    echo "========================================="
    echo "🔄 Restauração de Backup - Modo Interativo"
    echo "========================================="
    echo ""
    
    # Listar backups disponíveis
    list_local_backups
    
    echo ""
    echo "Opções:"
    echo "  1) Restaurar um backup local"
    echo "  2) Baixar e restaurar do Google Drive"
    echo "  3) Cancelar"
    echo ""
    read -p "Escolha uma opção [1-3]: " choice
    
    case $choice in
        1)
            # Selecionar backup local
            local backups=($(find "${BACKUP_DIR}" -name "cobranca_backup_*.sql.gz" -type f | sort -r))
            
            if [ ${#backups[@]} -eq 0 ]; then
                echo "❌ Nenhum backup disponível"
                exit 1
            fi
            
            echo ""
            read -p "Digite o número do backup [1-${#backups[@]}]: " backup_num
            
            if [ "$backup_num" -ge 1 ] && [ "$backup_num" -le ${#backups[@]} ]; then
                local selected_backup="${backups[$((backup_num-1))]}"
                
                confirm_restore
                backup_current_db
                restore_backup "$selected_backup"
            else
                echo "❌ Número inválido"
                exit 1
            fi
            ;;
        2)
            # Google Drive
            list_gdrive_backups
            echo ""
            read -p "Digite o nome completo do arquivo: " gdrive_filename
            
            if download_from_gdrive "$gdrive_filename"; then
                local downloaded_file="${BACKUP_DIR}/${gdrive_filename}"
                confirm_restore
                backup_current_db
                restore_backup "$downloaded_file"
            else
                echo "❌ Falha ao baixar do Google Drive"
                exit 1
            fi
            ;;
        3)
            echo "❌ Operação cancelada"
            exit 0
            ;;
        *)
            echo "❌ Opção inválida"
            exit 1
            ;;
    esac
}

# ============================================================================
# EXECUÇÃO PRINCIPAL
# ============================================================================

main() {
    # Verificar se container está rodando
    if ! docker ps | grep -q "${POSTGRES_CONTAINER}"; then
        echo "❌ Container PostgreSQL '${POSTGRES_CONTAINER}' não está rodando!"
        exit 1
    fi
    
    # Se arquivo foi passado como argumento
    if [ $# -eq 1 ]; then
        local backup_file=$1
        
        if [ ! -f "$backup_file" ]; then
            echo "❌ Arquivo não encontrado: $backup_file"
            exit 1
        fi
        
        echo "Arquivo de backup: $(basename ${backup_file})"
        confirm_restore
        backup_current_db
        restore_backup "$backup_file"
    else
        # Modo interativo
        interactive_mode
    fi
    
    echo ""
    echo "========================================="
    echo "✅ Processo concluído!"
    echo "========================================="
}

main "$@"

