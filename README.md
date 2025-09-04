# Assessment Delivery Demo Application

A NextJS-based demonstration application for Learnosity's assessment delivery capabilities. This application showcases the integration of Learnosity's Items API for delivering assessments to students with comprehensive session management, security features, and local data persistence.

## Features

- **Learnosity Integration**: Seamless integration with Learnosity's Items API for assessment delivery
- **Session Management**: Resumable assessment sessions with local persistence and timeout handling
- **Security Features**: Media asset security with restricted access windows and input validation
- **Responsive Design**: Bootstrap 5-styled interface optimized for desktop and mobile devices
- **Local Development**: SQLite database with Prisma ORM for easy local setup and management
- **Health Monitoring**: Database health checks and system status monitoring
- **Test Utilities**: Built-in testing endpoints for development and debugging
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Session Cleanup**: Automatic cleanup of expired sessions and orphaned data
- **Demo Ready**: Simple, intuitive interface for showcasing Learnosity capabilities

## Tech Stack

- **Frontend**: NextJS 15 with React 19 and TypeScript
- **Styling**: Bootstrap 5 for responsive design
- **Database**: SQLite with Prisma ORM
- **API Integration**: Learnosity Items API
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

### Resuming an Assessment

1. If you have an active session, the system will show a "Resume Assessment" option
2. Click to resume your previous session
3. Your progress will be restored automatically

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
├── app/                    # NextJS App Router
│   ├── api/               # API routes
│   │   ├── sessions/      # Session management
│   │   ├── learnosity/    # Learnosity integration
│   │   └── results/       # Assessment results
│   ├── assessment/        # Assessment player page
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   └── globals.css        # Global styles
├── components/            # React components
├── lib/                   # Utilities and configurations
│   ├── database.ts        # Prisma client
│   └── config.ts          # Environment configuration
├── types/                 # TypeScript type definitions
├── utils/                 # Utility functions
├── hooks/                 # Custom React hooks
├── constants/             # Application constants
└── generated/             # Generated Prisma client
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

### Learnosity Setup

1. Create a Learnosity account at [learnosity.com](https://learnosity.com)
2. Generate API credentials in your Learnosity dashboard
3. Create an assessment using Learnosity's Authoring tool
4. Update the environment variables with your credentials

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

- **Session**: Stores assessment session information
  - `id`: Unique session identifier
  - `studentId`: Student identifier
  - `learnositySessionId`: Learnosity session reference
  - `status`: Session status (ACTIVE, COMPLETED, EXPIRED, CANCELLED)
  - `assessmentId`: Assessment identifier
  - `expiresAt`: Session expiration timestamp

- **AssessmentResult**: Stores assessment results
  - `id`: Unique result identifier
  - `sessionId`: Reference to parent session
  - `response`: JSON response data
  - `score`: Calculated score (optional)
  - `timeSpent`: Time spent in seconds (optional)

### API Routes

API routes are organized by functionality:

- `/api/sessions` - Session management (GET, POST, PUT, DELETE)
- `/api/sessions/cleanup` - Session cleanup and maintenance
- `/api/learnosity` - Learnosity integration and session initialization
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

### Assessment Player

- Learnosity Items API integration
- Session persistence and resumption
- Progress tracking and auto-save
- Security features for media assets
- Error boundary protection
- Loading states and user feedback

### Session Management

- Automatic session creation with unique IDs
- Resumable sessions with timeout handling
- Session status tracking (ACTIVE, COMPLETED, EXPIRED, CANCELLED)
- Progress saving and restoration
- Automatic cleanup of expired sessions

### Health Monitoring

- Database connection health checks
- System status monitoring
- Database statistics and metrics
- Error reporting and diagnostics

## Security Considerations

- **Media Asset Security**: Restricted access windows for media assets
- **Session Management**: Timeout handling and automatic session expiration
- **Input Validation**: Comprehensive validation using Zod schemas
- **Error Handling**: Secure error messages without sensitive data exposure
- **Security Headers**: Proper HTTP security headers
- **Data Validation**: Request body and query parameter validation
- **Session Cleanup**: Automatic cleanup of expired and orphaned sessions
- **Type Safety**: Full TypeScript coverage for type safety

## Contributing

1. Follow the existing code style (ESLint + Prettier)
2. Add TypeScript types for new features
3. Update documentation as needed
4. Test thoroughly before submitting

## License

This project is for demonstration purposes. Please refer to Learnosity's terms of service for API usage.

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

**Session Not Resuming**

- Check if the session has expired (default: 60 minutes)
- Verify the session exists in the database
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

## Support

For Learnosity API support, visit [learnosity.com/support](https://learnosity.com/support)

For application-specific issues, check the console logs and health endpoints for diagnostic information.
