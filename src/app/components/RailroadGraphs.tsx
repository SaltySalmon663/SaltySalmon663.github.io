import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { FinancialRecord } from "./FinancialHistory";
import { LocomotiveStatus } from "./LocomotiveMaintenance";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { BarChart2, Package, DollarSign, TrendingUp, TrendingDown, Train } from "lucide-react";

interface Industry {
  id: string;
  name: string;
  inventory: number;
  maxInventory: number;
  consumptionRate: number;
  reorderThreshold: number;
  carOrderSize: number;
  needsReorder: boolean;
}

interface RailroadGraphsProps {
  financialRecords: FinancialRecord[];
  locomotives: LocomotiveStatus[];
  industries: Industry[];
}

const COLORS = ["#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed", "#0891b2", "#db2777", "#059669"];

function parseDelivery(description: string): { count: number; carType: string; industry: string } | null {
  const match = description.match(/^Delivered (\d+)x (.+) to (.+)$/);
  if (!match) return null;
  return { count: parseInt(match[1]), carType: match[2], industry: match[3] };
}

function categorizeExpense(description: string): { label: string; key: string } {
  const lower = description.toLowerCase();
  if (lower.includes("operating session")) return { label: "Operating Sessions", key: "operating" };
  if (lower.includes("background maintenance")) return { label: "Background Upkeep", key: "background" };
  if (lower.includes("maintenance")) return { label: "Loco Maintenance", key: "maintenance" };
  return { label: "Other", key: "other" };
}

function shortenIndustry(name: string): string {
  return name
    .replace("Harrison & Sons Mfg", "H&S Mfg")
    .replace("Brauman Paper Co.", "Brauman Paper")
    .replace("Sturbridge Coal Tipple", "Coal Tipple")
    .replace("Sturbridge Transload", "Transload")
    .replace("Johnson Lumber", "Johnson Lumber");
}

