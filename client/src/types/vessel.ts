export interface VesselPosition {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export interface VesselData {
  id: number;
  imo: string;
  mmsi: string;
  name: string;
  type: string;
  flag?: string;
  length?: number;
  width?: number;
  status: string;
  speed: number;
  heading?: number;
  latitude: number;
  longitude: number;
  destination?: string;
  eta?: Date;
  lastUpdate: Date;
  riskLevel: 'low' | 'medium' | 'high';
  riskAssessment?: string;
}

export interface VesselTrailPoint {
  id: number;
  vesselId: number;
  latitude: number;
  longitude: number;
  timestamp: Date;
  speed?: number;
  heading?: number;
}

export interface AISMessage {
  type: 'vessel_position' | 'vessel_data';
  mmsi: string;
  name?: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  status?: string;
  timestamp: number;
}

export interface WebSocketMessage {
  type: 'vessel_added' | 'vessel_updated' | 'vessel_deleted' | 'geofence_added' | 'alert_created';
  vessel?: VesselData;
  vesselId?: number;
  geofence?: any;
  alert?: any;
}

export interface VesselFilters {
  type: string;
  status: string;
  searchQuery: string;
}

export interface MapSettings {
  showVessels: boolean;
  showTrails: boolean;
  showGeofences: boolean;
  showForecasts: boolean;
  darkMode: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
}
