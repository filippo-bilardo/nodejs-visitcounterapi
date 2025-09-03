const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// =============================================================================
// MIDDLEWARE E SICUREZZA
// =============================================================================

// Configura trust proxy per nginx-proxy-manager
app.set('trust proxy', true);

// Sicurezza headers
app.use(helmet({
    contentSecurityPolicy: false, // Permette embed
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Compressione delle risposte
app.use(compression());

// CORS configurato per permettere embed da qualsiasi dominio
app.use(cors({
    origin: true, // Permette tutti i domini per l'embed
    credentials: false,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'X-Site-Domain', 'X-Page-Path']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minuti
    max: 1000, // Limite di 1000 richieste per IP ogni 15 minuti
    message: {
        error: 'Troppi tentativi, riprova più tardi',
        retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false
});
app.use(limiter);

// Parsing JSON
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// =============================================================================
// STORAGE IN MEMORIA (per semplicità - in produzione usare Redis/Database)
// =============================================================================

// Struttura dati per memorizzare i contatori
// Format: { 'domain.com': { total: 123, daily: { '2025-09-02': 45 }, pages: { '/': 67, '/about': 56 } } }
const siteCounters = new Map();

// Funzione helper per ottenere/creare contatore sito
function getSiteCounter(domain) {
    if (!siteCounters.has(domain)) {
        siteCounters.set(domain, {
            total: 0,
            daily: new Map(),
            pages: new Map(),
            firstVisit: moment().toISOString(),
            lastVisit: moment().toISOString()
        });
    }
    return siteCounters.get(domain);
}

// Funzione per incrementare contatore
function incrementCounter(domain, page = '/') {
    const counter = getSiteCounter(domain);
    const today = moment().format('YYYY-MM-DD');
    
    // Incrementa contatore totale
    counter.total++;
    
    // Incrementa contatore giornaliero
    const dailyCount = counter.daily.get(today) || 0;
    counter.daily.set(today, dailyCount + 1);
    
    // Incrementa contatore per pagina
    const pageCount = counter.pages.get(page) || 0;
    counter.pages.set(page, pageCount + 1);
    
    // Aggiorna ultima visita
    counter.lastVisit = moment().toISOString();
    
    return counter;
}

// =============================================================================
// ROUTES API
// =============================================================================

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: moment().toISOString(),
        uptime: process.uptime(),
        version: require('./package.json').version,
        totalSites: siteCounters.size
    });
});

// Endpoint principale per incrementare contatore (GET per embed semplice)
app.get('/count/:domain', [
    // Validazione parametri
    body('page').optional().isString().trim()
], (req, res) => {
    try {
        const domain = req.params.domain;
        const page = req.query.page || req.headers['x-page-path'] || '/';
        const callback = req.query.callback; // Per JSONP
        
        // Validazione dominio
        if (!domain || domain.length < 3 || domain.length > 100) {
            return res.status(400).json({ error: 'Dominio non valido' });
        }
        
        // Incrementa contatore
        const counter = incrementCounter(domain, page);
        
        const response = {
            success: true,
            domain: domain,
            page: page,
            count: counter.total,
            todayCount: counter.daily.get(moment().format('YYYY-MM-DD')) || 0,
            pageCount: counter.pages.get(page) || 0,
            timestamp: moment().toISOString()
        };
        
        // Se richiesta JSONP
        if (callback) {
            res.set('Content-Type', 'application/javascript');
            return res.send(`${callback}(${JSON.stringify(response)});`);
        }
        
        res.json(response);
        
    } catch (error) {
        console.error('Errore nel conteggio:', error);
        res.status(500).json({ 
            error: 'Errore interno del server',
            success: false 
        });
    }
});

// Endpoint POST per conteggio (più sicuro)
app.post('/count', [
    body('domain').isString().trim().isLength({ min: 3, max: 100 }),
    body('page').optional().isString().trim().isLength({ max: 200 })
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Parametri non validi', 
                details: errors.array() 
            });
        }
        
        const { domain, page = '/' } = req.body;
        
        // Incrementa contatore
        const counter = incrementCounter(domain, page);
        
        res.json({
            success: true,
            domain: domain,
            page: page,
            count: counter.total,
            todayCount: counter.daily.get(moment().format('YYYY-MM-DD')) || 0,
            pageCount: counter.pages.get(page) || 0,
            timestamp: moment().toISOString()
        });
        
    } catch (error) {
        console.error('Errore nel conteggio POST:', error);
        res.status(500).json({ 
            error: 'Errore interno del server',
            success: false 
        });
    }
});

