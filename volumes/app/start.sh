#!/bin/bash
# =============================================================================
# VISIT COUNTER API - Quick Start Script
# =============================================================================

set -e

# Colori
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}"
echo "🚀 Visit Counter API - Quick Start"
echo "=================================="
echo -e "${NC}"

# Controlla se Docker è disponibile
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}❌ Docker non trovato. Installalo prima di continuare.${NC}"
    exit 1
fi

# Vai alla directory del progetto
cd "$(dirname "$0")"

# Crea directory necessarie
echo -e "${BLUE}📁 Creazione directory...${NC}"
mkdir -p data logs

# Crea network se non esiste
echo -e "${BLUE}🌐 Creazione rete Docker...${NC}"
docker network create nginx-proxy-network 2>/dev/null || echo "Rete già esistente"

# Installa dipendenze Node.js
echo -e "${BLUE}📦 Installazione dipendenze...${NC}"
if [ -f "package.json" ]; then
    if command -v npm &> /dev/null; then
        npm install
    else
        echo -e "${YELLOW}⚠️  npm non trovato, le dipendenze saranno installate nel container${NC}"
    fi
fi

# Avvia i servizi
echo -e "${BLUE}🐳 Avvio container...${NC}"
if command -v docker-compose &> /dev/null; then
    docker-compose up -d
elif docker compose version &> /dev/null 2>&1; then
    docker compose up -d
else
    echo -e "${YELLOW}❌ Docker Compose non trovato${NC}"
    exit 1
fi

# Attendi che il servizio sia pronto
echo -e "${BLUE}⏳ Attesa avvio servizio...${NC}"
sleep 5

# Test di connettività
echo -e "${BLUE}🔍 Test API...${NC}"
if curl -s http://localhost:3000/health > /dev/null; then
    echo -e "${GREEN}✅ API avviata correttamente!${NC}"
else
    echo -e "${YELLOW}⚠️  API non risponde, controlla i log${NC}"
    docker logs visit-counter-api --tail 20
fi

echo -e "${GREEN}"
echo "🎉 Setup completato!"
echo ""
echo "📋 URL utili:"
echo "   🌐 API Health: http://localhost:3000/health"
echo "   📊 Demo Page:  http://localhost:3000/demo"
echo "   📈 Sites List: http://localhost:3000/sites"
echo "   🔧 Embed JS:   http://localhost:3000/embed.js?domain=test.com"
echo ""
echo "📝 Comandi utili:"
echo "   docker logs visit-counter-api        # Visualizza log"
echo "   docker-compose down                  # Ferma servizi"
echo "   docker-compose restart               # Riavvia servizi"
echo ""
echo "📖 Vedi README.md per la documentazione completa"
echo -e "${NC}"
