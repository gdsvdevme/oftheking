import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Navbar from "@/components/layout/navbar";
import Agenda from "@/pages/agenda";
import Clientes from "@/pages/clientes";
import Servicos from "@/pages/servicos";
import Financeiro from "@/pages/financeiro";
import Estoque from "@/pages/estoque";
import Login from "@/pages/login";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/protected-route";

// Componente de layout protegido
function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow">
          {children}
        </div>
      </div>
    </ProtectedRoute>
  );
}

function Router() {
  return (
    <Switch>
      {/* Rota pública de login */}
      <Route path="/login" component={Login} />
      
      {/* Rotas protegidas (requerem autenticação) */}
      <Route path="/">
        {() => (
          <ProtectedLayout>
            <Agenda />
          </ProtectedLayout>
        )}
      </Route>
      <Route path="/agenda">
        {() => (
          <ProtectedLayout>
            <Agenda />
          </ProtectedLayout>
        )}
      </Route>
      <Route path="/clientes">
        {() => (
          <ProtectedLayout>
            <Clientes />
          </ProtectedLayout>
        )}
      </Route>
      <Route path="/servicos">
        {() => (
          <ProtectedLayout>
            <Servicos />
          </ProtectedLayout>
        )}
      </Route>
      <Route path="/financeiro">
        {() => (
          <ProtectedLayout>
            <Financeiro />
          </ProtectedLayout>
        )}
      </Route>
      <Route path="/estoque">
        {() => (
          <ProtectedLayout>
            <Estoque />
          </ProtectedLayout>
        )}
      </Route>
      
      {/* Rota de página não encontrada */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
