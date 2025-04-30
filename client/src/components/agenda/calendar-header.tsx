import { useState } from "react";
import { 
  format, 
  addMonths, 
  subMonths, 
  addWeeks, 
  subWeeks, 
  addDays, 
  subDays 
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type ViewMode = "day" | "week" | "month";

interface CalendarHeaderProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export default function CalendarHeader({ 
  selectedDate, 
  onDateChange, 
  viewMode, 
  onViewModeChange 
}: CalendarHeaderProps) {
  
  const handlePrev = () => {
    switch (viewMode) {
      case "day":
        onDateChange(subDays(selectedDate, 1));
        break;
      case "week":
        onDateChange(subWeeks(selectedDate, 1));
        break;
      case "month":
        onDateChange(subMonths(selectedDate, 1));
        break;
    }
  };

  const handleNext = () => {
    switch (viewMode) {
      case "day":
        onDateChange(addDays(selectedDate, 1));
        break;
      case "week":
        onDateChange(addWeeks(selectedDate, 1));
        break;
      case "month":
        onDateChange(addMonths(selectedDate, 1));
        break;
    }
  };

  const getDateLabel = () => {
    switch (viewMode) {
      case "day":
        return format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR });
      case "week":
        return format(selectedDate, "MMMM yyyy", { locale: ptBR });
      case "month":
        return format(selectedDate, "MMMM yyyy", { locale: ptBR });
      default:
        return "";
    }
  };

  return (
    <div className="mb-6 bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <Button variant="ghost" size="icon" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4 text-gray-500" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleNext}>
            <ChevronRight className="h-4 w-4 text-gray-500" />
          </Button>
        </div>
        <h3 className="text-lg font-poppins font-medium text-center capitalize">
          {getDateLabel()}
        </h3>
        <div className="flex gap-2">
          <Button 
            variant={viewMode === "day" ? "primary" : "outline"} 
            size="sm"
            onClick={() => onViewModeChange("day")}
            className={viewMode === "day" ? "bg-primary text-white" : ""}
          >
            Dia
          </Button>
          <Button 
            variant={viewMode === "week" ? "primary" : "outline"} 
            size="sm"
            onClick={() => onViewModeChange("week")}
            className={viewMode === "week" ? "bg-primary text-white" : ""}
          >
            Semana
          </Button>
          <Button 
            variant={viewMode === "month" ? "primary" : "outline"} 
            size="sm"
            onClick={() => onViewModeChange("month")}
            className={viewMode === "month" ? "bg-primary text-white" : ""}
          >
            Mês
          </Button>
        </div>
      </div>
      
      {viewMode !== "day" && (
        <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-500 border-b bg-gray-50">
          <div className="py-2">Dom</div>
          <div className="py-2">Seg</div>
          <div className="py-2">Ter</div>
          <div className="py-2">Qua</div>
          <div className="py-2">Qui</div>
          <div className="py-2">Sex</div>
          <div className="py-2">Sáb</div>
        </div>
      )}
    </div>
  );
}
