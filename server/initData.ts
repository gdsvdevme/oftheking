import { supabase } from "./db";

/**
 * Inicializa o aplicativo verificando a conexão com o banco de dados
 * Usando apenas o Supabase para todas as operações de banco de dados
 */
export async function initializeDatabase() {
  console.log("Verificando a conexão com o banco de dados do Supabase...");
  
  try {
    // Verificar se a conexão com o Supabase está funcionando
    // tentando obter a contagem de clientes
    const { count, error } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      throw new Error(`Erro ao conectar ao Supabase: ${error.message}`);
    }
    
    console.log(`Conexão com o Supabase estabelecida com sucesso. Existem ${count} clientes cadastrados.`);
    
    // Verificar tabelas principais para confirmar que estão acessíveis
    const tabelas = ['clients', 'appointments', 'services', 'inventory'];
    for (const tabela of tabelas) {
      const { count, error } = await supabase
        .from(tabela)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.warn(`Aviso: Não foi possível acessar a tabela ${tabela}: ${error.message}`);
      } else {
        console.log(`Tabela ${tabela}: ${count} registros encontrados`);
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