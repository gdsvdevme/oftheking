import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  isToday, 
  isTomorrow, 
  isThisWeek, 
  isThisMonth 
} from "date-fns";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import UpcomingAppointmentsCard from "@/components/dashboard/upcoming-appointments-card";
import FinancialSummaryCard from "@/components/dashboard/financial-summary-card";
import InventoryStatusCard from "@/components/dashboard/inventory-status-card";
import NewAppointmentModal from "@/components/agenda/new-appointment-modal";
import AppointmentDetailModal from "@/components/agenda/appointment-detail-modal";
import BlockTimeModal from "@/components/agenda/block-time-modal";
import AppointmentList from "@/components/agenda/appointment-list";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Plus, ListFilter, ArrowLeft, ArrowRight } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";

type ViewMode = "day" | "week" | "month";

// Tipagem dos filtros (movidos do AppointmentList)
type FilterPeriod = "all" | "today" | "tomorrow" | "thisWeek" | "thisMonth";
type FilterStatus = "all" | "scheduled" | "completed" | "cancelled" | "pending";

interface PaginationInfo {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export default function Agenda() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<string>("day");
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
  const [showBlockTimeModal, setShowBlockTimeModal] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [periodFilter, setPeriodFilter] = useState<FilterPeriod>("all");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const perPage = 20; // 20 agendamentos por página

