import { 
  vessels, 
  vesselTrail, 
  geofences, 
  alerts,
  type Vessel, 
  type VesselTrail,
  type Geofence,
  type Alert,
  type InsertVessel, 
  type InsertVesselTrail,
  type InsertGeofence,
  type InsertAlert
} from "@shared/schema";

export interface IStorage {
  // Vessel operations
  getVessels(): Promise<Vessel[]>;
  getVesselById(id: number): Promise<Vessel | undefined>;
  getVesselByMmsi(mmsi: string): Promise<Vessel | undefined>;
  getVesselByImo(imo: string): Promise<Vessel | undefined>;
  createVessel(vessel: InsertVessel): Promise<Vessel>;
  updateVessel(id: number, vessel: Partial<InsertVessel>): Promise<Vessel | undefined>;
  deleteVessel(id: number): Promise<boolean>;
  
  // Vessel trail operations
  getVesselTrail(vesselId: number): Promise<VesselTrail[]>;
  addVesselTrailPoint(trail: InsertVesselTrail): Promise<VesselTrail>;
  
  // Geofence operations
  getGeofences(): Promise<Geofence[]>;
  createGeofence(geofence: InsertGeofence): Promise<Geofence>;
  updateGeofence(id: number, geofence: Partial<InsertGeofence>): Promise<Geofence | undefined>;
  deleteGeofence(id: number): Promise<boolean>;
  
  // Alert operations
  getAlerts(): Promise<Alert[]>;
  getVesselAlerts(vesselId: number): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  updateAlert(id: number, alert: Partial<InsertAlert>): Promise<Alert | undefined>;
  deleteAlert(id: number): Promise<boolean>;
  
  // Search operations
  searchVessels(query: string): Promise<Vessel[]>;
  filterVessels(filters: { type?: string; status?: string }): Promise<Vessel[]>;
}

export class MemStorage implements IStorage {
  private vessels: Map<number, Vessel> = new Map();
  private vesselTrails: Map<number, VesselTrail[]> = new Map();
  private geofences: Map<number, Geofence> = new Map();
  private alerts: Map<number, Alert> = new Map();
  private currentVesselId = 1;
  private currentTrailId = 1;
  private currentGeofenceId = 1;
  private currentAlertId = 1;

