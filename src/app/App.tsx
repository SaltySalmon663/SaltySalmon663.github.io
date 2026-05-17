import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { RealtimeFinanceDashboard } from "./components/RealtimeFinanceDashboard";
import { OperatingSession, LOCOMOTIVES, Locomotive } from "./components/OperatingSession";
import { ManualDeliveryInput, CAR_TYPES } from "./components/ManualDeliveryInput";
import { FinancialHistory, FinancialRecord } from "./components/FinancialHistory";
import { RollingStockManager } from "./components/RollingStockManager";
import { IndustryManager } from "./components/IndustryManager";
import { EventCardDrawer } from "./components/EventCardDrawer";
import { LocomotiveMaintenance, LocomotiveStatus, getMaintenanceInfo } from "./components/LocomotiveMaintenance";
import { Home, DollarSign, Train, Factory, Clock, Wrench, Settings, BarChart2 } from "lucide-react";
import { SettingsPanel } from "./components/SettingsPanel";
import { FinanceHistoryChart } from "./components/FinanceHistoryChart";
import { BackgroundCostAlert } from "./components/BackgroundCostAlert";
import { IndustrySettingsPanel } from "./components/IndustrySettingsPanel";
import { RailroadGraphs } from "./components/RailroadGraphs";
import { projectId, publicAnonKey } from "../../utils/supabase/info";

