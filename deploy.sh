#!/bin/bash

################################################################################
# Deploy Script for CP-SYS Application
# This script handles deployment with validation, backup, and rollback support
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$PROJECT_DIR/backups"
LOG_FILE="$PROJECT_DIR/deploy.log"
MAX_BACKUPS=5

################################################################################
# Helper Functions
################################################################################

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

################################################################################
# Validation Functions
################################################################################

check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
        exit 1
    fi
    success "Docker is installed"
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
        exit 1
    fi
    success "Docker Compose is installed"
    
    # Check if .env file exists
    if [ ! -f "$PROJECT_DIR/.env" ]; then
        warning ".env file not found. Creating from .env.example..."
        if [ -f "$PROJECT_DIR/.env.example" ]; then
            cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
            warning "Please update .env file with your values"
        else
            error ".env.example not found. Cannot create .env"
            exit 1
        fi
    fi
    success ".env file exists"
}

################################################################################
# Backup Functions
################################################################################

create_backup() {
    log "Creating backup..."
    
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    
    # Backup timestamp
    BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_NAME="backup_$BACKUP_TIMESTAMP"
    
    # Backup .env file
    if [ -f "$PROJECT_DIR/.env" ]; then
        cp "$PROJECT_DIR/.env" "$BACKUP_DIR/${BACKUP_NAME}.env"
        success "Backed up .env file"
    fi
    
    # Export Docker volumes (database)
    if docker-compose ps | grep -q "postgres"; then
        log "Backing up database..."
        docker-compose exec -T postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB > "$BACKUP_DIR/${BACKUP_NAME}.sql" || warning "Database backup failed"
        success "Backed up database"
    fi
    
    # Clean up old backups (keep only last MAX_BACKUPS)
    log "Cleaning up old backups..."
    cd "$BACKUP_DIR"
    ls -t backup_*.env 2>/dev/null | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm
    ls -t backup_*.sql 2>/dev/null | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm
    cd "$PROJECT_DIR"
    
    success "Backup completed: $BACKUP_NAME"
    echo "$BACKUP_NAME" > "$PROJECT_DIR/.last_backup"
}

################################################################################
# Deployment Functions
################################################################################

pull_latest_code() {
    log "Pulling latest code..."
    
    cd "$PROJECT_DIR"
    
    # Check if git repo
    if [ -d .git ]; then
        # Fix Git ownership issue (safe directory)
        git config --global --add safe.directory "$PROJECT_DIR" 2>/dev/null || true
        
        git fetch origin main
        git reset --hard origin/main
        success "Code updated to latest version"
    else
        warning "Not a git repository. Skipping git pull."
    fi
}

stop_containers() {
    log "Stopping existing containers..."
    
    cd "$PROJECT_DIR"
    docker-compose down || warning "Failed to stop containers (they might not be running)"
    
    success "Containers stopped"
}

build_and_start() {
    log "Building and starting containers..."
    
    cd "$PROJECT_DIR"
    
    # Build with no cache for clean build
    docker-compose build --no-cache
    
    # Start containers in detached mode
    docker-compose up -d
    
    success "Containers started"
}

wait_for_health() {
    log "Waiting for services to be healthy..."
    
    # Wait for PostgreSQL
    log "Checking PostgreSQL..."
    for i in {1..30}; do
        if docker-compose exec -T postgres pg_isready -U $POSTGRES_USER > /dev/null 2>&1; then
            success "PostgreSQL is ready"
            break
        elif [ $i -eq 30 ]; then
            error "PostgreSQL failed to start"
            return 1
        fi
        sleep 2
    done
    
    # Wait for Backend
    log "Checking Backend..."
    for i in {1..60}; do
        if curl -f http://localhost:8080/actuator/health > /dev/null 2>&1; then
            success "Backend is healthy"
            break
        elif [ $i -eq 60 ]; then
            error "Backend failed to start"
            docker-compose logs backend
            return 1
        fi
        sleep 2
    done
    
    # Check Frontend
    log "Checking Frontend..."
    if curl -f http://localhost:8081 > /dev/null 2>&1; then
        success "Frontend is healthy"
    else
        warning "Frontend health check failed (might need Nginx configuration)"
    fi
    
    return 0
}

################################################################################
# Rollback Function
################################################################################

rollback() {
    error "Deployment failed. Rolling back..."
    
    if [ -f "$PROJECT_DIR/.last_backup" ]; then
        LAST_BACKUP=$(cat "$PROJECT_DIR/.last_backup")
        
        # Restore .env
        if [ -f "$BACKUP_DIR/${LAST_BACKUP}.env" ]; then
            cp "$BACKUP_DIR/${LAST_BACKUP}.env" "$PROJECT_DIR/.env"
            success "Restored .env from backup"
        fi
        
        # Stop failed containers
        docker-compose down
        
        # Restart with previous configuration
        docker-compose up -d
        
        success "Rollback completed"
    else
        error "No backup found for rollback"
    fi
}

################################################################################
# Cleanup Functions
################################################################################

cleanup() {
    log "Running cleanup..."
    
    # Remove unused Docker images
    docker image prune -f
    
    # Remove unused volumes (be careful with this!)
    # docker volume prune -f
    
    success "Cleanup completed"
}

################################################################################
# Main Deployment Flow
################################################################################

main() {
    log "=========================================="
    log "Starting CP-SYS Deployment"
    log "=========================================="
    
    # Load environment variables
    if [ -f "$PROJECT_DIR/.env" ]; then
        export $(cat "$PROJECT_DIR/.env" | grep -v '^#' | xargs)
    fi
    
    # Validate prerequisites
    check_prerequisites
    
    # Create backup before deployment
    create_backup
    
    # Pull latest code
    pull_latest_code
    
    # Stop existing containers
    stop_containers
    
    # Build and start new containers
    if ! build_and_start; then
        rollback
        exit 1
    fi
    
    # Wait for health checks
    if ! wait_for_health; then
        rollback
        exit 1
    fi
    
    # Cleanup
    cleanup
    
    # Show running containers
    log "Running containers:"
    docker-compose ps
    
    log "=========================================="
    success "Deployment completed successfully!"
    log "=========================================="
}

################################################################################
# Script Execution
################################################################################

# Handle script arguments
case "${1:-deploy}" in
    deploy)
        main
        ;;
    backup)
        create_backup
        ;;
    rollback)
        rollback
        ;;
    cleanup)
        cleanup
        ;;
    *)
        echo "Usage: $0 {deploy|backup|rollback|cleanup}"
        exit 1
        ;;
esac

