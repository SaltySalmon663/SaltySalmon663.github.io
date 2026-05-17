import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { AlertTriangle, Wrench } from "lucide-react";

interface LocomotiveConditionIndicatorProps {
  condition: number;
  showProgress?: boolean;
  compact?: boolean;
}

export function LocomotiveConditionIndicator({
  condition,
  showProgress = true,
  compact = false
}: LocomotiveConditionIndicatorProps) {
  const validCondition = condition !== undefined ? condition : 100;

  const getConditionColor = (cond: number) => {
    if (cond >= 70) return 'text-green-600 dark:text-green-400';
    if (cond >= 40) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getConditionBadge = (cond: number) => {
    if (cond >= 80) return { label: 'Excellent', variant: 'default' as const };
    if (cond >= 70) return { label: 'Good', variant: 'secondary' as const };
    if (cond >= 50) return { label: 'Fair', variant: 'secondary' as const };
    if (cond >= 30) return { label: 'Poor', variant: 'destructive' as const };
    return { label: 'Critical', variant: 'destructive' as const };
  };

  const conditionBadge = getConditionBadge(validCondition);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {validCondition < 70 && <AlertTriangle className="h-3 w-3 text-amber-500" />}
        <span className={`text-sm font-medium ${getConditionColor(validCondition)}`}>
          {validCondition}%
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Condition</span>
          {validCondition < 30 && (
            <Badge variant="destructive" className="text-xs">
              <Wrench className="h-3 w-3 mr-1" />
              Needs Service
            </Badge>
          )}
        </div>
        <span className={`font-medium ${getConditionColor(validCondition)}`}>
          {validCondition}%
        </span>
      </div>
      {showProgress && (
        <Progress
          value={validCondition}
          className={
            validCondition >= 70
              ? '[&>div]:bg-green-500'
              : validCondition >= 40
              ? '[&>div]:bg-amber-500'
              : '[&>div]:bg-red-500'
          }
        />
      )}
    </div>
  );
}
