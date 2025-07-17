import { WebSocket } from 'ws';
import { storage } from './storage';
import { insertVesselSchema, type InsertVessel } from '@shared/schema';

export interface AISVesselData {
  mmsi: string;
  name?: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  course?: number;
  status?: string;
  type?: string;
  flag?: string;
  length?: number;
  width?: number;
  destination?: string;
  eta?: Date;
  timestamp: number;
}

export class AISStreamService {
  private ws: WebSocket | null = null;
  private apiKey: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private vesselDataCache = new Map<string, AISVesselData>();
  private broadcastCallback?: (data: any) => void;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  setBroadcastCallback(callback: (data: any) => void) {
    this.broadcastCallback = callback;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.apiKey) {
        reject(new Error('AISstream API key not provided'));
        return;
      }

      try {
        this.ws = new WebSocket('wss://stream.aisstream.io/v0/stream');
        
        this.ws.onopen = () => {
          console.log('Connected to AISstream API');
          this.reconnectAttempts = 0;
          this.subscribe();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Error parsing AISstream message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('AISstream WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('AISstream connection closed');
          this.handleReconnect();
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  private subscribe() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const subscribeMessage = {
      APIKey: this.apiKey,
      BoundingBoxes: [
        [[-90, -180], [90, 180]] // Global coverage
      ],
      FiltersShipAndCargo: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
      FilterMessageTypes: ['PositionReport', 'ShipAndCargoData']
    };

    this.ws.send(JSON.stringify(subscribeMessage));
  }

  private async handleMessage(data: any) {
    if (!data.Message) return;

    const message = data.Message;
    const mmsi = message.PositionReport?.UserID?.toString() || message.ShipAndCargoData?.UserID?.toString();
    
    if (!mmsi) return;

    let vesselData = this.vesselDataCache.get(mmsi) || {
      mmsi,
      latitude: 0,
      longitude: 0,
      timestamp: Date.now()
    };

    // Handle position reports
    if (message.PositionReport) {
      const positionReport = message.PositionReport;
      vesselData = {
        ...vesselData,
        latitude: positionReport.Latitude,
        longitude: positionReport.Longitude,
        speed: positionReport.SpeedOverGround || 0,
        heading: positionReport.TrueHeading || undefined,
        course: positionReport.CourseOverGround || undefined,
        status: this.getStatusFromCode(positionReport.NavigationalStatus),
        timestamp: new Date(data.MetaData.time_utc).getTime()
      };
    }

    // Handle ship and cargo data
    if (message.ShipAndCargoData) {
      const shipData = message.ShipAndCargoData;
      vesselData = {
        ...vesselData,
        name: shipData.VesselName?.trim() || `Vessel ${mmsi}`,
        type: this.getVesselType(shipData.Type),
        flag: shipData.CallSign || undefined,
        length: shipData.Dimension?.A + shipData.Dimension?.B || undefined,
        width: shipData.Dimension?.C + shipData.Dimension?.D || undefined,
        destination: shipData.Destination?.trim() || undefined,
        eta: shipData.ETA ? new Date(shipData.ETA * 1000) : undefined,
        timestamp: new Date(data.MetaData.time_utc).getTime()
      };
    }

    // Cache the vessel data
    this.vesselDataCache.set(mmsi, vesselData);

    // Only create/update vessel if we have position data
    if (vesselData.latitude && vesselData.longitude) {
      await this.createOrUpdateVessel(vesselData);
    }
  }

  private async createOrUpdateVessel(vesselData: AISVesselData) {
    try {
      // Check if vessel already exists
      const existingVessel = await storage.getVesselByMmsi(vesselData.mmsi);
      
      const vesselInsertData: InsertVessel = {
        imo: `IMO${vesselData.mmsi}`, // Generate IMO from MMSI for AIS data
        mmsi: vesselData.mmsi,
        name: vesselData.name || `Vessel ${vesselData.mmsi}`,
        type: vesselData.type || 'Unknown',
        flag: vesselData.flag || null,
        length: vesselData.length || null,
        width: vesselData.width || null,
        status: vesselData.status || 'Unknown',
        speed: vesselData.speed || 0,
        heading: vesselData.heading || null,
        course: vesselData.course || null,
        latitude: vesselData.latitude,
        longitude: vesselData.longitude,
        destination: vesselData.destination || null,
        eta: vesselData.eta || null,
        riskLevel: 'low',
        riskAssessment: 'Real-time AIS data'
      };

      let vessel;
      if (existingVessel) {
        vessel = await storage.updateVessel(existingVessel.id, vesselInsertData);
        
        // Add trail point
        await storage.addVesselTrailPoint({
          vesselId: existingVessel.id,
          latitude: vesselData.latitude,
          longitude: vesselData.longitude,
          timestamp: new Date(vesselData.timestamp),
          speed: vesselData.speed || null,
          heading: vesselData.heading || null
        });

        // Check for geofence violations
        const { geofencingService } = await import('./geofencing-service');
        await geofencingService.processVesselUpdate(vessel);

        // Broadcast update
        if (this.broadcastCallback) {
          this.broadcastCallback({ type: 'vessel_updated', vessel });
        }
      } else {
        vessel = await storage.createVessel(vesselInsertData);
        
        // Check for geofence violations
        const { geofencingService } = await import('./geofencing-service');
        await geofencingService.processVesselUpdate(vessel);
        
        // Broadcast new vessel
        if (this.broadcastCallback) {
          this.broadcastCallback({ type: 'vessel_added', vessel });
        }
      }

    } catch (error) {
      console.error('Error creating/updating vessel:', error);
    }
  }

  private getStatusFromCode(code: number): string {
    const statusMap: { [key: number]: string } = {
      0: 'Under Way',
      1: 'Anchored',
      2: 'Not Under Command',
      3: 'Restricted Manoeuvrability',
      4: 'Constrained by Draught',
      5: 'Moored',
      6: 'Aground',
      7: 'Engaged in Fishing',
      8: 'Under Way Sailing',
      15: 'Undefined'
    };
    
    return statusMap[code] || 'Unknown';
  }

  private getVesselType(typeCode: number): string {
    const typeMap: { [key: number]: string } = {
      1: 'Passenger',
      2: 'Cargo',
      3: 'Tanker',
      4: 'Container',
      5: 'Fishing',
      6: 'Tug',
      7: 'Other',
      8: 'Other',
      9: 'Other'
    };
    
    return typeMap[typeCode] || 'Other';
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Attempting to reconnect to AISstream in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(console.error);
      }, delay);
    } else {
      console.log('Max reconnection attempts reached for AISstream');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}