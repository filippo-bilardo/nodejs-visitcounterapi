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
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .header {
            background: white;
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            text-align: center;
        }
        
        .header h1 {
            color: #333;
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .header p {
            color: #666;
            font-size: 1.1em;
        }
        
        .stats-overview {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: white;
            border-radius: 15px;
            padding: 25px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
        }
        
        .stat-card .icon {
            font-size: 3em;
            margin-bottom: 15px;
        }
        
        .stat-card .number {
            font-size: 2.5em;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 10px;
        }
        
        .stat-card .label {
            color: #666;
            font-size: 1.1em;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .sites-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 25px;
        }
        
        .site-card {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }
        
        .site-card:hover {
            transform: translateY(-5px);
        }
        
        .site-header {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #f0f0f0;
        }
        
        .site-icon {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: linear-gradient(45deg, #667eea, #764ba2);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.5em;
            margin-right: 15px;
        }
        
        .site-info h3 {
            color: #333;
            font-size: 1.3em;
            margin-bottom: 5px;
        }
        
        .site-info .domain {
            color: #666;
            font-size: 0.9em;
        }
        
        .site-stats {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .mini-stat {
            text-align: center;
            padding: 15px;
            background: #f8f9ff;
            border-radius: 10px;
        }
        
        .mini-stat .value {
            font-size: 1.8em;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
        }
        
        .mini-stat .label {
            font-size: 0.8em;
            color: #666;
            text-transform: uppercase;
        }
        
        .chart-container {
            height: 100px;
            background: #f8f9ff;
            border-radius: 10px;
            padding: 10px;
            position: relative;
            overflow: hidden;
        }
        
        .chart-bar {
            position: absolute;
            bottom: 10px;
            background: linear-gradient(to top, #667eea, #764ba2);
            width: 8px;
            border-radius: 4px;
            opacity: 0.8;
            transition: opacity 0.3s ease;
        }
        
        .chart-bar:hover {
            opacity: 1;
        }
        
        .actions {
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }
        
        .btn {
            flex: 1;
            padding: 12px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.9em;
            transition: all 0.3s ease;
            text-decoration: none;
            text-align: center;
            display: inline-block;
        }
        
        .btn-primary {
            background: #667eea;
            color: white;
        }
        
        .btn-primary:hover {
            background: #5a67d8;
            transform: translateY(-2px);
        }
        
        .btn-secondary {
            background: #e2e8f0;
            color: #4a5568;
        }
        
        .btn-secondary:hover {
            background: #cbd5e0;
        }
        
        .loading {
            text-align: center;
            padding: 50px;
            color: white;
            font-size: 1.2em;
        }
        
        .error {
            background: #fed7d7;
            color: #c53030;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            text-align: center;
        }
        
        .refresh-btn {
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 60px;
            height: 60px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 50%;
            font-size: 1.5em;
            cursor: pointer;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
        }
        
        .refresh-btn:hover {
            background: #5a67d8;
            transform: scale(1.1);
        }
        
        @media (max-width: 768px) {
            .header h1 {
                font-size: 2em;
            }
            
            .stats-overview {
                grid-template-columns: 1fr;
            }
            
            .sites-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Visit Counter Dashboard</h1>
            <p>Panoramica completa di tutti i siti monitorati</p>
        </div>
        
        <div id="overview" class="stats-overview">
            <!-- Statistiche generali caricate dinamicamente -->
        </div>
        
        <div id="sites" class="sites-grid">
            <div class="loading">
                <div>🔄 Caricamento dati...</div>
            </div>
        </div>
    </div>
    
    <button class="refresh-btn" onclick="loadDashboard()" title="Aggiorna dati">
        🔄
    </button>

    <script>
        const API_BASE = '${apiUrl}';
        
        // Funzione per formattare numeri
        function formatNumber(num) {
            return new Intl.NumberFormat('it-IT').format(num);
        }
        
        // Funzione per calcolare giorni fa
        function daysAgo(date) {
            const now = new Date();
            const past = new Date(date);
            const diffTime = Math.abs(now - past);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays;
        }
        
        // Funzione per creare mini chart
        function createChart(data, containerId) {
            const container = document.getElementById(containerId);
            if (!container) return;
            
            container.innerHTML = '';
            
            if (!data || data.length === 0) {
                container.innerHTML = '<div style="text-align: center; color: #666; padding: 40px;">Nessun dato disponibile</div>';
                return;
            }
            
            const maxValue = Math.max(...data.map(d => d.count));
            const barWidth = 8;
            const spacing = 12;
            const containerWidth = container.offsetWidth - 20;
            const maxBars = Math.floor(containerWidth / spacing);
            
            // Prendi solo gli ultimi dati se ce ne sono troppi
            const displayData = data.slice(-maxBars);
            
            displayData.forEach((item, index) => {
                const bar = document.createElement('div');
                bar.className = 'chart-bar';
                bar.style.left = (10 + index * spacing) + 'px';
                bar.style.height = ((item.count / maxValue) * 80) + 'px';
                bar.title = \`\${item.date}: \${item.count} visite\`;
                container.appendChild(bar);
            });
        }
        
        // Carica statistiche generali
        async function loadOverview() {
            try {
                const response = await fetch(API_BASE + '/sites');
                const sites = await response.json();
                
                let totalVisits = 0;
                let totalSites = sites.length;
                let activeSites = 0;
                let todayVisits = 0;
                
                const today = new Date().toISOString().split('T')[0];
                
                for (const site of sites) {
                    totalVisits += site.total_visits || 0;
                    if ((site.total_visits || 0) > 0) activeSites++;
                    
                    // Carica statistiche dettagliate per visite di oggi
                    try {
                        const statsResponse = await fetch(API_BASE + '/stats/' + site.domain);
                        const stats = await statsResponse.json();
                        
                        const todayData = stats.daily_stats?.find(d => d.date === today);
                        if (todayData) {
                            todayVisits += todayData.visits;
                        }
                    } catch (e) {
                        console.warn('Errore caricamento stats per', site.domain);
                    }
                }
                
                document.getElementById('overview').innerHTML = \`
                    <div class="stat-card">
                        <div class="icon">🌐</div>
                        <div class="number">\${formatNumber(totalSites)}</div>
                        <div class="label">Siti Totali</div>
                    </div>
                    <div class="stat-card">
                        <div class="icon">📈</div>
                        <div class="number">\${formatNumber(totalVisits)}</div>
                        <div class="label">Visite Totali</div>
                    </div>
                    <div class="stat-card">
                        <div class="icon">✅</div>
                        <div class="number">\${formatNumber(activeSites)}</div>
                        <div class="label">Siti Attivi</div>
                    </div>
                    <div class="stat-card">
                        <div class="icon">📅</div>
                        <div class="number">\${formatNumber(todayVisits)}</div>
                        <div class="label">Visite Oggi</div>
                    </div>
                \`;
            } catch (error) {
                console.error('Errore caricamento overview:', error);
                document.getElementById('overview').innerHTML = \`
                    <div class="error">
                        ❌ Errore caricamento statistiche generali
                    </div>
                \`;
            }
        }
        
        // Carica tutti i siti
        async function loadSites() {
            try {
                const response = await fetch(API_BASE + '/sites');
                const sites = await response.json();
                
                if (sites.length === 0) {
                    document.getElementById('sites').innerHTML = \`
                        <div style="grid-column: 1/-1; text-align: center; color: white; padding: 50px;">
                            <h2>🌟 Nessun sito registrato</h2>
                            <p>Inizia aggiungendo il primo sito al tuo contatore visite!</p>
                        </div>
                    \`;
                    return;
                }
                
                let sitesHtml = '';
                
                for (const site of sites) {
                    const domain = site.domain;
                    const firstLetter = domain.charAt(0).toUpperCase();
                    const totalVisits = site.total_visits || 0;
                    const lastVisit = site.last_visit ? new Date(site.last_visit).toLocaleDateString('it-IT') : 'Mai';
                    const daysSinceLastVisit = site.last_visit ? daysAgo(site.last_visit) : null;
                    
                    // Carica statistiche dettagliate
                    let detailedStats = { daily_stats: [] };
                    try {
                        const statsResponse = await fetch(API_BASE + '/stats/' + domain);
                        detailedStats = await statsResponse.json();
                    } catch (e) {
                        console.warn('Errore stats per', domain);
                    }
                    
                    const uniqueVisitors = detailedStats.unique_visitors || 0;
                    const dailyData = detailedStats.daily_stats?.slice(-7).map(d => ({
                        date: d.date,
                        count: d.visits
                    })) || [];
                    
                    const chartId = 'chart-' + domain.replace(/[^a-zA-Z0-9]/g, '');
                    
                    sitesHtml += \`
                        <div class="site-card">
                            <div class="site-header">
                                <div class="site-icon">\${firstLetter}</div>
                                <div class="site-info">
                                    <h3>\${domain}</h3>
                                    <div class="domain">
                                        Ultima visita: \${lastVisit}
                                        \${daysSinceLastVisit !== null ? \`(\${daysSinceLastVisit} giorni fa)\` : ''}
                                    </div>
                                </div>
                            </div>
                            
                            <div class="site-stats">
                                <div class="mini-stat">
                                    <div class="value">\${formatNumber(totalVisits)}</div>
                                    <div class="label">Visite Totali</div>
                                </div>
                                <div class="mini-stat">
                                    <div class="value">\${formatNumber(uniqueVisitors)}</div>
                                    <div class="label">Visitatori Unici</div>
                                </div>
                            </div>
                            
                            <div class="chart-container" id="\${chartId}">
                                <!-- Chart generato via JS -->
                            </div>
                            
                            <div class="actions">
                                <a href="/stats/\${domain}" class="btn btn-primary" target="_blank">
                                    📊 Statistiche
                                </a>
                                <a href="/demo?domain=\${domain}" class="btn btn-secondary" target="_blank">
                                    🔧 Demo
                                </a>
                            </div>
                        </div>
                    \`;
                }
                
                document.getElementById('sites').innerHTML = sitesHtml;
                
                // Genera chart per ogni sito
                for (const site of sites) {
                    const domain = site.domain;
                    const chartId = 'chart-' + domain.replace(/[^a-zA-Z0-9]/g, '');
                    
                    try {
                        const statsResponse = await fetch(API_BASE + '/stats/' + domain);
                        const stats = await statsResponse.json();
                        const dailyData = stats.daily_stats?.slice(-14).map(d => ({
                            date: d.date,
                            count: d.visits
                        })) || [];
                        
                        setTimeout(() => createChart(dailyData, chartId), 100);
                    } catch (e) {
                        console.warn('Errore chart per', domain);
                    }
                }
                
            } catch (error) {
                console.error('Errore caricamento siti:', error);
                document.getElementById('sites').innerHTML = \`
                    <div class="error" style="grid-column: 1/-1;">
                        ❌ Errore caricamento siti: \${error.message}
                    </div>
                \`;
            }
        }
        
        // Carica dashboard completa
        async function loadDashboard() {
            document.getElementById('sites').innerHTML = \`
                <div class="loading" style="grid-column: 1/-1;">
                    <div>🔄 Aggiornamento dati...</div>
                </div>
            \`;
            
            await loadOverview();
            await loadSites();
        }
        
        // Auto-refresh ogni 5 minuti
        setInterval(loadDashboard, 5 * 60 * 1000);
        
        // Carica dati all'avvio
        loadDashboard();
    </script>
</body>
</html>
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM ricevuto, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT ricevuto, shutting down gracefully...');
    process.exit(0);
});

// Avvio server
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
