/* =============================================================================
   DATABASE MODULE - SQLite Integration for Visit Counter
   ============================================================================= */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class DatabaseManager {
    constructor() {
        this.dbPath = path.join(__dirname, 'data', 'visits.db');
        this.db = null;
        this.isConnected = false;
        
        this.ensureDataDirectory();
        this.connect();
    }

    ensureDataDirectory() {
        const dataDir = path.dirname(this.dbPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
            console.log(`📁 Cartella data creata: ${dataDir}`);
        }
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('❌ Errore connessione database:', err);
                    reject(err);
                } else {
                    console.log(`✅ Database SQLite connesso: ${this.dbPath}`);
                    this.isConnected = true;
                    this.initializeTables().then(resolve).catch(reject);
                }
            });
        });
    }

    async initializeTables() {
        return new Promise((resolve, reject) => {
            const createTableSQL = `
                CREATE TABLE IF NOT EXISTS visits (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    domain TEXT NOT NULL,
                    path TEXT DEFAULT '/',
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    ip_address TEXT,
                    user_agent TEXT,
                    referer TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE INDEX IF NOT EXISTS idx_domain ON visits(domain);
                CREATE INDEX IF NOT EXISTS idx_timestamp ON visits(timestamp);
                CREATE INDEX IF NOT EXISTS idx_domain_path ON visits(domain, path);
            `;

            this.db.exec(createTableSQL, (err) => {
                if (err) {
                    console.error('❌ Errore creazione tabelle:', err);
                    reject(err);
                } else {
                    console.log('✅ Tabelle database inizializzate');
                    this.seedTestData().then(resolve).catch(reject);
                }
            });
        });
    }

    async seedTestData() {
        return new Promise((resolve) => {
            // Verifica se ci sono già dati
            this.db.get("SELECT COUNT(*) as count FROM visits", (err, row) => {
                if (err || row.count > 0) {
                    resolve(); // Dati già presenti o errore
                    return;
                }

                console.log('🌱 Inserimento dati di test...');
                
                // Genera dati di test per gli ultimi 30 giorni
                const testData = [];
                const domains = [
                    'example.com',
                    'mysite.it',
                    'blog.esempio.org',
                    'shop.test.com',
                    'portfolio.dev'
                ];

                for (let i = 29; i >= 0; i--) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    
                    // Genera visite casuali per ogni dominio
                    domains.forEach(domain => {
                        const visitsCount = Math.floor(Math.random() * 15) + 1; // 1-15 visite per giorno
                        
                        for (let v = 0; v < visitsCount; v++) {
                            const visitTime = new Date(date);
                            visitTime.setHours(Math.floor(Math.random() * 24));
                            visitTime.setMinutes(Math.floor(Math.random() * 60));
                            
                            testData.push({
                                domain,
                                path: Math.random() > 0.7 ? '/about' : '/',
                                timestamp: visitTime.toISOString(),
                                ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
                                user_agent: 'Mozilla/5.0 (Test Data)',
                                referer: Math.random() > 0.5 ? 'https://google.com' : null
                            });
                        }
                    });
                }

                // Inserisci i dati in batch
                const stmt = this.db.prepare(`
                    INSERT INTO visits (domain, path, timestamp, ip_address, user_agent, referer)
                    VALUES (?, ?, ?, ?, ?, ?)
                `);

                let completed = 0;
                testData.forEach(data => {
                    stmt.run([
                        data.domain,
                        data.path,
                        data.timestamp,
                        data.ip_address,
                        data.user_agent,
                        data.referer
                    ], function(err) {
                        if (err) {
                            console.error('Errore inserimento test data:', err);
                        }
                        completed++;
                        if (completed === testData.length) {
                            stmt.finalize();
                            console.log(`✅ Inseriti ${testData.length} record di test`);
                            resolve();
                        }
                    });
                });
            });
        });
    }

    // Registra una nuova visita
    async recordVisit(domain, path = '/', ipAddress = null, userAgent = null, referer = null) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject(new Error('Database non connesso'));
                return;
            }

            const stmt = this.db.prepare(`
                INSERT INTO visits (domain, path, ip_address, user_agent, referer)
                VALUES (?, ?, ?, ?, ?)
            `);

            stmt.run([domain, path, ipAddress, userAgent, referer], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID });
                }
            });

            stmt.finalize();
        });
    }

    // Ottieni statistiche per un dominio
    async getSiteStats(domain) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject(new Error('Database non connesso'));
                return;
            }

            const query = `
                SELECT 
                    COUNT(*) as totalVisits,
                    COUNT(DISTINCT DATE(timestamp)) as activeDays,
                    MIN(timestamp) as firstVisit,
                    MAX(timestamp) as lastVisit,
                    COUNT(CASE WHEN DATE(timestamp) = DATE('now') THEN 1 END) as visitsToday,
                    COUNT(CASE WHEN DATE(timestamp) >= DATE('now', '-7 days') THEN 1 END) as visitsThisWeek,
                    COUNT(CASE WHEN DATE(timestamp) >= DATE('now', '-30 days') THEN 1 END) as visitsThisMonth
                FROM visits 
                WHERE domain = ?
            `;

            this.db.get(query, [domain], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row || {});
                }
            });
        });
    }

    // Ottieni lista di tutti i siti
    async getAllSites() {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject(new Error('Database non connesso'));
                return;
            }

            const query = `
                SELECT 
                    domain,
                    COUNT(*) as totalVisits,
                    MIN(timestamp) as firstVisit,
                    MAX(timestamp) as lastVisit,
                    COUNT(CASE WHEN DATE(timestamp) = DATE('now') THEN 1 END) as visitsToday
                FROM visits 
                GROUP BY domain
                ORDER BY totalVisits DESC
            `;

            this.db.all(query, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }

    // Ottieni visite per date (per grafici)
    async getVisitsByDate(domain = null, days = 30) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject(new Error('Database non connesso'));
                return;
            }

            let query = `
                SELECT 
                    DATE(timestamp) as date,
                    COUNT(*) as visits
                FROM visits 
                WHERE DATE(timestamp) >= DATE('now', '-${days} days')
            `;

            const params = [];
            if (domain) {
                query += ` AND domain = ?`;
                params.push(domain);
            }

            query += ` GROUP BY DATE(timestamp) ORDER BY date`;

            this.db.all(query, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }

    // Chiudi connessione database
    close() {
        return new Promise((resolve) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('Errore chiusura database:', err);
                    } else {
                        console.log('✅ Database disconnesso');
                    }
                    this.isConnected = false;
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    // Health check database
    async healthCheck() {
        return new Promise((resolve) => {
            if (!this.isConnected || !this.db) {
                resolve({ status: 'error', message: 'Database non connesso' });
                return;
            }

            this.db.get("SELECT COUNT(*) as count FROM visits", (err, row) => {
                if (err) {
                    resolve({ status: 'error', message: err.message });
                } else {
                    resolve({ 
                        status: 'ok', 
                        totalRecords: row.count,
                        dbPath: this.dbPath
                    });
                }
            });
        });
    }
}

module.exports = DatabaseManager;
