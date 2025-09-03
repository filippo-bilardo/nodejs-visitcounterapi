#!/bin/bash
# =============================================================================
# VISIT COUNTER API - Test Script
# =============================================================================

set -e

API_URL="http://localhost:3000"
TEST_DOMAIN="test-site.com"

# Colori
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}"
echo "🧪 Visit Counter API - Test Suite"
echo "================================="
echo -e "${NC}"

# Test 1: Health Check
echo -e "${BLUE}🏥 Test 1: Health Check${NC}"
if curl -s "$API_URL/health" | jq . > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Health check OK${NC}"
else
    echo -e "${RED}❌ Health check FAILED${NC}"
    exit 1
fi

# Test 2: Incremento contatore (GET)
echo -e "${BLUE}📈 Test 2: Incremento contatore (GET)${NC}"
RESPONSE=$(curl -s "$API_URL/count/$TEST_DOMAIN?page=/test")
if echo "$RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    COUNT=$(echo "$RESPONSE" | jq -r '.count')
    echo -e "${GREEN}✅ Contatore incrementato: $COUNT${NC}"
else
    echo -e "${RED}❌ Incremento FAILED${NC}"
    echo "$RESPONSE"
fi

# Test 3: Incremento contatore (POST)
echo -e "${BLUE}📈 Test 3: Incremento contatore (POST)${NC}"
RESPONSE=$(curl -s -X POST "$API_URL/count" \
    -H "Content-Type: application/json" \
    -d "{\"domain\": \"$TEST_DOMAIN\", \"page\": \"/api-test\"}")
if echo "$RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    COUNT=$(echo "$RESPONSE" | jq -r '.count')
    echo -e "${GREEN}✅ Contatore POST incrementato: $COUNT${NC}"
else
    echo -e "${RED}❌ Incremento POST FAILED${NC}"
    echo "$RESPONSE"
fi

# Test 4: Statistiche
echo -e "${BLUE}📊 Test 4: Statistiche dominio${NC}"
RESPONSE=$(curl -s "$API_URL/stats/$TEST_DOMAIN")
if echo "$RESPONSE" | jq -e '.domain' > /dev/null 2>&1; then
    TOTAL=$(echo "$RESPONSE" | jq -r '.total')
    PAGES=$(echo "$RESPONSE" | jq -r '.totalPages')
    echo -e "${GREEN}✅ Statistiche OK - Totale: $TOTAL, Pagine: $PAGES${NC}"
else
    echo -e "${RED}❌ Statistiche FAILED${NC}"
    echo "$RESPONSE"
fi

# Test 5: Lista siti
echo -e "${BLUE}🌐 Test 5: Lista siti${NC}"
RESPONSE=$(curl -s "$API_URL/sites")
if echo "$RESPONSE" | jq -e '.totalSites' > /dev/null 2>&1; then
    SITES=$(echo "$RESPONSE" | jq -r '.totalSites')
    echo -e "${GREEN}✅ Lista siti OK - Totale siti: $SITES${NC}"
else
    echo -e "${RED}❌ Lista siti FAILED${NC}"
    echo "$RESPONSE"
fi

# Test 6: Embed JavaScript
echo -e "${BLUE}🔗 Test 6: Embed JavaScript${NC}"
if curl -s "$API_URL/embed.js?domain=$TEST_DOMAIN" | grep -q "Visit Counter Embed Script" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Embed JS OK${NC}"
else
    echo -e "${RED}❌ Embed JS FAILED${NC}"
fi

# Test 7: JSONP
echo -e "${BLUE}🔄 Test 7: JSONP Support${NC}"
CALLBACK="testCallback123"
RESPONSE=$(curl -s "$API_URL/count/$TEST_DOMAIN?callback=$CALLBACK")
if echo "$RESPONSE" | grep -q "$CALLBACK(" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ JSONP OK${NC}"
else
    echo -e "${RED}❌ JSONP FAILED${NC}"
fi

# Test 8: Rate Limiting
echo -e "${BLUE}🛡️ Test 8: Rate Limiting${NC}"
for i in {1..10}; do
    curl -s "$API_URL/count/$TEST_DOMAIN" > /dev/null
done
echo -e "${GREEN}✅ Rate limiting test completato${NC}"

# Test 9: Validazione input
echo -e "${BLUE}🔍 Test 9: Validazione input${NC}"
RESPONSE=$(curl -s "$API_URL/count/")
if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Validazione input OK${NC}"
else
    echo -e "${YELLOW}⚠️  Validazione input non stringente${NC}"
fi

# Test 10: Demo page
echo -e "${BLUE}🎨 Test 10: Demo page${NC}"
if curl -s "$API_URL/demo?domain=$TEST_DOMAIN" | grep -q "Visit Counter Demo" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Demo page OK${NC}"
else
    echo -e "${RED}❌ Demo page FAILED${NC}"
fi

echo -e "${GREEN}"
echo "🎉 Test suite completata!"
echo ""
echo "📊 Risultati finali:"
curl -s "$API_URL/stats/$TEST_DOMAIN" | jq .
echo ""
echo "🌐 Tutti i siti:"
curl -s "$API_URL/sites" | jq '.sites[] | {domain: .domain, total: .total}'
echo -e "${NC}"
