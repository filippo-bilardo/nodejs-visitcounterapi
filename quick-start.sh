#!/bin/bash
# =============================================================================
# VISIT COUNTER API - Script di Avvio Rapido
# =============================================================================
# Questo script permette di avviare rapidamente il progetto senza dover
# navigare nelle sottocartelle

set -e

# Colori per output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Visit Counter API - Avvio Rapido${NC}"
echo ""

# Verifica di essere nella directory corretta
if [ ! -f "./scripts/manage.sh" ]; then
    echo -e "${YELLOW}⚠️  Esegui questo script dalla directory nodejs-visitcounterapi${NC}"
    echo "   cd nodejs-visitcounterapi && ./quick-start.sh"
    exit 1
fi

# Rendi eseguibili tutti gli script
echo -e "${BLUE}📝 Configurazione permessi...${NC}"
chmod +x scripts/manage.sh
chmod +x volumes/app/*.sh 2>/dev/null || true

# Esegui setup se non già fatto
if [ ! -f "./volumes/app/.env" ]; then
    echo -e "${BLUE}🔧 Configurazione iniziale...${NC}"
    
    # Copia template se esiste
    if [ -f "./volumes/app/.env.example" ]; then
        echo -e "${BLUE}📋 Copia template configurazione...${NC}"
        cp volumes/app/.env.example volumes/app/.env
        echo -e "${YELLOW}⚠️  IMPORTANTE: Modifica volumes/app/.env con le tue configurazioni!${NC}"
        echo "   Specialmente il campo SALT per la sicurezza"
    fi
    
    ./scripts/manage.sh setup
fi

# Avvia container
echo -e "${BLUE}🐳 Avvio container...${NC}"
./scripts/manage.sh start

echo ""
echo -e "${GREEN}✅ Visit Counter API avviato con successo!${NC}"
echo ""
echo -e "${BLUE}📋 Comandi utili:${NC}"
echo "   ./scripts/manage.sh status     # Stato container"
echo "   ./scripts/manage.sh logs       # Mostra logs"
echo "   ./scripts/manage.sh register example.com \"My Site\"  # Registra sito"
echo "   ./volumes/app/test-api.sh      # Test API"
echo ""
echo -e "${BLUE}🌐 URL utili:${NC}"
echo "   http://localhost:3000/health   # Health check"
echo "   http://localhost:3000          # API base"
echo ""
echo -e "${BLUE}📚 Per maggiori informazioni:${NC}"
echo "   cat README.md                  # Documentazione completa"
echo "   ./scripts/manage.sh help       # Tutti i comandi disponibili"
