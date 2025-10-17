import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Printer,
  Search,
  Filter,
  Package,
  User,
  DollarSign,
} from "lucide-react";
import { useFirebase, Order } from "@/hooks/useFirebase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import ProductionPanorama from "@/components/ProductionPanorama";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  addDays,
  isToday,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";

const statusLabels = {
  pending: "Pendente",
  awaiting_approval: "Aguardando Aprovação",
  confirmed: "Confirmado",
  in_production: "Em Produção",
  quality_check: "Controle de Qualidade",
  ready: "Pronto",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  awaiting_approval: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  in_production: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  quality_check: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  ready: "bg-green-500/10 text-green-500 border-green-500/20",
  delivered: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
};

const priorityColors = {
  low: "bg-gray-500",
  medium: "bg-blue-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
};

export default function Agenda() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [draggedOrder, setDraggedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Order["status"]>("awaiting_approval");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [showPanorama, setShowPanorama] = useState(false);

  const { getOrders, updateOrder } = useFirebase();
  const { user, checkPermission } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await getOrders();
      setOrders(data);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os pedidos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { locale: ptBR });
  const calendarEnd = endOfWeek(monthEnd, { locale: ptBR });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getOrdersForDate = (date: Date) => {
    return orders.filter((order) => {
      if (!order.scheduled_date) return false;
      try {
        const scheduledDate = parseISO(order.scheduled_date);
        return isSameDay(scheduledDate, date);
      } catch {
        return false;
      }
    });
  };

  const getPendingOrders = () => {
    return orders.filter((order) => {
      // Filtrar por status
      if (statusFilter !== "all" && order.status !== statusFilter) {
        return false;
      }

      // Filtrar por cliente
      if (customerFilter !== "all" && order.customer_name !== customerFilter) {
        return false;
      }

      // Filtrar por termo de busca
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          order.order_number.toLowerCase().includes(term) ||
          order.customer_name?.toLowerCase().includes(term)
        );
      }

      return true;
    });
  };

  const handleDragStart = (order: Order) => {
    setDraggedOrder(order);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (date: Date) => {
    if (!draggedOrder) return;

    try {
      const updatedOrder = {
        ...draggedOrder,
        scheduled_date: date.toISOString(),
        status: "confirmed" as Order["status"],
      };

      await updateOrder(draggedOrder.id, updatedOrder);

      setOrders((prev) =>
        prev.map((o) => (o.id === draggedOrder.id ? updatedOrder : o))
      );

      toast({
        title: "Sucesso",
        description: `Pedido ${draggedOrder.order_number} agendado para ${format(date, "dd/MM/yyyy", { locale: ptBR })}`,
      });
    } catch (error) {
      console.error("Erro ao agendar pedido:", error);
      toast({
        title: "Erro",
        description: "Não foi possível agendar o pedido",
        variant: "destructive",
      });
    } finally {
      setDraggedOrder(null);
    }
  };

  const handleApproveOrder = async (order: Order) => {
    if (!checkPermission("orders", "approve")) {
      toast({
        title: "Sem permissão",
        description: "Você não tem permissão para aprovar pedidos",
        variant: "destructive",
      });
      return;
    }

    try {
      const updatedOrder = {
        ...order,
        status: "confirmed" as Order["status"],
      };

      await updateOrder(order.id, updatedOrder);

      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? updatedOrder : o))
      );

      toast({
        title: "Sucesso",
        description: `Pedido ${order.order_number} aprovado`,
      });
    } catch (error) {
      console.error("Erro ao aprovar pedido:", error);
      toast({
        title: "Erro",
        description: "Não foi possível aprovar o pedido",
        variant: "destructive",
      });
    }
  };

  const handlePrintPanorama = () => {
    setShowPanorama(true);
  };

  const uniqueCustomers = Array.from(
    new Set(orders.map((o) => o.customer_name).filter(Boolean))
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Agenda de Produção</h1>
            <p className="text-muted-foreground">
              Aprove e agende pedidos para produção
            </p>
          </div>
          <Button onClick={handlePrintPanorama} variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir Panorama
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pedidos Pendentes */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Pedidos Pendentes</CardTitle>
              <div className="space-y-2 mt-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar pedido..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="awaiting_approval">Aguardando Aprovação</SelectItem>
                    <SelectItem value="confirmed">Confirmado</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={customerFilter} onValueChange={setCustomerFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os clientes</SelectItem>
                    {uniqueCustomers.map((customer) => (
                      <SelectItem key={customer} value={customer!}>
                        {customer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {loading ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Carregando...
                  </p>
                ) : getPendingOrders().length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum pedido encontrado
                  </p>
                ) : (
                  getPendingOrders().map((order) => (
                    <div
                      key={order.id}
                      draggable
                      onDragStart={() => handleDragStart(order)}
                      className="p-3 border border-border rounded-lg cursor-move hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full",
                              priorityColors[order.priority]
                            )}
                          />
                          <div>
                            <div className="font-medium text-sm">
                              {order.order_number}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {order.customer_name}
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn("text-xs", statusColors[order.status])}
                        >
                          {statusLabels[order.status]}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center text-muted-foreground">
                            <Package className="h-3 w-3 mr-1" />
                            <span>{order.products?.length || 0} item(s)</span>
                          </div>
                          <div className="font-medium">
                            {formatCurrency(order.total_amount)}
                          </div>
                        </div>
                        {order.seller_name && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <User className="h-3 w-3 mr-1" />
                            <span>{order.seller_name}</span>
                          </div>
                        )}
                      </div>
                      {order.status === "pending" && (
                        <Button
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => handleApproveOrder(order)}
                        >
                          Aprovar
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Calendário */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMonth(new Date())}
                  >
                    Hoje
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {/* Cabeçalho dos dias da semana */}
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-medium text-muted-foreground py-2"
                  >
                    {day}
                  </div>
                ))}

                {/* Dias do calendário */}
                {calendarDays.map((day, index) => {
                  const ordersForDay = getOrdersForDate(day);
                  const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                  const isTodayDate = isToday(day);

                  return (
                    <div
                      key={index}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(day)}
                      className={cn(
                        "min-h-[100px] p-2 border border-border rounded-lg transition-colors",
                        !isCurrentMonth && "bg-muted/20 text-muted-foreground",
                        isTodayDate && "border-biobox-green border-2",
                        draggedOrder && "hover:bg-biobox-green/10"
                      )}
                    >
                      <div
                        className={cn(
                          "text-sm font-medium mb-1",
                          isTodayDate && "text-biobox-green"
                        )}
                      >
                        {format(day, "d")}
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {ordersForDay.slice(0, 2).map((order) => (
                          <div
                            key={order.id}
                            draggable
                            onDragStart={() => handleDragStart(order)}
                            className="text-xs p-1 bg-biobox-green/10 border border-biobox-green/20 rounded truncate cursor-move hover:bg-biobox-green/20 transition-colors"
                            title={`${order.order_number} - ${order.customer_name} (Arraste para mover)`}
                          >
                            {order.order_number}
                          </div>
                        ))}
                        {ordersForDay.length > 2 && (
                          <button
                            onClick={() => setSelectedDate(day)}
                            className="text-xs p-1 w-full bg-blue-500/10 border border-blue-500/20 rounded text-blue-600 hover:bg-blue-500/20 transition-colors font-medium"
                          >
                            +{ordersForDay.length - 2} mais
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resumo do dia selecionado */}
        {selectedDate && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Pedidos para {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getOrdersForDate(selectedDate).map((order) => (
                  <div
                    key={order.id}
                    className="p-4 border border-border rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium">{order.order_number}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.customer_name}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn("text-xs", statusColors[order.status])}
                      >
                        {statusLabels[order.status]}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Valor:</span>
                        <span className="font-medium">
                          {formatCurrency(order.total_amount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Produtos:</span>
                        <span>{order.products?.length || 0}</span>
                      </div>
                      {order.seller_name && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Vendedor:</span>
                          <span>{order.seller_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog do Panorama de Produção */}
      <Dialog open={showPanorama} onOpenChange={setShowPanorama}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Panorama de Produção</DialogTitle>
            <DialogDescription>
              Visualização completa dos pedidos agendados
            </DialogDescription>
          </DialogHeader>
          <ProductionPanorama
            orders={orders.filter(o => o.scheduled_date)}
            startDate={monthStart}
            endDate={monthEnd}
          />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
