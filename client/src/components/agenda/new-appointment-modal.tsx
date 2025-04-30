import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { addMinutes, format } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Search, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

// Gera horários de 08:00 às 18:00 com intervalos de 30 minutos
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 8; hour < 19; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === 18 && minute > 0) continue; // Limite até 18:00
      const formattedHour = hour.toString().padStart(2, "0");
      const formattedMinute = minute.toString().padStart(2, "0");
      slots.push(`${formattedHour}:${formattedMinute}`);
    }
  }
  return slots;
};

const timeSlots = generateTimeSlots();

// Schema para validação do formulário
const formSchema = z.object({
  client_id: z.string().nonempty("Selecione um cliente"),
  date: z.string().nonempty("Selecione uma data"),
  time: z.string().nonempty("Selecione um horário"),
  service_ids: z.array(z.string()).min(1, "Selecione pelo menos um serviço"),
  recurrence: z.string().default("none"),
  notes: z.string().optional(),
});

type AppointmentFormValues = z.infer<typeof formSchema>;

type NewAppointmentModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function NewAppointmentModal({ open, onClose }: NewAppointmentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchClient, setSearchClient] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [serviceDetails, setServiceDetails] = useState({
    totalDuration: 0,
    totalPrice: 0
  });

  // Buscar clientes
  const { data: clients = [] } = useQuery({
    queryKey: ['/api/clients'],
    enabled: open,
  });

  // Buscar serviços
  const { data: services = [] } = useQuery({
    queryKey: ['/api/services'],
    enabled: open,
  });

  // Filtrar clientes com base na busca
  const filteredClients = Array.isArray(clients) 
    ? clients.filter(client => 
        client.name.toLowerCase().includes(searchClient.toLowerCase()) ||
        (client.phone && client.phone.includes(searchClient))
      )
    : [];

  // Inicializar formulário com valores padrão
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      client_id: "",
      date: format(new Date(), "yyyy-MM-dd"),
      time: "09:00",
      service_ids: [],
      recurrence: "none",
      notes: "",
    },
  });

  // Calcular duração total e preço dos serviços selecionados
  useEffect(() => {
    if (Array.isArray(services) && services.length > 0) {
      const selectedServiceObjects = services.filter(service => 
        selectedServices.includes(service.id)
      );

      const duration = selectedServiceObjects.reduce((acc, service) => 
        acc + (service.duration || 0), 0
      );

      const price = selectedServiceObjects.reduce((acc, service) => {
        // Se o preço for uma string, converte para número
        const servicePrice = typeof service.price === 'string' 
          ? parseFloat(service.price.replace(',', '.'))
          : service.price || 0;
        return acc + servicePrice;
      }, 0);

      setServiceDetails({
        totalDuration: duration || 60, // Default to 60 minutes if no duration
        totalPrice: price
      });
    }
  }, [selectedServices, services]);

  // Atualizar o valor do formulário quando os serviços selecionados mudam
  useEffect(() => {
    if (selectedServices.length > 0) {
      form.setValue("service_ids", selectedServices, { shouldValidate: true });
    }
  }, [selectedServices, form]);

  const onSubmit = async (data: AppointmentFormValues) => {
    try {
      // Convert form data to appointment data
      const [hours, minutes] = data.time.split(':').map(Number);
      const dateObj = new Date(data.date);
      const startTimeStr = `${data.date}T${data.time}:00`;
      
      // Calcular hora de término baseado na duração dos serviços
      const startTime = new Date(startTimeStr);
      const endTime = addMinutes(startTime, serviceDetails.totalDuration);
      
      // Dados para enviar ao backend
      const appointmentData = {
        client_id: data.client_id,
        // Enviar como string ISO para o backend converter
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        service_ids: data.service_ids,
        recurrence: data.recurrence === "none" ? null : data.recurrence,
        notes: data.notes || "",
        final_price: serviceDetails.totalPrice.toString(),
        status: "confirmado"
      };
      
      // Enviar dados para API
      await apiRequest("POST", "/api/appointments", appointmentData);
      
      // Atualizar a lista de agendamentos
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      
      toast({
        title: "Agendamento realizado com sucesso",
        description: "O agendamento foi criado com sucesso.",
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
              {/* Coluna Esquerda */}
              <div className="space-y-4">
                {/* Cliente */}
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
                        
                        <div className="max-h-[200px] overflow-y-auto border rounded-md">
                          {filteredClients.length === 0 ? (
                            <div className="p-2 text-sm text-gray-500">Nenhum cliente encontrado</div>
                          ) : (
                            filteredClients.map((client: any) => (
                              <div 
                                key={client.id}
                                className={`p-2 cursor-pointer hover:bg-gray-100 ${field.value === client.id ? 'bg-primary/10 border-l-4 border-primary' : ''}`}
                                onClick={() => form.setValue('client_id', client.id, { shouldValidate: true })}
                              >
                                <div className="font-medium">{client.name}</div>
                                <div className="text-xs text-gray-500">{client.phone}</div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Data e Hora */}
                <div className="grid grid-cols-2 gap-4">
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

                {/* Serviços */}
                <FormField
                  control={form.control}
                  name="service_ids"
                  render={() => (
                    <FormItem>
                      <FormLabel>Serviços</FormLabel>
                      <div className="max-h-[250px] overflow-y-auto border rounded-md p-2 bg-gray-50">
                        {Array.isArray(services) && services.length > 0 ? (
                          services.map((service: any) => (
                            <div 
                              key={service.id}
                              className="flex items-center justify-between p-2 hover:bg-white rounded-md mb-1 border border-transparent hover:border-gray-200"
                            >
                              <div className="flex items-center gap-2">
                                <Checkbox 
                                  id={`service-${service.id}`}
                                  checked={selectedServices.includes(service.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedServices(prev => [...prev, service.id]);
                                    } else {
                                      setSelectedServices(prev => prev.filter(id => id !== service.id));
                                    }
                                  }}
                                />
                                <label 
                                  htmlFor={`service-${service.id}`}
                                  className="text-sm cursor-pointer"
                                >
                                  {service.name}
                                </label>
                              </div>
                              <div className="text-sm text-gray-500">
                                R$ {typeof service.price === 'number' 
                                  ? service.price.toFixed(2).replace('.', ',')
                                  : service.price
                                } - {service.duration} min
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-2 text-sm text-gray-500">Nenhum serviço disponível</div>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Coluna Direita */}
              <div className="space-y-4">
                {/* Resumo */}
                <div className="bg-gray-50 rounded-md p-4 border">
                  <h4 className="text-sm font-medium mb-3">Resumo</h4>
                  <div className="space-y-2 mb-3">
                    {selectedServices.length === 0 ? (
                      <div className="text-sm text-gray-500">Nenhum serviço selecionado</div>
                    ) : (
                      Array.isArray(services) && services
                        .filter((service: any) => selectedServices.includes(service.id))
                        .map((service: any) => (
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

                {/* Recorrência */}
                <FormField
                  control={form.control}
                  name="recurrence"
                  render={({ field }) => (
                    <FormItem>
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

                {/* Observações */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Adicione informações adicionais sobre o agendamento"
                          className="resize-none h-24"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">
                Criar Agendamento
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}