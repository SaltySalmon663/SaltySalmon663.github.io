import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { FinancialRecord } from "./FinancialHistory";

interface FinanceHistoryChartProps {
  records: FinancialRecord[];
}

export function FinanceHistoryChart({ records }: FinanceHistoryChartProps) {
  const START_BALANCE = 10000;

  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  const recentRecords = records.filter(
    (r) => r.timestamp >= sevenDaysAgo
  );

  // Group hourly net change
  const grouped = recentRecords.reduce((acc, record) => {
    const date = new Date(record.timestamp);
    date.setMinutes(0, 0, 0);

    const timestamp = date.getTime();

    const delta =
      record.type === "income"
        ? record.amount
        : -record.amount;

    const existing = acc.find((d) => d.timestamp === timestamp);

    if (existing) {
      existing.net += delta;
    } else {
      acc.push({
        timestamp,
        label: date.toLocaleString([], {
          weekday: "short",
          hour: "numeric",
          hour12: true
        }),
        net: delta
      });
    }

    return acc;
  }, [] as Array<{ timestamp: number; label: string; net: number }>);

  const totalHours = 7 * 24;
  let running = START_BALANCE;

  const hourlyData = [];

  for (let i = 0; i < totalHours; i++) {
    const date = new Date(
      now - (totalHours - i - 1) * 60 * 60 * 1000
    );

    date.setMinutes(0, 0, 0);

    const timestamp = date.getTime();

    const existing = grouped.find(
      (d) => d.timestamp === timestamp
    );

    running += existing?.net ?? 0;

    hourlyData.push({
      timestamp,
      label: date.toLocaleString([], {
        weekday: "short",
        hour: "numeric",
        hour12: true
      }),
      balance: running
    });
  }

  // 📊 AUTO SCALE LOGIC
  const values = hourlyData.map((d) => d.balance);

  const min = Math.min(...values);
  const max = Math.max(...values);

  const padding = (max - min) * 0.15 || 50; // fallback padding if flat

  const yMin = min - padding;
  const yMax = max + padding;

  const finalBalance = hourlyData.at(-1)?.balance ?? START_BALANCE;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Balance (Starting $10,000)</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">

        <div className="p-3 rounded-lg bg-muted">
          <div className="text-xs text-muted-foreground mb-1">
            Current Balance
          </div>
          <div
            className={`text-lg font-bold ${
              finalBalance >= START_BALANCE
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            ${finalBalance.toFixed(2)}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={hourlyData}>

            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-muted"
            />

            <XAxis
              dataKey="label"
              tick={{ fontSize: 10 }}
              interval={23}
              angle={-35}
              textAnchor="end"
              height={60}
              className="text-muted-foreground"
            />

            {/* ✅ DYNAMIC SCALING */}
            <YAxis
              domain={[yMin, yMax]}
              tick={{ fontSize: 12 }}
            />

            <Tooltip
              labelFormatter={(label) => `Time: ${label}`}
              formatter={(value: number) =>
                `$${value.toFixed(2)}`
              }
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px"
              }}
            />

            <Legend />

            <Area
              type="monotone"
              dataKey="balance"
              stroke="hsl(210, 80%, 50%)"
              fill="hsl(210, 80%, 50%)"
              fillOpacity={0.25}
              strokeWidth={3}
              name="Balance"
            />

          </AreaChart>
        </ResponsiveContainer>

      </CardContent>
    </Card>
  );
}