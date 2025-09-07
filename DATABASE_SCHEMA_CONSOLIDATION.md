# Database Schema Consolidation

## Overview
The KHS CRM project previously had two different Prisma schema files:
- `/prisma/schema.prisma` (root level, comprehensive)
- `/backend/prisma/schema.prisma` (simplified version)

This caused inconsistencies and potential deployment issues.

## Actions Taken
1. **Backup Created**: `backend/prisma/schema.prisma.backup`
2. **Consolidated Schema**: Root schema copied to backend to maintain consistency
3. **Schema Selection**: Root schema chosen as authoritative due to additional features:

### Features in Root Schema (Now Authoritative)
- `CustomerType` enum (CURRENT, LEADS)
- `ScheduleEvent` model for calendar functionality  
- `Worker` model for team management
- `ToolCategory`, `ToolList`, `ToolItem` models for tool management
- `SOP` (Standard Operating Procedures) model
- `ToolSettings` and `KHSToolsSync` for tool synchronization
- Enhanced Job model with `photos`, `plans`, `tasks` fields
- More comprehensive indexes and relationships

### Features Removed (from backend schema)
- `JobPhoto` model (replaced with JSON field in Job)
- `Invoice` model (can be re-added later if needed)
- Financial fields (`totalCost`, `depositPaid`, `actualCost`) in Job model

## Migration Strategy
1. **Development**: Use the consolidated schema immediately
2. **Production**: Plan migration to add new tables and fields
3. **Data Preservation**: Existing data will be maintained

## Next Steps
1. Generate new Prisma client: `npx prisma generate`
2. Create migration: `npx prisma migrate dev --name consolidate-schema`
3. Update backend code to use new schema features
4. Test all database operations

## Important Notes
- The backup file `backend/prisma/schema.prisma.backup` contains the old schema
- If rollback is needed, restore from backup and regenerate client
- All new features should use the consolidated schema going forward

## Schema Location
- **Primary Schema**: `/prisma/schema.prisma`
- **Backend Copy**: `/backend/prisma/schema.prisma` (identical copy)
- **Backup**: `/backend/prisma/schema.prisma.backup`
