import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertVesselSchema, insertGeofenceSchema, insertAlertSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store connected clients
  const clients = new Set<WebSocket>();
  
  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('Client connected to WebSocket');
    
    ws.on('close', () => {
      clients.delete(ws);
      console.log('Client disconnected from WebSocket');
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });
  
  // Broadcast to all connected clients
  const broadcast = (data: any) => {
    const message = JSON.stringify(data);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  // Vessel routes
  app.get('/api/vessels', async (req, res) => {
    try {
      const vessels = await storage.getVessels();
      res.json(vessels);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch vessels' });
    }
  });

  app.get('/api/vessels/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const vessel = await storage.getVesselById(id);
      if (!vessel) {
        return res.status(404).json({ error: 'Vessel not found' });
      }
      res.json(vessel);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch vessel' });
    }
  });

  app.post('/api/vessels', async (req, res) => {
    try {
      const vesselData = insertVesselSchema.parse(req.body);
      const vessel = await storage.createVessel(vesselData);
      
      // Broadcast new vessel to all clients
      broadcast({ type: 'vessel_added', vessel });
      
      res.status(201).json(vessel);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid vessel data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create vessel' });
      }
    }
  });

  app.put('/api/vessels/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertVesselSchema.partial().parse(req.body);
      const vessel = await storage.updateVessel(id, updates);
      
      if (!vessel) {
        return res.status(404).json({ error: 'Vessel not found' });
      }
      
      // Broadcast vessel update to all clients
      broadcast({ type: 'vessel_updated', vessel });
      
      res.json(vessel);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid vessel data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to update vessel' });
      }
    }
  });

  app.delete('/api/vessels/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteVessel(id);
      
      if (!success) {
        return res.status(404).json({ error: 'Vessel not found' });
      }
      
      // Broadcast vessel deletion to all clients
      broadcast({ type: 'vessel_deleted', vesselId: id });
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete vessel' });
    }
  });

  // Vessel trail routes
  app.get('/api/vessels/:id/trail', async (req, res) => {
    try {
      const vesselId = parseInt(req.params.id);
      const trail = await storage.getVesselTrail(vesselId);
      res.json(trail);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch vessel trail' });
    }
  });

  // Search and filter routes
  app.get('/api/vessels/search', async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
      }
      
      const vessels = await storage.searchVessels(query);
      res.json(vessels);
    } catch (error) {
      res.status(500).json({ error: 'Failed to search vessels' });
    }
  });

  app.get('/api/vessels/filter', async (req, res) => {
    try {
      const filters = {
        type: req.query.type as string,
        status: req.query.status as string,
      };
      
      const vessels = await storage.filterVessels(filters);
      res.json(vessels);
    } catch (error) {
      res.status(500).json({ error: 'Failed to filter vessels' });
    }
  });

  // Geofence routes
  app.get('/api/geofences', async (req, res) => {
    try {
      const geofences = await storage.getGeofences();
      res.json(geofences);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch geofences' });
    }
  });

  app.post('/api/geofences', async (req, res) => {
    try {
      const geofenceData = insertGeofenceSchema.parse(req.body);
      const geofence = await storage.createGeofence(geofenceData);
      
      broadcast({ type: 'geofence_added', geofence });
      
      res.status(201).json(geofence);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid geofence data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create geofence' });
      }
    }
  });

  // Alert routes
  app.get('/api/alerts', async (req, res) => {
    try {
      const alerts = await storage.getAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch alerts' });
    }
  });

  app.post('/api/alerts', async (req, res) => {
    try {
      const alertData = insertAlertSchema.parse(req.body);
      const alert = await storage.createAlert(alertData);
      
      broadcast({ type: 'alert_created', alert });
      
      res.status(201).json(alert);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid alert data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create alert' });
      }
    }
  });

  // AISstream proxy endpoint
  app.post('/api/aisstream/connect', async (req, res) => {
    try {
      // This endpoint will be used by the frontend to initiate AISstream connection
      res.json({ message: 'AISstream connection initiated' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to connect to AISstream' });
    }
  });

  return httpServer;
}