// Statistiche dettagliate per un dominio
app.get('/stats/:domain', (req, res) => {
    try {
        const domain = req.params.domain;
        const counter = siteCounters.get(domain);
        
        if (!counter) {
            return res.status(404).json({ 
                error: 'Dominio non trovato',
                domain: domain 
            });
        }
        
        // Converti Map in oggetti per JSON
        const dailyStats = {};
        counter.daily.forEach((count, date) => {
            dailyStats[date] = count;
        });
        
        const pageStats = {};
        counter.pages.forEach((count, page) => {
            pageStats[page] = count;
        });
        
        res.json({
            domain: domain,
            total: counter.total,
            firstVisit: counter.firstVisit,
            lastVisit: counter.lastVisit,
            dailyStats: dailyStats,
            pageStats: pageStats,
            totalPages: counter.pages.size,
            activeDays: counter.daily.size
        });
        
    } catch (error) {
        console.error('Errore nel recupero statistiche:', error);
        res.status(500).json({ 
            error: 'Errore interno del server' 
        });
    }
});

// Lista di tutti i domini registrati
app.get('/sites', (req, res) => {
    try {
        const sites = [];
        
        siteCounters.forEach((counter, domain) => {
            sites.push({
                domain: domain,
                total: counter.total,
                todayCount: counter.daily.get(moment().format('YYYY-MM-DD')) || 0,
                pages: counter.pages.size,
                lastVisit: counter.lastVisit
            });
        });
        
        // Ordina per numero di visite (decrescente)
        sites.sort((a, b) => b.total - a.total);
        
        res.json({
            totalSites: sites.length,
            sites: sites,
            timestamp: moment().toISOString()
        });
        
    } catch (error) {
        console.error('Errore nel recupero siti:', error);
        res.status(500).json({ 
            error: 'Errore interno del server' 
        });
    }
});

// =============================================================================
// EMBED JAVASCRIPT
// =============================================================================

// Script JavaScript per l'embed
app.get('/embed.js', (req, res) => {
    const domain = req.query.domain || 'example.com';
    const apiUrl = req.query.api || `${req.protocol}://${req.get('host')}`;
    
    res.set('Content-Type', 'application/javascript');
    res.set('Cache-Control', 'public, max-age=300'); // Cache 5 minuti
    
    res.send(`
// Visit Counter Embed Script v1.0
(function() {
    'use strict';
    
    var DOMAIN = '${domain}';
    var API_URL = '${apiUrl}';
    var PAGE_PATH = window.location.pathname + window.location.search;
    
    // Funzione per incrementare contatore
    function incrementCounter() {
        var script = document.createElement('script');
        var callbackName = 'visitCounter_' + Date.now();
        
        // Callback per JSONP
        window[callbackName] = function(data) {
            if (data && data.success) {
                // Aggiorna elemento contatore se presente
                var counterElement = document.getElementById('visit-counter');
                if (counterElement) {
                    counterElement.textContent = data.count;
                }
                
                // Aggiorna contatore pagina se presente
                var pageCounterElement = document.getElementById('page-counter');
                if (pageCounterElement) {
                    pageCounterElement.textContent = data.pageCount;
                }
                
                // Trigger evento personalizzato
                if (typeof window.CustomEvent === 'function') {
                    var event = new CustomEvent('visitCounterUpdated', {
                        detail: data
                    });
                    window.dispatchEvent(event);
                }
                
                console.log('Visit counter aggiornato:', data);
            }
            
            // Cleanup
            document.head.removeChild(script);
            delete window[callbackName];
        };
        
        // Costruisci URL API
        var url = API_URL + '/count/' + encodeURIComponent(DOMAIN) + 
                  '?page=' + encodeURIComponent(PAGE_PATH) + 
                  '&callback=' + callbackName;
        
        script.src = url;
        script.onerror = function() {
            console.error('Errore nel caricamento visit counter');
            document.head.removeChild(script);
            delete window[callbackName];
        };
        
        document.head.appendChild(script);
    }
    
    // Esegui conteggio quando DOM è pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', incrementCounter);
    } else {
        incrementCounter();
    }
    
    // Esponi funzione globale per controllo manuale
    window.VisitCounter = {
        increment: incrementCounter,
        domain: DOMAIN,
        apiUrl: API_URL
    };
    
})();
`);
});

// =============================================================================
// DEMO PAGE
// =============================================================================

