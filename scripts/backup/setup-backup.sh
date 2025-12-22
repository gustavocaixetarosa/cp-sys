#!/bin/bash

##############################################################################
# Script de Configuração do Sistema de Backup
# 
# Este script instala e configura todas as dependências necessárias
# para o sistema de backup automático do banco de dados
##############################################################################

set -euo pipefail

echo "========================================="
echo "🔧 Configuração do Sistema de Backup"
echo "========================================="
echo ""

# ============================================================================
# INSTALAÇÃO DO RCLONE
# ============================================================================

install_rclone() {
    echo "📦 Verificando instalação do rclone..."
    
    if command -v rclone &> /dev/null; then
        echo "✅ rclone já está instalado: $(rclone version | head -n1)"
    else
        echo "⚙️  Instalando rclone..."
        curl https://rclone.org/install.sh | sudo bash
        echo "✅ rclone instalado com sucesso!"
    fi
    echo ""
}

# ============================================================================
# CONFIGURAÇÃO DO RCLONE PARA GOOGLE DRIVE
# ============================================================================

configure_rclone() {
    echo "========================================="
    echo "🔐 Configuração do Google Drive"
    echo "========================================="
    echo ""
    echo "Você precisa configurar o rclone para acessar seu Google Drive."
    echo ""
    echo "Passos:"
    echo "  1. Digite 'n' para criar um novo remote"
    echo "  2. Nome do remote: gdrive"
    echo "  3. Tipo de storage: escolha 'drive' (Google Drive)"
    echo "  4. Client ID e Secret: deixe em branco (usar padrão)"
    echo "  5. Scope: escolha '1' (acesso completo)"
    echo "  6. Root folder: deixe em branco"
    echo "  7. Service account: deixe em branco"
    echo "  8. Advanced config: n"
    echo "  9. Auto config: y (se estiver em desktop com navegador)"
    echo "                  n (se estiver em servidor sem interface)"
    echo " 10. Configure como team drive: n"
    echo " 11. Confirme: y"
    echo ""
    read -p "Pressione ENTER para abrir a configuração do rclone..."
    
    rclone config
    
    echo ""
    echo "✅ Configuração do rclone concluída!"
    echo ""
}

test_rclone() {
    echo "🧪 Testando conexão com Google Drive..."
    
    if rclone lsd gdrive: &> /dev/null; then
        echo "✅ Conexão com Google Drive OK!"
        
        # Criar pasta de backup se não existir
        echo "📁 Criando pasta de backups no Google Drive..."
        rclone mkdir gdrive:Backups/cobranca-db
        echo "✅ Pasta criada: Backups/cobranca-db"
    else
        echo "❌ Falha ao conectar com Google Drive!"
        echo "   Verifique a configuração do rclone."
        exit 1
    fi
    echo ""
}

# ============================================================================
# CONFIGURAÇÃO DO CRON JOB
# ============================================================================

setup_cron() {
    echo "========================================="
    echo "⏰ Configuração do Cron Job"
    echo "========================================="
    echo ""
    
    local script_path="/home/gustavorosa/projects/cp-sys/scripts/backup/backup-database.sh"
    
    # Tornar script executável
    chmod +x "${script_path}"
    
    echo "Escolha o horário para o backup diário:"
    echo "  1) 02:00 (Recomendado - madrugada)"
    echo "  2) 03:00"
    echo "  3) 04:00"
    echo "  4) 23:00 (final do dia)"
    echo "  5) Personalizado"
    echo ""
    read -p "Opção [1-5]: " choice
    
    case $choice in
        1) cron_time="0 2 * * *" ;;
        2) cron_time="0 3 * * *" ;;
        3) cron_time="0 4 * * *" ;;
        4) cron_time="0 23 * * *" ;;
        5) 
            read -p "Digite a hora (0-23): " hour
            read -p "Digite o minuto (0-59): " minute
            cron_time="${minute} ${hour} * * *"
            ;;
        *) 
            echo "Opção inválida. Usando 02:00 (padrão)"
            cron_time="0 2 * * *"
            ;;
    esac
    
    local cron_job="${cron_time} ${script_path} >> /home/gustavorosa/projects/cp-sys/backups/logs/cron.log 2>&1"
    
    # Verificar se já existe
    if crontab -l 2>/dev/null | grep -q "${script_path}"; then
        echo "⚠️  Cron job já existe. Removendo antiga..."
        crontab -l 2>/dev/null | grep -v "${script_path}" | crontab -
    fi
    
    # Adicionar novo cron job
    (crontab -l 2>/dev/null; echo "${cron_job}") | crontab -
    
    echo "✅ Cron job configurado com sucesso!"
    echo "   Horário: ${cron_time}"
    echo "   Script: ${script_path}"
    echo ""
    echo "Para verificar: crontab -l"
    echo "Para editar:    crontab -e"
    echo "Para remover:   crontab -r"
    echo ""
}

# ============================================================================
# TESTE DO BACKUP
# ============================================================================

test_backup() {
    echo "========================================="
    echo "🧪 Teste do Sistema de Backup"
    echo "========================================="
    echo ""
    read -p "Deseja executar um backup de teste agora? [s/N]: " test_choice
    
    if [[ "$test_choice" =~ ^[Ss]$ ]]; then
        echo ""
        echo "Executando backup de teste..."
        echo ""
        /home/gustavorosa/projects/cp-sys/scripts/backup/backup-database.sh
    else
        echo "⏭️  Teste ignorado."
    fi
    echo ""
}

# ============================================================================
# RESUMO FINAL
# ============================================================================

show_summary() {
    echo "========================================="
    echo "✅ Configuração Concluída!"
    echo "========================================="
    echo ""
    echo "📋 Resumo:"
    echo "  • rclone instalado e configurado"
    echo "  • Backup automático agendado no cron"
    echo "  • Backups serão salvos em: ~/projects/cp-sys/backups/"
    echo "  • Backups serão enviados para: Google Drive > Backups/cobranca-db"
    echo "  • Retenção local: 7 dias"
    echo ""
    echo "📝 Comandos úteis:"
    echo "  • Executar backup manual:"
    echo "    ~/projects/cp-sys/scripts/backup/backup-database.sh"
    echo ""
    echo "  • Ver logs:"
    echo "    tail -f ~/projects/cp-sys/backups/logs/backup-*.log"
    echo ""
    echo "  • Listar backups no Drive:"
    echo "    rclone ls gdrive:Backups/cobranca-db"
    echo ""
    echo "  • Ver configuração do cron:"
    echo "    crontab -l"
    echo ""
    echo "========================================="
}

# ============================================================================
# EXECUÇÃO PRINCIPAL
# ============================================================================

main() {
    # Verificar se está rodando como usuário correto (não root)
    if [ "$EUID" -eq 0 ]; then 
        echo "❌ Não execute este script como root!"
        echo "   Execute como usuário normal (gustavorosa)"
        exit 1
    fi
    
    install_rclone
    
    # Verificar se rclone já está configurado
    if ! rclone listremotes | grep -q "^gdrive:"; then
        configure_rclone
    else
        echo "✅ rclone já está configurado com remote 'gdrive'"
        echo ""
    fi
    
    test_rclone
    setup_cron
    test_backup
    show_summary
}

main "$@"

