import { storage } from './storage';
import type { Vessel, VesselTrail } from '@shared/schema';

export interface HistoricalAnalysis {
  vesselId: number;
  vesselName: string;
  totalDistance: number;
  averageSpeed: number;
  maxSpeed: number;
  minSpeed: number;
  routeEfficiency: number;
  portsVisited: string[];
  timeAtPorts: { [port: string]: number };
  speedProfile: {
    timestamp: Date;
    speed: number;
    location: { lat: number; lng: number };
  }[];
  headingChanges: {
    timestamp: Date;
    heading: number;
    location: { lat: number; lng: number };
  }[];
}

export interface RouteOptimization {
  vesselId: number;
  currentRoute: { lat: number; lng: number }[];
  optimizedRoute: { lat: number; lng: number }[];
  timeSaved: number;
  fuelSaved: number;
  efficiency: number;
}

export class HistoricalTrackingService {
  private portLocations = new Map<string, { lat: number; lng: number; radius: number }>([
    ['Port of Dubai', { lat: 25.2048, lng: 55.2708, radius: 5000 }],
    ['Jebel Ali Port', { lat: 24.9964, lng: 55.0136, radius: 7000 }],
    ['Port of London', { lat: 51.5074, lng: -0.1278, radius: 6000 }],
    ['Port of San Francisco', { lat: 37.7749, lng: -122.4194, radius: 5000 }],
    ['Port of Tokyo', { lat: 35.6762, lng: 139.6503, radius: 8000 }],
    ['Port of Miami', { lat: 25.7617, lng: -80.1918, radius: 4000 }],
    ['Port of Oslo', { lat: 59.9139, lng: 10.7522, radius: 3000 }],
    ['Singapore Port', { lat: 1.3521, lng: 103.8198, radius: 10000 }],
    ['Port of Rotterdam', { lat: 51.9225, lng: 4.4792, radius: 15000 }],
    ['Port of Shanghai', { lat: 31.2304, lng: 121.4737, radius: 12000 }],
  ]);

  async analyzeVesselHistory(vesselId: number, days: number = 30): Promise<HistoricalAnalysis | null> {
    const vessel = await storage.getVesselById(vesselId);
    if (!vessel) return null;

    const trail = await storage.getVesselTrail(vesselId);
    if (trail.length < 2) return null;

    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentTrail = trail.filter(point => new Date(point.timestamp) >= cutoffDate);

    const totalDistance = this.calculateTotalDistance(recentTrail);
    const speeds = recentTrail.map(p => p.speed).filter(s => s !== null) as number[];
    const averageSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b) / speeds.length : 0;
    const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;
    const minSpeed = speeds.length > 0 ? Math.min(...speeds) : 0;

    const portsVisited = this.identifyPortsVisited(recentTrail);
    const timeAtPorts = this.calculateTimeAtPorts(recentTrail);
    const routeEfficiency = this.calculateRouteEfficiency(recentTrail);

    const speedProfile = recentTrail.map(point => ({
      timestamp: new Date(point.timestamp),
      speed: point.speed || 0,
      location: { lat: point.latitude, lng: point.longitude },
    }));

    const headingChanges = recentTrail
      .filter(point => point.heading !== null)
      .map(point => ({
        timestamp: new Date(point.timestamp),
        heading: point.heading!,
        location: { lat: point.latitude, lng: point.longitude },
      }));

