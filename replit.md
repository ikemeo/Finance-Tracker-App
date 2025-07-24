# Portfolio Dashboard Application

## Overview

This is a comprehensive full-stack portfolio dashboard application built with React, Express, and PostgreSQL. The application provides a complete view of financial portfolios including traditional brokerage accounts (E*TRADE, Robinhood, Fidelity), real estate investments, and venture/angel investments. It features a modern UI built with shadcn/ui components and Tailwind CSS, with real-time data visualization and comprehensive portfolio analytics across all asset classes.

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
Five main entities:
- **Accounts**: Financial account information (provider, type, balance, connection status)
- **Holdings**: Individual investments within accounts (stocks, ETFs, crypto, bonds, cash)
- **Activities**: Transaction and system events (buy/sell orders, syncs, errors)
- **Real Estate Investments**: Property investments with details like purchase date, current value, loan terms, rental income, and ROI calculations
- **Venture Investments**: Startup/angel investments tracking company details, investment stage, ownership percentage, current valuation, and exit information

### API Endpoints
- `GET /api/accounts` - List all accounts
- `GET /api/accounts/:id` - Get specific account
- `POST /api/accounts` - Create new account
- `GET /api/holdings` - List all holdings
- `GET /api/accounts/:id/holdings` - Get holdings for specific account
- `GET /api/activities` - List all activities
- `GET /api/real-estate` - List all real estate investments
- `GET /api/real-estate/:id` - Get specific real estate investment
- `POST /api/real-estate` - Create new real estate investment
- `GET /api/venture` - List all venture investments
- `GET /api/venture/:id` - Get specific venture investment
- `POST /api/venture` - Create new venture investment
- `GET /api/portfolio/summary` - Get comprehensive portfolio summary including all asset types
- `POST /api/portfolio/refresh` - Refresh portfolio data

### Frontend Components
- **Dashboard**: Main portfolio overview with summary cards and charts covering all asset classes
- **AccountCard**: Individual account balance and performance display
- **PortfolioChart**: Pie chart showing asset allocation including alternative investments
- **TopHoldings**: List of largest positions from traditional accounts
- **AccountPerformance**: Table showing account-level performance
- **RecentActivity**: Feed of recent transactions and events
- **Sidebar**: Navigation with links to all investment types
- **RealEstateCard**: Detailed property investment card with ROI, rental income, and loan information
- **VentureCard**: Startup investment card with valuation, ownership, and exit tracking
- **RealEstatePage**: Dedicated page for managing property investments
- **VenturePage**: Dedicated page for managing venture/angel investments

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

## Recent Changes (January 2025)

### Added Real Estate Investment Tracking
- ✓ Created comprehensive real estate investment schema with property details, loan terms, and rental income
- ✓ Built real estate investment card component with ROI calculations and property type badges
- ✓ Added dedicated real estate page with grid layout for property management
- ✓ Integrated real estate values into portfolio summary and allocation charts

### Added Venture/Angel Investment Tracking  
- ✓ Created venture investment schema tracking company details, investment stages, ownership, and exits
- ✓ Built venture investment card component with current valuations and status tracking
- ✓ Added dedicated venture page for managing startup investments
- ✓ Integrated venture values into portfolio summary with exit tracking

### Enhanced Portfolio Dashboard
- ✓ Updated portfolio allocation chart to include real estate and venture categories
- ✓ Expanded summary cards to show Traditional, Real Estate, Venture/Angel, and Crypto breakdowns
- ✓ Enhanced sidebar navigation with dedicated pages for each investment type
- ✓ Updated portfolio summary API to calculate total AUM across all asset classes

### Account Management and Data Entry Features (January 24, 2025)
- ✓ Fixed account deletion with proper foreign key constraint handling
- ✓ Enhanced manual data entry interface with holdings management and category selection
- ✓ Implemented hardcoded E*TRADE API integration with mock data fallback for Replit environment
- ✓ Added four account management options: OAuth Sync, API Import (⚡), Manual Entry, and Delete
- ✓ Created comprehensive E*TRADE hardcoded service with real API structure and demo data
- ✓ Proper cleanup of existing holdings before importing new data to prevent duplicates

### Plaid Integration (January 24, 2025)
- ✓ Implemented complete Plaid Link integration using react-plaid-link
- ✓ Real Plaid interface opens for connecting to 12,000+ financial institutions
- ✓ Supports major brokerages: E*TRADE, Schwab, Fidelity, TD Ameritrade, Robinhood
- ✓ Supports major banks: Chase, Bank of America, Wells Fargo, Capital One
- ✓ Automatic account discovery, balance import, and investment holdings sync
- ✓ Secure OAuth flow through Plaid's encrypted interface
- ✓ Environment variable configuration for Plaid credentials (PLAID_CLIENT_ID, PLAID_SECRET)

The application now provides comprehensive financial data connectivity through both direct API integrations and Plaid's universal financial data platform, enabling users to connect virtually any financial institution securely.