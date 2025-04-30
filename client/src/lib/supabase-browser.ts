import { createClient } from '@supabase/supabase-js';

// Obtendo as variáveis de ambiente do Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://aqmtastioqboqrkvcuhc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxbXRhc3Rpb3Fib3Fya3ZjdWhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2OTMzOTEsImV4cCI6MjA1NjI2OTM5MX0.78pP7Tbh9Pmn4wkZK447TDu3V_CMQJP-caM7m4N109k';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Atenção: Variáveis de ambiente do Supabase podem não estar configuradas corretamente.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);