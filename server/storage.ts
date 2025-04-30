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

// Define the Storage Interface with CRUD methods
export interface IStorage {
  // User & Profile
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getProfile(id: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  
  // Clients
  getClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined>;
  
  // Services
  getServices(): Promise<Service[]>;
  getService(id: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, service: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: string): Promise<boolean>;
  
  // Appointments
  getAppointments(startDate?: Date, endDate?: Date): Promise<Appointment[]>;
  getAppointmentWithServices(id: string): Promise<any>;
  getUpcomingAppointments(limit?: number): Promise<any[]>;
  createAppointment(appointment: InsertAppointment, serviceIds: string[]): Promise<Appointment>;
  updateAppointment(id: string, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: string): Promise<boolean>;
  
  // Appointment Services
  getAppointmentServices(appointmentId: string): Promise<AppointmentService[]>;
  createAppointmentService(service: InsertAppointmentService): Promise<AppointmentService>;
  
  // Blocked Schedules
  getBlockedSchedules(startDate?: Date, endDate?: Date): Promise<BlockedSchedule[]>;
  createBlockedSchedule(blockedSchedule: InsertBlockedSchedule): Promise<BlockedSchedule>;
  deleteBlockedSchedule(id: string): Promise<boolean>;
  
  // Inventory
  getInventory(): Promise<Inventory[]>;
  getLowStockItems(limit?: number): Promise<Inventory[]>;
  getInventoryItem(id: string): Promise<Inventory | undefined>;
  createInventoryItem(item: InsertInventory): Promise<Inventory>;
  updateInventoryItem(id: string, item: Partial<InsertInventory>): Promise<Inventory | undefined>;
  updateInventoryQuantity(id: string, quantity: number): Promise<Inventory | undefined>;
  
  // Sales
  getSales(startDate?: Date, endDate?: Date): Promise<Sale[]>;
  getSale(id: string): Promise<Sale | undefined>;
  getSaleWithItems(id: string): Promise<any>;
  createSale(sale: InsertSale, items: { inventoryId: string, quantity: number, unitPrice: number }[]): Promise<Sale>;
  
  // Financial Transactions
  getFinancialTransactions(startDate?: Date, endDate?: Date, type?: string): Promise<FinancialTransaction[]>;
  createFinancialTransaction(transaction: InsertFinancialTransaction): Promise<FinancialTransaction>;
  getFinancialSummary(startDate: Date, endDate: Date): Promise<any>;
}

// Implement the Memory Storage class
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private profiles: Map<string, Profile>;
  private clients: Map<string, Client>;
  private services: Map<string, Service>;
  private appointments: Map<string, Appointment>;
  private appointmentServices: Map<string, AppointmentService>;
  private blockedSchedules: Map<string, BlockedSchedule>;
  private inventory: Map<string, Inventory>;
  private sales: Map<string, Sale>;
  private saleItems: Map<string, SaleItem>;
  private financialTransactions: Map<string, FinancialTransaction>;
  private currentUserId: number;

  constructor() {
    this.users = new Map();
    this.profiles = new Map();
    this.clients = new Map();
    this.services = new Map();
    this.appointments = new Map();
    this.appointmentServices = new Map();
    this.blockedSchedules = new Map();
    this.inventory = new Map();
    this.sales = new Map();
    this.saleItems = new Map();
    this.financialTransactions = new Map();
    this.currentUserId = 1;
    
    // Initialize with demo data
    this.initializeDemoData();
  }

