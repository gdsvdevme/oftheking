import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Bell, Menu } from "lucide-react";

export default function Navbar() {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { title: "Agenda", href: "/agenda" },
    { title: "Clientes", href: "/clientes" },
    { title: "Serviços", href: "/servicos" },
    { title: "Financeiro", href: "/financeiro" },
    { title: "Estoque", href: "/estoque" },
  ];

  const isActive = (path: string) => {
    if (path === "/agenda" && (location === "/" || location === "/agenda")) {
      return true;
    }
    return location === path;
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <a className="flex items-center">
                  <h1 className="text-primary font-poppins font-bold text-2xl">Dellas</h1>
                  <span className="text-dark text-sm ml-2">Cabelo & Pele</span>
                </a>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <a 
                    className={`${
                      isActive(item.href)
                        ? "border-primary text-dark"
                        : "border-transparent text-gray-500 hover:border-secondary hover:text-gray-700"
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    {item.title}
                  </a>
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-500">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Ver notificações</span>
            </Button>

            {/* Profile dropdown */}
            <div className="ml-3 relative">
              <div>
                <Button variant="ghost" className="flex items-center gap-2 text-sm">
                  <span className="hidden md:block">Fernanda Silva</span>
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white">
                    FS
                  </div>
                </Button>
              </div>
            </div>
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            {/* Mobile menu button */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-500">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Abrir menu principal</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <div className="flex flex-col gap-6 mt-6">
                  <div className="flex-shrink-0 flex items-center">
                    <h1 className="text-primary font-poppins font-bold text-2xl">Dellas</h1>
                    <span className="text-dark text-sm ml-2">Cabelo & Pele</span>
                  </div>
                  
                  <div className="flex flex-col space-y-3">
                    {navItems.map((item) => (
                      <Link key={item.href} href={item.href}>
                        <a 
                          className={`${
                            isActive(item.href)
                              ? "bg-secondary/20 text-primary"
                              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                          } px-3 py-2 rounded-md text-base font-medium`}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {item.title}
                        </a>
                      </Link>
                    ))}
                  </div>
                  
                  <div className="pt-4 mt-4 border-t border-gray-200">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white">
                        FS
                      </div>
                      <div className="ml-3">
                        <div className="text-base font-medium text-gray-800">Fernanda Silva</div>
                        <div className="text-sm font-medium text-gray-500">fernanda@dellas.com</div>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