// Pagina demo per testare il contatore
app.get('/demo', (req, res) => {
    const domain = req.query.domain || 'demo.example.com';
    const apiUrl = `${req.protocol}://${req.get('host')}`;
    
    res.set('Content-Type', 'text/html');
    res.send(`
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visit Counter Demo - ${domain}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .counter {
            background: #007bff;
            color: white;
            padding: 15px 25px;
            border-radius: 5px;
            display: inline-block;
            margin: 10px 5px;
            font-weight: bold;
        }
        .code {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 4px;
            padding: 15px;
            font-family: monospace;
            white-space: pre-wrap;
            margin: 15px 0;
        }
        .btn {
            background: #28a745;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin: 5px;
        }
        .btn:hover {
            background: #218838;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Visit Counter Demo</h1>
        <p><strong>Dominio:</strong> ${domain}</p>
        
        <div>
            <div class="counter">
                Visite totali: <span id="visit-counter">...</span>
            </div>
            <div class="counter">
                Visite pagina: <span id="page-counter">...</span>
            </div>
        </div>
        
        <h2>Come usare il contatore</h2>
        <p>Aggiungi questo codice alle tue pagine web:</p>
        
        <div class="code">&lt;script src="${apiUrl}/embed.js?domain=${domain}"&gt;&lt;/script&gt;

&lt;!-- Elementi opzionali per mostrare i contatori --&gt;
&lt;div&gt;Visite: &lt;span id="visit-counter"&gt;...&lt;/span&gt;&lt;/div&gt;
&lt;div&gt;Visite pagina: &lt;span id="page-counter"&gt;...&lt;/span&gt;&lt;/div&gt;</div>
        
        <h2>API Endpoints</h2>
        <ul>
            <li><strong>GET</strong> <code>/count/{domain}?page=/path</code> - Incrementa contatore</li>
            <li><strong>POST</strong> <code>/count</code> - Incrementa contatore (JSON)</li>
            <li><strong>GET</strong> <code>/stats/{domain}</code> - Statistiche dettagliate</li>
            <li><strong>GET</strong> <code>/sites</code> - Lista tutti i siti</li>
        </ul>
        
        <h2>Test</h2>
        <button class="btn" onclick="VisitCounter.increment()">Incrementa Manualmente</button>
        <button class="btn" onclick="window.location.reload()">Ricarica Pagina</button>
        <button class="btn" onclick="window.open('/stats/${domain}', '_blank')">Vedi Statistiche</button>
    </div>
    
    <!-- Carica il contatore -->
    <script src="${apiUrl}/embed.js?domain=${domain}"></script>
    
    <!-- Listener per aggiornamenti -->
    <script>
        window.addEventListener('visitCounterUpdated', function(event) {
            console.log('Contatore aggiornato:', event.detail);
        });
    </script>
</body>
</html>
`);
});

// =============================================================================
// ROOT ENDPOINT  
// =============================================================================

// Endpoint root che reindirizza alla dashboard
app.get('/', (req, res) => {
    res.redirect('/dashboard');
});

// =============================================================================
// ERROR HANDLING E STARTUP
// =============================================================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint non trovato',
        path: req.path,
        method: req.method
    });
});

// Error handler globale
app.use((error, req, res, next) => {
    console.error('Errore non gestito:', error);
    res.status(500).json({
        error: 'Errore interno del server',
        timestamp: moment().toISOString()
    });
});

// =============================================================================
// ROOT ENDPOINT
// =============================================================================

// Endpoint root che reindirizza alla dashboard
// =============================================================================
// DASHBOARD AMMINISTRATIVA
// =============================================================================

// Dashboard per visualizzare statistiche di tutti i siti
app.get('/dashboard', (req, res) => {
    const apiUrl = `${req.protocol}://${req.get('host')}`;
    
    res.set('Content-Type', 'text/html');
    res.send(`
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📊 Visit Counter Dashboard</title>
</head>
<body>
    <h1>Dashboard Test</h1>
    <p>API URL: ${apiUrl}</p>
    <p>Test dashboard funzionante!</p>
</body>
</html>
`);
});

// =============================================================================
// ERROR HANDLING E STARTUP
// =============================================================================

// 500 error handler
app.use((err, req, res, next) => {
    console.error('Errore server:', err);
    res.status(500).json({
        error: 'Errore interno del server',
        timestamp: moment().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint non trovato',
        path: req.path,
        method: req.method
    });
});

// =============================================================================
// SERVER STARTUP
// =============================================================================

// Avvio del server
app.listen(PORT, HOST, () => {
    console.log(`
🚀 Visit Counter API avviato!
📡 Server: http://${HOST}:${PORT}
🌐 Demo: http://${HOST}:${PORT}/demo
📊 Dashboard: http://${HOST}:${PORT}/dashboard
🔍 Health: http://${HOST}:${PORT}/health
📋 Sites: http://${HOST}:${PORT}/sites
⏰ Timestamp: ${moment().toISOString()}
    `);
});

module.exports = app;
