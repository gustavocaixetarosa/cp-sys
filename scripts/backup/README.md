# 🗄️ Sistema de Backup Automático do Banco de Dados

Sistema completo de backup automático do PostgreSQL com envio para AWS S3.

## 📋 Características

- ✅ Backup automático diário do banco de dados PostgreSQL
- ✅ Compactação dos backups (.sql.gz)
- ✅ Upload automático para AWS S3
- ✅ Lifecycle Policy: backups expiram automaticamente após 3 dias no S3
- ✅ Retenção de backups locais por 3 dias
- ✅ Logs detalhados de execução
- ✅ Script de restauração interativo
- ✅ Notificações de status (configurável)

## 🚀 Instalação

### 1. Pré-requisitos

**Instalar AWS CLI:**

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install awscli

# macOS
brew install awscli

# Ou via pip
pip install awscli
```

**Configurar credenciais AWS:**

Adicione as seguintes variáveis ao arquivo `.env` na raiz do projeto:

```bash
# AWS S3 Backup Config
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_DEFAULT_REGION=us-east-1
S3_BACKUP_BUCKET=cobranca-backups
```

### 2. Criar Bucket S3

Crie um bucket S3 na AWS Console ou via CLI:

```bash
aws s3 mb s3://cobranca-backups --region us-east-1
```

### 3. Configurar Lifecycle Policy

Execute o script para configurar a expiração automática após 3 dias:

```bash
cd /home/gustavorosa/projects/cp-sys/scripts/backup
chmod +x setup-s3-lifecycle.sh
./setup-s3-lifecycle.sh [nome-do-bucket]
```

Este script configura automaticamente a política de lifecycle para deletar backups após 3 dias.

### 4. Configurar Cron Job

Adicione o backup ao crontab para execução diária:

```bash
crontab -e
```

Adicione a linha (executa diariamente às 01:00):

```bash
0 1 * * * /home/gustavorosa/projects/cp-sys/scripts/backup/backup-database.sh >> /home/gustavorosa/projects/cp-sys/backups/logs/cron.log 2>&1
```

### 5. Testar Backup Manual

Execute um backup de teste:

```bash
cd /home/gustavorosa/projects/cp-sys/scripts/backup
./backup-database.sh
```

## 📁 Estrutura de Arquivos

```
cp-sys/
├── scripts/backup/
│   ├── backup-database.sh      # Script principal de backup
│   ├── setup-s3-lifecycle.sh   # Script para configurar lifecycle no S3
│   ├── restore-backup.sh       # Script de restauração
│   └── README.md               # Esta documentação
├── backups/                    # Backups locais (retenção: 3 dias)
│   ├── cobranca_backup_*.sql.gz
│   └── logs/                   # Logs de execução
│       ├── backup-*.log
│       └── cron.log
└── .env                        # Variáveis de ambiente (inclui credenciais AWS)
```

## 🔧 Uso

### Backup Manual

Execute um backup manualmente:

```bash
cd /home/gustavorosa/projects/cp-sys/scripts/backup
./backup-database.sh
```

### Verificar Logs

Ver o log do último backup:

```bash
tail -f ~/projects/cp-sys/backups/logs/backup-$(date +%Y-%m-%d).log
```

Ver log do cron:

```bash
tail -f ~/projects/cp-sys/backups/logs/cron.log
```

### Listar Backups

**Backups locais:**

```bash
ls -lh ~/projects/cp-sys/backups/cobranca_backup_*.sql.gz
```

**Backups no S3:**

```bash
aws s3 ls s3://cobranca-backups/backups/
```

### Restaurar Backup

**Modo interativo (recomendado):**

```bash
cd /home/gustavorosa/projects/cp-sys/scripts/backup
./restore-backup.sh
```

**Restaurar arquivo específico:**

```bash
./restore-backup.sh ~/projects/cp-sys/backups/cobranca_backup_2025-12-22_02-00-00.sql.gz
```

> ⚠️ **ATENÇÃO:** A restauração substitui completamente o banco de dados atual!
> Um backup de segurança é criado automaticamente antes da restauração.

### Baixar Backup do S3

```bash
aws s3 cp s3://cobranca-backups/backups/cobranca_backup_2025-12-22_02-00-00.sql.gz ~/projects/cp-sys/backups/
```

## ⏰ Agendamento (Cron)

O backup é executado automaticamente pelo cron. Para verificar:

```bash
# Ver configuração atual
crontab -l

# Editar configuração
crontab -e

