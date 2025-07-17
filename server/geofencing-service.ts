import { storage } from './storage';
import type { Vessel, Geofence, Alert } from '@shared/schema';

export interface GeofenceAlert {
  vesselId: number;
  vesselName: string;
  geofenceId: number;
  geofenceName: string;
  alertType: 'entry' | 'exit' | 'violation';
  timestamp: Date;
  distance: number;
}

export class GeofencingService {
  private activeAlerts = new Map<string, GeofenceAlert>();
  private broadcastCallback?: (data: any) => void;

  setBroadcastCallback(callback: (data: any) => void) {
    this.broadcastCallback = callback;
  }

  async checkGeofenceViolations(vessel: Vessel): Promise<GeofenceAlert[]> {
    const geofences = await storage.getGeofences();
    const alerts: GeofenceAlert[] = [];

    for (const geofence of geofences) {
      const distance = this.calculateDistance(
        vessel.latitude,
        vessel.longitude,
        geofence.latitude,
        geofence.longitude
      );

      const isInside = distance <= geofence.radius;
      const alertKey = `${vessel.id}-${geofence.id}`;
      const existingAlert = this.activeAlerts.get(alertKey);

      if (isInside && !existingAlert) {
        // Vessel entered geofence
        const alert: GeofenceAlert = {
          vesselId: vessel.id,
          vesselName: vessel.name,
          geofenceId: geofence.id,
          geofenceName: geofence.name,
          alertType: 'entry',
          timestamp: new Date(),
          distance,
        };

        alerts.push(alert);
        this.activeAlerts.set(alertKey, alert);
        await this.createSystemAlert(vessel, geofence, 'entry');
        
      } else if (!isInside && existingAlert) {
        // Vessel exited geofence
        const alert: GeofenceAlert = {
          vesselId: vessel.id,
          vesselName: vessel.name,
          geofenceId: geofence.id,
          geofenceName: geofence.name,
          alertType: 'exit',
          timestamp: new Date(),
          distance,
        };

        alerts.push(alert);
        this.activeAlerts.delete(alertKey);
        await this.createSystemAlert(vessel, geofence, 'exit');
      }

      // Check for restricted zone violations
      if (geofence.type === 'restricted' && isInside) {
        const violationAlert: GeofenceAlert = {
          vesselId: vessel.id,
          vesselName: vessel.name,
          geofenceId: geofence.id,
          geofenceName: geofence.name,
          alertType: 'violation',
          timestamp: new Date(),
          distance,
        };

        alerts.push(violationAlert);
        await this.createSystemAlert(vessel, geofence, 'violation');
      }
    }

    return alerts;
  }

  private async createSystemAlert(vessel: Vessel, geofence: Geofence, type: 'entry' | 'exit' | 'violation') {
    const alertMessages = {
      entry: `${vessel.name} entered ${geofence.name}`,
      exit: `${vessel.name} exited ${geofence.name}`,
      violation: `${vessel.name} violated restricted zone ${geofence.name}`,
    };

    const severityMap = {
      entry: 'info' as const,
      exit: 'info' as const,
      violation: 'high' as const,
    };

    const alert = await storage.createAlert({
      vesselId: vessel.id,
      type: 'geofence',
      severity: severityMap[type],
      message: alertMessages[type],
      isActive: true,
    });

    // Broadcast alert to connected clients
    if (this.broadcastCallback) {
      this.broadcastCallback({
        type: 'geofence_alert',
        alert: {
          ...alert,
          vessel,
          geofence,
        },
      });
    }
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth's radius in meters
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

  async processVesselUpdate(vessel: Vessel): Promise<void> {
    const alerts = await this.checkGeofenceViolations(vessel);
    
    for (const alert of alerts) {
      console.log(`Geofence Alert: ${alert.alertType} - ${alert.vesselName} ${alert.alertType} ${alert.geofenceName}`);
    }
  }

  async getActiveAlerts(): Promise<GeofenceAlert[]> {
    return Array.from(this.activeAlerts.values());
  }

  async clearAlert(vesselId: number, geofenceId: number): Promise<void> {
    const alertKey = `${vesselId}-${geofenceId}`;
    this.activeAlerts.delete(alertKey);
  }

  async createGeofence(name: string, latitude: number, longitude: number, radius: number, type: 'port' | 'restricted' | 'monitoring'): Promise<Geofence> {
    return await storage.createGeofence({
      name,
      latitude,
      longitude,
      radius,
      type,
    });
  }

  async getGeofencesInArea(centerLat: number, centerLng: number, radiusKm: number): Promise<Geofence[]> {
    const geofences = await storage.getGeofences();
    return geofences.filter(geofence => {
      const distance = this.calculateDistance(centerLat, centerLng, geofence.latitude, geofence.longitude);
      return distance <= radiusKm * 1000; // Convert km to meters
    });
  }
}

export const geofencingService = new GeofencingService();