import { storage } from './storage';
import type { Vessel, VesselTrail } from '@shared/schema';

export interface ETAPrediction {
  vesselId: number;
  destination: string;
  estimatedArrival: Date;
  confidence: number;
  remainingDistance: number;
  averageSpeed: number;
  weatherImpact: number;
}

export class ETAPredictionService {
  private portLocations = new Map<string, { lat: number; lng: number }>([
    ['Port of Dubai', { lat: 25.2048, lng: 55.2708 }],
    ['Jebel Ali Port', { lat: 24.9964, lng: 55.0136 }],
    ['Port of London', { lat: 51.5074, lng: -0.1278 }],
    ['Port of San Francisco', { lat: 37.7749, lng: -122.4194 }],
    ['Port of Tokyo', { lat: 35.6762, lng: 139.6503 }],
    ['Port of Miami', { lat: 25.7617, lng: -80.1918 }],
    ['Port of Oslo', { lat: 59.9139, lng: 10.7522 }],
    ['Singapore Port', { lat: 1.3521, lng: 103.8198 }],
    ['Port of Rotterdam', { lat: 51.9225, lng: 4.4792 }],
    ['Port of Shanghai', { lat: 31.2304, lng: 121.4737 }],
  ]);

  async predictETA(vesselId: number): Promise<ETAPrediction | null> {
    const vessel = await storage.getVesselById(vesselId);
    if (!vessel || !vessel.destination) {
      return null;
    }

    const trail = await storage.getVesselTrail(vesselId);
    const destinationCoords = this.portLocations.get(vessel.destination);
    
    if (!destinationCoords || trail.length < 2) {
      return null;
    }

    const averageSpeed = this.calculateAverageSpeed(trail);
    const remainingDistance = this.calculateDistance(
      vessel.latitude,
      vessel.longitude,
      destinationCoords.lat,
      destinationCoords.lng
    );

    const baseETA = this.calculateBaseETA(remainingDistance, averageSpeed);
    const weatherImpact = this.estimateWeatherImpact(vessel);
    const adjustedETA = new Date(baseETA.getTime() + (weatherImpact * 60 * 60 * 1000));

    return {
      vesselId,
      destination: vessel.destination,
      estimatedArrival: adjustedETA,
      confidence: this.calculateConfidence(trail, averageSpeed),
      remainingDistance,
      averageSpeed,
      weatherImpact,
    };
  }

  private calculateAverageSpeed(trail: VesselTrail[]): number {
    if (trail.length < 2) return 0;

    let totalSpeed = 0;
    let validPoints = 0;

    for (let i = 1; i < trail.length; i++) {
      const prev = trail[i - 1];
      const curr = trail[i];
      
      if (prev.speed && curr.speed) {
        totalSpeed += (prev.speed + curr.speed) / 2;
        validPoints++;
      }
    }

    return validPoints > 0 ? totalSpeed / validPoints : 10; // Default 10 knots
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

  private calculateBaseETA(distanceKm: number, speedKnots: number): Date {
    const speedKmh = speedKnots * 1.852; // Convert knots to km/h
    const hoursToDestination = distanceKm / speedKmh;
    return new Date(Date.now() + (hoursToDestination * 60 * 60 * 1000));
  }

  private estimateWeatherImpact(vessel: Vessel): number {
    // Simplified weather impact estimation (hours of delay)
    // In a real system, this would use weather API data
    const riskFactors = {
      'Under Way': 0,
      'Anchored': 2,
      'Restricted Manoeuvrability': 4,
      'Constrained by Draught': 3,
      'Aground': 24,
      'Engaged in Fishing': 1,
    };

    const baseDelay = riskFactors[vessel.status as keyof typeof riskFactors] || 0;
    const speedFactor = vessel.speed < 5 ? 2 : 0; // Slow vessels might face more delays
    
    return baseDelay + speedFactor + Math.random() * 2; // Add some randomness
  }

  private calculateConfidence(trail: VesselTrail[], averageSpeed: number): number {
    if (trail.length < 5) return 0.3; // Low confidence with few data points
    
    let speedVariation = 0;
    let validSpeeds = 0;
    
    for (const point of trail) {
      if (point.speed) {
        speedVariation += Math.abs(point.speed - averageSpeed);
        validSpeeds++;
      }
    }
    
    if (validSpeeds === 0) return 0.5;
    
    const avgVariation = speedVariation / validSpeeds;
    const consistency = Math.max(0, 1 - (avgVariation / averageSpeed));
    
    // Scale confidence based on data quality
    return Math.min(0.95, Math.max(0.1, consistency * 0.8 + 0.2));
  }

  async getAllETAPredictions(): Promise<ETAPrediction[]> {
    const vessels = await storage.getVessels();
    const predictions: ETAPrediction[] = [];
    
    for (const vessel of vessels) {
      if (vessel.destination && vessel.status === 'Under Way') {
        const prediction = await this.predictETA(vessel.id);
        if (prediction) {
          predictions.push(prediction);
        }
      }
    }
    
    return predictions;
  }
}

export const etaPredictionService = new ETAPredictionService();