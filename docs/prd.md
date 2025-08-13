# KHS Construction & Remodeling CRM Product Requirements Document (PRD)

## Goals and Background Context

### Goals
- Enable instant mobile access to customer information, job details, and materials lists from any job site
- Reduce information retrieval time by 80% (from 30-45 minutes daily to under 10 minutes)
- Eliminate missed material purchases through comprehensive offline-accessible materials lists
- Increase billable hours by 5-7 hours per week through improved field efficiency
- Improve estimate-to-job conversion by 20% with instant access to customer history
- Reduce project delays by 50% through better coordination and material planning
- Provide 3-tap access to any critical business information on mobile devices
- Enable offline functionality for viewing and basic edits without internet connection

### Background Context
The KHS Construction & Remodeling CRM addresses the critical pain point of information accessibility in the field for small construction businesses. Currently, owner-operators waste 30-45 minutes daily retrieving scattered information from paper files, spreadsheets, and notebooks - translating to $50-75 in lost billable time per day. The solution provides a mobile-first field operations platform that serves as a "command center in your pocket," designed specifically for the owner-operator who manages every aspect of the business while constantly moving between job sites, suppliers, and customer meetings.

This Progressive Web App (PWA) approach eliminates the friction of app store downloads while providing native app-like offline functionality. The system prioritizes the owner's workflow with intelligent information hierarchy - owners have full visibility and control, while workers see simplified task assignments. By focusing on practical field use with offline-first architecture and mobile-optimized interfaces, the CRM transforms how small construction businesses operate in an increasingly digital marketplace.

### Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-08-09 | 1.0 | Initial PRD creation based on Project Brief | John (PM) |

## Requirements

### Functional
- FR1: The system shall provide a search interface to find customers by name, phone number, or partial address match within 2 seconds
- FR2: The system shall display customer contact information, service address, and complete job history on a single mobile-optimized screen
- FR3: The system shall support adding and editing customer details with offline capability and automatic sync when connected
- FR4: The system shall display an active jobs dashboard showing job status, assigned workers, and next required actions
- FR5: The system shall allow status updates for jobs with predefined states (Not Started, In Progress, Waiting on Materials, Completed)
- FR6: The system shall provide materials list creation and management per job with check-off capability for purchased items
- FR7: The system shall support offline access to all materials lists with visual indicators for checked/unchecked items
- FR8: The system shall enable owner users to assign workers to specific jobs with task descriptions
- FR9: The system shall provide a simplified worker view showing only assigned jobs, addresses, and task details
- FR10: The system shall implement Progressive Web App features including service workers for offline functionality
- FR11: The system shall provide automatic data synchronization when internet connectivity is restored
- FR12: The system shall support installation as a home screen app on iOS and Android devices
- FR13: The system shall implement role-based access control distinguishing owner and worker permissions
- FR14: The system shall maintain data consistency during offline edits with conflict resolution favoring owner changes
- FR15: The system shall provide data export capabilities in CSV format for customer lists and job data

### Non Functional
- NFR1: The system must load initial page content in under 3 seconds on 4G connections
- NFR2: The system must provide subsequent page loads in under 1 second using cached data
- NFR3: The system must function fully offline for all read operations and basic create/update operations
- NFR4: The system must support devices running iOS 14+ and Android 8+
- NFR5: The system must be accessible via modern web browsers (last 2 versions of Chrome, Safari, Firefox, Edge)
- NFR6: The system must handle up to 500 customers and 100 active jobs without performance degradation
- NFR7: The system must provide automatic daily backups of all data
- NFR8: The system must encrypt all data in transit using HTTPS/TLS
- NFR9: The system must maintain 99.5% uptime for cloud-hosted components
- NFR10: The interface must be optimized for one-handed mobile operation
- NFR11: The system must sync offline changes within 30 seconds of connectivity restoration
- NFR12: The system must provide visual feedback for all user actions within 200ms
- NFR13: The system must support operation in direct sunlight with high-contrast mode
- NFR14: The system must consume less than 50MB of device storage for offline data
- NFR15: The system must maintain user sessions for 30 days without re-authentication

