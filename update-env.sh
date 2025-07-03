#!/bin/bash

# Nome file .env
ENV_FILE=".env.local"

# Rimuove righe già presenti
sed -i '' '/^NEXT_PUBLIC_ENV=/d' "$ENV_FILE"
sed -i '' '/^NEXT_PUBLIC_GIT_COMMIT_REF=/d' "$ENV_FILE"
sed -i '' '/^NEXT_PUBLIC_GIT_COMMIT_SHA=/d' "$ENV_FILE"

# Aggiunge righe aggiornate
echo "NEXT_PUBLIC_ENV=Loc" >> "$ENV_FILE"
echo "NEXT_PUBLIC_GIT_COMMIT_REF=$(git rev-parse --abbrev-ref HEAD)" >> "$ENV_FILE"
echo "NEXT_PUBLIC_GIT_COMMIT_SHA=$(git rev-parse --short HEAD)" >> "$ENV_FILE"

echo "✅ .env.local aggiornato con ENV, branch e commit breve" 