export function RailroadGraphs({ financialRecords, locomotives, industries }: RailroadGraphsProps) {
  const deliveryRecords = financialRecords.filter(
    (r) => r.type === "income" && r.description.startsWith("Delivered ")
  );
  const expenseRecords = financialRecords.filter((r) => r.type === "expense");

  const totalCarsDelivered = deliveryRecords.reduce((sum, r) => {
    const p = parseDelivery(r.description);
    return sum + (p?.count ?? 0);
  }, 0);

  const totalIncome = financialRecords
    .filter((r) => r.type === "income")
    .reduce((sum, r) => sum + r.amount, 0);
  const totalExpenses = expenseRecords.reduce((sum, r) => sum + r.amount, 0);
  const netPL = totalIncome - totalExpenses;

  // Deliveries by car type
  const byTypeMap = new Map<string, { count: number; revenue: number }>();
  deliveryRecords.forEach((r) => {
    const p = parseDelivery(r.description);
    if (!p) return;
    const existing = byTypeMap.get(p.carType) ?? { count: 0, revenue: 0 };
    byTypeMap.set(p.carType, { count: existing.count + p.count, revenue: existing.revenue + r.amount });
  });
  const deliveriesByType = Array.from(byTypeMap.entries()).map(([type, v]) => ({ type, ...v }));

  // Deliveries by industry
  const byIndustryMap = new Map<string, { count: number; revenue: number }>();
  deliveryRecords.forEach((r) => {
    const p = parseDelivery(r.description);
    if (!p) return;
    const key = shortenIndustry(p.industry);
    const existing = byIndustryMap.get(key) ?? { count: 0, revenue: 0 };
    byIndustryMap.set(key, { count: existing.count + p.count, revenue: existing.revenue + r.amount });
  });
  const deliveriesByIndustry = Array.from(byIndustryMap.entries()).map(([industry, v]) => ({
    industry,
    ...v,
  }));

  // Costs by category
  const byCategoryMap = new Map<string, { label: string; amount: number }>();
  expenseRecords.forEach((r) => {
    const cat = categorizeExpense(r.description);
    const existing = byCategoryMap.get(cat.key) ?? { label: cat.label, amount: 0 };
    byCategoryMap.set(cat.key, { label: cat.label, amount: existing.amount + r.amount });
  });
  const costsByCategory = Array.from(byCategoryMap.values());

  // Daily aggregation — last 30 days
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentRecords = financialRecords.filter((r) => r.timestamp >= thirtyDaysAgo);

  const dailyMap = new Map<string, { timestamp: number; income: number; expenses: number }>();
  recentRecords.forEach((r) => {
    const d = new Date(r.timestamp);
    d.setHours(0, 0, 0, 0);
    const key = d.toLocaleDateString([], { month: "short", day: "numeric" });
    const existing = dailyMap.get(key) ?? { timestamp: d.getTime(), income: 0, expenses: 0 };
    if (r.type === "income") existing.income += r.amount;
    else existing.expenses += r.amount;
    dailyMap.set(key, existing);
  });
  const dailyData = Array.from(dailyMap.entries())
    .map(([day, v]) => ({ day, ...v }))
    .sort((a, b) => a.timestamp - b.timestamp);

  // Daily car deliveries — last 30 days
  const dailyDeliveryMap = new Map<string, { timestamp: number; cars: number }>();
  deliveryRecords
    .filter((r) => r.timestamp >= thirtyDaysAgo)
    .forEach((r) => {
      const p = parseDelivery(r.description);
      if (!p) return;
      const d = new Date(r.timestamp);
      d.setHours(0, 0, 0, 0);
      const key = d.toLocaleDateString([], { month: "short", day: "numeric" });
      const existing = dailyDeliveryMap.get(key) ?? { timestamp: d.getTime(), cars: 0 };
      dailyDeliveryMap.set(key, { timestamp: existing.timestamp, cars: existing.cars + p.count });
    });
  const dailyDeliveries = Array.from(dailyDeliveryMap.entries())
    .map(([day, v]) => ({ day, ...v }))
    .sort((a, b) => a.timestamp - b.timestamp);

  const locoChartData = locomotives.map((l) => ({
    name: l.name.replace("NH ", "").replace(" & ", "/"),
    condition: Math.round(l.condition),
  }));

  const industryChartData = industries.map((ind) => ({
    name: shortenIndustry(ind.name),
    current: Math.round(ind.inventory),
    max: ind.maxInventory,
    threshold: ind.reorderThreshold,
  }));

  const hasDeliveries = deliveryRecords.length > 0;
  const hasExpenses = expenseRecords.length > 0;

  return (
    <div className="space-y-5">
      {/* KPI Summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Package className="h-3 w-3" /> Cars Delivered
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {totalCarsDelivered}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Total Revenue
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              ${totalIncome.toFixed(0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <TrendingDown className="h-3 w-3" /> Total Expenses
            </div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              ${totalExpenses.toFixed(0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <DollarSign className="h-3 w-3" /> Net P&amp;L
            </div>
            <div
              className={`text-2xl font-bold ${
                netPL >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {netPL >= 0 ? "+" : ""}${netPL.toFixed(0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deliveries by Car Type — Pie */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Package className="h-4 w-4" />
            Car Deliveries by Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasDeliveries ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={deliveriesByType}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                  >
                    {deliveriesByType.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [v, "Cars"]} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1">
                {deliveriesByType.map((d, i) => (
                  <div key={d.type} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      {d.type}
                    </span>
                    <span className="text-muted-foreground">
                      {d.count} cars · ${d.revenue.toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState label="No deliveries logged yet" />
          )}
        </CardContent>
      </Card>

      {/* Deliveries by Industry */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            Cars Delivered by Industry
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasDeliveries ? (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart
                data={deliveriesByIndustry}
                layout="vertical"
                margin={{ left: 0, right: 20, top: 4, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  dataKey="industry"
                  type="category"
                  tick={{ fontSize: 10 }}
                  width={100}
                />
                <Tooltip formatter={(v: number) => [v, "Cars"]} />
                <Bar dataKey="count" fill={COLORS[0]} name="Cars Delivered" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label="No deliveries logged yet" />
          )}
        </CardContent>
      </Card>

      {/* Revenue by Industry */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Delivery Revenue by Industry
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasDeliveries ? (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart
                data={deliveriesByIndustry}
                layout="vertical"
                margin={{ left: 0, right: 20, top: 4, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `$${v}`}
                />
                <YAxis
                  dataKey="industry"
                  type="category"
                  tick={{ fontSize: 10 }}
                  width={100}
                />
                <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, "Revenue"]} />
                <Bar dataKey="revenue" fill={COLORS[1]} name="Revenue ($)" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label="No deliveries logged yet" />
          )}
        </CardContent>
      </Card>

      {/* Cost Breakdown — Pie */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Expense Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasExpenses ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={costsByCategory}
                    dataKey="amount"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                  >
                    {costsByCategory.map((_, i) => (
                      <Cell key={i} fill={COLORS[(i + 3) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, "Amount"]} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1">
                {costsByCategory.map((d, i) => (
                  <div key={d.label} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: COLORS[(i + 3) % COLORS.length] }}
                      />
                      {d.label}
                    </span>
                    <span className="text-muted-foreground font-medium">
                      ${d.amount.toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState label="No expense data yet" />
          )}
        </CardContent>
      </Card>

      {/* Daily Revenue vs Expenses */}
      {dailyData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Daily Revenue vs Expenses (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dailyData} margin={{ left: 0, right: 8, top: 4, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10 }}
                  angle={-40}
                  textAnchor="end"
                  interval={0}
                  height={50}
                />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} width={52} />
                <Tooltip
                  formatter={(v: number, name: string) => [
                    `$${v.toFixed(2)}`,
                    name === "income" ? "Revenue" : "Expenses",
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="income" fill={COLORS[1]} name="Revenue" radius={[3, 3, 0, 0]} />
                <Bar dataKey="expenses" fill={COLORS[3]} name="Expenses" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Cars Delivered Per Day */}
      {dailyDeliveries.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cars Delivered Per Day (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyDeliveries} margin={{ left: 0, right: 8, top: 4, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10 }}
                  angle={-40}
                  textAnchor="end"
                  interval={0}
                  height={50}
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={30} />
                <Tooltip formatter={(v: number) => [v, "Cars"]} />
                <Bar dataKey="cars" fill={COLORS[0]} name="Cars Delivered" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Locomotive Condition */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Train className="h-4 w-4" />
            Locomotive Condition
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart
              data={locoChartData}
              layout="vertical"
              margin={{ left: 0, right: 20, top: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={80} />
              <Tooltip formatter={(v: number) => [`${v}%`, "Condition"]} />
              <Bar dataKey="condition" name="Condition" radius={[0, 3, 3, 0]}>
                {locoChartData.map((d, i) => (
                  <Cell
                    key={i}
                    fill={
                      d.condition >= 70
                        ? COLORS[1]
                        : d.condition >= 40
                        ? COLORS[2]
                        : COLORS[3]
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground justify-center">
            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-green-600" /> Good ≥70%</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-600" /> Fair 40–70%</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-red-600" /> Critical &lt;40%</span>
          </div>
        </CardContent>
      </Card>

      {/* Industry Inventory Levels */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Industry Inventory Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={industryChartData}
              layout="vertical"
              margin={{ left: 0, right: 20, top: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={90} />
              <Tooltip />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="max" fill="#e2e8f0" name="Capacity" radius={[0, 3, 3, 0]} />
              <Bar dataKey="current" fill={COLORS[4]} name="Current Stock" radius={[0, 3, 3, 0]} />
              <Bar dataKey="threshold" fill={COLORS[3]} name="Reorder Threshold" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-1.5">
            {industryChartData.map((d) => {
              const pct = Math.round((d.current / d.max) * 100);
              const low = d.current <= d.threshold;
              return (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <span className={low ? "text-red-600 dark:text-red-400 font-medium" : ""}>
                    {low ? "⚠ " : ""}{d.name}
                  </span>
                  <span className="text-muted-foreground">
                    {d.current}/{d.max} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="h-28 flex items-center justify-center text-muted-foreground text-sm">
      {label}
    </div>
  );
}
