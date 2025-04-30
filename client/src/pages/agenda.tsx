import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { CalendarIcon, Plus, ListFilter } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";

type ViewMode = "day" | "week" | "month";

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
  const perPage = 20; // 20 agendamentos por página

  // Preparar parâmetros de consulta incluindo data/mês atual para garantir que todas as datas sejam consideradas
  const queryParams = {
    page: currentPage,
    perPage,
    // Não incluímos filtros de data aqui para obter todos os agendamentos
  };

  const { data, isLoading, refetch } = useQuery<{
    appointments: any[];
    pagination: PaginationInfo;
  }>({
    queryKey: ['/api/appointments', queryParams],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const appointments = data?.appointments || [];
  const pagination = data?.pagination || { total: 0, page: 1, perPage, totalPages: 1 };

  const { data: blockedTimes = [] } = useQuery({
    queryKey: ['/api/blocked-schedules'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
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
          <AppointmentList
            appointments={appointments}
            onAppointmentClick={handleAppointmentClick}
          />
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </TabsContent>
        
        <TabsContent value="week" className="mt-4">
          <AppointmentList
            appointments={appointments}
            onAppointmentClick={handleAppointmentClick}
          />
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </TabsContent>
        
        <TabsContent value="month" className="mt-4">
          <AppointmentList
            appointments={appointments}
            onAppointmentClick={handleAppointmentClick}
          />
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
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
