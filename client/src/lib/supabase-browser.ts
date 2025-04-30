import { createClient } from '@supabase/supabase-js';

// Use valores fixos por enquanto, já que as variáveis de ambiente não estão sendo carregadas corretamente
const supabaseUrl = 'https://aqmtastioqboqrkvcuhc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxbXRhc3Rpb3Fib3Fya3ZjdWhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2OTMzOTEsImV4cCI6MjA1NjI2OTM5MX0.78pP7Tbh9Pmn4wkZK447TDu3V_CMQJP-caM7m4N109k';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);