## User Interface Design Goals

### Overall UX Vision
The KHS CRM embodies a "tool belt" philosophy - every function should be as accessible and reliable as a hammer on your hip. The interface prioritizes speed and clarity over aesthetics, with large touch targets suitable for work gloves, high contrast for outdoor visibility, and a navigation structure that mirrors how contractors think about their work. Information hierarchy follows the owner's mental model: Customers → Jobs → Tasks → Materials, with instant access to any level within 3 taps.

### Key Interaction Paradigms
- **Thumb-first Navigation:** Bottom tab bar with primary actions accessible to right thumb, recognizing one-handed operation while holding materials or tools
- **Offline-First Indicators:** Visual badges showing sync status on every screen - green check for synced, yellow for pending changes, red for sync errors
- **Quick Actions:** Swipe gestures on list items for common actions (call customer, mark task complete, check off materials)
- **Smart Search:** Single search box that understands context - typing "Johnson" finds customers, "bathroom" finds jobs, "2x4" finds materials
- **Progressive Disclosure:** Worker view shows only essential info, owner view has expandable sections for details
- **Persistent State:** App remembers last screen/search/filter when reopening, minimizing navigation for repetitive tasks

### Core Screens and Views
- **Home Dashboard:** Active jobs overview with worker assignments and status indicators
- **Customer Search/List:** Fast-loading list with search-as-you-type, customer cards showing name, address, last job
- **Customer Detail:** Contact info, job history, notes - everything needed for customer interaction
- **Job Detail:** Status, assigned workers, materials list, customer info, with quick actions for updates
- **Materials Checklist:** Checkable list with running totals, offline-capable, printable view option
- **Worker Assignment:** Drag-drop interface for owner to assign workers to jobs
- **Worker Dashboard:** Simplified today's assignments view with job addresses and tasks
- **Sync Status:** Dedicated screen showing pending changes, last sync time, manual sync trigger

### Accessibility: WCAG AA
The system will meet WCAG AA standards with specific construction industry considerations:
- Minimum 48px touch targets for gloved hands
- 4.5:1 contrast ratios, with 7:1 for critical text
- Clear visual focus indicators for keyboard navigation
- Screen reader support for all interactive elements
- No reliance on color alone for status indication
- Support for system font size preferences

### Branding
Minimal branding approach focused on utility:
- KHS company colors for accent only (buttons, active states)
- Clean, uncluttered interface with maximum content visibility
- Sans-serif fonts optimized for small screens
- Icon set focused on construction metaphors (hammer for jobs, wrench for settings)
- No decorative elements that slow load times or distract from tasks
- Professional appearance that builds customer confidence when shown device

### Target Device and Platforms: Web Responsive
Progressive Web App supporting:
- **Primary:** Modern smartphones (iOS Safari 14+, Chrome/Android 8+) in portrait orientation
- **Secondary:** Tablets in landscape for office planning sessions
- **Tertiary:** Desktop browsers for initial setup and bulk data entry
- **Offline:** Full offline functionality via service workers and local storage
- **Installation:** Add-to-home-screen with custom icons and splash screens
- **Updates:** Automatic background updates with user notification

## Technical Assumptions

### Repository Structure: Monorepo
The project will use a monorepo structure to simplify deployment and development:
- Single repository containing frontend, backend, and shared code
- Shared TypeScript types/interfaces between frontend and backend
- Unified CI/CD pipeline for coordinated deployments
- Simplified dependency management and code sharing
- Tools like npm workspaces or Lerna for package management

**Rationale:** For a small team and single product, monorepo reduces complexity while enabling code reuse and atomic deployments.

### Service Architecture
**Architecture Choice: Modular Monolith with Serverless-Ready Design**
- Single deployable backend application with clear module boundaries
- Service layer architecture preparing for future microservices extraction
- Stateless request handling enabling horizontal scaling
- Database-per-feature schema design (customers, jobs, materials, users)
- RESTful API with potential GraphQL layer for mobile optimization
- Background job processing for sync operations

