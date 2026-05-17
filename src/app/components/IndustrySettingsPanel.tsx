import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Cog, Zap } from "lucide-react";

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

interface IndustrySettingsPanelProps {
  industries: Industry[];
  onUpdateIndustry: (industryId: string, updates: Partial<Industry>) => void;
  onTestConsumption: () => void;
}

export function IndustrySettingsPanel({
  industries,
  onUpdateIndustry,
  onTestConsumption
}: IndustrySettingsPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cog className="h-5 w-5" />
          Industry Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Test Inventory Consumption</span>
            <Button onClick={onTestConsumption} size="sm" variant="outline">
              <Zap className="h-4 w-4 mr-2" />
              Simulate 1 Hour
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Instantly consume 1 hour of inventory to test the system
          </p>
        </div>

        <div className="space-y-3">
          {industries.map((industry) => (
            <div key={industry.id} className="p-4 rounded-lg border bg-card space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">{industry.name}</h4>
                <Button
                  onClick={() => setEditingId(editingId === industry.id ? null : industry.id)}
                  size="sm"
                  variant="ghost"
                >
                  {editingId === industry.id ? 'Done' : 'Edit'}
                </Button>
              </div>

              {editingId === industry.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Consumption Rate (units/hr)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        value={industry.consumptionRate}
                        onChange={(e) =>
                          onUpdateIndustry(industry.id, {
                            consumptionRate: parseFloat(e.target.value) || 0
                          })
                        }
                        className="h-8 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Max Inventory</Label>
                      <Input
                        type="number"
                        min="1"
                        value={industry.maxInventory}
                        onChange={(e) =>
                          onUpdateIndustry(industry.id, {
                            maxInventory: parseInt(e.target.value) || 1
                          })
                        }
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Reorder Threshold</Label>
                      <Input
                        type="number"
                        min="0"
                        value={industry.reorderThreshold}
                        onChange={(e) =>
                          onUpdateIndustry(industry.id, {
                            reorderThreshold: parseInt(e.target.value) || 0
                          })
                        }
                        className="h-8 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Car Order Size</Label>
                      <Input
                        type="number"
                        min="1"
                        max="5"
                        value={industry.carOrderSize}
                        onChange={(e) =>
                          onUpdateIndustry(industry.id, {
                            carOrderSize: parseInt(e.target.value) || 1
                          })
                        }
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Current Inventory</Label>
                    <Input
                      type="number"
                      min="0"
                      max={industry.maxInventory}
                      value={Math.round(industry.inventory)}
                      onChange={(e) =>
                        onUpdateIndustry(industry.id, {
                          inventory: parseInt(e.target.value) || 0
                        })
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Consumption:</span>
                    <span className="ml-1 font-medium">{industry.consumptionRate} units/hr</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Inventory:</span>
                    <span className="ml-1 font-medium">{industry.inventory.toFixed(1)}/{industry.maxInventory}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Reorder at:</span>
                    <span className="ml-1 font-medium">{industry.reorderThreshold}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Order size:</span>
                    <span className="ml-1 font-medium">{industry.carOrderSize} car(s)</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
