import { db } from "./db";
import { supabaseAdmin } from "./supabase-admin";
import {
  clients, appointments, services, appointmentServices,
  blockedSchedules, inventory, sales, saleItems, financialTransactions
} from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Importa dados do Supabase para o banco de dados PostgreSQL local
 * Esta função preserva os dados existentes e sincroniza novos registros
 */
export async function importDataFromSupabase() {
  const result = {
    clients: { added: 0, updated: 0, errors: 0 },
    appointments: { added: 0, updated: 0, errors: 0 },
    services: { added: 0, updated: 0, errors: 0 },
    inventory: { added: 0, updated: 0, errors: 0 },
    operations: [] as string[]
  };

  try {
    console.log('Iniciando importação de dados do Supabase...');
    
    // Importar clientes
    try {
      const { data: supabaseClients, error } = await supabaseAdmin.from('clients').select('*');
      
      if (error) throw error;
      
      if (supabaseClients && supabaseClients.length > 0) {
        for (const client of supabaseClients) {
          try {
            // Verificar se o cliente já existe
            const existingClient = await db.select().from(clients).where(eq(clients.id, client.id));
            
            if (existingClient.length === 0) {
              // Cliente não existe, inserir
              await db.insert(clients).values({
                id: client.id,
                name: client.name,
                phone: client.phone || null,
                created_at: new Date(client.created_at),
                created_by: client.created_by || null
              });
              result.clients.added++;
            } else {
              // Cliente existe, atualizar
              await db.update(clients)
                .set({
                  name: client.name,
                  phone: client.phone || null,
                  created_by: client.created_by || null
                })
                .where(eq(clients.id, client.id));
              result.clients.updated++;
            }
          } catch (clientError) {
            console.error(`Erro ao processar cliente ${client.id}:`, clientError);
            result.clients.errors++;
          }
        }
        
        result.operations.push(`Clientes: ${result.clients.added} adicionados, ${result.clients.updated} atualizados`);
      }
    } catch (clientsError) {
      console.error('Erro ao importar clientes:', clientsError);
      result.operations.push(`ERRO: Falha ao importar clientes - ${clientsError.message}`);
    }
    
    // Importar serviços
    try {
      const { data: supabaseServices, error } = await supabaseAdmin.from('services').select('*');
      
      if (error) throw error;
      
      if (supabaseServices && supabaseServices.length > 0) {
        for (const service of supabaseServices) {
          try {
            // Verificar se o serviço já existe
            const existingService = await db.select().from(services).where(eq(services.id, service.id));
            
            if (existingService.length === 0) {
              // Serviço não existe, inserir
              await db.insert(services).values({
                id: service.id,
                name: service.name,
                price: service.price.toString(),
                duration: service.duration,
                created_at: new Date(service.created_at),
                created_by: service.created_by || null
              });
              result.services.added++;
            } else {
              // Serviço existe, atualizar
              await db.update(services)
                .set({
                  name: service.name,
                  price: service.price.toString(),
                  duration: service.duration,
                  created_by: service.created_by || null
                })
                .where(eq(services.id, service.id));
              result.services.updated++;
            }
          } catch (serviceError) {
            console.error(`Erro ao processar serviço ${service.id}:`, serviceError);
            result.services.errors++;
          }
        }
        
        result.operations.push(`Serviços: ${result.services.added} adicionados, ${result.services.updated} atualizados`);
      }
    } catch (servicesError) {
      console.error('Erro ao importar serviços:', servicesError);
      result.operations.push(`ERRO: Falha ao importar serviços - ${servicesError.message}`);
    }
    
    // Importar agendamentos
    try {
      const { data: supabaseAppointments, error } = await supabaseAdmin.from('appointments').select('*');
      
      if (error) throw error;
      
      if (supabaseAppointments && supabaseAppointments.length > 0) {
        for (const appointment of supabaseAppointments) {
          try {
            // Verificar se o agendamento já existe
            const existingAppointment = await db.select().from(appointments).where(eq(appointments.id, appointment.id));
            
            if (existingAppointment.length === 0) {
              // Agendamento não existe, inserir
              await db.insert(appointments).values({
                id: appointment.id,
                client_id: appointment.client_id,
                start_time: new Date(appointment.start_time),
                end_time: new Date(appointment.end_time),
                status: appointment.status,
                notes: appointment.notes || null,
                created_at: new Date(appointment.created_at),
                created_by: appointment.created_by || null,
                final_price: appointment.final_price ? appointment.final_price.toString() : "0",
                recurrence: appointment.recurrence || null,
                payment_date: appointment.payment_date ? new Date(appointment.payment_date) : null,
                payment_status: appointment.payment_status || "pending"
              });
              result.appointments.added++;
            } else {
              // Agendamento existe, atualizar
              await db.update(appointments)
                .set({
                  client_id: appointment.client_id,
                  start_time: new Date(appointment.start_time),
                  end_time: new Date(appointment.end_time),
                  status: appointment.status,
                  notes: appointment.notes || null,
                  created_by: appointment.created_by || null,
                  final_price: appointment.final_price ? appointment.final_price.toString() : "0",
                  recurrence: appointment.recurrence || null,
                  payment_date: appointment.payment_date ? new Date(appointment.payment_date) : null,
                  payment_status: appointment.payment_status || "pending"
                })
                .where(eq(appointments.id, appointment.id));
              result.appointments.updated++;
            }
          } catch (appointmentError) {
            console.error(`Erro ao processar agendamento ${appointment.id}:`, appointmentError);
            result.appointments.errors++;
          }
        }
        
        result.operations.push(`Agendamentos: ${result.appointments.added} adicionados, ${result.appointments.updated} atualizados`);
      }
    } catch (appointmentsError) {
      console.error('Erro ao importar agendamentos:', appointmentsError);
      result.operations.push(`ERRO: Falha ao importar agendamentos - ${appointmentsError.message}`);
    }
    
    // Importar inventário
    try {
      const { data: supabaseInventory, error } = await supabaseAdmin.from('inventory').select('*');
      
      if (error) throw error;
      
      if (supabaseInventory && supabaseInventory.length > 0) {
        for (const item of supabaseInventory) {
          try {
            // Verificar se o item já existe
            const existingItem = await db.select().from(inventory).where(eq(inventory.id, item.id));
            
            if (existingItem.length === 0) {
              // Item não existe, inserir
              await db.insert(inventory).values({
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                cost_price: item.cost_price.toString(),
                selling_price: item.selling_price.toString(),
                category: item.category || "Geral",
                created_at: new Date(item.created_at),
                created_by: item.created_by || null
              });
              result.inventory.added++;
            } else {
              // Item existe, atualizar
              await db.update(inventory)
                .set({
                  name: item.name,
                  quantity: item.quantity,
                  cost_price: item.cost_price.toString(),
                  selling_price: item.selling_price.toString(),
                  category: item.category || "Geral",
                  created_by: item.created_by || null
                })
                .where(eq(inventory.id, item.id));
              result.inventory.updated++;
            }
          } catch (inventoryError) {
            console.error(`Erro ao processar item de inventário ${item.id}:`, inventoryError);
            result.inventory.errors++;
          }
        }
        
        result.operations.push(`Inventário: ${result.inventory.added} adicionados, ${result.inventory.updated} atualizados`);
      }
    } catch (inventoryError) {
      console.error('Erro ao importar inventário:', inventoryError);
      result.operations.push(`ERRO: Falha ao importar inventário - ${inventoryError.message}`);
    }
    
    console.log('Importação de dados do Supabase concluída');
    return {
      success: true,
      result,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Erro geral na importação do Supabase:', error);
    return {
      success: false,
      error: error.message || 'Erro desconhecido',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Exporta dados do PostgreSQL local para o Supabase
 * Esta função envia apenas dados que ainda não existem no Supabase
 */
export async function exportDataToSupabase() {
  const result = {
    clients: { added: 0, updated: 0, errors: 0 },
    appointments: { added: 0, updated: 0, errors: 0 },
    services: { added: 0, updated: 0, errors: 0 },
    inventory: { added: 0, updated: 0, errors: 0 },
    operations: [] as string[]
  };

  try {
    console.log('Iniciando exportação de dados para o Supabase...');
    
    // Exportar clientes
    try {
      // Obter todos os clientes do banco local
      const localClients = await db.select().from(clients);
      
      for (const client of localClients) {
        try {
          // Verificar se o cliente já existe no Supabase
          const { data: existingClient, error: checkError } = await supabaseAdmin
            .from('clients')
            .select('id')
            .eq('id', client.id)
            .maybeSingle();
          
          if (checkError) throw checkError;
          
          if (!existingClient) {
            // Cliente não existe no Supabase, inserir
            const { error: insertError } = await supabaseAdmin
              .from('clients')
              .insert({
                id: client.id,
                name: client.name,
                phone: client.phone,
                created_at: client.created_at?.toISOString(),
                created_by: client.created_by
              });
            
            if (insertError) throw insertError;
            result.clients.added++;
          } else {
            // Cliente existe, atualizar
            const { error: updateError } = await supabaseAdmin
              .from('clients')
              .update({
                name: client.name,
                phone: client.phone,
                created_by: client.created_by
              })
              .eq('id', client.id);
            
            if (updateError) throw updateError;
            result.clients.updated++;
          }
        } catch (clientError) {
          console.error(`Erro ao exportar cliente ${client.id}:`, clientError);
          result.clients.errors++;
        }
      }
      
      result.operations.push(`Clientes: ${result.clients.added} adicionados, ${result.clients.updated} atualizados no Supabase`);
    } catch (clientsError) {
      console.error('Erro ao exportar clientes:', clientsError);
      result.operations.push(`ERRO: Falha ao exportar clientes - ${clientsError.message}`);
    }
    
    // Exportar serviços
    try {
      // Obter todos os serviços do banco local
      const localServices = await db.select().from(services);
      
      for (const service of localServices) {
        try {
          // Verificar se o serviço já existe no Supabase
          const { data: existingService, error: checkError } = await supabaseAdmin
            .from('services')
            .select('id')
            .eq('id', service.id)
            .maybeSingle();
          
          if (checkError) throw checkError;
          
          if (!existingService) {
            // Serviço não existe no Supabase, inserir
            const { error: insertError } = await supabaseAdmin
              .from('services')
              .insert({
                id: service.id,
                name: service.name,
                price: service.price,
                duration: service.duration,
                created_at: service.created_at?.toISOString(),
                created_by: service.created_by
              });
            
            if (insertError) throw insertError;
            result.services.added++;
          } else {
            // Serviço existe, atualizar
            const { error: updateError } = await supabaseAdmin
              .from('services')
              .update({
                name: service.name,
                price: service.price,
                duration: service.duration,
                created_by: service.created_by
              })
              .eq('id', service.id);
            
            if (updateError) throw updateError;
            result.services.updated++;
          }
        } catch (serviceError) {
          console.error(`Erro ao exportar serviço ${service.id}:`, serviceError);
          result.services.errors++;
        }
      }
      
      result.operations.push(`Serviços: ${result.services.added} adicionados, ${result.services.updated} atualizados no Supabase`);
    } catch (servicesError) {
      console.error('Erro ao exportar serviços:', servicesError);
      result.operations.push(`ERRO: Falha ao exportar serviços - ${servicesError.message}`);
    }
    
    // Exportar agendamentos
    try {
      // Obter todos os agendamentos do banco local
      const localAppointments = await db.select().from(appointments);
      
      for (const appointment of localAppointments) {
        try {
          // Verificar se o agendamento já existe no Supabase
          const { data: existingAppointment, error: checkError } = await supabaseAdmin
            .from('appointments')
            .select('id')
            .eq('id', appointment.id)
            .maybeSingle();
          
          if (checkError) throw checkError;
          
          if (!existingAppointment) {
            // Agendamento não existe no Supabase, inserir
            const { error: insertError } = await supabaseAdmin
              .from('appointments')
              .insert({
                id: appointment.id,
                client_id: appointment.client_id,
                start_time: appointment.start_time?.toISOString(),
                end_time: appointment.end_time?.toISOString(),
                status: appointment.status,
                notes: appointment.notes,
                created_at: appointment.created_at?.toISOString(),
                created_by: appointment.created_by,
                final_price: appointment.final_price,
                recurrence: appointment.recurrence,
                payment_date: appointment.payment_date?.toISOString(),
                payment_status: appointment.payment_status
              });
            
            if (insertError) throw insertError;
            result.appointments.added++;
          } else {
            // Agendamento existe, atualizar
            const { error: updateError } = await supabaseAdmin
              .from('appointments')
              .update({
                client_id: appointment.client_id,
                start_time: appointment.start_time?.toISOString(),
                end_time: appointment.end_time?.toISOString(),
                status: appointment.status,
                notes: appointment.notes,
                created_by: appointment.created_by,
                final_price: appointment.final_price,
                recurrence: appointment.recurrence,
                payment_date: appointment.payment_date?.toISOString(),
                payment_status: appointment.payment_status
              })
              .eq('id', appointment.id);
            
            if (updateError) throw updateError;
            result.appointments.updated++;
          }
        } catch (appointmentError) {
          console.error(`Erro ao exportar agendamento ${appointment.id}:`, appointmentError);
          result.appointments.errors++;
        }
      }
      
      result.operations.push(`Agendamentos: ${result.appointments.added} adicionados, ${result.appointments.updated} atualizados no Supabase`);
    } catch (appointmentsError) {
      console.error('Erro ao exportar agendamentos:', appointmentsError);
      result.operations.push(`ERRO: Falha ao exportar agendamentos - ${appointmentsError.message}`);
    }
    
    // Exportar inventário
    try {
      // Obter todos os itens do banco local
      const localInventory = await db.select().from(inventory);
      
      for (const item of localInventory) {
        try {
          // Verificar se o item já existe no Supabase
          const { data: existingItem, error: checkError } = await supabaseAdmin
            .from('inventory')
            .select('id')
            .eq('id', item.id)
            .maybeSingle();
          
          if (checkError) throw checkError;
          
          if (!existingItem) {
            // Item não existe no Supabase, inserir
            const { error: insertError } = await supabaseAdmin
              .from('inventory')
              .insert({
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                cost_price: item.cost_price,
                selling_price: item.selling_price,
                category: item.category,
                created_at: item.created_at?.toISOString(),
                created_by: item.created_by
              });
            
            if (insertError) throw insertError;
            result.inventory.added++;
          } else {
            // Item existe, atualizar
            const { error: updateError } = await supabaseAdmin
              .from('inventory')
              .update({
                name: item.name,
                quantity: item.quantity,
                cost_price: item.cost_price,
                selling_price: item.selling_price,
                category: item.category,
                created_by: item.created_by
              })
              .eq('id', item.id);
            
            if (updateError) throw updateError;
            result.inventory.updated++;
          }
        } catch (inventoryError) {
          console.error(`Erro ao exportar item de inventário ${item.id}:`, inventoryError);
          result.inventory.errors++;
        }
      }
      
      result.operations.push(`Inventário: ${result.inventory.added} adicionados, ${result.inventory.updated} atualizados no Supabase`);
    } catch (inventoryError) {
      console.error('Erro ao exportar inventário:', inventoryError);
      result.operations.push(`ERRO: Falha ao exportar inventário - ${inventoryError.message}`);
    }
    
    console.log('Exportação de dados para o Supabase concluída');
    return {
      success: true,
      result,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Erro geral na exportação para o Supabase:', error);
    return {
      success: false,
      error: error.message || 'Erro desconhecido',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Realiza a sincronização completa entre o PostgreSQL local e o Supabase
 * 1. Importa dados do Supabase para o PostgreSQL local
 * 2. Exporta dados do PostgreSQL local para o Supabase
 */
export async function fullSyncWithSupabase() {
  try {
    console.log('Iniciando sincronização completa com Supabase...');
    
    // Primeiro, importamos dados do Supabase para o PostgreSQL local
    const importResult = await importDataFromSupabase();
    
    // Em seguida, exportamos dados do PostgreSQL local para o Supabase
    const exportResult = await exportDataToSupabase();
    
    return {
      success: importResult.success && exportResult.success,
      import: importResult,
      export: exportResult,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Erro na sincronização completa com Supabase:', error);
    return {
      success: false,
      error: error.message || 'Erro desconhecido',
      timestamp: new Date().toISOString()
    };
  }
}