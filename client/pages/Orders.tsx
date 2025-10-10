import { useState, useMemo, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import NewOrderForm from "@/components/NewOrderForm";
import OrderFragmentForm from "@/components/OrderFragmentForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Plus,
  Search,
  ListFilter as Filter,
  Eye,
  CreditCard as Edit,
  Printer,
  Download,
  Clock,
  TriangleAlert as AlertTriangle,
  CircleCheck as CheckCircle,
  User,
  Calendar,
  DollarSign,
  Trash2,
  Scissors,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSupabase, Order, OrderFragment as DbOrderFragment } from "@/hooks/useSupabase";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { OrderFragment as UiOrderFragment } from "@/types/order";

const statusLabels = {
  pending: "Pendente",
  confirmed: "Confirmado",
  in_production: "Em Produção",
  quality_check: "Controle de Qualidade",
  ready: "Pronto",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  in_production: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  quality_check: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  ready: "bg-green-500/10 text-green-500 border-green-500/20",
  delivered: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
};

const priorityLabels = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Urgente",
};

const priorityColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

const fragmentStatusLabels = {
  pending: "Pendente",
  in_production: "Em Produção",
  completed: "Concluído",
};

const fragmentStatusColors = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  in_production: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  completed: "bg-green-500/10 text-green-500 border-green-500/20",
};

