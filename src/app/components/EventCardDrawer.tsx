import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Shuffle, CloudRain, Users, Zap } from "lucide-react";

interface EventCard {
  id: string;
  type: 'weather' | 'traffic' | 'passenger';
  severity?: string;
  title: string;
  description: string;
}

const WEATHER_EVENTS: EventCard[] = [
  { id: 'w1', type: 'weather', severity: 'Mild', title: 'Chilly Morning', description: 'The first industry switched must be the closest one to warm up the locomotive.' },
  { id: 'w2', type: 'weather', severity: 'Mild', title: 'Humid Conditions', description: 'The first industry switched must be Brauman Paper Co. to prevent damage to stored materials and paper.' },
  { id: 'w3', type: 'weather', severity: 'Moderate', title: 'Passing Rain Squall', description: 'Outdoor unloading is interrupted. First outdoor industry visited cannot unload this session.' },
  { id: 'w4', type: 'weather', severity: 'Heavy', title: 'Strong Windstorm', description: 'Light empty cars must be placed toward the center of the train.' },
  { id: 'w5', type: 'weather', severity: 'Winter', title: 'Fresh Snow Cover', description: 'Coal deliveries increase. Coal Tipple becomes priority service and must be served first.' },
  { id: 'w6', type: 'weather', severity: 'Severe', title: 'Major Thunderstorm', description: 'One random industry track is blocked by fallen debris. A crane and flatcar must be spotted to clear before operations continue.' }
];

const TRAFFIC_EVENTS: EventCard[] = [
  { id: 't1', type: 'traffic', title: 'Chemical Oversupply', description: 'If Brauman currently has 1 or more tank car spotted, generate no new tank car orders regardless of need.' },
  { id: 't2', type: 'traffic', title: 'Locomotive Inspection', description: 'Spot the RDC Budd Car to the Ridgefield locomotive works.' },
  { id: 't3', type: 'traffic', title: 'Bulk Equipment Import', description: 'Sturbridge Transload requires one flat car and crane this session.' },
  { id: 't4', type: 'traffic', title: 'Scrap Metal Cleaning', description: 'Spot a high priority hopper car to the Loading bay of Harrison & Sons. If full, move a car to storage.' },
  { id: 't5', type: 'traffic', title: 'Heavy Steel Loads', description: 'Spot a crane car to the storage track of Harrison & Sons.' },
  { id: 't6', type: 'traffic', title: 'Damaged Equipment', description: 'Replace a boxcar at an industry with a new one.' },
  { id: 't7', type: 'traffic', title: 'Fragile Object Delivery', description: 'Deliver a box car to Sturbridge Transload. Boxcar must be delivered in a single car train.' },
  { id: 't8', type: 'traffic', title: 'Track Work', description: 'Spot a crane car and locomotive to the Ridgefield Bridge and switch two industries before returning to yard.' }
];

const PASSENGER_EVENTS: EventCard[] = [
  { id: 'p1', type: 'passenger', title: 'Weekend Excursion', description: 'Run a passenger train with at least 3 coaches between stations.' },
  { id: 'p2', type: 'passenger', title: 'Business Special', description: 'Spot the Pullman Observation car to Queensware Station.' },
  { id: 'p3', type: 'passenger', title: 'Mail Contract', description: 'Add the baggage car to next scheduled passenger run.' }
];

interface EventCardDrawerProps {
  onDrawCard: (card: EventCard) => void;
}

export function EventCardDrawer({ onDrawCard }: EventCardDrawerProps) {
  const [drawnCard, setDrawnCard] = useState<EventCard | null>(null);

  const drawRandomCard = () => {
    const allCards = [...WEATHER_EVENTS, ...TRAFFIC_EVENTS, ...PASSENGER_EVENTS];
    const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
    setDrawnCard(randomCard);
    onDrawCard(randomCard);
  };

  const getCardIcon = (type: string) => {
    switch (type) {
      case 'weather': return <CloudRain className="h-4 w-4" />;
      case 'traffic': return <Zap className="h-4 w-4" />;
      case 'passenger': return <Users className="h-4 w-4" />;
      default: return null;
    }
  };

  const getCardColor = (type: string) => {
    switch (type) {
      case 'weather': return 'bg-blue-100 dark:bg-blue-950/30';
      case 'traffic': return 'bg-amber-100 dark:bg-amber-950/30';
      case 'passenger': return 'bg-purple-100 dark:bg-purple-950/30';
      default: return 'bg-muted';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shuffle className="h-5 w-5" />
          Event Card
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={drawRandomCard} className="w-full" variant="outline">
          <Shuffle className="h-4 w-4 mr-2" />
          Draw Random Event Card
        </Button>

        {drawnCard && (
          <div className={`p-4 rounded-lg ${getCardColor(drawnCard.type)} border-2`}>
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {getCardIcon(drawnCard.type)}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-medium">{drawnCard.title}</h4>
                  <Badge variant="secondary" className="capitalize">
                    {drawnCard.type}
                  </Badge>
                  {drawnCard.severity && (
                    <Badge variant="outline">{drawnCard.severity}</Badge>
                  )}
                </div>
                <p className="text-sm">{drawnCard.description}</p>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground text-center">
          {WEATHER_EVENTS.length} weather • {TRAFFIC_EVENTS.length} traffic • {PASSENGER_EVENTS.length} passenger
        </div>
      </CardContent>
    </Card>
  );
}
