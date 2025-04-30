import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar, Trash2, X, Edit, User, Phone } from "lucide-react";

interface AppointmentDetailModalProps {
  open: boolean;
  onClose: () => void;
  appointmentId: string;
}

export default function AppointmentDetailModal({
  open,
  onClose,
  appointmentId,
}: AppointmentDetailModalProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: appointment, isLoading } = useQuery({
    queryKey: ['/api/appointments', appointmentId],
    enabled: !!appointmentId,
    refetchOnWindowFocus: false,
    retry: 1,
    
    // Adicionar queryFn específica para obter o agendamento com detalhes
    queryFn: async () => {
      console.log("Buscando detalhes do agendamento:", appointmentId);
      try {
        const response = await fetch(`/api/appointments/${appointmentId}`);
        const json = await response.json();
        console.log("Resposta da API:", json);
        
        if (!response.ok) {
          throw new Error('Erro ao carregar detalhes do agendamento');
        }
        
        return json;
      } catch (error) {
        console.error("Erro ao buscar detalhes:", error);
        throw error;
      }
    }
  });

  const handleDelete = async () => {
    try {
      await apiRequest("DELETE", `/api/appointments/${appointmentId}`, null);
      
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      
      toast({
        title: "Agendamento cancelado com sucesso",
        description: "O agendamento foi removido da agenda.",
      });
      
      setIsDeleteDialogOpen(false);
      onClose();
    } catch (error) {
      toast({
        title: "Erro ao cancelar agendamento",
        description: "Não foi possível cancelar o agendamento. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = () => {
    if (!appointment) return null;
    
    switch (appointment.payment_status) {
      case "paid":
        return <span className="status-paid">Pago</span>;
      case "pending":
        return <span className="status-pending">Pendente</span>;
      default:
        return null;
    }
  };

  if (isLoading || !appointment) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <div className="flex justify-center p-4">Carregando detalhes...</div>
        </DialogContent>
      </Dialog>
    );
  }

  // Tratamento seguro para datas inválidas
  const parseDateSafely = (dateString: string) => {
    try {
      if (!dateString) return new Date();
      
      // Verifica se a data está em formato ISO
      const date = new Date(dateString);
      
      // Verifica se a data é válida
      if (isNaN(date.getTime())) {
        console.warn("Data inválida:", dateString);
        return new Date(); // Retorna data atual como fallback
      }
      
      return date;
    } catch (error) {
      console.error("Erro ao processar data:", error);
      return new Date(); // Retorna data atual como fallback
    }
  };
  
  const startTime = parseDateSafely(appointment.start_time);
  const endTime = parseDateSafely(appointment.end_time);

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle>Detalhes do Agendamento</DialogTitle>
              {getStatusBadge()}
            </div>
          </DialogHeader>
          
          <div className="bg-gray-50 p-4 rounded-md mb-4">
            <div className="flex items-center mb-2">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <User />
              </div>
              <div className="ml-3">
                <p className="font-medium">
                  {appointment.client ? 
                    (typeof appointment.client === 'object' && appointment.client.name ? 
                      appointment.client.name : 
                      (appointment.client_name || "Cliente")) : 
                    "Cliente"}
                </p>
                <p className="text-xs text-gray-500">
                  {appointment.client ? 
                    (typeof appointment.client === 'object' && appointment.client.phone ? 
                      appointment.client.phone : 
                      (appointment.client_phone || "")) : 
                    ""}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Data</p>
                <p className="font-medium">{format(startTime, "dd/MM/yyyy", { locale: ptBR })}</p>
              </div>
              <div>
                <p className="text-gray-500">Horário</p>
                <p className="font-medium">
                  {format(startTime, "HH:mm")} - {format(endTime, "HH:mm")}
                </p>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Serviços</h4>
            <div className="space-y-2">
              {appointment.services && appointment.services.length > 0 ? (
                appointment.services.map((service, index) => (
                  <div key={index} className="flex justify-between items-center text-sm border-b pb-2">
                    <span>
                      {service.services?.name ? service.services.name : 
                       (service.name ? service.name : 'Serviço')}
                    </span>
                    <span>
                      R$ {(() => {
                        // Obter o preço do objeto aninhado, se existir
                        const price = service.services?.price !== undefined 
                          ? service.services.price 
                          : (service.price !== undefined ? service.price : 0);
                        
                        // Formatar preço
                        return typeof price === 'number' 
                          ? price.toFixed(2).replace('.', ',')
                          : (parseFloat(price) || 0).toFixed(2).replace('.', ',');
                      })()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 border-b pb-2">Nenhum serviço registrado</div>
              )}
              <div className="flex justify-between items-center font-medium pt-1">
                <span>Total</span>
                <span>
                  R$ {(() => {
                    // Obter e validar o preço
                    const price = appointment.final_price !== undefined ? appointment.final_price : 0;
                    
                    // Formatar preço
                    return typeof price === 'number' 
                      ? price.toFixed(2).replace('.', ',')
                      : (parseFloat(price) || 0).toFixed(2).replace('.', ',');
                  })()}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Observações</h4>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
              {appointment.notes || "Sem observações"}
            </p>
          </div>
          
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button 
              variant="destructive" 
              onClick={() => setIsDeleteDialogOpen(true)}
              className="flex items-center"
            >
              <Trash2 className="h-4 w-4 mr-2" /> Cancelar
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="flex items-center"
              >
                <X className="h-4 w-4 mr-2" /> Fechar
              </Button>
              <Button 
                variant="secondary" 
                className="flex items-center bg-accent text-white hover:bg-accent/90"
              >
                <Edit className="h-4 w-4 mr-2" /> Editar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Agendamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não, manter agendamento</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Sim, cancelar agendamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
