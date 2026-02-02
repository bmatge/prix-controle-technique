#!/bin/bash
set -e

echo "🛑 Arrêt des conteneurs..."
docker compose down

echo "📥 Récupération des dernières modifications..."
git pull

echo "🔨 Build de l'image (sans cache)..."
docker compose build --no-cache

echo "🚀 Démarrage des conteneurs..."
docker compose up -d

echo "✅ Déploiement terminé !"
echo "🌐 https://controle-technique.matge.com"
