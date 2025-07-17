import { VesselData } from '../../types/vessel';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Clock, Navigation, MapPin } from 'lucide-react';

interface VesselListProps {
  vessels: VesselData[];
  selectedVessel?: VesselData | null;
  onVesselSelect: (vessel: VesselData) => void;
  loading?: boolean;
  className?: string;
}

export function VesselList({ 
  vessels, 
  selectedVessel, 
  onVesselSelect, 
  loading = false,
  className = '' 
}: VesselListProps) {
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

  const formatETA = (eta?: Date) => {
    if (!eta) return 'N/A';
    
    const now = new Date();
    const etaDate = new Date(eta);
    const diffHours = Math.floor((etaDate.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return `${diffHours}h`;
    } else {
      return etaDate.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="flex space-x-2">
              <div className="h-5 bg-gray-200 rounded w-16"></div>
              <div className="h-5 bg-gray-200 rounded w-12"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (vessels.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No vessels found</p>
        <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Active Vessels</h2>
        <span className="text-sm text-gray-500">{vessels.length} vessels</span>
      </div>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="space-y-3">
          {vessels.map((vessel) => (
            <div
              key={vessel.id}
              className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                selectedVessel?.id === vessel.id ? 'border-navy-600 ring-2 ring-navy-600 ring-opacity-20' : 'border-gray-200'
              }`}
              onClick={() => onVesselSelect(vessel)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{vessel.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{vessel.type}</p>
                  
                  <div className="flex items-center space-x-4 mb-2">
                    <Badge className={`text-xs ${getStatusColor(vessel.status)}`}>
                      {vessel.status}
                    </Badge>
                    <span className="text-xs text-gray-500 flex items-center">
                      <Navigation className="h-3 w-3 mr-1" />
                      {vessel.speed.toFixed(1)} kts
                    </span>
                  </div>

                  {vessel.destination && (
                    <div className="flex items-center text-xs text-gray-500">
                      <MapPin className="h-3 w-3 mr-1" />
                      {vessel.destination}
                    </div>
                  )}
                </div>
                
                <div className="text-right">
                  <div className="flex items-center text-sm font-medium text-gray-900 mb-1">
                    <Clock className="h-3 w-3 mr-1" />
                    ETA: {formatETA(vessel.eta)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {vessel.lastUpdate && 
                      `Updated ${Math.floor((Date.now() - new Date(vessel.lastUpdate).getTime()) / (1000 * 60))}m ago`
                    }
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
