import { useState } from "react";
import { format, isSameDay, isBefore, isAfter, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import AppointmentCard from "./appointment-card";
import CalendarDayView from "./calendar-day-view";

type ViewMode = "day" | "week" | "month";

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

interface AppointmentGridProps {
  selectedDate: Date;
  viewMode: ViewMode;
  weekDays: Date[];
  appointments: Appointment[];
  blockedTimes: BlockedTime[];
  onAppointmentClick: (appointmentId: string) => void;
}

export default function AppointmentGrid({
  selectedDate,
  viewMode,
  weekDays,
  appointments,
  blockedTimes,
  onAppointmentClick
}: AppointmentGridProps) {
  
  const timeSlots = Array.from({ length: 12 }).map((_, index) => {
    const hour = 8 + index;
    return `${hour}:00`;
  });

  // Format date to be displayed in the day column header
  const formatDayHeader = (date: Date) => {
    return (
      <div className="bg-gray-50 font-medium text-center py-3 border-b">
        <div className="text-xs text-gray-500">{format(date, 'EEEE', { locale: ptBR })}</div>
        <div className="text-lg">{format(date, 'd', { locale: ptBR })}</div>
        <div className="text-xs text-gray-500">{format(date, 'MMM', { locale: ptBR })}</div>
      </div>
    );
  };

  // Get appointments for a specific day
  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.start_time);
      return isSameDay(appointmentDate, day);
    });
  };

  // Get blocked times for a specific day
  const getBlockedTimesForDay = (day: Date) => {
    return blockedTimes.filter(block => {
      const blockDate = new Date(block.start_time);
      return isSameDay(blockDate, day);
    });
  };

  // Calculate position and size for appointment in grid
  const calculateAppointmentStyle = (appointment: Appointment) => {
    const startTime = new Date(appointment.start_time);
    const endTime = new Date(appointment.end_time);
    
    // Calculate top position (minutes since 8 AM)
    const startHour = startTime.getHours();
    const startMinutes = startTime.getMinutes();
    const minutesSince8AM = (startHour - 8) * 60 + startMinutes;
    
    // Simplificar altura para evitar sobreposições - cada card tem 70px de altura (30-40 minutos)
    // Independente da duração real do appointment
    
    // Convert to pixels (assuming 1 hour = 100px)
    const topPosition = (minutesSince8AM / 60) * 100;
    
    return {
      top: `${topPosition}px`,
      height: '70px', // Altura fixa para todos os cards
      maxHeight: '70px', // Limitando a altura máxima
      overflow: 'hidden'
    };
  };

  if (viewMode === "day") {
    return (
      <CalendarDayView 
        selectedDate={selectedDate}
        appointments={getAppointmentsForDay(selectedDate)}
        blockedTimes={getBlockedTimesForDay(selectedDate)}
        onAppointmentClick={onAppointmentClick}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-8 gap-4 mb-6">
      {/* Time column (only shown in week view) */}
      <div className="hidden md:block">
        <div className="h-16"></div> {/* Spacer for alignment */}
        {timeSlots.map((time, index) => (
          <div key={index} className="h-24 text-xs text-gray-500 -mt-3 text-right pr-2">
            {time}
          </div>
        ))}
      </div>

      {/* Day columns */}
      {weekDays.map((day, dayIndex) => (
        <div key={dayIndex} className="md:col-span-1 bg-white rounded-2xl shadow-sm overflow-hidden">
          {formatDayHeader(day)}
          
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
            {getAppointmentsForDay(day).map(appointment => {
              const style = calculateAppointmentStyle(appointment);
              return (
                <div 
                  key={appointment.id}
                  className="absolute left-0 right-0 mx-2 rounded-lg px-2 py-1 bg-pink-100 border-l-4 border-primary shadow-sm"
                  style={style}
                  onClick={() => onAppointmentClick(appointment.id)}
                >
                  <AppointmentCard appointment={appointment} />
                </div>
              );
            })}

            {/* Blocked times */}
            {getBlockedTimesForDay(day).map(block => {
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
                  className="absolute left-0 right-0 mx-2 rounded-lg px-2 py-1 bg-gray-200 border-l-4 border-gray-400 shadow-sm"
                  style={style}
                >
                  <div className="flex justify-between items-start">
                    <div className="w-full">
                      <p className="font-medium text-sm truncate">Horário Bloqueado</p>
                      <p className="text-xs text-gray-600">
                        {format(new Date(block.start_time), 'HH:mm')}
                      </p>
                      {block.reason && <p className="text-xs text-gray-500 truncate">{block.reason}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
