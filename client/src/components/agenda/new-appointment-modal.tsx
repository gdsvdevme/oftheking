import React, { useState } from "react";
import { addMinutes } from "date-fns";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

// Horários disponíveis
const HORARIOS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00"
];

type NewAppointmentModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function NewAppointmentModal({ open, onClose }: NewAppointmentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estados locais
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [recurrence, setRecurrence] = useState("none");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Consultas
  const { data: clients = [] } = useQuery({
    queryKey: ['/api/clients'],
    enabled: open,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['/api/services'],
    enabled: open,
  });

  // Filtra clientes baseado na busca
  const filteredClients = Array.isArray(clients) 
    ? clients.filter((client: any) => 
        client.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
        (client.phone && client.phone.includes(clientSearch))
      )
    : [];

  // Cálculo da duração e preço total
  const selectedServiceDetails = Array.isArray(services)
    ? services.filter((service: any) => selectedServices.includes(service.id))
    : [];
    
  const totalDuration = selectedServiceDetails.reduce(
    (acc: number, service: any) => acc + (service.duration || 0), 
    0
  ) || 60; // Padrão de 60 minutos
  
  const totalPrice = selectedServiceDetails.reduce(
    (acc: number, service: any) => {
      const price = typeof service.price === 'string' 
        ? parseFloat(service.price.replace(',', '.')) 
        : (service.price || 0);
      return acc + price;
    }, 
    0
  );

  // Mutação para criar agendamento
  const createAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: any) => {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(appointmentData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao criar agendamento");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({
        title: "Agendamento criado com sucesso",
        description: "O novo agendamento foi adicionado à agenda.",
      });
      resetForm();
      onClose();
    },
    onError: (error: Error) => {
      console.error("Erro ao criar agendamento:", error);
      toast({
        title: "Erro ao criar agendamento",
        description: error.message || "Verifique os dados e tente novamente",
        variant: "destructive",
      });
    }
  });

  // Manipuladores
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    setFormError(null);
  };

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
    setFormError(null);
  };

  // Validação e envio
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação
    if (!selectedClientId) {
      setFormError("Selecione um cliente");
      return;
    }
    
    if (selectedServices.length === 0) {
      setFormError("Selecione pelo menos um serviço");
      return;
    }
    
    // Calcular data/hora início e fim
    const startTimeISOString = `${selectedDate}T${selectedTime}:00`;
    const startTime = new Date(startTimeISOString);
    const endTime = addMinutes(startTime, totalDuration);
    
    // Dados para o agendamento
    const appointmentData = {
      client_id: selectedClientId,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      service_ids: selectedServices,
      recurrence: recurrence === "none" ? null : recurrence,
      notes: notes,
      final_price: totalPrice.toString(),
      status: "confirmado"
    };
    
    // Enviar
    createAppointmentMutation.mutate(appointmentData);
  };

  // Resetar formulário
  const resetForm = () => {
    setSelectedClientId("");
    setClientSearch("");
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setSelectedTime("09:00");
    setSelectedServices([]);
    setRecurrence("none");
    setNotes("");
    setFormError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Novo Agendamento</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="bg-destructive/10 text-destructive p-2 rounded-md text-sm font-medium">
              {formError}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Coluna Esquerda */}
            <div className="space-y-4">
              {/* Seleção de Cliente */}
              <div className="space-y-2">
                <Label htmlFor="client-search">Cliente</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="client-search"
                    placeholder="Buscar cliente por nome ou telefone"
                    className="pl-8"
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                  />
                </div>
                
                <ScrollArea className="h-[150px] border rounded-md">
                  <div className="p-1">
                    {filteredClients.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">Nenhum cliente encontrado</div>
                    ) : (
                      filteredClients.map((client: any) => (
                        <div 
                          key={client.id}
                          onClick={() => handleClientSelect(client.id)}
                          className={`p-2 rounded-md cursor-pointer flex flex-col mb-1
                          ${selectedClientId === client.id 
                            ? 'bg-primary/10 border-l-2 border-primary' 
                            : 'hover:bg-accent/50'}`}
                        >
                          <span className="font-medium">{client.name}</span>
                          {client.phone && (
                            <span className="text-xs text-muted-foreground">{client.phone}</span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
              
              {/* Data e Hora */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Input 
                    id="date"
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="time">Horário</Label>
                  <Select 
                    value={selectedTime}
                    onValueChange={setSelectedTime}
                  >
                    <SelectTrigger id="time">
                      <SelectValue placeholder="Selecione um horário" />
                    </SelectTrigger>
                    <SelectContent>
                      {HORARIOS.map(time => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Recorrência */}
              <div className="space-y-2">
                <Label htmlFor="recurrence">Recorrência</Label>
                <Select 
                  value={recurrence} 
                  onValueChange={setRecurrence}
                >
                  <SelectTrigger id="recurrence">
                    <SelectValue placeholder="Selecione a recorrência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem recorrência</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="biweekly">Quinzenal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Coluna Direita */}
            <div className="space-y-4">
              {/* Serviços */}
              <div className="space-y-2">
                <Label>Serviços</Label>
                <ScrollArea className="h-[200px] border rounded-md p-2 bg-accent/5">
                  <div className="space-y-1">
                    {Array.isArray(services) && services.length > 0 ? (
                      services.map((service: any) => (
                        <div 
                          key={service.id}
                          className={`p-2 rounded-md border transition-colors
                            ${selectedServices.includes(service.id) 
                              ? 'border-primary/50 bg-primary/5' 
                              : 'border-transparent hover:bg-accent/10'}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Checkbox 
                                id={`service-${service.id}`}
                                checked={selectedServices.includes(service.id)}
                                onCheckedChange={() => handleServiceToggle(service.id)}
                              />
                              <label 
                                htmlFor={`service-${service.id}`}
                                className="text-sm cursor-pointer font-medium"
                              >
                                {service.name}
                              </label>
                            </div>
                            <div className="flex gap-2 items-center">
                              <Badge variant="outline" className="text-xs">
                                {service.duration || 60} min
                              </Badge>
                              <span className="text-sm font-medium">
                                R$ {typeof service.price === 'number' 
                                  ? service.price.toFixed(2).replace('.', ',')
                                  : service.price || '0,00'
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">
                        Nenhum serviço disponível
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
              
              {/* Resumo */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-semibold">Resumo</h4>
                    <Badge variant="secondary">
                      {selectedServices.length} {selectedServices.length === 1 ? 'serviço' : 'serviços'}
                    </Badge>
                  </div>
                  
                  <div className="divide-y text-sm">
                    <div className="py-2 flex justify-between items-center">
                      <span>Duração total</span>
                      <span className="font-medium">{totalDuration} minutos</span>
                    </div>
                    <div className="py-2 flex justify-between items-center">
                      <span>Valor total</span>
                      <span className="font-medium">
                        R$ {totalPrice.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Observações */}
              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  placeholder="Adicione observações sobre este agendamento..."
                  className="resize-none"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter className="pt-2 border-t mt-4">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createAppointmentMutation.isPending}
            >
              {createAppointmentMutation.isPending ? "Criando..." : "Criar Agendamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}