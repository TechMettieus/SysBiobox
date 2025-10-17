Text file: Production.tsx
Latest content with line numbers:
2	import DashboardLayout from "@/components/DashboardLayout";
3	import ProductionDashboard from "@/components/ProductionDashboard";
4	import { Button } from "@/components/ui/button";
5	import {
6	  Dialog,
7	  DialogContent,
8	  DialogHeader,
9	  DialogTitle,
10	} from "@/components/ui/dialog";
11	import ProductionReport from "@/components/ProductionReport";
12	import ThermalPrintManager from "@/components/ThermalPrintManager";
13	import NewProductionTask from "@/components/NewProductionTask";
14	import { Play, Download, Printer } from "lucide-react";
15	
16	export default function Production() {
17	  const [showReport, setShowReport] = useState(false);
18	  const [showPrint, setShowPrint] = useState(false);
19	  const [showNewTask, setShowNewTask] = useState(false);
20	  const [refreshToken, setRefreshToken] = useState(0);
21	
22	  return (
23	    <DashboardLayout>
24	      <div className="space-y-6">
25	        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
26	          <div>
27	            <h1 className="text-2xl font-bold text-foreground">
28	              Acompanhamento de Produção
29	            </h1>
30	            <p className="text-muted-foreground">
31	              Monitore e controle o processo de fabricação em tempo real
32	            </p>
33	          </div>
34	          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
35	            <Button variant="outline" onClick={() => setShowReport(true)}>
36	              <Download className="h-4 w-4 mr-2" />
37	              Relatório
38	            </Button>
39	            <Button variant="outline" onClick={() => setShowPrint(true)}>
40	              <Printer className="h-4 w-4 mr-2" />
41	              Etiquetas
42	            </Button>
43	            <Button
44	              className="bg-biobox-green hover:bg-biobox-green-dark"
45	              onClick={() => setShowNewTask(true)}
46	            >
47	              <Play className="h-4 w-4 mr-2" />
48	              Nova Tarefa
49	            </Button>
50	          </div>
51	        </div>
52	
53	        <ProductionDashboard refreshToken={refreshToken} />
54	
55	        <Dialog open={showReport} onOpenChange={setShowReport}>
56	          <DialogContent className="max-w-5xl">
57	            <DialogHeader>
58	              <DialogTitle className="sr-only">
59	                Relatório de Produção
60	              </DialogTitle>
61	            </DialogHeader>
62	            <ProductionReport onClose={() => setShowReport(false)} />
63	          </DialogContent>
64	        </Dialog>
65	
66	        <Dialog open={showPrint} onOpenChange={setShowPrint}>
67	          <DialogContent className="max-w-4xl">
68	            <DialogHeader>
69	              <DialogTitle className="sr-only">Etiquetas</DialogTitle>
70	            </DialogHeader>
71	            <ThermalPrintManager />
72	          </DialogContent>
73	        </Dialog>
74	
75	        <Dialog open={showNewTask} onOpenChange={setShowNewTask}>
76	          <DialogContent className="max-w-2xl">
77	            <DialogHeader>
78	              <DialogTitle className="sr-only">
79	                Nova Tarefa de Produção
80	              </DialogTitle>
81	            </DialogHeader>
82	            <NewProductionTask
83	              onClose={() => setShowNewTask(false)}
84	              onSaved={() => setRefreshToken((value) => value + 1)}
85	            />
86	          </DialogContent>
87	        </Dialog>
88	      </div>
89	    </DashboardLayout>
90	  );
91	}
92	