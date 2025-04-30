import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Verifica se as variáveis de ambiente estão definidas
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  throw new Error('SUPABASE_URL e SUPABASE_KEY devem estar definidos nas variáveis de ambiente');
}

// Cria e exporta o cliente Supabase
export const supabase = createClient<Database>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);