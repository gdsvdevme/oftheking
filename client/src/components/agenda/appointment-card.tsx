import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

interface AppointmentCardProps {
  appointment: Appointment;
}

export default function AppointmentCard({ appointment }: AppointmentCardProps) {
  const startTime = new Date(appointment.start_time);
  
  const formatTime = (date: Date) => {
    return format(date, "HH:mm");
  };

  // Buscar o nome do cliente associado ou mostrar "Cliente"
  const clientName = appointment.client?.name || "Cliente";
  
  // Buscar o telefone do cliente ou mostrar vazio
  const clientPhone = appointment.client?.phone || "";
  
  const getStatusBadge = () => {
    switch (appointment.payment_status) {
      case "paid":
        return <span className="status-paid">Pago</span>;
      case "pending":
        return <span className="status-pending">Pendente</span>;
      default:
        return null;
    }
  };

  return (
    <div className="flex justify-between items-start cursor-pointer">
      <div className="w-full">
        {/* Nome do cliente em negrito */}
        <p className="font-medium text-sm truncate">{clientName}</p>
        
        {/* Telefone do cliente, se disponível */}
        {clientPhone && <p className="text-xs text-gray-700 truncate">{clientPhone}</p>}
        
        {/* Apenas o horário de início */}
        <p className="text-xs text-gray-600 mt-1">
          {formatTime(startTime)}
        </p>
      </div>
      {getStatusBadge()}
    </div>
  );
}
