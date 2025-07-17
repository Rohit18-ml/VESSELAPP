import { AISMessage } from '../types/vessel';

export class AISStreamService {
  private ws: WebSocket | null = null;
  private apiKey: string;
  private callbacks: Map<string, (data: AISMessage) => void> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.apiKey = import.meta.env.VITE_AISSTREAM_API_KEY || '';
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.apiKey) {
        reject(new Error('AISstream API key not provided'));
        return;
      }

      try {
        this.ws = new WebSocket('wss://stream.aisstream.io/v0/stream');
        
        this.ws.onopen = () => {
          console.log('Connected to AISstream');
          this.reconnectAttempts = 0;
          
          // Subscribe to vessel position updates
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
        // Arabian Gulf region
        [
          [24.0, 54.0], // Southwest corner
          [27.0, 57.0]  // Northeast corner
        ]
      ],
      FiltersShipAndCargo: ['1', '2', '3', '4', '5', '6', '7', '8', '9'], // All vessel types
      FilterMessageTypes: ['PositionReport', 'ShipAndCargoData']
    };

    this.ws.send(JSON.stringify(subscribeMessage));
  }

  private handleMessage(data: any) {
    if (!data.Message) return;

    const message = data.Message;
    
    // Handle position reports
    if (message.PositionReport) {
      const positionReport = message.PositionReport;
      const aisMessage: AISMessage = {
        type: 'vessel_position',
        mmsi: positionReport.UserID.toString(),
        latitude: positionReport.Latitude,
        longitude: positionReport.Longitude,
        speed: positionReport.SpeedOverGround,
        heading: positionReport.TrueHeading,
        status: this.getStatusFromCode(positionReport.NavigationalStatus),
        timestamp: new Date(data.MetaData.time_utc).getTime()
      };
      
      this.notifyCallbacks('vessel_position', aisMessage);
    }

    // Handle ship and cargo data
    if (message.ShipAndCargoData) {
      const shipData = message.ShipAndCargoData;
      const aisMessage: AISMessage = {
        type: 'vessel_data',
        mmsi: shipData.UserID.toString(),
        name: shipData.VesselName?.trim(),
        latitude: 0, // Will be updated from position reports
        longitude: 0,
        timestamp: new Date(data.MetaData.time_utc).getTime()
      };
      
      this.notifyCallbacks('vessel_data', aisMessage);
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

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Attempting to reconnect to AISstream in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(console.error);
      }, delay);
    } else {
      console.error('Max reconnection attempts reached for AISstream');
    }
  }

  onMessage(type: string, callback: (data: AISMessage) => void) {
    this.callbacks.set(type, callback);
  }

  private notifyCallbacks(type: string, data: AISMessage) {
    const callback = this.callbacks.get(type);
    if (callback) {
      callback(data);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.callbacks.clear();
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const aisStreamService = new AISStreamService();
