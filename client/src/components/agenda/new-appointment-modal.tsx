import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, addMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Search, Plus } from "lucide-react";

const appointmentFormSchema = z.object({
  client_id: z.string().min(1, { message: "Selecione um cliente" }),
  date: z.string().min(1, { message: "Selecione uma data" }),
  time: z.string().min(1, { message: "Selecione um horário" }),
  service_ids: z.array(z.string()).min(1, { message: "Selecione pelo menos um serviço" }),
  recurrence: z.string().optional(),
  notes: z.string().optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

interface NewAppointmentModalProps {
  open: boolean;
  onClose: () => void;
  selectedDate: Date;
}

export default function NewAppointmentModal({ 
  open, 
  onClose,
  selectedDate 
}: NewAppointmentModalProps) {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [serviceDetails, setServiceDetails] = useState<{
    totalPrice: number;
    totalDuration: number;
  }>({ totalPrice: 0, totalDuration: 0 });
  const [searchClient, setSearchClient] = useState("");
  const { toast } = useToast();

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      client_id: "",
      date: format(selectedDate, "yyyy-MM-dd"),
      time: "09:00",
      service_ids: [],
      recurrence: "none",
      notes: "",
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['/api/clients'],
  });

  const { data: services = [] } = useQuery({
    queryKey: ['/api/services'],
  });

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchClient.toLowerCase())
  );

  // Time slots from 8:00 to 20:00, every 30 minutes
  const timeSlots = Array.from({ length: 25 }).map((_, index) => {
    const hour = Math.floor(index / 2) + 8;
    const minute = (index % 2) * 30;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  });

  // Update total price and duration when selected services change
  useEffect(() => {
    if (services && selectedServices) {
      const filteredServices = services.filter(service => selectedServices.includes(service.id));
      const selectedServiceDetails = filteredServices.reduce(
        (acc, service) => ({
          totalPrice: acc.totalPrice + (service.price || 0),
          totalDuration: acc.totalDuration + (service.duration || 0),
        }),
        { totalPrice: 0, totalDuration: 0 }
      );
      
      setServiceDetails(selectedServiceDetails);
      // Atualizamos o valor no formulário sem desencadear re-renderizações adicionais
      form.setValue("service_ids", selectedServices, { shouldValidate: false });
    }
  }, [selectedServices, services]);

  const onSubmit = async (data: AppointmentFormValues) => {
    try {
      console.log("Dados do formulário:", data);

      // Verificar se os campos obrigatórios estão presentes
      if (!data.client_id) {
        throw new Error("Cliente não selecionado");
      }
      
      if (!data.date || !data.time) {
        throw new Error("Data ou horário não selecionados");
      }
      
      if (!data.service_ids || data.service_ids.length === 0) {
        throw new Error("Selecione pelo menos um serviço");
      }
      
      // Convert form data to appointment data
      const [hours, minutes] = data.time.split(':').map(Number);
      const startTime = new Date(data.date);
      startTime.setHours(hours, minutes);
      
      const endTime = addMinutes(startTime, serviceDetails.totalDuration);
      
      const appointmentData = {
        client_id: data.client_id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        service_ids: data.service_ids,
        recurrence: data.recurrence === "none" ? null : data.recurrence,
        notes: data.notes,
        final_price: serviceDetails.totalPrice.toString(),
        status: "confirmado"
      };
      
      console.log("Dados enviados para API:", appointmentData);
      
      const response = await apiRequest("POST", "/api/appointments", appointmentData);
      console.log("Resposta da API:", response);
      
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      
      toast({
        title: "Agendamento realizado com sucesso",
        description: "O cliente foi notificado sobre o agendamento.",
      });
      
      onClose();
    } catch (error) {
      console.error("Erro ao criar agendamento:", error);
      toast({
        title: "Erro ao realizar agendamento",
        description: error instanceof Error ? error.message : "Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleServiceToggle = (serviceId: string, e?: React.MouseEvent) => {
    // Evitar propagação de eventos se o evento for fornecido
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Novo Agendamento</DialogTitle>
          <DialogDescription>
            Preencha os detalhes para criar um novo agendamento.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div>
                <FormField
                  control={form.control}
                  name="client_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente</FormLabel>
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar cliente..."
                            className="pl-8"
                            value={searchClient}
                            onChange={(e) => setSearchClient(e.target.value)}
                          />
                        </div>
                        
                        <div className="max-h-40 overflow-y-auto border rounded-md">
                          {filteredClients.length === 0 ? (
                            <div className="p-2 text-sm text-gray-500">Nenhum cliente encontrado</div>
                          ) : (
                            filteredClients.map(client => (
                              <div 
                                key={client.id}
                                className={`p-2 cursor-pointer hover:bg-gray-100 ${field.value === client.id ? 'bg-secondary/20 border-l-4 border-primary' : ''}`}
                                onClick={() => form.setValue('client_id', client.id)}
                              >
                                <div className="font-medium">{client.name}</div>
                                <div className="text-xs text-gray-500">{client.phone}</div>
                              </div>
                            ))
                          )}
                        </div>
                        
                        <div className="text-xs text-accent cursor-pointer flex items-center">
                          <Plus className="h-3 w-3 mr-1" /> Adicionar novo cliente
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horário</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um horário" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {timeSlots.map(time => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-4">
                  <div className="mb-2 font-medium text-sm">Serviços</div>
                  <div className="max-h-48 overflow-y-auto border rounded-md bg-gray-50 p-2">
                    {Array.isArray(services) && services.map(service => (
                      <div 
                        key={service.id}
                        className="flex items-center justify-between p-2 hover:bg-white rounded-md mb-1 border border-transparent hover:border-gray-200 cursor-pointer"
                        onClick={() => {
                          // Função simplificada que apenas alterna o serviço
                          const newSelectedServices = selectedServices.includes(service.id)
                            ? selectedServices.filter(id => id !== service.id)
                            : [...selectedServices, service.id];
                          
                          setSelectedServices(newSelectedServices);
                          form.setValue("service_ids", newSelectedServices, { shouldValidate: false });
                        }}
                      >
                        <div className="flex items-center">
                          <input 
                            type="checkbox" 
                            checked={selectedServices.includes(service.id)}
                            readOnly
                            className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-indigo-500"
                          />
                          <span className="ml-2 block text-sm text-gray-900">{service.name}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          R$ {typeof service.price === 'number' 
                            ? service.price.toFixed(2).replace('.', ',')
                            : service.price
                          } - {service.duration} min
                        </div>
                      </div>
                    ))}
                  </div>
                  {form.formState.errors.service_ids && (
                    <div className="text-sm text-red-500 mt-1">Selecione pelo menos um serviço</div>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div>
                <div className="bg-gray-50 rounded-md p-4 mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Resumo</h4>
                  <div className="space-y-2 mb-3">
                    {selectedServices.length === 0 ? (
                      <div className="text-sm text-gray-500">Nenhum serviço selecionado</div>
                    ) : (
                      Array.isArray(services) && services
                        .filter(service => selectedServices.includes(service.id))
                        .map(service => (
                          <div key={service.id} className="flex justify-between items-center text-sm">
                            <span>{service.name}</span>
                            <span>
                              R$ {typeof service.price === 'number' 
                                ? service.price.toFixed(2).replace('.', ',')
                                : service.price
                              }
                            </span>
                          </div>
                        ))
                    )}
                  </div>
                  <div className="border-t pt-2 flex justify-between items-center font-medium">
                    <span>Total</span>
                    <span>R$ {serviceDetails.totalPrice.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between items-center text-sm text-gray-500">
                    <span>Duração total</span>
                    <span>{serviceDetails.totalDuration} minutos</span>
                  </div>
                </div>



                <FormField
                  control={form.control}
                  name="recurrence"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Recorrência</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma recorrência" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Sem recorrência</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="biweekly">Quinzenal</SelectItem>
                          <SelectItem value="monthly">Mensal</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Observações adicionais..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                Confirmar Agendamento
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
