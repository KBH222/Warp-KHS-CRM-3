# KHS CRM Testing Guide

## 🚀 Quick Start

Before making any code changes, run:

```bash
npm run verify
```

This runs a quick test suite to ensure everything is working.

## 📋 Available Test Commands

### Quick Verification (Recommended before changes)
```bash
npm run verify          # Quick test suite (type check, lint, tests)
```

### Full Test Suite
```bash
npm run verify:full     # Comprehensive test suite with coverage
```

### Individual Test Commands
```bash
npm run typecheck       # TypeScript type checking
npm run lint            # ESLint code quality check
npm run test            # Run tests in watch mode
npm run test:run        # Run tests once (CI mode)
npm run test:coverage   # Generate coverage report
npm run build           # Test production build
```

### Interactive Testing
```bash
npm run test:ui         # Open Vitest UI for interactive testing
```

## 🧪 Test Structure

```
frontend/
├── src/
│   ├── pages/
│   │   └── __tests__/        # Page component tests
│   │       ├── Dashboard.test.tsx
│   │       └── CustomersNew.test.tsx
│   ├── test/
│   │   ├── setup.ts          # Test environment setup
│   │   ├── test-utils.tsx    # Testing utilities
│   │   └── integration/      # Integration tests
│   │       └── app-verification.test.tsx
├── test-runner.cjs           # Automated test runner
├── quick-test.cjs            # Quick verification script
└── VERIFICATION_CHECKLIST.md # Manual testing guide
```

## 🔍 What Gets Tested

### Unit Tests
- Individual components in isolation
- Business logic functions
- Form validations
- State management

### Integration Tests
- Page navigation flows
- Form submissions
- API interactions
- User workflows

### Coverage Goals
- Minimum 80% code coverage
- 100% coverage for critical paths
- All user interactions tested

## 📝 Writing New Tests

### Component Test Example
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Integration Test Example
```typescript
import { render, screen, waitFor } from '../test-utils';
import userEvent from '@testing-library/user-event';

it('completes user workflow', async () => {
  const user = userEvent.setup();
  render(<App />);
  
  // Navigate to page
  await user.click(screen.getByText('Navigate'));
  
  // Interact with form
  await user.type(screen.getByLabelText('Name'), 'John Doe');
  await user.click(screen.getByText('Submit'));
  
  // Verify result
  await waitFor(() => {
    expect(screen.getByText('Success')).toBeInTheDocument();
  });
});
```

## 🛠️ Debugging Tests

### Run specific test file
```bash
npm test src/pages/__tests__/Dashboard.test.tsx
```

### Run tests matching pattern
```bash
npm test -- --grep "navigation"
```

### Debug in VS Code
1. Add breakpoint in test file
2. Run "Debug: JavaScript Debug Terminal"
3. Run test command in debug terminal

## 📊 Test Coverage

View coverage report:
```bash
npm run test:coverage
# Open coverage/index.html in browser
```

Coverage requirements:
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

## 🚨 Common Issues

### Tests failing with "Cannot find module"
- Run `npm install` to ensure dependencies are installed
- Check import paths are correct

### Tests timing out
- Increase timeout for async operations
- Use `waitFor` for elements that appear after delay

### Mock data issues
- Ensure test data matches component expectations
- Update mocks when API changes

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## ✅ Before Committing

1. Run `npm run verify`
2. Fix any failing tests
3. Check coverage hasn't decreased
4. Follow manual verification checklist for UI changes