  constructor() {
    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample vessels from major shipping routes worldwide
    const sampleVessels = [
      {
        imo: "IMO9123456",
        mmsi: "636012345",
        name: "Dubai Trader",
        type: "Container",
        flag: "UAE",
        length: 300,
        width: 45,
        status: "Under Way",
        speed: 12.5,
        course: 45,
        heading: 45,
        latitude: 25.2048,
        longitude: 55.2708,
        destination: "Port of Dubai",
        eta: new Date(Date.now() + 3600000),
        riskLevel: "low",
        riskAssessment: "Normal operations, no risk factors identified"
      },
      {
        imo: "IMO9234567",
        mmsi: "235067890",
        name: "Atlantic Crossing",
        type: "Container",
        flag: "UK",
        length: 320,
        width: 48,
        status: "Under Way",
        speed: 18.3,
        course: 90,
        heading: 90,
        latitude: 51.5074,
        longitude: -0.1278,
        destination: "Port of Rotterdam",
        eta: new Date(Date.now() + 14400000),
        riskLevel: "low",
        riskAssessment: "Transatlantic crossing, weather conditions normal"
      },
      {
        imo: "IMO9345678",
        mmsi: "311012345",
        name: "Pacific Explorer",
        type: "Tanker",
        flag: "USA",
        length: 280,
        width: 50,
        status: "Under Way",
        speed: 14.7,
        course: 270,
        heading: 270,
        latitude: 37.7749,
        longitude: -122.4194,
        destination: "Port of Los Angeles",
        eta: new Date(Date.now() + 21600000),
        riskLevel: "medium",
        riskAssessment: "High-value cargo, increased security protocols"
      },
      {
        imo: "IMO9456789",
        mmsi: "440123456",
        name: "Asia Star",
        type: "Container",
        flag: "Japan",
        length: 350,
        width: 52,
        status: "Under Way",
        speed: 16.8,
        course: 135,
        heading: 135,
        latitude: 35.6762,
        longitude: 139.6503,
        destination: "Port of Singapore",
        eta: new Date(Date.now() + 172800000),
        riskLevel: "low",
        riskAssessment: "Major shipping route, normal operations"
      },
      {
        imo: "IMO9567890",
        mmsi: "477123456",
        name: "Mediterranean Queen",
        type: "Passenger",
        flag: "Italy",
        length: 250,
        width: 40,
        status: "Under Way",
        speed: 10.8,
        course: 180,
        heading: 180,
        latitude: 41.9028,
        longitude: 12.4964,
        destination: "Port of Barcelona",
        eta: new Date(Date.now() + 86400000),
        riskLevel: "low",
        riskAssessment: "Mediterranean cruise, normal operations"
      },
      {
        imo: "IMO9678901",
        mmsi: "538123456",
        name: "Caribbean Explorer",
        type: "Cargo",
        flag: "Marshall Islands",
        length: 180,
        width: 28,
        status: "Anchored",
        speed: 0,
        course: 0,
        heading: 0,
        latitude: 25.7617,
        longitude: -80.1918,
        destination: "Port of Miami",
        eta: new Date(Date.now() + 7200000),
        riskLevel: "low",
        riskAssessment: "Awaiting berth assignment"
      },
      {
        imo: "IMO9789012",
        mmsi: "341123456",
        name: "Nordic Voyager",
        type: "Tanker",
        flag: "Norway",
        length: 290,
        width: 48,
        status: "Under Way",
        speed: 13.2,
        course: 225,
        heading: 225,
        latitude: 59.9139,
        longitude: 10.7522,
        destination: "Port of Stockholm",
        eta: new Date(Date.now() + 28800000),
        riskLevel: "medium",
        riskAssessment: "Fuel transport, cold weather conditions"
      }
    ];

    // Create vessels
    sampleVessels.forEach(vesselData => {
      const vessel: Vessel = {
        ...vesselData,
        id: this.currentVesselId++,
        lastUpdate: new Date(),
        length: vesselData.length ?? null,
        width: vesselData.width ?? null,
        heading: vesselData.heading ?? null,
        course: vesselData.course ?? null,
        flag: vesselData.flag ?? null,
        destination: vesselData.destination ?? null,
        eta: vesselData.eta ?? null,
        riskAssessment: vesselData.riskAssessment ?? null,
        riskLevel: vesselData.riskLevel ?? "low",
      };
      this.vessels.set(vessel.id, vessel);

      // Add sample trail data
      const trail: VesselTrail[] = [];
      for (let i = 0; i < 5; i++) {
        const timestamp = new Date(Date.now() - (i * 600000)); // 10 minutes apart
        const latOffset = (Math.random() - 0.5) * 0.01;
        const lngOffset = (Math.random() - 0.5) * 0.01;
        
        trail.push({
          id: this.currentTrailId++,
          vesselId: vessel.id,
          latitude: vessel.latitude + latOffset,
          longitude: vessel.longitude + lngOffset,
          timestamp,
          speed: vessel.speed + (Math.random() - 0.5) * 2,
          heading: vessel.heading ? vessel.heading + (Math.random() - 0.5) * 20 : null,
        });
      }
      this.vesselTrails.set(vessel.id, trail);
    });

    // Create sample geofences
    const sampleGeofences = [
      {
        name: "Dubai Port Authority Zone",
        type: "port",
        latitude: 25.2048,
        longitude: 55.2708,
        radius: 5000,
        isActive: true
      },
      {
        name: "Jebel Ali Port Zone",
        type: "port",
        latitude: 25.0964,
        longitude: 55.1336,
        radius: 7000,
        isActive: true
      },
      {
        name: "Dubai Marina Zone",
        type: "marina",
        latitude: 25.0769,
        longitude: 55.1413,
        radius: 2000,
        isActive: true
      }
    ];

    sampleGeofences.forEach(geofenceData => {
      const geofence: Geofence = {
        ...geofenceData,
        id: this.currentGeofenceId++,
      };
      this.geofences.set(geofence.id, geofence);
    });

    // Create sample alerts
    const sampleAlerts = [
      {
        vesselId: 1,
        type: "geofence",
        message: "Dubai Trader entered Dubai Port Authority Zone",
        severity: "info",
        isActive: true
      },
      {
        vesselId: 2,
        type: "security",
        message: "Gulf Princess requires security inspection",
        severity: "warning",
        isActive: true
      }
    ];

    sampleAlerts.forEach(alertData => {
      const alert: Alert = {
        ...alertData,
        id: this.currentAlertId++,
        createdAt: new Date(),
        vesselId: alertData.vesselId ?? null,
        isActive: alertData.isActive ?? true,
      };
      this.alerts.set(alert.id, alert);
    });
  }

  async getVessels(): Promise<Vessel[]> {
    return Array.from(this.vessels.values());
  }

  async getVesselById(id: number): Promise<Vessel | undefined> {
    return this.vessels.get(id);
  }

  async getVesselByMmsi(mmsi: string): Promise<Vessel | undefined> {
    return Array.from(this.vessels.values()).find(v => v.mmsi === mmsi);
  }

