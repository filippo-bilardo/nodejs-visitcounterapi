# =============================================================================
# VISIT COUNTER API - Multi-stage Docker Build
# =============================================================================
# Container minimale per API contatore visite multi-sito
# Basato su Alpine Linux per dimensioni ridotte e sicurezza

# Stage 1: Build dependencies
FROM node:18-alpine AS builder

# Metadata del container
LABEL maintainer="your-email@domain.com"
LABEL description="Visit Counter API - Contatore visite embeddabile"
LABEL version="1.0.0"

# Crea utente non-root per sicurezza
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Directory di lavoro
WORKDIR /app

# Copia package files per ottimizzare cache Docker
COPY volumes/app/package*.json ./

# Installa solo dipendenze di produzione
RUN npm ci --only=production && \
    npm cache clean --force

# Stage 2: Runtime container
FROM node:18-alpine AS runtime

# Installa dumb-init per gestione processi
RUN apk add --no-cache \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Crea utente e gruppo
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Directory di lavoro
WORKDIR /app

# Copia dipendenze dal stage builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copia codice applicazione dall'host volume
COPY --chown=nodejs:nodejs volumes/app/ ./

# Crea directory per database con permessi corretti
RUN mkdir -p /app/data && \
    chown -R nodejs:nodejs /app/data

# Variables d'ambiente
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/visits.db
ENV SALT=change-this-in-production

# Esponi porta
EXPOSE 3000

# Cambia a utente non-root
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Volume per persistenza database
VOLUME ["/app/data"]

# Usa dumb-init come entrypoint per gestione segnali
ENTRYPOINT ["dumb-init", "--"]

# Comando di avvio
CMD ["node", "server.js"]
