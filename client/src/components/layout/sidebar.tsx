import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Users, 
  Scissors, 
  BarChart3, 
  Package, 
  LogOut 
} from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();
  
  const sidebarItems = [
    { 
      title: "Agenda", 
      href: "/agenda", 
      icon: <Calendar className="h-5 w-5" /> 
    },
    { 
      title: "Clientes", 
      href: "/clientes", 
      icon: <Users className="h-5 w-5" /> 
    },
    { 
      title: "Serviços", 
      href: "/servicos", 
      icon: <Scissors className="h-5 w-5" /> 
    },
    { 
      title: "Financeiro", 
      href: "/financeiro", 
      icon: <BarChart3 className="h-5 w-5" /> 
    },
    { 
      title: "Estoque", 
      href: "/estoque", 
      icon: <Package className="h-5 w-5" /> 
    },
  ];
  
  const isActive = (path: string) => {
    if (path === "/agenda" && (location === "/" || location === "/agenda")) {
      return true;
    }
    return location === path;
  };
  
  return (
    <div className="hidden lg:flex flex-col h-screen w-64 bg-white border-r">
      <div className="p-4 border-b">
        <div className="flex items-center">
          <h1 className="text-primary font-poppins font-bold text-xl">Dellas</h1>
          <span className="text-dark text-xs ml-2">Cabelo & Pele</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {sidebarItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a 
                className={`${
                  isActive(item.href)
                    ? "bg-secondary/20 text-primary border-r-4 border-primary"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                } group flex items-center px-3 py-3 text-sm font-medium rounded-md`}
              >
                {item.icon}
                <span className="ml-3">{item.title}</span>
              </a>
            </Link>
          ))}
        </nav>
      </div>
      
      <div className="p-4 border-t">
        <div className="flex items-center mb-4">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white">
            FS
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">Fernanda Silva</p>
            <p className="text-xs text-gray-500">Admin</p>
          </div>
        </div>
        <Button variant="outline" className="w-full justify-start text-gray-600">
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    </div>
  );
}
