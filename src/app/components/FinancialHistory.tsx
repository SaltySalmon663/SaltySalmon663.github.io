import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { History, TrendingUp, TrendingDown, Clock } from "lucide-react";

export interface FinancialRecord {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  timestamp: number;
}

interface FinancialHistoryProps {
  records: FinancialRecord[];
}

export function FinancialHistory({ records }: FinancialHistoryProps) {
  const sortedRecords = [...records].sort((a, b) => b.timestamp - a.timestamp);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Financial History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {sortedRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No financial activity yet. Start operating to see your history!
            </div>
          ) : (
            <div className="space-y-2">
              {sortedRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {record.type === 'income' ? (
                      <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950/30">
                        <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950/30">
                        <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{record.description}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {formatDate(record.timestamp)}
                      </div>
                    </div>
                  </div>
                  <div className={`font-bold ml-3 flex-shrink-0 ${record.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {record.type === 'income' ? '+' : '-'}${record.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
