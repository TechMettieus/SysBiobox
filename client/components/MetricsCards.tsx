// client/components/MetricsCards.tsx
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Calendar,
  Truck,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
} from "lucide-react";
import { useSupabase } from "@/hooks/useSupabase";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color?: "green" | "blue" | "orange" | "red";
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = "green",
}: MetricCardProps) {
  const colorClasses = {
    green: "bg-biobox-green/10 text-biobox-green",
    blue: "bg-blue-500/10 text-blue-500",
    orange: "bg-orange-500/10 text-orange-500",
    red: "bg-red-500/10 text-red-500",
  };

  return (
    <Card className="bg-card border-border hover:bg-card/80 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
            {trend && trendValue && (
              <div className="flex items-center mt-2 space-x-1">
                {trend === "up" ? (
                  <TrendingUp className="h-3 w-3 text-biobox-green" />
                ) : trend === "down" ? (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                ) : null}
                <span
                  className={`text-xs font-medium ${
                    trend === "up"
                      ? "text-biobox-green"
                      : trend === "down"
                        ? "text-red-500"
                        : "text-muted-foreground"
                  }`}
                >
                  {trendValue}
                </span>
              </div>
            )}
          </div>
          <div
            className={`h-12 w-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}
          >
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MetricsCards() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    activeOrders: 0,
    urgentOrders: 0,
    inProductionOrders: 0,
    delayedOrders: 0,
    readyOrders: 0,
    monthlyRevenue: 0,
    completedToday: 0,
    pendingValue: 0,
  });

  const { getOrders, getCustomers } = useSupabase();

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      
      // Buscar dados reais
      const [orders, customers] = await Promise.all([
        getOrders(),
        getCustomers()
      ]);

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Calcular métricas
      const activeOrders = orders.filter((order) =>
        ["pending", "confirmed", "in_production", "quality_check", "ready"].includes(
          order.status,
        ),
      ).length;

      const urgentOrders = orders.filter(
        (order) =>
          order.priority === "urgent" &&
          !["delivered", "cancelled"].includes(order.status),
      ).length;

      const inProductionOrders = orders.filter(
        (order) => order.status === "in_production",
      ).length;

      const readyOrders = orders.filter(
        (order) => order.status === "ready",
      ).length;

      const delayedOrders = orders.filter(
        (order) =>
          order.delivery_date &&
          new Date(order.delivery_date) < now &&
          !["delivered", "cancelled"].includes(order.status),
      ).length;

      // Calcular receita do mês
      const monthlyOrders = orders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= monthStart && order.status !== "cancelled";
      });
      
      const monthlyRevenue = monthlyOrders.reduce(
        (sum, order) => sum + (order.total_amount || 0), 
        0
      );

      // Pedidos concluídos hoje
      const completedToday = orders.filter(order => {
        if (order.status !== "delivered") return false;
        const deliveryDate = order.completed_date ? new Date(order.completed_date) : null;
        return deliveryDate && deliveryDate >= today;
      }).length;

      // Valor pendente de produção
      const pendingValue = orders
        .filter(o => ["pending", "confirmed", "in_production"].includes(o.status))
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);

      setMetrics({
        activeOrders,
        urgentOrders,
        inProductionOrders,
        delayedOrders,
        readyOrders,
        monthlyRevenue,
        completedToday,
        pendingValue
      });
    } catch (error) {
      console.error("Erro ao carregar métricas:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-card border-border">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-muted rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Calcular tendências (comparando com período anterior)
  const revenueTarget = 180000; // Meta mensal configurável
  const revenuePercentage = Math.round((metrics.monthlyRevenue / revenueTarget) * 100);
  const revenueTrend = revenuePercentage >= 50 ? "up" : "down";

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Pedidos Ativos"
        value={metrics.activeOrders}
        subtitle={`${metrics.urgentOrders} urgente${metrics.urgentOrders !== 1 ? 's' : ''}`}
        icon={Calendar}
        trend={metrics.activeOrders > 0 ? "up" : "neutral"}
        trendValue={metrics.delayedOrders > 0 ? `${metrics.delayedOrders} atrasado${metrics.delayedOrders !== 1 ? 's' : ''}` : "Sem atrasos"}
        color="blue"
      />
      
      <MetricCard
        title="Em Produção"
        value={metrics.inProductionOrders}
        subtitle="Sendo fabricados agora"
        icon={Package}
        trend={metrics.inProductionOrders > 0 ? "up" : "neutral"}
        trendValue={`${metrics.readyOrders} pronto${metrics.readyOrders !== 1 ? 's' : ''} para entrega`}
        color="orange"
      />
      
      <MetricCard
        title="Concluídos Hoje"
        value={metrics.completedToday}
        subtitle="Entregas realizadas"
        icon={CheckCircle}
        trend={metrics.completedToday > 0 ? "up" : "neutral"}
        trendValue={metrics.completedToday > 0 ? "Meta diária atingida" : "Nenhuma entrega hoje"}
        color="green"
      />
      
      <MetricCard
        title="Receita Mensal"
        value={formatCurrency(metrics.monthlyRevenue)}
        subtitle={`Meta: ${formatCurrency(revenueTarget)}`}
        icon={DollarSign}
        trend={revenueTrend}
        trendValue={`${revenuePercentage}% da meta`}
        color={revenuePercentage >= 80 ? "green" : revenuePercentage >= 50 ? "orange" : "red"}
      />
    </div>
  );
}