**Rationale:** Starts simple for MVP while maintaining clean boundaries that enable evolution to microservices as the system grows. Serverless-ready design allows future AWS Lambda deployment without major refactoring.

### Testing Requirements
**Testing Strategy: Pragmatic Testing Pyramid**
- **Unit Tests:** Core business logic, data validation, sync algorithms (Jest/Vitest)
- **Integration Tests:** API endpoints, database operations, authentication flows
- **E2E Tests:** Critical user paths only - login, create job, assign worker, offline sync
- **Manual Testing Helpers:** Seed data scripts, sync simulation tools, offline mode toggles
- **Performance Tests:** Load testing for 500 customers/100 jobs requirement
- **Mobile-Specific:** PWA installation, offline functionality, touch interactions

**Rationale:** Focuses testing effort on high-risk areas (offline sync, data integrity) while avoiding over-testing simple CRUD operations. Manual testing helpers crucial for mobile/offline scenarios.

### Additional Technical Assumptions and Requests

**Frontend Technology Stack:**
- **Framework:** React with TypeScript for type safety and developer productivity
- **State Management:** Zustand or Redux Toolkit for offline state persistence
- **Styling:** Tailwind CSS for rapid mobile-first development
- **PWA:** Workbox for service worker management
- **Build Tool:** Vite for fast development and optimized production builds
- **Mobile Testing:** BrowserStack or similar for real device testing

**Backend Technology Stack:**
- **Runtime:** Node.js with Express or Fastify for familiarity and ecosystem
- **Language:** TypeScript for full-stack type safety
- **Database:** PostgreSQL for relational data, Redis for session/cache
- **ORM:** Prisma or TypeORM for type-safe database access
- **Authentication:** JWT with refresh tokens, bcrypt for password hashing
- **API Documentation:** OpenAPI/Swagger for automatic documentation

**Infrastructure & Deployment:**
- **Hosting:** AWS (EC2/ECS for backend, S3/CloudFront for frontend) or DigitalOcean App Platform
- **Database:** Managed PostgreSQL (RDS or DigitalOcean Managed Databases)
- **CI/CD:** GitHub Actions for automated testing and deployment
- **Monitoring:** Sentry for error tracking, basic CloudWatch/DigitalOcean metrics
- **Backups:** Automated daily database backups with 30-day retention

**Development Practices:**
- **Version Control:** Git with GitFlow or GitHub Flow branching strategy
- **Code Quality:** ESLint, Prettier, pre-commit hooks
- **Documentation:** JSDoc for complex functions, README-driven development
- **API Contracts:** TypeScript interfaces shared between frontend/backend
- **Environment Management:** .env files with env.example templates

**Security Considerations:**
- **HTTPS everywhere** with Let's Encrypt certificates
- **OWASP Top 10** compliance for web security
- **Rate limiting** on API endpoints
- **Input validation** on both client and server
- **Secure session management** with httpOnly cookies
- **Regular dependency updates** via Dependabot

**Performance Targets:**
- **API Response Time:** < 200ms for data queries
- **Database Query Time:** < 50ms for indexed queries  
- **Frontend Bundle Size:** < 500KB initial load
- **Service Worker Cache:** Strategic caching for offline performance
- **Image Optimization:** WebP format with lazy loading

## Epic List

**Epic 1: Foundation & Authentication** - Establish project infrastructure, PWA setup, and secure authentication system with role-based access for owners and workers

**Epic 2: Customer Management Core** - Build complete customer information system with search, CRUD operations, and offline-capable data synchronization

**Epic 3: Job & Task Management** - Create job tracking system with status management, worker assignments, and real-time updates across devices

**Epic 4: Materials & Offline Sync** - Implement materials list functionality with robust offline support and conflict-free synchronization

## Epic 1: Foundation & Authentication

**Goal:** Establish the core technical foundation with a functioning Progressive Web App that supports secure authentication and role-based access control. This epic delivers the essential infrastructure while also providing immediate value through a working application that distinguishes between owner and worker roles, setting the stage for all subsequent features.

### Story 1.1: Project Setup and Infrastructure

