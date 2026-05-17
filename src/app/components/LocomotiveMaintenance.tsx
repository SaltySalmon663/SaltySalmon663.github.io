import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Wrench, AlertCircle, Clock, DollarSign, AlertTriangle } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

export interface LocomotiveStatus {
  id: string;
  name: string;
  model: string;
  status: 'available' | 'maintenance' | 'needs_maintenance';
  condition: number; // 0-100, 100 is perfect
  maintenanceStartTime?: number;
  maintenanceDuration?: number;
  maintenanceCost?: number;
  maintenanceType?: 'minor' | 'major';
}

interface LocomotiveMaintenanceProps {
  locomotives: LocomotiveStatus[];
  onStartMaintenance: (id: string) => void;
  onCompleteMaintenance: (id: string) => void;
  balance: number;
}

const getMaintenanceInfo = (condition: number) => {
  // Ensure condition is a valid number
  const validCondition = isNaN(condition) || condition === undefined ? 100 : Math.max(0, Math.min(100, condition));

  if (validCondition >= 70) {
    // Minor maintenance
    const severity = (100 - validCondition) / 30; // 0 to 1
    const baseCost = 300;
    const baseTime = 15; // minutes

    return {
      type: 'minor' as const,
      cost: Math.round(baseCost + (severity * 200)),
      duration: Math.round(baseTime + (severity * 15)) * 60 * 1000, // convert to ms
      description: 'Minor service required'
    };
  } else if (validCondition >= 40) {
    // Major maintenance
    const severity = (70 - validCondition) / 30; // 0 to 1
    const baseCost = 800;
    const baseTime = 45; // minutes

    return {
      type: 'major' as const,
      cost: Math.round(baseCost + (severity * 400)),
      duration: Math.round(baseTime + (severity * 45)) * 60 * 1000,
      description: 'Major overhaul needed'
    };
  } else {
    // Critical maintenance
    const severity = Math.max(0, (40 - validCondition) / 40); // 0 to 1
    const baseCost = 1500;
    const baseTime = 90; // minutes

    return {
      type: 'major' as const,
      cost: Math.round(baseCost + (severity * 1000)),
      duration: Math.round(baseTime + (severity * 90)) * 60 * 1000,
      description: 'CRITICAL - Complete rebuild'
    };
  }
};

