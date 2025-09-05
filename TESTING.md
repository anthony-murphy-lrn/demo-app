# Testing Guide

This project uses Jest with React Testing Library for testing React components and utility functions.

## Test Scripts

- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:ci` - Run tests in CI mode (no watch, with coverage)

## Test Structure

Tests are located alongside the code they test with the following naming convention:
- `*.test.ts` - Unit tests for TypeScript files
- `*.test.tsx` - Component tests for React components

## Test Files

### Component Tests
- `src/components/TestSessionManagement.test.tsx` - Tests for the main session management component

### Utility Tests
- `src/utils/session-utils.test.ts` - Tests for session-related utility functions
- `src/utils/date-time-utils.test.ts` - Tests for date/time formatting utilities

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

## Test Configuration

The test configuration is defined in `jest.config.js` and includes:
- Next.js integration with `next/jest`
- React Testing Library setup
- TypeScript support
- Path mapping for `@/` imports
- Coverage thresholds (20% for demo purposes)

## Writing Tests

### Component Tests
Use React Testing Library for component testing:

```typescript
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import MyComponent from './MyComponent'

describe('MyComponent', () => {
  it('renders without crashing', () => {
    render(<MyComponent />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
})
```

### Utility Function Tests
Test utility functions directly:

```typescript
import { myUtilityFunction } from './my-utility'

describe('myUtilityFunction', () => {
  it('should work correctly', () => {
    const result = myUtilityFunction('input')
    expect(result).toBe('expected output')
  })
})
```

## Mocking

The test setup includes mocks for:
- Next.js router (`useRouter`, `useSearchParams`)
- Next.js dynamic imports
- Global `fetch` function
- Browser APIs (`matchMedia`, `IntersectionObserver`, `ResizeObserver`)

## Coverage

Current coverage targets are set to 20% for this demo project. The coverage report shows:
- Statement coverage
- Branch coverage
- Function coverage
- Line coverage

To view detailed coverage, run `npm run test:coverage` and check the generated HTML report in the `coverage/` directory.