As a developer,  
I want a fully configured development environment with frontend, backend, and database,  
so that the team can begin building features immediately.

**Acceptance Criteria:**
1. Monorepo structure created with separate frontend/ and backend/ directories plus shared/ for common types
2. React + TypeScript + Vite frontend scaffolded with Tailwind CSS configured for mobile-first development
3. Node.js + Express + TypeScript backend with basic health check endpoint returning { status: "ok" }
4. PostgreSQL database running locally via Docker Compose with initial schema migration system (Prisma/TypeORM)
5: Development environment starts with single command (npm run dev) launching frontend, backend, and database
6: Environment variables properly configured with .env.example templates for both frontend and backend
7: Git repository initialized with .gitignore covering all standard exclusions and initial README with setup instructions
8: Basic CI/CD pipeline configured in GitHub Actions running linting and type checking on pull requests

### Story 1.2: PWA Foundation and Mobile Optimization

As a user,  
I want to install the app on my phone's home screen and use it like a native app,  
so that I can quickly access it without opening a browser.

**Acceptance Criteria:**
1. Web app manifest configured with KHS app name, icons (192x192, 512x512), and construction-appropriate theme colors
2. Service worker implemented using Workbox with basic caching strategy for static assets
3. App installable on iOS Safari and Android Chrome with proper "Add to Home Screen" prompts
4. Responsive layout working correctly on phone screens (320px-428px width) with proper viewport meta tags
5: Offline page displayed when no connection available showing "You're offline" with sync status
6: App opens in standalone mode (no browser chrome) when launched from home screen
7: Basic navigation structure with bottom tab bar for thumb-friendly mobile navigation
8: Loading states and basic error handling implemented throughout the application

### Story 1.3: Authentication System with JWT

As an owner or worker,  
I want to securely log into the system with my credentials,  
so that I can access my authorized features and data.

**Acceptance Criteria:**
1. Login screen with email/password fields, proper validation, and "Remember Me" functionality
2. JWT-based authentication with access tokens (15min) and refresh tokens (30 days) properly implemented
3. Secure password storage using bcrypt with appropriate salt rounds (10+)
4. API middleware validating JWT tokens on all protected routes with proper 401 responses
5: Automatic token refresh when access token expires without user intervention
6: Logout functionality clearing tokens from both client storage and invalidating refresh token
7: Session persistence across app restarts using secure storage (httpOnly cookies or encrypted localStorage)
8: Basic rate limiting on login endpoint (5 attempts per minute) to prevent brute force attacks

### Story 1.4: Role-Based Access Control

As an owner,  
I want different access levels for myself and my workers,  
so that workers only see what they need while I maintain full control.

**Acceptance Criteria:**
1. User model includes role field with "owner" and "worker" as valid values
2. Owner registration flow creates first owner account with setup instructions
3. Owner can create worker accounts with temporary passwords requiring change on first login
4. Frontend routes protected based on role - workers cannot access owner-only sections
5: API endpoints enforce role-based permissions returning 403 for unauthorized role access
6: Visual indication of user role in the UI (e.g., "Owner" or "Worker" badge in header)
7: Owner dashboard shows different navigation options than worker dashboard
8: Database seed script creates test owner and worker accounts for development

### Story 1.5: Error Handling and Monitoring

As a developer,  
I want comprehensive error tracking and monitoring,  
so that I can quickly identify and fix issues in production.

**Acceptance Criteria:**
1. Global error boundary in React catching and displaying user-friendly error messages
2. Sentry (or similar) integrated for both frontend and backend error tracking
3. Structured logging implemented with different log levels (error, warn, info, debug)
4. API errors return consistent format: { error: { code: "ERROR_CODE", message: "Human readable message" } }
5: Network request failures handled gracefully with retry logic for transient failures
6: Client-side errors logged but sensitive data (passwords, tokens) never included in logs
7: Health check endpoint extended to verify database connectivity and critical services
8: Basic performance monitoring tracking page load times and API response times

