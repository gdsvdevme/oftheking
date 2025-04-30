import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addHours } from "date-fns";
import { ptBR } from "date-fns/locale";
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
import { Textarea } from "@/components/ui/textarea";

const blockTimeFormSchema = z.object({
  date: z.string().min(1, { message: "Selecione uma data" }),
  start_time: z.string().min(1, { message: "Selecione um horário inicial" }),
  end_time: z.string().min(1, { message: "Selecione um horário final" }),
  reason: z.string().optional(),
}).refine(data => {
  return data.start_time < data.end_time;
}, {
  message: "O horário final deve ser depois do horário inicial",
  path: ["end_time"],
});

type BlockTimeFormValues = z.infer<typeof blockTimeFormSchema>;

interface BlockTimeModalProps {
  open: boolean;
  onClose: () => void;
  selectedDate: Date;
}

export default function BlockTimeModal({
  open,
  onClose,
  selectedDate,
}: BlockTimeModalProps) {
  const { toast } = useToast();

  const form = useForm<BlockTimeFormValues>({
    resolver: zodResolver(blockTimeFormSchema),
    defaultValues: {
      date: format(selectedDate, "yyyy-MM-dd"),
      start_time: "09:00",
      end_time: "10:00",
      reason: "",
    },
  });

  // Time slots from 8:00 to 20:00, every 30 minutes
  const timeSlots = Array.from({ length: 25 }).map((_, index) => {
    const hour = Math.floor(index / 2) + 8;
    const minute = (index % 2) * 30;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  });

  const onSubmit = async (data: BlockTimeFormValues) => {
    try {
      // Convert form data to blocked time data
      const [startHours, startMinutes] = data.start_time.split(':').map(Number);
      const [endHours, endMinutes] = data.end_time.split(':').map(Number);
      
      const startTime = new Date(data.date);
      startTime.setHours(startHours, startMinutes);
      
      const endTime = new Date(data.date);
      endTime.setHours(endHours, endMinutes);
      
      const blockedTimeData = {
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        reason: data.reason,
      };
      
      await apiRequest("POST", "/api/blocked-schedules", blockedTimeData);
      
      queryClient.invalidateQueries({ queryKey: ['/api/blocked-schedules'] });
      
      toast({
        title: "Horário bloqueado com sucesso",
        description: "O período selecionado foi bloqueado na agenda.",
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Erro ao bloquear horário",
        description: "Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bloquear Horário</DialogTitle>
          <DialogDescription>
            Bloqueie um período na agenda para intervalos, reuniões ou outras atividades.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário Inicial</FormLabel>
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
                          <SelectItem key={`start-${time}`} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário Final</FormLabel>
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
                          <SelectItem key={`end-${time}`} value={time}>
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

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Intervalo para almoço"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                Bloquear Horário
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
