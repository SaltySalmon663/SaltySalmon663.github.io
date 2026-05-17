import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Train, Package } from "lucide-react";
import { LocomotiveConditionIndicator } from "./LocomotiveConditionIndicator";
import { LocomotiveStatus } from "./LocomotiveMaintenance";

interface Car {
  id: string;
  type: string;
  roadName: string;
  number: string;
  location: string;
}

const INITIAL_CARS: Car[] = [
  // Passenger
  { id: 'p1', type: 'Passenger', roadName: 'Silver', number: 'Streamlined 1', location: 'Yard' },
  { id: 'p2', type: 'Passenger', roadName: 'Silver', number: 'Streamlined 2', location: 'Yard' },
  { id: 'p3', type: 'Passenger', roadName: 'Silver', number: 'Streamlined 3', location: 'Yard' },
  { id: 'p4', type: 'Passenger', roadName: 'Pullman', number: 'Pass 1', location: 'Yard' },
  { id: 'p5', type: 'Passenger', roadName: 'Pullman', number: 'Pass 2', location: 'Yard' },
  { id: 'p6', type: 'Passenger', roadName: 'Pullman', number: 'Baggage', location: 'Yard' },
  { id: 'p7', type: 'Passenger', roadName: 'Pullman', number: 'Observation', location: 'Yard' },
  // Hoppers
  { id: 'h1', type: 'Hopper', roadName: 'UP', number: '62040-1', location: 'Yard' },
  { id: 'h2', type: 'Hopper', roadName: 'UP', number: '62040-2', location: 'Yard' },
  { id: 'h3', type: 'Hopper', roadName: 'PC', number: '258602', location: 'Yard' },
  // Flatcars
  { id: 'f1', type: 'Flatcar', roadName: 'B&M', number: '5311', location: 'Yard' },
  // Tankcars
  { id: 't1', type: 'Tankcar', roadName: 'GTAX', number: '39617', location: 'Yard' },
  { id: 't2', type: 'Tankcar', roadName: 'PROX', number: '84925', location: 'Yard' },
  // Boxcars
  { id: 'b1', type: 'Boxcar', roadName: 'D&RGW', number: '39497', location: 'Yard' },
  { id: 'b2', type: 'Boxcar', roadName: 'SRLX', number: '4226', location: 'Yard' },
  { id: 'b3', type: 'Boxcar', roadName: 'UP', number: '187872', location: 'Yard' },
  { id: 'b4', type: 'Boxcar', roadName: 'NP', number: '25591', location: 'Yard' },
  { id: 'b5', type: 'Boxcar', roadName: 'B&O', number: '466097', location: 'Yard' },
  { id: 'b6', type: 'Boxcar', roadName: 'NH', number: '30564', location: 'Yard' },
  { id: 'b7', type: 'Boxcar', roadName: 'NH', number: '30562', location: 'Yard' },
  { id: 'b8', type: 'Boxcar', roadName: 'RI', number: '262953', location: 'Yard' },
  { id: 'b9', type: 'Boxcar', roadName: 'RI', number: '24064', location: 'Yard' },
  { id: 'b10', type: 'Boxcar', roadName: 'B&O', number: '274389', location: 'Yard' },
  { id: 'b11', type: 'Boxcar', roadName: 'PRR', number: '78137', location: 'Yard' },
  { id: 'b12', type: 'Boxcar', roadName: 'GTW', number: '583699', location: 'Yard' },
  { id: 'b13', type: 'Boxcar', roadName: 'PRR', number: '175263', location: 'Yard' },
  { id: 'b14', type: 'Boxcar', roadName: 'B&O', number: '381798', location: 'Yard' }
];

interface RollingStockManagerProps {
  locomotives: LocomotiveStatus[];
}

export function RollingStockManager({ locomotives }: RollingStockManagerProps) {
  const cars: Car[] = INITIAL_CARS;

  const carsByType = cars.reduce((acc, car) => {
    if (!acc[car.type]) acc[car.type] = [];
    acc[car.type].push(car);
    return acc;
  }, {} as Record<string, Car[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Train className="h-5 w-5" />
          Rolling Stock
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="locomotives" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="locomotives">Locomotives ({locomotives.length})</TabsTrigger>
            <TabsTrigger value="cars">Cars ({cars.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="locomotives" className="space-y-3 mt-4">
            {locomotives.map((loco) => (
              <div key={loco.id} className="p-3 rounded-lg border bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{loco.name}</div>
                    <div className="text-sm text-muted-foreground">{loco.model}</div>
                  </div>
                  <Badge
                    variant={
                      loco.status === 'available'
                        ? 'default'
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
                      ? 'Available'
                      : loco.status === 'maintenance'
                      ? 'In Shop'
                      : 'Needs Service'}
                  </Badge>
                </div>
                <LocomotiveConditionIndicator condition={loco.condition} compact />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="cars" className="space-y-4 mt-4">
            {Object.entries(carsByType).map(([type, typeCars]) => (
              <div key={type}>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {type}s ({typeCars.length})
                </h4>
                <div className="space-y-2 ml-6">
                  {typeCars.map((car) => (
                    <div key={car.id} className="flex items-center justify-between text-sm p-2 rounded border">
                      <span>{car.roadName} {car.number}</span>
                      <Badge variant="outline" className="text-xs">{car.location}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
