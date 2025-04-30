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
import { randomUUID } from "crypto";

// IDs para dados reais
// Utilizando dados reais baseados em clientes_com_agendamentos_e_pagamentos.json
const clientIds = {
  noTrabalhar: "1a4028cb-b4c0-4d10-9e2c-cf2b87fd790d",
  anaMaria: "549190a8-616a-41d0-af32-5e3ed4b587bb",
  camila: "1c017e5b-c434-4885-8203-44d85252c23f",
  bruna: "516a91c5-1e46-47d8-8fa1-88ee56a04e75",
  nadnny: "19e67991-3c2f-4baa-b429-3498beba3ec3",
  natanne: "e3e28710-2e54-49a9-bb8d-7cab5ca8f7cb", 
  diene: "1d55b9f6-1734-4301-975f-6a3c99cbc9ac",
  claudia: "29995f5f-d9c2-469c-9f7d-f8ec2484f71f",
};

// Serviços reais para o salão
const serviceIds = {
  corte: randomUUID(),
  escova: randomUUID(),
  hidratacao: randomUUID(),
  manicure: randomUUID(),
  pedicure: randomUUID(),
  coloracao: randomUUID(),
  sobrancelhas: randomUUID(),
  penteado: randomUUID(),
  maquiagem: randomUUID(),
};

// Produtos reais para estoque
const inventoryIds = {
  shampoo: randomUUID(),
  condicionador: randomUUID(),
  mascara: randomUUID(),
  esmalte: randomUUID(),
  tintura: randomUUID(),
  fixador: randomUUID(),
};

// IDs para agendamentos
const appointmentIds = {
  appointment1: "6569776a-4c3e-4ae3-a797-de75ac70eaee",
  appointment2: "d5cf52da-359e-46e8-9bd8-df251d96066e",
  appointment3: "e206c691-035a-4a37-8b6d-285bcd7e194f",
  appointment4: "dc75794d-4d3e-4e0e-b498-a1c38bc6b52b",
  appointment5: "7cdd214d-76b7-4858-9498-e8e8bb8fac2a",
};

// IDs para serviços de agendamento
const appointmentServiceIds = {
  as1: randomUUID(),
  as2: randomUUID(),
  as3: randomUUID(),
  as4: randomUUID(),
  as5: randomUUID(),
};

// IDs para horários bloqueados
const blockedScheduleIds = {
  blocked1: randomUUID(),
};

// IDs para transações financeiras
const financialTransactionIds = {
  ft1: "a0f61bc3-b21b-4f42-a445-f2e88d944021",
  ft2: "1b936924-b20a-4da8-90e0-77df3edbd52d",
  ft3: "a385075d-e899-401a-8caa-f68b786db126",
};

