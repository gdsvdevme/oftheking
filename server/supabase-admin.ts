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
// Função para sincronizar dados entre PostgreSQL local e Supabase
export async function syncDataWithSupabase() {
  try {
    console.log('Iniciando sincronização com Supabase...');
    
    const results = {
      profiles: { success: false, count: 0, message: '' },
      users: { success: false, count: 0, message: '' },
      clients: { success: false, count: 0, message: '' },
      appointments: { success: false, count: 0, message: '' },
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
        
        // TODO: Aqui podemos implementar a sincronização dos perfis com o banco local
        // Deveríamos criar ou atualizar perfis no PostgreSQL local para corresponder aos do Supabase
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
        
        // TODO: Aqui podemos implementar a sincronização dos usuários com o banco local
        // Deveríamos criar ou atualizar usuários no PostgreSQL local para corresponder aos do Supabase
      }
    } catch (usersError: any) {
      results.users.message = usersError?.message || 'Erro desconhecido ao sincronizar usuários';
      console.error('Erro ao processar usuários:', usersError);
    }
    
    // Sincronizar clientes
    try {
      // Esta é uma tabela personalizada que deve ser criada no Supabase
      const { data: clients, error: clientsError } = await supabaseAdmin.from('clientes').select('*');
      
      if (clientsError) {
        results.clients.message = clientsError.message;
        console.error('Erro ao buscar clientes do Supabase:', clientsError);
      } else if (clients) {
        results.clients.success = true;
        results.clients.count = clients.length;
        results.operations.push(`Encontrados ${clients.length} clientes no Supabase`);
        console.log(`Encontrados ${clients.length} clientes no Supabase`);
        
        // TODO: Aqui implementaríamos a sincronização dos clientes com o banco local
        // Teríamos que converter o formato dos dados do Supabase para o formato do nosso modelo local
      }
    } catch (clientsError: any) {
      results.clients.message = clientsError?.message || 'Erro desconhecido ao sincronizar clientes';
      console.error('Erro ao processar clientes:', clientsError);
    }
    
    // Sincronizar agendamentos
    try {
      // Esta é uma tabela personalizada que deve ser criada no Supabase
      const { data: appointments, error: appointmentsError } = await supabaseAdmin.from('agendamentos').select('*');
      
      if (appointmentsError) {
        results.appointments.message = appointmentsError.message;
        console.error('Erro ao buscar agendamentos do Supabase:', appointmentsError);
      } else if (appointments) {
        results.appointments.success = true;
        results.appointments.count = appointments.length;
        results.operations.push(`Encontrados ${appointments.length} agendamentos no Supabase`);
        console.log(`Encontrados ${appointments.length} agendamentos no Supabase`);
        
        // TODO: Aqui implementaríamos a sincronização dos agendamentos com o banco local
      }
    } catch (appointmentsError: any) {
      results.appointments.message = appointmentsError?.message || 'Erro desconhecido ao sincronizar agendamentos';
      console.error('Erro ao processar agendamentos:', appointmentsError);
    }
    
    // Verificar se alguma sincronização foi bem-sucedida
    const anySuccess = results.profiles.success || results.users.success || 
                       results.clients.success || results.appointments.success;
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

// Função para buscar clientes do Supabase
export async function getSupabaseClients() {
  try {
    const { data, error } = await supabaseAdmin.from('clientes').select('*');
    
    if (error) {
      console.error('Erro ao buscar clientes do Supabase:', error);
      return { success: false, error: error.message };
    }
    
    return { 
      success: true, 
      clients: data || [],
      count: data?.length || 0
    };
  } catch (error: any) {
    console.error('Erro ao buscar clientes do Supabase:', error);
    return { 
      success: false, 
      error: error?.message || 'Erro desconhecido'
    };
  }
}

// Função para buscar agendamentos do Supabase
export async function getSupabaseAppointments() {
  try {
    const { data, error } = await supabaseAdmin.from('agendamentos').select('*');
    
    if (error) {
      console.error('Erro ao buscar agendamentos do Supabase:', error);
      return { success: false, error: error.message };
    }
    
    return { 
      success: true, 
      appointments: data || [],
      count: data?.length || 0
    };
  } catch (error: any) {
    console.error('Erro ao buscar agendamentos do Supabase:', error);
    return { 
      success: false, 
      error: error?.message || 'Erro desconhecido'
    };
  }
}