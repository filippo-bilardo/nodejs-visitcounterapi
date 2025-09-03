/* =============================================================================
   VISIT COUNTER DASHBOARD - JAVASCRIPT
   ============================================================================= */

class VisitCounterDashboard {
    constructor() {
        this.apiUrl = window.location.origin;
        this.charts = {};
        this.data = {
            sites: [],
            totalVisits: 0,
            totalSites: 0,
            visitsToday: 0,
            avgDaily: 0
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadData();
        
        // Auto-refresh ogni 30 secondi
        setInterval(() => this.loadData(), 30000);
    }

    setupEventListeners() {
        // Refresh button
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.loadData();
        });

        // Search input
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.filterSites(e.target.value);
        });

        // Sort select
        document.getElementById('sort-select').addEventListener('change', (e) => {
            this.sortSites(e.target.value);
        });

        // Modal close
        document.querySelector('.modal-close').addEventListener('click', () => {
            this.closeModal();
        });

        // Modal background click
        document.getElementById('site-modal').addEventListener('click', (e) => {
            if (e.target.id === 'site-modal') {
                this.closeModal();
            }
        });
    }

    async loadData() {
        this.showLoading();
        
        try {
            // Carica lista siti
            const sitesResponse = await fetch(`${this.apiUrl}/sites`);
            const sitesData = await sitesResponse.json();
            
            // Carica statistiche per ogni sito
            const sitesWithStats = await Promise.all(
                sitesData.sites.map(async (site) => {
                    try {
                        const statsResponse = await fetch(`${this.apiUrl}/stats/${site.domain}`);
                        const stats = await statsResponse.json();
                        return { ...site, ...stats };
                    } catch (error) {
                        console.error(`Errore caricamento stats per ${site.domain}:`, error);
                        return { ...site, totalVisits: 0, visitsToday: 0 };
                    }
                })
            );

            this.data.sites = sitesWithStats;
            this.calculateOverallStats();
            this.updateUI();
            this.updateApiStatus('✅');
            
        } catch (error) {
            console.error('Errore caricamento dati:', error);
            this.updateApiStatus('❌');
            this.showError('Errore nel caricamento dei dati');
        } finally {
            this.hideLoading();
        }
    }

    calculateOverallStats() {
        this.data.totalSites = this.data.sites.length;
        this.data.totalVisits = this.data.sites.reduce((sum, site) => sum + (site.totalVisits || 0), 0);
        this.data.visitsToday = this.data.sites.reduce((sum, site) => sum + (site.visitsToday || 0), 0);
        
        // Calcola media giornaliera (ultimi 30 giorni)
        const totalDays = Math.max(1, this.data.sites.reduce((max, site) => {
            if (site.firstVisit) {
                const daysSince = Math.ceil((Date.now() - new Date(site.firstVisit).getTime()) / (1000 * 60 * 60 * 24));
                return Math.max(max, Math.min(daysSince, 30));
            }
            return max;
        }, 1));
        
        this.data.avgDaily = Math.round(this.data.totalVisits / totalDays);
    }

    updateUI() {
        this.updateOverviewStats();
        this.updateSitesTable();
        this.updateCharts();
        this.updateTimestamp();
    }

    updateOverviewStats() {
        document.getElementById('total-sites').textContent = this.data.totalSites.toLocaleString();
        document.getElementById('total-visits').textContent = this.data.totalVisits.toLocaleString();
        document.getElementById('visits-today').textContent = this.data.visitsToday.toLocaleString();
        document.getElementById('avg-daily').textContent = this.data.avgDaily.toLocaleString();
    }

    updateSitesTable() {
        const tbody = document.getElementById('sites-table-body');
        
        if (this.data.sites.length === 0) {
            tbody.innerHTML = `
                <tr class="loading-row">
                    <td colspan="6">📭 Nessun sito trovato</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.data.sites.map(site => `
            <tr>
                <td>
                    <strong>${site.domain}</strong>
                    ${site.path ? `<br><small style="color: #666;">${site.path}</small>` : ''}
                </td>
                <td>${(site.totalVisits || 0).toLocaleString()}</td>
                <td>${site.firstVisit ? this.formatDate(site.firstVisit) : 'N/A'}</td>
                <td>${site.lastVisit ? this.formatDate(site.lastVisit) : 'N/A'}</td>
                <td>${(site.visitsToday || 0).toLocaleString()}</td>
                <td>
                    <button class="btn btn-secondary" onclick="dashboard.showSiteDetails('${site.domain}')">
                        📊 Dettagli
                    </button>
                </td>
            </tr>
        `).join('');
    }

    updateCharts() {
        this.createVisitsChart();
        this.createSitesChart();
    }

    createVisitsChart() {
        const ctx = document.getElementById('visits-chart');
        if (!ctx) return;

        // Genera dati per gli ultimi 30 giorni
        const days = [];
        const visitsData = [];
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date.toLocaleDateString('it-IT', { 
                day: 'numeric', 
                month: 'short' 
            }));
            
            // Simula dati (in una implementazione reale, questi verrebbero dall'API)
            const visits = Math.floor(Math.random() * (this.data.visitsToday * 2 + 1));
            visitsData.push(visits);
        }

        if (this.charts.visits) {
            this.charts.visits.destroy();
        }

        this.charts.visits = new Chart(ctx, {
            type: 'line',
            data: {
                labels: days,
                datasets: [{
                    label: 'Visite',
                    data: visitsData,
                    borderColor: 'rgb(102, 126, 234)',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    createSitesChart() {
        const ctx = document.getElementById('sites-chart');
        if (!ctx) return;

        // Top 10 siti per visite
        const topSites = [...this.data.sites]
            .sort((a, b) => (b.totalVisits || 0) - (a.totalVisits || 0))
            .slice(0, 10);

        if (this.charts.sites) {
            this.charts.sites.destroy();
        }

        this.charts.sites = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: topSites.map(site => site.domain),
                datasets: [{
                    data: topSites.map(site => site.totalVisits || 0),
                    backgroundColor: [
                        '#667eea', '#764ba2', '#f093fb', '#f5576c',
                        '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
                        '#ffecd2', '#fcb69f'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    async showSiteDetails(domain) {
        try {
            const response = await fetch(`${this.apiUrl}/stats/${domain}`);
            const stats = await response.json();
            
            document.getElementById('modal-title').textContent = `📊 Statistiche per ${domain}`;
            
            const details = `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
                    <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                        <h4 style="margin: 0; color: #667eea;">${(stats.totalVisits || 0).toLocaleString()}</h4>
                        <p style="margin: 5px 0 0 0; color: #666;">Visite totali</p>
                    </div>
                    <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                        <h4 style="margin: 0; color: #667eea;">${(stats.visitsToday || 0).toLocaleString()}</h4>
                        <p style="margin: 5px 0 0 0; color: #666;">Visite oggi</p>
                    </div>
                    <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                        <h4 style="margin: 0; color: #667eea;">${stats.firstVisit ? this.formatDate(stats.firstVisit) : 'N/A'}</h4>
                        <p style="margin: 5px 0 0 0; color: #666;">Prima visita</p>
                    </div>
                    <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                        <h4 style="margin: 0; color: #667eea;">${stats.lastVisit ? this.formatDate(stats.lastVisit) : 'N/A'}</h4>
                        <p style="margin: 5px 0 0 0; color: #666;">Ultima visita</p>
                    </div>
                </div>
            `;
            
            document.getElementById('modal-site-details').innerHTML = details;
            document.getElementById('site-modal').style.display = 'block';
            
        } catch (error) {
            console.error('Errore caricamento dettagli sito:', error);
            this.showError('Errore nel caricamento dei dettagli del sito');
        }
    }

    closeModal() {
        document.getElementById('site-modal').style.display = 'none';
    }

    filterSites(searchTerm) {
        const rows = document.querySelectorAll('#sites-table-body tr');
        rows.forEach(row => {
            const domain = row.querySelector('td:first-child strong')?.textContent.toLowerCase() || '';
            if (domain.includes(searchTerm.toLowerCase())) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    sortSites(sortBy) {
        let sortedSites = [...this.data.sites];
        
        switch (sortBy) {
            case 'visits':
                sortedSites.sort((a, b) => (b.totalVisits || 0) - (a.totalVisits || 0));
                break;
            case 'domain':
                sortedSites.sort((a, b) => a.domain.localeCompare(b.domain));
                break;
            case 'lastVisit':
                sortedSites.sort((a, b) => {
                    const dateA = a.lastVisit ? new Date(a.lastVisit) : new Date(0);
                    const dateB = b.lastVisit ? new Date(b.lastVisit) : new Date(0);
                    return dateB - dateA;
                });
                break;
        }
        
        this.data.sites = sortedSites;
        this.updateSitesTable();
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('it-IT', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    updateTimestamp() {
        const now = new Date();
        document.getElementById('timestamp').textContent = now.toLocaleString('it-IT');
    }

    updateApiStatus(status) {
        document.getElementById('api-status').textContent = status;
    }

    showLoading() {
        document.getElementById('loading-overlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loading-overlay').style.display = 'none';
    }

    showError(message) {
        // Crea un toast di errore
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f56565;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            z-index: 1002;
            animation: slideIn 0.3s ease;
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }
}

// Inizializza dashboard quando il DOM è carico
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new VisitCounterDashboard();
});

// Stili per animazioni
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
