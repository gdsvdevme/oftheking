import express from 'express';
import { storage } from '../server/storage.js';
import { initializeDatabase } from '../server/initData.js';

// Variável para armazenar a instância iniciada do aplicativo Express
let app;
let initialized = false;

// Função para inicializar a aplicação (será executada apenas uma vez)
async function initializeApp() {
  if (initialized) return app;
  
  console.log('Inicializando aplicação serverless...');
  
  // Criar aplicação Express
  app = express();
  
  // Configurações básicas
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Configuração de CORS para produção
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    next();
  });
  
  // Inicialização do banco de dados
  try {
    await initializeDatabase();
    console.log('Banco de dados inicializado com sucesso.');
  } catch (err) {
    console.error('Erro ao inicializar o banco de dados:', err);
    throw err;
  }
  
  // Configurar rotas
  // Clientes
  app.get('/api/clients', async (req, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      res.status(500).json({ error: 'Erro ao buscar clientes' });
    }
  });
  
  app.get('/api/clients/:id', async (req, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }
      res.json(client);
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      res.status(500).json({ error: 'Erro ao buscar cliente' });
    }
  });
  
  // Serviços
  app.get('/api/services', async (req, res) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
      res.status(500).json({ error: 'Erro ao buscar serviços' });
    }
  });
  
  // Agendamentos
  app.get('/api/appointments', async (req, res) => {
    try {
      const { startDate, endDate, page, perPage } = req.query;
      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;
      const pageNum = page ? parseInt(page) : undefined;
      const perPageNum = perPage ? parseInt(perPage) : undefined;
      
      const result = await storage.getAppointments(start, end, pageNum, perPageNum);
      res.json(result);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      res.status(500).json({ error: 'Erro ao buscar agendamentos' });
    }
  });
  
  app.get('/api/appointments/:id', async (req, res) => {
    try {
      const appointment = await storage.getAppointmentWithServices(req.params.id);
      if (!appointment) {
        return res.status(404).json({ error: 'Agendamento não encontrado' });
      }
      res.json(appointment);
    } catch (error) {
      console.error('Erro ao buscar agendamento:', error);
      res.status(500).json({ error: 'Erro ao buscar agendamento' });
    }
  });
  
  app.patch('/api/appointments/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const updateData = req.body;
      
      const appointment = await storage.updateAppointment(id, updateData);
      if (!appointment) {
        return res.status(404).json({ error: 'Agendamento não encontrado' });
      }
      
      res.json(appointment);
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
      res.status(500).json({ error: 'Erro ao atualizar agendamento' });
    }
  });
  
  // Endpoint específico para atualização de status de pagamento
  app.patch('/api/appointments/:id/payment-status', async (req, res) => {
    try {
      const id = req.params.id;
      const { paymentStatus, paymentMethod, status } = req.body;
      
      const updateData = {
        payment_status: paymentStatus,
        payment_method: paymentMethod,
        payment_date: new Date().toISOString()
      };
      
      // Se status também foi fornecido, adicionar ao updateData
      if (status) {
        updateData.status = status;
      }
      
      const appointment = await storage.updateAppointment(id, updateData);
      if (!appointment) {
        return res.status(404).json({ error: 'Agendamento não encontrado' });
      }
      
      res.json(appointment);
    } catch (error) {
      console.error('Erro ao atualizar status de pagamento:', error);
      res.status(500).json({ error: 'Erro ao atualizar status de pagamento' });
    }
  });
  
  // Endpoint para processamento de pagamentos em lote
  app.post('/api/appointments/bulk-payment', async (req, res) => {
    try {
      const { ids, paymentStatus, paymentMethod, status } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Lista de IDs inválida' });
      }
      
      const updateData = {
        payment_status: paymentStatus,
        payment_method: paymentMethod,
        payment_date: new Date().toISOString()
      };
      
      if (status) {
        updateData.status = status;
      }
      
      // Processar cada atualização individualmente
      const results = [];
      const errors = [];
      
      for (const id of ids) {
        try {
          const appointment = await storage.updateAppointment(id, updateData);
          if (appointment) {
            results.push(appointment);
          } else {
            errors.push({ id, error: 'Agendamento não encontrado' });
          }
        } catch (err) {
          errors.push({ id, error: err.message });
        }
      }
      
      res.json({
        success: results.length,
        failed: errors.length,
        results,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error('Erro ao processar pagamentos em lote:', error);
      res.status(500).json({ error: 'Erro ao processar pagamentos em lote' });
    }
  });
  
  // Bloqueios de horário
  app.get('/api/blocked-schedules', async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;
      
      const blockedSchedules = await storage.getBlockedSchedules(start, end);
      res.json(blockedSchedules);
    } catch (error) {
      console.error('Erro ao buscar horários bloqueados:', error);
      res.status(500).json({ error: 'Erro ao buscar horários bloqueados' });
    }
  });
  
  // Tratamento de erros
  app.use((err, _req, res, _next) => {
    console.error(err);
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Erro interno no servidor';
    res.status(statusCode).json({ error: message });
  });
  
  initialized = true;
  return app;
}

// Função handler para o Vercel
export default async function handler(req, res) {
  try {
    const app = await initializeApp();
    
    // Em funções serverless, precisamos gerenciar as requisições manualmente
    // em vez de simplesmente passar para o Express
    return new Promise((resolve, reject) => {
      app(req, res, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  } catch (error) {
    console.error('Erro na função serverless:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}