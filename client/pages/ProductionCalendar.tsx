Text file: ProductionCalendar.tsx
Latest content with line numbers:
2	import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
3	import { Button } from "@/components/ui/button";
4	import { Badge } from "@/components/ui/badge";
5	import { Calendar } from "@/components/ui/calendar";
6	import { 
7	  ChevronLeft, 
8	  ChevronRight, 
9	  Calendar as CalendarIcon,
10	  Clock,
11	  Package,
12	  User
13	} from "lucide-react";
14	import { Order, mockOrders, statusColors, statusLabels } from "@/types/order";
15	import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns";
16	import { ptBR } from "date-fns/locale";
17	import { cn } from "@/lib/utils";
18	
19	interface ProductionCalendarProps {
20	  orders: Order[];
21	  onOrderClick?: (order: Order) => void;
22	}
23	
24	export default function ProductionCalendar({ orders, onOrderClick }: ProductionCalendarProps) {
25	  const [currentDate, setCurrentDate] = useState(new Date());
26	  const [viewMode, setViewMode] = useState<'calendar' | 'schedule'>('calendar');
27	  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
28	
29	  const monthStart = startOfMonth(currentDate);
30	  const monthEnd = endOfMonth(currentDate);
31	  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
32	
33	  const getOrdersForDate = (date: Date) => {
34	    return orders.filter(order => 
35	      isSameDay(order.scheduledDate, date) || 
36	      isSameDay(order.deliveryDate || new Date(), date)
37	    );
38	  };
39	
40	  const getSelectedDateOrders = () => {
41	    if (!selectedDate) return [];
42	    return getOrdersForDate(selectedDate);
43	  };
44	
45	  const formatCurrency = (value: number) => {
46	    return new Intl.NumberFormat('pt-BR', {
47	      style: 'currency',
48	      currency: 'BRL'
49	    }).format(value);
50	  };
51	
52	  const OrderCard = ({ order }: { order: Order }) => {
53	    const priorityIndicator = {
54	      urgent: "bg-red-500",
55	      high: "bg-orange-500",
56	      medium: "bg-blue-500",
57	      low: "bg-gray-500"
58	    };
59	
60	    return (
61	      <div
62	        className="p-3 border border-border rounded-lg hover:bg-muted/5 transition-all cursor-pointer hover:shadow-sm"
63	        onClick={() => onOrderClick?.(order)}
64	      >
65	        <div className="flex items-start justify-between mb-2">
66	          <div className="flex items-center space-x-2">
67	            <div className={cn("w-2 h-2 rounded-full", priorityIndicator[order.priority])} />
68	            <div>
69	              <div className="font-medium text-sm">{order.orderNumber}</div>
70	              <div className="text-xs text-muted-foreground truncate">{order.customerName}</div>
71	            </div>
72	          </div>
73	          <Badge
74	            variant="outline"
75	            className={cn("text-xs shrink-0", statusColors[order.status])}
76	          >
77	            {statusLabels[order.status]}
78	          </Badge>
79	        </div>
80	
81	        <div className="space-y-1">
82	          <div className="flex items-center justify-between text-xs">
83	            <div className="flex items-center text-muted-foreground">
84	              <Package className="h-3 w-3 mr-1" />
85	              <span>{order.products.length} item(s)</span>
86	            </div>
87	            <div className="font-medium">{formatCurrency(order.totalAmount)}</div>
88	          </div>
89	
90	          <div className="flex items-center text-xs text-muted-foreground">
91	            <Clock className="h-3 w-3 mr-1" />
92	            <span>
93	              {isSameDay(order.scheduledDate, selectedDate || new Date()) && "Produção "}
94	              {order.deliveryDate && isSameDay(order.deliveryDate, selectedDate || new Date()) && "Entrega "}
95	              {format(order.deliveryDate || order.scheduledDate, "dd/MM", { locale: ptBR })}
96	            </span>
97	          </div>
98	
99	          {order.assignedOperator && (
100	            <div className="flex items-center text-xs text-muted-foreground">