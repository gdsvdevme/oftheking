import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  // Se temos menos de 2 páginas, não exibimos a paginação
  if (totalPages <= 1) return null;

  // Função para gerar os números das páginas a exibir
  const getPageNumbers = () => {
    const pages = [];
    
    // Sempre mostrar a primeira página
    pages.push(1);
    
    // Determinar páginas intermediárias
    const rangeStart = Math.max(2, currentPage - 1);
    const rangeEnd = Math.min(totalPages - 1, currentPage + 1);
    
    // Adicionar elipses antes das páginas intermediárias, se necessário
    if (rangeStart > 2) {
      pages.push(-1); // -1 indica elipses
    }
    
    // Adicionar páginas intermediárias
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }
    
    // Adicionar elipses depois das páginas intermediárias, se necessário
    if (rangeEnd < totalPages - 1) {
      pages.push(-2); // -2 indica elipses (usamos um valor diferente para evitar duplicatas de key)
    }
    
    // Sempre mostrar a última página, se diferente da primeira
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <div className="flex items-center justify-center space-x-2 mt-4">
      <Button
        variant="outline"
        size="icon"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onPageChange(currentPage - 1);
        }}
        disabled={currentPage <= 1}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Página anterior</span>
      </Button>
      
      {getPageNumbers().map((page, index) => (
        page < 0 ? (
          <Button 
            key={`ellipsis-${index}`} 
            variant="ghost" 
            size="icon" 
            disabled
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPageChange(page);
            }}
            className="h-9 w-9"
          >
            {page}
          </Button>
        )
      ))}
      
      <Button
        variant="outline"
        size="icon"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onPageChange(currentPage + 1);
        }}
        disabled={currentPage >= totalPages}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Próxima página</span>
      </Button>
    </div>
  );
}