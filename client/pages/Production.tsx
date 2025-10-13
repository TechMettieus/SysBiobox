import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ProductionDashboard from "@/components/ProductionDashboard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ProductionReport from "@/components/ProductionReport";
import ThermalPrintManager from "@/components/ThermalPrintManager";
import NewProductionTask from "@/components/NewProductionTask";
import { Play, Download, Printer } from "lucide-react";

export default function Production() {
  const [showReport, setShowReport] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Acompanhamento de Produção
            </h1>
            <p className="text-muted-foreground">
              Monitore e controle o processo de fabricação em tempo real
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => setShowReport(true)}>
              <Download className="h-4 w-4 mr-2" />
              Relatório
            </Button>
            <Button variant="outline" onClick={() => setShowPrint(true)}>
              <Printer className="h-4 w-4 mr-2" />
              Etiquetas
            </Button>
            <Button
              className="bg-biobox-green hover:bg-biobox-green-dark"
              onClick={() => setShowNewTask(true)}
            >
              <Play className="h-4 w-4 mr-2" />
              Nova Tarefa
            </Button>
          </div>
        </div>

        <ProductionDashboard refreshToken={refreshToken} />

        <Dialog open={showReport} onOpenChange={setShowReport}>
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle className="sr-only">
                Relatório de Produção
              </DialogTitle>
            </DialogHeader>
            <ProductionReport onClose={() => setShowReport(false)} />
          </DialogContent>
        </Dialog>

        <Dialog open={showPrint} onOpenChange={setShowPrint}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="sr-only">Etiquetas</DialogTitle>
            </DialogHeader>
            <ThermalPrintManager />
          </DialogContent>
        </Dialog>

        <Dialog open={showNewTask} onOpenChange={setShowNewTask}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="sr-only">
                Nova Tarefa de Produção
              </DialogTitle>
            </DialogHeader>
            <NewProductionTask
              onClose={() => setShowNewTask(false)}
              onSaved={() => setRefreshToken((value) => value + 1)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
