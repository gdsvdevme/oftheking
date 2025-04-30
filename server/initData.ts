import { db } from "./db";
import {
  clients,
  services,
  appointments,
  appointmentServices,
  blockedSchedules,
  inventory,
  financialTransactions
} from "@shared/schema";
import { importDataFromSupabase } from "./syncSupabase";

export async function initializeDatabase() {
  console.log("Verificando a existência de dados no banco de dados...");
  
  try {
    // Verificar se existem dados no banco de dados local
    const existingClients = await db.select().from(clients);
    const existingServices = await db.select().from(services);
    const existingInventory = await db.select().from(inventory);
    const existingAppointments = await db.select().from(appointments);
    
    const noLocalData = existingClients.length === 0 && 
                        existingServices.length === 0 && 
                        existingInventory.length === 0 && 
                        existingAppointments.length === 0;
    
    // Se não houver dados locais, importar do Supabase
    if (noLocalData) {
      console.log("Banco de dados local vazio. Importando dados do Supabase...");
      
      // Importar dados do Supabase para o banco local
      const importResult = await importDataFromSupabase();
      
      if (importResult.success) {
        console.log("Dados importados do Supabase com sucesso!");
        if (importResult.result) {
          console.log(`Clientes: ${importResult.result.clients.added} adicionados, ${importResult.result.clients.updated} atualizados`);
          console.log(`Serviços: ${importResult.result.services.added} adicionados, ${importResult.result.services.updated} atualizados`);
          console.log(`Agendamentos: ${importResult.result.appointments.added} adicionados, ${importResult.result.appointments.updated} atualizados`);
          console.log(`Inventário: ${importResult.result.inventory.added} adicionados, ${importResult.result.inventory.updated} atualizados`);
        }
      } else {
        console.error("Falha na importação de dados do Supabase:", importResult.error);
        console.log("Criando estrutura básica do banco de dados local...");
        
        // Se a importação falhar e o banco estiver vazio, criar pelo menos um cliente e um serviço
        // para permitir o funcionamento básico do sistema
        await createMinimalLocalData();
      }
    } else {
      console.log("Banco de dados local já possui dados. Sincronização não é necessária na inicialização.");
    }
    
    console.log("Inicialização de dados concluída.");
  } catch (error) {
    console.error("Erro ao inicializar os dados:", error);
    
    // Em caso de erro, garantir que pelo menos a estrutura mínima existe
    try {
      const existingClients = await db.select().from(clients);
      if (existingClients.length === 0) {
        console.log("Criando estrutura mínima do banco de dados após erro...");
        await createMinimalLocalData();
      }
    } catch (fallbackError) {
      console.error("Erro crítico na inicialização do banco de dados:", fallbackError);
    }
  }
}

/**
 * Cria dados locais mínimos para permitir o funcionamento do sistema
 * Essa função só é chamada se a importação do Supabase falhar E o banco local estiver vazio
 */
async function createMinimalLocalData() {
  try {
    // Criar pelo menos um cliente
    const clientsCount = await db.select().from(clients).then(rows => rows.length);
    if (clientsCount === 0) {
      await db.insert(clients).values({
        name: "Cliente Padrão",
        phone: "(00) 00000-0000", 
        created_at: new Date()
      });
    }
    
    // Criar pelo menos um serviço
    const servicesCount = await db.select().from(services).then(rows => rows.length);
    if (servicesCount === 0) {
      await db.insert(services).values({
        name: "Serviço Padrão",
        price: "50",
        duration: 60,
        created_at: new Date()
      });
    }
    
    console.log("Estrutura mínima do banco de dados criada com sucesso.");
  } catch (error) {
    console.error("Erro ao criar estrutura mínima do banco de dados:", error);
  }
}