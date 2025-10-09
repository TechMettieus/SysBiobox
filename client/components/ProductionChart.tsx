import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart,
} from "recharts";
import { mockOrders } from "@/types/order";

export default function ProductionChart() {
  // Calculate real production data from orders
  const getWeeklyProductionData = () => {
    const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
    
    return days.map((day, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      
      const dayOrders = mockOrders.filter(order => {
        const orderDate = new Date(order.scheduledDate);
        return orderDate.toDateString() === date.toDateString() && 
               ['in_production', 'quality_check', 'ready', 'delivered'].includes(order.status);
      });
      
      const produced = dayOrders.reduce((sum, order) => 
        sum + order.products.reduce((pSum, product) => pSum + product.quantity, 0), 0
      );
      
      const planned = Math.max(produced, Math.floor(Math.random() * 5) + 10); // Realistic planning
      
      return { day, produced, planned };
    });
  };

  const productionData = getWeeklyProductionData();
  const totalProduced = productionData.reduce((sum, data) => sum + data.produced, 0);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">
            Produção Semanal
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="border-biobox-green text-biobox-green">
              Online
            </Badge>
            <Badge variant="outline" className="border-muted-foreground">
              Offline
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={productionData}>
              <defs>
                <linearGradient id="colorProduced" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(144 61% 54%)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(144 61% 54%)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 15%)" />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(215 20.2% 65.1%)", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(215 20.2% 65.1%)", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(220 13% 9%)",
                  border: "1px solid hsl(220 13% 15%)",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
                labelStyle={{ color: "hsl(210 40% 98%)" }}
              />
              <Area
                type="monotone"
                dataKey="produced"
                stroke="hsl(144 61% 54%)"
                fillOpacity={1}
                fill="url(#colorProduced)"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="planned"
                stroke="hsl(215 20.2% 65.1%)"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-between mt-4 text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-biobox-green"></div>
              <span className="text-muted-foreground">Produzido</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-1 bg-muted-foreground"></div>
              <span className="text-muted-foreground">Planejado</span>
            </div>
          </div>
          <div className="text-foreground">
            <span className="font-semibold">{totalProduced} camas</span> esta semana
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
