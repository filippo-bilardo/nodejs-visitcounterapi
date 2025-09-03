# Project Structure Documentation

## Overview
Visit Counter API è organizzato per essere un progetto completo e mantenibile, con separazione chiara tra infrastruttura Docker, applicazione Node.js e documentazione.

## Directory Structure

```
nodejs-visitcounterapi/
├── .github/                    # GitHub configuration
│   └── workflows/
│       └── ci-cd.yml          # CI/CD pipeline with automated testing
├── scripts/                   # Management scripts
│   └── manage.sh             # Complete project management script
├── volumes/                  # Docker volume content
│   └── app/                 # Node.js application source
│       ├── .env.example     # Environment configuration template
│       ├── package.json     # Node.js dependencies and scripts
│       ├── server.js        # Main application entry point
│       ├── start.sh         # Container startup script
│       ├── test-api.sh      # API testing script
│       ├── example.html     # Integration example
│       └── README.md        # Application-specific documentation
├── Dockerfile               # Multi-stage Docker build configuration
├── docker-compose.yml       # Docker Compose for easy deployment
├── quick-start.sh          # One-command startup script
├── .gitignore              # Git ignore patterns
├── LICENSE                 # MIT License
├── README.md               # Main project documentation
├── CONTRIBUTING.md         # Contribution guidelines
├── CHANGELOG.md            # Version history and changes
└── STRUCTURE.md           # This file - project structure documentation
```

## File Descriptions

### Root Level Files

- **Dockerfile**: Multi-stage Alpine Linux build optimized for production
- **docker-compose.yml**: Complete orchestration with Nginx Proxy Manager integration
- **quick-start.sh**: Single command to start the entire application
- **README.md**: Comprehensive project documentation with API reference
- **LICENSE**: MIT License for open source distribution
- **.gitignore**: Configured for Node.js, Docker, and development environments

### Documentation Files

- **CONTRIBUTING.md**: Complete guide for contributors including development workflow
- **CHANGELOG.md**: Semantic versioning and release history
- **STRUCTURE.md**: This documentation explaining project organization

### Scripts Directory

- **scripts/manage.sh**: Master management script with commands for:
  - `build`: Build Docker image
  - `start`: Start application
  - `stop`: Stop application  
  - `restart`: Restart application
  - `logs`: View application logs
  - `shell`: Enter container shell
  - `test`: Run API tests
  - `clean`: Clean up containers and images
  - `backup`: Backup database
  - `restore`: Restore from backup

### Volumes Directory

Contains the actual Node.js application that runs inside the Docker container:

- **app/server.js**: Main Express.js application with:
  - RESTful API endpoints
  - SQLite database integration
  - Rate limiting and security middleware
  - CORS configuration
  - Health check endpoint

- **app/package.json**: Dependencies including:
  - Express.js for web framework
  - SQLite3 for database
  - express-rate-limit for API protection
  - helmet for security headers
  - cors for cross-origin requests

- **app/.env.example**: Configuration template for:
  - Port settings
  - Database location
  - Rate limiting configuration
  - Environment variables

### GitHub Integration

- **.github/workflows/ci-cd.yml**: Automated pipeline for:
  - Code quality checks
  - Security vulnerability scanning
  - Automated testing
  - Docker image building
  - Release management

## Data Persistence

- **data/**: Created automatically, contains SQLite database
- **logs/**: Application logs (if configured)

## Security Considerations

- Container runs as non-root user
- Database stored in persistent volume
- Rate limiting enabled by default
- Input sanitization implemented
- Security headers configured

## Development Workflow

1. Clone repository
2. Run `./quick-start.sh` for immediate startup
3. Use `./scripts/manage.sh test` to verify functionality
4. Develop with hot-reload using Docker volumes
5. Test with `./volumes/app/test-api.sh`
6. Deploy using Docker Compose

## Production Deployment

- Designed for integration with Nginx Proxy Manager
- Supports custom domains and SSL
- Database automatically backed up
- Health checks configured
- Logging to stdout for container orchestration

## Maintenance

- Use `manage.sh` script for all operations
- Regular database backups recommended
- Monitor logs for performance and errors
- Update dependencies regularly

This structure ensures the project is:
- **Maintainable**: Clear separation of concerns
- **Scalable**: Docker-based architecture
- **Documented**: Comprehensive guides for users and contributors
- **Testable**: Automated testing and validation
- **Deployable**: Production-ready configuration
