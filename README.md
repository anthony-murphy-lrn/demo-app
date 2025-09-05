# Assessment Delivery Demo Application

A NextJS-based demonstration application for Learnosity's assessment delivery capabilities. This application showcases the integration of Learnosity's Items API for delivering assessments to students with comprehensive session management, security features, regional endpoint support, and local data persistence.

## Tech Stack

- **Frontend**: NextJS 15 with React 19 and TypeScript
- **Styling**: Bootstrap 5 for responsive design
- **Database**: SQLite with Prisma ORM
- **API Integration**: Learnosity Items API with regional endpoint support
- **Testing**: Jest with comprehensive test coverage
- **Development**: ESLint, Prettier, and TypeScript for code quality

## Prerequisites

- Node.js 18+
- npm or yarn
- Learnosity account with API credentials

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd assessment-delivery-demo
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your Learnosity credentials:

   ```env
   LEARNOSITY_CONSUMER_KEY=your_actual_consumer_key
   LEARNOSITY_CONSUMER_SECRET=your_actual_consumer_secret
   LEARNOSITY_DOMAIN=your_actual_domain
   LEARNOSITY_ACTIVITY_ID=your_actual_activity_id
   ```

   **Note**: The `LEARNOSITY_DOMAIN` is used as a fallback. The application now supports dynamic regional endpoint configuration through the UI.

4. **Set up the database**

   ```bash
   npm run db:generate
   npm run db:push
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

   The application will be available at [http://localhost:3000](http://localhost:3000)

## Usage

### Starting an Assessment

1. Navigate to the application homepage
2. Enter a Student ID in the input field
3. Click "Start Assessment" to create a new session
4. The system will redirect to the assessment player

### Managing Test Sessions

1. After entering a Student ID, the system displays a comprehensive session management interface
2. View all test sessions for the student with pagination support
3. See session details including ID, expiry time, and status
4. Resume active sessions or start new assessments
5. Navigate between pages of sessions using pagination controls

### Resuming an Assessment

1. If you have an active session, the system will show a "Resume" button in the session table
2. Click to resume your previous session
3. Your progress will be restored automatically using Learnosity's built-in session management

### Regional Endpoint Configuration

1. Access the Learnosity configuration panel
2. Select from available regional endpoints:
   - US East (items-va.learnosity.com)
   - Europe (items-ie.learnosity.com) 
   - Australia (items-au.learnosity.com)
3. Configure session expiry time (15 minutes to 8 hours)
4. Changes take effect immediately for new sessions

### Health Monitoring

Check the application health by visiting:

- `/api/health/database` - Database connection status and statistics

### Development Testing

Use the test endpoints for development and debugging:

- `/api/test/database-seeder` - Populate database with test data
- `/api/test/session-cleanup` - Test session cleanup functionality

## Project Structure

```
src/
├── app/                           # NextJS App Router
│   ├── api/                      # API routes
│   │   ├── health/               # Health monitoring
│   │   │   └── database/         # Database health checks
│   │   ├── learnosity/           # Learnosity integration
│   │   ├── results/              # Assessment results
│   │   ├── test-sessions/        # Test session management
│   │   │   ├── [id]/            # Individual session routes
│   │   │   └── cleanup/         # Session cleanup
│   │   └── test/                # Development testing endpoints
│   │       ├── database-seeder/  # Database seeding tests
│   │       ├── models/          # Model testing
│   │       ├── test-session-cleanup/    # Cleanup testing
│   │       ├── test-session-persistence/ # Persistence testing
│   │       └── test-session-service/    # Service testing
│   ├── assessment/               # Assessment player page
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Landing page
│   └── globals.css              # Global styles
├── components/                   # React components
│   ├── AssessmentPlayer.tsx     # Learnosity assessment player
│   ├── ErrorBoundary.tsx        # Error boundary component
│   ├── LandingPage.tsx          # Homepage component
│   ├── LearnosityConfigForm.tsx # Regional endpoint configuration
│   ├── StartAssessmentButton.tsx # Assessment start button
│   ├── TestSessionManagement.tsx # Comprehensive session management
│   ├── TestSessionResumption.tsx # Session resumption UI
│   └── index.ts                 # Component exports
├── lib/                         # Core business logic
│   ├── config.ts                # Environment configuration
│   ├── database.ts              # Prisma client
│   ├── database-init.ts         # Database initialization
│   ├── database-seeder.ts       # Demo data seeding
│   ├── learnosity.ts            # Learnosity API integration with domain separation
│   ├── learnosity-config-service.ts # Learnosity configuration management
│   ├── models.ts                # Database models
│   ├── session-persistence.ts   # Session persistence logic
│   ├── test-session-cleanup.ts  # Session cleanup service
│   ├── test-session-persistence.ts # Test session persistence
│   └── test-session-service.ts  # Test session business logic
├── types/                       # TypeScript type definitions
├── utils/                       # Utility functions
│   ├── date-time-utils.ts       # Date/time formatting utilities
│   ├── error-handler.ts         # Error handling utilities
│   ├── session-utils.ts         # Session management utilities
│   ├── test-session-id-generator.ts # ID generation
│   └── validation.ts            # Input validation
├── hooks/                       # Custom React hooks
├── constants/                   # Application constants
└── generated/                   # Generated Prisma client
    └── prisma/                  # Prisma generated files
