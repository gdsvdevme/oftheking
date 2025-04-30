import { createClient } from '@supabase/supabase-js';
import * as schema from "@shared/schema";

// Usar as variáveis de ambiente do Supabase
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "SUPABASE_URL e SUPABASE_KEY devem estar definidos. Configure as variáveis de ambiente corretamente.",
  );
}

// Verificar formato da URL do Supabase
if (!supabaseUrl.match(/https:\/\/[^.]+\.supabase\.co/)) {
  console.warn(
    "Aviso: Formato de SUPABASE_URL não segue o padrão esperado https://[project-ref].supabase.co"
  );
}

// Criar cliente Supabase para todas as operações de banco de dados
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-client',
    },
  },
});

// Adaptador para compatibilidade com o código existente que usa Drizzle
// Este objeto simula a API do Drizzle, mas usa o cliente Supabase por baixo
export const db = {
  // Implementação genérica de select()
  select: () => {
    return {
      from: (table: any) => {
        // Este método retorna uma promise que será resolvida com os resultados da consulta
        const tableName = table._.name;
        return async (where?: any) => {
          try {
            let query = supabase.from(tableName).select('*');
            
            // Se houver uma cláusula where, adicionar ao query builder
            if (where) {
              // Esta é uma implementação simples; em um cenário real,
              // seria necessário traduzir as expressões do Drizzle para o formato do Supabase
              query = query.match(where);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            
            return data || [];
          } catch (error) {
            console.error(`Erro ao buscar dados da tabela ${tableName}:`, error);
            return [];
          }
        };
      },
      where: (condition: any) => {
        // Implementação stub para onde - seria necessário implementar a tradução
        // das expressões Drizzle para o formato Supabase
        return [];
      }
    };
  },
  
  // Implementação simples do insert
  insert: (table: any) => {
    return {
      values: async (data: any) => {
        const tableName = table._.name;
        try {
          const { data: result, error } = await supabase
            .from(tableName)
            .insert(Array.isArray(data) ? data : [data])
            .select();
          
          if (error) throw error;
          
          return result;
        } catch (error) {
          console.error(`Erro ao inserir dados na tabela ${tableName}:`, error);
          throw error;
        }
      }
    };
  },
  
  // Implementação simples do update
  update: (table: any) => {
    return {
      set: (data: any) => {
        return {
          where: async (condition: any) => {
            const tableName = table._.name;
            try {
              // Em uma implementação real, seria necessário traduzir a condição
              // para o formato esperado pelo Supabase
              const { data: result, error } = await supabase
                .from(tableName)
                .update(data)
                .match(condition)
                .select();
              
              if (error) throw error;
              
              return result;
            } catch (error) {
              console.error(`Erro ao atualizar dados na tabela ${tableName}:`, error);
              throw error;
            }
          }
        };
      }
    };
  },
  
  // Implementação simples do delete
  delete: (table: any) => {
    return {
      where: async (condition: any) => {
        const tableName = table._.name;
        try {
          // Em uma implementação real, seria necessário traduzir a condição
          const { error } = await supabase
            .from(tableName)
            .delete()
            .match(condition);
          
          if (error) throw error;
          
          return true;
        } catch (error) {
          console.error(`Erro ao excluir dados da tabela ${tableName}:`, error);
          throw error;
        }
      }
    };
  }
};