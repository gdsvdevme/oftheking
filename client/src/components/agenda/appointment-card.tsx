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
  const endTime = new Date(appointment.end_time);
  
  const formatTime = (date: Date) => {
    return format(date, "HH:mm");
  };

  const getServiceNames = () => {
    if (appointment.services && appointment.services.length > 0) {
      return appointment.services.map(service => service.name).join(" + ");
    }
    return "Sem serviços";
  };

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
    <div className="flex justify-between items-start">
      <div>
        <p className="font-medium text-sm">{appointment.client?.name || "Cliente"}</p>
        <p className="text-xs text-gray-600">
          {formatTime(startTime)} - {formatTime(endTime)}
        </p>
        <p className="text-xs mt-1">{getServiceNames()}</p>
      </div>
      {getStatusBadge()}
    </div>
  );
}
