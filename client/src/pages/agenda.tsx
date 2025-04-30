import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, addDays, startOfWeek, endOfWeek, isSameDay } from "date-fns";
import { ptBR } from 'date-fns/locale';
import CalendarHeader from "@/components/agenda/calendar-header";
import AppointmentGrid from "@/components/agenda/appointment-grid";
import UpcomingAppointmentsCard from "@/components/dashboard/upcoming-appointments-card";
import FinancialSummaryCard from "@/components/dashboard/financial-summary-card";
import InventoryStatusCard from "@/components/dashboard/inventory-status-card";
import NewAppointmentModal from "@/components/agenda/new-appointment-modal";
import AppointmentDetailModal from "@/components/agenda/appointment-detail-modal";
import BlockTimeModal from "@/components/agenda/block-time-modal";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Plus } from "lucide-react";

type ViewMode = "day" | "week" | "month";

export default function Agenda() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
  const [showBlockTimeModal, setShowBlockTimeModal] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);

  const { data: appointments = [] } = useQuery({
    queryKey: ['/api/appointments'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: blockedTimes = [] } = useQuery({
    queryKey: ['/api/blocked-schedules'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  const handleAppointmentClick = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
  };

  const handleCloseAppointmentDetail = () => {
    setSelectedAppointmentId(null);
  };

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 });
  
  const weekDays = Array.from({ length: 7 }).map((_, index) => 
    addDays(weekStart, index)
  );

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

      <CalendarHeader 
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
      />

      <AppointmentGrid 
        selectedDate={selectedDate}
        viewMode={viewMode}
        weekDays={weekDays}
        appointments={appointments}
        blockedTimes={blockedTimes}
        onAppointmentClick={handleAppointmentClick}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <UpcomingAppointmentsCard />
        <FinancialSummaryCard />
        <InventoryStatusCard />
      </div>

      {showNewAppointmentModal && (
        <NewAppointmentModal 
          open={showNewAppointmentModal} 
          onClose={() => setShowNewAppointmentModal(false)} 
          selectedDate={selectedDate}
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
