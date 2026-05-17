import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Play, Pause, Clock, Fuel, Users, AlertCircle } from "lucide-react";
import { Checkbox } from "./ui/checkbox";
import { LocomotiveConditionIndicator } from "./LocomotiveConditionIndicator";

interface Locomotive {
  id: string;
  name: string;
  model: string;
  fuelCostPerHour: number;
  crewCostPerHour: number;
  maintenanceCostPerHour: number;
}

const LOCOMOTIVES: Locomotive[] = [
  { id: '1', name: 'NH 0703 DER-1', model: 'DER-1', fuelCostPerHour: 200, crewCostPerHour: 35, maintenanceCostPerHour: 15 },
  { id: '2', name: 'NH 370 & 371 A-B', model: 'A-B Units', fuelCostPerHour: 1, crewCostPerHour: 35, maintenanceCostPerHour: 25 },
  { id: '3', name: 'NH 1404 & 1405 RS-11s', model: 'RS-11s', fuelCostPerHour: 180, crewCostPerHour: 35, maintenanceCostPerHour: 22 },
  { id: '4', name: 'NH 503 RS-1', model: 'RS-1', fuelCostPerHour: 80, crewCostPerHour: 35, maintenanceCostPerHour: 12 },
  { id: '5', name: 'NH 0937 S-1', model: 'S-1', fuelCostPerHour: 118, crewCostPerHour: 35, maintenanceCostPerHour: 10 },
  { id: '6', name: 'NH RDC BUDD', model: 'BUDD Car', fuelCostPerHour: 150, crewCostPerHour: 25, maintenanceCostPerHour: 8 }
];

interface OperatingSessionProps {
  isActive: boolean;
  onStart: (locomotiveIds: string[]) => void;
  onStop: () => void;
  elapsedTime: number;
  activeLocos: Locomotive[];
  activeLocoConditions: Map<string, number>;
  currentCost: number;
  availableLocomotives: string[];
}

export function OperatingSession({ isActive, onStart, onStop, elapsedTime, activeLocos, activeLocoConditions, currentCost, availableLocomotives }: OperatingSessionProps) {
  const availableLocos = LOCOMOTIVES.filter(l => availableLocomotives.includes(l.id));
  const [selectedLocoIds, setSelectedLocoIds] = useState<string[]>([]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (selectedLocoIds.length > 0) {
      onStart(selectedLocoIds);
    }
  };

  const toggleLocoSelection = (locoId: string) => {
    setSelectedLocoIds(prev =>
      prev.includes(locoId)
        ? prev.filter(id => id !== locoId)
        : [...prev, locoId]
    );
  };

  const getTotalCostPerHour = (loco: Locomotive) => {
    return loco.fuelCostPerHour + loco.crewCostPerHour + loco.maintenanceCostPerHour;
  };

  const getSelectedTotalCost = () => {
    return selectedLocoIds.reduce((total, id) => {
      const loco = LOCOMOTIVES.find(l => l.id === id);
      return total + (loco ? getTotalCostPerHour(loco) : 0);
    }, 0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Operating Session
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isActive ? (
          <>
            {availableLocos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No locomotives available</p>
                <p className="text-sm mt-1">All locomotives are in maintenance</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <label className="text-sm font-medium">Select Locomotives ({selectedLocoIds.length} selected)</label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {availableLocos.map((loco) => (
                      <div
                        key={loco.id}
                        className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent cursor-pointer"
                        onClick={() => toggleLocoSelection(loco.id)}
                      >
                        <Checkbox
                          checked={selectedLocoIds.includes(loco.id)}
                          onCheckedChange={() => toggleLocoSelection(loco.id)}
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{loco.name}</div>
                          <div className="text-xs text-muted-foreground">${getTotalCostPerHour(loco)}/hr</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {selectedLocoIds.length > 0 && (
                    <div className="p-3 rounded-lg bg-muted">
                      <div className="flex justify-between text-sm">
                        <span>Combined cost per hour:</span>
                        <span className="font-bold">${getSelectedTotalCost()}/hr</span>
                      </div>
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleStart}
                  className="w-full"
                  size="lg"
                  disabled={selectedLocoIds.length === 0}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Operating Session
                </Button>
              </>
            )}
          </>
        ) : (
          <>
            <div className="p-4 rounded-lg bg-primary text-primary-foreground space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm opacity-90">Session Active</span>
                <Badge variant="secondary" className="bg-green-500 text-white">
                  RUNNING
                </Badge>
              </div>

              <div className="text-4xl font-bold text-center py-2">
                {formatTime(elapsedTime)}
              </div>

              {activeLocos.length > 0 && (
                <div className="text-sm opacity-90 text-center">
                  {activeLocos.length} locomotive{activeLocos.length > 1 ? 's' : ''} running
                </div>
              )}
            </div>

            {activeLocos.length > 0 && (
              <>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {activeLocos.map((loco) => (
                    <div key={loco.id} className="p-2 rounded-lg bg-muted">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{loco.name}</span>
                        <span className="text-xs text-muted-foreground">${getTotalCostPerHour(loco)}/hr</span>
                      </div>
                      <LocomotiveConditionIndicator condition={activeLocoConditions.get(loco.id) || 100} />
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="p-3 rounded-lg bg-destructive/10 border-destructive/20 border">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Session Cost</span>
                <span className="text-lg font-bold text-destructive">-${currentCost.toFixed(2)}</span>
              </div>
            </div>

            <Button onClick={onStop} className="w-full" variant="destructive" size="lg">
              <Pause className="h-4 w-4 mr-2" />
              End Operating Session
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export { LOCOMOTIVES };
export type { Locomotive };
