import { VesselData } from '../../types/vessel';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Ship, 
  Navigation, 
  Clock, 
  MapPin, 
  Flag, 
  Ruler,
  AlertTriangle,
  Route,
  Bell,
  Download
} from 'lucide-react';

interface VesselDetailModalProps {
  vessel: VesselData | null;
  isOpen: boolean;
  onClose: () => void;
  onViewTrail?: (vesselId: number) => void;
  onSetAlert?: (vesselId: number) => void;
  onExportData?: (vesselId: number) => void;
}

export function VesselDetailModal({
  vessel,
  isOpen,
  onClose,
  onViewTrail,
  onSetAlert,
  onExportData
}: VesselDetailModalProps) {
  if (!vessel) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Under Way':
        return 'bg-green-100 text-green-800';
      case 'Anchored':
        return 'bg-blue-100 text-blue-800';
      case 'Moored':
        return 'bg-yellow-100 text-yellow-800';
      case 'Aground':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'high':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'low':
        return '✓';
      case 'medium':
        return '!';
      case 'high':
        return '⚠';
      default:
        return '?';
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  const formatCoordinate = (coord: number, type: 'lat' | 'lng') => {
    const abs = Math.abs(coord);
    const dir = coord >= 0 ? (type === 'lat' ? 'N' : 'E') : (type === 'lat' ? 'S' : 'W');
    return `${abs.toFixed(4)}°${dir}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Ship className="h-5 w-5" />
            <span>{vessel.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Vessel Information */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">Vessel Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">{vessel.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">IMO:</span>
                  <span className="font-medium">{vessel.imo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">MMSI:</span>
                  <span className="font-medium">{vessel.mmsi}</span>
                </div>
                {vessel.flag && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 flex items-center">
                      <Flag className="h-4 w-4 mr-1" />
                      Flag:
                    </span>
                    <span className="font-medium">{vessel.flag}</span>
                  </div>
                )}
                {vessel.length && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 flex items-center">
                      <Ruler className="h-4 w-4 mr-1" />
                      Length:
                    </span>
                    <span className="font-medium">{vessel.length}m</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Current Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 flex items-center">
                    <Navigation className="h-4 w-4 mr-1" />
                    Speed:
                  </span>
                  <span className="font-medium">{vessel.speed.toFixed(1)} knots</span>
                </div>
                {vessel.heading && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Heading:</span>
                    <span className="font-medium">{vessel.heading.toFixed(0)}°</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge className={getStatusColor(vessel.status)}>
                    {vessel.status}
                  </Badge>
                </div>
                {vessel.destination && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      Destination:
                    </span>
                    <span className="font-medium">{vessel.destination}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Location & ETA */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">Location</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Latitude:</span>
                  <span className="font-medium">{formatCoordinate(vessel.latitude, 'lat')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Longitude:</span>
                  <span className="font-medium">{formatCoordinate(vessel.longitude, 'lng')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Update:</span>
                  <span className="font-medium">
                    {Math.floor((Date.now() - new Date(vessel.lastUpdate).getTime()) / (1000 * 60))}m ago
                  </span>
                </div>
              </div>
            </div>

            {vessel.eta && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Estimated Arrival</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      ETA:
                    </span>
                    <span className="font-medium">{formatDate(vessel.eta)}</span>
                  </div>
                  {vessel.destination && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Port:</span>
                      <span className="font-medium">{vessel.destination}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold mb-3">Risk Assessment</h3>
              <div className={`border rounded-lg p-3 ${getRiskColor(vessel.riskLevel)}`}>
                <div className="flex items-center mb-2">
                  <span className="text-lg mr-2">{getRiskIcon(vessel.riskLevel)}</span>
                  <span className="font-medium capitalize">{vessel.riskLevel} Risk</span>
                </div>
                <p className="text-sm">
                  {vessel.riskAssessment || 'No specific risk assessment available.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-6 border-t border-gray-200">
          <Button
            onClick={() => onViewTrail?.(vessel.id)}
            className="flex-1 bg-navy-600 hover:bg-navy-700"
          >
            <Route className="h-4 w-4 mr-2" />
            View Trail
          </Button>
          <Button
            onClick={() => onSetAlert?.(vessel.id)}
            className="flex-1 bg-ocean-600 hover:bg-ocean-700"
          >
            <Bell className="h-4 w-4 mr-2" />
            Set Alert
          </Button>
          <Button
            onClick={() => onExportData?.(vessel.id)}
            variant="outline"
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
