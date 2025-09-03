# 📊 Visit Counter API

Un'API Node.js minimale e performante per il conteggio delle visite su siti web multipli con funzionalità di embed JavaScript e dashboard amministrativa.

## 🚀 Caratteristiche

- ✅ **Multi-sito**: Gestisce contatori per più domini
- ✅ **Dashboard**: Interfaccia web completa per visualizzare tutte le statistiche
- ✅ **Embed facile**: Script JavaScript one-liner
- ✅ **CORS friendly**: Funziona su qualsiasi dominio
- ✅ **Rate limiting**: Protezione da abusi
- ✅ **Statistiche**: Contatori giornalieri e per pagina
- ✅ **JSONP support**: Compatibilità cross-domain
- ✅ **Sicurezza**: Headers di sicurezza e validazione
- ✅ **Performance**: Compressione e cache ottimizzate
- ✅ **Grafici**: Visualizzazione trend con chart interattivi

## 📦 Installazione

### Con Docker (Raccomandato)

```bash
# Clone del progetto
git clone <repository-url>
cd visit-counter-api

# Build e avvio con Docker Compose
docker-compose up -d

# L'API sarà disponibile su http://localhost:3000
```

### Installazione manuale

```bash
# Installa dipendenze
npm install

# Avvia in modalità sviluppo
npm run dev

# Avvia in produzione
npm start
```

## 🔧 Configurazione

Copia `.env.example` in `.env` e modifica le configurazioni:

```bash
cp .env.example .env
```

Variabili principali:
- `PORT`: Porta del server (default: 3000)
- `HOST`: Host di binding (default: 0.0.0.0)
- `API_BASE_URL`: URL base per l'API
- `RATE_LIMIT_MAX_REQUESTS`: Limite richieste per IP

## 📝 Utilizzo

### 1. Embed JavaScript (Metodo più semplice)

Aggiungi questo script alle tue pagine web:

```html
<script src="https://your-api-domain.com/embed.js?domain=tuo-sito.com"></script>

<!-- Elementi opzionali per mostrare i contatori -->
<div>Visite totali: <span id="visit-counter">Caricamento...</span></div>
<div>Visite pagina: <span id="page-counter">Caricamento...</span></div>
```

### 2. API REST

#### Incrementa contatore (GET)
```bash
curl "https://your-api-domain.com/count/esempio.com?page=/about"
```

#### Incrementa contatore (POST)
```bash
curl -X POST https://your-api-domain.com/count \
  -H "Content-Type: application/json" \
  -d '{"domain": "esempio.com", "page": "/contact"}'
```

#### Statistiche dettagliate
```bash
curl "https://your-api-domain.com/stats/esempio.com"
```

#### Lista tutti i siti
```bash
curl "https://your-api-domain.com/sites"
```

## 🌐 Endpoints API

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| `GET` | `/health` | Health check dell'API |
| `GET` | `/dashboard` | **🆕 Dashboard amministrativa completa** |
| `GET` | `/count/{domain}` | Incrementa contatore per dominio |
| `POST` | `/count` | Incrementa contatore (JSON) |
| `GET` | `/stats/{domain}` | Statistiche dettagliate |
| `GET` | `/sites` | Lista di tutti i siti |
| `GET` | `/embed.js` | Script JavaScript per embed |
| `GET` | `/demo` | Pagina demo interattiva |

## 📊 Dashboard Amministrativa

La **nuova dashboard** offre una panoramica completa di tutti i siti monitorati con un'interfaccia moderna e responsive.

### 🎛️ Funzionalità Dashboard:

- **📊 Statistiche Generali**: 
  - Siti totali registrati
  - Visite totali accumulate
  - Siti attivi (con almeno 1 visita)
  - Visite di oggi

- **📈 Grafici per Sito**: 
  - Andamento visite degli ultimi 14 giorni
  - Visualizzazione a barre interattive
  - Trend giornalieri con tooltip

- **👥 Metriche Dettagliate**:
  - Visitatori unici per sito
  - Data ultima visita
  - Giorni dall'ultima attività

