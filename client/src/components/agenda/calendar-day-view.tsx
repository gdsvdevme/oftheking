import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import AppointmentCard from "./appointment-card";

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

interface BlockedTime {
  id: string;
  start_time: string;
  end_time: string;
  reason?: string;
}

interface CalendarDayViewProps {
  selectedDate: Date;
  appointments: Appointment[];
  blockedTimes: BlockedTime[];
  onAppointmentClick: (appointmentId: string) => void;
}

export default function CalendarDayView({
  selectedDate,
  appointments,
  blockedTimes,
  onAppointmentClick
}: CalendarDayViewProps) {
  
  const timeSlots = Array.from({ length: 12 }).map((_, index) => {
    const hour = 8 + index;
    return `${hour}:00`;
  });

  // Calculate position and size for appointment in grid
  const calculateAppointmentStyle = (appointment: Appointment) => {
    const startTime = new Date(appointment.start_time);
    const endTime = new Date(appointment.end_time);
    
    // Calculate top position (minutes since 8 AM)
    const startHour = startTime.getHours();
    const startMinutes = startTime.getMinutes();
    const minutesSince8AM = (startHour - 8) * 60 + startMinutes;
    
    // Calculate height (duration in minutes)
    const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    
    // Convert to pixels (assuming 1 hour = 100px)
    const topPosition = (minutesSince8AM / 60) * 100;
    const height = (durationMinutes / 60) * 100;
    
    return {
      top: `${topPosition}px`,
      height: `${height}px`,
    };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-6">
      {/* Time column */}
      <div className="hidden md:block">
        <div className="h-16"></div> {/* Spacer for alignment */}
        {timeSlots.map((time, index) => (
          <div key={index} className="h-24 text-xs text-gray-500 -mt-3 text-right pr-2">
            {time}
          </div>
        ))}
      </div>

      {/* Main day column */}
      <div className="md:col-span-6 bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-gray-50 font-medium text-center py-3 border-b">
          <span className="text-lg">
            {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </span>
        </div>
        
        <div className="relative" style={{ height: "1200px" }}>
          {/* Hour grid lines */}
          {timeSlots.map((_, index) => (
            <div 
              key={index} 
              className="absolute w-full border-t border-gray-200" 
              style={{ top: `${index * 100}px` }}
            ></div>
          ))}

          {/* Appointments */}
          {appointments.map(appointment => {
            const style = calculateAppointmentStyle(appointment);
            return (
              <div 
                key={appointment.id}
                className="absolute left-0 right-0 mx-2 rounded-2xl px-3 py-2 bg-secondary bg-opacity-30 border-l-4 border-primary"
                style={style}
                onClick={() => onAppointmentClick(appointment.id)}
              >
                <AppointmentCard appointment={appointment} />
              </div>
            );
          })}

          {/* Blocked times */}
          {blockedTimes.map(block => {
            const style = calculateAppointmentStyle({
              id: block.id,
              client_id: "",
              start_time: block.start_time,
              end_time: block.end_time,
              status: "blocked",
              payment_status: "",
              final_price: 0
            });
            return (
              <div 
                key={block.id}
                className="absolute left-0 right-0 mx-2 rounded-2xl px-3 py-2 bg-gray-200 border-l-4 border-gray-400"
                style={style}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">Horário Bloqueado</p>
                    <p className="text-xs text-gray-600">
                      {format(new Date(block.start_time), 'HH:mm')} - {format(new Date(block.end_time), 'HH:mm')}
                    </p>
                    <p className="text-xs mt-1">{block.reason}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
