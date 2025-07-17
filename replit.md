# Vessel Tracking System

## Overview

This is a maritime vessel tracking and monitoring system built with React, TypeScript, and Express. The application provides real-time vessel tracking, geofencing, alert management, and comprehensive vessel data visualization through an interactive map interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Map Integration**: Leaflet for interactive maritime maps
- **Real-time Updates**: WebSocket client for live vessel tracking

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time Communication**: WebSocket server for live updates
- **Storage**: In-memory storage implementation with interface for easy database migration
- **API Design**: RESTful endpoints with WebSocket enhancements
- **Microservices**: Modular service architecture for ETA prediction, geofencing, and historical analysis
- **External Integration**: AISstream API for real-time vessel data
- **Analytics Engine**: Advanced performance metrics and route optimization algorithms

### Database Schema
- **Vessels**: Core vessel information (IMO, MMSI, position, status, risk assessment, course data)
- **Vessel Trail**: Historical position tracking for route visualization with speed and heading data
- **Geofences**: Defined maritime zones with radius-based boundaries and type classification
- **Alerts**: Multi-level vessel notifications with geofence integration
- **Performance Metrics**: Historical vessel performance data and analytics
- **ETA Predictions**: Cached arrival predictions with confidence scoring

## Key Components

### Map System
- Interactive Leaflet map with vessel markers
- Real-time position updates via WebSocket
- Trail visualization showing vessel movement history
- Geofence overlays for maritime zones
- Custom vessel icons based on type and status

### Vessel Management
- Comprehensive vessel search and filtering
- Real-time vessel status monitoring
- Risk assessment and alert system
- Historical trail data visualization
- Export capabilities for vessel data

### Real-time Features
- WebSocket connection for live vessel updates
- AIS (Automatic Identification System) integration
- Real-time alerts and notifications
- Live status updates and position tracking

### UI/UX Components
- Responsive design using Tailwind CSS
- Maritime-themed color scheme
- shadcn/ui component library for consistent design
- Mobile-responsive interface
- Toast notifications for user feedback

## Data Flow

1. **Vessel Data Ingestion**: 
   - AIS data received via WebSocket connection
   - Data processed and stored in vessel records
   - Real-time updates broadcast to connected clients

2. **Client Updates**:
   - WebSocket connection maintains live data sync
   - React Query manages server state caching
   - Map components update vessel positions automatically

3. **Alert Processing**:
   - Geofence violations detected server-side
   - Risk assessments calculated based on vessel behavior
   - Notifications sent to relevant stakeholders

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database operations
- **ws**: WebSocket server implementation
- **leaflet**: Interactive map functionality
- **@tanstack/react-query**: Server state management

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **class-variance-authority**: Variant-based styling

### Development Tools
- **vite**: Development server and build tool
- **tsx**: TypeScript execution
- **drizzle-kit**: Database migration tool

## Deployment Strategy

### Build Process
1. Frontend built with Vite to static assets
2. Backend bundled with esbuild for Node.js runtime
3. Database migrations handled by Drizzle Kit
4. Environment-specific configurations

### Environment Configuration
- **Development**: Hot module replacement with Vite
- **Production**: Optimized static asset serving
- **Database**: PostgreSQL with connection pooling
- **WebSocket**: Real-time communication layer

### Key Features
- **Real-time Tracking**: Live vessel position updates with AIS data integration
- **Historical Tracking**: Comprehensive vessel movement analysis with port visits and route efficiency
- **ETA Predictions**: Advanced arrival time predictions with weather impact analysis
- **Geofencing**: Maritime zone monitoring with automated alerts and violation detection
- **Risk Assessment**: Automated vessel risk evaluation with real-time updates
- **Performance Analytics**: Fuel efficiency, route adherence, and operational metrics
- **Route Optimization**: AI-powered route suggestions for improved efficiency
- **Alert System**: Multi-level notifications for geofence violations and risk events
- **Export Functionality**: Data export capabilities for all vessel metrics
- **Mobile Responsive**: Cross-device compatibility with enhanced UI

## Recent Updates (January 2025)

### Major Features Implemented
- **Advanced ETA Prediction Service**: Machine learning-based arrival time predictions with weather impact analysis
- **Comprehensive Geofencing System**: Multi-zone monitoring with automated alert generation
- **Historical Tracking Analytics**: Route efficiency analysis, port visit tracking, and performance metrics
- **Enhanced Vessel Detail Modal**: Tabbed interface with ETA, history, performance, and analytics views
- **Performance Metrics Dashboard**: Fuel efficiency, route adherence, and operational KPIs
- **Route Optimization Engine**: AI-powered route suggestions for improved efficiency

### Technical Improvements
- **Service-Oriented Architecture**: Modular services for ETA prediction, geofencing, and historical analysis
- **Enhanced AIS Integration**: Real-time vessel data processing with geofence violation detection
- **Advanced Analytics Engine**: Performance metrics calculation and route optimization algorithms
- **Improved UI Components**: Enhanced vessel detail modal with comprehensive analytics

### API Enhancements
- **ETA Endpoints**: `/api/vessels/:id/eta` and `/api/eta/all` for arrival predictions
- **Historical Data**: `/api/vessels/:id/history` for movement analysis
- **Performance Metrics**: `/api/vessels/:id/performance` for operational data
- **Route Optimization**: `/api/vessels/:id/route-optimization` for efficiency suggestions
- **Geofence Alerts**: `/api/geofences/alerts` for violation monitoring

The system is designed for scalability with clear separation between client and server logic, making it easy to extend with additional features like advanced analytics, compliance reporting, or integration with other maritime systems. The new microservices architecture enables independent scaling of analytics and prediction services.