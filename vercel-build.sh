#!/bin/bash

# Executar o build normal através do npm
npm run build

# Criar pasta para a função serverless
mkdir -p dist/api

# Compilar o arquivo de API para Edge Function com esbuild
npx esbuild api/index.js --platform=neutral --packages=external --bundle --format=esm --outdir=dist/api

# Atualizar as extensões de importação no arquivo compilado para incluir .js
# Isso é necessário porque o Node ESM exige extensões explícitas
sed -i 's/from "\(\.\.\/server\/[^"]*\)"/from "\1.js"/g' dist/api/index.js

# Copiar o arquivo de API para a pasta de distribuição
cp api/index.js dist/api/index.js

# Garantir que os arquivos de servidor estejam disponíveis na pasta de distribuição
mkdir -p dist/server
cp -r server/*.js dist/server/