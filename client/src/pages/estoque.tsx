import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Search, Plus, Package, DollarSign } from "lucide-react";

const inventoryFormSchema = z.object({
  name: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
  quantity: z.number().min(1, { message: "Quantidade deve ser maior que zero" }),
  cost_price: z.string().transform(val => parseFloat(val.replace(',', '.'))).refine(val => !isNaN(val) && val > 0, {
    message: "Preço de custo deve ser um número positivo"
  }),
  selling_price: z.string().transform(val => parseFloat(val.replace(',', '.'))).refine(val => !isNaN(val) && val > 0, {
    message: "Preço de venda deve ser um número positivo"
  }),
  category: z.string().min(1, { message: "Selecione uma categoria" })
});

type InventoryFormValues = z.infer<typeof inventoryFormSchema>;

export default function Estoque() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewProductDialogOpen, setIsNewProductDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['/api/inventory'],
  });

  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: {
      name: "",
      quantity: 1,
      cost_price: "",
      selling_price: "",
      category: "Geral"
    }
  });

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockStatusBadge = (quantity: number) => {
    if (quantity <= 5) {
      return <Badge variant="destructive">Estoque baixo</Badge>;
    } else if (quantity <= 15) {
      return <Badge variant="outline" className="bg-warning text-white">Estoque médio</Badge>;
    } else {
      return <Badge variant="outline" className="bg-success text-white">Estoque bom</Badge>;
    }
  };

  const onSubmit = async (data: InventoryFormValues) => {
    try {
      await apiRequest("POST", "/api/inventory", {
        name: data.name,
        quantity: data.quantity,
        cost_price: data.cost_price,
        selling_price: data.selling_price,
        category: data.category
      });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      toast({
        title: "Produto cadastrado com sucesso",
        description: `${data.name} foi adicionado ao estoque.`,
      });
      form.reset();
      setIsNewProductDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erro ao cadastrar produto",
        description: "Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-poppins font-semibold leading-7 text-dark sm:truncate">
            Estoque
          </h2>
        </div>
        <div className="mt-4 flex flex-shrink-0 md:mt-0 md:ml-4">
          <Dialog open={isNewProductDialogOpen} onOpenChange={setIsNewProductDialogOpen}>
            <DialogTrigger asChild>
              <Button className="inline-flex items-center bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Novo Produto</DialogTitle>
                <DialogDescription>
                  Preencha as informações do produto para cadastrá-lo no estoque.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Produto</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Shampoo Profissional" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantidade</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1} 
                              placeholder="Ex: 10" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma categoria" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Cabelo">Cabelo</SelectItem>
                              <SelectItem value="Pele">Pele</SelectItem>
                              <SelectItem value="Unhas">Unhas</SelectItem>
                              <SelectItem value="Maquiagem">Maquiagem</SelectItem>
                              <SelectItem value="Geral">Geral</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="cost_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço de Custo (R$)</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: 20,00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="selling_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço de Venda (R$)</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: 35,00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsNewProductDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-primary hover:bg-primary/90">
                      Salvar
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Produtos em Estoque</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-4">Carregando produtos...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Qtd.</TableHead>
                  <TableHead>Preço de Custo</TableHead>
                  <TableHead>Preço de Venda</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6">
                      Nenhum produto encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-primary mr-2">
                            <Package className="h-4 w-4" />
                          </div>
                          {item.name}
                        </div>
                      </TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell className="font-medium">{item.quantity}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                          {typeof item.cost_price === 'number' 
                            ? `R$ ${item.cost_price.toFixed(2).replace('.', ',')}`
                            : `R$ ${item.cost_price}`}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                          {typeof item.selling_price === 'number' 
                            ? `R$ ${item.selling_price.toFixed(2).replace('.', ',')}`
                            : `R$ ${item.selling_price}`}
                        </div>
                      </TableCell>
                      <TableCell>{getStockStatusBadge(item.quantity)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Editar</Button>
                        <Button variant="ghost" size="sm">Ajustar Estoque</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
