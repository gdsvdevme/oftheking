import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

export default function InventoryStatusCard() {
  const { data: lowStockItems = [], isLoading } = useQuery({
    queryKey: ['/api/inventory/low-stock'],
  });

  const getStockStatusBadge = (quantity: number) => {
    if (quantity <= 5) {
      return <Badge variant="destructive" className="text-xs">Estoque baixo</Badge>;
    } else if (quantity <= 15) {
      return <Badge variant="outline" className="bg-warning text-white text-xs">Estoque médio</Badge>;
    } else {
      return <Badge variant="outline" className="bg-success text-white text-xs">Estoque bom</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between pb-2">
        <CardTitle className="text-lg font-poppins font-semibold">Estoque</CardTitle>
        <Link href="/estoque">
          <a className="text-sm text-accent hover:underline">
            Ver todos
          </a>
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-4 text-sm text-gray-500">Carregando produtos...</div>
        ) : lowStockItems.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm text-gray-500">Nenhum produto com estoque baixo.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lowStockItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <div className="text-xs">{getStockStatusBadge(item.quantity)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{item.quantity}</span>
                  <span className="text-xs text-gray-500">unid.</span>
                </div>
              </div>
            ))}
            
            {lowStockItems.length > 4 && (
              <div className="text-center pt-2">
                <Link href="/estoque">
                  <a className="text-sm text-accent hover:underline">
                    Ver mais produtos
                  </a>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