export function LocomotiveMaintenance({
  locomotives,
  onStartMaintenance,
  onCompleteMaintenance,
  balance
}: LocomotiveMaintenanceProps) {
  const [selectedLoco, setSelectedLoco] = useState<LocomotiveStatus | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleStartMaintenanceClick = (loco: LocomotiveStatus) => {
    setSelectedLoco(loco);
    setDialogOpen(true);
  };

  const handleConfirmMaintenance = () => {
    if (!selectedLoco) return;

    const maintenanceInfo = getMaintenanceInfo(selectedLoco.condition);

    if (balance < maintenanceInfo.cost) {
      alert("Insufficient funds for maintenance!");
      return;
    }

    onStartMaintenance(selectedLoco.id);
    setDialogOpen(false);
    setSelectedLoco(null);
  };

  const getMaintenanceProgress = (loco: LocomotiveStatus) => {
    if (loco.status !== 'maintenance' || !loco.maintenanceStartTime || !loco.maintenanceDuration) {
      return 0;
    }

    const elapsed = currentTime - loco.maintenanceStartTime;
    const progress = (elapsed / loco.maintenanceDuration) * 100;
    return Math.min(progress, 100);
  };

  const getTimeRemaining = (loco: LocomotiveStatus) => {
    if (loco.status !== 'maintenance' || !loco.maintenanceStartTime || !loco.maintenanceDuration) {
      return '';
    }

    const elapsed = currentTime - loco.maintenanceStartTime;
    const remaining = Math.max(0, loco.maintenanceDuration - elapsed);

    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    if (minutes === 0 && seconds === 0) {
      return 'Complete';
    }

    if (minutes > 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    }

    return `${minutes}m ${seconds}s`;
  };

  const isMaintenanceComplete = (loco: LocomotiveStatus) => {
    if (loco.status !== 'maintenance' || !loco.maintenanceStartTime || !loco.maintenanceDuration) {
      return false;
    }
    return currentTime >= loco.maintenanceStartTime + loco.maintenanceDuration;
  };

  const getConditionColor = (condition: number) => {
    if (condition >= 70) return 'text-green-600 dark:text-green-400';
    if (condition >= 40) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getConditionBadge = (condition: number) => {
    if (condition >= 80) return { label: 'Excellent', variant: 'default' as const };
    if (condition >= 70) return { label: 'Good', variant: 'secondary' as const };
    if (condition >= 50) return { label: 'Fair', variant: 'secondary' as const };
    if (condition >= 30) return { label: 'Poor', variant: 'destructive' as const };
    return { label: 'Critical', variant: 'destructive' as const };
  };

  const availableLocos = locomotives.filter(l => l.status === 'available');
  const needsMaintenanceLocos = locomotives.filter(l => l.status === 'needs_maintenance');
  const inMaintenanceLocos = locomotives.filter(l => l.status === 'maintenance');

  const maintenanceInfo = selectedLoco ? getMaintenanceInfo(selectedLoco.condition) : null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Locomotive Maintenance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
              <div className="text-xs text-muted-foreground mb-1">Available</div>
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {availableLocos.length}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20">
              <div className="text-xs text-muted-foreground mb-1">Needs Service</div>
              <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                {needsMaintenanceLocos.length}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <div className="text-xs text-muted-foreground mb-1">In Shop</div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {inMaintenanceLocos.length}
              </div>
            </div>
          </div>

          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {locomotives.map((loco) => {
                const locoCondition = loco.condition !== undefined ? loco.condition : 100;
                const conditionBadge = getConditionBadge(locoCondition);
                const maintenanceInfo = getMaintenanceInfo(locoCondition);

                return (
                  <div key={loco.id} className="p-4 rounded-lg border bg-card space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{loco.name}</div>
                        <div className="text-sm text-muted-foreground">{loco.model}</div>
                      </div>
                      <Badge
                        variant={
                          loco.status === 'available'
                            ? conditionBadge.variant
                            : loco.status === 'maintenance'
                            ? 'secondary'
                            : 'destructive'
                        }
                        className={
                          loco.status === 'maintenance'
                            ? 'bg-blue-500 text-white'
                            : loco.status === 'needs_maintenance'
                            ? 'bg-red-500 text-white'
                            : ''
                        }
                      >
                        {loco.status === 'available'
                          ? conditionBadge.label
                          : loco.status === 'maintenance'
                          ? 'In Shop'
                          : 'NEEDS SERVICE'}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Condition</span>
                        <span className={`font-medium ${getConditionColor(locoCondition)}`}>
                          {locoCondition}%
                        </span>
                      </div>
                      <Progress
                        value={locoCondition}
                        className={
                          locoCondition >= 70
                            ? '[&>div]:bg-green-500'
                            : locoCondition >= 40
                            ? '[&>div]:bg-amber-500'
                            : '[&>div]:bg-red-500'
                        }
                      />
                    </div>

                    {loco.status === 'maintenance' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Time Remaining
                          </span>
                          <span className="font-medium">{getTimeRemaining(loco)}</span>
                        </div>
                        <Progress value={getMaintenanceProgress(loco)} />
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {loco.maintenanceType === 'minor' ? 'Minor Service' : 'Major Overhaul'}
                          </span>
                          <span className="text-muted-foreground">
                            Cost: ${loco.maintenanceCost?.toFixed(2)}
                          </span>
                        </div>

                        {isMaintenanceComplete(loco) && (
                          <Button
                            onClick={() => onCompleteMaintenance(loco.id)}
                            className="w-full"
                            variant="default"
                          >
                            Return to Service
                          </Button>
                        )}
                      </div>
                    )}

                    {(loco.status === 'available' || loco.status === 'needs_maintenance') && (
                      <div className="space-y-2">
                        {locoCondition < 70 && (
                          <div className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                            locoCondition < 40
                              ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300'
                              : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300'
                          }`}>
                            <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                            <span>{maintenanceInfo.description}</span>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2 rounded bg-muted">
                            <div className="text-muted-foreground mb-1">Estimated Cost</div>
                            <div className="font-medium">${maintenanceInfo.cost}</div>
                          </div>
                          <div className="p-2 rounded bg-muted">
                            <div className="text-muted-foreground mb-1">Estimated Time</div>
                            <div className="font-medium">
                              {Math.round(maintenanceInfo.duration / 60000)}m
                            </div>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleStartMaintenanceClick(loco)}
                          className="w-full"
                          variant={loco.status === 'needs_maintenance' ? 'destructive' : 'outline'}
                          disabled={loco.status === 'needs_maintenance' && balance < maintenanceInfo.cost}
                        >
                          <Wrench className="h-4 w-4 mr-2" />
                          {loco.status === 'needs_maintenance' ? 'Repair Now (Required)' : 'Schedule Service'}
                        </Button>

                        {loco.status === 'needs_maintenance' && balance < maintenanceInfo.cost && (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 text-xs text-destructive">
                            <AlertCircle className="h-3 w-3 flex-shrink-0" />
                            <span>Insufficient funds for repairs</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Maintenance</DialogTitle>
            <DialogDescription>
              {selectedLoco && `${selectedLoco.name} will be out of service during maintenance.`}
            </DialogDescription>
          </DialogHeader>

          {maintenanceInfo && selectedLoco && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-muted space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Current Condition</span>
                  <span className={`font-bold ${getConditionColor(selectedLoco.condition)}`}>
                    {selectedLoco.condition}%
                  </span>
                </div>
                <Progress value={selectedLoco.condition} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border">
                  <div className="text-xs text-muted-foreground mb-1">Service Type</div>
                  <div className="font-medium capitalize">{maintenanceInfo.type}</div>
                </div>
                <div className="p-3 rounded-lg border">
                  <div className="text-xs text-muted-foreground mb-1">Duration</div>
                  <div className="font-medium">{Math.round(maintenanceInfo.duration / 60000)} minutes</div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total Cost</span>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-xl font-bold">{maintenanceInfo.cost}</span>
                  </div>
                </div>
              </div>

              {balance < maintenanceInfo.cost && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <p className="text-sm text-destructive">
                    Insufficient funds (Balance: ${balance.toFixed(2)})
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmMaintenance}
              disabled={!maintenanceInfo || balance < maintenanceInfo.cost}
            >
              {maintenanceInfo && (
                <>
                  <Wrench className="h-4 w-4 mr-2" />
                  Pay ${maintenanceInfo.cost} & Start
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { getMaintenanceInfo };
