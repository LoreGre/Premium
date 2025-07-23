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

# ================================
# GENERA SNAPSHOT FILE PER CHATGPT
# ================================

if ! command -v tree &> /dev/null; then
  echo "❌ Errore: il comando 'tree' non è installato. Su MacOS puoi installarlo con 'brew install tree'."
  exit 1
fi

SNAPSHOT_FILE="project_snapshot.md"
echo "# Project Premium snapshot - $(date)" > "$SNAPSHOT_FILE"
echo -e "\n## Directory tree\n" >> "$SNAPSHOT_FILE"
tree -I 'node_modules|.git|dist|build' >> "$SNAPSHOT_FILE"

echo -e "\n## File list & contents (.ts/.tsx only)\n" >> "$SNAPSHOT_FILE"
find . \( -name "*.ts" -o -name "*.tsx" \) ! -path "./node_modules/*" ! -path "./.git/*" ! -path "./dist/*" ! -path "./build/*" | while read file; do
  echo -e "\n---\n### $file\n" >> "$SNAPSHOT_FILE"
  cat "$file" >> "$SNAPSHOT_FILE"
done

echo "✅ project_snapshot.md generato per ChatGPT (caricalo in chat se vuoi full contesto .ts/.tsx)"
