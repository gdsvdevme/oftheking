import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { Link } from "wouter";

export default function UpcomingAppointmentsCard() {
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['/api/appointments/upcoming'],
  });

  const getStatusBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case "paid":
        return <span className="status-paid">Pago</span>;
      case "pending":
        return <span className="status-pending">Pendente</span>;
      default:
        return null;
    }
  };

  const formatAppointmentTime = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return `Hoje, ${format(date, 'HH:mm')}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Amanhã, ${format(date, 'HH:mm')}`;
    } else {
      return format(date, "dd/MM, HH:mm");
    }
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between pb-2">
        <CardTitle className="text-lg font-poppins font-semibold">Próximos Agendamentos</CardTitle>
        <Link href="/agenda">
          <a className="text-sm text-accent hover:underline">
            Ver todos
          </a>
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-4 text-sm text-gray-500">Carregando agendamentos...</div>
        ) : appointments.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm text-gray-500">Nenhum agendamento próximo.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.slice(0, 3).map((appointment) => (
              <div key={appointment.id} className="border-b pb-3">
                <div className="flex justify-between">
                  <p className="font-medium">{appointment.client?.name}</p>
                  <p className="text-sm text-gray-500">{formatAppointmentTime(appointment.start_time)}</p>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-sm text-gray-600">
                    {appointment.services && appointment.services.length > 0
                      ? appointment.services.map(s => s.name).join(' + ')
                      : 'Sem serviços'}
                  </p>
                  {getStatusBadge(appointment.payment_status)}
                </div>
              </div>
            ))}
            
            {appointments.length > 3 && (
              <div className="text-center pt-2">
                <Link href="/agenda">
                  <a className="inline-flex items-center text-sm text-accent hover:underline">
                    Mais {appointments.length - 3} agendamentos
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </a>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