  // Não precisamos de parâmetros de página agora, pois puxaremos todos os dados
  const { data, isLoading, refetch } = useQuery<{
    appointments: any[];
    pagination: PaginationInfo;
  }>({
    queryKey: ['/api/appointments'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Todos os agendamentos vêm do servidor
  const allAppointments = data?.appointments || [];
  
  // Quando os filtros ou a busca mudam, voltamos para a primeira página
  const handleFiltersChange = (
    searchQuery: string, 
    periodFilter: FilterPeriod, 
    statusFilter: FilterStatus
  ) => {
    setSearchQuery(searchQuery);
    setPeriodFilter(periodFilter);
    setStatusFilter(statusFilter);
    setCurrentPage(1); // Voltar para a primeira página quando os filtros mudam
  };
  
  // Filtrar os agendamentos com base nos filtros selecionados
  // Filtrar os agendamentos com base nos filtros selecionados
  const filteredAppointments = allAppointments.filter(appointment => {
    const appointmentDate = new Date(appointment.start_time);
    
    // Verificamos se client existe e tem propriedade name
    const clientName = appointment.client?.name || appointment.client_name || "";
    const clientPhone = appointment.client?.phone || appointment.client_phone || "";
    
    const matchesSearch = 
      !searchQuery || 
      clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clientPhone.includes(searchQuery);
    
    // Aplicar filtro de período
    let matchesPeriod = true;
    
    // Usar o filtro de período escolhido pelo usuário
    if (periodFilter === "today") {
      matchesPeriod = isToday(appointmentDate);
    } else if (periodFilter === "tomorrow") {
      matchesPeriod = isTomorrow(appointmentDate);
    } else if (periodFilter === "thisWeek") {
      matchesPeriod = isThisWeek(appointmentDate, { weekStartsOn: 0 });
    } else if (periodFilter === "thisMonth") {
      matchesPeriod = isThisMonth(appointmentDate);
    }
    
    // Aplicar filtro de status
    let matchesStatus = true;
    if (statusFilter !== "all") {
      if (statusFilter === "pending") {
        matchesStatus = appointment.payment_status === "pending";
      } else if (statusFilter === "scheduled") {
        matchesStatus = appointment.status !== "cancelled" && 
                        appointment.status !== "completed";
      } else {
        matchesStatus = appointment.status === statusFilter;
      }
    }
    
    return matchesSearch && matchesPeriod && matchesStatus;
  });
  
  // Paginação manual no lado do cliente APÓS a filtragem
  const startIndex = (currentPage - 1) * perPage;
  const endIndex = startIndex + perPage;
  
  // Pegamos apenas uma página dos agendamentos FILTRADOS para exibir
  const appointments = filteredAppointments.slice(startIndex, endIndex);
  
  // Calculamos a paginação baseada nos agendamentos FILTRADOS
  const total = filteredAppointments.length;
  const totalPages = Math.ceil(total / perPage);
  
  // Garantir que a página atual não exceda o total de páginas
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);
  
  // Log para depuração
  console.log("Total appointments:", total);
  console.log("Total pages:", totalPages);
  console.log("Current page:", currentPage);
  console.log("Active tab:", activeTab);
  console.log("Period filter:", periodFilter);
  console.log("Status filter:", statusFilter);
  
  const pagination = { 
    total, 
    page: currentPage, 
    perPage, 
    totalPages 
  };

  const { data: blockedTimes = [] } = useQuery({
    queryKey: ['/api/blocked-schedules'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handlePageChange = (page: number) => {
    console.log("Changing to page:", page, "Total pages:", totalPages);
    // Atualizar a página atual apenas se for diferente da atual e válida
    if (page !== currentPage && page > 0 && page <= totalPages) {
      setCurrentPage(page);
      
      // Rolagem suave para o topo da lista
      document.querySelector('.agenda-content')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const handleAppointmentClick = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
  };

  const handleCloseAppointmentDetail = () => {
    setSelectedAppointmentId(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-poppins font-semibold leading-7 text-dark sm:truncate">
            Agenda
          </h2>
        </div>
        <div className="mt-4 flex flex-shrink-0 md:mt-0 md:ml-4 gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowBlockTimeModal(true)}
            className="inline-flex items-center"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            Bloquear Horário
          </Button>
          <Button 
            onClick={() => setShowNewAppointmentModal(true)}
            className="inline-flex items-center bg-primary hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={(tab) => {
          setActiveTab(tab);
          setCurrentPage(1); // Reset to page 1 when changing tabs
        }} 
        className="mb-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid grid-cols-3 w-[300px]">
            <TabsTrigger value="day">Dia</TabsTrigger>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="month">Mês</TabsTrigger>
          </TabsList>
          <div className="flex items-center text-sm text-gray-500">
            <ListFilter className="h-4 w-4 mr-2" />
            Filtros aplicados
          </div>
        </div>

        <TabsContent value="day" className="mt-4">
          <div className="agenda-content">
            <AppointmentList
              appointments={appointments}
              onAppointmentClick={handleAppointmentClick}
              onFiltersChange={handleFiltersChange}
            />
            {/* Paginação simples como na tela de pagamentos */}
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
          </div>
        </TabsContent>
        
        <TabsContent value="week" className="mt-4">
          <div className="agenda-content">
            <AppointmentList
              appointments={appointments}
              onAppointmentClick={handleAppointmentClick}
              onFiltersChange={handleFiltersChange}
            />
            {/* Paginação simples como na tela de pagamentos */}
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
          </div>
        </TabsContent>
        
        <TabsContent value="month" className="mt-4">
          <div className="agenda-content">
            <AppointmentList
              appointments={appointments}
              onAppointmentClick={handleAppointmentClick}
              onFiltersChange={handleFiltersChange}
            />
            {/* Paginação simples como na tela de pagamentos */}
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
          </div>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <UpcomingAppointmentsCard />
        <FinancialSummaryCard />
        <InventoryStatusCard />
      </div>

      {showNewAppointmentModal && (
        <NewAppointmentModal 
          open={showNewAppointmentModal} 
          onClose={() => setShowNewAppointmentModal(false)} 
        />
      )}

      {selectedAppointmentId && (
        <AppointmentDetailModal 
          open={!!selectedAppointmentId} 
          onClose={handleCloseAppointmentDetail}
          appointmentId={selectedAppointmentId}
        />
      )}

      {showBlockTimeModal && (
        <BlockTimeModal 
          open={showBlockTimeModal} 
          onClose={() => setShowBlockTimeModal(false)}
          selectedDate={selectedDate}
        />
      )}
    </div>
  );
}