**Goal:** Build a comprehensive customer information system that serves as the foundation for all job-related activities. This epic delivers the core CRM functionality with offline-capable customer data management, enabling field workers to access and update customer information from any location without depending on internet connectivity.

### Story 2.1: Customer Data Model and API

As a developer,  
I want a robust customer data structure with RESTful API endpoints,  
so that customer information can be reliably stored and accessed.

**Acceptance Criteria:**
1. Customer database schema includes: name, phone, email, address, notes, created_at, updated_at fields
2. RESTful API endpoints implemented: GET /customers (list), GET /customers/:id, POST /customers, PUT /customers/:id
3. Pagination support on GET /customers with limit/offset parameters (default 50 items per page)
4. Search endpoint GET /customers/search supporting query by name, phone, or address fragments
5: Validation rules enforced: required name, valid phone format, valid email if provided
6: Soft delete functionality with archived flag preserving customer history
7: API returns customer data in consistent format with proper HTTP status codes
8: Database indexes on name, phone, and address fields for fast searching

### Story 2.2: Customer List and Search UI

As an owner or worker,  
I want to quickly find and view customers by searching their information,  
so that I can access their details during field work.

**Acceptance Criteria:**
1. Customer list screen displays scrollable cards with name, address, and phone number
2. Search bar at top of screen with real-time search-as-you-type functionality
3. Search works across customer name, phone number, and address with results appearing within 200ms
4. Empty state shown when no customers exist with "Add First Customer" call-to-action
5: List shows 20 customers initially with infinite scroll loading more as user scrolls
6: Phone numbers displayed as clickable links that initiate calls on mobile devices
7: Visual loading states during search and scroll operations
8: Search state persisted when navigating away and returning to customer list

### Story 2.3: Customer Detail View and Editing

As an owner,  
I want to view and edit complete customer information,  
so that I can maintain accurate records and add notes from the field.

**Acceptance Criteria:**
1. Customer detail screen shows all fields in mobile-optimized layout with proper spacing
2. Edit mode activated by "Edit" button, transforming view fields to input fields
3. Save/Cancel buttons appear in edit mode with proper validation before saving
4. Notes field supports multi-line text entry with auto-expanding textarea
5: Phone number formatting applied automatically as user types (e.g., (555) 123-4567)
6: Address field provides suggestions using device's native address autocomplete if available
7: Success/error messages displayed after save attempts with clear feedback
8: Changes reflected immediately in customer list without requiring manual refresh

### Story 2.4: Add New Customer Flow

As an owner or worker,  
I want to quickly add new customers while meeting with them,  
so that I can capture their information during estimates or consultations.

**Acceptance Criteria:**
1. "Add Customer" button prominently displayed on customer list screen
2. New customer form pre-focused on name field for immediate typing
3. Form validation shows inline errors only after user leaves each field
4. Required fields clearly marked with asterisk (*) and explained at form top
5: Save button disabled until all required fields are valid
6: After successful save, user redirected to new customer's detail view
7: Duplicate detection warns if phone number already exists with option to view existing customer
8: Form data persisted locally if user navigates away accidentally, with recovery prompt

### Story 2.5: Offline Customer Data Sync

As a field worker,  
I want customer data available offline and synced when connected,  
so that I can work without depending on internet connectivity.

**Acceptance Criteria:**
1. All customer data cached locally using IndexedDB for offline access
2. Visual indicator shows sync status: green (synced), yellow (pending changes), red (sync error)
3. Offline changes queued and automatically synced when connection restored
4. Conflict resolution for customer edits: last-write-wins with server timestamp as authority
5: Manual sync button available for users to force synchronization
6: Sync errors displayed with clear explanation and retry option
7: Background sync every 5 minutes when app is open and connected
8: Local storage management prevents excessive space usage with 50MB limit

**Goal:** Create a comprehensive job tracking system that enables efficient field operations through real-time job status updates, worker assignments, and task management. This epic transforms how work is coordinated by providing both owners and workers with clear visibility into active projects and their responsibilities.

### Story 3.1: Job Data Model and Core API

As a developer,  
I want a flexible job structure linked to customers with status tracking,  
so that jobs can be managed throughout their lifecycle.

