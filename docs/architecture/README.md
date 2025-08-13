# KHS Construction & Remodeling CRM - System Architecture

## Overview

This directory contains the complete technical architecture documentation for the KHS Construction & Remodeling CRM system. The architecture is designed as an offline-first Progressive Web App (PWA) that enables construction professionals to manage customer information, jobs, and materials from the field with robust synchronization capabilities.

## Architecture Documents

### 1. [Technical Architecture](./technical-architecture.md)
Comprehensive overview of the system architecture including:
- High-level system design
- Technology stack decisions
- Monorepo structure
- Core architecture principles
- Development workflow

### 2. [Database Schema](./database-schema.md)
Detailed database design including:
- Entity relationship diagrams
- PostgreSQL schema definitions
- Indexes and performance optimization
- Migration strategy
- Backup and recovery procedures

### 3. [API Architecture](./api-architecture.md)
RESTful API design documentation:
- Endpoint specifications
- Request/response formats
- Authentication flow
- Rate limiting strategy
- Error handling patterns

### 4. [Frontend Architecture](./frontend-architecture.md)
Offline-first PWA implementation:
- React component architecture
- State management with Zustand
- IndexedDB offline storage
- Service worker strategy
- Performance optimization

### 5. [Security Architecture](./security-architecture.md)
Comprehensive security design:
- Authentication & authorization
- JWT token management
- Data encryption
- Security headers
- Incident response plan

### 6. [Sync Architecture](./sync-architecture.md)
Offline synchronization strategy:
- Sync protocol design
- Conflict detection & resolution
- Queue management
- Performance optimization
- Best practices

### 7. [Deployment & Infrastructure](./deployment-infrastructure.md)
AWS cloud infrastructure:
- Infrastructure as Code (Terraform)
- CI/CD pipeline (GitHub Actions)
- Auto-scaling configuration
- Monitoring & alerting
- Disaster recovery

### 8. [Implementation Roadmap](./implementation-roadmap.md)
Development timeline and decisions:
- 14-week implementation plan
- Phase-by-phase deliverables
- Technical decision rationale
- Risk management
- Success metrics

## Key Architecture Decisions

### Offline-First Design
- **Local-First Operations**: All actions work against IndexedDB first
- **Optimistic Updates**: Immediate UI feedback with background sync
- **Conflict Resolution**: Automated with role-based precedence
- **Progressive Enhancement**: Features adapt to connectivity

### Technology Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Zustand
- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Database**: PostgreSQL 16 with Redis cache
- **Infrastructure**: AWS (ECS Fargate, RDS, CloudFront)
- **Deployment**: GitHub Actions CI/CD

### Security Approach
- **Zero Trust**: Every request authenticated and authorized
- **Defense in Depth**: Multiple security layers
- **Encryption**: At rest and in transit
- **Compliance**: OWASP Top 10, SOC 2 ready

## Quick Start for Developers

### Prerequisites
- Node.js 20+ and npm 9+
- Docker and Docker Compose
- AWS CLI configured
- Terraform 1.5+

### Local Development Setup

```bash
# Clone repository
git clone https://github.com/khs-crm/khs-crm.git
cd khs-crm

# Install dependencies
npm install

# Start local services
docker-compose up -d

# Run database migrations
npm run db:migrate

# Start development servers
npm run dev
```

### Architecture Principles

1. **Mobile-First**: Designed for construction field use
2. **Offline-First**: Full functionality without internet
3. **Type-Safe**: End-to-end TypeScript
4. **Scalable**: Horizontal scaling ready
5. **Secure**: Security by design
6. **Testable**: Comprehensive test coverage

## System Requirements

### Performance Targets
- Initial load: < 3 seconds on 4G
- API response: < 200ms (p95)
- Offline sync: < 30 seconds
- Support 500+ customers per instance

### Browser Support
- iOS Safari 14+
- Chrome/Android 8+
- Last 2 versions of major browsers

### Infrastructure Scaling
- Auto-scaling: 2-10 ECS tasks
- Database: Read replicas for scale
- CDN: Global edge locations
- Cache: Redis cluster ready

## Architecture Review Process

### Making Changes
1. Document proposed changes in ADR format
2. Create PR with architecture updates
3. Get review from tech lead
4. Update implementation if needed

### Architecture Decision Records (ADRs)
Major decisions are documented in the `/docs/adrs/` directory following the ADR template.

## Monitoring & Observability

### Key Metrics
- API latency and error rates
- Database query performance
- Sync success rates
- User engagement metrics

### Dashboards
- CloudWatch: Infrastructure metrics
- Sentry: Application errors
- Custom: Business metrics

## Support & Contact

### For Developers
- Architecture questions: Post in #architecture Slack channel
- Bug reports: Create GitHub issue
- Feature requests: Discuss with product owner

### Documentation Updates
This documentation is living and should be updated as the system evolves. All significant changes require corresponding documentation updates.

## Related Documentation

- [Product Requirements Document](../prd.md)
- [API Documentation](../api/)
- [Development Guide](../development/)
- [Operations Runbook](../operations/)

---

*Last Updated: January 2024*
*Version: 1.0*