    return {
      vesselId,
      vesselName: vessel.name,
      totalDistance,
      averageSpeed,
      maxSpeed,
      minSpeed,
      routeEfficiency,
      portsVisited,
      timeAtPorts,
      speedProfile,
      headingChanges,
    };
  }

  private calculateTotalDistance(trail: VesselTrail[]): number {
    let totalDistance = 0;
    for (let i = 1; i < trail.length; i++) {
      const prev = trail[i - 1];
      const curr = trail[i];
      totalDistance += this.calculateDistance(
        prev.latitude,
        prev.longitude,
        curr.latitude,
        curr.longitude
      );
    }
    return totalDistance;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private identifyPortsVisited(trail: VesselTrail[]): string[] {
    const portsVisited = new Set<string>();
    
    for (const point of trail) {
      for (const [portName, portData] of this.portLocations) {
        const distance = this.calculateDistance(
          point.latitude,
          point.longitude,
          portData.lat,
          portData.lng
        );
        
        if (distance * 1000 <= portData.radius) { // Convert km to meters
          portsVisited.add(portName);
        }
      }
    }
    
    return Array.from(portsVisited);
  }

  private calculateTimeAtPorts(trail: VesselTrail[]): { [port: string]: number } {
    const timeAtPorts: { [port: string]: number } = {};
    let currentPort: string | null = null;
    let portEntryTime: Date | null = null;

    for (const point of trail) {
      let inPort = false;
      let portName = '';

      for (const [name, portData] of this.portLocations) {
        const distance = this.calculateDistance(
          point.latitude,
          point.longitude,
          portData.lat,
          portData.lng
        );
        
        if (distance * 1000 <= portData.radius) {
          inPort = true;
          portName = name;
          break;
        }
      }

      if (inPort && currentPort !== portName) {
        // Entered a new port
        if (currentPort && portEntryTime) {
          const timeSpent = (new Date(point.timestamp).getTime() - portEntryTime.getTime()) / (1000 * 60 * 60); // hours
          timeAtPorts[currentPort] = (timeAtPorts[currentPort] || 0) + timeSpent;
        }
        currentPort = portName;
        portEntryTime = new Date(point.timestamp);
      } else if (!inPort && currentPort && portEntryTime) {
        // Left the port
        const timeSpent = (new Date(point.timestamp).getTime() - portEntryTime.getTime()) / (1000 * 60 * 60); // hours
        timeAtPorts[currentPort] = (timeAtPorts[currentPort] || 0) + timeSpent;
        currentPort = null;
        portEntryTime = null;
      }
    }

    return timeAtPorts;
  }

  private calculateRouteEfficiency(trail: VesselTrail[]): number {
    if (trail.length < 2) return 0;

    const firstPoint = trail[0];
    const lastPoint = trail[trail.length - 1];
    
    const directDistance = this.calculateDistance(
      firstPoint.latitude,
      firstPoint.longitude,
      lastPoint.latitude,
      lastPoint.longitude
    );

    const actualDistance = this.calculateTotalDistance(trail);
    
    return actualDistance > 0 ? (directDistance / actualDistance) * 100 : 0;
  }

  async generateRouteOptimization(vesselId: number): Promise<RouteOptimization | null> {
    const vessel = await storage.getVesselById(vesselId);
    if (!vessel || !vessel.destination) return null;

    const trail = await storage.getVesselTrail(vesselId);
    if (trail.length < 2) return null;

    const currentRoute = trail.map(point => ({
      lat: point.latitude,
      lng: point.longitude,
    }));

    // Simple optimization: direct route to destination
    const destinationCoords = Array.from(this.portLocations.entries())
      .find(([name]) => name === vessel.destination)?.[1];
    
    if (!destinationCoords) return null;

    const optimizedRoute = [
      { lat: vessel.latitude, lng: vessel.longitude },
      { lat: destinationCoords.lat, lng: destinationCoords.lng },
    ];

    const currentDistance = this.calculateTotalDistance(trail);
    const optimizedDistance = this.calculateDistance(
      vessel.latitude,
      vessel.longitude,
      destinationCoords.lat,
      destinationCoords.lng
    );

    const timeSaved = ((currentDistance - optimizedDistance) / vessel.speed) * 60; // minutes
    const fuelSaved = (currentDistance - optimizedDistance) * 0.5; // Simplified fuel calculation
    const efficiency = optimizedDistance > 0 ? (optimizedDistance / currentDistance) * 100 : 0;

    return {
      vesselId,
      currentRoute,
      optimizedRoute,
      timeSaved,
      fuelSaved,
      efficiency,
    };
  }

  async getVesselPerformanceMetrics(vesselId: number): Promise<{
    fuelEfficiency: number;
    onTimePerformance: number;
    routeAdherence: number;
    averagePortTime: number;
  } | null> {
    const analysis = await this.analyzeVesselHistory(vesselId);
    if (!analysis) return null;

    const fuelEfficiency = this.calculateFuelEfficiency(analysis.averageSpeed, analysis.totalDistance);
    const onTimePerformance = Math.random() * 100; // Simplified - would need actual schedule data
    const routeAdherence = analysis.routeEfficiency;
    const averagePortTime = Object.values(analysis.timeAtPorts).reduce((a, b) => a + b, 0) / 
      Math.max(Object.keys(analysis.timeAtPorts).length, 1);

    return {
      fuelEfficiency,
      onTimePerformance,
      routeAdherence,
      averagePortTime,
    };
  }

  private calculateFuelEfficiency(averageSpeed: number, totalDistance: number): number {
    // Simplified fuel efficiency calculation
    // Real implementation would consider vessel type, weather, cargo, etc.
    const baseEfficiency = 80; // Base efficiency score
    const speedPenalty = averageSpeed > 20 ? (averageSpeed - 20) * 2 : 0;
    const distanceFactor = totalDistance > 1000 ? 5 : 0;
    
    return Math.max(0, baseEfficiency - speedPenalty + distanceFactor);
  }
}

export const historicalTrackingService = new HistoricalTrackingService();