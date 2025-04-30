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
  
  // Calcular valor total
  const totalValue = appointment.services?.reduce((total: number, service: any) => {
    const price = typeof service.services?.price === 'number' 
      ? service.services.price 
      : parseFloat(service.services?.price || '0');
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

export default function PagamentosPendentes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("pending");
  
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
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar pagamento",
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
          (activeTab === "pending" && appointment.payment_status === "pending") ||
          (activeTab === "paid" && appointment.payment_status === "paid");
          
        // Filtro por status do agendamento
        const matchesStatus = statusFilter === "all" || 
          appointment.status === statusFilter;
        
        // Filtro de busca
        const searchLower = searchQuery.toLowerCase();
        const nameMatch = appointment.client?.name?.toLowerCase().includes(searchLower);
        
        return matchesPaymentStatus && matchesStatus && (searchQuery === "" || nameMatch);
      });
  
  // Paginação
  const itemsPerPage = 10;
  const totalPages = Math.ceil(pendingPayments.length / itemsPerPage);
  const paginatedItems = pendingPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Manipuladores
  const handleOpenPaymentModal = (appointment: any) => {
    setSelectedPayment(appointment);
    setShowPaymentModal(true);
  };
  
  const handleConfirmPayment = (id: string, paymentMethod: string) => {
    updatePaymentStatusMutation.mutate({ 
      id, 
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
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Agendado</Badge>;
      case "confirmed":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Confirmado</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-100 text-green-800">Concluído</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="bg-red-100 text-red-800">Cancelado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };
  
  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800">Pago</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case "cancelled":
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
            Gerencie os pagamentos dos atendimentos
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
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Serviços</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                        Carregando pagamentos...
                      </TableCell>
                    </TableRow>
                  ) : paginatedItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <AlertCircle className="h-8 w-8 text-muted-foreground/70" />
                          <p>Nenhum pagamento encontrado com os filtros selecionados.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedItems.map((appointment: any) => {
                      const startTime = appointment.start_time ? new Date(appointment.start_time) : null;
                      const formattedDate = startTime 
                        ? format(startTime, "dd/MM/yyyy • HH:mm", { locale: ptBR }) 
                        : 'Data não definida';
                      
                      // Calcular valor total
                      const totalValue = appointment.services?.reduce((total: number, service: any) => {
                        const price = typeof service.services?.price === 'number' 
                          ? service.services.price 
                          : parseFloat(service.services?.price || '0');
                        return total + price;
                      }, 0) || 0;
                      
                      // Lista de serviços
                      const servicesList = appointment.services?.map((s: any) => s.services?.name).join(", ") || "Sem serviços";
                      
                      return (
                        <TableRow key={appointment.id}>
                          <TableCell className="font-medium">
                            {appointment.client?.name || "Cliente não identificado"}
                          </TableCell>
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
                            {getStatusBadge(appointment.status)}
                          </TableCell>
                          <TableCell>
                            {getPaymentStatusBadge(appointment.payment_status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {appointment.payment_status === "pending" && (
                                <>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleOpenPaymentModal(appointment)}
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Pagar
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleCancelPayment(appointment.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {appointment.payment_status === "paid" && (
                                <Badge variant="outline" className="bg-green-50">
                                  <Check className="h-3 w-3 mr-1" />
                                  Pago
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
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
      
      {/* Modal de pagamento */}
      <PaymentModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        appointment={selectedPayment}
        onConfirmPayment={handleConfirmPayment}
      />
    </div>
  );
}