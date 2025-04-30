import { supabase } from '@shared/supabase';

export type SignInCredentials = {
  email: string;
  password: string;
};

export type SignUpCredentials = {
  email: string;
  password: string;
  name: string;
};

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

export const authService = {
  // Fazer login com email e senha
  async signInWithEmail({ email, password }: SignInCredentials) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  // Registrar um novo usuário
  async signUpWithEmail({ email, password, name }: SignUpCredentials) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      throw new Error(authError.message);
    }

    if (authData.user) {
      // Criar perfil para o usuário
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        email,
        name,
      });

      if (profileError) {
        throw new Error(profileError.message);
      }
    }

    return authData;
  },

  // Fazer logout
  async signOut() {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw new Error(error.message);
    }
  },

  // Verificar sessão atual
  async getCurrentSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  // Obter usuário atual
  async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;
    
    // Buscar dados do perfil
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    return {
      id: user.id,
      email: user.email || '',
      name: profile?.name || null,
    };
  },

  // Recuperar senha
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) {
      throw new Error(error.message);
    }
  },

  // Atualizar senha
  async updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({
      password,
    });
    
    if (error) {
      throw new Error(error.message);
    }
  },

  // Atualizar dados do usuário
  async updateUserProfile(userId: string, data: { name?: string }) {
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', userId);
    
    if (error) {
      throw new Error(error.message);
    }
  },

  // Ouvir mudanças na autenticação
  onAuthStateChange(callback: (event: 'SIGNED_IN' | 'SIGNED_OUT' | 'USER_UPDATED', session: any) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event as any, session);
    });
  }
};