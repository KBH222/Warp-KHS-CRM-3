# KHS CRM - Important Commands for Claude

## Before Making Any Changes

**ALWAYS** run the verification script first:

```bash
npm run verify
```

This will:
- Check TypeScript types
- Run ESLint
- Execute all tests

## Testing Commands

### Quick Test (Use before any changes)
```bash
npm run verify
```

### Full Test Suite (Use before major changes)
```bash
npm run verify:full
```

### Individual Commands
```bash
npm run typecheck    # TypeScript type checking
npm run lint         # ESLint code quality
npm run test:run     # Run all tests once
npm run build        # Test production build
```

## Recent Features

### Clickable Phone Numbers & Addresses (Implemented)
- Phone numbers in customer cards are now clickable (opens phone dialer)
- Addresses in customer cards are now clickable (opens Google Maps)
- Both CustomersNew and CustomerDetail pages have this functionality
- Styled with blue text and underline on hover

## Key Files to Know

- `CustomersNew.tsx` - Main customers page (not Customers.tsx)
- `router/index.tsx` - Route configuration
- `VERIFICATION_CHECKLIST.md` - Manual testing guide
- `TESTING_README.md` - Testing documentation

## Common Issues

1. **Bottom tabs not working** - Use card navigation instead
2. **Modal not opening** - Check console for errors
3. **Tests failing** - Run `npm install` first

## Project Structure

```
frontend/
├── src/
│   ├── pages/          # Page components
│   ├── components/     # Reusable components
│   ├── router/         # Routing configuration
│   └── test/           # Test utilities
```

## Development Server

```bash
npm run dev
```

App runs at: http://localhost:5173