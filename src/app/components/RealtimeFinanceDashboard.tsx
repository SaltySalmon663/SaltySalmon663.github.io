import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { DollarSign, TrendingUp, TrendingDown, Activity, AlertTriangle } from "lucide-react";
import { Badge } from "./ui/badge";

interface RealtimeFinanceDashboardProps {
  balance: number;
  totalIncome: number;
  totalExpenses: number;
  sessionCount: number;
  isOperating: boolean;
  currentSessionCost: number;
}

export function RealtimeFinanceDashboard({
  balance,
  totalIncome,
  totalExpenses,
  sessionCount,
  isOperating,
  currentSessionCost
}: RealtimeFinanceDashboardProps) {
  const netProfit = totalIncome - totalExpenses;
  const profitPercentage = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : 0;
  const projectedBalance = balance - currentSessionCost;

  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      <Card className={`col-span-2 ${isOperating ? 'bg-gradient-to-br from-amber-600 to-amber-700' : 'bg-gradient-to-br from-primary to-primary/80'} text-primary-foreground relative overflow-hidden`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Current Balance
            </div>
            {isOperating && (
              <Badge variant="secondary" className="bg-white/20 text-white">
                <Activity className="h-3 w-3 mr-1 animate-pulse" />
                LIVE
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            ${isOperating ? projectedBalance.toFixed(2) : balance.toFixed(2)}
          </div>
          {isOperating && (
            <div className="text-xs opacity-90 mt-1 flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />
              -${currentSessionCost.toFixed(2)} this session
            </div>
          )}
          {!isOperating && (
            <p className="text-xs opacity-80 mt-1">
              {balance >= 0 ? "Railroad is solvent" : "Operating at a deficit"}
            </p>
          )}
          {projectedBalance < 0 && isOperating && (
            <div className="text-xs mt-2 flex items-center gap-1 bg-destructive/30 px-2 py-1 rounded">
              <AlertTriangle className="h-3 w-3" />
              Warning: Balance will go negative
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-green-50 dark:bg-green-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
            Income
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold text-green-600 dark:text-green-400">
            ${totalIncome.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            From deliveries
          </div>
        </CardContent>
      </Card>

      <Card className="bg-red-50 dark:bg-red-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
            Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold text-red-600 dark:text-red-400">
            ${totalExpenses.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Operations cost
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4" />
            Net Profit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            ${netProfit.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {profitPercentage}% margin • {sessionCount} sessions completed
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
