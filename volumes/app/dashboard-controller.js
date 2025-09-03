/* =============================================================================
   DASHBOARD CONTROLLER - Visit Counter API
   ============================================================================= */

const fs = require('fs');
const path = require('path');

class DashboardController {
    constructor() {
        this.publicPath = path.join(__dirname, 'public');
        this.dashboardHtml = null;
        this.loadDashboardTemplate();
    }

    loadDashboardTemplate() {
        try {
            const templatePath = path.join(this.publicPath, 'dashboard.html');
            this.dashboardHtml = fs.readFileSync(templatePath, 'utf8');
        } catch (error) {
            console.error('Errore caricamento template dashboard:', error);
            this.dashboardHtml = this.getFallbackTemplate();
        }
    }

    getFallbackTemplate() {
        return `
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📊 Visit Counter Dashboard - Errore</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .error { color: #e53e3e; }
    </style>
</head>
<body>
    <h1 class="error">❌ Errore Dashboard</h1>
    <p>Template dashboard non trovato. Controllare i file nella cartella public/</p>
    <a href="/health">🔍 Health Check</a>
</body>
</html>
        `;
    }

    // Endpoint principale dashboard
    getDashboard(req, res) {
        try {
            const apiUrl = `${req.protocol}://${req.get('host')}`;
            
            // Sostituisce variabili nel template se necessario
            let html = this.dashboardHtml.replace(/{{API_URL}}/g, apiUrl);
            
            res.set('Content-Type', 'text/html');
            res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.set('Pragma', 'no-cache');
            res.set('Expires', '0');
            
            res.send(html);
        } catch (error) {
            console.error('Errore servizio dashboard:', error);
            res.status(500).json({
                error: 'Errore interno nella dashboard',
                timestamp: new Date().toISOString()
            });
        }
    }

    // Serve file statici (CSS, JS, immagini)
    serveStaticFile(req, res) {
        try {
            const fileName = req.params.filename;
            const filePath = path.join(this.publicPath, fileName);
            
            // Verifica sicurezza: impedisce accesso a file fuori dalla cartella public
            const resolvedPath = path.resolve(filePath);
            const resolvedPublicPath = path.resolve(this.publicPath);
            
            if (!resolvedPath.startsWith(resolvedPublicPath)) {
                return res.status(403).json({ error: 'Accesso negato' });
            }

            // Verifica esistenza file
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ error: 'File non trovato' });
            }

            // Determina Content-Type basato sull'estensione
            const ext = path.extname(fileName).toLowerCase();
            const contentTypes = {
                '.css': 'text/css',
                '.js': 'application/javascript',
                '.html': 'text/html',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.gif': 'image/gif',
                '.svg': 'image/svg+xml',
                '.ico': 'image/x-icon',
                '.json': 'application/json'
            };

            const contentType = contentTypes[ext] || 'application/octet-stream';
            
            // Headers per caching appropriato
            res.set('Content-Type', contentType);
            
            if (ext === '.css' || ext === '.js') {
                // Cache più aggressivo per CSS/JS
                res.set('Cache-Control', 'public, max-age=3600'); // 1 ora
            } else {
                // Cache moderato per altri file
                res.set('Cache-Control', 'public, max-age=1800'); // 30 minuti
            }

            // Serve il file
            const fileContent = fs.readFileSync(filePath);
            res.send(fileContent);

        } catch (error) {
            console.error('Errore servizio file statico:', error);
            res.status(500).json({
                error: 'Errore nel servire il file',
                timestamp: new Date().toISOString()
            });
        }
    }

    // API endpoint per statistiche dashboard (estensione futura)
    getDashboardStats(req, res) {
        try {
            // Questo endpoint può essere usato per fornire dati specifici per la dashboard
            // In futuro può includere statistiche aggregate, cache, etc.
            
            const stats = {
                serverTime: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                version: '1.0.0',
                status: 'operational'
            };

            res.json(stats);
        } catch (error) {
            console.error('Errore stats dashboard:', error);
            res.status(500).json({
                error: 'Errore nel caricamento delle statistiche',
                timestamp: new Date().toISOString()
            });
        }
    }

    // Middleware per logging accessi dashboard
    static logDashboardAccess(req, res, next) {
        const timestamp = new Date().toISOString();
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent') || 'Unknown';
        
        console.log(`[DASHBOARD] ${timestamp} - ${ip} - ${req.method} ${req.path} - ${userAgent}`);
        next();
    }

    // Health check specifico per dashboard
    getDashboardHealth(req, res) {
        try {
            const checks = {
                templateLoaded: !!this.dashboardHtml,
                publicFolderExists: fs.existsSync(this.publicPath),
                cssExists: fs.existsSync(path.join(this.publicPath, 'dashboard.css')),
                jsExists: fs.existsSync(path.join(this.publicPath, 'dashboard.js'))
            };

            const allChecksPass = Object.values(checks).every(check => check === true);

            res.json({
                status: allChecksPass ? 'OK' : 'PARTIAL',
                checks,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Errore health check dashboard:', error);
            res.status(500).json({
                status: 'ERROR',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
}

module.exports = DashboardController;
