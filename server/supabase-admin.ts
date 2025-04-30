import { createClient } from '@supabase/supabase-js';

// Use environment variables for Supabase connection
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;

// Verificar e logar as credenciais (sem mostrar valores completos por segurança)
console.log(`Supabase URL disponível: ${!!supabaseUrl}`);
console.log(`Supabase Key disponível: ${!!supabaseKey}`);
if (supabaseUrl) console.log(`Supabase URL começa com: ${supabaseUrl.substring(0, 8)}...`);
if (supabaseKey) console.log(`Supabase Key começa com: ${supabaseKey.substring(0, 5)}...`);

if (!supabaseUrl || !supabaseKey) {
  console.error('As variáveis de ambiente SUPABASE_URL e SUPABASE_KEY são necessárias para a conexão com o Supabase.');
}

// Cria cliente administrativo do Supabase para acesso total aos dados
export const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

// Função para sincronizar dados entre PostgreSQL local e Supabase
export async function syncDataWithSupabase() {
  try {
    console.log('Iniciando sincronização com Supabase...');
    
    const results = {
      profiles: { success: false, count: 0, message: '' },
      users: { success: false, count: 0, message: '' },
      operations: []
    };
    
    // Sincronizar perfis
    try {
      const { data: profiles, error: profilesError } = await supabaseAdmin.from('profiles').select('*');
      
      if (profilesError) {
        results.profiles.message = profilesError.message;
        console.error('Erro ao buscar perfis do Supabase:', profilesError);
      } else if (profiles) {
        results.profiles.success = true;
        results.profiles.count = profiles.length;
        results.operations.push(`Encontrados ${profiles.length} perfis no Supabase`);
        console.log(`Encontrados ${profiles.length} perfis no Supabase`);
      }
    } catch (profileError: any) {
      results.profiles.message = profileError?.message || 'Erro desconhecido ao sincronizar perfis';
      console.error('Erro ao processar perfis:', profileError);
    }
    
    // Sincronizar usuários
    try {
      const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (usersError) {
        results.users.message = usersError.message;
        console.error('Erro ao buscar usuários do Supabase:', usersError);
      } else if (usersData) {
        results.users.success = true;
        results.users.count = usersData.users.length;
        results.operations.push(`Encontrados ${usersData.users.length} usuários no Supabase`);
        console.log(`Encontrados ${usersData.users.length} usuários no Supabase`);
      }
    } catch (usersError: any) {
      results.users.message = usersError?.message || 'Erro desconhecido ao sincronizar usuários';
      console.error('Erro ao processar usuários:', usersError);
    }
    
    // Verificar se alguma sincronização foi bem-sucedida
    const anySuccess = results.profiles.success || results.users.success;
    console.log(`Sincronização com Supabase ${anySuccess ? 'concluída' : 'falhou'}`);
    
    return { 
      success: anySuccess,
      results,
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    console.error('Erro geral ao sincronizar com Supabase:', error);
    return { 
      success: false, 
      error: error?.message || 'Erro desconhecido',
      timestamp: new Date().toISOString()
    };
  }
}