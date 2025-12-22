# 🗄️ Sistema de Backup Automático do Banco de Dados

Sistema completo de backup automático do PostgreSQL com envio para Google Drive.

## 📋 Características

- ✅ Backup automático diário do banco de dados PostgreSQL
- ✅ Compactação dos backups (.sql.gz)
- ✅ Upload automático para Google Drive
- ✅ Retenção configurável de backups locais (padrão: 7 dias)
- ✅ Logs detalhados de execução
- ✅ Script de restauração interativo
- ✅ Notificações de status (configurável)

## 🚀 Instalação

### 1. Executar o script de configuração

```bash
cd /home/gustavorosa/projects/cp-sys/scripts/backup
chmod +x setup-backup.sh
./setup-backup.sh
```

Este script irá:
- Instalar o rclone (se necessário)
- Configurar a conexão com Google Drive
- Criar o cron job para backup diário
- Executar um backup de teste

### 2. Configuração do Google Drive

Durante a instalação, você precisará autenticar com sua conta Google:

**Se estiver em um desktop (com navegador):**
- Escolha "y" para auto config
- Uma janela do navegador será aberta
- Faça login com sua conta Google
- Autorize o acesso

**Se estiver em um servidor (sem navegador):**
- Escolha "n" para auto config
- Copie a URL fornecida
- Abra em um navegador no seu computador
- Faça login e autorize
- Cole o código de autorização no terminal

## 📁 Estrutura de Arquivos

```
cp-sys/
├── scripts/backup/
│   ├── backup-database.sh    # Script principal de backup
│   ├── setup-backup.sh       # Script de instalação
│   ├── restore-backup.sh     # Script de restauração
│   └── README.md             # Esta documentação
├── backups/                  # Backups locais
│   ├── cobranca_backup_*.sql.gz
│   └── logs/                 # Logs de execução
│       ├── backup-*.log
│       └── cron.log
└── .env                      # Variáveis de ambiente
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

**Backups no Google Drive:**

```bash
rclone ls gdrive:Backups/cobranca-db
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

### Baixar Backup do Google Drive

```bash
rclone copy gdrive:Backups/cobranca-db/cobranca_backup_2025-12-22_02-00-00.sql.gz ~/projects/cp-sys/backups/
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

### Google Drive

- Os backups são armazenados na pasta `Backups/cobranca-db` do seu Google Drive
- Apenas você tem acesso aos arquivos
- Recomenda-se ativar autenticação de dois fatores na conta Google

## 📊 Monitoramento

### Verificar se o Backup Está Funcionando

**1. Verificar último backup local:**

```bash
ls -lth ~/projects/cp-sys/backups/cobranca_backup_*.sql.gz | head -n 1
```

**2. Verificar último backup no Google Drive:**

```bash
rclone ls gdrive:Backups/cobranca-db --max-age 24h
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

### Alterar Retenção de Backups

Edite o arquivo `backup-database.sh`:

```bash
# Linha 50
BACKUP_RETENTION_DAYS=7  # Alterar para o número de dias desejado
```

### Alterar Pasta no Google Drive

Edite o arquivo `backup-database.sh`:

```bash
# Linha 52
GDRIVE_BACKUP_PATH="Backups/cobranca-db"  # Alterar para a pasta desejada
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

### Erro de conexão com Google Drive

1. Reconfigurar rclone:
   ```bash
   rclone config reconnect gdrive:
   ```

2. Testar conexão:
   ```bash
   rclone lsd gdrive:
   ```

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

# Listar backups no Drive
rclone ls gdrive:Backups/cobranca-db

# Baixar backup específico
rclone copy gdrive:Backups/cobranca-db/arquivo.sql.gz ./

# Verificar espaço usado no Drive
rclone size gdrive:Backups/cobranca-db

# Limpar backups locais antigos manualmente
find ~/projects/cp-sys/backups -name "cobranca_backup_*.sql.gz" -mtime +7 -delete

# Ver configuração do rclone
rclone config show

# Testar configuração do rclone
rclone config reconnect gdrive:
```

## 📚 Referências

- [PostgreSQL pg_dump Documentation](https://www.postgresql.org/docs/current/app-pgdump.html)
- [Rclone Documentation](https://rclone.org/docs/)
- [Cron Schedule Examples](https://crontab.guru/)

## 🆘 Suporte

Em caso de problemas:

1. Verifique os logs em `~/projects/cp-sys/backups/logs/`
2. Execute o backup manualmente para ver erros em tempo real
3. Verifique se o container PostgreSQL está rodando
4. Verifique a conexão com Google Drive: `rclone lsd gdrive:`

---

**Última atualização:** 2025-12-22

