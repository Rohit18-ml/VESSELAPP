import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { VesselData, VesselTrailPoint } from '../../types/vessel';
import { Button } from '../ui/button';
import { ZoomIn, ZoomOut, Navigation } from 'lucide-react';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LeafletMapProps {
  vessels: VesselData[];
  selectedVessel?: VesselData | null;
  onVesselSelect: (vessel: VesselData) => void;
  showTrails?: boolean;
  showGeofences?: boolean;
  vesselTrails?: { [vesselId: number]: VesselTrailPoint[] };
  className?: string;
}

export function LeafletMap({
  vessels,
  selectedVessel,
  onVesselSelect,
  showTrails = false,
  showGeofences = false,
  vesselTrails = {},
  className = ''
}: LeafletMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());
  const trailsRef = useRef<Map<number, L.Polyline>>(new Map());
  const geofencesRef = useRef<L.Circle[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = L.map(mapContainerRef.current, {
      center: [20, 0], // Global center
      zoom: 3,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update vessel markers
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const currentMarkers = markersRef.current;

    // Remove old markers
    currentMarkers.forEach((marker) => {
      map.removeLayer(marker);
    });
    currentMarkers.clear();

    // Add new markers
    vessels.forEach((vessel) => {
      const isSelected = selectedVessel?.id === vessel.id;
      const isUnderway = vessel.status === 'Under Way';
      
      // Create arrow-shaped marker showing vessel heading
      const heading = vessel.course || 0; // Use course for heading direction
      const markerColor = isUnderway ? '#1565C0' : '#FF7043';
      
      const icon = L.divIcon({
        html: `
          <div class="vessel-arrow-marker" 
               style="
                 transform: rotate(${heading}deg) ${isSelected ? 'scale(1.3)' : 'scale(1.0)'};
                 width: 20px;
                 height: 20px;
                 position: relative;
               ">
            <div style="
              width: 0;
              height: 0;
              border-left: 8px solid transparent;
              border-right: 8px solid transparent;
              border-bottom: 16px solid ${markerColor};
              position: absolute;
              left: 50%;
              top: 50%;
              transform: translate(-50%, -50%);
              filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
              ${isSelected ? 'border-bottom-color: #FF6B35;' : ''}
            "></div>
            <div style="
              width: 6px;
              height: 6px;
              background: white;
              border-radius: 50%;
              position: absolute;
              left: 50%;
              top: 50%;
              transform: translate(-50%, -50%);
              z-index: 1;
            "></div>
          </div>
        `,
        className: 'vessel-marker-container',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const marker = L.marker([vessel.latitude, vessel.longitude], { icon });
      
      marker.bindPopup(`
        <div class="p-3 min-w-48">
          <h3 class="font-semibold text-base mb-1">${vessel.name}</h3>
          <p class="text-sm text-gray-600 mb-2">${vessel.type}</p>
          <div class="space-y-1 text-sm">
            <div class="flex justify-between">
              <span>Status:</span>
              <span class="px-2 py-1 rounded-full text-xs ${
                vessel.status === 'Under Way' ? 'bg-green-100 text-green-800' :
                vessel.status === 'Anchored' ? 'bg-blue-100 text-blue-800' :
                vessel.status === 'Moored' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }">${vessel.status}</span>
            </div>
            <div class="flex justify-between">
              <span>Speed:</span>
              <span>${vessel.speed.toFixed(1)} kts</span>
            </div>
            ${vessel.destination ? `
              <div class="flex justify-between">
                <span>Destination:</span>
                <span>${vessel.destination}</span>
              </div>
            ` : ''}
          </div>
          <button class="mt-3 w-full px-3 py-1 bg-navy-600 text-white rounded text-sm hover:bg-navy-700 transition-colors" 
                  onclick="window.dispatchEvent(new CustomEvent('selectVessel', { detail: ${vessel.id} }))">
            View Details
          </button>
        </div>
      `);

      marker.on('click', () => {
        onVesselSelect(vessel);
      });

      marker.addTo(map);
      currentMarkers.set(vessel.id, marker);
    });
  }, [vessels, selectedVessel, onVesselSelect]);

  // Update vessel trails
  useEffect(() => {
    if (!mapRef.current || !showTrails) return;

    const map = mapRef.current;
    const currentTrails = trailsRef.current;

    // Remove old trails
    currentTrails.forEach((trail) => {
      map.removeLayer(trail);
    });
    currentTrails.clear();

    // Add new trails
    vessels.forEach((vessel) => {
      if (vesselTrails[vessel.id] && vesselTrails[vessel.id].length > 1) {
        const trail = vesselTrails[vessel.id];
        const coordinates: [number, number][] = trail.map(point => [point.latitude, point.longitude]);
        
        const polyline = L.polyline(coordinates, {
          color: vessel.status === 'Under Way' ? '#1565C0' : '#FF7043',
          weight: 2,
          opacity: 0.7,
          dashArray: '5, 5'
        });

        polyline.addTo(map);
        currentTrails.set(vessel.id, polyline);
      }
    });
  }, [vessels, vesselTrails, showTrails]);

  // Update geofences
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const currentGeofences = geofencesRef.current;

    // Remove old geofences
    currentGeofences.forEach((geofence) => {
      map.removeLayer(geofence);
    });
    geofencesRef.current = [];

    if (showGeofences) {
      // Add Port of Dubai geofence
      const portZone = L.circle([25.2048, 55.2708], {
        color: '#FF7043',
        fillColor: '#FF7043',
        fillOpacity: 0.1,
        radius: 5000,
      });

      portZone.bindPopup('<b>Port of Dubai</b><br>Geofence Zone');
      portZone.addTo(map);
      geofencesRef.current.push(portZone);

      // Add Jebel Ali Port geofence
      const jebel = L.circle([24.9964, 55.0136], {
        color: '#FF7043',
        fillColor: '#FF7043',
        fillOpacity: 0.1,
        radius: 7000,
      });

      jebel.bindPopup('<b>Jebel Ali Port</b><br>Geofence Zone');
      jebel.addTo(map);
      geofencesRef.current.push(jebel);
    }
  }, [showGeofences]);

  // Map control functions
  const zoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  const zoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  const centerMap = () => {
    if (mapRef.current) {
      mapRef.current.setView([25.2048, 55.2708], 10);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-10 space-y-2">
        <div className="bg-white rounded-lg shadow-md p-2 space-y-1">
          <Button
            size="sm"
            variant="outline"
            onClick={zoomIn}
            className="w-8 h-8 p-0 bg-navy-600 text-white hover:bg-navy-700 border-none"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={zoomOut}
            className="w-8 h-8 p-0 bg-navy-600 text-white hover:bg-navy-700 border-none"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>
        <div className="bg-white rounded-lg shadow-md p-2">
          <Button
            size="sm"
            variant="outline"
            onClick={centerMap}
            className="w-8 h-8 p-0 bg-navy-600 text-white hover:bg-navy-700 border-none"
          >
            <Navigation className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