**Acceptance Criteria:**
1. Job schema includes: title, description, customer_id (FK), status, start_date, end_date, created_by, assigned_to[]
2. Job statuses: "Not Started", "In Progress", "Waiting on Materials", "Completed", "On Hold"
3. RESTful endpoints: GET /jobs (with filters), GET /jobs/:id, POST /jobs, PUT /jobs/:id, DELETE /jobs/:id
4. GET /jobs supports filtering by status, customer_id, assigned_to, and date ranges
5: Job-customer relationship enforced at database level with foreign key constraint
6: Job assignment supports multiple workers (many-to-many relationship)
7: Audit trail tracks status changes with timestamp and user who made change
8: API includes GET /customers/:id/jobs to fetch all jobs for specific customer

### Story 3.2: Active Jobs Dashboard

As an owner,  
I want to see all active jobs at a glance with their current status,  
so that I can manage daily operations efficiently.

**Acceptance Criteria:**
1. Dashboard displays job cards grouped by status in swim lanes (Not Started, In Progress, etc.)
2. Each job card shows: job title, customer name, assigned workers, days active/overdue
3. Color coding indicates job urgency: green (on track), yellow (attention needed), red (overdue)
4. Quick filter buttons for "My Jobs", "Unassigned", "Today's Jobs", "All Active"
5: Tap job card to view full details, long-press for quick actions (change status, reassign)
6: Pull-to-refresh gesture updates dashboard with latest data
7: Job count badges on each status column showing number of jobs
8: Dashboard is the home screen after login for owner role

### Story 3.3: Job Detail and Management

As an owner,  
I want to view and manage all aspects of a job from one screen,  
so that I can update information while at the job site.

**Acceptance Criteria:**
1. Job detail shows all fields with customer info, assigned workers, status, dates, description
2. Status change dropdown with confirmation for status updates
3. Worker assignment using multi-select checklist of available workers
4. "Call Customer" and "View Customer" quick action buttons
5: Start/end dates editable with date picker defaulting to today
6: Job notes field for capturing additional details during site visits
7: Activity log showing history of all changes to the job
8: Delete job option (with confirmation) only available to owner role

### Story 3.4: Worker Task Assignment and Views

As a worker,  
I want to see only my assigned jobs and tasks for the day,  
so that I know where to go and what to do without confusion.

**Acceptance Criteria:**
1. Worker dashboard shows "My Jobs Today" as primary view after login
2. Each assigned job displays: customer name, address, job title, special instructions
3. Tap address to open in device's default map application for directions
4. Simple "Start Job" / "Complete Job" buttons to update status
5: Jobs sorted by proximity to current location (if location permission granted)
6: "Tomorrow's Jobs" tab shows next day's assignments for planning
7: No access to job financial information or other workers' assignments
8: Clear "No jobs assigned" message when schedule is empty

### Story 3.5: Create Job Flow

As an owner,  
I want to quickly create new jobs linked to customers,  
so that I can set up work immediately after customer approval.

**Acceptance Criteria:**
1. "New Job" button accessible from dashboard and customer detail screens
2. Customer selection via searchable dropdown (pre-selected if creating from customer detail)
3. Job title and description fields with description supporting multi-line text
4. Worker assignment optional during creation (can assign later)
5: Default status "Not Started" with option to change if work beginning immediately
6: Estimated start/end dates optional with calendar picker
7: Save and "Save & Add Another" options for batch job creation
8: Validation ensures customer selected before job can be saved

**Goal:** Implement comprehensive materials list management with robust offline synchronization capabilities. This epic delivers the critical feature that eliminates forgotten materials and wasted trips to suppliers by ensuring material lists are always accessible and up-to-date, even without internet connectivity at job sites or supply stores.

### Story 4.1: Materials Data Model and API

As a developer,  
I want a materials system tied to jobs with check-off capability,  
so that material needs can be tracked per project.

