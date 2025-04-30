import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Check, 
  X, 
  AlertCircle, 
  Clock, 
  Calendar,
  ArrowLeft,
  ArrowRight,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Componente para o modal de pagamento
function PaymentModal({ 
  open, 
  onClose, 
  appointment, 
  onConfirmPayment 
}: { 
  open: boolean; 
  onClose: () => void; 
  appointment: any; 
  onConfirmPayment: (id: string, method: string) => void;
}) {
  const [paymentMethod, setPaymentMethod] = useState("dinheiro");
  
  if (!appointment) return null;
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmPayment(appointment.id, paymentMethod);
  };
  
  // Calcular valor total utilizando o final_price
  const totalValue = appointment.services?.reduce((total: number, service: any) => {
    // Usar final_price se disponível, caso contrário usar o price
    const price = typeof service.final_price !== 'undefined' && service.final_price !== null
      ? (typeof service.final_price === 'number' 
        ? service.final_price 
        : parseFloat(service.final_price || '0'))
      : (typeof service.services?.price === 'number' 
        ? service.services.price 
        : parseFloat(service.services?.price || '0'));
    return total + price;
  }, 0) || 0;
  
  const formattedDate = appointment.start_time ? 
    format(new Date(appointment.start_time), "dd 'de' MMMM', às' HH:mm", { locale: ptBR }) : 
    '';
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmar Pagamento</DialogTitle>
          <DialogDescription>
            Registre o pagamento deste atendimento.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div className="grid gap-1">
              <div className="text-sm font-medium">Cliente</div>
              <div>{appointment.client?.name || 'Cliente não identificado'}</div>
            </div>
            
            <div className="grid gap-1">
              <div className="text-sm font-medium">Data do atendimento</div>
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                {formattedDate}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-sm font-medium">Serviços</div>
              <div className="border rounded-md p-2 space-y-2">
                {appointment.services?.map((service: any) => (
                  <div key={service.id} className="flex justify-between text-sm">
                    <span>{service.services?.name}</span>
                    <span>R$ {typeof service.services?.price === 'number' 
                      ? service.services.price.toFixed(2).replace('.', ',')
                      : service.services?.price || '0,00'}</span>
                  </div>
                ))}
                <div className="pt-2 border-t flex justify-between font-medium">
                  <span>Valor Total</span>
                  <span>R$ {totalValue.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payment-method">Forma de pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="payment-method">
                  <SelectValue placeholder="Selecione a forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Confirmar Pagamento</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Modal para mostrar detalhes do cliente e todos os seus pagamentos pendentes
function ClientPaymentsModal({ 
  open, 
  onClose, 
  client, 
  appointments, 
  onConfirmPayment,
  onBulkPayment
}: { 
  open: boolean; 
  onClose: () => void; 
  client: any;
  appointments: any[];
  onConfirmPayment: (id: string, method: string) => void;
  onBulkPayment: (ids: string[], method: string) => void;
}) {
  const [paymentMethod, setPaymentMethod] = useState("dinheiro");
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showSinglePaymentModal, setShowSinglePaymentModal] = useState(false);
  
  if (!client || !appointments.length) return null;
  
  // Calcular valor total de todos os agendamentos
  const totalValue = appointments.reduce((total, appointment) => {
    const appointmentTotal = appointment.services?.reduce((serviceTotal: number, service: any) => {
      const price = typeof service.final_price !== 'undefined' && service.final_price !== null
        ? (typeof service.final_price === 'number' 
          ? service.final_price 
          : parseFloat(service.final_price || '0'))
        : (typeof service.services?.price === 'number' 
          ? service.services.price 
          : parseFloat(service.services?.price || '0'));
      return serviceTotal + price;
    }, 0) || 0;
    
    return total + appointmentTotal;
  }, 0);
  
  const handlePayAll = () => {
    const appointmentIds = appointments.map(appointment => appointment.id);
    onBulkPayment(appointmentIds, paymentMethod);
  };
  
  const handleOpenSinglePayment = (appointment: any) => {
    setSelectedAppointment(appointment);
    setShowSinglePaymentModal(true);
  };
  
  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Pagamentos Pendentes - {client.name}</DialogTitle>
            <DialogDescription>
              Lista de todos os pagamentos pendentes para este cliente
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm font-medium">Cliente: {client.name}</p>
                <p className="text-sm text-muted-foreground">Total a receber: R$ {totalValue.toFixed(2).replace('.', ',')}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Forma de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                    <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button onClick={handlePayAll}>
                  <Check className="h-4 w-4 mr-1" />
                  Pagar Todos
                </Button>
              </div>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Serviços</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((appointment) => {
                    const startTime = appointment.start_time ? new Date(appointment.start_time) : null;
                    const formattedDate = startTime 
                      ? format(startTime, "dd/MM/yyyy • HH:mm", { locale: ptBR }) 
                      : 'Data não definida';
                    
                    // Calcular valor total
                    const totalValue = appointment.services?.reduce((total: number, service: any) => {
                      const price = typeof service.final_price !== 'undefined' && service.final_price !== null
                        ? (typeof service.final_price === 'number' 
                          ? service.final_price 
                          : parseFloat(service.final_price || '0'))
                        : (typeof service.services?.price === 'number' 
                          ? service.services.price 
                          : parseFloat(service.services?.price || '0'));
                      return total + price;
                    }, 0) || 0;
                    
                    // Lista de serviços
                    const servicesList = appointment.services?.map((s: any) => s.services?.name).join(", ") || "Sem serviços";
                    
                    return (
                      <TableRow key={appointment.id}>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center">
                            <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                            {formattedDate}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate" title={servicesList}>
                          {servicesList}
                        </TableCell>
                        <TableCell>
                          R$ {totalValue.toFixed(2).replace('.', ',')}
                        </TableCell>
                        <TableCell>
                          {appointment.status === "scheduled" && (
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Agendado</Badge>
                          )}
                          {appointment.status === "confirmed" && (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800">Confirmado</Badge>
                          )}
                          {appointment.status === "completed" && (
                            <Badge variant="outline" className="bg-green-100 text-green-800">Concluído</Badge>
                          )}
                          {appointment.status === "cancelled" && (
                            <Badge variant="outline" className="bg-red-100 text-red-800">Cancelado</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleOpenSinglePayment(appointment)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Pagar
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal para pagamento individual */}
      {selectedAppointment && (
        <PaymentModal
          open={showSinglePaymentModal}
          onClose={() => setShowSinglePaymentModal(false)}
          appointment={selectedAppointment}
          onConfirmPayment={(id, method) => {
            onConfirmPayment(id, method);
            setShowSinglePaymentModal(false);
          }}
        />
      )}
    </>
  );
}

export default function PagamentosPendentes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("pending");
  const [dateFilter, setDateFilter] = useState<"past" | "all">("past");
  
  // Data atual para filtro
  const today = new Date();
  today.setHours(23, 59, 59, 999); // Final do dia de hoje
  
  // Consulta para carregar os agendamentos
  const { data, isLoading, refetch } = useQuery<{
    appointments: any[];
    pagination: {
      total: number;
      page: number;
      perPage: number;
      totalPages: number;
    };
  }>({
    queryKey: ['/api/appointments'],
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
  
  // Mutação para atualizar o status de pagamento
  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ id, paymentStatus, paymentMethod }: { id: string; paymentStatus: string; paymentMethod?: string }) => {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_status: paymentStatus,
          payment_method: paymentMethod,
          payment_date: new Date().toISOString(),
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar pagamento');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({
        title: "Pagamento atualizado",
        description: "O status do pagamento foi atualizado com sucesso.",
      });
      setShowPaymentModal(false);
      setShowClientModal(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar pagamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutação para pagamento em lote
  const bulkUpdatePaymentStatusMutation = useMutation({
    mutationFn: async ({ ids, paymentStatus, paymentMethod }: { ids: string[]; paymentStatus: string; paymentMethod: string }) => {
      // Processar cada atualização individualmente
      const promises = ids.map(id => 
        fetch(`/api/appointments/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            payment_status: paymentStatus,
            payment_method: paymentMethod,
            payment_date: new Date().toISOString(),
          }),
        }).then(response => {
          if (!response.ok) {
            throw new Error(`Erro ao atualizar pagamento #${id}`);
          }
          return response.json();
        })
      );
      
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({
        title: "Pagamentos atualizados",
        description: "Todos os pagamentos foram processados com sucesso.",
      });
      setShowClientModal(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao processar pagamentos",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Todos os agendamentos vêm do servidor
  const allAppointments = data?.appointments || [];
    
  // Filtrar agendamentos
  const pendingPayments = allAppointments.filter((appointment: any) => {
        // Filtro básico por status de pagamento
        const matchesPaymentStatus = activeTab === "all" || 
          (activeTab === "pending" && (appointment.payment_status === "pendente" || appointment.status === "pagamento pendente")) ||
          (activeTab === "paid" && (appointment.payment_status === "pago" || appointment.status === "finalizado"));
          
        // Filtro por status do agendamento
        const matchesStatus = statusFilter === "all" || 
          appointment.status === statusFilter;
        
        // Filtro de busca
        const searchLower = searchQuery.toLowerCase();
        const nameMatch = appointment.client?.name?.toLowerCase().includes(searchLower);
        
        // Filtro por data - apenas da data atual para trás
        const appointmentDate = new Date(appointment.start_time);
        const matchesDate = dateFilter === "all" || 
                           (dateFilter === "past" && appointmentDate <= today);
        
        return matchesPaymentStatus && matchesStatus && matchesDate && (searchQuery === "" || nameMatch);
      });
  
  // Agrupar por cliente
  const clientMap = new Map();
  
  pendingPayments.forEach((appointment: any) => {
    if (appointment.client) {
      const clientId = appointment.client.id;
      if (!clientMap.has(clientId)) {
        clientMap.set(clientId, {
          client: appointment.client,
          appointments: []
        });
      }
      
      clientMap.get(clientId).appointments.push(appointment);
    }
  });
  
  const clientGroups = Array.from(clientMap.values());
  
  // Paginação
  const itemsPerPage = 10;
  const totalPages = Math.ceil(clientGroups.length / itemsPerPage);
  const paginatedClients = clientGroups.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Manipuladores
  const handleOpenPaymentModal = (appointment: any) => {
    setSelectedPayment(appointment);
    setShowPaymentModal(true);
  };
  
  const handleOpenClientModal = (client: any, appointments: any[]) => {
    setSelectedClient(client);
    // Filtrar apenas pagamentos pendentes se estivermos na aba "pendentes"
    const filteredAppointments = activeTab === "pending" 
      ? appointments.filter(a => a.payment_status === "pendente" || a.status === "pagamento pendente")
      : appointments;
    
    setSelectedClient({
      ...client,
      pendingAppointments: filteredAppointments
    });
    setShowClientModal(true);
  };
  
  const handleConfirmPayment = (id: string, paymentMethod: string) => {
    updatePaymentStatusMutation.mutate({ 
      id, 
      paymentStatus: "paid",
      paymentMethod 
    });
  };
  
  const handleBulkPayment = (ids: string[], paymentMethod: string) => {
    bulkUpdatePaymentStatusMutation.mutate({
      ids,
      paymentStatus: "paid",
      paymentMethod
    });
  };
  
  const handleCancelPayment = (id: string) => {
    if (confirm("Tem certeza que deseja cancelar este pagamento?")) {
      updatePaymentStatusMutation.mutate({ 
        id, 
        paymentStatus: "cancelled"
      });
    }
  };
  
  // Status labels
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
      case "agendado":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Agendado</Badge>;
      case "confirmed":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Confirmado</Badge>;
      case "completed":
      case "finalizado":
        return <Badge variant="outline" className="bg-green-100 text-green-800">Finalizado</Badge>;
      case "cancelled":
      case "cancelado":
        return <Badge variant="outline" className="bg-red-100 text-red-800">Cancelado</Badge>;
      case "pagamento pendente":
        return <Badge variant="outline" className="bg-orange-100 text-orange-800">Pagamento Pendente</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };
  
  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
      case "pago":
        return <Badge className="bg-green-100 text-green-800">Pago</Badge>;
      case "pending":
      case "pendente":
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case "cancelled":
      case "cancelado":
        return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-poppins font-semibold leading-7 text-dark sm:truncate">
            Pagamentos
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie os pagamentos dos atendimentos por cliente
          </p>
        </div>
        <div className="mt-4 md:mt-0 md:ml-4">
          <Button
            onClick={() => refetch()}
            variant="outline" 
            className="ml-2"
            size="sm"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>
      
      <Card className="mb-8">
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="pending">Pendentes</TabsTrigger>
              <TabsTrigger value="paid">Pagos</TabsTrigger>
              <TabsTrigger value="all">Todos</TabsTrigger>
            </TabsList>
            
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por cliente..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex w-full md:w-auto gap-2">
                <div className="w-full md:w-64">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="scheduled">Agendado</SelectItem>
                      <SelectItem value="confirmed">Confirmado</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="w-full md:w-auto">
                  <Select value={dateFilter} onValueChange={(value: "past" | "all") => setDateFilter(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por data" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="past">Até hoje</SelectItem>
                      <SelectItem value="all">Todas as datas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Total Pendente</TableHead>
                    <TableHead>Atendimentos</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                        Carregando pagamentos...
                      </TableCell>
                    </TableRow>
                  ) : paginatedClients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <AlertCircle className="h-8 w-8 text-muted-foreground/70" />
                          <p>Nenhum pagamento encontrado com os filtros selecionados.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedClients.map((clientGroup) => {
                      const { client, appointments } = clientGroup;
                      
                      // Apenas pagamentos pendentes (se na aba pendentes)
                      const pendingAppointments = activeTab === "pending" 
                        ? appointments.filter((a: any) => a.payment_status === "pendente" || a.status === "pagamento pendente")
                        : appointments;
                      
                      if (pendingAppointments.length === 0) return null;
                      
                      // Calcular valor total de todos os agendamentos do cliente
                      const totalValue = pendingAppointments.reduce((total: number, appointment: any) => {
                        const appointmentTotal = appointment.services?.reduce((serviceTotal: number, service: any) => {
                          const price = typeof service.final_price !== 'undefined' && service.final_price !== null
                            ? (typeof service.final_price === 'number' 
                              ? service.final_price 
                              : parseFloat(service.final_price || '0'))
                            : (typeof service.services?.price === 'number' 
                              ? service.services.price 
                              : parseFloat(service.services?.price || '0'));
                          return serviceTotal + price;
                        }, 0) || 0;
                        
                        return total + appointmentTotal;
                      }, 0);
                      
                      return (
                        <TableRow key={client.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleOpenClientModal(client, pendingAppointments)}>
                          <TableCell className="font-medium">
                            {client.name || "Cliente não identificado"}
                          </TableCell>
                          <TableCell>
                            {client.phone || "Não informado"}
                          </TableCell>
                          <TableCell>
                            R$ {totalValue.toFixed(2).replace('.', ',')}
                          </TableCell>
                          <TableCell>
                            {pendingAppointments.length} {pendingAppointments.length === 1 ? 'atendimento' : 'atendimentos'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenClientModal(client, pendingAppointments);
                              }}
                            >
                              Ver detalhes
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    }).filter(Boolean)
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Modal de pagamento individual */}
      <PaymentModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        appointment={selectedPayment}
        onConfirmPayment={handleConfirmPayment}
      />
      
      {/* Modal de pagamentos do cliente */}
      {selectedClient && (
        <ClientPaymentsModal
          open={showClientModal}
          onClose={() => setShowClientModal(false)}
          client={selectedClient}
          appointments={selectedClient.pendingAppointments || []}
          onConfirmPayment={handleConfirmPayment}
          onBulkPayment={handleBulkPayment}
        />
      )}
    </div>
  );
}