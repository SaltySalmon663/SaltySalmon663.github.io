import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Package, Plus, Trash2 } from "lucide-react";

interface DeliveryInput {
  id: string;
  carType: string;
  carCount: number;
  industry: string;
}

interface ManualDeliveryInputProps {
  onSubmitDeliveries: (deliveries: DeliveryInput[]) => void;
}

const INDUSTRIES = [
  'Johnson Lumber',
  'Harrison & Sons Mfg',
  'Brauman Paper Co.',
  'Sturbridge Coal Tipple',
  'Sturbridge Transload'
];

const CAR_TYPES = [
  { value: 'Boxcar', payment: 150 },
  { value: 'Hopper', payment: 175 },
  { value: 'Tankcar', payment: 200 },
  { value: 'Flatcar', payment: 140 },
  { value: 'Passenger Car', payment: 250 }
];

export function ManualDeliveryInput({ onSubmitDeliveries }: ManualDeliveryInputProps) {
  const [deliveries, setDeliveries] = useState<DeliveryInput[]>([
    { id: '1', carType: '', carCount: 1, industry: '' }
  ]);

  const addDelivery = () => {
    setDeliveries([
      ...deliveries,
      { id: Date.now().toString(), carType: '', carCount: 1, industry: '' }
    ]);
  };

  const removeDelivery = (id: string) => {
    if (deliveries.length > 1) {
      setDeliveries(deliveries.filter(d => d.id !== id));
    }
  };

  const updateDelivery = (id: string, field: keyof DeliveryInput, value: string | number) => {
    setDeliveries(deliveries.map(d =>
      d.id === id ? { ...d, [field]: value } : d
    ));
  };

  const calculateTotalPayment = () => {
    return deliveries.reduce((total, delivery) => {
      if (!delivery.carType || !delivery.industry) return total;
      const carTypeData = CAR_TYPES.find(ct => ct.value === delivery.carType);
      if (!carTypeData) return total;
      return total + (carTypeData.payment * delivery.carCount);
    }, 0);
  };

  const handleSubmit = () => {
    const validDeliveries = deliveries.filter(d => d.carType && d.industry && d.carCount > 0);
    if (validDeliveries.length === 0) return;

    onSubmitDeliveries(validDeliveries);

    // Reset form
    setDeliveries([{ id: Date.now().toString(), carType: '', carCount: 1, industry: '' }]);
  };

  const isValid = deliveries.some(d => d.carType && d.industry && d.carCount > 0);
  const totalPayment = calculateTotalPayment();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Log Completed Deliveries
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {deliveries.map((delivery, index) => (
            <div key={delivery.id} className="p-4 rounded-lg border bg-card space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Delivery #{index + 1}</span>
                {deliveries.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDelivery(delivery.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Car Type</Label>
                  <Select
                    value={delivery.carType}
                    onValueChange={(value) => updateDelivery(delivery.id, 'carType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CAR_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.value} (${type.payment})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Count</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={delivery.carCount}
                    onChange={(e) => updateDelivery(delivery.id, 'carCount', parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Industry</Label>
                <Select
                  value={delivery.industry}
                  onValueChange={(value) => updateDelivery(delivery.id, 'industry', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {delivery.carType && delivery.industry && (
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  Payment: ${(CAR_TYPES.find(ct => ct.value === delivery.carType)?.payment || 0) * delivery.carCount}
                </div>
              )}
            </div>
          ))}
        </div>

        <Button
          onClick={addDelivery}
          variant="outline"
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Another Delivery
        </Button>

        {totalPayment > 0 && (
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <span className="font-medium">Total Payment</span>
              <span className="text-xl font-bold text-green-600 dark:text-green-400">
                +${totalPayment.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!isValid}
          className="w-full"
          size="lg"
        >
          <Package className="h-4 w-4 mr-2" />
          Submit Deliveries
        </Button>
      </CardContent>
    </Card>
  );
}

export { CAR_TYPES };