**Acceptance Criteria:**
1. Material schema: job_id (FK), item_name, quantity, unit, purchased (boolean), notes, added_by, purchased_by
2. RESTful endpoints: GET /jobs/:id/materials, POST /jobs/:id/materials, PUT /materials/:id, DELETE /materials/:id
3. Bulk operations endpoint: PUT /jobs/:id/materials/bulk for checking multiple items
4. Materials sorted by purchase status (unpurchased first) then by creation order
5: Quantity field supports decimals (e.g., 2.5) with unit field (e.g., "boxes", "feet", "each")
6: Audit trail tracks who added items and who marked them purchased with timestamps
7: API supports adding multiple materials in single request for efficiency
8: Soft delete for materials to preserve history of what was needed

### Story 4.2: Materials List Interface

As an owner or worker,  
I want to view and check off materials for a job,  
so that I can track what's been purchased while shopping.

**Acceptance Criteria:**
1. Materials list accessible from job detail screen via "Materials" tab or button
2. Checkbox next to each item for marking as purchased with satisfying animation
3. Purchased items move to bottom of list with strikethrough styling
4. Running count shows "3 of 10 items purchased" at top of screen
5: Each item shows: checkbox, quantity + unit, item name, notes icon if notes exist
6: Tap item (not checkbox) to edit quantity, unit, name, or notes
7: Pull-down gesture reveals "Add Material" quick-add bar
8: "Clear Purchased" button archives checked items (owner only)

### Story 4.3: Add and Edit Materials

As an owner,  
I want to quickly add materials to job lists,  
so that I can build comprehensive shopping lists during estimates.

**Acceptance Criteria:**
1. "Add Material" button opens focused form with item name field active
2. Quantity defaults to "1" with unit defaulting to "each"
3. Common units available in dropdown: each, box, feet, yards, gallons, pounds, hours
4. Optional notes field for specifics like "Get the premium grade" or "Check price at both stores"
5: "Add Another" button saves current item and clears form for next entry
6: Recent materials list shows last 20 unique items for quick re-adding
7: Edit mode allows changing all fields with delete option (confirmation required)
8: Auto-save triggers 2 seconds after user stops typing to prevent data loss

### Story 4.4: Offline Materials Sync

As a field worker,  
I want materials lists fully functional offline,  
so that I can use them in supply stores with poor connectivity.

**Acceptance Criteria:**
1. All materials for active jobs cached locally for offline access
2. Check-off actions work instantly offline with optimistic UI updates
3. Offline changes queued with visual indicator (yellow dot on items pending sync)
4. Sync occurs automatically when connection restored with progress indicator
5: Conflict resolution: if item checked by multiple users, earliest timestamp wins
6: Failed sync items marked with red indicator and option to retry
7: Manual "Force Sync" option available in materials list menu
8: Offline mode prevents deletion of items to avoid complex conflicts

### Story 4.5: Materials List Sharing and Export

As an owner,  
I want to share or print materials lists,  
so that I can send them to workers or suppliers.

**Acceptance Criteria:**
1. "Share" button generates shareable text format of unpurchased items
2. Text format includes job name, customer, date, and materials with quantities
3. Share sheet integrates with device's native sharing (SMS, email, etc.)
4. "Print View" reformats list for printing with larger text and checkboxes
5: Export to CSV option for importing into spreadsheets or supplier systems
6: QR code generation for list URL that others can scan to view (read-only)
7: Copy to clipboard option for pasting into other apps
8: Shared lists show "Generated by KHS CRM" footer for branding

## Checklist Results Report

### Executive Summary

**Overall PRD Completeness:** 92%  
**MVP Scope Appropriateness:** Just Right  
**Readiness for Architecture Phase:** Ready  
**Most Critical Gaps:** Minor gaps in data migration approach and operational monitoring details

The PRD demonstrates strong product thinking with clear problem definition, well-structured requirements, and appropriate MVP scope. The document successfully balances comprehensiveness with practical implementation focus. The offline-first approach and construction industry-specific considerations show deep understanding of user needs.

### Category Analysis Table

