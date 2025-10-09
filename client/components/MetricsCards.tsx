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
  });
  const [monthlyTarget, setMonthlyTarget] = useState(180000);

  const { getOrders } = useSupabase();

  useEffect(() => {
    loadSettings();
    loadMetrics();
  }, []);

  const loadSettings = async () => {
    try {
      const storedSettings = localStorage.getItem("biobox_settings_system");
      if (storedSettings) {
        const settings = JSON.parse(storedSettings);
        if (settings.monthlyRevenueTarget) {
          setMonthlyTarget(settings.monthlyRevenueTarget);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    }
  };

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const orders = await getOrders();

      const activeOrders = orders.filter((order) =>
        ["pending", "confirmed", "in_production", "quality_check"].includes(
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

      const now = new Date();
      const delayedOrders = orders.filter(
        (order) =>
          order.delivery_date &&
          new Date(order.delivery_date) < now &&
          !["delivered", "cancelled"].includes(order.status),
      ).length;

      const monthlyRevenue = orders
        .filter((order) => order.status !== "cancelled")
        .reduce((sum, order) => sum + (order.total_amount || 0), 0);

      setMetrics({
        activeOrders,
        urgentOrders,
        inProductionOrders,
        delayedOrders,
        readyOrders,
        monthlyRevenue,
      });
    } catch (error) {
      console.error("Erro ao carregar métricas:", error);
    } finally {
      setLoading(false);
    }
  };

  const revenuePercentage = Math.round(
    (metrics.monthlyRevenue / monthlyTarget) * 100,
  );

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

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Pedidos Ativos"
        value={metrics.activeOrders}
        subtitle={`${metrics.urgentOrders} urgentes`}
        icon={Calendar}
        trend={metrics.activeOrders > 0 ? "up" : "neutral"}
        trendValue={`${metrics.activeOrders} em andamento`}
        color="blue"
      />
      <MetricCard
        title="Em Produção"
        value={metrics.inProductionOrders}
        subtitle="Pedidos sendo fabricados"
        icon={Package}
        trend={metrics.delayedOrders > 0 ? "down" : "neutral"}
        trendValue={
          metrics.delayedOrders > 0
            ? `${metrics.delayedOrders} atrasados`
            : "Nenhum atraso"
        }
        color="orange"
      />
      <MetricCard
        title="Prontos p/ Entrega"
        value={metrics.readyOrders}
        subtitle="Aguardando transporte"
        icon={CheckCircle}
        trend="up"
        trendValue={`${metrics.readyOrders} prontos`}
        color="green"
      />
      <MetricCard
        title="Receita Total"
        value={new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(metrics.monthlyRevenue)}
        subtitle={`Meta Mensal: ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(monthlyTarget)}`}
        icon={DollarSign}
        trend={revenuePercentage >= 50 ? "up" : "down"}
        trendValue={`${revenuePercentage}% da meta mensal`}
        color="green"
      />
    </div>
  );
}
