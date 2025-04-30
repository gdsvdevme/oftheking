import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  syncDataWithSupabase, 
  supabaseAdmin, 
  getSupabaseClients, 
  getSupabaseAppointments 
} from "./supabase-admin";
import { 
  insertClientSchema, 
  insertServiceSchema, 
  insertAppointmentSchema,
  insertInventorySchema,
  insertBlockedScheduleSchema,
  insertSaleSchema,
  insertFinancialTransactionSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Client routes
  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar clientes" });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar cliente" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const validatedData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(validatedData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao criar cliente" });
    }
  });

  app.put("/api/clients/:id", async (req, res) => {
    try {
      const validatedData = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(req.params.id, validatedData);
      if (!client) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }
      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao atualizar cliente" });
    }
  });

  // Service routes
  app.get("/api/services", async (req, res) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar serviços" });
    }
  });

  app.get("/api/services/:id", async (req, res) => {
    try {
      const service = await storage.getService(req.params.id);
      if (!service) {
        return res.status(404).json({ message: "Serviço não encontrado" });
      }
      res.json(service);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar serviço" });
    }
  });

  app.post("/api/services", async (req, res) => {
    try {
      const validatedData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(validatedData);
      res.status(201).json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao criar serviço" });
    }
  });

  app.put("/api/services/:id", async (req, res) => {
    try {
      const validatedData = insertServiceSchema.partial().parse(req.body);
      const service = await storage.updateService(req.params.id, validatedData);
      if (!service) {
        return res.status(404).json({ message: "Serviço não encontrado" });
      }
      res.json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao atualizar serviço" });
    }
  });

  app.delete("/api/services/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteService(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Serviço não encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir serviço" });
    }
  });

  // Appointment routes
  app.get("/api/appointments", async (req, res) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      // Obtém TODOS os agendamentos sem paginação do servidor
      const allAppointments = await storage.getAllAppointments(startDate, endDate);
      
      // Enrich appointments with client and service data
      const enrichedAppointments = await Promise.all(
        allAppointments.map(async (appointment) => {
          return await storage.getAppointmentWithServices(appointment.id);
        })
      );
      
      // Retornamos todos os dados, a paginação será feita no frontend
      res.json({
        appointments: enrichedAppointments,
        pagination: {
          total: enrichedAppointments.length,
          totalPages: Math.ceil(enrichedAppointments.length / 20) // Mantemos perPage=20 como referência
        }
      });
    } catch (error) {
      console.error("Erro detalhado ao buscar agendamentos:", error);
      res.status(500).json({ 
        message: "Erro ao buscar agendamentos",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get("/api/appointments/upcoming", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const appointments = await storage.getUpcomingAppointments(limit);
      res.json(appointments);
    } catch (error) {
      console.error("Erro detalhado ao buscar agendamentos próximos:", error);
      res.status(500).json({ 
        message: "Erro ao buscar agendamentos próximos",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get("/api/appointments/:id", async (req, res) => {
    try {
      const appointment = await storage.getAppointmentWithServices(req.params.id);
      if (!appointment) {
        return res.status(404).json({ message: "Agendamento não encontrado" });
      }
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar agendamento" });
    }
  });

  app.post("/api/appointments", async (req, res) => {
    try {
      const { service_ids, ...appointmentData } = req.body;
      
      // Converter strings ISO para objetos Date
      if (typeof appointmentData.start_time === 'string') {
        appointmentData.start_time = new Date(appointmentData.start_time);
      }
      
      if (typeof appointmentData.end_time === 'string') {
        appointmentData.end_time = new Date(appointmentData.end_time);
      }
      
      // Validate main appointment data
      const validatedAppointment = insertAppointmentSchema.parse(appointmentData);
      
      // Validate service_ids is an array of strings
      if (!Array.isArray(service_ids) || service_ids.length === 0) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: [{ path: ["service_ids"], message: "Selecione pelo menos um serviço" }] 
        });
      }
      
      console.log('Criando agendamento:', validatedAppointment, service_ids);
      const appointment = await storage.createAppointment(validatedAppointment, service_ids);
      res.status(201).json(appointment);
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ 
        message: "Erro ao criar agendamento", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.put("/api/appointments/:id", async (req, res) => {
    try {
      const appointmentData = req.body;
      
      // Converter strings ISO para objetos Date
      if (typeof appointmentData.start_time === 'string') {
        appointmentData.start_time = new Date(appointmentData.start_time);
      }
      
      if (typeof appointmentData.end_time === 'string') {
        appointmentData.end_time = new Date(appointmentData.end_time);
      }
      
      const validatedData = insertAppointmentSchema.partial().parse(appointmentData);
      const appointment = await storage.updateAppointment(req.params.id, validatedData);
      if (!appointment) {
        return res.status(404).json({ message: "Agendamento não encontrado" });
      }
      res.json(appointment);
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ 
        message: "Erro ao atualizar agendamento",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.delete("/api/appointments/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteAppointment(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Agendamento não encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir agendamento" });
    }
  });

  // Blocked Schedules routes
  app.get("/api/blocked-schedules", async (req, res) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const blockedSchedules = await storage.getBlockedSchedules(startDate, endDate);
      res.json(blockedSchedules);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar horários bloqueados" });
    }
  });

  app.post("/api/blocked-schedules", async (req, res) => {
    try {
      const scheduleData = req.body;
      
      // Converter strings ISO para objetos Date
      if (typeof scheduleData.start_time === 'string') {
        scheduleData.start_time = new Date(scheduleData.start_time);
      }
      
      if (typeof scheduleData.end_time === 'string') {
        scheduleData.end_time = new Date(scheduleData.end_time);
      }
      
      const validatedData = insertBlockedScheduleSchema.parse(scheduleData);
      const blockedSchedule = await storage.createBlockedSchedule(validatedData);
      res.status(201).json(blockedSchedule);
    } catch (error) {
      console.error('Erro ao bloquear horário:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ 
        message: "Erro ao bloquear horário",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.delete("/api/blocked-schedules/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteBlockedSchedule(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Horário bloqueado não encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Erro ao remover horário bloqueado" });
    }
  });

  // Inventory routes
  app.get("/api/inventory", async (req, res) => {
    try {
      const inventory = await storage.getInventory();
      res.json(inventory);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar estoque" });
    }
  });

  app.get("/api/inventory/low-stock", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const lowStockItems = await storage.getLowStockItems(limit);
      res.json(lowStockItems);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar itens com estoque baixo" });
    }
  });

  app.get("/api/inventory/:id", async (req, res) => {
    try {
      const item = await storage.getInventoryItem(req.params.id);
      if (!item) {
        return res.status(404).json({ message: "Item não encontrado" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar item do estoque" });
    }
  });

  app.post("/api/inventory", async (req, res) => {
    try {
      const validatedData = insertInventorySchema.parse(req.body);
      const item = await storage.createInventoryItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao criar item no estoque" });
    }
  });

  app.put("/api/inventory/:id", async (req, res) => {
    try {
      const validatedData = insertInventorySchema.partial().parse(req.body);
      const item = await storage.updateInventoryItem(req.params.id, validatedData);
      if (!item) {
        return res.status(404).json({ message: "Item não encontrado" });
      }
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao atualizar item do estoque" });
    }
  });

  app.put("/api/inventory/:id/quantity", async (req, res) => {
    try {
      const schema = z.object({ quantity: z.number().min(0) });
      const { quantity } = schema.parse(req.body);
      
      const item = await storage.updateInventoryQuantity(req.params.id, quantity);
      if (!item) {
        return res.status(404).json({ message: "Item não encontrado" });
      }
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao atualizar quantidade do item" });
    }
  });

  // Sales routes
  app.get("/api/sales", async (req, res) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const sales = await storage.getSales(startDate, endDate);
      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar vendas" });
    }
  });

  app.get("/api/sales/:id", async (req, res) => {
    try {
      const sale = await storage.getSaleWithItems(req.params.id);
      if (!sale) {
        return res.status(404).json({ message: "Venda não encontrada" });
      }
      res.json(sale);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar venda" });
    }
  });

  app.post("/api/sales", async (req, res) => {
    try {
      const { items, ...saleData } = req.body;
      
      // Validate main sale data
      const validatedSale = insertSaleSchema.parse(saleData);
      
      // Validate items
      const itemsSchema = z.array(z.object({
        inventoryId: z.string(),
        quantity: z.number().min(1),
        unitPrice: z.number().min(0)
      })).min(1);
      
      const validatedItems = itemsSchema.parse(items);
      
      const sale = await storage.createSale(validatedSale, validatedItems);
      res.status(201).json(sale);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao registrar venda" });
    }
  });

  // Financial routes
  app.get("/api/financial-transactions", async (req, res) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const type = req.query.type as string | undefined;
      
      const transactions = await storage.getFinancialTransactions(startDate, endDate, type);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar transações financeiras" });
    }
  });

  app.post("/api/financial-transactions", async (req, res) => {
    try {
      const validatedData = insertFinancialTransactionSchema.parse(req.body);
      const transaction = await storage.createFinancialTransaction(validatedData);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao registrar transação financeira" });
    }
  });

  app.get("/api/financial-summary", async (req, res) => {
    try {
      let startDate = new Date();
      let endDate = new Date();
      
      if (req.query.startDate && req.query.endDate) {
        startDate = new Date(req.query.startDate as string);
        endDate = new Date(req.query.endDate as string);
      } else {
        // Default to current month
        startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        endDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
      }
      
      const summary = await storage.getFinancialSummary(startDate, endDate);
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar resumo financeiro" });
    }
  });
  
  // Rotas do Supabase
  app.get("/api/supabase/sync", async (req, res) => {
    try {
      const result = await syncDataWithSupabase();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: "Erro ao sincronizar com Supabase", error: error?.message });
    }
  });
  
  app.get("/api/supabase/profiles", async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin.from('profiles').select('*');
      
      if (error) {
        return res.status(500).json({ message: "Erro ao buscar perfis do Supabase", error: error.message });
      }
      
      // Retornar em formato compatível com a página
      res.json({
        profiles: data || [],
        count: data?.length || 0
      });
    } catch (error: any) {
      res.status(500).json({ message: "Erro ao acessar dados do Supabase", error: error?.message });
    }
  });
  
  app.get("/api/supabase/users", async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();
      
      if (error) {
        return res.status(500).json({ message: "Erro ao buscar usuários do Supabase", error: error.message });
      }
      
      // Retornar em formato compatível com a página
      res.json({
        users: data?.users || [],
        count: data?.users?.length || 0
      });
    } catch (error: any) {
      res.status(500).json({ message: "Erro ao acessar usuários do Supabase", error: error?.message });
    }
  });
  
  // Rota para buscar clientes do Supabase
  app.get("/api/supabase/clients", async (req, res) => {
    try {
      const result = await getSupabaseClients();
      
      if (!result.success) {
        return res.status(500).json({ 
          message: "Erro ao buscar clientes do Supabase", 
          error: result.error 
        });
      }
      
      res.json({
        clients: result.clients,
        count: result.count
      });
    } catch (error: any) {
      console.error('Erro ao buscar clientes do Supabase:', error);
      res.status(500).json({ 
        message: "Erro ao acessar clientes do Supabase", 
        error: error?.message || 'Erro desconhecido'
      });
    }
  });
  
  // Rota para buscar agendamentos do Supabase
  app.get("/api/supabase/appointments", async (req, res) => {
    try {
      const result = await getSupabaseAppointments();
      
      if (!result.success) {
        return res.status(500).json({ 
          message: "Erro ao buscar agendamentos do Supabase", 
          error: result.error 
        });
      }
      
      res.json({
        appointments: result.appointments,
        count: result.count
      });
    } catch (error: any) {
      console.error('Erro ao buscar agendamentos do Supabase:', error);
      res.status(500).json({ 
        message: "Erro ao acessar agendamentos do Supabase", 
        error: error?.message || 'Erro desconhecido'
      });
    }
  });
  
  // Rota para definir a chave de serviço do Supabase
  app.post("/api/supabase/set-service-key", async (req, res) => {
    try {
      const { serviceKey } = req.body;
      
      if (!serviceKey || typeof serviceKey !== 'string' || serviceKey.length < 20) {
        return res.status(400).json({
          message: 'Chave de serviço inválida',
          error: 'A chave de serviço deve ser uma string com pelo menos 20 caracteres'
        });
      }
      
      // Em um ambiente de produção, você salvaria essa chave em um local seguro
      // como variáveis de ambiente ou um serviço de gerenciamento de segredos
      // Por simplicidade, vamos criar uma rota que informa que a chave foi recebida
      console.log('Chave de serviço recebida');
      
      // Nota: Isso é apenas para fins de demonstração
      // A chave não está sendo realmente armazenada para uso futuro
      // Em implementações reais, você salvaria em um arquivo .env ou secrets manager
      
      return res.json({ 
        success: true, 
        message: 'Chave de serviço recebida com sucesso'
      });
    } catch (error: any) {
      console.error('Erro ao configurar chave de serviço:', error);
      return res.status(500).json({ 
        message: 'Erro ao configurar chave de serviço',
        error: error?.message || 'Erro desconhecido'
      });
    }
  });
  
  // Rota para limpar dados de demonstração
  app.post("/api/reset-demo-data", async (req, res) => {
    try {
      // Aqui, implementaríamos a lógica para limpar todos os dados do banco de dados
      // e reiniciar com valores padrão ou deixar vazio
      
      // Na versão atual, esta funcionalidade seria implementada quando necessária
      // pois exigiria um processo cuidadoso para limpar todas as tabelas em ordem
      // devido às restrições de chave estrangeira
      
      // Por agora, apenas retornamos uma mensagem de confirmação
      console.log('Solicitação recebida para limpar dados de demonstração');
      
      return res.json({
        success: true,
        message: 'Solicitação para limpar dados recebida',
        demo: true // Indica que esta é uma resposta de demonstração
      });
    } catch (error: any) {
      console.error('Erro ao limpar dados de demonstração:', error);
      return res.status(500).json({
        message: 'Erro ao limpar dados de demonstração',
        error: error?.message || 'Erro desconhecido'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
