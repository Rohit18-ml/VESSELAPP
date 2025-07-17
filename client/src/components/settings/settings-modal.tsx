import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Settings, Save, RotateCcw } from 'lucide-react';
import { MapSettings } from '../../types/vessel';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: MapSettings;
  onSettingsChange: (settings: MapSettings) => void;
}

export function SettingsModal({ 
  isOpen, 
  onClose, 
  settings, 
  onSettingsChange 
}: SettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<MapSettings>(settings);

  const handleSave = () => {
    onSettingsChange(localSettings);
    onClose();
  };

  const handleReset = () => {
    const defaultSettings: MapSettings = {
      showVessels: true,
      showTrails: true,
      showGeofences: false,
      showForecasts: false,
      darkMode: false,
      autoRefresh: true,
      refreshInterval: 10,
    };
    setLocalSettings(defaultSettings);
  };

  const updateSetting = (key: keyof MapSettings, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Map Settings */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Map Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="dark-mode" className="text-sm font-medium">
                  Dark Mode
                </Label>
                <Switch
                  id="dark-mode"
                  checked={localSettings.darkMode}
                  onCheckedChange={(checked) => updateSetting('darkMode', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="auto-refresh" className="text-sm font-medium">
                  Auto Refresh
                </Label>
                <Switch
                  id="auto-refresh"
                  checked={localSettings.autoRefresh}
                  onCheckedChange={(checked) => updateSetting('autoRefresh', checked)}
                />
              </div>

              <div>
                <Label htmlFor="refresh-interval" className="text-sm font-medium mb-2 block">
                  Refresh Interval
                </Label>
                <Select 
                  value={localSettings.refreshInterval.toString()} 
                  onValueChange={(value) => updateSetting('refreshInterval', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 seconds</SelectItem>
                    <SelectItem value="10">10 seconds</SelectItem>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="60">1 minute</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Layer Settings */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Map Layers</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-vessels" className="text-sm font-medium">
                  Show Vessels
                </Label>
                <Switch
                  id="show-vessels"
                  checked={localSettings.showVessels}
                  onCheckedChange={(checked) => updateSetting('showVessels', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show-trails" className="text-sm font-medium">
                  Show Vessel Trails
                </Label>
                <Switch
                  id="show-trails"
                  checked={localSettings.showTrails}
                  onCheckedChange={(checked) => updateSetting('showTrails', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show-geofences" className="text-sm font-medium">
                  Show Geofences
                </Label>
                <Switch
                  id="show-geofences"
                  checked={localSettings.showGeofences}
                  onCheckedChange={(checked) => updateSetting('showGeofences', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show-forecasts" className="text-sm font-medium">
                  Show Route Forecasts
                </Label>
                <Switch
                  id="show-forecasts"
                  checked={localSettings.showForecasts}
                  onCheckedChange={(checked) => updateSetting('showForecasts', checked)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-6 border-t border-gray-200">
          <Button
            onClick={handleSave}
            className="flex-1 bg-navy-600 hover:bg-navy-700"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            className="flex-1"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Default
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
