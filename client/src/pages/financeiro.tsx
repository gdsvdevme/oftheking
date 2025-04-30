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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowRight, ArrowUp, ArrowDown, Calendar } from "lucide-react";

export default function Financeiro() {
  const [selectedPeriod, setSelectedPeriod] = useState("current-month");
  const [selectedTab, setSelectedTab] = useState("resumo");

  const getDateRange = () => {
    const now = new Date();
    
    switch (selectedPeriod) {
      case "current-month":
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
          label: format(now, "MMMM 'de' yyyy", { locale: ptBR })
        };
      case "previous-month":
        const prevMonth = subMonths(now, 1);
        return {
          start: startOfMonth(prevMonth),
          end: endOfMonth(prevMonth),
          label: format(prevMonth, "MMMM 'de' yyyy", { locale: ptBR })
        };
      case "last-3-months":
        return {
          start: startOfMonth(subMonths(now, 2)),
          end: endOfMonth(now),
          label: "Últimos 3 meses"
        };
      default:
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
          label: format(now, "MMMM 'de' yyyy", { locale: ptBR })
        };
    }
  };

  const dateRange = getDateRange();

  const { data: financialData } = useQuery({
    queryKey: ['/api/financial-summary', dateRange.start, dateRange.end],
  });

  const { data: transactions } = useQuery({
    queryKey: ['/api/financial-transactions', dateRange.start, dateRange.end],
  });

  // Sample data - would be replaced with actual API data
  const revenueData = [
    { name: 'Serviços', value: 7350 },
    { name: 'Vendas', value: 1190 },
  ];

  const expenseData = [
    { name: 'Produtos', value: 1800 },
    { name: 'Salários', value: 1000 },
    { name: 'Aluguel', value: 800 },
    { name: 'Outros', value: 410 },
  ];

  const monthlyData = [
    { name: '1', Receita: 320, Despesa: 240 },
    { name: '5', Receita: 300, Despesa: 139 },
    { name: '10', Receita: 200, Despesa: 180 },
    { name: '15', Receita: 278, Despesa: 190 },
    { name: '20', Receita: 189, Despesa: 140 },
    { name: '25', Receita: 239, Despesa: 120 },
    { name: '30', Receita: 349, Despesa: 190 },
  ];

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-poppins font-semibold leading-7 text-dark sm:truncate">
            Financeiro
          </h2>
        </div>
        <div className="mt-4 md:mt-0 flex items-center">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[240px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current-month">Mês atual</SelectItem>
              <SelectItem value="previous-month">Mês anterior</SelectItem>
              <SelectItem value="last-3-months">Últimos 3 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mb-6">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="transacoes">Transações</TabsTrigger>
            <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          </TabsList>
          
          <TabsContent value="resumo" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ 8.540,00</div>
                  <div className="flex items-center text-xs text-success mt-1">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    <span>12% em relação ao período anterior</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Despesas Totais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ 3.210,00</div>
                  <div className="flex items-center text-xs text-destructive mt-1">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    <span>5% em relação ao período anterior</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Lucro</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ 5.330,00</div>
                  <div className="flex items-center text-xs text-success mt-1">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    <span>18% em relação ao período anterior</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Receitas por Categoria</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={revenueData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {revenueData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Despesas por Categoria</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {expenseData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="transacoes" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Transações Financeiras - {dateRange.label}</CardTitle>
                  <Button variant="outline" size="sm">
                    Exportar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>28/04/2025</TableCell>
                      <TableCell>Serviço realizado - Ana Souza</TableCell>
                      <TableCell>Serviços</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          <ArrowUp className="h-3 w-3 mr-1" /> Entrada
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">R$ 80,00</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>28/04/2025</TableCell>
                      <TableCell>Serviço realizado - Carla Mendes</TableCell>
                      <TableCell>Serviços</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          <ArrowUp className="h-3 w-3 mr-1" /> Entrada
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">R$ 120,00</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>27/04/2025</TableCell>
                      <TableCell>Compra de produtos - Shampoo</TableCell>
                      <TableCell>Produtos</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          <ArrowDown className="h-3 w-3 mr-1" /> Saída
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">R$ 350,00</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>26/04/2025</TableCell>
                      <TableCell>Venda de produtos</TableCell>
                      <TableCell>Vendas</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          <ArrowUp className="h-3 w-3 mr-1" /> Entrada
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">R$ 95,00</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>25/04/2025</TableCell>
                      <TableCell>Pagamento do aluguel</TableCell>
                      <TableCell>Aluguel</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          <ArrowDown className="h-3 w-3 mr-1" /> Saída
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">R$ 800,00</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="relatorios" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Evolução Financeira - {dateRange.label}</CardTitle>
              </CardHeader>
              <CardContent className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
                    <Legend />
                    <Bar dataKey="Receita" fill="hsl(var(--chart-1))" />
                    <Bar dataKey="Despesa" fill="hsl(var(--chart-2))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
