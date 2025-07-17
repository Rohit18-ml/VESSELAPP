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

### Database Schema
- **Vessels**: Core vessel information (IMO, MMSI, position, status, risk assessment)
- **Vessel Trail**: Historical position tracking for route visualization
- **Geofences**: Defined maritime zones with radius-based boundaries
- **Alerts**: Vessel-specific notifications and warnings

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
- **Real-time Tracking**: Live vessel position updates
- **Risk Assessment**: Automated vessel risk evaluation
- **Geofencing**: Maritime zone monitoring
- **Historical Data**: Vessel trail visualization
- **Alert System**: Configurable notifications
- **Export Functionality**: Data export capabilities
- **Mobile Responsive**: Cross-device compatibility

The system is designed for scalability with clear separation between client and server logic, making it easy to extend with additional features like advanced analytics, compliance reporting, or integration with other maritime systems.