#!/bin/bash

# Usar script de build original do package.json (vite build + esbuild server/index.ts)
vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Criar pasta para a função serverless API
mkdir -p dist/api

# Compilar o arquivo de API para Edge Function com esbuild
npx esbuild api/index.js --platform=neutral --packages=external --bundle --format=esm --outdir=dist/api

# Compilar arquivos TypeScript do servidor para JavaScript
npx esbuild server/*.ts --platform=node --packages=external --format=esm --outdir=dist/server

# Atualizar as extensões de importação no arquivo compilado para incluir .js
# Isso é necessário porque o Node ESM exige extensões explícitas
sed -i 's/from "\(\.\.\/server\/[^"]*\)"/from "\1.js"/g' dist/api/index.js || true

# Garantir que todas as pastas necessárias existam
mkdir -p dist/public