- **🔧 Azioni Rapide**:
  - Link diretto alle statistiche dettagliate
  - Accesso alla demo del sito
  - Navigazione intuitiva

### 🎨 Caratteristiche UI:

- **Design Moderno**: Gradients, animazioni fluide, cards interattive
- **Responsive**: Ottimizzata per desktop, tablet e mobile
- **Auto-refresh**: Aggiornamento automatico ogni 5 minuti
- **Performance**: Caricamento asincrono e cache intelligente
- **Accessibilità**: Design user-friendly con indicatori visivi

### 📱 Come Accedere:

```bash
# Dopo aver avviato l'API
http://localhost:3000/dashboard
```

**Screenshot della Dashboard:**
- Cards statistiche con icone e animazioni
- Tabella siti con grafici inline
- Pulsanti azione per ogni sito
- Design responsive e moderno

## 📊 Esempio Risposta API

```json
{
  "success": true,
  "domain": "esempio.com",
  "page": "/",
  "count": 1847,
  "todayCount": 23,
  "pageCount": 156,
  "timestamp": "2025-09-02T10:30:00.000Z"
}
```

## 🛡️ Sicurezza

- **Rate Limiting**: 1000 richieste per IP ogni 15 minuti
- **Helmet.js**: Headers di sicurezza automatici
- **CORS**: Configurato per permettere embed sicuri
- **Validazione**: Input sanitizzati e validati
- **Compressione**: Riduce bandwidth e migliora performance

## 🎨 Personalizzazione Frontend

### Event Listener personalizzato
```javascript
window.addEventListener('visitCounterUpdated', function(event) {
    console.log('Nuovi dati:', event.detail);
    // Aggiorna UI personalizzata
    document.getElementById('my-counter').textContent = event.detail.count;
});
```

### Controllo manuale
```javascript
// Incrementa manualmente
window.VisitCounter.increment();

// Accesso ai dati
console.log('Dominio:', window.VisitCounter.domain);
console.log('API URL:', window.VisitCounter.apiUrl);
```

## 🔧 Sviluppo

### Struttura del progetto
```
volumes/ws/
├── server.js          # Server principale Express
├── package.json       # Dipendenze e script
├── .env              # Configurazione ambiente
├── README.md         # Documentazione
└── tests/           # Test (opzionale)
```

### Script disponibili
```bash
npm run dev          # Sviluppo con nodemon
npm start           # Produzione
npm test            # Esegui test
npm run lint        # Linting del codice
npm run docker:build # Build immagine Docker
```

## 🐳 Docker

### Build dell'immagine
```bash
docker build -t visit-counter-api .
```

### Run del container
```bash
docker run -d \
  --name visit-counter \
  -p 3000:3000 \
  -e PORT=3000 \
  visit-counter-api
```

## 📈 Monitoring

### Health Check
```bash
curl https://your-api-domain.com/health
```

### Metriche
- Uptime del server
- Numero totale di siti tracciati
- Timestamp ultimo aggiornamento

## 🚨 Troubleshooting

### Errori comuni

1. **CORS Error**: Verifica che il dominio sia configurato correttamente
2. **Rate Limit**: Riduci la frequenza delle richieste
3. **Script non carica**: Controlla che l'URL dell'API sia corretto

### Debug
```bash
# Verifica logs
docker logs visit-counter

# Test manuale
curl -v https://your-api-domain.com/health
```

## 📄 Licenza

MIT License - Vedi file LICENSE per dettagli.

## 🤝 Contributi

1. Fork del progetto
2. Crea feature branch (`git checkout -b feature/amazing-feature`)
3. Commit delle modifiche (`git commit -m 'Add amazing feature'`)
4. Push al branch (`git push origin feature/amazing-feature`)
5. Apri una Pull Request

## 📞 Supporto

- 📧 Email: support@yourdomain.com
- 🐛 Issues: [GitHub Issues](https://github.com/your-org/visit-counter-api/issues)
- 📖 Docs: [Documentazione completa](https://docs.yourdomain.com)

---

**🌟 Se questo progetto ti è utile, lascia una stella su GitHub!**
