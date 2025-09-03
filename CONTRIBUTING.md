# Contributing to Visit Counter API

Grazie per il tuo interesse nel contribuire a Visit Counter API! 🎉

## 🤝 Come Contribuire

### 1. Setup Ambiente di Sviluppo

```bash
# Fork del repository su GitHub
# Poi clone del tuo fork
git clone https://github.com/YOUR_USERNAME/nodejs-visitcounterapi.git
cd nodejs-visitcounterapi

# Aggiungi upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/nodejs-visitcounterapi.git

# Setup ambiente
cp volumes/app/.env.example volumes/app/.env
./quick-start.sh
```

### 2. Workflow di Sviluppo

```bash
# Aggiorna il tuo fork
git fetch upstream
git checkout main
git merge upstream/main

# Crea branch per feature
git checkout -b feature/nome-feature

# Sviluppa e testa
# ... tue modifiche ...
./volumes/app/test-api.sh

# Commit
git add .
git commit -m "feat: descrizione breve della feature"

# Push e crea PR
git push origin feature/nome-feature
```

### 3. Standard di Codice

#### JavaScript/Node.js
- Usa **ESLint** per la formattazione
- Segui le convenzioni **ES6+**
- Documenta funzioni complesse
- Testa le modifiche

#### Commit Messages
Usa **Conventional Commits**:
- `feat:` - Nuove feature
- `fix:` - Bug fixes
- `docs:` - Documentazione
- `style:` - Formattazione
- `refactor:` - Refactoring
- `test:` - Test
- `chore:` - Manutenzione

#### Docker
- Mantieni immagini leggere
- Documenta i cambiamenti
- Testa build su diverse piattaforme

### 4. Testing

```bash
# Test API
./volumes/app/test-api.sh

# Test container
./scripts/manage.sh start
./scripts/manage.sh status

# Test manuale
curl http://localhost:3000/health
```

### 5. Documentazione

- Aggiorna README.md per nuove feature
- Documenta API changes in volumes/app/README.md
- Aggiungi esempi se necessario
- Mantieni commenti nel codice aggiornati

## 🐛 Report Bug

### Template Bug Report

```markdown
**Descrizione Bug**
Descrizione chiara del problema.

**Steps to Reproduce**
1. Vai a '...'
2. Click su '....'
3. Scroll down to '....'
4. Vedi errore

**Expected Behavior**
Cosa dovrebbe succedere normalmente.

**Screenshots**
Se applicabile, aggiungi screenshot.

**Environment (completa le info):**
 - OS: [e.g. Ubuntu 20.04]
 - Docker Version: [e.g. 20.10.7]
 - Node.js Version: [e.g. 18.17.0]
 - Browser [e.g. chrome, safari]
 - Version [e.g. 22]

**Additional Context**
Altre informazioni sul problema.
```

## 💡 Suggerimenti Feature

### Template Feature Request

```markdown
**Is your feature request related to a problem?**
Descrizione chiara del problema.

**Describe the solution you'd like**
Descrizione della soluzione desiderata.

**Describe alternatives you've considered**
Alternative considerate.

**Additional context**
Screenshot, mockup, o altre informazioni.
```

## 📋 Checklist PR

Prima di aprire una Pull Request, assicurati:

- [ ] Il codice segue gli standard del progetto
- [ ] I test passano
- [ ] La documentazione è aggiornata
- [ ] I commit seguono Conventional Commits
- [ ] Il branch è aggiornato con main
- [ ] Le feature sono testate
- [ ] Non ci sono conflitti

## 🔒 Security Issues

Per problemi di sicurezza, NON aprire issue pubblici. Contatta:
- Email: security@yourdomain.com
- Descrivi il problema nel dettaglio
- Includi steps per riprodurlo
- Attendi risposta prima di disclosure pubblico

## 📚 Risorse Utili

- [Docker Documentation](https://docs.docker.com)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Express.js Guide](https://expressjs.com/en/guide/)
- [SQLite Documentation](https://sqlite.org/docs.html)
- [Conventional Commits](https://www.conventionalcommits.org/)

## 🎯 Aree di Contributo

### Frontend
- Dashboard web migliorata
- UI per gestione siti
- Grafici e analytics

### Backend
- Supporto database esterni
- Cache e performance
- API additional endpoints

### DevOps
- CI/CD pipelines
- Kubernetes deployment
- Monitoring e logging

### Documentation
- Tutorial e guide
- Video tutorial
- Traduzione documentazione

### Testing
- Unit tests
- Integration tests
- Performance tests

## 🏆 Contributors

Tutti i contributor saranno riconosciuti nel README principale!

Grazie per il tuo contributo! 🙏
