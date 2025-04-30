import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, AuthUser } from '@/lib/authService';
import { useToast } from '@/hooks/use-toast';

interface AuthContextData {
  user: AuthUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: { name?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function loadUserData() {
      try {
        setIsLoading(true);
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadUserData();

    // Configurar o listener para mudanças na autenticação
    const { data: authListener } = authService.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    // Remover o listener ao desmontar o componente
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string) {
    try {
      setIsLoading(true);
      await authService.signInWithEmail({ email, password });
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      toast({
        title: 'Login realizado com sucesso!',
        description: `Bem-vindo(a) ${currentUser?.name || email}`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao fazer login',
        description: error.message || 'Verifique suas credenciais e tente novamente',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function signUp(email: string, password: string, name: string) {
    try {
      setIsLoading(true);
      await authService.signUpWithEmail({ email, password, name });
      toast({
        title: 'Conta criada com sucesso!',
        description: 'Você já pode fazer login na plataforma.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao criar conta',
        description: error.message || 'Tente novamente com outros dados',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function signOut() {
    try {
      setIsLoading(true);
      await authService.signOut();
      setUser(null);
      toast({
        title: 'Você saiu da plataforma',
        description: 'Até a próxima!',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao sair',
        description: error.message || 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function resetPassword(email: string) {
    try {
      await authService.resetPassword(email);
      toast({
        title: 'E-mail enviado',
        description: 'Verifique sua caixa de entrada para redefinir sua senha',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar e-mail',
        description: error.message || 'Tente novamente',
        variant: 'destructive',
      });
      throw error;
    }
  }

  async function updateProfile(data: { name?: string }) {
    try {
      if (!user) return;
      
      await authService.updateUserProfile(user.id, data);
      
      // Atualizar o estado local
      setUser(prev => prev ? { ...prev, ...data } : null);
      
      toast({
        title: 'Perfil atualizado!',
        description: 'Suas informações foram atualizadas com sucesso',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar perfil',
        description: error.message || 'Tente novamente',
        variant: 'destructive',
      });
      throw error;
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextData {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }

  return context;
}