  private initializeDemoData() {
    // Add some initial services
    const services = [
      { id: "service-1", name: "Corte Feminino", price: "80", duration: 60 },
      { id: "service-2", name: "Escova", price: "50", duration: 40 },
      { id: "service-3", name: "Hidratação Profunda", price: "70", duration: 45 },
      { id: "service-4", name: "Manicure", price: "45", duration: 40 },
      { id: "service-5", name: "Pedicure", price: "50", duration: 45 },
      { id: "service-6", name: "Coloração", price: "150", duration: 90 },
      { id: "service-7", name: "Design de Sobrancelhas", price: "35", duration: 30 }
    ];
    
    services.forEach(service => {
      this.services.set(service.id, {
        ...service,
        created_at: new Date(),
        created_by: undefined
      });
    });
    
    // Add some clients
    const clients = [
      { id: "client-1", name: "Ana Souza", phone: "(11) 98765-4321" },
      { id: "client-2", name: "Carla Mendes", phone: "(11) 97654-3210" },
      { id: "client-3", name: "Renata Oliveira", phone: "(11) 96543-2109" },
      { id: "client-4", name: "Lucia Fernandes", phone: "(11) 95432-1098" }
    ];
    
    clients.forEach(client => {
      this.clients.set(client.id, {
        ...client,
        created_at: new Date(),
        created_by: undefined
      });
    });
    
    // Add some inventory items
    const inventoryItems = [
      { id: "inventory-1", name: "Shampoo Profissional", quantity: 5, cost_price: "15", selling_price: "30", category: "Cabelo" },
      { id: "inventory-2", name: "Condicionador Hidratante", quantity: 12, cost_price: "18", selling_price: "35", category: "Cabelo" },
      { id: "inventory-3", name: "Máscara Capilar", quantity: 25, cost_price: "25", selling_price: "45", category: "Cabelo" },
      { id: "inventory-4", name: "Esmalte Nude", quantity: 3, cost_price: "5", selling_price: "12", category: "Unhas" }
    ];
    
    inventoryItems.forEach(item => {
      this.inventory.set(item.id, {
        ...item,
        created_at: new Date(),
        created_by: undefined
      });
    });
    
    // Create today's date at 9:00 AM
    const today = new Date();
    today.setHours(9, 0, 0, 0);
    
    // Add some appointments for demonstration
    const appointments = [
      {
        id: "appointment-1",
        client_id: "client-1",
        start_time: new Date(today.getTime()),
        end_time: new Date(today.getTime() + 60 * 60 * 1000), // 1 hour later
        status: "scheduled",
        payment_status: "paid",
        final_price: "80",
        notes: "Cliente regular"
      },
      {
        id: "appointment-2",
        client_id: "client-2",
        start_time: new Date(today.getTime() + 2.5 * 60 * 60 * 1000), // 2.5 hours later
        end_time: new Date(today.getTime() + 4 * 60 * 60 * 1000), // 4 hours later
        status: "scheduled",
        payment_status: "paid",
        final_price: "120",
        notes: "Escova + Hidratação"
      },
      {
        id: "appointment-3",
        client_id: "client-3",
        start_time: new Date(today.getTime() + 5 * 60 * 60 * 1000), // 5 hours later
        end_time: new Date(today.getTime() + 6.5 * 60 * 60 * 1000), // 6.5 hours later
        status: "scheduled",
        payment_status: "pending",
        final_price: "95",
        notes: "Cliente solicitou esmalte vermelho para as mãos e nude para os pés."
      }
    ];
    
    appointments.forEach(appointment => {
      this.appointments.set(appointment.id, {
        ...appointment,
        created_at: new Date(),
        created_by: undefined,
        recurrence: null,
        payment_date: appointment.payment_status === "paid" ? new Date() : null
      });
    });
    
    // Add appointment services
    const appointmentServices = [
      { id: "as-1", appointment_id: "appointment-1", service_id: "service-1", price: "80", final_price: "80" },
      { id: "as-2", appointment_id: "appointment-2", service_id: "service-2", price: "50", final_price: "50" },
      { id: "as-3", appointment_id: "appointment-2", service_id: "service-3", price: "70", final_price: "70" },
      { id: "as-4", appointment_id: "appointment-3", service_id: "service-4", price: "45", final_price: "45" },
      { id: "as-5", appointment_id: "appointment-3", service_id: "service-5", price: "50", final_price: "50" }
    ];
    
    appointmentServices.forEach(service => {
      this.appointmentServices.set(service.id, service);
    });
    
    // Add a blocked time
    const blockedTime = {
      id: "blocked-1",
      start_time: new Date(today.getTime() + 4 * 60 * 60 * 1000), // 4 hours later
      end_time: new Date(today.getTime() + 5 * 60 * 60 * 1000), // 5 hours later
      reason: "Intervalo para almoço",
      created_at: new Date()
    };
    
    this.blockedSchedules.set(blockedTime.id, blockedTime);
    
    // Add financial transactions
    const financialTransactions = [
      {
        id: "ft-1",
        transaction_date: new Date(today.getTime()),
        description: "Serviço realizado - Ana Souza",
        amount: "80",
        type: "income",
        category: "Serviços",
        related_appointment_id: "appointment-1",
        payment_method: "Dinheiro",
        created_at: new Date()
      },
      {
        id: "ft-2",
        transaction_date: new Date(today.getTime() - 24 * 60 * 60 * 1000), // Yesterday
        description: "Serviço realizado - Carla Mendes",
        amount: "120",
        type: "income",
        category: "Serviços",
        related_appointment_id: "appointment-2",
        payment_method: "Cartão de Crédito",
        created_at: new Date(today.getTime() - 24 * 60 * 60 * 1000)
      },
      {
        id: "ft-3",
        transaction_date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        description: "Compra de produtos - Shampoo",
        amount: "350",
        type: "expense",
        category: "Produtos",
        payment_method: "Transferência",
        created_at: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)
      }
    ];
    
