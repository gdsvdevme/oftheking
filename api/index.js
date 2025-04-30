// Edge API para Vercel - mais leve e compatível com o modelo serverless
import { storage } from './edge-storage.js';

// Função simplificada para simular inicialização
async function initializeDatabase() {
  console.log('Simulando inicialização do banco de dados para Edge Function');
  return true;
}

// Variável para rastrear inicialização
let isInitialized = false;

// Função para inicializar o banco de dados (chamada uma vez)
async function ensureInitialized() {
  if (!isInitialized) {
    try {
      console.log('Inicializando banco de dados...');
      await initializeDatabase();
      console.log('Banco de dados inicializado com sucesso.');
      isInitialized = true;
    } catch (err) {
      console.error('Erro ao inicializar o banco de dados:', err);
      throw err;
    }
  }
}

// Configuração para CORS
function setCorsHeaders(res) {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

// Handler principal para Edge Function da Vercel
export default async function handler(req) {
  // Verificar solicitações OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    const res = new Response(null, { status: 204 });
    setCorsHeaders(res);
    return res;
  }

  try {
    // Garantir que o banco de dados foi inicializado
    await ensureInitialized();
    
    // URL e path da requisição
    const url = new URL(req.url);
    const path = url.pathname;
    
    // Extrair query params
    const params = {};
    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    // Processar a rota
    // Rotas para clientes
    if (path === '/api/clients' && req.method === 'GET') {
      try {
        const clients = await storage.getClients();
        const res = Response.json(clients);
        setCorsHeaders(res);
        return res;
      } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        const res = Response.json({ error: 'Erro ao buscar clientes' }, { status: 500 });
        setCorsHeaders(res);
        return res;
      }
    }

    // Rota para cliente específico
    if (path.match(/^\/api\/clients\/[^\/]+$/) && req.method === 'GET') {
      try {
        const id = path.split('/').pop();
        const client = await storage.getClient(id);
        
        if (!client) {
          const res = Response.json({ error: 'Cliente não encontrado' }, { status: 404 });
          setCorsHeaders(res);
          return res;
        }
        
        const res = Response.json(client);
        setCorsHeaders(res);
        return res;
      } catch (error) {
        console.error('Erro ao buscar cliente:', error);
        const res = Response.json({ error: 'Erro ao buscar cliente' }, { status: 500 });
        setCorsHeaders(res);
        return res;
      }
    }

    // Rota para serviços
    if (path === '/api/services' && req.method === 'GET') {
      try {
        const services = await storage.getServices();
        const res = Response.json(services);
        setCorsHeaders(res);
        return res;
      } catch (error) {
        console.error('Erro ao buscar serviços:', error);
        const res = Response.json({ error: 'Erro ao buscar serviços' }, { status: 500 });
        setCorsHeaders(res);
        return res;
      }
    }

    // Rota para agendamentos
    if (path === '/api/appointments' && req.method === 'GET') {
      try {
        const startDate = params.startDate ? new Date(params.startDate) : undefined;
        const endDate = params.endDate ? new Date(params.endDate) : undefined;
        const page = params.page ? parseInt(params.page) : undefined;
        const perPage = params.perPage ? parseInt(params.perPage) : undefined;
        
        const result = await storage.getAppointments(startDate, endDate, page, perPage);
        const res = Response.json(result);
        setCorsHeaders(res);
        return res;
      } catch (error) {
        console.error('Erro ao buscar agendamentos:', error);
        const res = Response.json({ error: 'Erro ao buscar agendamentos' }, { status: 500 });
        setCorsHeaders(res);
        return res;
      }
    }

    // Rota para agendamentos próximos
    if (path === '/api/appointments/upcoming' && req.method === 'GET') {
      try {
        const limit = params.limit ? parseInt(params.limit) : 10;
        const appointments = await storage.getUpcomingAppointments(limit);
        const res = Response.json(appointments);
        setCorsHeaders(res);
        return res;
      } catch (error) {
        console.error('Erro ao buscar agendamentos próximos:', error);
        const res = Response.json({ error: 'Erro ao buscar agendamentos próximos' }, { status: 500 });
        setCorsHeaders(res);
        return res;
      }
    }

    // Rota para pagamento em lote
    if (path === '/api/appointments/bulk-payment' && req.method === 'POST') {
      try {
        const body = await req.json();
        const { ids, paymentStatus, paymentMethod, status } = body;
        
        if (!Array.isArray(ids) || ids.length === 0) {
          const res = Response.json({ error: 'Lista de IDs inválida' }, { status: 400 });
          setCorsHeaders(res);
          return res;
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
        
        const res = Response.json({
          success: results.length,
          failed: errors.length,
          results,
          errors: errors.length > 0 ? errors : undefined
        });
        setCorsHeaders(res);
        return res;
      } catch (error) {
        console.error('Erro ao processar pagamentos em lote:', error);
        const res = Response.json({ error: 'Erro ao processar pagamentos em lote' }, { status: 500 });
        setCorsHeaders(res);
        return res;
      }
    }

    // Rota para agendamento específico
    if (path.match(/^\/api\/appointments\/[^\/]+$/) && req.method === 'GET') {
      try {
        const id = path.split('/').pop();
        const appointment = await storage.getAppointmentWithServices(id);
        
        if (!appointment) {
          const res = Response.json({ error: 'Agendamento não encontrado' }, { status: 404 });
          setCorsHeaders(res);
          return res;
        }
        
        const res = Response.json(appointment);
        setCorsHeaders(res);
        return res;
      } catch (error) {
        console.error('Erro ao buscar agendamento:', error);
        const res = Response.json({ error: 'Erro ao buscar agendamento' }, { status: 500 });
        setCorsHeaders(res);
        return res;
      }
    }

    // Rota para atualizar agendamento
    if (path.match(/^\/api\/appointments\/[^\/]+$/) && req.method === 'PATCH') {
      try {
        const id = path.split('/').pop();
        const updateData = await req.json();
        
        const appointment = await storage.updateAppointment(id, updateData);
        if (!appointment) {
          const res = Response.json({ error: 'Agendamento não encontrado' }, { status: 404 });
          setCorsHeaders(res);
          return res;
        }
        
        const res = Response.json(appointment);
        setCorsHeaders(res);
        return res;
      } catch (error) {
        console.error('Erro ao atualizar agendamento:', error);
        const res = Response.json({ error: 'Erro ao atualizar agendamento' }, { status: 500 });
        setCorsHeaders(res);
        return res;
      }
    }

    // Rota para atualizar status de pagamento
    if (path.match(/^\/api\/appointments\/[^\/]+\/payment-status$/) && req.method === 'PATCH') {
      try {
        const id = path.split('/')[3];  // Extrair ID do agendamento
        const { paymentStatus, paymentMethod, status } = await req.json();
        
        const updateData = {
          payment_status: paymentStatus,
          payment_method: paymentMethod,
          payment_date: new Date().toISOString()
        };
        
        if (status) {
          updateData.status = status;
        }
        
        const appointment = await storage.updateAppointment(id, updateData);
        if (!appointment) {
          const res = Response.json({ error: 'Agendamento não encontrado' }, { status: 404 });
          setCorsHeaders(res);
          return res;
        }
        
        const res = Response.json(appointment);
        setCorsHeaders(res);
        return res;
      } catch (error) {
        console.error('Erro ao atualizar status de pagamento:', error);
        const res = Response.json({ error: 'Erro ao atualizar status de pagamento' }, { status: 500 });
        setCorsHeaders(res);
        return res;
      }
    }

    // Rota para bloqueios de horário
    if (path === '/api/blocked-schedules' && req.method === 'GET') {
      try {
        const startDate = params.startDate ? new Date(params.startDate) : undefined;
        const endDate = params.endDate ? new Date(params.endDate) : undefined;
        
        const blockedSchedules = await storage.getBlockedSchedules(startDate, endDate);
        const res = Response.json(blockedSchedules);
        setCorsHeaders(res);
        return res;
      } catch (error) {
        console.error('Erro ao buscar horários bloqueados:', error);
        const res = Response.json({ error: 'Erro ao buscar horários bloqueados' }, { status: 500 });
        setCorsHeaders(res);
        return res;
      }
    }

    // Rota para inventário
    if (path === '/api/inventory' && req.method === 'GET') {
      try {
        const inventory = await storage.getInventory();
        const res = Response.json(inventory);
        setCorsHeaders(res);
        return res;
      } catch (error) {
        console.error('Erro ao buscar inventário:', error);
        const res = Response.json({ error: 'Erro ao buscar inventário' }, { status: 500 });
        setCorsHeaders(res);
        return res;
      }
    }

    // Rota para itens com baixo estoque
    if (path === '/api/inventory/low-stock' && req.method === 'GET') {
      try {
        const limit = params.limit ? parseInt(params.limit) : 10;
        const lowStockItems = await storage.getLowStockItems(limit);
        const res = Response.json(lowStockItems);
        setCorsHeaders(res);
        return res;
      } catch (error) {
        console.error('Erro ao buscar itens com baixo estoque:', error);
        const res = Response.json({ error: 'Erro ao buscar itens com baixo estoque' }, { status: 500 });
        setCorsHeaders(res);
        return res;
      }
    }

    // Rota para resumo financeiro
    if (path === '/api/financial-summary' && req.method === 'GET') {
      try {
        // Obter datas do último mês por padrão
        const today = new Date();
        const startDate = params.startDate ? new Date(params.startDate) : new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        const endDate = params.endDate ? new Date(params.endDate) : today;
        
        const summary = await storage.getFinancialSummary(startDate, endDate);
        const res = Response.json(summary);
        setCorsHeaders(res);
        return res;
      } catch (error) {
        console.error('Erro ao buscar resumo financeiro:', error);
        const res = Response.json({ error: 'Erro ao buscar resumo financeiro' }, { status: 500 });
        setCorsHeaders(res);
        return res;
      }
    }

    // Se chegamos aqui, a rota não foi encontrada
    const res = Response.json({ error: 'Rota não encontrada' }, { status: 404 });
    setCorsHeaders(res);
    return res;
  } catch (error) {
    console.error('Erro na função Edge:', error);
    const res = Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
    setCorsHeaders(res);
    return res;
  }
}

// Configuração para Edge Function
export const config = {
  runtime: 'edge'
};