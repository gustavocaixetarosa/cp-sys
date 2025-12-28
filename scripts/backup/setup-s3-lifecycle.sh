#!/bin/bash

##############################################################################
# Script para configurar Lifecycle Policy no bucket S3
# 
# Descrição:
#   - Cria ou atualiza a lifecycle policy do bucket S3
#   - Configura expiração automática de backups após 3 dias
#   - Aplica apenas aos objetos com prefixo "backups/"
#
# Uso: ./setup-s3-lifecycle.sh [bucket-name]
##############################################################################

set -euo pipefail

# Bucket S3 (pode ser passado como argumento ou via variável de ambiente)
S3_BUCKET="${1:-${S3_BACKUP_BUCKET:-cobranca-backups}}"

# Verificar se AWS CLI está instalado
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI não está instalado!"
    echo "Instale com: sudo apt-get install awscli (Ubuntu/Debian) ou brew install awscli (macOS)"
    exit 1
fi

# Verificar credenciais AWS
if [ -z "${AWS_ACCESS_KEY_ID:-}" ] || [ -z "${AWS_SECRET_ACCESS_KEY:-}" ]; then
    echo "❌ Credenciais AWS não configuradas!"
    echo "Configure AWS_ACCESS_KEY_ID e AWS_SECRET_ACCESS_KEY"
    exit 1
fi

# Verificar se o bucket existe
if ! aws s3 ls "s3://${S3_BUCKET}" &>/dev/null; then
    echo "❌ Bucket '${S3_BUCKET}' não existe ou não é acessível!"
    exit 1
fi

echo "📦 Configurando Lifecycle Policy para bucket: ${S3_BUCKET}"

# Criar arquivo JSON temporário com a lifecycle policy
LIFECYCLE_CONFIG=$(cat <<EOF
{
  "Rules": [
    {
      "ID": "DeleteBackupsAfter3Days",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "backups/"
      },
      "Expiration": {
        "Days": 3
      }
    }
  ]
}
EOF
)

# Salvar em arquivo temporário
TEMP_FILE=$(mktemp)
echo "${LIFECYCLE_CONFIG}" > "${TEMP_FILE}"

# Aplicar lifecycle policy
if aws s3api put-bucket-lifecycle-configuration \
    --bucket "${S3_BUCKET}" \
    --lifecycle-configuration "file://${TEMP_FILE}"; then
    echo "✅ Lifecycle Policy configurada com sucesso!"
    echo ""
    echo "📋 Detalhes da política:"
    echo "   - Prefixo: backups/"
    echo "   - Expiração: 3 dias"
    echo "   - Status: Habilitado"
    echo ""
    echo "Os backups serão automaticamente deletados após 3 dias."
else
    echo "❌ Falha ao configurar Lifecycle Policy!"
    rm -f "${TEMP_FILE}"
    exit 1
fi

# Limpar arquivo temporário
rm -f "${TEMP_FILE}"

# Verificar a configuração aplicada
echo ""
echo "🔍 Verificando configuração aplicada..."
aws s3api get-bucket-lifecycle-configuration --bucket "${S3_BUCKET}" 2>/dev/null || echo "⚠️  Não foi possível verificar a configuração (pode ser normal se for a primeira vez)"

echo ""
echo "✅ Configuração concluída!"

