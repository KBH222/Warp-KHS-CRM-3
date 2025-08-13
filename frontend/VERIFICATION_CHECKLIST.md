# KHS CRM Manual Verification Checklist

## 🔍 Pre-Change Verification

Before making any code changes, verify the following:

### 1. Run Automated Tests
```bash
# Run the automated test suite
node test-runner.js

# Or run individual test commands:
npm run typecheck     # TypeScript type checking
npm run lint          # ESLint code quality
npm test -- --run     # Unit and integration tests
npm run build         # Production build test
```

### 2. Manual Testing Checklist

#### 🏠 Dashboard Page
- [ ] Dashboard loads without errors
- [ ] All 4 navigation cards are visible (Customers, Jobs, Materials, Profile)
- [ ] Cards have proper colors (Blue, Green, Purple, Gray)
- [ ] Cards are large enough for gloved hands (min 150px height)
- [ ] Clicking each card navigates to the correct page

#### 👥 Customers Page
- [ ] Customer list loads and displays mock data
- [ ] Search bar is visible and functional
- [ ] "Add Customer" button is visible and clickable
- [ ] Customer cards show:
  - [ ] Name, email, phone, address
  - [ ] Total spent and job count
  - [ ] Call and Text buttons
  - [ ] Notes (if present)
- [ ] Clicking a customer navigates to detail page
- [ ] Call button initiates phone call (tel: link)
- [ ] Text button initiates SMS (sms: link)

#### ➕ Add Customer Modal
- [ ] Modal opens when "Add Customer" is clicked
- [ ] All form fields are present:
  - [ ] Name, Email, Phone
  - [ ] Street Address, Zip, City, State
- [ ] Phone number auto-formats as (555) 123-4567
- [ ] Entering zip code auto-fills city and state
- [ ] Form validation works (required fields)
- [ ] Submit button adds customer to list
- [ ] Cancel button closes modal
- [ ] Modal can be closed by clicking outside

#### 🔍 Search Functionality
- [ ] Search filters customers in real-time
- [ ] Search works for name, email, phone, and address
- [ ] "No customers found" message appears when no matches

#### 🔧 Jobs Page
- [ ] Jobs page loads without errors
- [ ] Back button returns to dashboard

#### 📦 Materials Page
- [ ] Materials page loads without errors
- [ ] Back button returns to dashboard

#### 👤 Profile Page
- [ ] Profile page loads without errors
- [ ] Back button returns to dashboard

### 3. Mobile Responsiveness
- [ ] Test on mobile viewport (375px width)
- [ ] All touch targets are at least 48px
- [ ] Text is readable without zooming
- [ ] Forms are easy to fill on mobile
- [ ] Modals fit within viewport

### 4. Performance Checks
- [ ] Pages load quickly (< 2 seconds)
- [ ] No console errors in browser DevTools
- [ ] Network tab shows no failed requests
- [ ] Memory usage is reasonable

## 📝 Post-Change Verification

After making code changes:

### 1. Re-run Automated Tests
```bash
node test-runner.js
```

### 2. Specific Feature Testing
Test the specific feature you modified plus:
- [ ] Features that interact with your changes
- [ ] Parent components that use your modified component
- [ ] Child components that receive props from your changes

### 3. Regression Testing
- [ ] Verify all items from Pre-Change Verification still work
- [ ] Check for visual regressions
- [ ] Ensure no new console errors

### 4. Cross-Browser Testing
If changes affect UI:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Edge

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] All automated tests pass
- [ ] Manual testing complete
- [ ] No console errors
- [ ] Build completes successfully
- [ ] Bundle size hasn't increased significantly
- [ ] Performance metrics are acceptable

## 📊 Test Coverage Goals

Maintain minimum coverage:
- Unit Tests: 80%
- Integration Tests: Key user flows
- E2E Tests: Critical paths

## 🛠️ Troubleshooting

If tests fail:

1. Check error messages in test output
2. Run failing test in isolation
3. Check for environment issues
4. Verify test data/mocks are correct
5. Check for timing issues in async tests

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)