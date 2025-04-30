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

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow">
        <Switch>
          <Route path="/" component={Agenda} />
          <Route path="/agenda" component={Agenda} />
          <Route path="/clientes" component={Clientes} />
          <Route path="/servicos" component={Servicos} />
          <Route path="/financeiro" component={Financeiro} />
          <Route path="/estoque" component={Estoque} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
