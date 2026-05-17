import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Play, Pause, Clock, CircleAlert as AlertCircle, Users } from "lucide-react";
import { Checkbox } from "./ui/checkbox";
import { LocomotiveConditionIndicator } from "./LocomotiveConditionIndicator";
import { computeCrewEffects, CrewAssignment, Worker } from "./CrewManager";

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
  workers: Worker[];
  crewAssignments: CrewAssignment[];
}

export function OperatingSession({
  isActive,
  onStart,
  onStop,
  elapsedTime,
  activeLocos,
  activeLocoConditions,
  currentCost,
  availableLocomotives,
  workers,
  crewAssignments,
}: OperatingSessionProps) {
  const availableLocos = LOCOMOTIVES.filter(l => availableLocomotives.includes(l.id));
  const [selectedLocoIds, setSelectedLocoIds] = useState<string[]>([]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const hasEngineer = (locoId: string) => {
    const assignment = crewAssignments.find(a => a.locoId === locoId);
    return !!assignment?.engineer;
  };

  const getEffectiveCostPerHour = (loco: Locomotive) => {
    const assignment = crewAssignments.find(a => a.locoId === loco.id);
    const effects = computeCrewEffects(workers, assignment);
    const baseFuel = loco.fuelCostPerHour * effects.fuelModifier;
    const baseOps = (loco.crewCostPerHour + loco.maintenanceCostPerHour) * effects.speedModifier * effects.crewCostModifier;
    return baseFuel + baseOps;
  };

  const getCrewLabel = (locoId: string) => {
    const assignment = crewAssignments.find(a => a.locoId === locoId);
    const effects = computeCrewEffects(workers, assignment);
    return effects.label;
  };

  const handleStart = () => {
    const readyLocos = selectedLocoIds.filter(id => hasEngineer(id));
    if (readyLocos.length > 0) {
      onStart(readyLocos);
    }
  };

  const toggleLocoSelection = (locoId: string) => {
    setSelectedLocoIds(prev =>
      prev.includes(locoId)
        ? prev.filter(id => id !== locoId)
        : [...prev, locoId]
    );
  };

  const getSelectedTotalCost = () => {
    return selectedLocoIds.reduce((total, id) => {
      const loco = LOCOMOTIVES.find(l => l.id === id);
      return total + (loco ? getEffectiveCostPerHour(loco) : 0);
    }, 0);
  };

  const selectedWithoutCrew = selectedLocoIds.filter(id => !hasEngineer(id));

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
                    {availableLocos.map((loco) => {
                      const engineerPresent = hasEngineer(loco.id);
                      const crewLabel = getCrewLabel(loco.id);
                      const effectiveCost = getEffectiveCostPerHour(loco);

                      return (
                        <div
                          key={loco.id}
                          className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            !engineerPresent
                              ? "border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/10 opacity-75"
                              : "hover:bg-accent"
                          }`}
                          onClick={() => engineerPresent && toggleLocoSelection(loco.id)}
                        >
                          <Checkbox
                            checked={selectedLocoIds.includes(loco.id)}
                            disabled={!engineerPresent}
                            onCheckedChange={() => engineerPresent && toggleLocoSelection(loco.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium">{loco.name}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground">
                                ${effectiveCost.toFixed(0)}/hr
                              </span>
                              {engineerPresent ? (
                                <Badge className="text-xs h-4 px-1 bg-green-500 text-white">
                                  {crewLabel}
                                </Badge>
                              ) : (
                                <Badge className="text-xs h-4 px-1 bg-red-500 text-white">
                                  No Engineer
                                </Badge>
                              )}
                            </div>
                          </div>
                          {!engineerPresent && (
                            <Users className="h-4 w-4 text-red-500 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {selectedLocoIds.length > 0 && (
                    <div className="p-3 rounded-lg bg-muted space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Estimated cost per hour:</span>
                        <span className="font-bold">${getSelectedTotalCost().toFixed(0)}/hr</span>
                      </div>
                      {selectedWithoutCrew.length > 0 && (
                        <div className="text-xs text-red-600 dark:text-red-400">
                          {selectedWithoutCrew.length} locomotive(s) lack an engineer and will be skipped.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {availableLocos.every(l => !hasEngineer(l.id)) && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-200">
                    <Users className="h-4 w-4 shrink-0 mt-0.5" />
                    Hire and assign Engineers in the Crew tab to operate locomotives.
                  </div>
                )}

                <Button
                  onClick={handleStart}
                  className="w-full"
                  size="lg"
                  disabled={selectedLocoIds.filter(id => hasEngineer(id)).length === 0}
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
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {activeLocos.map((loco) => {
                  const effectiveCost = getEffectiveCostPerHour(loco);
                  const crewLabel = getCrewLabel(loco.id);
                  return (
                    <div key={loco.id} className="p-2 rounded-lg bg-muted">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{loco.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge className="text-xs bg-green-500 text-white">{crewLabel}</Badge>
                          <span className="text-xs text-muted-foreground">${effectiveCost.toFixed(0)}/hr</span>
                        </div>
                      </div>
                      <LocomotiveConditionIndicator condition={activeLocoConditions.get(loco.id) || 100} />
                    </div>
                  );
                })}
              </div>
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