  async getVesselByImo(imo: string): Promise<Vessel | undefined> {
    return Array.from(this.vessels.values()).find(v => v.imo === imo);
  }

  async createVessel(insertVessel: InsertVessel): Promise<Vessel> {
    const vessel: Vessel = {
      ...insertVessel,
      id: this.currentVesselId++,
      lastUpdate: new Date(),
      length: insertVessel.length ?? null,
      width: insertVessel.width ?? null,
      heading: insertVessel.heading ?? null,
      flag: insertVessel.flag ?? null,
      destination: insertVessel.destination ?? null,
      eta: insertVessel.eta ?? null,
      riskAssessment: insertVessel.riskAssessment ?? null,
      riskLevel: insertVessel.riskLevel ?? "low",
    };
    this.vessels.set(vessel.id, vessel);
    return vessel;
  }

  async updateVessel(id: number, updates: Partial<InsertVessel>): Promise<Vessel | undefined> {
    const vessel = this.vessels.get(id);
    if (!vessel) return undefined;
    
    const updatedVessel: Vessel = {
      ...vessel,
      ...updates,
      lastUpdate: new Date(),
    };
    this.vessels.set(id, updatedVessel);
    return updatedVessel;
  }

  async deleteVessel(id: number): Promise<boolean> {
    return this.vessels.delete(id);
  }

  async getVesselTrail(vesselId: number): Promise<VesselTrail[]> {
    return this.vesselTrails.get(vesselId) || [];
  }

  async addVesselTrailPoint(trail: InsertVesselTrail): Promise<VesselTrail> {
    const trailPoint: VesselTrail = {
      ...trail,
      id: this.currentTrailId++,
      vesselId: trail.vesselId ?? null,
      speed: trail.speed ?? null,
      heading: trail.heading ?? null,
    };
    
    const vesselTrails = this.vesselTrails.get(trail.vesselId!) || [];
    vesselTrails.push(trailPoint);
    this.vesselTrails.set(trail.vesselId!, vesselTrails);
    
    return trailPoint;
  }

  async getGeofences(): Promise<Geofence[]> {
    return Array.from(this.geofences.values());
  }

  async createGeofence(insertGeofence: InsertGeofence): Promise<Geofence> {
    const geofence: Geofence = {
      ...insertGeofence,
      id: this.currentGeofenceId++,
      isActive: insertGeofence.isActive ?? true,
    };
    this.geofences.set(geofence.id, geofence);
    return geofence;
  }

  async updateGeofence(id: number, updates: Partial<InsertGeofence>): Promise<Geofence | undefined> {
    const geofence = this.geofences.get(id);
    if (!geofence) return undefined;
    
    const updatedGeofence: Geofence = { ...geofence, ...updates };
    this.geofences.set(id, updatedGeofence);
    return updatedGeofence;
  }

  async deleteGeofence(id: number): Promise<boolean> {
    return this.geofences.delete(id);
  }

  async getAlerts(): Promise<Alert[]> {
    return Array.from(this.alerts.values());
  }

  async getVesselAlerts(vesselId: number): Promise<Alert[]> {
    return Array.from(this.alerts.values()).filter(a => a.vesselId === vesselId);
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const alert: Alert = {
      ...insertAlert,
      id: this.currentAlertId++,
      createdAt: new Date(),
      vesselId: insertAlert.vesselId ?? null,
      isActive: insertAlert.isActive ?? true,
    };
    this.alerts.set(alert.id, alert);
    return alert;
  }

  async updateAlert(id: number, updates: Partial<InsertAlert>): Promise<Alert | undefined> {
    const alert = this.alerts.get(id);
    if (!alert) return undefined;
    
    const updatedAlert: Alert = { ...alert, ...updates };
    this.alerts.set(id, updatedAlert);
    return updatedAlert;
  }

  async deleteAlert(id: number): Promise<boolean> {
    return this.alerts.delete(id);
  }

  async searchVessels(query: string): Promise<Vessel[]> {
    const vessels = Array.from(this.vessels.values());
    const lowercaseQuery = query.toLowerCase();
    
    return vessels.filter(v => 
      v.name.toLowerCase().includes(lowercaseQuery) ||
      v.imo.toLowerCase().includes(lowercaseQuery) ||
      v.mmsi.toLowerCase().includes(lowercaseQuery)
    );
  }

  async filterVessels(filters: { type?: string; status?: string }): Promise<Vessel[]> {
    const vessels = Array.from(this.vessels.values());
    
    return vessels.filter(v => {
      if (filters.type && v.type !== filters.type) return false;
      if (filters.status && v.status !== filters.status) return false;
      return true;
    });
  }
}

export const storage = new MemStorage();
