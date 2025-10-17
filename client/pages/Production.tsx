import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Scissors,
  Hammer,
  Sofa,
  Wrench,
  Package as PackageIcon,
  Truck,
  User,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useFirebase, Order } from "@/hooks/useFirebase";
import { productionStages } from "@/types/production";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ProductionStagesTracker from "@/components/ProductionStagesTracker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const stageIcons = {
  cutting_sewing: Scissors,
  carpentry: Hammer,
  upholstery: Sofa,
  assembly: Wrench,
  packaging: PackageIcon,
  delivery: Truck,
};

export default function Production() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showStagesDialog, setShowStagesDialog] = useState(false);
  const { getOrders, updateOrder } = useFirebase();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    const allOrders = await getOrders();
    // Filtrar apenas pedidos em produção
    const productionOrders = allOrders.filter(
      (o) =>
        o.status === "confirmed" ||
        o.status === "in_production" ||
        o.status === "quality_check"
    );
    setOrders(productionOrders);
  };

  const getOrdersByStage = (stageId: string) => {
    return orders.filter((order) => {
      const stages = order.production_stages || [];
      const currentStage = stages.find((s) => s.stage === stageId);
      
      // Se não tem a etapa ainda, considerar como pendente na primeira etapa
      if (!currentStage && stageId === "cutting_sewing") {
        return true;
      }
      
      // Mostrar pedidos que estão nesta etapa (pendente ou em andamento)
      return currentStage && currentStage.status !== "completed";
    });
  };

  const getStageProgress = (stageId: string) => {
    const ordersInStage = getOrdersByStage(stageId);
    if (ordersInStage.length === 0) return 0;
    
    const completed = ordersInStage.filter((order) => {
      const stages = order.production_stages || [];
      const stage = stages.find((s) => s.stage === stageId);
      return stage?.status === "completed";
    }).length;
    
    return Math.round((completed / ordersInStage.length) * 100);
  };

  const handleOpenStages = (order: Order) => {
    setSelectedOrder(order);
    setShowStagesDialog(true);
  };

  const handleUpdateStage = async (stageId: string, updates: any) => {
    if (!selectedOrder) return;

    const updatedStages = [...(selectedOrder.production_stages || [])];
    const stageIndex = updatedStages.findIndex((s) => s.stage === stageId);

    if (stageIndex >= 0) {
      updatedStages[stageIndex] = { ...updatedStages[stageIndex], ...updates };
    } else {
      updatedStages.push({ stage: stageId, ...updates } as any);
    }

    await updateOrder(selectedOrder.id, {
      ...selectedOrder,
      production_stages: updatedStages,
      status: "in_production" as Order["status"],
    });

    // Recarregar pedidos
    await loadOrders();
    
    // Atualizar pedido selecionado
    const refreshedOrders = await getOrders();
    const refreshedOrder = refreshedOrders.find((o) => o.id === selectedOrder.id);
    if (refreshedOrder) {
      setSelectedOrder(refreshedOrder);
    }
  };

  const getStageStatus = (order: Order, stageId: string) => {
    const stages = order.production_stages || [];
    const stage = stages.find((s) => s.stage === stageId);
    return stage?.status || "pending";
  };

  const priorityColors = {
    low: "bg-gray-500",
    medium: "bg-blue-500",
    high: "bg-orange-500",
    urgent: "bg-red-500",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Acompanhamento de Produção
            </h1>
            <p className="text-muted-foreground">
              Gerencie as etapas de produção por setor
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {orders.length} pedidos em produção
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="cutting_sewing" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            {productionStages.map((stage) => {
              const Icon = stageIcons[stage.id as keyof typeof stageIcons];
              const ordersCount = getOrdersByStage(stage.id).length;
              
              return (
                <TabsTrigger key={stage.id} value={stage.id} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline">{stage.name}</span>
                  {ordersCount > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {ordersCount}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {productionStages.map((stage) => {
            const Icon = stageIcons[stage.id as keyof typeof stageIcons];
            const ordersInStage = getOrdersByStage(stage.id);
            const progress = getStageProgress(stage.id);

            return (
              <TabsContent key={stage.id} value={stage.id} className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-biobox-green/10 rounded-lg">
                          <Icon className="h-6 w-6 text-biobox-green" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{stage.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Tempo estimado: {stage.estimatedTime} min
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-biobox-green">
                          {ordersInStage.length}
                        </p>
                        <p className="text-xs text-muted-foreground">Pedidos</p>
                      </div>
                    </div>
                    {ordersInStage.length > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Progresso Geral</span>
                          <span className="font-medium">{progress}%</span>
                        </div>
                        <Progress value={progress} />
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    {ordersInStage.length === 0 ? (
                      <div className="text-center py-12">
                        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          Nenhum pedido nesta etapa
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {ordersInStage.map((order) => {
                          const status = getStageStatus(order, stage.id);
                          const stageData = order.production_stages?.find(
                            (s) => s.stage === stage.id
                          );

                          return (
                            <Card
                              key={order.id}
                              className="hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => handleOpenStages(order)}
                            >
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <div
                                        className={cn(
                                          "w-2 h-2 rounded-full",
                                          priorityColors[order.priority]
                                        )}
                                      />
                                      <span className="font-semibold">
                                        {order.order_number}
                                      </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {order.customer_name}
                                    </p>
                                  </div>
                                  <Badge
                                    variant={
                                      status === "completed"
                                        ? "default"
                                        : status === "in_progress"
                                        ? "secondary"
                                        : "outline"
                                    }
                                    className={cn(
                                      status === "completed" && "bg-green-500",
                                      status === "in_progress" && "bg-blue-500"
                                    )}
                                  >
                                    {status === "pending" && "Pendente"}
                                    {status === "in_progress" && "Em Andamento"}
                                    {status === "completed" && "Concluído"}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-2">
                                {stageData?.assigned_operator && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">
                                      {stageData.assigned_operator}
                                    </span>
                                  </div>
                                )}
                                {stageData?.started_at && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">
                                      Iniciado:{" "}
                                      {format(
                                        new Date(stageData.started_at),
                                        "dd/MM HH:mm",
                                        { locale: ptBR }
                                      )}
                                    </span>
                                  </div>
                                )}
                                {order.scheduled_date && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">
                                      Produção:{" "}
                                      {format(
                                        new Date(order.scheduled_date),
                                        "dd/MM/yyyy",
                                        { locale: ptBR }
                                      )}
                                    </span>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>

        {/* Dialog com todas as etapas do pedido */}
        <Dialog open={showStagesDialog} onOpenChange={setShowStagesDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Etapas de Produção - {selectedOrder?.order_number}
              </DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <ProductionStagesTracker
                orderId={selectedOrder.id}
                orderNumber={selectedOrder.order_number}
                stages={selectedOrder.production_stages || []}
                onUpdateStage={handleUpdateStage}
                operators={[
                  { id: "1", name: "João Silva" },
                  { id: "2", name: "Maria Santos" },
                  { id: "3", name: "Pedro Costa" },
                  { id: "4", name: "Ana Oliveira" },
                ]}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

