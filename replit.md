# Overview

REACH+ is a disaster response and communication support system designed to help young people during emergency situations, particularly earthquakes. The application provides real-time network monitoring, social media sentiment analysis, emergency alerts, and AI-powered natural language chat assistance. It combines a React frontend with an Express.js backend to deliver location-aware emergency services and communication tools.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Custom component library built on Radix UI primitives with shadcn/ui styling system
- **Styling**: Tailwind CSS with custom CSS variables for consistent theming and responsive design
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **PWA Features**: Service worker implementation for offline functionality with cached emergency data

## Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JSON responses and comprehensive error handling
- **Development Setup**: Hot reload with Vite integration in development mode
- **Build Process**: ESBuild for production bundling with platform-specific optimizations

## Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema evolution
- **Connection**: Neon Database serverless PostgreSQL for cloud hosting
- **Development Storage**: In-memory storage implementation for development and testing

## Authentication and Authorization
- **Session Management**: Connect-pg-simple for PostgreSQL-backed session storage
- **User Management**: UUID-based user identification with profile preferences
- **Security**: Express middleware for request logging and error handling

## External Service Integrations
- **AI Services**: OpenAI GPT-4 integration for natural language processing and sentiment analysis
- **Geolocation**: Browser Geolocation API with fallback mock data for location services
- **Real-time Updates**: Polling-based updates for network status and social media insights
- **Emergency Services**: Direct integration with Turkish emergency contact numbers (112, 110, 155)

## Background Services
- **Network Monitor**: Automated service that tracks cellular network coverage and signal strength across different operators and locations
- **Social Media Analyzer**: Sentiment analysis service that processes Turkish language keywords related to disasters, help requests, and network issues
- **Emergency Alert System**: Real-time alert broadcasting for critical situations with severity levels

## Development Tools
- **Type Safety**: Zod for runtime validation and Drizzle-Zod for database schema validation
- **Code Quality**: TypeScript strict mode with comprehensive type checking
- **Development Experience**: Replit-specific plugins for error handling and code mapping

# External Dependencies

## Core Framework Dependencies
- **@tanstack/react-query**: Server state management and caching
- **express**: Web application framework for Node.js
- **react**: Frontend UI library with hooks
- **vite**: Fast build tool and development server

## Database and ORM
- **drizzle-orm**: Type-safe ORM for PostgreSQL operations
- **@neondatabase/serverless**: Serverless PostgreSQL database client
- **connect-pg-simple**: PostgreSQL session store for Express

## UI and Styling
- **@radix-ui/***: Comprehensive set of accessible UI components
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe variant management for components
- **lucide-react**: Icon library with React components

## AI and Natural Language Processing
- **openai**: Official OpenAI API client for GPT-4 integration
- **drizzle-zod**: Zod integration for database schema validation

## Development and Build Tools
- **tsx**: TypeScript execution environment for development
- **esbuild**: Fast JavaScript bundler for production builds
- **@replit/vite-plugin-runtime-error-modal**: Development error handling
- **wouter**: Minimalist routing library for React

## Utility Libraries
- **date-fns**: Date manipulation and formatting
- **clsx**: Conditional className utility
- **nanoid**: URL-safe unique string ID generator