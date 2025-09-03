# 📊 Visit Counter API

API Node.js minimale per un'API contatore di visite embeddabile multi-sito. Consente di aggiungere facilmente un contatore delle visite a qualsiasi sito web tramite un semplice script JavaScript.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![Alpine Linux](https://img.shields.io/badge/Alpine-Linux-0D597F.svg)](https://alpinelinux.org)


```
nodejs-visitcounterapi/
├── 📄 docker-compose.yml     # Configurazione container
├── 📄 Dockerfile             # Build container ottimizzato
├── 📄 README.md              # Questa documentazione
├── 📄 LICENSE                # Licenza MIT
├── 📄 .gitignore             # File da escludere da Git
├── 📄 quick-start.sh         # Script avvio rapido
├── 📁 scripts/               # Script di gestione
│   └── 📄 manage.sh          # Script completo gestione
├── 📁 volumes/               # Applicazione Node.js
│   └── 📁 app/              # → Directory applicazione
│       ├── 📄 package.json   # Dipendenze Node.js
│       ├── 📄 server.js      # Server Express principale
│       ├── 📄 .env.example   # Template configurazione
│       ├── 📄 start.sh       # Script avvio
│       ├── 📄 test-api.sh    # Test API
│       ├── 📄 example.html   # Esempio implementazione
│       └── 📄 README.md      # Documentazione API
└── 📁 data/                 # Database (creato automaticamente)
    └── 📄 visits.db          # Database SQLite
```

## 🛠️ Installazione da GitHub minimale per un'API contatore di visite embeddabile multi-sito. Consente di aggiungere facilmente un contatore delle visite a qualsiasi sito web tramite un semplice script JavaScript.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![Alpine Linux](https://img.shields.io/badge/Alpine-Linux-0D597F.svg)](https://alpinelinux.org)

## 🚀 Caratteristiche

- **Multi-sito**: Gestisce contatori per più siti web contemporaneamente
- **Embeddabile**: Script JavaScript semplice da integrare
- **Minimale**: Container Alpine Linux ottimizzato (< 50MB)
- **Sicuro**: Rate limiting, sanitizzazione input, utente non-root
- **Persistente**: Database SQLite con backup automatico
- **Analytics**: Statistiche dettagliate per ogni sito
- **CORS**: Funziona su qualsiasi dominio

## 📁 Struttura Progetto

```
/ws/container/_nodejs/
├── 📄 docker-compose.yml     # Configurazione container
├── 📄 Dockerfile             # Build container ottimizzato
├── 📄 README.md              # Questa documentazione
├── � quick-start.sh         # Script avvio rapido
├── �📁 scripts/               # Script di gestione
│   └── 📄 manage.sh          # Script completo gestione
├── 📁 volumes/               # Applicazione Node.js
│   └── 📁 app/              # → Directory applicazione
│       ├── 📄 package.json   # Dipendenze Node.js
│       ├── 📄 server.js      # Server Express principale
│       ├── 📄 .env           # Configurazione ambiente
│       ├── 📄 start.sh       # Script avvio
│       ├── 📄 test-api.sh    # Test API
│       ├── 📄 example.html   # Esempio implementazione
│       └── 📄 README.md      # Documentazione API
└── 📁 data/                 # Database (creato automaticamente)
    └── 📄 visits.db          # Database SQLite
```

## 🛠️ Installazione e Setup

### ⚡ Avvio Rapido (Consigliato)

```bash
# Clone del repository
git clone https://github.com/filippo-bilardo/nodejs-visitcounterapi.git
cd nodejs-visitcounterapi

# Configurazione ambiente
cp volumes/app/.env.example volumes/app/.env
nano volumes/app/.env  # Modifica SALT e altre configurazioni

# Avvio automatico completo
./quick-start.sh
```

### 🔧 Setup Manuale

#### 1. Clone Repository

```bash
# Clone via HTTPS
git clone https://github.com/filippo-bilardo/nodejs-visitcounterapi.git

# Oppure via SSH
git clone git@github.com:filippo-bilardo/nodejs-visitcounterapi.git

# Entra nella directory
cd nodejs-visitcounterapi
```

#### 2. Preparazione

```bash
# Vai nella directory del progetto
cd nodejs-visitcounterapi

# Rendi eseguibili gli script
chmod +x scripts/manage.sh
chmod +x volumes/app/start.sh
chmod +x volumes/app/test-api.sh

# Setup iniziale (crea directory, rete Docker, .env)
./scripts/manage.sh setup
```

