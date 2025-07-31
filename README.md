# Portfolio Dashboard

A comprehensive financial management platform that enables users to track, analyze, and optimize their multi-asset investment portfolios through advanced data integration and interactive user experiences.

## Features

### 🏦 Multi-Asset Portfolio Tracking
- **Traditional Investments**: Stocks, ETFs, bonds, and cash positions
- **Real Estate**: Property investments with ROI calculations and rental income tracking
- **Venture/Angel Investments**: Startup investments with valuation and exit tracking
- **Cryptocurrency**: Digital asset portfolio management

### 🔗 Universal Financial Integration
- **Plaid Integration**: Connect to 12,000+ financial institutions including E*TRADE, Schwab, Fidelity, Chase, Bank of America
- **E*TRADE Direct API**: Native integration for advanced trading features and real-time data
- **Secure OAuth Flows**: Industry-standard authentication and data protection

### 📊 Advanced Analytics & Visualization
- Real-time portfolio allocation charts
- Performance tracking with time-based returns
- Account-level performance analysis
- Comprehensive AUM (Assets Under Management) summaries

### 🔒 Privacy-First Design
- Global privacy toggle for all financial values
- Individual category privacy controls
- Account-level balance visibility settings
- Secure data handling with encrypted storage

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and production builds
- **Tailwind CSS** with shadcn/ui components
- **TanStack Query** for server state management
- **Wouter** for client-side routing
- **Recharts** for data visualization

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** with Drizzle ORM
- **Neon Database** for cloud storage
- **RESTful API** design with comprehensive endpoints

### Development & Deployment
- **Node.js** runtime environment
- **ESBuild** for production bundling
- **Drizzle Kit** for database migrations
- **Replit** deployment ready

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Plaid API credentials (optional)
- E*TRADE API credentials (optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/portfolio-dashboard.git
cd portfolio-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Required
DATABASE_URL=your_postgresql_connection_string

# Optional - for Plaid integration
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret_key

# Optional - for E*TRADE integration
ETRADE_CONSUMER_KEY=your_etrade_consumer_key
ETRADE_CONSUMER_SECRET=your_etrade_consumer_secret
```

4. Run database migrations:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

Visit `http://localhost:5000` to see your portfolio dashboard.

## API Endpoints

### Portfolio Management
- `GET /api/portfolio/summary` - Comprehensive portfolio overview
- `POST /api/portfolio/refresh` - Refresh all portfolio data

### Account Management
- `GET /api/accounts` - List all connected accounts
- `POST /api/accounts` - Create new account connection
- `DELETE /api/accounts/:id` - Remove account connection

### Investment Tracking
- `GET /api/holdings` - All investment holdings
- `GET /api/real-estate` - Real estate investments
- `GET /api/venture` - Venture/angel investments
- `GET /api/activities` - Transaction history

## Integration Guides

### Plaid Setup
1. Sign up at [Plaid Dashboard](https://dashboard.plaid.com)
2. Get your Client ID and Secret Key
3. Add redirect URI: `https://your-domain.com/api/plaid/oauth-redirect`
4. Configure environment variables

### E*TRADE Setup
1. Register for E*TRADE Developer Portal
2. Create application and get API keys
3. Configure OAuth redirect URLs
4. Set up production vs sandbox environments

## Database Schema

The application uses five main entities:

- **Accounts**: Financial account information and connection status
- **Holdings**: Individual investments within accounts
- **Activities**: Transaction and system events
- **Real Estate Investments**: Property investment tracking
- **Venture Investments**: Startup/angel investment management

## Security Features

- Encrypted API token storage
- Secure OAuth implementation
- Privacy controls for sensitive data
- Database-level data protection

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Deployment

The application is optimized for deployment on:
- Replit (recommended)
- Vercel
- Netlify
- Railway
- Any Node.js hosting platform

For production deployment, ensure all environment variables are properly configured and the database is accessible.

## Support

If you encounter any issues or have questions:
1. Check the [Issues](https://github.com/yourusername/portfolio-dashboard/issues) page
2. Create a new issue with detailed information
3. Review the documentation in the `replit.md` file

---

Built with ❤️ for comprehensive financial portfolio management.