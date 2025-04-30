import { db, supabaseClient } from "./db";
import {
  clients,
  services,
  appointments,
  appointmentServices,
  blockedSchedules,
  inventory,
  financialTransactions
} from "@shared/schema";

/**
 * Inicializa o aplicativo verificando a conexão com o banco de dados
 * Agora estamos usando o Supabase diretamente, então não é necessário
 * sincronizar ou importar dados
 */
export async function initializeDatabase() {
  console.log("Verificando a conexão com o banco de dados do Supabase...");
  
  try {
    // Verificar se a conexão com o Supabase está funcionando
    // tentando obter a contagem de clientes
    const { count, error } = await supabaseClient
      .from('clients')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      throw new Error(`Erro ao conectar ao Supabase: ${error.message}`);
    }
    
    console.log(`Conexão com o Supabase estabelecida com sucesso. Existem ${count} clientes cadastrados.`);
    
    // Verificar também se podemos acessar os dados via Drizzle
    try {
      const clientsCount = await db.select().from(clients);
      console.log(`Acesso via Drizzle ORM: ${clientsCount.length} clientes recuperados.`);
    } catch (drizzleError) {
      console.error("Erro ao acessar dados via Drizzle ORM:", drizzleError);
      console.log("Verificando permissões e esquema do banco de dados...");
      
      // Tentar verificar a estrutura da tabela
      const { data: tableInfo, error: tableError } = await supabaseClient.rpc('get_tables');
      if (tableError) {
        console.error("Erro ao verificar estrutura do banco de dados:", tableError);
      } else {
        console.log("Tabelas disponíveis no Supabase:", tableInfo);
      }
    }
    
    console.log("Inicialização do banco de dados concluída.");
  } catch (error) {
    console.error("Erro durante a inicialização do banco de dados:", error);
    
    // Em caso de erro crítico na conexão
    console.error("ATENÇÃO: A conexão com o banco de dados do Supabase falhou.");
    console.error("Verifique as credenciais (SUPABASE_URL e SUPABASE_KEY) e a conectividade de rede.");
  }
}