import { createClient } from '@supabase/supabase-js';

// Use environment variables for Supabase connection
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  console.error('As variáveis de ambiente SUPABASE_URL e SUPABASE_KEY são necessárias para a conexão com o Supabase.');
}

// Cria cliente administrativo do Supabase para acesso total aos dados
export const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

// Função para sincronizar dados entre PostgreSQL local e Supabase
export async function syncDataWithSupabase() {
  try {
    console.log('Iniciando sincronização com Supabase...');
    
    // Aqui podemos implementar a lógica para sincronizar dados entre
    // o banco local e o Supabase, como sincronizar usuários, perfis, etc.
    // Por enquanto, apenas verificamos se a conexão está funcionando
    
    const { data, error } = await supabaseAdmin.from('profiles').select('*').limit(5);
    
    if (error) {
      console.error('Erro ao conectar com Supabase:', error);
    } else {
      console.log(`Conexão com Supabase estabelecida com sucesso. ${data.length} perfis encontrados.`);
    }
    
    return { success: !error, data };
  } catch (error) {
    console.error('Erro ao sincronizar com Supabase:', error);
    return { success: false, error };
  }
}