    financialTransactions.forEach(transaction => {
      this.financialTransactions.set(transaction.id, {
        ...transaction,
        created_by: undefined,
        notes: "",
        related_sale_id: undefined
      });
    });
  }

  // User & Profile Implementation
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async getProfile(id: string): Promise<Profile | undefined> {
    return this.profiles.get(id);
  }
  
  async createProfile(profile: InsertProfile): Promise<Profile> {
    this.profiles.set(profile.id, {
      ...profile,
      created_at: new Date()
    });
    return this.profiles.get(profile.id)!;
  }

  // Clients Implementation
  async getClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }
  
  async getClient(id: string): Promise<Client | undefined> {
    return this.clients.get(id);
  }
  
  async createClient(client: InsertClient): Promise<Client> {
    const id = `client-${Date.now()}`;
    const newClient: Client = {
      id,
      ...client,
      created_at: new Date(),
      created_by: undefined
    };
    this.clients.set(id, newClient);
    return newClient;
  }
  
  async updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined> {
    const existingClient = this.clients.get(id);
    if (!existingClient) return undefined;
    
    const updatedClient = {
      ...existingClient,
      ...client
    };
    
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  // Services Implementation
  async getServices(): Promise<Service[]> {
    return Array.from(this.services.values());
  }
  
  async getService(id: string): Promise<Service | undefined> {
    return this.services.get(id);
  }
  
  async createService(service: InsertService): Promise<Service> {
    const id = `service-${Date.now()}`;
    const newService: Service = {
      id,
      ...service,
      created_at: new Date(),
      created_by: undefined
    };
    this.services.set(id, newService);
    return newService;
  }
  
  async updateService(id: string, service: Partial<InsertService>): Promise<Service | undefined> {
    const existingService = this.services.get(id);
    if (!existingService) return undefined;
    
    const updatedService = {
      ...existingService,
      ...service
    };
    
    this.services.set(id, updatedService);
    return updatedService;
  }
  
  async deleteService(id: string): Promise<boolean> {
    return this.services.delete(id);
  }

  // Appointments Implementation
  async getAppointments(startDate?: Date, endDate?: Date): Promise<Appointment[]> {
    let appointments = Array.from(this.appointments.values());
    
    if (startDate) {
      appointments = appointments.filter(appointment => 
        new Date(appointment.start_time) >= startDate
      );
    }
    
    if (endDate) {
      appointments = appointments.filter(appointment => 
        new Date(appointment.start_time) <= endDate
      );
    }
    
    return appointments;
  }
  
  async getAppointmentWithServices(id: string): Promise<any> {
    const appointment = this.appointments.get(id);
    if (!appointment) return undefined;
    
    const client = this.clients.get(appointment.client_id);
    
    const appointmentServicesList = Array.from(this.appointmentServices.values())
      .filter(as => as.appointment_id === id);
    
    const services = appointmentServicesList.map(as => {
      const service = this.services.get(as.service_id);
      return {
        id: as.service_id,
        name: service?.name,
        price: as.price,
        duration: service?.duration
      };
    });
    
    return {
      ...appointment,
      client,
      services
    };
  }
  
  async getUpcomingAppointments(limit: number = 10): Promise<any[]> {
    const now = new Date();
    
    const upcomingAppointments = Array.from(this.appointments.values())
      .filter(appointment => new Date(appointment.start_time) >= now)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, limit);
    
    // Enrich with client and service data
    return Promise.all(upcomingAppointments.map(async appointment => {
      const client = this.clients.get(appointment.client_id);
      
      const appointmentServicesList = Array.from(this.appointmentServices.values())
        .filter(as => as.appointment_id === appointment.id);
      
      const services = appointmentServicesList.map(as => {
        const service = this.services.get(as.service_id);
        return {
          name: service?.name,
          price: as.price
        };
      });
      
      return {
        ...appointment,
        client,
        services
      };
    }));
  }
  
  async createAppointment(appointment: InsertAppointment, serviceIds: string[]): Promise<Appointment> {
    const id = `appointment-${Date.now()}`;
    const newAppointment: Appointment = {
      id,
      ...appointment,
      created_at: new Date(),
      created_by: undefined,
      payment_date: appointment.payment_status === "paid" ? new Date() : null
    };
    this.appointments.set(id, newAppointment);
    
    // Create appointment services
    let totalPrice = 0;
    for (const serviceId of serviceIds) {
      const service = this.services.get(serviceId);
      if (service) {
        const price = Number(service.price);
        totalPrice += price;
        
        const appointmentServiceId = `as-${Date.now()}-${serviceId}`;
        this.appointmentServices.set(appointmentServiceId, {
          id: appointmentServiceId,
          appointment_id: id,
          service_id: serviceId,
          price: service.price.toString(),
          final_price: service.price.toString()
        });
      }
    }
    
    // Update appointment with total price
    newAppointment.final_price = totalPrice.toString();
    this.appointments.set(id, newAppointment);
    
    // Create financial transaction if payment is already made
    if (appointment.payment_status === "paid") {
      const client = this.clients.get(appointment.client_id);
      this.createFinancialTransaction({
        transaction_date: new Date(appointment.start_time),
        description: `Serviço realizado - ${client?.name || 'Cliente'}`,
        amount: totalPrice.toString(),
        type: "income",
        category: "Serviços",
        related_appointment_id: id,
        payment_method: "Dinheiro",
        notes: ""
      });
    }
    
    return newAppointment;
  }
  
  async updateAppointment(id: string, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const existingAppointment = this.appointments.get(id);
    if (!existingAppointment) return undefined;
    
    const updatedAppointment = {
      ...existingAppointment,
      ...appointment,
      // If payment status changes to paid, update the payment date
      payment_date: appointment.payment_status === "paid" ? new Date() : existingAppointment.payment_date
    };
    
    this.appointments.set(id, updatedAppointment);
    
    // Create financial transaction if changing to paid
    if (appointment.payment_status === "paid" && existingAppointment.payment_status !== "paid") {
      const client = this.clients.get(existingAppointment.client_id);
      this.createFinancialTransaction({
        transaction_date: new Date(),
        description: `Serviço realizado - ${client?.name || 'Cliente'}`,
        amount: updatedAppointment.final_price?.toString() || "0",
        type: "income",
        category: "Serviços",
        related_appointment_id: id,
        payment_method: "Dinheiro",
        notes: ""
      });
    }
    
    return updatedAppointment;
  }
  
  async deleteAppointment(id: string): Promise<boolean> {
    // Delete associated appointment services first
    Array.from(this.appointmentServices.entries())
      .filter(([_, as]) => as.appointment_id === id)
      .forEach(([asId, _]) => this.appointmentServices.delete(asId));
    
    // Then delete the appointment
    return this.appointments.delete(id);
  }

  // Appointment Services Implementation
  async getAppointmentServices(appointmentId: string): Promise<AppointmentService[]> {
    return Array.from(this.appointmentServices.values())
      .filter(as => as.appointment_id === appointmentId);
  }
  
  async createAppointmentService(service: InsertAppointmentService): Promise<AppointmentService> {
    const id = `as-${Date.now()}`;
    const newService = {
      id,
      ...service
    };
    this.appointmentServices.set(id, newService);
    return newService;
  }

  // Blocked Schedules Implementation
  async getBlockedSchedules(startDate?: Date, endDate?: Date): Promise<BlockedSchedule[]> {
    let blockedTimes = Array.from(this.blockedSchedules.values());
    
    if (startDate) {
      blockedTimes = blockedTimes.filter(block => 
        new Date(block.start_time) >= startDate
      );
    }
    
    if (endDate) {
      blockedTimes = blockedTimes.filter(block => 
        new Date(block.end_time) <= endDate
      );
    }
    
    return blockedTimes;
  }
  
  async createBlockedSchedule(blockedSchedule: InsertBlockedSchedule): Promise<BlockedSchedule> {
    const id = `blocked-${Date.now()}`;
    const newBlockedSchedule: BlockedSchedule = {
      id,
      ...blockedSchedule,
      created_at: new Date()
    };
    this.blockedSchedules.set(id, newBlockedSchedule);
    return newBlockedSchedule;
  }
  
  async deleteBlockedSchedule(id: string): Promise<boolean> {
    return this.blockedSchedules.delete(id);
  }

  // Inventory Implementation
  async getInventory(): Promise<Inventory[]> {
    return Array.from(this.inventory.values());
  }
  
  async getLowStockItems(limit: number = 10): Promise<Inventory[]> {
    return Array.from(this.inventory.values())
      .filter(item => item.quantity <= 15)
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, limit);
  }
  
  async getInventoryItem(id: string): Promise<Inventory | undefined> {
    return this.inventory.get(id);
  }
  
  async createInventoryItem(item: InsertInventory): Promise<Inventory> {
    const id = `inventory-${Date.now()}`;
    const newItem: Inventory = {
      id,
      ...item,
      created_at: new Date(),
      created_by: undefined
    };
    this.inventory.set(id, newItem);
    return newItem;
  }
  
  async updateInventoryItem(id: string, item: Partial<InsertInventory>): Promise<Inventory | undefined> {
    const existingItem = this.inventory.get(id);
    if (!existingItem) return undefined;
    
    const updatedItem = {
      ...existingItem,
      ...item
    };
    
    this.inventory.set(id, updatedItem);
    return updatedItem;
  }
  
  async updateInventoryQuantity(id: string, quantity: number): Promise<Inventory | undefined> {
    const existingItem = this.inventory.get(id);
    if (!existingItem) return undefined;
    
    const updatedItem = {
      ...existingItem,
      quantity: quantity
    };
    
    this.inventory.set(id, updatedItem);
    return updatedItem;
  }

  // Sales Implementation
  async getSales(startDate?: Date, endDate?: Date): Promise<Sale[]> {
    let sales = Array.from(this.sales.values());
    
    if (startDate) {
      sales = sales.filter(sale => 
        new Date(sale.sale_date) >= startDate
      );
    }
    
    if (endDate) {
      sales = sales.filter(sale => 
        new Date(sale.sale_date) <= endDate
      );
    }
    
    return sales;
  }
  
  async getSale(id: string): Promise<Sale | undefined> {
    return this.sales.get(id);
  }
  
  async getSaleWithItems(id: string): Promise<any> {
    const sale = this.sales.get(id);
    if (!sale) return undefined;
    
    const client = sale.client_id ? this.clients.get(sale.client_id) : undefined;
    
    const saleItemsList = Array.from(this.saleItems.values())
      .filter(item => item.sale_id === id);
    
    const items = saleItemsList.map(item => {
      const inventoryItem = this.inventory.get(item.inventory_id);
      return {
        ...item,
        name: inventoryItem?.name,
        category: inventoryItem?.category
      };
    });
    
    return {
      ...sale,
      client,
      items
    };
  }
  
  async createSale(sale: InsertSale, items: { inventoryId: string, quantity: number, unitPrice: number }[]): Promise<Sale> {
    const id = `sale-${Date.now()}`;
    let totalAmount = 0;
    
    // Calculate total amount and create sale items
    for (const item of items) {
      const totalPrice = item.quantity * item.unitPrice;
      totalAmount += totalPrice;
      
      // Update inventory quantity
      const inventoryItem = this.inventory.get(item.inventoryId);
      if (inventoryItem) {
        const newQuantity = inventoryItem.quantity - item.quantity;
        this.updateInventoryQuantity(item.inventoryId, newQuantity >= 0 ? newQuantity : 0);
      }
      
      // Create sale item
      const saleItemId = `saleItem-${Date.now()}-${item.inventoryId}`;
      this.saleItems.set(saleItemId, {
        id: saleItemId,
        sale_id: id,
        inventory_id: item.inventoryId,
        quantity: item.quantity,
        unit_price: item.unitPrice.toString(),
        total_price: totalPrice.toString()
      });
    }
    
    // Create sale
    const newSale: Sale = {
      id,
      ...sale,
      total_amount: totalAmount.toString(),
      created_at: new Date(),
      created_by: undefined
    };
    this.sales.set(id, newSale);
    
    // Create financial transaction for the sale
    const client = sale.client_id ? this.clients.get(sale.client_id) : undefined;
    this.createFinancialTransaction({
      transaction_date: new Date(sale.sale_date),
      description: `Venda de produtos${client ? ' - ' + client.name : ''}`,
      amount: totalAmount.toString(),
      type: "income",
      category: "Vendas",
      related_sale_id: id,
      payment_method: sale.payment_method || "Dinheiro",
      notes: sale.notes || ""
    });
    
    return newSale;
  }

  // Financial Transactions Implementation
  async getFinancialTransactions(startDate?: Date, endDate?: Date, type?: string): Promise<FinancialTransaction[]> {
    let transactions = Array.from(this.financialTransactions.values());
    
    if (startDate) {
      transactions = transactions.filter(tx => 
        new Date(tx.transaction_date) >= startDate
      );
    }
    
    if (endDate) {
      transactions = transactions.filter(tx => 
        new Date(tx.transaction_date) <= endDate
      );
    }
    
    if (type) {
      transactions = transactions.filter(tx => tx.type === type);
    }
    
    return transactions.sort((a, b) => 
      new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
    );
  }
  
  async createFinancialTransaction(transaction: InsertFinancialTransaction): Promise<FinancialTransaction> {
    const id = `ft-${Date.now()}`;
    const newTransaction: FinancialTransaction = {
      id,
      ...transaction,
      created_at: new Date(),
      created_by: undefined
    };
    this.financialTransactions.set(id, newTransaction);
    return newTransaction;
  }
  
  async getFinancialSummary(startDate: Date, endDate: Date): Promise<any> {
    // Get transactions for the period
    const transactions = await this.getFinancialTransactions(startDate, endDate);
    
    // Get previous period for comparison
    const periodLength = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodLength);
    const previousEndDate = new Date(endDate.getTime() - periodLength);
    const previousTransactions = await this.getFinancialTransactions(
      previousStartDate, 
      previousEndDate
    );
    
    // Calculate revenue
    const revenue = transactions
      .filter(tx => tx.type === "income")
      .reduce((acc, tx) => acc + Number(tx.amount), 0);
    
    const previousRevenue = previousTransactions
      .filter(tx => tx.type === "income")
      .reduce((acc, tx) => acc + Number(tx.amount), 0);
    
    // Calculate expenses
    const expenses = transactions
      .filter(tx => tx.type === "expense")
      .reduce((acc, tx) => acc + Number(tx.amount), 0);
    
    const previousExpenses = previousTransactions
      .filter(tx => tx.type === "expense")
      .reduce((acc, tx) => acc + Number(tx.amount), 0);
    
    // Calculate revenue by category
    const serviceRevenue = transactions
      .filter(tx => tx.type === "income" && tx.category === "Serviços")
      .reduce((acc, tx) => acc + Number(tx.amount), 0);
    
    const productRevenue = transactions
      .filter(tx => tx.type === "income" && tx.category === "Vendas")
      .reduce((acc, tx) => acc + Number(tx.amount), 0);
    
    return {
      revenue: {
        total: revenue,
        previousTotal: previousRevenue,
        services: serviceRevenue,
        products: productRevenue
      },
      expenses: {
        total: expenses,
        previousTotal: previousExpenses
      },
      profit: {
        total: revenue - expenses,
        previousTotal: previousRevenue - previousExpenses
      }
    };
  }
}

export const storage = new MemStorage();