#### 3. Configurazione

Crea e modifica il file di configurazione:

```bash
# Copia il template di configurazione
cp volumes/app/.env.example volumes/app/.env

# Genera un salt sicuro
SALT=$(openssl rand -hex 32)

# Modifica .env con il tuo editor preferito
nano volumes/app/.env
```

#### 4. Avvio

```bash
# Build e avvio container
./scripts/manage.sh start

# Verifica stato
./scripts/manage.sh status

# Mostra logs
./scripts/manage.sh logs
```

## 🔧 Utilizzo

### 1. Registra un nuovo sito

```bash
# Tramite script helper
./scripts/manage.sh register example.com "My Website"

# Oppure manualmente
curl -X POST http://localhost:3000/api/register \
  -H 'Content-Type: application/json' \
  -d '{"domain": "example.com", "name": "My Website"}'
```

**Risposta:**
```json
{
  "siteKey": "abc123def456...",
  "domain": "example.com",
  "name": "My Website",
  "embedScript": "/embed/abc123def456.js",
  "statsUrl": "/stats/abc123def456"
}
```

### 2. Integra nel sito web

Aggiungi questo codice HTML al tuo sito:

```html
<!-- Carica il script contatore -->
<script src="https://your-domain.com/embed/abc123def456.js"></script>

<!-- Mostra il contatore -->
<p>Visite totali: <span class="visit-counter">0</span></p>

<!-- Opzionale: Event listener per azioni personalizzate -->
<script>
window.addEventListener('visitCounted', function(e) {
    console.log('Nuova visita registrata:', e.detail.visits);
    // Azioni personalizzate...
});
</script>
```

### 3. Visualizza statistiche

Accedi alle statistiche via web:
- **URL**: `https://your-domain.com/stats/{siteKey}`
- **API**: `GET /api/stats/{siteKey}`

## 🌐 API Endpoints

### Registrazione Sito
```http
POST /api/register
Content-Type: application/json

{
  "domain": "example.com",
  "name": "My Website Name"
}
```

### Incremento Visite
```http
POST /api/visit/{siteKey}
Content-Type: application/json

{
  "page_url": "https://example.com/page",
  "referrer": "https://google.com"
}
```

### Statistiche
```http
GET /api/stats/{siteKey}?days=30
```

### Health Check
```http
GET /health
```

### Script Embed
```http
GET /embed/{siteKey}.js
```

## 🔐 Sicurezza

- **Rate Limiting**: 60 richieste/minuto per IP
- **Input Sanitization**: Validazione di tutti gli input
- **CORS**: Configurabile per domini specifici
- **Anonimizzazione**: Hash visitatori per privacy
- **Container Security**: Utente non-root, Alpine Linux
- **SQL Injection**: Prepared statements

## 📈 Nginx Proxy Manager

### Configurazione Proxy Host

1. **Crea nuovo Proxy Host** in NPM:
   - **Domain Names**: `visits.yourdomain.com`
   - **Scheme**: `http`
   - **Forward Hostname/IP**: `visit-counter-api`
   - **Forward Port**: `3000`

2. **SSL Certificate**:
   - Abilita "Request a new SSL Certificate"
   - Abilita "Force SSL"
   - Abilita "HTTP/2 Support"

3. **Advanced**:
```nginx
# Cache per script embed
location /embed/ {
    proxy_pass http://visit-counter-api:3000;
    proxy_cache_valid 200 1h;
    add_header Cache-Control "public, max-age=3600";
}

# No cache per API
location /api/ {
    proxy_pass http://visit-counter-api:3000;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

## 🗄️ Database

### Schema SQLite

**Tabella `sites`:**
- `id`: Primary key
- `site_key`: Chiave univoca sito
- `domain`: Dominio sito
- `name`: Nome descrittivo
- `created_at`: Data creazione
- `is_active`: Stato attivo/disattivo

**Tabella `visits`:**
- `id`: Primary key
- `site_key`: Riferimento al sito
- `visitor_hash`: Hash anonimo visitatore
- `page_url`: URL pagina visitata
- `referrer`: Sito di provenienza
- `timestamp`: Data/ora visita

### Backup e Restore

```bash
# Backup automatico
./scripts/manage.sh backup

# Backup manuale
tar czf backup-$(date +%Y%m%d).tar.gz data/ volumes/app/.env

