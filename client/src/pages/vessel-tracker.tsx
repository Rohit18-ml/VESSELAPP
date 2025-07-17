import { useState, useEffect, useCallback } from 'react';
import { useVessels, useSearchVessels, useFilterVessels } from '../hooks/use-vessels';
import { useWebSocket } from '../hooks/use-websocket';
import { VesselData, VesselFilters, MapSettings, WebSocketMessage } from '../types/vessel';
import { LeafletMap } from '../components/map/leaflet-map';
import { VesselList } from '../components/vessel/vessel-list';
import { VesselSearch } from '../components/vessel/vessel-search';
import { VesselDetailModal } from '../components/vessel/vessel-detail-modal';
import { SettingsModal } from '../components/settings/settings-modal';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import { aisStreamService } from '../services/aisstream';
import { 
  Anchor, 
  Bell, 
  Settings, 
  User, 
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';

export default function VesselTracker() {
  const { toast } = useToast();
  const [selectedVessel, setSelectedVessel] = useState<VesselData | null>(null);
  const [filters, setFilters] = useState<VesselFilters>({
    searchQuery: '',
    type: '',
    status: '',
  });
  const [settings, setSettings] = useState<MapSettings>({
    showVessels: true,
    showTrails: true,
    showGeofences: false,
    showForecasts: false,
    darkMode: false,
    autoRefresh: true,
    refreshInterval: 10,
  });
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [aisConnected, setAisConnected] = useState(false);

  // WebSocket connection
  const { isConnected, onMessage } = useWebSocket('/ws');

  // Data fetching with auto-refresh
  const refreshInterval = settings.autoRefresh ? settings.refreshInterval * 1000 : 0;
  const { data: allVessels = [], isLoading: vesselsLoading, refetch } = useVessels(refreshInterval);
  const { data: searchResults = [] } = useSearchVessels(filters.searchQuery);
  const { data: filteredVessels = [] } = useFilterVessels({
    type: filters.type,
    status: filters.status,
    searchQuery: '',
  });

  // Determine which vessels to display
  const displayVessels = filters.searchQuery 
    ? searchResults 
    : (filters.type || filters.status) 
      ? filteredVessels 
      : allVessels;

  // Handle WebSocket messages
  useEffect(() => {
    onMessage('vessel_added', (data: WebSocketMessage) => {
      if (data.vessel) {
        toast({
          title: 'New Vessel Detected',
          description: `${data.vessel.name} has entered the area`,
        });
      }
      refetch();
    });

    onMessage('vessel_updated', (data: WebSocketMessage) => {
      if (data.vessel && selectedVessel?.id === data.vessel.id) {
        setSelectedVessel(data.vessel);
      }
      refetch();
    });

    onMessage('alert_created', (data: WebSocketMessage) => {
      if (data.alert) {
        toast({
          title: 'Alert Created',
          description: data.alert.message,
          variant: 'destructive',
        });
      }
    });
  }, [onMessage, refetch, selectedVessel, toast]);

  // Initialize AISstream connection
  useEffect(() => {
    const initializeAISstream = async () => {
      try {
        await aisStreamService.connect();
        setAisConnected(true);
        
        aisStreamService.onMessage('vessel_position', (data) => {
          // Handle real-time vessel position updates
          // This would typically update the vessel data in your backend
          console.log('Vessel position update:', data);
        });

        aisStreamService.onMessage('vessel_data', (data) => {
          // Handle vessel metadata updates
          console.log('Vessel data update:', data);
        });

        toast({
          title: 'AISstream Connected',
          description: 'Real-time vessel data is now available',
        });
      } catch (error) {
        console.error('Failed to connect to AISstream:', error);
        setAisConnected(false);
        toast({
          title: 'AISstream Connection Failed',
          description: 'Using offline mode. Some features may be limited.',
          variant: 'destructive',
        });
      }
    };

    initializeAISstream();

    return () => {
      aisStreamService.disconnect();
    };
  }, [toast]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!settings.autoRefresh) return;

    const interval = setInterval(() => {
      refetch();
    }, settings.refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [settings.autoRefresh, settings.refreshInterval, refetch]);

  const handleVesselSelect = useCallback((vessel: VesselData) => {
    setSelectedVessel(vessel);
    setIsDetailModalOpen(true);
  }, []);

  const handleFiltersChange = useCallback((newFilters: VesselFilters) => {
    setFilters(newFilters);
  }, []);

  const handleSettingsChange = useCallback((newSettings: MapSettings) => {
    setSettings(newSettings);
    localStorage.setItem('vesselTracker_settings', JSON.stringify(newSettings));
  }, []);

  const handleViewTrail = useCallback((vesselId: number) => {
    // TODO: Implement trail viewing
    toast({
      title: 'Trail View',
      description: 'Trail viewing feature coming soon',
    });
  }, [toast]);

  const handleSetAlert = useCallback((vesselId: number) => {
    // TODO: Implement alert setting
    toast({
      title: 'Alert Set',
      description: 'Alert configuration coming soon',
    });
  }, [toast]);

  const handleExportData = useCallback((vesselId: number) => {
    // TODO: Implement data export
    toast({
      title: 'Data Export',
      description: 'Export feature coming soon',
    });
  }, [toast]);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('vesselTracker_settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-navy-900 text-white shadow-lg">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Anchor className="h-6 w-6 mr-3" />
              <h1 className="text-xl font-bold">Vessel Tracker</h1>
              <Badge className="ml-2 bg-ocean-600 text-white">
                LIVE
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-navy-800"
              >
                <Bell className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-navy-800"
                onClick={() => setIsSettingsModalOpen(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <div className="w-8 h-8 bg-ocean-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-80 bg-white shadow-lg border-r border-gray-200 h-[calc(100vh-64px)] overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <VesselSearch onFiltersChange={handleFiltersChange} />
          </div>
          
          <div className="p-4">
            <VesselList
              vessels={displayVessels}
              selectedVessel={selectedVessel}
              onVesselSelect={handleVesselSelect}
              loading={vesselsLoading}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 relative">
          {/* Map */}
          <LeafletMap
            vessels={displayVessels}
            selectedVessel={selectedVessel}
            onVesselSelect={handleVesselSelect}
            showTrails={settings.showTrails}
            showGeofences={settings.showGeofences}
            className="h-[calc(100vh-64px)]"
          />

          {/* Connection Status */}
          <div className="absolute bottom-4 left-4 z-10">
            <Card>
              <CardContent className="p-3 flex items-center space-x-2">
                {aisConnected ? (
                  <>
                    <Wifi className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-green-600">
                      AISstream Connected
                    </span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium text-red-600">
                      AISstream Disconnected
                    </span>
                  </>
                )}
                <div className="w-2 h-2 bg-green-500 rounded-full pulse" />
              </CardContent>
            </Card>
          </div>

          {/* WebSocket Status */}
          <div className="absolute bottom-4 right-4 z-10">
            <Card>
              <CardContent className="p-3 flex items-center space-x-2">
                {isConnected ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full pulse" />
                    <span className="text-sm font-medium text-green-600">
                      WebSocket Connected
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    <span className="text-sm font-medium text-red-600">
                      WebSocket Disconnected
                    </span>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => refetch()}
                  className="p-1"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      <VesselDetailModal
        vessel={selectedVessel}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onViewTrail={handleViewTrail}
        onSetAlert={handleSetAlert}
        onExportData={handleExportData}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />
    </div>
  );
}