const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server-34c1f11a`;

const INITIAL_INDUSTRIES: Industry[] = [
  {
    id: '1',
    name: 'Johnson Lumber',
    inventory: 35,
    maxInventory: 50,
    consumptionRate: 2, // 2 units/hour
    reorderThreshold: 20,
    carOrderSize: 2,
    needsReorder: false
  },
  {
    id: '2',
    name: 'Harrison & Sons Mfg',
    inventory: 28,
    maxInventory: 40,
    consumptionRate: 1.5,
    reorderThreshold: 20,
    carOrderSize: 2,
    needsReorder: false
  },
  {
    id: '3',
    name: 'Brauman Paper Co.',
    inventory: 65,
    maxInventory: 90,
    consumptionRate: 3,
    reorderThreshold: 20,
    carOrderSize: 3,
    needsReorder: false
  },
  {
    id: '4',
    name: 'Sturbridge Coal Tipple',
    inventory: 15,
    maxInventory: 20,
    consumptionRate: 0.8,
    reorderThreshold: 20,
    carOrderSize: 1,
    needsReorder: false
  },
  {
    id: '5',
    name: 'Sturbridge Transload',
    inventory: 22,
    maxInventory: 40,
    consumptionRate: 1.2,
    reorderThreshold: 20,
    carOrderSize: 2,
    needsReorder: false
  }
];

interface Industry {
  id: string;
  name: string;
  inventory: number;
  maxInventory: number;
  consumptionRate: number; // units per hour
  reorderThreshold: number;
  carOrderSize: number; // 1-3 cars
  needsReorder: boolean;
  lastReorderNotification?: number;
}

interface AppData {
  balance: number;
  totalIncome: number;
  totalExpenses: number;
  sessionCount: number;
  financialRecords: FinancialRecord[];
  locomotives: LocomotiveStatus[];
  industries: Industry[];
  lastActivityTime: number;
  userEmail?: string;
  userPhone?: string;
  notificationsEnabled: boolean;
  backgroundCostsEnabled: boolean;
  industryNotificationsEnabled: boolean;
  lastIndustryNotification?: number;
}

export default function App() {
  const [appData, setAppData] = useState<AppData>({
    balance: 10000,
    totalIncome: 0,
    totalExpenses: 0,
    sessionCount: 0,
    financialRecords: [],
    locomotives: LOCOMOTIVES.map(l => ({
      id: l.id,
      name: l.name,
      model: l.model,
      status: 'available' as const,
      condition: 100
    })),
    industries: INITIAL_INDUSTRIES,
    lastActivityTime: Date.now(),
    notificationsEnabled: false,
    backgroundCostsEnabled: true,
    industryNotificationsEnabled: true
  });

  const [isLoading, setIsLoading] = useState(true);

  const [isOperating, setIsOperating] = useState(false);
  const [activeLocos, setActiveLocos] = useState<Locomotive[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentSessionCost, setCurrentSessionCost] = useState(0);
  const [timeMultiplier, setTimeMultiplier] = useState(1);

  // Load data from database on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch(`${SERVER_URL}/data`, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to load data');
        }

        const data = await response.json();

        // Ensure locomotives have proper structure
        const migratedLocomotives = data.locomotives.length > 0
          ? data.locomotives.map((l: any) => ({
              ...l,
              condition: l.condition !== undefined ? l.condition : 100,
              status: l.condition !== undefined && l.condition < 30 ? 'needs_maintenance' : (l.status || 'available')
            }))
          : LOCOMOTIVES.map(l => ({
              id: l.id,
              name: l.name,
              model: l.model,
              status: 'available' as const,
              condition: 100
            }));

        // Migrate old data to include new fields
        const migratedData = {
          ...data,
          locomotives: migratedLocomotives,
          industries: data.industries && data.industries.length > 0 ? data.industries : INITIAL_INDUSTRIES,
          lastActivityTime: data.lastActivityTime || Date.now(),
          notificationsEnabled: data.notificationsEnabled !== undefined ? data.notificationsEnabled : false,
          backgroundCostsEnabled: data.backgroundCostsEnabled !== undefined ? data.backgroundCostsEnabled : true,
          industryNotificationsEnabled: data.industryNotificationsEnabled !== undefined ? data.industryNotificationsEnabled : true
        };

        // Calculate background costs and industry consumption if enabled
        if (migratedData.backgroundCostsEnabled && migratedData.lastActivityTime) {
          const hoursSinceLastActivity = (Date.now() - migratedData.lastActivityTime) / (1000 * 60 * 60);

          // Background costs: $50/hour for railroad maintenance and upkeep
          const backgroundCostPerHour = 50;
          const backgroundCosts = hoursSinceLastActivity * backgroundCostPerHour;

          if (backgroundCosts > 0) {
            migratedData.balance -= backgroundCosts;
            migratedData.totalExpenses += backgroundCosts;
            migratedData.financialRecords = [
              ...migratedData.financialRecords,
              {
                id: `bg-${Date.now()}`,
                type: 'expense',
                description: `Background maintenance costs (${hoursSinceLastActivity.toFixed(1)} hours offline)`,
                amount: backgroundCosts,
                timestamp: Date.now()
              }
            ];
          }

          // Process industry inventory consumption
          migratedData.industries = migratedData.industries.map(industry => {
            const consumed = hoursSinceLastActivity * industry.consumptionRate;
            const newInventory = Math.max(0, industry.inventory - consumed);
            const needsReorder = newInventory < industry.reorderThreshold;

            return {
              ...industry,
              inventory: newInventory,
              needsReorder
            };
          });

          // Show alert if user was away for more than 1 hour
          if (hoursSinceLastActivity > 1) {
            const industriesNeedingReorder = migratedData.industries.filter(i => i.needsReorder);
            let alertMessage = `Welcome back! While you were away for ${hoursSinceLastActivity.toFixed(1)} hours:\n\n`;
            alertMessage += `• Railroad accumulated $${backgroundCosts.toFixed(2)} in maintenance costs\n`;
            alertMessage += `• Industries consumed inventory\n`;

            if (industriesNeedingReorder.length > 0) {
              alertMessage += `\n⚠️ ${industriesNeedingReorder.length} industry(s) need reorders:\n`;
              industriesNeedingReorder.forEach(ind => {
                alertMessage += `  - ${ind.name} (${ind.inventory.toFixed(0)}/${ind.maxInventory} units)\n`;
              });
            }

            setTimeout(() => {
              alert(alertMessage);
            }, 500);
          }
        }

        setAppData(migratedData);
      } catch (error) {
        console.log(`Error loading app data from database: ${error}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Save data to database whenever it changes
  useEffect(() => {
    if (isLoading) return; // Don't save during initial load

    const saveData = async () => {
      try {
        // Update last activity time before saving
        const dataToSave = {
          ...appData,
          lastActivityTime: Date.now()
        };

        const response = await fetch(`${SERVER_URL}/data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify(dataToSave)
        });

        if (!response.ok) {
          throw new Error('Failed to save data');
        }
      } catch (error) {
        console.log(`Error saving app data to database: ${error}`);
      }
    };

    saveData();
  }, [appData, isLoading]);

  // Real-time industry inventory consumption
  useEffect(() => {
    if (!appData.backgroundCostsEnabled) return;

    const interval = setInterval(() => {
      setAppData(prev => {
        const updatedIndustries = prev.industries.map(industry => {
          // Consume inventory based on rate (per hour, so divide by 3600 for per-second, then multiply by 10 for 10-second intervals)
          const consumptionPerTick = (industry.consumptionRate / 3600) * 10;
          const newInventory = Math.max(0, industry.inventory - consumptionPerTick);
          const needsReorder = newInventory < industry.reorderThreshold;

          return {
            ...industry,
            inventory: newInventory,
            needsReorder
          };
        });

        return {
          ...prev,
          industries: updatedIndustries
        };
      });
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [appData.backgroundCostsEnabled]);

  // Check for low balance or critical conditions and send notifications
  useEffect(() => {
    if (isLoading || !appData.notificationsEnabled) return;

    const checkAndNotify = async () => {
      // Check if balance is critically low
      if (appData.balance < 500) {
        await sendNotification('Low Balance Alert', `Your railroad balance is critically low: $${appData.balance.toFixed(2)}. Run trains to earn income!`);
      }

      // Check if any locomotives need maintenance
      const needsMaintenance = appData.locomotives.filter(l => l.condition < 30);
      if (needsMaintenance.length > 0) {
        await sendNotification('Locomotive Maintenance Required', `${needsMaintenance.length} locomotive(s) need maintenance.`);
      }

      // Check for industries needing reorders
      const industriesNeedingReorder = appData.industries.filter(industry => {
        const needsNotification = industry.needsReorder &&
          (!industry.lastReorderNotification ||
            (Date.now() - industry.lastReorderNotification) > 60 * 60 * 1000); // Only notify once per hour
        return needsNotification;
      });

      if (industriesNeedingReorder.length > 0) {
        for (const industry of industriesNeedingReorder) {
          await sendNotification(
            'Industry Reorder Required',
            `${industry.name} inventory is low (${industry.inventory.toFixed(0)} units). They need ${industry.carOrderSize} car(s) delivered!`,
            'alert'
          );

          // Update last notification time
          setAppData(prev => ({
            ...prev,
            industries: prev.industries.map(i =>
              i.id === industry.id
                ? { ...i, lastReorderNotification: Date.now() }
                : i
            )
          }));
        }
      }
    };

    // Check every 5 minutes
    const interval = setInterval(checkAndNotify, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [appData.balance, appData.locomotives, appData.industries, appData.notificationsEnabled, isLoading]);

  const sendNotification = async (title: string, message: string, type: 'alert' | 'industry' = 'alert') => {
    try {
      const payload: any = {
        subject: `New Haven Railroad - ${title}`,
        message
      };

      if (appData.userEmail) {
        payload.email = appData.userEmail;
      }

      if (appData.userPhone) {
        payload.phone = appData.userPhone;
      }

      // Send notification to server (handles email and SMS)
      if (payload.email || payload.phone) {
        await fetch(`${SERVER_URL}/notify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify(payload)
        });
      }

      // Try browser push notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body: message,
          icon: '/train-icon.png',
          tag: type === 'industry' ? 'industry-order' : 'alert'
        });
      }
    } catch (error) {
      console.log(`Error sending notification: ${error}`);
    }
  };

  const sendTestNotification = async () => {
    await sendNotification('Test Notification', 'This is a test notification from your New Haven Railroad. All systems working!');
  };

  // Random industry order notifications
  useEffect(() => {
    if (!appData.industryNotificationsEnabled || !appData.notificationsEnabled) return;

    const industries = [
      'Johnson Lumber',
      'Harrison & Sons Mfg',
      'Brauman Paper Co.',
      'Sturbridge Coal Tipple',
      'Sturbridge Transload'
    ];

    const sendRandomIndustryNotification = () => {
      const randomIndustry = industries[Math.floor(Math.random() * industries.length)];
      const messages = [
        `${randomIndustry} is ready for a new order! Pull a card to see what they need.`,
        `New shipment ready at ${randomIndustry}. Check the card deck for details.`,
        `${randomIndustry} has inventory to ship. Draw a card to get the order.`,
        `Incoming order from ${randomIndustry}! Time to pull a physical card.`
      ];

      const randomMessage = messages[Math.floor(Math.random() * messages.length)];

      sendNotification('New Industry Order', randomMessage, 'industry');

      setAppData(prev => ({
        ...prev,
        lastIndustryNotification: Date.now()
      }));
    };

    // Send notifications at random intervals between 30 minutes and 3 hours
    const scheduleNext = () => {
      const minDelay = 30 * 60 * 1000; // 30 minutes
      const maxDelay = 3 * 60 * 60 * 1000; // 3 hours
      const randomDelay = Math.random() * (maxDelay - minDelay) + minDelay;

      return setTimeout(() => {
        sendRandomIndustryNotification();
        scheduleNext();
      }, randomDelay);
    };

    const timeout = scheduleNext();
    return () => clearTimeout(timeout);
  }, [appData.industryNotificationsEnabled, appData.notificationsEnabled]);

  // Timer for operating session
  useEffect(() => {
    let interval: number | undefined;

    if (isOperating && activeLocos.length > 0) {
      interval = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000 * timeMultiplier);
        setElapsedTime(elapsed);

        const hours = elapsed / 3600;
        const totalCostPerHour = activeLocos.reduce((sum, loco) =>
          sum + loco.fuelCostPerHour + loco.crewCostPerHour + loco.maintenanceCostPerHour, 0
        );
        const cost = hours * totalCostPerHour;
        setCurrentSessionCost(cost);
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOperating, activeLocos, sessionStartTime, timeMultiplier]);

  const handleStartSession = (locomotiveIds: string[]) => {
    const locos = LOCOMOTIVES.filter(l => locomotiveIds.includes(l.id));
    if (locos.length > 0) {
      setActiveLocos(locos);
      setIsOperating(true);
      setSessionStartTime(Date.now());
      setElapsedTime(0);
      setCurrentSessionCost(0);
    }
  };

  const handleStopSession = () => {
    if (activeLocos.length > 0 && currentSessionCost > 0) {
      const locoNames = activeLocos.map(l => l.name).join(', ');
      const newRecord: FinancialRecord = {
        id: Date.now().toString(),
        type: 'expense',
        description: `Operating session with ${activeLocos.length} loco${activeLocos.length > 1 ? 's' : ''}: ${locoNames} (${Math.floor(elapsedTime / 60)}m)`,
        amount: currentSessionCost,
        timestamp: Date.now()
      };

      // Calculate condition degradation based on session length
      const hoursOperated = elapsedTime / 3600;
      const degradationPerHour = 8 + Math.random() * 4; // 8-12% per hour
      const totalDegradation = Math.min(hoursOperated * degradationPerHour, 30); // Cap at 30% per session

      const activeLocoIds = new Set(activeLocos.map(l => l.id));

      setAppData(prev => ({
        ...prev,
        balance: prev.balance - currentSessionCost,
        totalExpenses: prev.totalExpenses + currentSessionCost,
        sessionCount: prev.sessionCount + 1,
        financialRecords: [...prev.financialRecords, newRecord],
        locomotives: prev.locomotives.map(l => {
          if (activeLocoIds.has(l.id)) {
            const newCondition = Math.max(0, l.condition - totalDegradation);
            const needsMaintenance = newCondition < 30;
            return {
              ...l,
              condition: newCondition,
              status: needsMaintenance ? 'needs_maintenance' as const : l.status
            };
          }
          return l;
        })
      }));
    }

    setIsOperating(false);
    setActiveLocos([]);
    setElapsedTime(0);
    setCurrentSessionCost(0);
  };

  const handleSubmitDeliveries = (deliveries: Array<{ carType: string; carCount: number; industry: string }>) => {
    let totalPayment = 0;
    const records: FinancialRecord[] = [];

    deliveries.forEach((delivery) => {
      const carTypeData = CAR_TYPES.find(ct => ct.value === delivery.carType);
      if (!carTypeData) return;

      const payment = carTypeData.payment * delivery.carCount;
      totalPayment += payment;

      records.push({
        id: `${Date.now()}-${Math.random()}`,
        type: 'income',
        description: `Delivered ${delivery.carCount}x ${delivery.carType} to ${delivery.industry}`,
        amount: payment,
        timestamp: Date.now()
      });
    });

    setAppData(prev => ({
      ...prev,
      balance: prev.balance + totalPayment,
      totalIncome: prev.totalIncome + totalPayment,
      financialRecords: [...prev.financialRecords, ...records],
      // Update industry inventory: +5 units per car delivered
      industries: prev.industries.map(industry => {
        const relevantDelivery = deliveries.find(d => d.industry === industry.name);
        if (relevantDelivery) {
          const inventoryIncrease = relevantDelivery.carCount * 10;
          const newInventory = Math.min(industry.maxInventory, industry.inventory + inventoryIncrease);
          return {
            ...industry,
            inventory: newInventory,
            needsReorder: newInventory < industry.reorderThreshold
          };
        }
        return industry;
      })
    }));
  };

  const handleStartMaintenance = (locomotiveId: string) => {
    const locomotive = appData.locomotives.find(l => l.id === locomotiveId);
    if (!locomotive) return;

    const maintenanceInfo = getMaintenanceInfo(locomotive.condition);

    const newRecord: FinancialRecord = {
      id: Date.now().toString(),
      type: 'expense',
      description: `${maintenanceInfo.type === 'minor' ? 'Minor' : 'Major'} maintenance for ${locomotive.name}`,
      amount: maintenanceInfo.cost,
      timestamp: Date.now()
    };

    setAppData(prev => ({
      ...prev,
      balance: prev.balance - maintenanceInfo.cost,
      totalExpenses: prev.totalExpenses + maintenanceInfo.cost,
      locomotives: prev.locomotives.map(l =>
        l.id === locomotiveId
          ? {
              ...l,
              status: 'maintenance' as const,
              maintenanceStartTime: Date.now(),
              maintenanceDuration: maintenanceInfo.duration,
              maintenanceCost: maintenanceInfo.cost,
              maintenanceType: maintenanceInfo.type
            }
          : l
      ),
      financialRecords: [...prev.financialRecords, newRecord]
    }));
  };

  const handleCompleteMaintenance = (locomotiveId: string) => {
    setAppData(prev => ({
      ...prev,
      locomotives: prev.locomotives.map(l =>
        l.id === locomotiveId
          ? {
              ...l,
              status: 'available' as const,
              condition: 100, // Restored to perfect condition
              maintenanceStartTime: undefined,
              maintenanceDuration: undefined,
              maintenanceCost: undefined,
              maintenanceType: undefined
            }
          : l
      )
    }));
  };
  

  const handleDrawCard = () => {
    // Event cards are just for session variety, don't affect session count
  };

  const availableLocomotiveIds = appData.locomotives
    .filter(l => l.status === 'available' && l.condition >= 30)
    .map(l => l.id);

  const handleResetData = async () => {
    const defaultData = {
      balance: 10000,
      totalIncome: 0,
      totalExpenses: 0,
      sessionCount: 0,
      financialRecords: [],
      locomotives: LOCOMOTIVES.map(l => ({
        id: l.id,
        name: l.name,
        model: l.model,
        status: 'available' as const,
        condition: 100
      })),
      industries: INITIAL_INDUSTRIES,
      lastActivityTime: Date.now(),
      userEmail: appData.userEmail,
      userPhone: appData.userPhone,
      notificationsEnabled: appData.notificationsEnabled,
      backgroundCostsEnabled: appData.backgroundCostsEnabled,
      industryNotificationsEnabled: appData.industryNotificationsEnabled
    };

    try {
      await fetch(`${SERVER_URL}/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(defaultData)
      });

      window.location.reload();
    } catch (error) {
      console.log(`Error resetting data: ${error}`);
    }
  };

  const handleUpdateSettings = (settings: Partial<AppData>) => {
    setAppData(prev => ({
      ...prev,
      ...settings
    }));
  };

  const handleUpdateIndustry = (industryId: string, updates: Partial<Industry>) => {
    setAppData(prev => ({
      ...prev,
      industries: prev.industries.map(industry =>
        industry.id === industryId
          ? {
              ...industry,
              ...updates,
              needsReorder: (updates.inventory !== undefined ? updates.inventory : industry.inventory) < industry.reorderThreshold
            }
          : industry
      )
    }));
  };

  const handleTestConsumption = () => {
    setAppData(prev => ({
      ...prev,
      industries: prev.industries.map(industry => {
        // Simulate 1 hour of consumption
        const consumed = industry.consumptionRate;
        const newInventory = Math.max(0, industry.inventory - consumed);
        return {
          ...industry,
          inventory: newInventory,
          needsReorder: newInventory < industry.reorderThreshold
        };
      })
    }));
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification('Notifications Enabled', {
          body: 'You will now receive alerts about your railroad!'
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Train className="h-12 w-12 mx-auto animate-pulse" />
          <p className="text-muted-foreground">Loading railroad data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2 pt-4">
          <h1 className="flex items-center justify-center gap-2">
            <Train className="h-6 w-6" />
            New Haven Railroad
          </h1>
          <p className="text-muted-foreground">Finance Manager</p>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-8 mb-6 h-auto">
            <TabsTrigger value="dashboard" className="flex flex-col gap-1 p-2">
              <Home className="h-4 w-4" />
              <span className="text-xs">Home</span>
            </TabsTrigger>
            <TabsTrigger value="operations" className="flex flex-col gap-1 p-2">
              <Clock className="h-4 w-4" />
              <span className="text-xs">Operate</span>
            </TabsTrigger>
            <TabsTrigger value="deliveries" className="flex flex-col gap-1 p-2">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs">Deliver</span>
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="flex flex-col gap-1 p-2">
              <Wrench className="h-4 w-4" />
              <span className="text-xs">Maint.</span>
            </TabsTrigger>
            <TabsTrigger value="rolling-stock" className="flex flex-col gap-1 p-2">
              <Train className="h-4 w-4" />
              <span className="text-xs">Stock</span>
            </TabsTrigger>
            <TabsTrigger value="industries" className="flex flex-col gap-1 p-2">
              <Factory className="h-4 w-4" />
              <span className="text-xs">Industry</span>
            </TabsTrigger>
            <TabsTrigger value="graphs" className="flex flex-col gap-1 p-2">
              <BarChart2 className="h-4 w-4" />
              <span className="text-xs">Graphs</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex flex-col gap-1 p-2">
              <Settings className="h-4 w-4" />
              <span className="text-xs">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <RealtimeFinanceDashboard
              balance={appData.balance}
              totalIncome={appData.totalIncome}
              totalExpenses={appData.totalExpenses}
              sessionCount={appData.sessionCount}
              isOperating={isOperating}
              currentSessionCost={currentSessionCost}
            />
            <BackgroundCostAlert
              backgroundCostsEnabled={appData.backgroundCostsEnabled}
              balance={appData.balance}
              lastActivityTime={appData.lastActivityTime}
            />
            <FinanceHistoryChart records={appData.financialRecords} />
            <EventCardDrawer onDrawCard={handleDrawCard} />
            <FinancialHistory records={appData.financialRecords.slice(-15)} />
          </TabsContent>

          <TabsContent value="operations" className="space-y-6">
            <OperatingSession
              isActive={isOperating}
              onStart={handleStartSession}
              onStop={handleStopSession}
              elapsedTime={elapsedTime}
              activeLocos={activeLocos}
              activeLocoConditions={new Map(
                activeLocos.map(loco => [
                  loco.id,
                  appData.locomotives.find(l => l.id === loco.id)?.condition || 100
                ])
              )}
              currentCost={currentSessionCost}
              availableLocomotives={availableLocomotiveIds}
            />
            <IndustryManager industries={appData.industries} />
          </TabsContent>

          <TabsContent value="deliveries" className="space-y-6">
            <ManualDeliveryInput onSubmitDeliveries={handleSubmitDeliveries} />
            <FinancialHistory records={appData.financialRecords.filter(r => r.type === 'income').slice(-10)} />
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-6">
            <LocomotiveMaintenance
              locomotives={appData.locomotives}
              onStartMaintenance={handleStartMaintenance}
              onCompleteMaintenance={handleCompleteMaintenance}
              balance={appData.balance}
            />
          </TabsContent>

          <TabsContent value="rolling-stock">
            <RollingStockManager locomotives={appData.locomotives} />
          </TabsContent>

          <TabsContent value="industries">
            <IndustrySettingsPanel
              industries={appData.industries}
              onUpdateIndustry={handleUpdateIndustry}
              onTestConsumption={handleTestConsumption}
            />
          </TabsContent>

          <TabsContent value="graphs">
            <RailroadGraphs
              financialRecords={appData.financialRecords}
              locomotives={appData.locomotives}
              industries={appData.industries}
            />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsPanel
              onResetData={handleResetData}
              balance={appData.balance}
              sessionCount={appData.sessionCount}
              timeMultiplier={timeMultiplier}
              onTimeMultiplierChange={setTimeMultiplier}
              userEmail={appData.userEmail}
              userPhone={appData.userPhone}
              notificationsEnabled={appData.notificationsEnabled}
              backgroundCostsEnabled={appData.backgroundCostsEnabled}
              industryNotificationsEnabled={appData.industryNotificationsEnabled}
              onUpdateSettings={handleUpdateSettings}
              onRequestNotificationPermission={requestNotificationPermission}
              onSendTestNotification={sendTestNotification}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}