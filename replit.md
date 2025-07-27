# CustomerHub - Customer Relationship Management System

## Overview

CustomerHub is a modern full-stack customer relationship management (CRM) application built with React, Express, and PostgreSQL. The system provides comprehensive customer management capabilities with real-time updates, analytics, and team collaboration features.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **UI Library**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with WebSocket support for real-time updates
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Session Management**: Connect-pg-simple for PostgreSQL session storage
- **Real-time Communication**: WebSocket server for live updates

### Data Storage
- **Primary Database**: PostgreSQL via Neon Database serverless connection
- **ORM**: Drizzle ORM with schema-first approach
- **Migrations**: Drizzle Kit for database schema management
- **Validation**: Zod schemas for runtime type checking and validation

## Key Components

### Database Schema
Located in `shared/schema.ts`:
- **customers**: Core customer information with status tracking
- **customerNotes**: Team notes and interactions
- **teamActivity**: Audit trail of all team actions
- **Validation Schemas**: Auto-generated insert schemas with Zod

### Frontend Components
- **Dashboard**: Main application interface with analytics overview
- **CustomerTable**: Sortable, filterable customer list with actions
- **CustomerModal**: Multi-mode modal for create/edit/view/note operations
- **AnalyticsCards**: Real-time metrics display
- **TeamActivityFeed**: Live activity stream
- **Sidebar**: Navigation with team member information

### Backend Services
- **Storage Layer**: Abstract storage interface with in-memory implementation
- **Route Handlers**: RESTful endpoints for CRUD operations
- **WebSocket Server**: Real-time update broadcasting
- **Analytics Service**: Customer metrics and reporting

## Data Flow

1. **Client Requests**: React components use TanStack Query for data fetching
2. **API Layer**: Express routes handle HTTP requests and WebSocket connections
3. **Business Logic**: Storage service manages data operations
4. **Database**: Drizzle ORM executes PostgreSQL queries
5. **Real-time Updates**: WebSocket broadcasts changes to all connected clients
6. **State Synchronization**: React Query automatically updates UI on data changes

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: PostgreSQL connection driver
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form state management
- **zod**: Schema validation and type inference

### UI Component Libraries
- **@radix-ui/***: Accessible UI primitives
- **lucide-react**: Icon library
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management

### Development Tools
- **vite**: Build tool and development server
- **tsx**: TypeScript execution for development
- **esbuild**: Production bundling for server code

## Deployment Strategy

### Development Environment
- **Frontend**: Vite dev server with HMR and error overlay
- **Backend**: tsx for TypeScript execution with auto-reload
- **Database**: Development database with Drizzle push for schema updates

### Production Build
- **Frontend**: Vite production build to `dist/public`
- **Backend**: esbuild bundle to `dist/index.js` with external packages
- **Static Assets**: Served directly by Express in production
- **Environment**: NODE_ENV=production with optimized configurations

### Database Management
- **Schema Evolution**: Drizzle migrations in `./migrations` directory
- **Connection**: Environment-based DATABASE_URL configuration
- **Sessions**: PostgreSQL-backed session storage for scalability

### Key Architectural Decisions

**Monorepo Structure**: Shared types and schemas between client and server reduce duplication and ensure type safety across the full stack.

**Real-time Updates**: WebSocket integration provides immediate UI updates when data changes, improving user experience and team collaboration.

**Type Safety**: End-to-end TypeScript with Zod validation ensures runtime type safety and reduces bugs in production.

**Component Architecture**: Modular React components with shadcn/ui provide consistent, accessible, and maintainable UI patterns.

**Database Design**: Drizzle ORM with PostgreSQL provides type-safe database operations while maintaining SQL flexibility and performance.