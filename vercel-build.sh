#!/bin/bash

# Executar o build normal através do npm
npm run build

# Criar pasta para a função serverless
mkdir -p dist/api

# Compilar o arquivo de API para serverless com esbuild
npx esbuild api/server.js --platform=node --packages=external --bundle --format=esm --outdir=dist/api