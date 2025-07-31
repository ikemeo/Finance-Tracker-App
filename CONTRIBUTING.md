# Contributing to Portfolio Dashboard

Thank you for your interest in contributing to Portfolio Dashboard! This document provides guidelines and information for contributors.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Set up the development environment (see README.md)
4. Create a new branch for your feature or bug fix

## Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Git

### Local Development
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

## Code Style and Standards

### TypeScript
- Use strict TypeScript configuration
- Prefer explicit types over `any`
- Use proper interfaces and type definitions

### React Components
- Use functional components with hooks
- Follow the existing component structure in `client/src/components`
- Use Tailwind CSS for styling
- Implement proper error boundaries

### Backend
- Follow RESTful API conventions
- Use proper HTTP status codes
- Implement comprehensive error handling
- Validate input data with Zod schemas

### Database
- Use Drizzle ORM for all database operations
- Define schemas in `shared/schema.ts`
- Never write raw SQL migrations
- Use `npm run db:push` for schema changes

## Architecture Guidelines

### Frontend Architecture
- Component-based design with reusable UI components
- TanStack Query for server state management
- Wouter for client-side routing
- Custom hooks for business logic

### Backend Architecture
- Express.js with middleware pattern
- Repository pattern with storage abstraction
- Comprehensive API endpoint design
- Secure authentication and authorization

### Data Flow
1. React components use TanStack Query
2. API routes validate requests with Zod
3. Storage layer handles data persistence
4. Responses include proper error handling

## Feature Development

### Adding New Investment Types
1. Update database schema in `shared/schema.ts`
2. Add API endpoints in `server/routes.ts`
3. Create UI components in `client/src/components`
4. Update portfolio calculations
5. Add tests for new functionality

### Integration Development
1. Research API documentation thoroughly
2. Implement secure OAuth flows
3. Add proper error handling
4. Test with sandbox environments first
5. Document integration setup

## Testing

### Manual Testing
- Test all major user flows
- Verify privacy controls work correctly
- Test integration connections
- Check responsive design

### Automated Testing
- Write unit tests for utility functions
- Test API endpoints with sample data
- Verify database operations
- Test component rendering

## Pull Request Process

1. **Branch Naming**: Use descriptive names like `feature/plaid-integration` or `fix/chart-display`

2. **Commit Messages**: Write clear, descriptive commit messages
   ```
   feat: add venture investment editing functionality
   fix: resolve portfolio allocation chart display issue
   docs: update integration setup guide
   ```

3. **Pull Request Description**:
   - Describe what changes you made
   - Explain why the changes were necessary
   - Include screenshots for UI changes
   - List any breaking changes

4. **Code Review**:
   - Ensure code follows project conventions
   - Test the changes locally
   - Verify no regressions are introduced
   - Check for security considerations

## Security Considerations

### Sensitive Data
- Never commit API keys or secrets
- Use environment variables for configuration
- Implement proper data encryption
- Follow OWASP security guidelines

### Financial Data
- Implement comprehensive privacy controls
- Use secure token storage
- Follow financial industry standards
- Audit data access patterns

## Documentation

### Code Documentation
- Comment complex business logic
- Document API endpoints
- Explain integration patterns
- Update type definitions

### User Documentation
- Update README.md for new features
- Document integration setup steps
- Provide troubleshooting guides
- Include deployment instructions

## Reporting Issues

### Bug Reports
Include:
- Steps to reproduce
- Expected vs actual behavior
- Browser/environment information
- Screenshots or error messages

### Feature Requests
Include:
- Use case description
- Proposed solution
- Alternative approaches considered
- Impact on existing functionality

## Community Guidelines

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Follow the project's code of conduct

## Questions?

If you have questions about contributing:
1. Check existing issues and documentation
2. Create a GitHub issue with your question
3. Join discussions in existing pull requests

Thank you for contributing to Portfolio Dashboard!