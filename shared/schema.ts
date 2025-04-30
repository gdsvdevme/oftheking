import { pgTable, text, serial, integer, boolean, numeric, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Clientes
export const clients = pgTable("clients", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  created_at: timestamp("created_at").defaultNow(),
  created_by: uuid("created_by")
});

export const insertClientSchema = createInsertSchema(clients).pick({
  name: true,
  phone: true
});

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

// Serviços
export const services = pgTable("services", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  price: numeric("price").notNull().default("0"),
  duration: integer("duration").notNull().default(60),
  created_at: timestamp("created_at").defaultNow(),
  created_by: uuid("created_by")
});

export const insertServiceSchema = createInsertSchema(services).pick({
  name: true,
  price: true,
  duration: true
});

export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

// Agendamentos
export const appointments = pgTable("appointments", {
  id: uuid("id").defaultRandom().primaryKey(),
  client_id: uuid("client_id").notNull().references(() => clients.id),
  start_time: timestamp("start_time").notNull(),
  end_time: timestamp("end_time").notNull(),
  status: text("status").notNull().default("scheduled"),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow(),
  created_by: uuid("created_by"),
  final_price: numeric("final_price").default("0"),
  recurrence: text("recurrence"),
  payment_date: timestamp("payment_date"),
  payment_status: text("payment_status").default("pending").notNull()
});

export const insertAppointmentSchema = createInsertSchema(appointments, {
  start_time: z.coerce.date(), // Aceita string e converte para Date
  end_time: z.coerce.date()    // Aceita string e converte para Date
}).pick({
  client_id: true,
  start_time: true,
  end_time: true,
  status: true,
  notes: true,
  final_price: true,
  recurrence: true,
  payment_status: true
});

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

// Serviços do agendamento
export const appointmentServices = pgTable("appointment_services", {
  id: uuid("id").defaultRandom().primaryKey(),
  appointment_id: uuid("appointment_id").notNull().references(() => appointments.id, { onDelete: 'cascade' }),
  service_id: uuid("service_id").notNull().references(() => services.id),
  price: numeric("price").notNull(),
  final_price: numeric("final_price").default("0")
});

export const insertAppointmentServiceSchema = createInsertSchema(appointmentServices).pick({
  appointment_id: true,
  service_id: true,
  price: true,
  final_price: true
});

export type InsertAppointmentService = z.infer<typeof insertAppointmentServiceSchema>;
export type AppointmentService = typeof appointmentServices.$inferSelect;

// Horários bloqueados
export const blockedSchedules = pgTable("blocked_schedules", {
  id: uuid("id").defaultRandom().primaryKey(),
  start_time: timestamp("start_time").notNull(),
  end_time: timestamp("end_time").notNull(),
  reason: text("reason"),
  created_at: timestamp("created_at").defaultNow()
});

export const insertBlockedScheduleSchema = createInsertSchema(blockedSchedules, {
  start_time: z.coerce.date(), // Aceita string e converte para Date
  end_time: z.coerce.date()    // Aceita string e converte para Date
}).pick({
  start_time: true,
  end_time: true,
  reason: true
});

export type InsertBlockedSchedule = z.infer<typeof insertBlockedScheduleSchema>;
export type BlockedSchedule = typeof blockedSchedules.$inferSelect;

// Estoque
export const inventory = pgTable("inventory", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull().default(0),
  cost_price: numeric("cost_price").notNull().default("0"),
  selling_price: numeric("selling_price").notNull().default("0"),
  created_at: timestamp("created_at").defaultNow(),
  created_by: uuid("created_by"),
  category: text("category").default("Geral")
});

export const insertInventorySchema = createInsertSchema(inventory).pick({
  name: true,
  quantity: true,
  cost_price: true,
  selling_price: true,
  category: true
});

export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type Inventory = typeof inventory.$inferSelect;

// Vendas
export const sales = pgTable("sales", {
  id: uuid("id").defaultRandom().primaryKey(),
  sale_date: timestamp("sale_date").defaultNow().notNull(),
  total_amount: numeric("total_amount").default("0").notNull(),
  payment_method: text("payment_method"),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow(),
  created_by: uuid("created_by"),
  client_id: uuid("client_id").references(() => clients.id)
});

export const insertSaleSchema = createInsertSchema(sales, {
  sale_date: z.coerce.date() // Aceita string e converte para Date
}).pick({
  sale_date: true,
  total_amount: true,
  payment_method: true,
  notes: true,
  client_id: true
});

export type InsertSale = z.infer<typeof insertSaleSchema>;
export type Sale = typeof sales.$inferSelect;

// Itens da venda
export const saleItems = pgTable("sale_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  sale_id: uuid("sale_id").notNull().references(() => sales.id, { onDelete: 'cascade' }),
  inventory_id: uuid("inventory_id").notNull().references(() => inventory.id),
  quantity: integer("quantity").default(1).notNull(),
  unit_price: numeric("unit_price").default("0").notNull(),
  total_price: numeric("total_price").default("0").notNull()
});

export const insertSaleItemSchema = createInsertSchema(saleItems).pick({
  sale_id: true,
  inventory_id: true,
  quantity: true,
  unit_price: true,
  total_price: true
});

export type InsertSaleItem = z.infer<typeof insertSaleItemSchema>;
export type SaleItem = typeof saleItems.$inferSelect;

// Transações financeiras
export const financialTransactions = pgTable("financial_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  transaction_date: timestamp("transaction_date").defaultNow().notNull(),
  description: text("description").notNull(),
  amount: numeric("amount").notNull(),
  type: text("type").notNull(), // income or expense
  category: text("category"),
  related_sale_id: uuid("related_sale_id").references(() => sales.id),
  related_appointment_id: uuid("related_appointment_id").references(() => appointments.id),
  payment_method: text("payment_method"),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow(),
  created_by: uuid("created_by")
});

export const insertFinancialTransactionSchema = createInsertSchema(financialTransactions, {
  transaction_date: z.coerce.date() // Aceita string e converte para Date
}).pick({
  transaction_date: true,
  description: true,
  amount: true,
  type: true,
  category: true,
  related_sale_id: true,
  related_appointment_id: true,
  payment_method: true,
  notes: true
});

export type InsertFinancialTransaction = z.infer<typeof insertFinancialTransactionSchema>;
export type FinancialTransaction = typeof financialTransactions.$inferSelect;

// Users and Profiles for authentication (already in the schema)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  created_at: timestamp("created_at").defaultNow()
});

export const insertProfileSchema = createInsertSchema(profiles).pick({
  id: true,
  email: true,
  name: true
});

export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profiles.$inferSelect;
