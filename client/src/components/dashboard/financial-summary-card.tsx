import { useQuery } from "@tanstack/react-query";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowUp, ArrowDown } from "lucide-react";

export default function FinancialSummaryCard() {
  const currentMonth = new Date();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  
  const { data: financialSummary, isLoading } = useQuery({
    queryKey: ['/api/financial-summary', firstDayOfMonth.toISOString(), lastDayOfMonth.toISOString()],
  });

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return 100;
    return Math.round(((current - previous) / previous) * 100);
  };

  const defaultSummary = {
    revenue: {
      total: 0,
      previousTotal: 0,
      services: 0,
      products: 0
    },
    expenses: {
      total: 0,
      previousTotal: 0
    },
    profit: {
      total: 0,
      previousTotal: 0
    }
  };

  const summary = financialSummary || defaultSummary;
  
  const revenueChange = getPercentageChange(summary.revenue.total, summary.revenue.previousTotal);
  const expenseChange = getPercentageChange(summary.expenses.total, summary.expenses.previousTotal);
  const profitChange = getPercentageChange(summary.profit.total, summary.profit.previousTotal);

  return (
    <Card>
      <CardHeader className="flex items-center justify-between pb-2">
        <CardTitle className="text-lg font-poppins font-semibold">Resumo Financeiro</CardTitle>
        <span className="text-sm text-accent">
          {format(currentMonth, "MMMM", { locale: ptBR })}
        </span>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-4 text-sm text-gray-500">Carregando resumo...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Receita</p>
                <p className="text-lg font-semibold text-success">{formatCurrency(summary.revenue.total)}</p>
                {revenueChange !== 0 && (
                  <div className={`flex items-center text-xs ${revenueChange > 0 ? 'text-success' : 'text-destructive'} mt-1`}>
                    {revenueChange > 0 ? (
                      <ArrowUp className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDown className="h-3 w-3 mr-1" />
                    )}
                    <span>{Math.abs(revenueChange)}% em relação ao mês anterior</span>
                  </div>
                )}
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Despesas</p>
                <p className="text-lg font-semibold text-red-500">{formatCurrency(summary.expenses.total)}</p>
                {expenseChange !== 0 && (
                  <div className={`flex items-center text-xs ${expenseChange < 0 ? 'text-success' : 'text-destructive'} mt-1`}>
                    {expenseChange < 0 ? (
                      <ArrowDown className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowUp className="h-3 w-3 mr-1" />
                    )}
                    <span>{Math.abs(expenseChange)}% em relação ao mês anterior</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-sm">Serviços</p>
                <p className="font-medium">{formatCurrency(summary.revenue.services)}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm">Vendas de Produtos</p>
                <p className="font-medium">{formatCurrency(summary.revenue.products)}</p>
              </div>
              <div className="flex justify-between items-center pt-2 mt-2 border-t">
                <p className="text-sm font-medium">Lucro Total</p>
                <p className="font-semibold text-success">{formatCurrency(summary.profit.total)}</p>
              </div>
            </div>

            <div className="mt-4 text-center">
              <Link href="/financeiro">
                <a className="text-sm text-accent hover:underline">Ver relatório completo</a>
              </Link>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
