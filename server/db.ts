import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

// Usar as variáveis de ambiente do Supabase
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "SUPABASE_URL e SUPABASE_KEY devem estar definidos. Configure as variáveis de ambiente corretamente.",
  );
}

// Extrair a string de conexão do PostgreSQL a partir da URL do Supabase
// Formato típico do Supabase: https://[project-ref].supabase.co
// Extraímos o [project-ref] e construímos a URL de conexão PostgreSQL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  throw new Error(
    "Formato de SUPABASE_URL inválido. Deve ser no formato https://[project-ref].supabase.co",
  );
}

// Construir a URL de conexão PostgreSQL para o Supabase
// Formato: postgres://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
// A chave anon é a mesma que a chave supabaseKey
const postgresUrl = `postgres://postgres:${supabaseKey}@db.${projectRef}.supabase.co:5432/postgres`;

// Criar cliente Postgres.js
const client = postgres(postgresUrl, { 
  max: 10, // Limitar o número de conexões
  prepare: false, // Desativar prepared statements por compatibilidade
  ssl: true // Habilitar SSL para conexões seguras
});

// Criar cliente Drizzle usando Postgres.js
export const db = drizzle(client, { schema });

// Criar cliente Supabase para operações que usam a API REST
export const supabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-client',
    },
  },
});