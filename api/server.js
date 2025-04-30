// Abordagem serverless pura sem dependência do Express
// Isso elimina a necessidade de um servidor HTTP persistente
import { storage } from '../server/storage.js';
import { initializeDatabase } from '../server/initData.js';

// Controle de inicialização para manter conexão com o banco de dados
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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

// Função para processar o corpo da requisição
async function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const parsedBody = body ? JSON.parse(body) : {};
        resolve(parsedBody);
      } catch (e) {
        console.error('Erro ao processar corpo da requisição:', e);
        resolve({});
      }
    });
  });
}

// Função para lidar com rotas de API
async function handleRoute(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  const method = req.method;

  // Verificar solicitações OPTIONS (CORS preflight)
  if (method === 'OPTIONS') {
    setCorsHeaders(res);
    res.statusCode = 204;
    res.end();
    return;
  }

  // Obter parâmetros da query
  const params = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  // Rotas para clientes
  if (path === '/api/clients' && method === 'GET') {
    try {
      const clients = await storage.getClients();
      setCorsHeaders(res);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(clients));
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      setCorsHeaders(res);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Erro ao buscar clientes' }));
    }
    return;
  }

  // Rota para cliente específico
  if (path.match(/^\/api\/clients\/[^\/]+$/) && method === 'GET') {
    try {
      const id = path.split('/').pop();
      const client = await storage.getClient(id);
      
      if (!client) {
        setCorsHeaders(res);
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Cliente não encontrado' }));
        return;
      }
      
      setCorsHeaders(res);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(client));
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      setCorsHeaders(res);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Erro ao buscar cliente' }));
    }
    return;
  }

  // Rota para serviços
  if (path === '/api/services' && method === 'GET') {
    try {
      const services = await storage.getServices();
      setCorsHeaders(res);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(services));
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
      setCorsHeaders(res);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Erro ao buscar serviços' }));
    }
    return;
  }

  // Rota para agendamentos
  if (path === '/api/appointments' && method === 'GET') {
    try {
      const startDate = params.startDate ? new Date(params.startDate) : undefined;
      const endDate = params.endDate ? new Date(params.endDate) : undefined;
      const page = params.page ? parseInt(params.page) : undefined;
      const perPage = params.perPage ? parseInt(params.perPage) : undefined;
      
      const result = await storage.getAppointments(startDate, endDate, page, perPage);
      setCorsHeaders(res);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result));
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      setCorsHeaders(res);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Erro ao buscar agendamentos' }));
    }
    return;
  }

  // Rota para agendamentos próximos
  if (path === '/api/appointments/upcoming' && method === 'GET') {
    try {
      const limit = params.limit ? parseInt(params.limit) : 10;
      const appointments = await storage.getUpcomingAppointments(limit);
      setCorsHeaders(res);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(appointments));
    } catch (error) {
      console.error('Erro ao buscar agendamentos próximos:', error);
      setCorsHeaders(res);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Erro ao buscar agendamentos próximos' }));
    }
    return;
  }

  // Rota para pagamento em lote
  if (path === '/api/appointments/bulk-payment' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const { ids, paymentStatus, paymentMethod, status } = body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        setCorsHeaders(res);
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Lista de IDs inválida' }));
        return;
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
      
      setCorsHeaders(res);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: results.length,
        failed: errors.length,
        results,
        errors: errors.length > 0 ? errors : undefined
      }));
    } catch (error) {
      console.error('Erro ao processar pagamentos em lote:', error);
      setCorsHeaders(res);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Erro ao processar pagamentos em lote' }));
    }
    return;
  }

  // Rota para agendamento específico
  if (path.match(/^\/api\/appointments\/[^\/]+$/) && method === 'GET') {
    try {
      const id = path.split('/').pop();
      const appointment = await storage.getAppointmentWithServices(id);
      
      if (!appointment) {
        setCorsHeaders(res);
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Agendamento não encontrado' }));
        return;
      }
      
      setCorsHeaders(res);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(appointment));
    } catch (error) {
      console.error('Erro ao buscar agendamento:', error);
      setCorsHeaders(res);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Erro ao buscar agendamento' }));
    }
    return;
  }

  // Rota para atualizar agendamento
  if (path.match(/^\/api\/appointments\/[^\/]+$/) && method === 'PATCH') {
    try {
      const id = path.split('/').pop();
      const updateData = await parseBody(req);
      
      const appointment = await storage.updateAppointment(id, updateData);
      if (!appointment) {
        setCorsHeaders(res);
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Agendamento não encontrado' }));
        return;
      }
      
      setCorsHeaders(res);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(appointment));
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
      setCorsHeaders(res);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Erro ao atualizar agendamento' }));
    }
    return;
  }

  // Rota para atualizar status de pagamento
  if (path.match(/^\/api\/appointments\/[^\/]+\/payment-status$/) && method === 'PATCH') {
    try {
      const id = path.split('/')[3];  // Extrair ID do agendamento
      const { paymentStatus, paymentMethod, status } = await parseBody(req);
      
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
        setCorsHeaders(res);
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Agendamento não encontrado' }));
        return;
      }
      
      setCorsHeaders(res);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(appointment));
    } catch (error) {
      console.error('Erro ao atualizar status de pagamento:', error);
      setCorsHeaders(res);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Erro ao atualizar status de pagamento' }));
    }
    return;
  }

  // Rota para bloqueios de horário
  if (path === '/api/blocked-schedules' && method === 'GET') {
    try {
      const startDate = params.startDate ? new Date(params.startDate) : undefined;
      const endDate = params.endDate ? new Date(params.endDate) : undefined;
      
      const blockedSchedules = await storage.getBlockedSchedules(startDate, endDate);
      setCorsHeaders(res);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(blockedSchedules));
    } catch (error) {
      console.error('Erro ao buscar horários bloqueados:', error);
      setCorsHeaders(res);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Erro ao buscar horários bloqueados' }));
    }
    return;
  }

  // Se chegamos aqui, a rota não foi encontrada
  setCorsHeaders(res);
  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'Rota não encontrada' }));
}

// Função handler principal para o Vercel
export default async function handler(req, res) {
  try {
    // Garantir que o banco de dados foi inicializado
    await ensureInitialized();
    
    // Processar a rota
    await handleRoute(req, res);
  } catch (error) {
    console.error('Erro na função serverless:', error);
    setCorsHeaders(res);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Erro interno do servidor' }));
  }
}