| Category | Status | Critical Issues |
|----------|--------|-----------------|
| 1. Problem Definition & Context | PASS (95%) | None |
| 2. MVP Scope Definition | PASS (90%) | Future enhancement roadmap could be more detailed |
| 3. User Experience Requirements | PASS (93%) | Minor: Specific error messages not detailed |
| 4. Functional Requirements | PASS (95%) | None |
| 5. Non-Functional Requirements | PASS (90%) | Monitoring/alerting specifics light |
| 6. Epic & Story Structure | PASS (98%) | None |
| 7. Technical Guidance | PASS (92%) | GraphQL decision deferred to architect |
| 8. Cross-Functional Requirements | PARTIAL (75%) | Data migration strategy not addressed |
| 9. Clarity & Communication | PASS (94%) | None |

### Top Issues by Priority

**BLOCKERS:** None identified

**HIGH:**
- Data migration strategy for existing customer data not specified
- Operational monitoring and alerting details need expansion

**MEDIUM:**
- Future enhancement roadmap (Phase 2 features) lacks timeline estimates
- Specific error message catalog not included
- Integration testing approach for offline sync needs detail

**LOW:**
- Stakeholder communication plan not explicitly defined
- Visual mockups would enhance understanding
- Competitive analysis could be more detailed

### MVP Scope Assessment

**Scope Appropriateness:** The MVP scope is well-balanced, focusing on core field operations without feature creep.

**Strengths:**
- Clear focus on eliminating information retrieval delays
- Offline-first approach directly addresses connectivity issues
- Role-based access keeps complexity manageable
- Materials list feature provides immediate tangible value

**Potential Cuts (if needed):**
- CSV export could be deferred to Phase 2
- QR code sharing for materials lists
- Worker proximity-based job sorting

**Essential Features Confirmed:**
- All critical path features included
- No significant gaps identified

**Complexity Concerns:**
- Offline sync conflict resolution needs careful implementation
- PWA limitations on iOS require testing

**Timeline Realism:** 2-3 month MVP timeline appears achievable with focused execution

### Technical Readiness

**Clarity of Technical Constraints:** Well-defined with clear technology choices and rationale

**Identified Technical Risks:**
- Offline sync complexity (acknowledged and addressed)
- iOS PWA limitations (mitigation strategies included)
- 50MB storage constraint for offline data (monitoring approach defined)

**Areas Needing Architect Investigation:**
- Optimal offline sync algorithm selection
- Redis vs in-memory caching for MVP
- GraphQL vs REST decision for mobile optimization
- Specific AWS service selection (Lambda vs ECS)

### Recommendations

1. **Address Data Migration (HIGH):** Add story in Epic 2 for migrating existing customer data from current systems
2. **Expand Monitoring Details (HIGH):** Define specific metrics, thresholds, and alerting channels in Technical Assumptions
3. **Create Error Message Catalog (MEDIUM):** Document user-facing error messages for consistency
4. **Add Integration Test Plan (MEDIUM):** Detail approach for testing offline sync scenarios
5. **Timeline Phase 2 Features (LOW):** Add rough timeline estimates for post-MVP features
6. **Consider Visual Mockups (LOW):** Create simple wireframes for key screens to align stakeholders

### Next Steps

1. Address high-priority gaps before architect handoff (optional but recommended)
2. Proceed with architect phase using current PRD
3. Plan for iterative refinement during development
4. Schedule stakeholder review of MVP scope

### Final Decision

**READY FOR ARCHITECT** ✓

The PRD and epics are comprehensive, properly structured, and ready for architectural design. Minor gaps identified can be addressed in parallel with architecture work without blocking progress. The strong foundation, clear requirements, and thoughtful epic structure position the project for successful implementation.

## Next Steps

### UX Expert Prompt

Please review the KHS Construction & Remodeling CRM PRD and create detailed UX designs for the mobile-first Progressive Web App, focusing on construction field worker usability with gloved-hand operation, outdoor visibility, and offline-first interactions.

### Architect Prompt

Please create the technical architecture for the KHS Construction & Remodeling CRM based on this PRD, designing a robust offline-first PWA with React/TypeScript frontend, Node.js backend, and PostgreSQL database, emphasizing mobile performance and reliable data synchronization.