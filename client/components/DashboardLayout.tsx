import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Home,
  Users,
  Package,
  Calendar,
  BarChart3,
  Settings,
  Bell,
  Search,
  Menu,
  X,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Clientes", href: "/customers", icon: Users },
  { name: "Pedidos", href: "/orders", icon: Calendar },
  { name: "Produção", href: "/production", icon: BarChart3 },
  { name: "Produtos", href: "/products", icon: Package },
  { name: "Configurações", href: "/settings", icon: Settings },
];

const getInitials = (name?: string) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const { user, checkPermission, logout } = useAuth();

  // Filter navigation based on user permissions
  const filteredNavigation = navigation.filter((item) => {
    if (!user) return false;

    const moduleMap: Record<string, string> = {
      "/": "dashboard",
      "/customers": "customers",
      "/orders": "orders",
      "/production": "production",
      "/products": "products",
      "/settings": "settings",
    };

    const module = moduleMap[item.href];
    return module ? checkPermission(module, "view") : false;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && filteredNavigation.length > 0 && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      {filteredNavigation.length > 0 && (
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 transform bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out",
            sidebarOpen
              ? "translate-x-0 w-64"
              : "-translate-x-full lg:translate-x-0",
            sidebarCollapsed && "lg:w-16",
            !sidebarCollapsed && "lg:w-64"
          )}
        >
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-16 items-center justify-between px-6 border-b border-sidebar-border">
              <div className={cn(
                "flex items-center transition-all duration-300",
                sidebarCollapsed ? "lg:w-0 lg:opacity-0 lg:overflow-hidden" : "lg:w-auto lg:opacity-100"
              )}>
                <img
                  src="/logobio.png"
                  alt="BioBox"
                  className="h-10 w-auto object-contain"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden lg:flex"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  title={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
                >
                  <Menu className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 px-3 py-4">
              <nav className="space-y-1">
                {filteredNavigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        "flex items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        sidebarCollapsed && "lg:justify-center"
                      )}
                      title={sidebarCollapsed ? item.name : undefined}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className={cn(
                        "transition-all duration-300",
                        sidebarCollapsed && "lg:w-0 lg:opacity-0 lg:overflow-hidden"
                      )}>
                        {item.name}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </ScrollArea>

            {/* User Profile */}
            <div className="border-t border-sidebar-border p-4">
              <div className={cn(
                "flex items-center",
                sidebarCollapsed ? "lg:justify-center" : "justify-between"
              )}>
                <div className={cn(
                  "flex items-center space-x-3",
                  sidebarCollapsed && "lg:space-x-0"
                )}>
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback className="bg-biobox-green text-biobox-dark text-xs font-medium">
                      {getInitials(user?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "flex-1 min-w-0 transition-all duration-300",
                    sidebarCollapsed && "lg:w-0 lg:opacity-0 lg:overflow-hidden"
                  )}>
                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                      {user?.name || "Usuário"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.role === "admin" ? "Administrador" : "Vendedor"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  className={cn(
                    "h-8 w-8 transition-all duration-300",
                    sidebarCollapsed && "lg:w-0 lg:opacity-0 lg:overflow-hidden lg:hidden"
                  )}
                  title="Sair"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div
        className={cn(
          "transition-all duration-300",
          filteredNavigation.length > 0 && !sidebarCollapsed && "lg:pl-64",
          filteredNavigation.length > 0 && sidebarCollapsed && "lg:pl-16",
          filteredNavigation.length === 0 && "lg:pl-0"
        )}
      >
        {/* Mobile menu button */}
        {filteredNavigation.length > 0 && (
          <div className="lg:hidden fixed top-4 left-4 z-30">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="bg-card border border-border"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Page content */}
        <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
