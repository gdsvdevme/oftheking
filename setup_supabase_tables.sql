-- Script para criar as tabelas necessárias no Supabase
-- Execute este script no SQL Editor do seu projeto Supabase

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso para permitir operações de leitura/escrita
CREATE POLICY "Permitir acesso total para usuários autenticados" 
ON public.clientes 
FOR ALL USING (auth.role() = 'authenticated');

-- Tabela de Agendamentos
CREATE TABLE IF NOT EXISTS public.agendamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clientes(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    final_price NUMERIC DEFAULT 0,
    recurrence TEXT,
    payment_date TIMESTAMP WITH TIME ZONE,
    payment_status TEXT DEFAULT 'paid' NOT NULL
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso para permitir operações de leitura/escrita
CREATE POLICY "Permitir acesso total para usuários autenticados" 
ON public.agendamentos 
FOR ALL USING (auth.role() = 'authenticated');

-- IMPORTANTE: As instruções abaixo permitem que a chave de serviço (service role) 
-- do Supabase ignore completamente o RLS e acesse todos os dados.
-- 
-- Se o problema persistir mesmo após criar as tabelas e as políticas acima,
-- você pode precisar verificar se sua chave de serviço tem permissões de admin 
-- e se o banco de dados está configurado corretamente.
--
-- Em alguns casos, pode ser necessário habilitar a flag "service_role" ao fazer
-- as requisições para o Supabase, garantindo que o RLS seja ignorado.