```

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production with Turbopack
- `npm run start` - Start production server
- `npm run lint` - Check for linting issues
- `npm run lint:fix` - Auto-fix linting issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check formatting
- `npm run type-check` - TypeScript compilation check
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push database schema changes
- `npm run db:studio` - Open Prisma Studio for database management
- `npm test` - Run test suite with Jest
- `npm run test:watch` - Run tests in watch mode

## Configuration

### Environment Variables

- `DATABASE_URL` - SQLite database connection string
- `LEARNOSITY_CONSUMER_KEY` - Learnosity API consumer key
- `LEARNOSITY_CONSUMER_SECRET` - Learnosity API consumer secret
- `LEARNOSITY_DOMAIN` - Learnosity domain
- `LEARNOSITY_ACTIVITY_ID` - Assessment activity ID
- `NEXT_PUBLIC_APP_URL` - Application URL
- `SESSION_TIMEOUT_MINUTES` - Session timeout duration
- `NODE_ENV` - Environment mode

## Development

### Code Quality

The project uses ESLint and Prettier for code quality:

- **ESLint**: TypeScript-aware linting with custom rules
- **Prettier**: Consistent code formatting
- **TypeScript**: Strict type checking

### Database

The application uses SQLite with Prisma ORM:

- **Schema**: Defined in `prisma/schema.prisma`
- **Migrations**: Automatic schema synchronization
- **Studio**: Visual database management with `npm run db:studio`

#### Database Schema

The application uses two main models:

- **TestSession**: Stores assessment session information
  - `id`: Unique session identifier
  - `studentId`: Student identifier
  - `learnositySessionId`: Learnosity session reference
  - `assessmentId`: Assessment identifier
  - `expiresAt`: Session expiration timestamp
  - `createdAt`: Session creation timestamp
  - `updatedAt`: Last update timestamp
  - **Note**: Session status is managed by Learnosity, not stored locally

- **AssessmentResult**: Stores assessment results
  - `id`: Unique result identifier
  - `testSessionId`: Reference to parent test session
  - `response`: JSON response data
  - `score`: Calculated score (optional)
  - `timeSpent`: Time spent in seconds (optional)
  - `createdAt`: Result creation timestamp

### API Routes

API routes are organized by functionality:

- `/api/test-sessions` - Test session management with pagination (GET, POST, PUT)
- `/api/test-sessions/[id]` - Individual session retrieval and management
- `/api/test-sessions/cleanup` - Session cleanup and maintenance
- `/api/learnosity` - Learnosity integration with regional endpoint support
- `/api/learnosity-config` - Learnosity configuration management
- `/api/results` - Assessment results storage and retrieval
- `/api/health/database` - Database health monitoring
- `/api/test/*` - Development and testing utilities

### Testing Endpoints

The application includes several testing endpoints for development:

- `/api/test/database-seeder` - Seed the database with test data
- `/api/test/models` - Test database models and relationships
- `/api/test/session-cleanup` - Test session cleanup functionality
- `/api/test/session-persistence` - Test session persistence features
- `/api/test/session-service` - Test session service operations

## Demo Features

### Landing Page

- Clean, professional Bootstrap 5 interface
- Student ID input with validation
- "Start Assessment" button with loading states
- Error handling and user feedback
- Responsive design for all devices

### Test Session Management

- Comprehensive session table with pagination support
- Visual status indicators (Active/Expired)
- Session details including ID, expiry time, and creation date
- Resume functionality for active sessions
- Start new test capability
- Responsive design with mobile optimization
- Error handling and loading states

### Assessment Player

- Learnosity Items API integration with regional endpoint support
- Session persistence and resumption
- Progress tracking and auto-save
- Security features for media assets with domain separation
- Error boundary protection
- Loading states and user feedback
- Back to home navigation

### Regional Endpoint Configuration

- Dynamic Learnosity endpoint selection (US East, Europe, Australia)
- Session expiry time configuration (15 minutes to 8 hours)
- Real-time configuration updates
- Persistent configuration storage
- Validation and error handling

### Session Management

- Automatic session creation with unique IDs
- Learnosity-managed session status (not stored locally)
- Progress saving and restoration
- Automatic cleanup of expired sessions based on timestamps
- Pagination support for large session lists

### Health Monitoring

- Database connection health checks
- System status monitoring
- Database statistics and metrics
- Error reporting and diagnostics

## Troubleshooting

### Common Issues

**Database Connection Errors**

- Ensure the database file exists and is writable
- Check the `DATABASE_URL` environment variable
- Run `npm run db:push` to initialize the database

**Learnosity Integration Issues**

- Verify all Learnosity environment variables are set correctly
- Check that your Learnosity credentials are valid
- Ensure the activity ID exists in your Learnosity account
- Verify the selected regional endpoint is accessible
- Check for "Signatures do not match" errors (resolved with domain separation)

**Session Not Resuming**

- Check if the session has expired (based on expiresAt timestamp)
- Verify the session exists in the database
- Check Learnosity for current session status
- Check browser console for JavaScript errors

**Assessment Not Loading**

- Check the browser console for Learnosity API errors
- Verify network connectivity
- Ensure Learnosity scripts are loading properly

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` in your environment variables.

### Database Management

- Use `npm run db:studio` to inspect the database visually
- Check `/api/health/database` for database status
- Use test endpoints to verify functionality

## Recent Updates

### Domain Separation (Latest)

- **Fixed Learnosity signature mismatch** by separating security domain (localhost) from API endpoint
- **Regional endpoint support** with dynamic configuration (US East, Europe, Australia)
- **Improved security** with proper domain handling for Learnosity API calls
- **Enhanced configuration** through UI-based endpoint selection

### Test Session Management (Completed)

- **Comprehensive session table** with pagination and status indicators
- **Resume functionality** for active sessions using Learnosity's built-in capabilities
- **Visual status indicators** for active and expired sessions
- **Responsive design** optimized for all device sizes
- **Error handling** with user-friendly feedback

### Testing & Quality

- **Comprehensive test suite** with 40+ tests covering all major functionality
- **Domain separation tests** ensuring proper Learnosity integration
- **Component tests** for UI functionality and error handling
- **API tests** for backend functionality and data validation
- **Utility tests** for date/time formatting and session management

## Testing

The application includes a comprehensive test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test files
npm test src/lib/learnosity-domain-separation.test.ts
```

### Test Coverage

- **Domain Separation**: Tests for Learnosity security vs API domain handling
- **Session Management**: Tests for session creation, retrieval, and status calculation
- **API Endpoints**: Tests for all REST API functionality
- **Component Logic**: Tests for React component behavior and error handling
- **Utility Functions**: Tests for date/time formatting and validation