export default function OrdersSupabase() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Order["status"]>(
    "all",
  );
  const [priorityFilter, setPriorityFilter] = useState<
    "all" | Order["priority"]
  >("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showNewOrderForm, setShowNewOrderForm] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const { checkPermission } = useAuth();
  const { getOrders, createOrder, updateOrder, deleteOrder, isConnected } =
    useSupabase();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [showFragmentForm, setShowFragmentForm] = useState(false);
  const [fragmentTarget, setFragmentTarget] = useState<Order | null>(null);
  const [fragmentInitial, setFragmentInitial] = useState<UiOrderFragment[]>([]);

  const toDate = (value: any, fallback: Date = new Date()): Date => {
    if (!value) return fallback;
    if (value instanceof Date) return value;
    if (typeof value?.toDate === "function") {
      try {
        return value.toDate();
      } catch {
        return fallback;
      }
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? fallback : parsed;
  };

  const toNumber = (value: any, fallback = 0): number => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    }
    if (typeof value === "object" && value !== null) {
      const maybeValue = (value as any)?.toNumber?.();
      if (typeof maybeValue === "number" && Number.isFinite(maybeValue)) {
        return maybeValue;
      }
    }
    return fallback;
  };

  const computeOrderTotalQuantity = (order: Order): number => {
    if (order.total_quantity && order.total_quantity > 0) {
      return order.total_quantity;
    }
    if (Array.isArray(order.products) && order.products.length > 0) {
      return order.products.reduce(
        (sum, product) => sum + toNumber((product as any).quantity),
        0,
      );
    }
    if (Array.isArray(order.fragments) && order.fragments.length > 0) {
      return order.fragments.reduce(
        (sum, fragment) => sum + toNumber(fragment.quantity),
        0,
      );
    }
    return 0;
  };

  const mapFragmentsToUi = (order: Order): UiOrderFragment[] => {
    if (!Array.isArray(order.fragments)) return [];
    return order.fragments.map((fragment) => ({
      id: fragment.id,
      orderId: fragment.order_id,
      fragmentNumber: fragment.fragment_number,
      quantity: toNumber(fragment.quantity),
      scheduledDate: toDate(
        fragment.scheduled_date,
        toDate(order.scheduled_date),
      ),
      status: fragment.status,
      progress: toNumber(fragment.progress),
      value: toNumber(fragment.value),
      assignedOperator: fragment.assigned_operator,
      startedAt: fragment.started_at ? toDate(fragment.started_at) : undefined,
      completedAt: fragment.completed_at
        ? toDate(fragment.completed_at)
        : undefined,
    }));
  };

  const mapFragmentsToDb = (
    orderId: string,
    fragments: UiOrderFragment[],
  ): DbOrderFragment[] =>
    fragments.map((fragment, index) => {
      const fragmentNumber = fragment.fragmentNumber || index + 1;
      const fragmentId =
        fragment.id ||
        `${orderId}-frag-${fragmentNumber}-${Date.now()}`;
      return {
        id: fragmentId,
        order_id: orderId,
        fragment_number: fragmentNumber,
        quantity: toNumber(fragment.quantity),
        scheduled_date: fragment.scheduledDate.toISOString(),
        status: fragment.status,
        progress: toNumber(fragment.progress),
        value: toNumber(fragment.value),
        assigned_operator: fragment.assignedOperator,
        started_at: fragment.startedAt
          ? fragment.startedAt.toISOString()
          : undefined,
        completed_at: fragment.completedAt
          ? fragment.completedAt.toISOString()
          : undefined,
      };
    });

  const resolveFragmentTotalQuantity = (
    order: Order | null,
    initialFragments: UiOrderFragment[],
  ): number => {
    if (!order) {
      const fromInitial = initialFragments.reduce(
        (sum, fragment) => sum + toNumber(fragment.quantity),
        0,
      );
      return fromInitial > 0 ? fromInitial : 1;
    }
    const computed = computeOrderTotalQuantity(order);
    if (computed > 0) return computed;
    const fromInitial = initialFragments.reduce(
      (sum, fragment) => sum + toNumber(fragment.quantity),
      0,
    );
    return fromInitial > 0 ? fromInitial : 1;
  };

  const openFragmentForm = (order: Order) => {
    setFragmentTarget(order);
    setFragmentInitial(mapFragmentsToUi(order));
    setShowFragmentForm(true);
  };

  const closeFragmentForm = () => {
    setShowFragmentForm(false);
    setFragmentTarget(null);
    setFragmentInitial([]);
  };

  const handleSaveFragments = async (fragments: UiOrderFragment[]) => {
    if (!fragmentTarget) return;
    const fragmentsTotal = fragments.reduce(
      (sum, fragment) => sum + toNumber(fragment.quantity),
      0,
    );
    const effectiveTotal = (() => {
      const baseTotal = computeOrderTotalQuantity(fragmentTarget);
      if (baseTotal > 0) return baseTotal;
      return fragmentsTotal > 0 ? fragmentsTotal : 1;
    })();
    const payload = mapFragmentsToDb(fragmentTarget.id, fragments);

    try {
      const updated = await updateOrder(fragmentTarget.id, {
        fragments: payload as any,
        is_fragmented: fragments.length > 0,
        total_quantity: effectiveTotal,
      });
      if (updated) {
        applyUpdate(updated);
        toast({
          title: "Fragmentação salva",
          description: `Pedido ${updated.order_number} atualizado com ${fragments.length} fragmento(s).`,
        });
        closeFragmentForm();
      } else {
        toast({
          title: "Não foi possível salvar a fragmentação",
          description: "Tente novamente em instantes.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao salvar fragmentação:", error);
      toast({
        title: "Erro ao salvar fragmentação",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  // CORREÇÃO 1: useEffect inicial
  useEffect(() => {
    loadOrders();
  }, []);

  // CORREÇÃO 2: Recarrega quando conectar e não tiver dados
  useEffect(() => {
    if (isConnected && orders.length === 0 && !loading) {
      console.log('🔄 Reconectado ao Supabase, recarregando pedidos...');
      loadOrders();
    }
  }, [isConnected]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      console.log('🔍 Buscando pedidos...', { isConnected });
      const ordersData = await getOrders();
      console.log('✅ Pedidos carregados:', ordersData.length, ordersData);
      setOrders(ordersData);
    } catch (error) {
      console.error("❌ Erro ao carregar pedidos:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customer_name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;
      const matchesPriority =
        priorityFilter === "all" || order.priority === priorityFilter;
      const matchesTab = activeTab === "all" || order.status === activeTab;
      return matchesSearch && matchesStatus && matchesPriority && matchesTab;
    });
  }, [orders, searchTerm, statusFilter, priorityFilter, activeTab]);

  // Statistics
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => o.status === "pending").length;
    const inProductionOrders = orders.filter(
      (o) => o.status === "in_production",
    ).length;
    const readyOrders = orders.filter((o) => o.status === "ready").length;
    const totalRevenue = orders.reduce(
      (sum, order) => sum + (order.total_amount || 0),
      0,
    );
    const urgentOrders = orders.filter((o) => o.priority === "urgent").length;
    const overdueOrders = orders.filter(
      (o) =>
        o.delivery_date &&
        new Date() > new Date(o.delivery_date) &&
        !["delivered", "cancelled"].includes(o.status),
    ).length;

    return {
      totalOrders,
      pendingOrders,
      inProductionOrders,
      readyOrders,
      totalRevenue,
      urgentOrders,
      overdueOrders,
    };
  }, [orders]);

  const handleOrderCreated = async (newOrderData: any) => {
    try {
      const createdOrder = await createOrder(newOrderData);
      if (createdOrder) {
        setOrders((prevOrders) => [createdOrder, ...prevOrders]);
      }
    } catch (error) {
      console.error("Erro ao criar pedido:", error);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (
      !confirm(
        "Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.",
      )
    ) {
      return;
    }

    try {
      const success = await deleteOrder(orderId);

      if (!success) {
        alert("Erro ao excluir pedido");
        return;
      }

      alert("Pedido excluído com sucesso!");
      loadOrders();
    } catch (error) {
      console.error("Erro inesperado ao excluir pedido:", error);
      alert("Erro inesperado ao excluir pedido");
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const applyUpdate = (updated: Order) => {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    if (selectedOrder && selectedOrder.id === updated.id)
      setSelectedOrder(updated);
  };

  const handleTransition = async (
    order: Order,
    nextStatus: Order["status"],
    progress?: number,
  ) => {
    const updates: Partial<Order> = { status: nextStatus };
    if (typeof progress === "number") updates.production_progress = progress;
    const updated = await updateOrder(order.id, updates);
    if (updated) {
      applyUpdate(updated);
      if (nextStatus === "in_production") {
        toast({
          title: "Pedido enviado para produção",
          description: `Pedido ${updated.order_number} agora está em produção.`,
        });
        navigate("/production");
      }
    }
  };

  const availableActions = (
    order: Order,
  ): {
    label: string;
    next: Order["status"];
    perm: string;
    progress?: number;
  }[] => {
    const actions: {
      label: string;
      next: Order["status"];
      perm: string;
      progress?: number;
    }[] = [];
    switch (order.status) {
      case "pending":
        actions.push({
          label: "Aceitar",
          next: "confirmed",
          perm: "orders:approve",
          progress: 0,
        });
        actions.push({
          label: "Cancelar",
          next: "cancelled",
          perm: "orders:cancel",
        });
        break;
      case "confirmed":
        actions.push({
          label: "Enviar p/ Produção",
          next: "in_production",
          perm: "orders:advance",
          progress: Math.max(order.production_progress, 10),
        });
        actions.push({
          label: "Cancelar",
          next: "cancelled",
          perm: "orders:cancel",
        });
        break;
      case "in_production":
        actions.push({
          label: "Controle de Qualidade",
          next: "quality_check",
          perm: "orders:advance",
          progress: Math.max(order.production_progress, 80),
        });
        break;
      case "quality_check":
        actions.push({
          label: "Marcar Pronto",
          next: "ready",
          perm: "orders:advance",
          progress: 100,
        });
        break;
      case "ready":
        actions.push({
          label: "Entregar",
          next: "delivered",
          perm: "orders:deliver",
        });
        break;
    }
    return actions;
  };

  const formatDate = (value: any) => {
    return toDate(value).toLocaleDateString("pt-BR");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getDaysUntilDelivery = (deliveryDate?: string) => {
    if (!deliveryDate) return null;
    const today = new Date();
    const delivery = new Date(deliveryDate);
    const diffTime = delivery.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handlePrintOrder = (order: Order | null) => {
    if (!order) return;

    const printContent = `
      ========================================
      PEDIDO #${order.order_number}
      ========================================

      CLIENTE: ${order.customer_name}
      TELEFONE: ${order.customer_phone}
      EMAIL: ${order.customer_email || "N/A"}

      VENDEDOR: ${order.seller_name}
      STATUS: ${statusLabels[order.status]}
      PRIORIDADE: ${priorityLabels[order.priority]}

      DATA PRODUÇÃO: ${formatDate(order.scheduled_date)}
      DATA ENTREGA: ${order.delivery_date ? formatDate(order.delivery_date) : "N/A"}
      PROGRESSO: ${order.production_progress}%

      ${order.assigned_operator ? `OPERADOR: ${order.assigned_operator}` : ""}

      ${order.notes ? `OBSERVAÇÕES:\n${order.notes}\n` : ""}

      VALOR TOTAL: ${formatCurrency(order.total_amount || 0)}

      ========================================
      Data de Impressão: ${new Date().toLocaleString("pt-BR")}
      ========================================
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Pedido ${order.order_number}</title>
            <style>
              body { font-family: monospace; padding: 20px; }
              pre { white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <pre>${printContent}</pre>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 100);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handlePrintAll = () => {
    let printContent = `
      ========================================
      LISTA DE PEDIDOS - BIOBOXSYS
      ========================================
      Data: ${new Date().toLocaleDateString("pt-BR")}
      Total de Pedidos: ${filteredOrders.length}

    `;

    filteredOrders.forEach((order, index) => {
      printContent += `
      ${index + 1}. ${order.order_number} - ${order.customer_name}
         Status: ${statusLabels[order.status]} | Prioridade: ${priorityLabels[order.priority]}
         Entrega: ${order.delivery_date ? formatDate(order.delivery_date) : "N/A"}
         Valor: ${formatCurrency(order.total_amount || 0)}
      `;
    });

    printContent += `

      ========================================
      RESUMO
      ========================================
      Total: ${stats.totalOrders} pedidos
      Pendentes: ${stats.pendingOrders}
      Em Produção: ${stats.inProductionOrders}
      Prontos: ${stats.readyOrders}
      Receita Total: ${formatCurrency(stats.totalRevenue)}
      ========================================
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Lista de Pedidos</title>
            <style>
              body { font-family: monospace; padding: 20px; }
              pre { white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <pre>${printContent}</pre>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 100);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleExportReport = () => {
    const csvContent = [
      [
        "Pedido",
        "Cliente",
        "Vendedor",
        "Status",
        "Prioridade",
        "Data Produção",
        "Data Entrega",
        "Valor",
        "Progresso",
      ].join(","),
      ...filteredOrders.map((order) =>
        [
          order.order_number,
          order.customer_name,
          order.seller_name,
          statusLabels[order.status],
          priorityLabels[order.priority],
          formatDate(order.scheduled_date),
          order.delivery_date ? formatDate(order.delivery_date) : "N/A",
          (order.total_amount || 0).toFixed(2),
          `${order.production_progress}%`,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `pedidos_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-biobox-green mx-auto mb-4"></div>
            <p>Carregando pedidos...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Gerenciamento de Pedidos
            </h1>
            <p className="text-muted-foreground">
              Agende e acompanhe seus pedidos de produção
            </p>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                {stats.totalOrders} total
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {stats.inProductionOrders} em produção
              </span>
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                {stats.pendingOrders} pendentes
              </span>
              {stats.urgentOrders > 0 && (
                <span className="text-red-500">
                  🚨 {stats.urgentOrders} urgentes
                </span>
              )}
              {stats.overdueOrders > 0 && (
                <span className="text-red-500">
                  ⚠️ {stats.overdueOrders} atrasados
                </span>
              )}
              {!isConnected && (
                <span className="text-orange-500">📱 Modo offline</span>
              )}
            </div>
          </div>
          {checkPermission("orders", "create") && (
            <Button
              className="bg-biobox-green hover:bg-biobox-green-dark"
              onClick={() => setShowNewOrderForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Pedido
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-biobox-green" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total de Pedidos
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.totalOrders}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Pendentes
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.pendingOrders}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center">
                <User className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Em Produção
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.inProductionOrders}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Prontos
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.readyOrders}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-biobox-green" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Receita Total
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(stats.totalRevenue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por número do pedido ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value: any) => setStatusFilter(value)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos os Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key="all" value="all">Todos os Status</SelectItem>
              {Object.entries(statusLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={priorityFilter}
            onValueChange={(value: any) => setPriorityFilter(value)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todas as Prioridades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key="all" value="all">Todas as Prioridades</SelectItem>
              {Object.entries(priorityLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={handleExportReport}
            title="Exportar Relatório"
          >
            <Download className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handlePrintAll}
            title="Imprimir Lista"
          >
            <Printer className="h-4 w-4" />
          </Button>
        </div>

        {/* Orders List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Lista de Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="all">
                  Todos ({stats.totalOrders})
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Pendentes ({stats.pendingOrders})
                </TabsTrigger>
                <TabsTrigger value="confirmed">
                  Confirmados (
                  {orders.filter((o) => o.status === "confirmed").length})
                </TabsTrigger>
                <TabsTrigger value="in_production">
                  Em Produção ({stats.inProductionOrders})
                </TabsTrigger>
                <TabsTrigger value="ready">
                  Prontos ({stats.readyOrders})
                </TabsTrigger>
                <TabsTrigger value="delivered">
                  Entregues (
                  {orders.filter((o) => o.status === "delivered").length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Vendedor</TableHead>
                      <TableHead>Data Produção</TableHead>
                      <TableHead>Data Entrega</TableHead>
                      <TableHead>Progresso</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => {
                      const daysUntilDelivery = getDaysUntilDelivery(
                        order.delivery_date,
                      );
                      const isOverdue =
                        daysUntilDelivery !== null &&
                        daysUntilDelivery < 0 &&
                        !["delivered", "cancelled"].includes(order.status);

                      return (
                        <TableRow
                          key={order.id}
                          className={
                            isOverdue ? "bg-red-50 dark:bg-red-950/20" : ""
                          }
                        >
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div
                                className={`w-2 h-2 rounded-full ${priorityColors[order.priority]}`}
                              />
                              <div>
                                <div className="font-medium flex items-center gap-2">
                                  {order.order_number}
                                  {order.is_fragmented && (
                                    <Badge variant="outline" className="text-xs">
                                      Fragmentado
                                    </Badge>
                                  )}
                                </div>
                                {order.assigned_operator && (
                                  <div className="flex items-center text-xs text-muted-foreground">
                                    <User className="h-3 w-3 mr-1" />
                                    {order.assigned_operator}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {order.customer_name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {order.customer_phone}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium text-biobox-green">
                                {order.seller_name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Vendedor
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {formatDate(order.scheduled_date)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {order.delivery_date
                                ? formatDate(order.delivery_date)
                                : "-"}
                              {daysUntilDelivery !== null && (
                                <div
                                  className={`text-xs ${isOverdue ? "text-red-500" : daysUntilDelivery <= 3 ? "text-orange-500" : "text-muted-foreground"}`}
                                >
                                  {isOverdue
                                    ? `${Math.abs(daysUntilDelivery)} dias atrasado`
                                    : daysUntilDelivery === 0
                                      ? "Hoje"
                                      : daysUntilDelivery === 1
                                        ? "Amanhã"
                                        : `${daysUntilDelivery} dias`}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-biobox-green h-2 rounded-full"
                                  style={{
                                    width: `${order.production_progress}%`,
                                  }}
                                ></div>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {order.production_progress}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[order.status]}>
                              {statusLabels[order.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={priorityColors[order.priority]}>
                              {priorityLabels[order.priority]}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(order.total_amount)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewOrder(order)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {availableActions(order)
                                .filter((a) =>
                                  checkPermission(
                                    "orders",
                                    a.perm.split(":")[1],
                                  ),
                                )
                                .map((action) => (
                                  <Button
                                    key={action.label}
                                    variant="secondary"
                                    size="sm"
                                    onClick={() =>
                                      handleTransition(
                                        order,
                                        action.next,
                                        action.progress,
                                      )
                                    }
                                  >
                                    {action.label}
                                  </Button>
                                ))}
                              {checkPermission("orders", "edit") &&
                                !["delivered", "cancelled"].includes(
                                  order.status,
                                ) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openFragmentForm(order)}
                                  >
                                    <Scissors className="h-4 w-4 mr-2" />
                                    Fragmentar
                                  </Button>
                                )}
                              {checkPermission("orders", "edit") && (
                                <Button variant="ghost" size="icon">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handlePrintOrder(order)}
                                title="Imprimir Pedido"
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                              {checkPermission("orders", "delete") && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteOrder(order.id)}
                                  title="Excluir Pedido"
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Order Details Dialog */}
        <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                Detalhes do Pedido {selectedOrder?.order_number}
              </DialogTitle>
              <DialogDescription>
                Visualize e gerencie as informações completas do pedido
              </DialogDescription>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">
                      Informações do Cliente
                    </h3>
                    <p>
                      <strong>Nome:</strong> {selectedOrder.customer_name}
                    </p>
                    <p>
                      <strong>Telefone:</strong> {selectedOrder.customer_phone}
                    </p>
                    <p>
                      <strong>Email:</strong> {selectedOrder.customer_email}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">
                      Informações do Pedido
                    </h3>
                    <p>
                      <strong>Vendedor:</strong> {selectedOrder.seller_name}
                    </p>
                    <p>
                      <strong>Status:</strong>{" "}
                      {statusLabels[selectedOrder.status]}
                    </p>
                    <p>
                      <strong>Prioridade:</strong>{" "}
                      {priorityLabels[selectedOrder.priority]}
                    </p>
                    <p>
                      <strong>Progresso:</strong>{" "}
                      {selectedOrder.production_progress}%
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Datas</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <p>
                      <strong>Criado em:</strong>{" "}
                      {formatDate(selectedOrder.created_at)}
                    </p>
                    <p>
                      <strong>Produção:</strong>{" "}
                      {formatDate(selectedOrder.scheduled_date)}
                    </p>
                    <p>
                      <strong>Entrega:</strong>{" "}
                      {selectedOrder.delivery_date
                        ? formatDate(selectedOrder.delivery_date)
                        : "Não definida"}
                    </p>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div>
                    <h3 className="font-semibold mb-2">Observações</h3>
                    <p className="text-muted-foreground">
                      {selectedOrder.notes}
                    </p>
                  </div>
                )}

                {selectedOrder.fragments &&
                  selectedOrder.fragments.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">
                        Fragmentação de Produção
                      </h3>
                      <div className="space-y-2">
                        {selectedOrder.fragments.map((fragment) => (
                          <div
                            key={fragment.id}
                            className="border border-border rounded-lg p-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">
                                Fragmento {fragment.fragment_number} ·{" "}
                                {fragment.quantity} unidade(s)
                              </span>
                              <Badge
                                className={
                                  fragmentStatusColors[fragment.status] ||
                                  fragmentStatusColors.pending
                                }
                              >
                                {fragmentStatusLabels[fragment.status]}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm text-muted-foreground">
                              <span>
                                Produção: {formatDate(fragment.scheduled_date as any)}
                              </span>
                              {fragment.value ? (
                                <span>
                                  Valor: {formatCurrency(fragment.value)}
                                </span>
                              ) : null}
                              <span>Progresso: {fragment.progress ?? 0}%</span>
                              {fragment.assigned_operator ? (
                                <span>Operador: {fragment.assigned_operator}</span>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                <div className="flex justify-between">
                  <div className="text-lg font-bold">
                    Total: {formatCurrency(selectedOrder.total_amount)}
                  </div>
                  <div className="space-x-2">
                    {checkPermission("orders", "edit") &&
                      !["delivered", "cancelled"].includes(
                        selectedOrder.status,
                      ) && (
                        <Button
                          variant="outline"
                          onClick={() => openFragmentForm(selectedOrder)}
                        >
                          <Scissors className="h-4 w-4 mr-2" />
                          Fragmentar Produção
                        </Button>
                      )}
                    <Button
                      variant="outline"
                      onClick={() => handlePrintOrder(selectedOrder)}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Imprimir
                    </Button>
                    {availableActions(selectedOrder)
                      .filter((a) =>
                        checkPermission("orders", a.perm.split(":")[1]),
                      )
                      .map((a) => (
                        <Button
                          key={a.label}
                          onClick={() =>
                            handleTransition(selectedOrder, a.next, a.progress)
                          }
                        >
                          {a.label}
                        </Button>
                      ))}
                    {checkPermission("orders", "edit") && (
                      <Button>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar Pedido
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* New Order Form */}
        <NewOrderForm
          open={showNewOrderForm}
          onOpenChange={setShowNewOrderForm}
          onOrderCreated={handleOrderCreated}
        />

        {showFragmentForm && fragmentTarget && (
          <OrderFragmentForm
            totalQuantity={Math.max(
              1,
              resolveFragmentTotalQuantity(fragmentTarget, fragmentInitial),
            )}
            totalValue={toNumber(fragmentTarget.total_amount)}
            orderId={fragmentTarget.id}
            initialFragments={fragmentInitial}
            onSave={handleSaveFragments}
            onCancel={closeFragmentForm}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