# Restore
tar xzf backup-YYYYMMDD.tar.gz
```

## 🎯 Esempi Implementazione

### WordPress
```php
// Aggiungi nel footer.php del tema
echo '<script src="https://visits.yourdomain.com/embed/YOUR_SITE_KEY.js"></script>';
echo '<p>Visite: <span class="visit-counter">0</span></p>';
```

### React/Next.js
```jsx
import { useEffect, useState } from 'react';

function VisitCounter() {
    const [visits, setVisits] = useState(0);
    
    useEffect(() => {
        // Carica script
        const script = document.createElement('script');
        script.src = 'https://visits.yourdomain.com/embed/YOUR_SITE_KEY.js';
        document.head.appendChild(script);
        
        // Listener evento
        const handleVisitCounted = (e) => {
            setVisits(e.detail.visits);
        };
        
        window.addEventListener('visitCounted', handleVisitCounted);
        
        return () => {
            window.removeEventListener('visitCounted', handleVisitCounted);
            document.head.removeChild(script);
        };
    }, []);
    
    return <span>Visite: {visits.toLocaleString()}</span>;
}
```

### HTML Statico
```html
<!DOCTYPE html>
<html>
<head>
    <title>My Website</title>
</head>
<body>
    <h1>Benvenuto!</h1>
    <p>Questa pagina è stata visitata <span class="visit-counter">0</span> volte.</p>
    
    <!-- Visit Counter Script -->
    <script src="https://visits.yourdomain.com/embed/YOUR_SITE_KEY.js"></script>
</body>
</html>
```

## 🔧 Script di Gestione

Il progetto include uno script completo per la gestione:

```bash
# Mostra tutti i comandi disponibili
./scripts/manage.sh help

# Comandi principali
./scripts/manage.sh setup       # Setup iniziale
./scripts/manage.sh start       # Avvia container
./scripts/manage.sh stop        # Ferma container
./scripts/manage.sh restart     # Riavvia container
./scripts/manage.sh status      # Mostra stato
./scripts/manage.sh logs        # Mostra logs
./scripts/manage.sh backup      # Backup database
./scripts/manage.sh update      # Aggiorna container

# Gestione siti
./scripts/manage.sh register example.com "My Site"
```

## 📊 Monitoraggio

### Health Check
```bash
curl http://localhost:3000/health
```

### Metriche Container
```bash
docker stats visit-counter-api
```

### Log in tempo reale
```bash
docker logs -f visit-counter-api
```

## 🚀 Performance

### Ottimizzazioni

- **Container**: Alpine Linux (< 50MB)
- **Database**: SQLite con indici ottimizzati
- **Cache**: Script embed cachati 1 ora
- **Rate Limiting**: Previene abusi
- **Compressione**: Gzip automatico
- **HTTP/2**: Supportato via NPM

### Scaling

Per **alto traffico** considera:

1. **Database esterno**: PostgreSQL/MySQL
2. **Cache Redis**: Per rate limiting e sessioni
3. **Load Balancer**: Multiple istanze
4. **CDN**: Per script embed statici

## 🐛 Troubleshooting

### Container non si avvia
```bash
# Verifica logs
docker logs visit-counter-api

# Verifica rete
docker network ls | grep nginx-proxy

# Ricostruisci
./scripts/manage.sh stop
docker-compose build --no-cache
./scripts/manage.sh start
```

### Database corrotto
```bash
# Backup esistente
cp data/visits.db data/visits.db.bak

