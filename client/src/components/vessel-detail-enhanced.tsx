import React, { useState, useEffect } from 'react';
import { VesselData } from '@/types/vessel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Ship, 
  MapPin, 
  Clock, 
  Activity,
  BarChart3,
  Route,
  AlertTriangle,
  TrendingUp,
  Fuel,
  Timer,
  Navigation
} from 'lucide-react';

interface VesselDetailEnhancedProps {
  vessel: VesselData;
  onClose: () => void;
}

interface ETAPrediction {
  vesselId: number;
  destination: string;
  estimatedArrival: Date;
  confidence: number;
  remainingDistance: number;
  averageSpeed: number;
  weatherImpact: number;
}

interface HistoricalAnalysis {
  vesselId: number;
  vesselName: string;
  totalDistance: number;
  averageSpeed: number;
  maxSpeed: number;
  minSpeed: number;
  routeEfficiency: number;
  portsVisited: string[];
  timeAtPorts: { [port: string]: number };
}

interface PerformanceMetrics {
  fuelEfficiency: number;
  onTimePerformance: number;
  routeAdherence: number;
  averagePortTime: number;
}

export default function VesselDetailEnhanced({ vessel, onClose }: VesselDetailEnhancedProps) {
  const [etaPrediction, setEtaPrediction] = useState<ETAPrediction | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalAnalysis | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVesselData();
  }, [vessel.id]);

  const loadVesselData = async () => {
    setLoading(true);
    try {
      const [etaResponse, historyResponse, performanceResponse] = await Promise.all([
        fetch(`/api/vessels/${vessel.id}/eta`),
        fetch(`/api/vessels/${vessel.id}/history`),
        fetch(`/api/vessels/${vessel.id}/performance`),
      ]);

      if (etaResponse.ok) {
        const eta = await etaResponse.json();
        setEtaPrediction(eta);
      }

      if (historyResponse.ok) {
        const history = await historyResponse.json();
        setHistoricalData(history);
      }

      if (performanceResponse.ok) {
        const performance = await performanceResponse.json();
        setPerformanceMetrics(performance);
      }
    } catch (error) {
      console.error('Error loading vessel data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Under Way': return 'bg-green-500';
      case 'Anchored': return 'bg-yellow-500';
      case 'Moored': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Ship className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{vessel.name}</h2>
            <p className="text-sm text-gray-600">IMO: {vessel.imo} • MMSI: {vessel.mmsi}</p>
          </div>
        </div>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="eta">ETA & Route</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Current Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <Badge className={`${getStatusColor(vessel.status)} text-white`}>
                    {vessel.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Speed</span>
                  <span className="font-medium">{vessel.speed.toFixed(1)} kn</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Heading</span>
                  <span className="font-medium">{vessel.heading || 'N/A'}°</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Course</span>
                  <span className="font-medium">{vessel.course || 'N/A'}°</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Position
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Latitude</span>
                  <span className="font-medium">{vessel.latitude.toFixed(6)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Longitude</span>
                  <span className="font-medium">{vessel.longitude.toFixed(6)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Destination</span>
                  <span className="font-medium">{vessel.destination || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Update</span>
                  <span className="font-medium">{formatDate(vessel.lastUpdate)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Risk Level</span>
                <Badge className={`${getRiskLevelColor(vessel.riskLevel)} text-white`}>
                  {vessel.riskLevel.toUpperCase()}
                </Badge>
              </div>
              {vessel.riskAssessment && (
                <div className="mt-2">
                  <span className="text-sm text-gray-600">Assessment</span>
                  <p className="text-sm mt-1">{vessel.riskAssessment}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="eta" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading ETA data...</div>
          ) : etaPrediction ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    ETA Prediction
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Destination</span>
                    <span className="font-medium">{etaPrediction.destination}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Estimated Arrival</span>
                    <span className="font-medium">{formatDate(etaPrediction.estimatedArrival)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Confidence</span>
                    <span className="font-medium">{(etaPrediction.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Remaining Distance</span>
                    <span className="font-medium">{etaPrediction.remainingDistance.toFixed(1)} km</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Navigation className="h-5 w-5 mr-2" />
                    Route Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Average Speed</span>
                    <span className="font-medium">{etaPrediction.averageSpeed.toFixed(1)} kn</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Weather Impact</span>
                    <span className="font-medium">{etaPrediction.weatherImpact.toFixed(1)}h delay</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              ETA prediction not available for this vessel
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading historical data...</div>
          ) : historicalData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Movement Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Distance</span>
                    <span className="font-medium">{historicalData.totalDistance.toFixed(1)} km</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Average Speed</span>
                    <span className="font-medium">{historicalData.averageSpeed.toFixed(1)} kn</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Max Speed</span>
                    <span className="font-medium">{historicalData.maxSpeed.toFixed(1)} kn</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Route Efficiency</span>
                    <span className="font-medium">{historicalData.routeEfficiency.toFixed(1)}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Port Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Ports Visited</span>
                    <span className="font-medium">{historicalData.portsVisited.length}</span>
                  </div>
                  <div className="space-y-2">
                    {historicalData.portsVisited.slice(0, 3).map((port, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{port}</span>
                        <span className="text-sm font-medium">
                          {(historicalData.timeAtPorts[port] || 0).toFixed(1)}h
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Historical data not available for this vessel
            </div>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading performance data...</div>
          ) : performanceMetrics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Fuel className="h-5 w-5 mr-2" />
                    Efficiency Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Fuel Efficiency</span>
                    <span className="font-medium">{performanceMetrics.fuelEfficiency.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Route Adherence</span>
                    <span className="font-medium">{performanceMetrics.routeAdherence.toFixed(1)}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Timer className="h-5 w-5 mr-2" />
                    Time Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">On-Time Performance</span>
                    <span className="font-medium">{performanceMetrics.onTimePerformance.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Average Port Time</span>
                    <span className="font-medium">{performanceMetrics.averagePortTime.toFixed(1)}h</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Performance metrics not available for this vessel
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Advanced Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Advanced analytics and predictive insights coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}