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
import { Calendar, Trash2, X, Edit, User, Phone, CheckCircle, DollarSign } from "lucide-react";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";

interface AppointmentDetailModalProps {
  open: boolean;
  onClose: () => void;
  appointmentId: string;
}

// Schema para validação do formulário de confirmar atendimento
const confirmAppointmentSchema = z.object({
  payment_status: z.enum(["paid", "pending"], {
    required_error: "Selecione o status do pagamento",
  }),
  services: z.array(
    z.object({
      id: z.string(),
      name: z.string().optional(),
      price: z.coerce.number().min(0, "O valor deve ser maior ou igual a zero"),
    })
  ),
  final_price: z.coerce.number().min(0, "O valor total deve ser maior ou igual a zero"),
});

export default function AppointmentDetailModal({
  open,
  onClose,
  appointmentId,
}: AppointmentDetailModalProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
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
      // Em vez de excluir, vamos apenas atualizar o status para "canceled"
      await apiRequest("PUT", `/api/appointments/${appointmentId}`, {
        status: "canceled", // Definir status como cancelado
        payment_status: null // Remover status de pagamento
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      
      toast({
        title: "Agendamento cancelado com sucesso",
        description: "O agendamento foi marcado como cancelado.",
      });
      
      setIsDeleteDialogOpen(false);
      onClose();
    } catch (error) {
      console.error("Erro ao cancelar agendamento:", error);
      toast({
        title: "Erro ao cancelar agendamento",
        description: "Não foi possível cancelar o agendamento. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = () => {
    if (!appointment) return null;
    
    // Status "cancelado"
    if (appointment.status === "canceled") {
      return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800 font-medium">Cancelado</span>;
    }
    
    // Status "finalizado" com pagamento realizado
    else if (appointment.status === "completed" || appointment.payment_status === "paid") {
      return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 font-medium">Finalizado</span>;
    }
    
    // Status "pagamento pendente"
    else if (appointment.status === "payment_pending" || appointment.payment_status === "pending") {
      return <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800 font-medium">Pagamento Pendente</span>;
    }
    
    // Status "agendado" (padrão)
    else if (appointment.status === "scheduled" || !appointment.payment_status) {
      return <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 font-medium">Agendado</span>;
    }
    
    // Qualquer outro status
    else {
      return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800 font-medium">{appointment.status}</span>;
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
                variant="default" 
                onClick={() => setIsConfirmDialogOpen(true)}
                className="flex items-center bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" /> Confirmar
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

      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Confirmar Atendimento</DialogTitle>
          </DialogHeader>
          
          {appointment && (
            <ConfirmAppointmentForm 
              appointment={appointment} 
              onClose={() => setIsConfirmDialogOpen(false)} 
              onSuccess={() => {
                setIsConfirmDialogOpen(false);
                onClose();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// Formulário para confirmação de atendimento
interface ConfirmAppointmentFormProps {
  appointment: any;
  onClose: () => void;
  onSuccess: () => void;
}

function ConfirmAppointmentForm({ appointment, onClose, onSuccess }: ConfirmAppointmentFormProps) {
  const { toast } = useToast();
  
  // Preparar os valores iniciais do formulário
  const getInitialValues = () => {
    // Verificar e preparar os serviços com preços
    const services = appointment.services?.map((service: any) => {
      // Obter o preço do serviço, priorizando o preço específico do agendamento
      const price = service.price !== undefined ? service.price : 
                  (service.services?.price !== undefined ? service.services.price : 0);
      
      return {
        id: service.id,
        name: service.services?.name || 'Serviço',
        price: price || 0
      };
    }) || [];
    
    // Calcular o valor total
    const totalPrice = services.reduce((sum: number, service: any) => sum + (parseFloat(service.price) || 0), 0);
    
    return {
      payment_status: appointment.payment_status || "pending",
      services,
      final_price: appointment.final_price || totalPrice || 0
    };
  };

  const form = useForm<z.infer<typeof confirmAppointmentSchema>>({
    resolver: zodResolver(confirmAppointmentSchema),
    defaultValues: getInitialValues()
  });

  // Recalcular o total quando os preços dos serviços mudarem
  const services = form.watch("services");
  const recalculateTotal = () => {
    const totalPrice = services.reduce((sum, service) => sum + (parseFloat(service.price.toString()) || 0), 0);
    form.setValue("final_price", totalPrice);
  };

  const onSubmit = async (data: z.infer<typeof confirmAppointmentSchema>) => {
    try {
      // Determinar o status do agendamento com base no status de pagamento
      let status = "scheduled"; // Valor padrão
      
      if (data.payment_status === "paid") {
        status = "completed"; // Finalizado (pago)
      } else if (data.payment_status === "pending") {
        status = "payment_pending"; // Pagamento pendente
      }
      
      // Atualizar o agendamento com os valores de serviços, status de pagamento e status
      await apiRequest("PUT", `/api/appointments/${appointment.id}`, {
        payment_status: data.payment_status,
        final_price: String(data.final_price), // Convertemos para string para evitar erro de validação
        status: status
      });
      
      // Invalidar consultas para atualizar dados
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      
      toast({
        title: "Atendimento confirmado com sucesso",
        description: `Pagamento ${data.payment_status === 'paid' ? 'realizado' : 'pendente'}.`,
      });
      
      onSuccess();
    } catch (error) {
      console.error("Erro ao confirmar atendimento:", error);
      toast({
        title: "Erro ao confirmar atendimento",
        description: "Não foi possível confirmar o atendimento. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Serviços Realizados</h4>
          
          {services.map((service, index) => (
            <div key={index} className="flex items-center justify-between space-x-2 py-2 border-b">
              <span className="flex-1 font-medium text-sm">{service.name}</span>
              <FormField
                control={form.control}
                name={`services.${index}.price`}
                render={({ field }) => (
                  <FormItem className="flex-none">
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                        R$
                      </span>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="0,00"
                          className="pl-8 w-24"
                          onChange={(e) => {
                            field.onChange(e);
                            // Recalcular total após mudar preço
                            setTimeout(recalculateTotal, 0);
                          }}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}

          <div className="flex justify-between items-center pt-2 font-medium">
            <span>Valor Total</span>
            <FormField
              control={form.control}
              name="final_price"
              render={({ field }) => (
                <FormItem>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                      R$
                    </span>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="0,00"
                        className="pl-8 w-24"
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator className="my-4" />

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Status do Pagamento</h4>
          <FormField
            control={form.control}
            name="payment_status"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="paid" id="paid" />
                      <label
                        htmlFor="paid"
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        Pago
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pending" id="pending" />
                      <label
                        htmlFor="pending"
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        Pendente
                      </label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <DialogFooter className="pt-4">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
            Confirmar Atendimento
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
