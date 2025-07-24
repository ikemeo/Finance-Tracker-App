# Portfolio Dashboard Application

## Overview

This is a full-stack portfolio dashboard application built with React, Express, and PostgreSQL. The application provides a comprehensive view of financial accounts, holdings, and activities across multiple investment providers (E*TRADE, Robinhood, Fidelity). It features a modern UI built with shadcn/ui components and Tailwind CSS, with real-time data visualization and portfolio analytics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **UI Framework**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Charts**: Recharts for data visualization

The frontend follows a component-based architecture with reusable UI components, custom hooks, and a centralized query client for API interactions.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **Development**: tsx for TypeScript execution in development
- **Build**: esbuild for production bundling
- **Middleware**: Custom logging and error handling middleware

The backend uses a RESTful API design with route handlers that interface with a storage abstraction layer.

### Data Storage Solutions
- **Database**: PostgreSQL (configured for Neon Database)
- **ORM**: Drizzle ORM with schema-first approach
- **Schema Location**: `shared/schema.ts` for type sharing between client and server
- **Migrations**: Drizzle Kit for database migrations
- **Development Storage**: In-memory storage implementation for development/testing

The application uses a repository pattern with an `IStorage` interface that can be implemented for different storage backends.

### Authentication and Authorization
Currently, the application does not implement authentication. The API endpoints are open and rely on the assumption of a trusted environment. Session handling infrastructure is prepared with `connect-pg-simple` for future PostgreSQL-based session storage.

## Key Components

### Database Schema
Three main entities:
- **Accounts**: Financial account information (provider, type, balance, connection status)
- **Holdings**: Individual investments within accounts (stocks, ETFs, crypto, bonds, cash)
- **Activities**: Transaction and system events (buy/sell orders, syncs, errors)

### API Endpoints
- `GET /api/accounts` - List all accounts
- `GET /api/accounts/:id` - Get specific account
- `POST /api/accounts` - Create new account
- `GET /api/holdings` - List all holdings
- `GET /api/accounts/:id/holdings` - Get holdings for specific account
- `GET /api/activities` - List all activities
- `POST /api/portfolio/refresh` - Refresh portfolio data

### Frontend Components
- **Dashboard**: Main portfolio overview with summary cards and charts
- **AccountCard**: Individual account balance and performance display
- **PortfolioChart**: Pie chart showing asset allocation
- **TopHoldings**: List of largest positions
- **AccountPerformance**: Table showing account-level performance
- **RecentActivity**: Feed of recent transactions and events
- **Sidebar**: Navigation and account management

## Data Flow

1. **Client Requests**: React components use TanStack Query to fetch data from API endpoints
2. **API Processing**: Express routes validate requests and call storage layer methods
3. **Storage Layer**: Abstracted storage interface handles data persistence
4. **Response**: Data flows back through the same chain with proper error handling
5. **UI Updates**: React Query automatically updates components when data changes

The application uses optimistic updates and automatic refetching to keep the UI responsive and current.

## External Dependencies

### UI and Styling
- **@radix-ui/react-***: Comprehensive set of accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **clsx**: Conditional className utility

### Data and API
- **@tanstack/react-query**: Server state management
- **drizzle-orm**: Type-safe SQL ORM
- **@neondatabase/serverless**: Neon Database connection
- **zod**: Runtime type validation

### Development Tools
- **vite**: Fast build tool and dev server
- **typescript**: Static type checking
- **@replit/vite-plugin-***: Replit-specific development enhancements

## Deployment Strategy

### Development
- Run with `npm run dev` using tsx for TypeScript execution
- Vite dev server provides HMR and fast rebuilds
- Database migrations applied with `npm run db:push`

### Production Build
- Frontend: Vite builds optimized static assets to `dist/public`
- Backend: esbuild bundles server code to `dist/index.js`
- Single deployment artifact with static file serving

### Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string (required)
- `NODE_ENV`: Environment mode (development/production)
- Build process automatically handles environment-specific optimizations

The application is designed for deployment on platforms like Replit, with built-in support for development banners and runtime error overlays in development mode.