# Exemplo de entrada do cron (2h da manhã, diariamente):
# 0 2 * * * /home/gustavorosa/projects/cp-sys/scripts/backup/backup-database.sh >> /home/gustavorosa/projects/cp-sys/backups/logs/cron.log 2>&1
```

### Alterar Horário do Backup

```bash
crontab -e
```

Sintaxe do cron:

```
┌───────────── minuto (0 - 59)
│ ┌───────────── hora (0 - 23)
│ │ ┌───────────── dia do mês (1 - 31)
│ │ │ ┌───────────── mês (1 - 12)
│ │ │ │ ┌───────────── dia da semana (0 - 6) (Domingo=0)
│ │ │ │ │
│ │ │ │ │
* * * * * comando a ser executado
```

Exemplos:
- `0 2 * * *` - Todos os dias às 2h
- `30 3 * * *` - Todos os dias às 3h30
- `0 */6 * * *` - A cada 6 horas
- `0 2 * * 0` - Apenas aos domingos às 2h

## 🔐 Segurança

### Credenciais do Banco de Dados

As credenciais são carregadas do arquivo `.env` na raiz do projeto:

```env
POSTGRES_DB=cobranca
POSTGRES_USER=gustavo
POSTGRES_PASSWORD=sua_senha_aqui
```

> ⚠️ **IMPORTANTE:** Nunca commite o arquivo `.env` no git!

### Permissões dos Scripts

Os scripts devem ter permissão de execução apenas para o proprietário:

```bash
chmod 700 scripts/backup/*.sh
```

### AWS S3

- Os backups são armazenados no bucket S3 configurado
- Lifecycle Policy deleta automaticamente backups após 3 dias
- Recomenda-se:
  - Usar IAM User com permissões mínimas necessárias
  - Habilitar versionamento do bucket (opcional)
  - Configurar criptografia no bucket (opcional)
  - Usar bucket em região próxima ao servidor para reduzir latência

## 📊 Monitoramento

### Verificar se o Backup Está Funcionando

**1. Verificar último backup local:**

```bash
ls -lth ~/projects/cp-sys/backups/cobranca_backup_*.sql.gz | head -n 1
```

**2. Verificar último backup no S3:**

```bash
aws s3 ls s3://cobranca-backups/backups/ --recursive | tail -n 1
```

**3. Verificar logs de hoje:**

```bash
cat ~/projects/cp-sys/backups/logs/backup-$(date +%Y-%m-%d).log
```

### Notificações (Opcional)

Para receber notificações de status do backup, você pode integrar com:

**Telegram:**

1. Instale o telegram-send:
   ```bash
   pip install telegram-send
   telegram-send --configure
   ```

2. Descomente as linhas de notificação no `backup-database.sh`

**Email:**

Configure o sendmail ou use um serviço SMTP.

## 🔧 Configurações Avançadas

### Alterar Retenção de Backups Locais

Edite o arquivo `backup-database.sh`:

```bash
# Linha 50
BACKUP_RETENTION_DAYS=3  # Alterar para o número de dias desejado
```

**Nota:** A retenção no S3 é controlada pela Lifecycle Policy (3 dias). Para alterar, execute novamente o `setup-s3-lifecycle.sh` ou configure manualmente no AWS Console.

### Alterar Bucket ou Prefixo S3

Edite o arquivo `backup-database.sh` ou configure via variáveis de ambiente no `.env`:

```bash
# No .env
S3_BACKUP_BUCKET=meu-bucket-personalizado
```

No script, o prefixo pode ser alterado:

```bash
# Linha 52
S3_BACKUP_PATH="backups"  # Alterar para o prefixo desejado
```

### Comprimir Mais os Backups

Para usar compressão máxima (mais lento, mas menor):

```bash
# Alterar linha do pg_dump em backup-database.sh:
gzip -9 > "${BACKUP_PATH}"  # -9 = compressão máxima
```

## 🐛 Solução de Problemas

### Backup não está sendo executado

1. Verificar se o cron está ativo:
   ```bash
   sudo systemctl status cron
   ```

2. Verificar logs do cron:
   ```bash
   tail -f /var/log/syslog | grep CRON
   ```

3. Testar manualmente:
   ```bash
   ./backup-database.sh
   ```

### Erro de conexão com AWS S3

1. Verificar credenciais AWS:
   ```bash
   aws configure list
   ```

2. Testar acesso ao bucket:
   ```bash
   aws s3 ls s3://cobranca-backups/
   ```

3. Verificar permissões IAM:
   - O usuário precisa ter permissões: `s3:PutObject`, `s3:GetObject`, `s3:ListBucket`

### Backup muito grande

Se os backups estão ocupando muito espaço:

1. Verificar tamanho do banco:
   ```bash
   docker exec cobranca-postgres psql -U gustavo -d cobranca -c "SELECT pg_size_pretty(pg_database_size('cobranca'));"
   ```

2. Limpar dados antigos se necessário

3. Ajustar compressão (ver Configurações Avançadas)

### Container PostgreSQL não encontrado

Verificar se o container está rodando:

```bash
docker ps | grep postgres
```

Iniciar containers:

```bash
cd /home/gustavorosa/projects/cp-sys
docker-compose up -d
```

## 📝 Comandos Úteis

```bash
# Backup manual
./backup-database.sh

# Restaurar backup (interativo)
./restore-backup.sh

# Listar backups no S3
aws s3 ls s3://cobranca-backups/backups/

# Baixar backup específico do S3
aws s3 cp s3://cobranca-backups/backups/arquivo.sql.gz ./

# Verificar espaço usado no S3
aws s3 ls s3://cobranca-backups/backups/ --recursive --summarize

# Limpar backups locais antigos manualmente
find ~/projects/cp-sys/backups -name "cobranca_backup_*.sql.gz" -mtime +3 -delete

# Verificar configuração AWS
aws configure list

# Testar acesso ao bucket
aws s3 ls s3://cobranca-backups/

# Configurar lifecycle policy
./setup-s3-lifecycle.sh
```

## 📚 Referências

- [PostgreSQL pg_dump Documentation](https://www.postgresql.org/docs/current/app-pgdump.html)
- [AWS CLI Documentation](https://docs.aws.amazon.com/cli/latest/userguide/)
- [AWS S3 Lifecycle Policies](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html)
- [Cron Schedule Examples](https://crontab.guru/)

## 🆘 Suporte

Em caso de problemas:

1. Verifique os logs em `~/projects/cp-sys/backups/logs/`
2. Execute o backup manualmente para ver erros em tempo real
3. Verifique se o container PostgreSQL está rodando
4. Verifique a conexão com AWS S3: `aws s3 ls s3://cobranca-backups/`

---

**Última atualização:** 2025-12-22

