# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup
- Docker containerization
- Multi-site visit counter API
- SQLite database support
- Rate limiting and security features
- Embeddable JavaScript script
- Statistics dashboard
- Management scripts
- Health check endpoints

### Security
- Input sanitization
- Rate limiting (60 requests/minute)
- SQL injection protection with prepared statements
- Container runs as non-root user
- Anonymous visitor hashing for privacy

## [1.0.0] - 2025-09-02

### Added
- 🎉 **Initial Release**
- **Core API Features:**
  - Multi-site visit tracking
  - RESTful API endpoints
  - SQLite database with optimized schema
  - Real-time visit counting
  
- **Security & Performance:**
  - Rate limiting with configurable thresholds
  - CORS support for cross-domain embedding
  - Gzip compression
  - Input validation and sanitization
  
- **Docker Infrastructure:**
  - Multi-stage Alpine Linux build (< 50MB)
  - Health checks and auto-restart
  - Volume mounting for data persistence
  - Production-ready container configuration
  
- **Developer Experience:**
  - Complete management scripts (`manage.sh`)
  - Quick start script for easy setup
  - Comprehensive test suite
  - Example HTML implementation
  
- **Analytics & Monitoring:**
  - Web-based statistics dashboard
  - Daily/period analytics
  - Unique visitor tracking
  - Referrer and page URL tracking
  
- **Integration:**
  - Embeddable JavaScript widget
  - Nginx Proxy Manager support
  - Custom event dispatching
  - WordPress integration examples

### Technical Details
- **Node.js**: 18+ with Express.js framework
- **Database**: SQLite with automatic schema creation
- **Container**: Alpine Linux with dumb-init
- **Security**: Helmet.js, rate-limiter-flexible
- **Deployment**: Docker Compose with volume persistence

### Documentation
- Complete README with setup instructions
- API documentation with examples
- Docker deployment guide
- Security best practices
- Performance optimization tips

---

## Version Legend

- 🎉 **Major Release** - Breaking changes, new major features
- ✨ **Minor Release** - New features, backward compatible
- 🐛 **Patch Release** - Bug fixes, small improvements
- 🔒 **Security Release** - Security fixes and improvements

## Future Roadmap

### v1.1.0 (Planned)
- [ ] PostgreSQL/MySQL database support
- [ ] Redis caching layer
- [ ] Advanced analytics (geolocation, device detection)
- [ ] Webhook notifications
- [ ] API rate limiting per site

### v1.2.0 (Planned)
- [ ] Web dashboard improvements
- [ ] Export functionality (CSV, JSON)
- [ ] WordPress plugin
- [ ] Real-time analytics with WebSocket

### v2.0.0 (Future)
- [ ] Microservices architecture
- [ ] Kubernetes deployment
- [ ] GraphQL API
- [ ] Machine learning insights