export async function initializeDatabase() {
  console.log("Verificando a existência de dados no banco de dados...");
  
  try {
    // Verificar clientes
    const existingClients = await db.select().from(clients);
    if (existingClients.length === 0) {
      console.log("Adicionando dados iniciais de clientes...");
      
      await db.insert(clients).values([
        {
          id: clientIds.client1,
          name: "Ana Souza",
          phone: "(11) 98765-4321",
          created_at: new Date(),
        },
        {
          id: clientIds.client2,
          name: "Carla Mendes",
          phone: "(11) 97654-3210",
          created_at: new Date(),
        },
        {
          id: clientIds.client3,
          name: "Renata Oliveira",
          phone: "(11) 96543-2109",
          created_at: new Date(),
        },
        {
          id: clientIds.client4,
          name: "Lucia Fernandes",
          phone: "(11) 95432-1098",
          created_at: new Date(),
        }
      ]);
    }
    
    // Verificar serviços
    const existingServices = await db.select().from(services);
    if (existingServices.length === 0) {
      console.log("Adicionando dados iniciais de serviços...");
      
      await db.insert(services).values([
        {
          id: serviceIds.service1,
          name: "Corte Feminino",
          price: "80",
          duration: 60,
          created_at: new Date(),
        },
        {
          id: serviceIds.service2,
          name: "Escova",
          price: "50",
          duration: 40,
          created_at: new Date(),
        },
        {
          id: serviceIds.service3,
          name: "Hidratação Profunda",
          price: "70",
          duration: 45,
          created_at: new Date(),
        },
        {
          id: serviceIds.service4,
          name: "Manicure",
          price: "45",
          duration: 40,
          created_at: new Date(),
        },
        {
          id: serviceIds.service5,
          name: "Pedicure",
          price: "50",
          duration: 45,
          created_at: new Date(),
        },
        {
          id: serviceIds.service6,
          name: "Coloração",
          price: "150",
          duration: 90,
          created_at: new Date(),
        },
        {
          id: serviceIds.service7,
          name: "Design de Sobrancelhas",
          price: "35",
          duration: 30,
          created_at: new Date(),
        }
      ]);
    }
    
    // Verificar inventário
    const existingInventory = await db.select().from(inventory);
    if (existingInventory.length === 0) {
      console.log("Adicionando dados iniciais de inventário...");
      
      await db.insert(inventory).values([
        {
          id: inventoryIds.inventory1,
          name: "Shampoo Profissional",
          quantity: 5,
          cost_price: "15",
          selling_price: "30",
          category: "Cabelo",
          created_at: new Date(),
        },
        {
          id: inventoryIds.inventory2,
          name: "Condicionador Hidratante",
          quantity: 12,
          cost_price: "18",
          selling_price: "35",
          category: "Cabelo",
          created_at: new Date(),
        },
        {
          id: inventoryIds.inventory3,
          name: "Máscara Capilar",
          quantity: 25,
          cost_price: "25",
          selling_price: "45",
          category: "Cabelo",
          created_at: new Date(),
        },
        {
          id: inventoryIds.inventory4,
          name: "Esmalte Nude",
          quantity: 3,
          cost_price: "5",
          selling_price: "12",
          category: "Unhas",
          created_at: new Date(),
        }
      ]);
    }
    
    // Verificar agendamentos
    const existingAppointments = await db.select().from(appointments);
    if (existingAppointments.length === 0) {
      console.log("Adicionando dados iniciais de agendamentos...");
      
      // Criar data de hoje às 9:00
      const today = new Date();
      today.setHours(9, 0, 0, 0);
      
      // Adicionar agendamentos
      await db.insert(appointments).values([
        {
          id: appointmentIds.appointment1,
          client_id: clientIds.client1,
          start_time: new Date(today.getTime()),
          end_time: new Date(today.getTime() + 60 * 60 * 1000), // 1 hora depois
          status: "scheduled",
          payment_status: "paid",
          final_price: "80",
          notes: "Cliente regular",
          created_at: new Date(),
          payment_date: new Date(),
        },
        {
          id: appointmentIds.appointment2,
          client_id: clientIds.client2,
          start_time: new Date(today.getTime() + 2.5 * 60 * 60 * 1000), // 2.5 horas depois
          end_time: new Date(today.getTime() + 4 * 60 * 60 * 1000), // 4 horas depois
          status: "scheduled",
          payment_status: "paid",
          final_price: "120",
          notes: "Escova + Hidratação",
          created_at: new Date(),
          payment_date: new Date(),
        },
        {
          id: appointmentIds.appointment3,
          client_id: clientIds.client3,
          start_time: new Date(today.getTime() + 5 * 60 * 60 * 1000), // 5 horas depois
          end_time: new Date(today.getTime() + 6.5 * 60 * 60 * 1000), // 6.5 horas depois
          status: "scheduled",
          payment_status: "pending",
          final_price: "95",
          notes: "Cliente solicitou esmalte vermelho para as mãos e nude para os pés.",
          created_at: new Date(),
        }
      ]);
      
      // Adicionar serviços para os agendamentos
      await db.insert(appointmentServices).values([
        { 
          id: appointmentServiceIds.as1, 
          appointment_id: appointmentIds.appointment1, 
          service_id: serviceIds.service1, 
          price: "80", 
          final_price: "80" 
        },
        { 
          id: appointmentServiceIds.as2, 
          appointment_id: appointmentIds.appointment2, 
          service_id: serviceIds.service2, 
          price: "50", 
          final_price: "50" 
        },
        { 
          id: appointmentServiceIds.as3, 
          appointment_id: appointmentIds.appointment2, 
          service_id: serviceIds.service3, 
          price: "70", 
          final_price: "70" 
        },
        { 
          id: appointmentServiceIds.as4, 
          appointment_id: appointmentIds.appointment3, 
          service_id: serviceIds.service4, 
          price: "45", 
          final_price: "45" 
        },
        { 
          id: appointmentServiceIds.as5, 
          appointment_id: appointmentIds.appointment3, 
          service_id: serviceIds.service5, 
          price: "50", 
          final_price: "50" 
        }
      ]);
      
      // Adicionar horários bloqueados
      await db.insert(blockedSchedules).values([
        {
          id: blockedScheduleIds.blocked1,
          start_time: new Date(today.getTime() + 4 * 60 * 60 * 1000), // 4 horas depois
          end_time: new Date(today.getTime() + 5 * 60 * 60 * 1000), // 5 horas depois
          reason: "Intervalo para almoço",
          created_at: new Date()
        }
      ]);
      
      // Adicionar transações financeiras
      await db.insert(financialTransactions).values([
        {
          id: financialTransactionIds.ft1,
          transaction_date: new Date(today.getTime()),
          description: "Serviço realizado - Ana Souza",
          amount: "80",
          type: "income",
          category: "Serviços",
          related_appointment_id: appointmentIds.appointment1,
          payment_method: "Dinheiro",
          created_at: new Date()
        },
        {
          id: financialTransactionIds.ft2,
          transaction_date: new Date(today.getTime() - 24 * 60 * 60 * 1000), // Ontem
          description: "Serviço realizado - Carla Mendes",
          amount: "120",
          type: "income",
          category: "Serviços",
          related_appointment_id: appointmentIds.appointment2,
          payment_method: "Cartão de Crédito",
          created_at: new Date(today.getTime() - 24 * 60 * 60 * 1000)
        },
        {
          id: financialTransactionIds.ft3,
          transaction_date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 dias atrás
          description: "Compra de produtos - Shampoo",
          amount: "350",
          type: "expense",
          category: "Produtos",
          payment_method: "Transferência",
          created_at: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)
        }
      ]);
    }
    
    console.log("Inicialização de dados concluída.");
  } catch (error) {
    console.error("Erro ao inicializar os dados:", error);
  }
}