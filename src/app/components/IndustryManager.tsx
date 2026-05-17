import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Factory, AlertCircle, TrendingDown } from "lucide-react";

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

interface IndustryManagerProps {
  industries: Industry[];
}

export function IndustryManager({ industries }: IndustryManagerProps) {
  const getInventoryPercentage = (industry: Industry) => {
    return (industry.inventory / industry.maxInventory) * 100;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Factory className="h-5 w-5" />
          Industries
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {industries.map((industry) => (
          <div key={industry.id} className="p-4 rounded-lg border bg-card space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium">{industry.name}</h4>
                <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                  <TrendingDown className="h-3 w-3" />
                  {industry.consumptionRate} units/hour
                </div>
              </div>
              {industry.needsReorder && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Need {industry.carOrderSize} car{industry.carOrderSize > 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Inventory</span>
                <span>{industry.inventory.toFixed(1)}/{industry.maxInventory}</span>
              </div>
              <Progress
                value={getInventoryPercentage(industry)}
                className={industry.needsReorder ? "[&>div]:bg-destructive" : ""}
              />
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Reorder threshold</span>
                <span className="text-orange-600 dark:text-orange-400">{industry.reorderThreshold} units</span>
              </div>
            </div>

            {industry.needsReorder && (
              <div className="p-2 rounded-lg bg-destructive/10 text-xs text-destructive">
                ⚠️ Deliver {industry.carOrderSize} car{industry.carOrderSize > 1 ? 's' : ''} to restock (+{industry.carOrderSize * 10} units)
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
