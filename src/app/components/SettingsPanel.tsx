import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Settings, RotateCcw, AlertTriangle, Zap, Bell, DollarSign, MessageSquare, Send } from "lucide-react";
import { Slider } from "./ui/slider";
import { Switch } from "./ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";

interface SettingsPanelProps {
  onResetData: () => void;
  balance: number;
  sessionCount: number;
  timeMultiplier: number;
  onTimeMultiplierChange: (value: number) => void;
  userEmail?: string;
  userPhone?: string;
  notificationsEnabled: boolean;
  backgroundCostsEnabled: boolean;
  industryNotificationsEnabled: boolean;
  onUpdateSettings: (settings: any) => void;
  onRequestNotificationPermission: () => void;
  onSendTestNotification: () => void;
}

export function SettingsPanel({
  onResetData,
  balance,
  sessionCount,
  timeMultiplier,
  onTimeMultiplierChange,
  userEmail,
  userPhone,
  notificationsEnabled,
  backgroundCostsEnabled,
  industryNotificationsEnabled,
  onUpdateSettings,
  onRequestNotificationPermission,
  onSendTestNotification
}: SettingsPanelProps) {
  const [emailInput, setEmailInput] = useState(userEmail || '');
  const [phoneInput, setPhoneInput] = useState(userPhone || '');

  const multiplierLabels: { [key: number]: string } = {
    0.5: '0.5x (Slow)',
    1: '1x (Normal)',
    2: '2x (Fast)',
    5: '5x (Very Fast)',
    10: '10x (Ultra Fast)'
  };

  const handleEmailSave = () => {
    onUpdateSettings({ userEmail: emailInput });
  };

  const handlePhoneSave = () => {
    onUpdateSettings({ userPhone: phoneInput });
  };

  const handleNotificationsToggle = async (enabled: boolean) => {
    if (enabled) {
      await onRequestNotificationPermission();
    }
    onUpdateSettings({ notificationsEnabled: enabled });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg bg-muted space-y-2">
          <h4 className="font-medium text-sm">Railroad Stats</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Current Balance</div>
              <div className="font-medium">${balance.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Sessions Run</div>
              <div className="font-medium">{sessionCount}</div>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-muted space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Time Speed
            </h4>
            <span className="text-sm font-medium text-primary">
              {multiplierLabels[timeMultiplier] || `${timeMultiplier}x`}
            </span>
          </div>
          <Slider
            value={[timeMultiplier]}
            onValueChange={(values) => onTimeMultiplierChange(values[0])}
            min={0.5}
            max={10}
            step={0.5}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Adjust how fast time passes during operating sessions
          </p>
        </div>

        <div className="p-4 rounded-lg bg-muted space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Background Costs
            </h4>
            <Switch
              checked={backgroundCostsEnabled}
              onCheckedChange={(checked) => onUpdateSettings({ backgroundCostsEnabled: checked })}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            When enabled, your railroad accumulates maintenance costs ($50/hour) while you're offline
          </p>
        </div>

        <div className="p-4 rounded-lg bg-muted space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </h4>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={handleNotificationsToggle}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Receive alerts when your balance is low or locomotives need maintenance
          </p>
          {notificationsEnabled && (
            <div className="space-y-4 pt-3 border-t border-border">
              <div className="space-y-2">
                <label className="text-xs font-medium">Email for notifications (optional)</label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="text-sm"
                  />
                  <Button size="sm" onClick={handleEmailSave}>
                    Save
                  </Button>
                </div>
                {userEmail && (
                  <p className="text-xs text-muted-foreground">
                    Saved: {userEmail}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium">Phone for SMS notifications (optional)</label>
                <div className="flex gap-2">
                  <Input
                    type="tel"
                    placeholder="+1234567890"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="text-sm"
                  />
                  <Button size="sm" onClick={handlePhoneSave}>
                    Save
                  </Button>
                </div>
                {userPhone && (
                  <p className="text-xs text-muted-foreground">
                    Saved: {userPhone}
                  </p>
                )}
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  Note: SMS requires Twilio API key (see server setup)
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-xs font-medium">Industry Order Notifications</span>
                </div>
                <Switch
                  checked={industryNotificationsEnabled}
                  onCheckedChange={(checked) => onUpdateSettings({ industryNotificationsEnabled: checked })}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Get random notifications when industries have orders ready (reminds you to pull physical cards)
              </p>

              <Button
                onClick={onSendTestNotification}
                className="w-full"
                variant="outline"
                size="sm"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Test Notification
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-3 pt-4 border-t">
          <h4 className="font-medium text-sm">Data Management</h4>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset All Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Reset All Data?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>All financial records</li>
                    <li>Current balance (${balance.toFixed(2)})</li>
                    <li>All locomotive conditions</li>
                    <li>Operating session history</li>
                  </ul>
                  <p className="mt-3 font-medium">This action cannot be undone!</p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onResetData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Reset Everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <p className="text-xs text-muted-foreground">
            Use this if you encounter issues with locomotive data or want to start fresh.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
