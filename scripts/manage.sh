#!/bin/bash
# =============================================================================
# VISIT COUNTER API - Setup e Gestione Script
# =============================================================================

set -e

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directory del progetto
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$PROJECT_DIR/volumes/ws"

# Funzioni utility
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verifica requisiti
check_requirements() {
    log_info "Verifica requisiti..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker non installato"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose non installato"
        exit 1
    fi
    
    log_success "Requisiti soddisfatti"
}

# Setup iniziale
setup() {
    log_info "Setup Visit Counter API..."
    
    # Crea directory necessarie
    mkdir -p data logs volumes/app
    
    # Imposta permessi
    chmod 755 data logs volumes/app
    
    # Verifica/crea rete nginx-proxy-network
    if ! docker network ls | grep -q nginx-proxy-network; then
        log_info "Creazione rete nginx-proxy-network..."
        docker network create nginx-proxy-network
        log_success "Rete creata"
    else
        log_info "Rete nginx-proxy-network già esistente"
    fi
    
    # Genera salt casuale se non esiste
    if [ ! -f volumes/app/.env ]; then
        log_info "Generazione file .env..."
        
        # Copia template se esiste
        if [ -f volumes/app/.env.example ]; then
            cp volumes/app/.env.example volumes/app/.env
            log_info "Template .env copiato da .env.example"
        fi
        
        # Genera salt casuale
        RANDOM_SALT=$(openssl rand -hex 32 2>/dev/null || date +%s | sha256sum | head -c 64)
        
        # Se non esiste template, crea file .env basic
        if [ ! -f volumes/app/.env ]; then
            cat > volumes/app/.env << EOF
# Visit Counter API Configuration
NODE_ENV=production
PORT=3000
DB_PATH=/app/data/visits.db
SALT=${RANDOM_SALT}
TZ=Europe/Rome

# Security (change in production)
# CORS_ORIGIN=https://yourdomain.com
# ADMIN_TOKEN=your-admin-token-here
EOF
        else
            # Aggiorna solo il SALT nel file esistente
            sed -i "s/SALT=.*/SALT=${RANDOM_SALT}/" volumes/app/.env
        fi
        
        log_success "File .env configurato con salt casuale"
        log_warning "IMPORTANTE: Modifica il file volumes/app/.env per la produzione!"
    fi
    
    log_success "Setup completato"
}

# Build e avvio
start() {
    log_info "Avvio Visit Counter API..."
    
    # Build dell'immagine
    docker-compose build --no-cache
    
    # Avvio servizi
    docker-compose up -d
    
    # Aspetta che il servizio sia pronto
    log_info "Attesa avvio servizio..."
    sleep 10
    
    # Verifica health check
    if curl -s http://localhost:3000/health > /dev/null; then
        log_success "API avviata correttamente"
        echo ""
        log_info "📊 API URL: http://localhost:3000"
        log_info "🔧 Health Check: http://localhost:3000/health"
        log_info "📋 Registra sito: POST http://localhost:3000/api/register"
        echo ""
        log_info "Per registrare un sito:"
        echo "curl -X POST http://localhost:3000/api/register -H 'Content-Type: application/json' -d '{\"domain\": \"example.com\", \"name\": \"My Website\"}'"
    else
        log_error "Errore avvio API"
        docker-compose logs
        exit 1
    fi
}

# Stop servizi
stop() {
    log_info "Fermata Visit Counter API..."
    docker-compose down
    log_success "Servizi fermati"
}

# Restart servizi
restart() {
    stop
    start
}

# Mostra logs
logs() {
    docker-compose logs -f
}

# Mostra status
status() {
    log_info "Status Visit Counter API:"
    docker-compose ps
    echo ""
    
    if curl -s http://localhost:3000/health > /dev/null; then
        log_success "API online"
        echo ""
        echo "Health Check Response:"
        curl -s http://localhost:3000/health | jq . 2>/dev/null || curl -s http://localhost:3000/health
    else
        log_warning "API offline"
    fi
}

# Backup database
backup() {
    log_info "Backup database..."
    
    BACKUP_FILE="visit-counter-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
    tar czf "${BACKUP_FILE}" data/ logs/ volumes/app/.env docker-compose.yml 2>/dev/null || tar czf "${BACKUP_FILE}" data/
    
    log_success "Backup creato: ${BACKUP_FILE}"
}

# Update
update() {
    log_info "Aggiornamento Visit Counter API..."
    
    # Backup prima dell'update
    backup
    
    # Ferma servizi
    docker-compose down
    
    # Ricostruisci immagine
    docker-compose build --no-cache --pull
    
    # Riavvia
    docker-compose up -d
    
    log_success "Aggiornamento completato"
}

# Registra un nuovo sito (helper)
register_site() {
    if [ -z "$1" ]; then
        log_error "Utilizzo: $0 register <domain> [name]"
        exit 1
    fi
    
    DOMAIN="$1"
    NAME="${2:-$1}"
    
    log_info "Registrazione sito: ${DOMAIN}"
    
    RESPONSE=$(curl -s -X POST http://localhost:3000/api/register \
        -H 'Content-Type: application/json' \
        -d "{\"domain\": \"${DOMAIN}\", \"name\": \"${NAME}\"}")
    
    if echo "$RESPONSE" | grep -q "siteKey"; then
        log_success "Sito registrato con successo!"
        echo ""
        echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
        echo ""
        SITE_KEY=$(echo "$RESPONSE" | grep -o '"siteKey":"[^"]*"' | cut -d'"' -f4)
        log_info "Embed Script:"
        echo "<script src=\"http://localhost:3000/embed/${SITE_KEY}.js\"></script>"
        echo "<span class=\"visit-counter\">0</span> visite"
        echo ""
        log_info "Statistiche: http://localhost:3000/stats/${SITE_KEY}"
    else
        log_error "Errore registrazione sito"
        echo "$RESPONSE"
        exit 1
    fi
}

# Menu help
show_help() {
    echo "Visit Counter API - Script di gestione"
    echo ""
    echo "Utilizzo: $0 [comando]"
    echo ""
    echo "Comandi disponibili:"
    echo "  setup         Setup iniziale (crea directory, rete, .env)"
    echo "  start         Build e avvio API"
    echo "  stop          Ferma API"
    echo "  restart       Riavvia API"
    echo "  status        Mostra status API"
    echo "  logs          Mostra logs in tempo reale"
    echo "  backup        Crea backup database"
    echo "  update        Aggiorna API"
    echo "  register      Registra nuovo sito (usage: register <domain> [name])"
    echo "  help          Mostra questo messaggio"
    echo ""
    echo "Esempi:"
    echo "  $0 setup"
    echo "  $0 start"
    echo "  $0 register example.com \"My Website\""
    echo "  $0 status"
}

# Main script
case "${1:-help}" in
    setup)
        check_requirements
        setup
        ;;
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    logs)
        logs
        ;;
    status)
        status
        ;;
    backup)
        backup
        ;;
    update)
        update
        ;;
    register)
        register_site "$2" "$3"
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Comando sconosciuto: $1"
        show_help
        exit 1
        ;;
esac
