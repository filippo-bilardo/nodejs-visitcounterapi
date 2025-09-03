#!/bin/bash
# Script per aggiornare gli URL del repository nei file di documentazione

GITHUB_USERNAME="filippo-bilardo"
REPO_NAME="nodejs-visitcounterapi"
GITHUB_URL="https://github.com/${GITHUB_USERNAME}/${REPO_NAME}"

echo "🔄 Aggiornamento URL GitHub nei file di documentazione..."

# Aggiorna README.md principale
sed -i "s|https://github.com/your-username/nodejs-visitcounterapi|${GITHUB_URL}|g" README.md
sed -i "s|your-username|${GITHUB_USERNAME}|g" README.md

# Aggiorna README dell'app
sed -i "s|https://github.com/your-username/nodejs-visitcounterapi|${GITHUB_URL}|g" volumes/app/README.md
sed -i "s|your-username|${GITHUB_USERNAME}|g" volumes/app/README.md

# Aggiorna CONTRIBUTING.md
sed -i "s|https://github.com/your-username/nodejs-visitcounterapi|${GITHUB_URL}|g" CONTRIBUTING.md
sed -i "s|your-username|${GITHUB_USERNAME}|g" CONTRIBUTING.md

echo "✅ URL aggiornati per: ${GITHUB_URL}"
echo "📝 Esegui git commit per salvare le modifiche"
