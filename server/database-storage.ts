import { supabase } from "./db";
import { randomUUID } from "crypto";
import {
  User, InsertUser,
  Profile, InsertProfile,
  Client, InsertClient,
  Service, InsertService,
  Appointment, InsertAppointment,
  AppointmentService, InsertAppointmentService,
  BlockedSchedule, InsertBlockedSchedule,
  Inventory, InsertInventory,
  Sale, InsertSale, SaleItem, InsertSaleItem,
  FinancialTransaction, InsertFinancialTransaction
} from "@shared/schema";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User & Profile
  async getUser(id: number): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return data as User;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error || !data) return undefined;
    return data as User;
  }

  async createUser(user: InsertUser): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select()
      .single();
    
    if (error) throw error;
    return data as User;
  }

  async getProfile(id: string): Promise<Profile | undefined> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return data as Profile;
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profile)
      .select()
      .single();
    
    if (error) throw error;
    return data as Profile;
  }
  
  // Clients
  async getClients(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data as Client[];
  }

  async getClient(id: string): Promise<Client | undefined> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return data as Client;
  }

  async createClient(client: InsertClient): Promise<Client> {
    // Garantir que há um ID
    const clientData = {
      ...client,
      id: client.id || randomUUID(),
      created_at: client.created_at || new Date()
    };
    
    const { data, error } = await supabase
      .from('clients')
      .insert(clientData)
      .select()
      .single();
    
    if (error) throw error;
    return data as Client;
  }

  async updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined> {
    const { data, error } = await supabase
      .from('clients')
      .update(client)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Client;
  }
  
  // Services
  async getServices(): Promise<Service[]> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data as Service[];
  }

  async getService(id: string): Promise<Service | undefined> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return data as Service;
  }

  async createService(service: InsertService): Promise<Service> {
    // Garantir que há um ID
    const serviceData = {
      ...service,
      id: service.id || randomUUID(),
      created_at: service.created_at || new Date()
    };
    
    const { data, error } = await supabase
      .from('services')
      .insert(serviceData)
      .select()
      .single();
    
    if (error) throw error;
    return data as Service;
  }

  async updateService(id: string, service: Partial<InsertService>): Promise<Service | undefined> {
    const { data, error } = await supabase
      .from('services')
      .update(service)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Service;
  }

  async deleteService(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);
    
    return !error;
  }
  
  // Appointments
  async getAppointments(
    startDate?: Date, 
    endDate?: Date, 
    page: number = 1, 
    perPage: number = 20
  ): Promise<{appointments: Appointment[], total: number}> {
    // Cálculo de offset para paginação
    const offset = (page - 1) * perPage;
    
    // Primeiro, contamos o total de registros para paginação
    let countQuery = supabase
      .from('appointments')
      .select('id', { count: 'exact' });
    
    if (startDate) {
      countQuery = countQuery.gte('start_time', startDate.toISOString());
    }
    
    if (endDate) {
      countQuery = countQuery.lte('start_time', endDate.toISOString());
    }
    
    const { count, error: countError } = await countQuery;
    
    if (countError) throw countError;
    
    // Agora buscamos os registros para a página atual
    let query = supabase
      .from('appointments')
      .select('*, clients(*)')  // Incluindo dados do cliente na consulta
      .order('start_time')
      .range(offset, offset + perPage - 1);  // Aplicamos paginação
    
    if (startDate) {
      query = query.gte('start_time', startDate.toISOString());
    }
    
    if (endDate) {
      query = query.lte('start_time', endDate.toISOString());
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Reorganize data to match expected format
    const appointments = data?.map(appointment => {
      // Extraímos os dados do cliente e reorganizamos para o formato esperado pelo frontend
      const { clients, ...appointmentData } = appointment;
      
      return {
        ...appointmentData,
        client: clients, // Mapeia clients para client (singular)
        client_name: clients?.name || "", // Adiciona client_name explicitamente
        client_phone: clients?.phone || "" // Adiciona client_phone explicitamente
      };
    }) || [];
    
    return {
      appointments: appointments as Appointment[],
      total: count || 0
    };
  }

  async getAppointmentWithServices(id: string): Promise<any> {
    // Buscar o agendamento
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('*, clients(*)')
      .eq('id', id)
      .single();
    
    if (appointmentError || !appointment) throw appointmentError;
    
    // Buscar os serviços do agendamento
    const { data: appointmentServices, error: servicesError } = await supabase
      .from('appointment_services')
      .select('*, services(*)')
      .eq('appointment_id', id);
    
    if (servicesError) throw servicesError;
    
    // Reorganizar os dados para manter consistência com getAppointments
    const { clients, ...appointmentData } = appointment;
    
    return {
      ...appointmentData,
      client: clients,
      client_name: clients?.name || "",
      client_phone: clients?.phone || "",
      services: appointmentServices
    };
  }

  async getUpcomingAppointments(limit: number = 10): Promise<any[]> {
    const today = new Date();
    
    // Buscar agendamentos futuros com dados do cliente
    const { data, error } = await supabase
      .from('appointments')
      .select('*, clients(*)')
      .gte('start_time', today.toISOString())
      .eq('status', 'scheduled') // apenas confirmados
      .order('start_time')
      .limit(limit);
    
    if (error) throw error;

    // Para cada agendamento, buscar seus serviços
    const result = [];
    for (const appointment of data) {
      const { data: services, error: servicesError } = await supabase
        .from('appointment_services')
        .select('*, services(*)')
        .eq('appointment_id', appointment.id);
      
      if (servicesError) throw servicesError;
      
      // Reorganizar os dados para manter consistência com as outras funções
      const { clients, ...appointmentData } = appointment;
      
      result.push({
        ...appointmentData,
        client: clients, // Mapeia clients para client (singular)
        client_name: clients?.name || "", // Adiciona client_name explicitamente
        client_phone: clients?.phone || "", // Adiciona client_phone explicitamente
        services
      });
    }
    
    return result;
  }

  async createAppointment(appointment: InsertAppointment, serviceIds: string[]): Promise<Appointment> {
    // Garantir que há um ID e data de criação
    const appointmentData = {
      ...appointment,
      id: appointment.id || randomUUID(),
      created_at: appointment.created_at || new Date(),
      payment_status: appointment.payment_status || 'pending'
    };
    
    // Inserir o agendamento
    const { data, error } = await supabase
      .from('appointments')
      .insert(appointmentData)
      .select()
      .single();
    
    if (error) throw error;
    
    // Inserir os serviços do agendamento
    if (serviceIds.length > 0) {
      // Buscar dados dos serviços
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .in('id', serviceIds);
      
      if (servicesError) throw servicesError;
      
      // Preparar os serviços do agendamento
      const appointmentServicesData = servicesData.map(service => ({
        id: randomUUID(),
        appointment_id: data.id,
        service_id: service.id,
        price: service.price,
        final_price: service.price
      }));
      
      // Inserir serviços do agendamento
      const { error: insertError } = await supabase
        .from('appointment_services')
        .insert(appointmentServicesData);
      
      if (insertError) throw insertError;
      
      // Calcular preço final e atualizar o agendamento
      const totalPrice = appointmentServicesData.reduce(
        (sum, item) => sum + parseFloat(item.price), 0
      ).toString();
      
      await supabase
        .from('appointments')
        .update({ final_price: totalPrice })
        .eq('id', data.id);
    }
    
    return data as Appointment;
  }

  async updateAppointment(id: string, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const { data, error } = await supabase
      .from('appointments')
      .update(appointment)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Appointment;
  }

  async deleteAppointment(id: string): Promise<boolean> {
    // Excluir serviços do agendamento primeiro
    const { error: servicesError } = await supabase
      .from('appointment_services')
      .delete()
      .eq('appointment_id', id);
    
    if (servicesError) throw servicesError;
    
    // Excluir o agendamento
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);
    
    return !error;
  }
  
  // Appointment Services
  async getAppointmentServices(appointmentId: string): Promise<AppointmentService[]> {
    const { data, error } = await supabase
      .from('appointment_services')
      .select('*, services(*)')
      .eq('appointment_id', appointmentId);
    
    if (error) throw error;
    return data as AppointmentService[];
  }

  async createAppointmentService(service: InsertAppointmentService): Promise<AppointmentService> {
    const serviceData = {
      ...service,
      id: service.id || randomUUID(),
      final_price: service.final_price || service.price
    };
    
    const { data, error } = await supabase
      .from('appointment_services')
      .insert(serviceData)
      .select()
      .single();
    
    if (error) throw error;
    return data as AppointmentService;
  }
  
  // Blocked Schedules
  async getBlockedSchedules(startDate?: Date, endDate?: Date): Promise<BlockedSchedule[]> {
    let query = supabase
      .from('blocked_schedules')
      .select('*')
      .order('start_time');
    
    if (startDate) {
      query = query.gte('start_time', startDate.toISOString());
    }
    
    if (endDate) {
      query = query.lte('start_time', endDate.toISOString());
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data as BlockedSchedule[];
  }

  async createBlockedSchedule(blockedSchedule: InsertBlockedSchedule): Promise<BlockedSchedule> {
    const scheduleData = {
      ...blockedSchedule,
      id: blockedSchedule.id || randomUUID(),
      created_at: blockedSchedule.created_at || new Date(),
      reason: blockedSchedule.reason || 'Horário bloqueado'
    };
    
    const { data, error } = await supabase
      .from('blocked_schedules')
      .insert(scheduleData)
      .select()
      .single();
    
    if (error) throw error;
    return data as BlockedSchedule;
  }

  async deleteBlockedSchedule(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('blocked_schedules')
      .delete()
      .eq('id', id);
    
    return !error;
  }
  
  // Inventory
  async getInventory(): Promise<Inventory[]> {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data as Inventory[];
  }

  async getLowStockItems(limit: number = 10): Promise<Inventory[]> {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .lt('quantity', 5) // definição de "baixo estoque" pode ser ajustada
      .order('quantity')
      .limit(limit);
    
    if (error) throw error;
    return data as Inventory[];
  }

  async getInventoryItem(id: string): Promise<Inventory | undefined> {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return data as Inventory;
  }

  async createInventoryItem(item: InsertInventory): Promise<Inventory> {
    const itemData = {
      ...item,
      id: item.id || randomUUID(),
      created_at: item.created_at || new Date(),
      category: item.category || 'Geral'
    };
    
    const { data, error } = await supabase
      .from('inventory')
      .insert(itemData)
      .select()
      .single();
    
    if (error) throw error;
    return data as Inventory;
  }

  async updateInventoryItem(id: string, item: Partial<InsertInventory>): Promise<Inventory | undefined> {
    const { data, error } = await supabase
      .from('inventory')
      .update(item)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Inventory;
  }

  async updateInventoryQuantity(id: string, quantity: number): Promise<Inventory | undefined> {
    // Obter item atual para somar à quantidade existente
    const { data: currentItem, error: getError } = await supabase
      .from('inventory')
      .select('quantity')
      .eq('id', id)
      .single();
    
    if (getError) throw getError;
    
    // Atualizar com a nova quantidade
    const newQuantity = (currentItem.quantity || 0) + quantity;
    
    const { data, error } = await supabase
      .from('inventory')
      .update({ quantity: newQuantity })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Inventory;
  }
  
  // Sales
  async getSales(startDate?: Date, endDate?: Date): Promise<Sale[]> {
    let query = supabase
      .from('sales')
      .select('*, clients(*)')
      .order('sale_date', { ascending: false });
    
    if (startDate) {
      query = query.gte('sale_date', startDate.toISOString());
    }
    
    if (endDate) {
      query = query.lte('sale_date', endDate.toISOString());
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data as Sale[];
  }

  async getSale(id: string): Promise<Sale | undefined> {
    const { data, error } = await supabase
      .from('sales')
      .select('*, clients(*)')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return data as Sale;
  }

  async getSaleWithItems(id: string): Promise<any> {
    // Buscar a venda
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .select('*, clients(*)')
      .eq('id', id)
      .single();
    
    if (saleError || !sale) throw saleError;
    
    // Buscar os itens da venda
    const { data: saleItems, error: itemsError } = await supabase
      .from('sale_items')
      .select('*, inventory(*)')
      .eq('sale_id', id);
    
    if (itemsError) throw itemsError;
    
    return {
      ...sale,
      items: saleItems
    };
  }

  async createSale(sale: InsertSale, items: { inventoryId: string, quantity: number, unitPrice: number }[]): Promise<Sale> {
    // Garantir que há um ID e data de criação
    const saleData = {
      ...sale,
      id: sale.id || randomUUID(),
      created_at: sale.created_at || new Date(),
      sale_date: sale.sale_date || new Date()
    };
    
    // Calcular valor total se não estiver definido
    if (!saleData.total_amount) {
      saleData.total_amount = items
        .reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
        .toString();
    }
    
    // Inserir a venda
    const { data, error } = await supabase
      .from('sales')
      .insert(saleData)
      .select()
      .single();
    
    if (error) throw error;
    
    // Inserir os itens da venda
    if (items.length > 0) {
      const saleItemsData = items.map(item => ({
        id: randomUUID(),
        sale_id: data.id,
        inventory_id: item.inventoryId,
        quantity: item.quantity,
        unit_price: item.unitPrice.toString()
      }));
      
      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItemsData);
      
      if (itemsError) throw itemsError;
      
      // Atualizar estoque dos itens vendidos
      for (const item of items) {
        await this.updateInventoryQuantity(item.inventoryId, -item.quantity);
      }
      
      // Criar transação financeira para a venda
      await this.createFinancialTransaction({
        transaction_date: new Date(),
        description: `Venda de produtos - ${data.id}`,
        amount: saleData.total_amount,
        type: 'income',
        category: 'Vendas',
        payment_method: saleData.payment_method || 'Dinheiro',
        related_sale_id: data.id,
        created_at: new Date()
      });
    }
    
    return data as Sale;
  }
  
  // Financial Transactions
  async getFinancialTransactions(startDate?: Date, endDate?: Date, type?: string): Promise<FinancialTransaction[]> {
    let query = supabase
      .from('financial_transactions')
      .select('*')
      .order('transaction_date', { ascending: false });
    
    if (startDate) {
      query = query.gte('transaction_date', startDate.toISOString());
    }
    
    if (endDate) {
      query = query.lte('transaction_date', endDate.toISOString());
    }
    
    if (type) {
      query = query.eq('type', type);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data as FinancialTransaction[];
  }

  async createFinancialTransaction(transaction: InsertFinancialTransaction): Promise<FinancialTransaction> {
    const transactionData = {
      ...transaction,
      id: transaction.id || randomUUID(),
      created_at: transaction.created_at || new Date(),
      transaction_date: transaction.transaction_date || new Date()
    };
    
    const { data, error } = await supabase
      .from('financial_transactions')
      .insert(transactionData)
      .select()
      .single();
    
    if (error) throw error;
    return data as FinancialTransaction;
  }

  async getFinancialSummary(startDate: Date, endDate: Date): Promise<any> {
    // Buscar receitas
    const { data: incomes, error: incomesError } = await supabase
      .from('financial_transactions')
      .select('amount')
      .eq('type', 'income')
      .gte('transaction_date', startDate.toISOString())
      .lte('transaction_date', endDate.toISOString());
    
    if (incomesError) throw incomesError;
    
    // Buscar despesas
    const { data: expenses, error: expensesError } = await supabase
      .from('financial_transactions')
      .select('amount')
      .eq('type', 'expense')
      .gte('transaction_date', startDate.toISOString())
      .lte('transaction_date', endDate.toISOString());
    
    if (expensesError) throw expensesError;
    
    // Calcular totais
    const totalIncome = incomes.reduce(
      (sum, item) => sum + parseFloat(item.amount), 0
    );
    
    const totalExpense = expenses.reduce(
      (sum, item) => sum + parseFloat(item.amount), 0
    );
    
    // Resumo por categorias
    const { data: categorySummary, error: categoryError } = await supabase
      .from('financial_transactions')
      .select('category, type, amount')
      .gte('transaction_date', startDate.toISOString())
      .lte('transaction_date', endDate.toISOString());
    
    if (categoryError) throw categoryError;
    
    // Agrupar por categoria
    const categoriesMap = categorySummary.reduce((acc, item) => {
      const category = item.category || 'Outros';
      if (!acc[category]) {
        acc[category] = { income: 0, expense: 0 };
      }
      
      if (item.type === 'income') {
        acc[category].income += parseFloat(item.amount);
      } else {
        acc[category].expense += parseFloat(item.amount);
      }
      
      return acc;
    }, {});
    
    // Formatar categorias como array
    const categories = Object.keys(categoriesMap).map(category => ({
      category,
      income: categoriesMap[category].income,
      expense: categoriesMap[category].expense,
      balance: categoriesMap[category].income - categoriesMap[category].expense
    }));
    
    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      categories
    };
  }
}