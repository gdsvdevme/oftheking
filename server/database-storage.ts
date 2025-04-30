import { 
  clients, Client, InsertClient,
  services, Service, InsertService,
  appointments, Appointment, InsertAppointment,
  appointmentServices, AppointmentService, InsertAppointmentService,
  blockedSchedules, BlockedSchedule, InsertBlockedSchedule,
  inventory, Inventory, InsertInventory,
  sales, Sale, InsertSale,
  saleItems, SaleItem, InsertSaleItem,
  financialTransactions, FinancialTransaction, InsertFinancialTransaction,
  users, User, InsertUser,
  profiles, Profile, InsertProfile
} from "@shared/schema";
import { IStorage } from "./storage";
import { db } from "./db";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  // User & Profile
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getProfile(id: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, id));
    return profile || undefined;
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const [newProfile] = await db.insert(profiles).values(profile).returning();
    return newProfile;
  }

  // Clients
  async getClients(): Promise<Client[]> {
    return await db.select().from(clients);
  }

  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
  }

  async updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined> {
    const [updatedClient] = await db
      .update(clients)
      .set(client)
      .where(eq(clients.id, id))
      .returning();
    return updatedClient || undefined;
  }

  // Services
  async getServices(): Promise<Service[]> {
    return await db.select().from(services);
  }

  async getService(id: string): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service || undefined;
  }

  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db.insert(services).values(service).returning();
    return newService;
  }

  async updateService(id: string, service: Partial<InsertService>): Promise<Service | undefined> {
    const [updatedService] = await db
      .update(services)
      .set(service)
      .where(eq(services.id, id))
      .returning();
    return updatedService || undefined;
  }

  async deleteService(id: string): Promise<boolean> {
    const result = await db.delete(services).where(eq(services.id, id));
    return !!result;
  }

  // Appointments
  async getAppointments(startDate?: Date, endDate?: Date): Promise<Appointment[]> {
    let query = db.select().from(appointments);

    if (startDate) {
      query = query.where(gte(appointments.start_time, startDate));
    }

    if (endDate) {
      query = query.where(lte(appointments.start_time, endDate));
    }

    return await query;
  }

  async getAppointmentWithServices(id: string): Promise<any> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    
    if (!appointment) return undefined;
    
    // Get client
    const [client] = await db.select().from(clients).where(eq(clients.id, appointment.client_id));
    
    // Get appointment services
    const appServices = await db
      .select()
      .from(appointmentServices)
      .where(eq(appointmentServices.appointment_id, id));
    
    // Get details for each service
    const enrichedServices = await Promise.all(
      appServices.map(async (appService) => {
        const [service] = await db
          .select()
          .from(services)
          .where(eq(services.id, appService.service_id));
        
        return {
          id: appService.service_id,
          name: service?.name,
          price: appService.price,
          duration: service?.duration
        };
      })
    );
    
    return {
      ...appointment,
      client,
      services: enrichedServices
    };
  }

  async getUpcomingAppointments(limit: number = 10): Promise<any[]> {
    const now = new Date();
    
    const upcomingAppointments = await db
      .select()
      .from(appointments)
      .where(gte(appointments.start_time, now))
      .orderBy(appointments.start_time)
      .limit(limit);
    
    // Enrich with client and service data
    const enrichedAppointments = await Promise.all(
      upcomingAppointments.map(async (appointment) => {
        const [client] = await db
          .select()
          .from(clients)
          .where(eq(clients.id, appointment.client_id));
        
        const appServices = await db
          .select()
          .from(appointmentServices)
          .where(eq(appointmentServices.appointment_id, appointment.id));
        
        const services = await Promise.all(
          appServices.map(async (appService) => {
            const [service] = await db
              .select()
              .from(services)
              .where(eq(services.id, appService.service_id));
            
            return {
              name: service?.name,
              price: appService.price
            };
          })
        );
        
        return {
          ...appointment,
          client,
          services
        };
      })
    );
    
    return enrichedAppointments;
  }

  async createAppointment(appointment: InsertAppointment, serviceIds: string[]): Promise<Appointment> {
    const [newAppointment] = await db.insert(appointments).values(appointment).returning();
    
    // Create appointment services
    for (const serviceId of serviceIds) {
      const [service] = await db.select().from(services).where(eq(services.id, serviceId));
      
      if (service) {
        await db.insert(appointmentServices).values({
          appointment_id: newAppointment.id,
          service_id: serviceId,
          price: service.price,
          final_price: service.price
        });
      }
    }
    
    return newAppointment;
  }

  async updateAppointment(id: string, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const [updatedAppointment] = await db
      .update(appointments)
      .set(appointment)
      .where(eq(appointments.id, id))
      .returning();
    return updatedAppointment || undefined;
  }

  async deleteAppointment(id: string): Promise<boolean> {
    await db.delete(appointmentServices).where(eq(appointmentServices.appointment_id, id));
    const result = await db.delete(appointments).where(eq(appointments.id, id));
    return !!result;
  }

  // Appointment Services
  async getAppointmentServices(appointmentId: string): Promise<AppointmentService[]> {
    return await db
      .select()
      .from(appointmentServices)
      .where(eq(appointmentServices.appointment_id, appointmentId));
  }

  async createAppointmentService(service: InsertAppointmentService): Promise<AppointmentService> {
    const [newAppointmentService] = await db
      .insert(appointmentServices)
      .values(service)
      .returning();
    return newAppointmentService;
  }

  // Blocked Schedules
  async getBlockedSchedules(startDate?: Date, endDate?: Date): Promise<BlockedSchedule[]> {
    let query = db.select().from(blockedSchedules);

    if (startDate) {
      query = query.where(gte(blockedSchedules.start_time, startDate));
    }

    if (endDate) {
      query = query.where(lte(blockedSchedules.start_time, endDate));
    }

    return await query;
  }

  async createBlockedSchedule(blockedSchedule: InsertBlockedSchedule): Promise<BlockedSchedule> {
    const [newBlockedSchedule] = await db
      .insert(blockedSchedules)
      .values(blockedSchedule)
      .returning();
    return newBlockedSchedule;
  }

  async deleteBlockedSchedule(id: string): Promise<boolean> {
    const result = await db.delete(blockedSchedules).where(eq(blockedSchedules.id, id));
    return !!result;
  }

  // Inventory
  async getInventory(): Promise<Inventory[]> {
    return await db.select().from(inventory);
  }

  async getLowStockItems(limit: number = 10): Promise<Inventory[]> {
    return await db
      .select()
      .from(inventory)
      .orderBy(inventory.quantity)
      .limit(limit);
  }

  async getInventoryItem(id: string): Promise<Inventory | undefined> {
    const [item] = await db.select().from(inventory).where(eq(inventory.id, id));
    return item || undefined;
  }

  async createInventoryItem(item: InsertInventory): Promise<Inventory> {
    const [newItem] = await db.insert(inventory).values(item).returning();
    return newItem;
  }

  async updateInventoryItem(id: string, item: Partial<InsertInventory>): Promise<Inventory | undefined> {
    const [updatedItem] = await db
      .update(inventory)
      .set(item)
      .where(eq(inventory.id, id))
      .returning();
    return updatedItem || undefined;
  }

  async updateInventoryQuantity(id: string, quantity: number): Promise<Inventory | undefined> {
    const [updatedItem] = await db
      .update(inventory)
      .set({ quantity })
      .where(eq(inventory.id, id))
      .returning();
    return updatedItem || undefined;
  }

  // Sales
  async getSales(startDate?: Date, endDate?: Date): Promise<Sale[]> {
    let query = db.select().from(sales);

    if (startDate) {
      query = query.where(gte(sales.sale_date, startDate));
    }

    if (endDate) {
      query = query.where(lte(sales.sale_date, endDate));
    }

    return await query;
  }

  async getSale(id: string): Promise<Sale | undefined> {
    const [sale] = await db.select().from(sales).where(eq(sales.id, id));
    return sale || undefined;
  }

  async getSaleWithItems(id: string): Promise<any> {
    const [sale] = await db.select().from(sales).where(eq(sales.id, id));
    
    if (!sale) return undefined;
    
    // Get client if it exists
    let client = undefined;
    if (sale.client_id) {
      [client] = await db.select().from(clients).where(eq(clients.id, sale.client_id));
    }
    
    // Get sale items
    const items = await db.select().from(saleItems).where(eq(saleItems.sale_id, id));
    
    // Enrich items with inventory data
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const [inventoryItem] = await db
          .select()
          .from(inventory)
          .where(eq(inventory.id, item.inventory_id));
        
        return {
          ...item,
          product: inventoryItem
        };
      })
    );
    
    return {
      ...sale,
      client,
      items: enrichedItems
    };
  }

  async createSale(sale: InsertSale, items: { inventoryId: string, quantity: number, unitPrice: number }[]): Promise<Sale> {
    const [newSale] = await db.insert(sales).values(sale).returning();
    
    // Create sale items and update inventory
    for (const item of items) {
      // Add item to sale
      await db.insert(saleItems).values({
        sale_id: newSale.id,
        inventory_id: item.inventoryId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.quantity * item.unitPrice
      });
      
      // Update inventory quantity
      const [inventoryItem] = await db
        .select()
        .from(inventory)
        .where(eq(inventory.id, item.inventoryId));
      
      if (inventoryItem) {
        await db
          .update(inventory)
          .set({
            quantity: Math.max(0, inventoryItem.quantity - item.quantity)
          })
          .where(eq(inventory.id, item.inventoryId));
      }
    }
    
    return newSale;
  }

  // Financial Transactions
  async getFinancialTransactions(startDate?: Date, endDate?: Date, type?: string): Promise<FinancialTransaction[]> {
    let query = db.select().from(financialTransactions);

    if (startDate) {
      query = query.where(gte(financialTransactions.transaction_date, startDate));
    }

    if (endDate) {
      query = query.where(lte(financialTransactions.transaction_date, endDate));
    }

    if (type) {
      query = query.where(eq(financialTransactions.type, type));
    }

    return await query.orderBy(desc(financialTransactions.transaction_date));
  }

  async createFinancialTransaction(transaction: InsertFinancialTransaction): Promise<FinancialTransaction> {
    const [newTransaction] = await db
      .insert(financialTransactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async getFinancialSummary(startDate: Date, endDate: Date): Promise<any> {
    // Get previous month dates for comparison
    const previousMonthStart = new Date(startDate);
    previousMonthStart.setMonth(previousMonthStart.getMonth() - 1);
    
    const previousMonthEnd = new Date(endDate);
    previousMonthEnd.setMonth(previousMonthEnd.getMonth() - 1);
    
    // Get revenue transactions
    const incomeTransactions = await this.getFinancialTransactions(
      startDate,
      endDate,
      "income"
    );
    
    const previousIncomeTransactions = await this.getFinancialTransactions(
      previousMonthStart,
      previousMonthEnd,
      "income"
    );
    
    // Get expense transactions
    const expenseTransactions = await this.getFinancialTransactions(
      startDate,
      endDate,
      "expense"
    );
    
    const previousExpenseTransactions = await this.getFinancialTransactions(
      previousMonthStart,
      previousMonthEnd,
      "expense"
    );
    
    // Calculate totals
    const revenueTotal = incomeTransactions.reduce(
      (sum, transaction) => sum + Number(transaction.amount),
      0
    );
    
    const previousRevenueTotal = previousIncomeTransactions.reduce(
      (sum, transaction) => sum + Number(transaction.amount),
      0
    );
    
    const expenseTotal = expenseTransactions.reduce(
      (sum, transaction) => sum + Number(transaction.amount),
      0
    );
    
    const previousExpenseTotal = previousExpenseTransactions.reduce(
      (sum, transaction) => sum + Number(transaction.amount),
      0
    );
    
    // Calculate revenue by category
    const serviceRevenue = incomeTransactions
      .filter(transaction => transaction.category === "Serviços")
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
    
    const productRevenue = incomeTransactions
      .filter(transaction => transaction.category === "Vendas")
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
    
    return {
      revenue: {
        total: revenueTotal,
        previousTotal: previousRevenueTotal,
        services: serviceRevenue,
        products: productRevenue
      },
      expenses: {
        total: expenseTotal,
        previousTotal: previousExpenseTotal
      },
      profit: {
        total: revenueTotal - expenseTotal,
        previousTotal: previousRevenueTotal - previousExpenseTotal
      }
    };
  }
}