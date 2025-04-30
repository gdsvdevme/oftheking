import { useState } from "react";
import { 
  format, 
  isToday, 
  isTomorrow, 
  isThisWeek, 
  isThisMonth,
  parseISO,
  isSameDay
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Clock, User, Search, Filter } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

// Tipagem dos filtros
type FilterPeriod = "all" | "today" | "tomorrow" | "thisWeek" | "thisMonth";
type FilterStatus = "all" | "scheduled" | "completed" | "cancelled" | "pending";

interface Appointment {
  id: string;
  client_id: string;
  client?: {
    name: string;
    phone?: string;
  };
  start_time: string;
  end_time: string;
  status: string;
  payment_status: string;
  notes?: string;
  services?: {
    name: string;
    price: number;
  }[];
  final_price: number;
}

interface AppointmentListProps {
  appointments: Appointment[];
  onAppointmentClick: (appointmentId: string) => void;
}

export default function AppointmentList({ 
  appointments, 
  onAppointmentClick 
}: AppointmentListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [periodFilter, setPeriodFilter] = useState<FilterPeriod>("all");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");

  // Função para tratamento seguro de datas
  const parseDateSafely = (dateString: string) => {
    try {
      if (!dateString) return new Date();
      
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        console.warn("Data inválida:", dateString);
        return new Date();
      }
      
      return date;
    } catch (error) {
      console.error("Erro ao processar data:", error);
      return new Date();
    }
  };

  // Função para formatação da data conforme o contexto
  const formatAppointmentDate = (dateString: string) => {
    const date = parseDateSafely(dateString);
    
    if (isToday(date)) {
      return `Hoje às ${format(date, "HH:mm")}`;
    } else if (isTomorrow(date)) {
      return `Amanhã às ${format(date, "HH:mm")}`;
    } else {
      return format(date, "dd/MM/yyyy' às 'HH:mm", { locale: ptBR });
    }
  };

  // Filtrar os agendamentos com base nos filtros selecionados
  const filteredAppointments = appointments.filter(appointment => {
    const appointmentDate = parseDateSafely(appointment.start_time);
    const matchesSearch = 
      !searchQuery || 
      (appointment.client?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (appointment.client?.phone || "").includes(searchQuery);
    
    // Aplicar filtro de período
    let matchesPeriod = true;
    if (periodFilter === "today") {
      matchesPeriod = isToday(appointmentDate);
    } else if (periodFilter === "tomorrow") {
      matchesPeriod = isTomorrow(appointmentDate);
    } else if (periodFilter === "thisWeek") {
      matchesPeriod = isThisWeek(appointmentDate);
    } else if (periodFilter === "thisMonth") {
      matchesPeriod = isThisMonth(appointmentDate);
    }
    
    // Aplicar filtro de status
    let matchesStatus = true;
    if (statusFilter !== "all") {
      if (statusFilter === "pending") {
        matchesStatus = appointment.payment_status === "pending";
      } else {
        matchesStatus = appointment.status === statusFilter;
      }
    }
    
    return matchesSearch && matchesPeriod && matchesStatus;
  }).sort((a, b) => {
    // Ordenar por data (do mais recente para o mais antigo)
    const dateA = parseDateSafely(a.start_time);
    const dateB = parseDateSafely(b.start_time);
    return dateA.getTime() - dateB.getTime();
  });

  // Renderizar o status do agendamento com cores correspondentes
  const renderStatus = (status: string, paymentStatus: string) => {
    if (status === "completed") {
      return <Badge className="bg-green-500">Concluído</Badge>;
    } else if (status === "cancelled") {
      return <Badge variant="destructive">Cancelado</Badge>;
    } else if (paymentStatus === "paid") {
      return <Badge className="bg-blue-500">Pago</Badge>;
    } else {
      return <Badge variant="outline">Pendente</Badge>;
    }
  };

  // Renderizar os serviços do agendamento
  const renderServices = (services?: { name: string; price: number }[]) => {
    if (!services || services.length === 0) {
      return <span className="text-gray-500">Sem serviços</span>;
    }
    
    return services.map(service => service.name).join(", ");
  };

  return (
    <div className="space-y-4">
      {/* Filtros e pesquisa */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-2 items-center flex-wrap">
          <Select value={periodFilter} onValueChange={(value) => setPeriodFilter(value as FilterPeriod)}>
            <SelectTrigger className="w-[140px]">
              <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="tomorrow">Amanhã</SelectItem>
              <SelectItem value="thisWeek">Esta semana</SelectItem>
              <SelectItem value="thisMonth">Este mês</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as FilterStatus)}>
            <SelectTrigger className="w-[140px]">
              <Filter className="mr-2 h-4 w-4 text-primary" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="scheduled">Agendado</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
              <SelectItem value="pending">Pagamento pendente</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome ou telefone"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Contador de resultados */}
      <div className="text-sm text-gray-500">
        {filteredAppointments.length} {filteredAppointments.length === 1 ? 'agendamento encontrado' : 'agendamentos encontrados'}
      </div>
      
      {/* Tabela de agendamentos */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Horário</TableHead>
              <TableHead className="hidden md:table-cell">Serviços</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Valor</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAppointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Nenhum agendamento encontrado com os filtros aplicados
                </TableCell>
              </TableRow>
            ) : (
              filteredAppointments.map((appointment) => (
                <TableRow key={appointment.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onAppointmentClick(appointment.id)}>
                  <TableCell>
                    <div className="font-medium">{appointment.client?.name || "Cliente"}</div>
                    <div className="text-xs text-gray-500">{appointment.client?.phone}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-gray-400" />
                      <span>{formatAppointmentDate(appointment.start_time)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {renderServices(appointment.services)}
                  </TableCell>
                  <TableCell>
                    {renderStatus(appointment.status, appointment.payment_status)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    R$ {appointment.final_price.toFixed(2).replace('.', ',')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAppointmentClick(appointment.id);
                      }}
                    >
                      Ver detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}