# Reset database
rm data/visits.db
./scripts/manage.sh restart
```

### Script embed non funziona
1. Verifica CORS nel browser
2. Controlla console JavaScript
3. Testa API direttamente
4. Verifica certificati SSL

## 🔧 Script di Gestione Rapida

```bash
# Setup completo in un comando
git clone https://github.com/filippo-bilardo/nodejs-visitcounterapi.git && \
cd nodejs-visitcounterapi && \
cp volumes/app/.env.example volumes/app/.env && \
chmod +x scripts/manage.sh volumes/app/*.sh && \
./scripts/manage.sh setup && \
./scripts/manage.sh start

# Test rapido
curl http://localhost:3000/health
./volumes/app/test-api.sh
```

## 📝 File di Configurazione

Tutti i file principali sono già configurati e pronti all'uso:

- ✅ `volumes/app/server.js` - Server Express completo
- ✅ `volumes/app/package.json` - Dipendenze ottimizzate
- ✅ `volumes/app/.env` - Configurazione ambiente
- ✅ `Dockerfile` - Build ottimizzato Alpine
- ✅ `docker-compose.yml` - Orchestrazione completa
- ✅ `scripts/manage.sh` - Gestione automatizzata

## 🔧 Come Usare manage.sh

Lo script `manage.sh` è il punto centrale per gestire tutto il progetto:

### Ubicazione e Accesso
```bash
# Lo script si trova in:
/ws/container/_nodejs/scripts/manage.sh

# Per usarlo, vai sempre nella directory principale:
cd /ws/container/_nodejs

# Poi esegui i comandi:
./scripts/manage.sh [comando]
```

### Comandi Disponibili
```bash
# Setup iniziale completo
./scripts/manage.sh setup

# Gestione container
./scripts/manage.sh start       # Avvia container
./scripts/manage.sh stop        # Ferma container  
./scripts/manage.sh restart     # Riavvia container
./scripts/manage.sh status      # Mostra stato

# Monitoraggio
./scripts/manage.sh logs        # Mostra logs
./scripts/manage.sh backup      # Backup database

# Gestione siti
./scripts/manage.sh register example.com "My Site"

# Aiuto
./scripts/manage.sh help        # Mostra tutti i comandi
```

### Struttura Dati nel Container

**Nel container Docker:**
- `/app/` → Codice applicazione (da `volumes/app/`)
- `/app/data/` → Database SQLite (montato da `./data/`)
- `/app/node_modules/` → Dipendenze Node.js

**Sull'host:**
- `./volumes/app/` → Codice sorgente modificabile
- `./data/` → Database persistente  
- `./logs/` → Log applicazione

## 📞 Supporto e Contributi

### 🤝 Come Contribuire

1. **Fork** del repository
2. Crea un **feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit** delle modifiche (`git commit -m 'Add amazing feature'`)
4. **Push** al branch (`git push origin feature/amazing-feature`)
5. Apri una **Pull Request**

### 🐛 Segnalazione Bug

- **Issues**: [Apri un issue su GitHub](https://github.com/filippo-bilardo/nodejs-visitcounterapi/issues)
- **Template Bug Report**: Usa il template fornito
- **Security Issues**: Contatta privatamente per problemi di sicurezza

### 📚 Documentazione

- **README**: Questo file - documentazione completa
- **API Docs**: `volumes/app/README.md` - dettagli API
- **Examples**: `volumes/app/example.html` - esempio implementazione
- **Tests**: `volumes/app/test-api.sh` - test automatici

### 🛠️ Sviluppo

```bash
# Clone per sviluppo
git clone https://github.com/filippo-bilardo/nodejs-visitcounterapi.git
cd nodejs-visitcounterapi

# Crea branch per feature
git checkout -b feature/my-feature

# Sviluppa e testa
./quick-start.sh
./volumes/app/test-api.sh

# Commit e push
git add .
git commit -m "Add my feature"
git push origin feature/my-feature
```

### 📊 Roadmap

- [ ] Dashboard web avanzata
- [ ] Supporto database PostgreSQL/MySQL
- [ ] Cache Redis
- [ ] API per gestione siti
- [ ] Webhook per notifiche
- [ ] Metriche avanzate (geolocalizzazione, device)
- [ ] Export dati (CSV, JSON)
- [ ] Plugin WordPress

### 📄 Licenza

Questo progetto è rilasciato sotto licenza **MIT License** - vedi il file [LICENSE](LICENSE) per dettagli.

### ⭐ Se ti piace questo progetto

- Metti una ⭐ su GitHub
- Condividi con la community
- Contribuisci con nuove feature
- Segnala bug e suggerimenti

---

**Made with ❤️ for easy web analytics**

### 📈 GitHub Repository

- **URL**: `https://github.com/filippo-bilardo/nodejs-visitcounterapi`
- **Clone HTTPS**: `git clone https://github.com/filippo-bilardo/nodejs-visitcounterapi.git`
- **Clone SSH**: `git clone git@github.com:filippo-bilardo/nodejs-visitcounterapi.git`

### 🏷️ Tags e Releases

Usa **semantic versioning** per i rilasci:
- `v1.0.0` - First stable release
- `v1.1.0` - Minor features and improvements
- `v1.1.1` - Bug fixes and patches