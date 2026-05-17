import { Card, CardContent } from "./ui/card";
import { AlertCircle, Clock } from "lucide-react";

interface BackgroundCostAlertProps {
  backgroundCostsEnabled: boolean;
  balance: number;
  lastActivityTime: number;
}

export function BackgroundCostAlert({ backgroundCostsEnabled, balance, lastActivityTime }: BackgroundCostAlertProps) {
  if (!backgroundCostsEnabled) {
    return null;
  }

  const hoursSinceActivity = (Date.now() - lastActivityTime) / (1000 * 60 * 60);
  const backgroundCostPerHour = 50;
  const hoursUntilBankrupt = balance / backgroundCostPerHour;

  // Only show if balance is getting low
  if (balance < 2000) {
    return (
      <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
            <div className="flex-1 space-y-1">
              <h4 className="font-medium text-sm text-orange-900 dark:text-orange-100">
                Background Costs Active
              </h4>
              <p className="text-xs text-orange-800 dark:text-orange-200">
                Your railroad is accumulating maintenance costs at $50/hour while offline.
                {hoursUntilBankrupt < 24 && (
                  <span className="font-bold block mt-1">
                    ⚠️ You have approximately {hoursUntilBankrupt.toFixed(1)} hours until bankruptcy!
                  </span>
                )}
              </p>
              <div className="flex items-center gap-2 text-xs text-orange-700 dark:text-orange-300 mt-2">
                <Clock className="h-3 w-3" />
                <span>Run trains or make deliveries to stay profitable</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
