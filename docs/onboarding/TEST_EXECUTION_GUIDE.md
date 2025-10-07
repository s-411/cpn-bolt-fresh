# Onboarding Flow Test Execution Guide

Quick reference guide for running tests and validating the onboarding flow.

---

## Quick Start

```bash
# Install dependencies (if needed)
npm install

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Build project
npm run build

# Type check
npm run typecheck
```

---

## Test Suites

### 1. Unit Tests

#### Anonymous Auth Service
```bash
npm test anonymousAuth.service.test.ts
```

**Tests**:
- Anonymous session creation
- User type checking
- Session expiration validation
- Error message formatting

#### Onboarding Data Service
```bash
npm test onboardingData.service.test.ts
```

**Tests**:
- Girl data CRUD operations
- Data entry management
- Validation constraints
- Migration function

#### Session Utils
```bash
npm test session.utils.test.ts
```

**Tests**:
- Token generation
- Session validation
- Expiration checking

### 2. Component Tests

#### Onboarding Flow Component
```bash
npm test OnboardingFlow.test.tsx
```

**Tests**:
- Rendering different states
- User interactions
- Step progression
- Error handling

### 3. Integration Tests

#### Full Flow Test
```bash
npm test integration.test.ts
```

**Tests**:
- End-to-end onboarding flow
- Database operations
- RLS policy enforcement
- Data migration

**Note**: Requires valid Supabase connection. Check `.env` file.

---

## Manual Testing Checklist

### Prerequisites
- [ ] Application running (`npm run dev`)
- [ ] Supabase database accessible
- [ ] Anonymous auth enabled in Supabase
- [ ] Browser DevTools open (for debugging)

### Happy Path Testing

1. **Start Onboarding**
   - [ ] Click onboarding trigger button
   - [ ] Verify modal opens
   - [ ] Verify loading state shows briefly
   - [ ] Verify welcome step displays

2. **Step 1: Welcome**
   - [ ] Read welcome message
   - [ ] Click "Get Started" button
   - [ ] Verify progress to Step 2

3. **Step 2: Girl Entry**
   - [ ] Enter name: "Test Girl"
   - [ ] Enter age: 25
   - [ ] Select ethnicity (optional)
   - [ ] Select hair color (optional)
   - [ ] Enter location (optional)
   - [ ] Set rating: 7.5
   - [ ] Click "Next" button
   - [ ] Verify data saves (check DevTools Network)
   - [ ] Verify progress to Step 3

4. **Step 3: Data Entry**
   - [ ] Enter date (default to today)
   - [ ] Enter amount spent: 100
   - [ ] Enter duration: 60 minutes
   - [ ] Enter number of nuts: 2
   - [ ] Click "Next" button
   - [ ] Verify data saves
   - [ ] Verify progress to Step 4

5. **Step 4: Preview**
   - [ ] Verify girl data displays correctly
   - [ ] Verify data entry displays correctly
   - [ ] Verify CPN calculation shows
   - [ ] Click "Complete Onboarding" button
   - [ ] Verify migration starts

6. **Step 5: Email (Optional)**
   - [ ] Skip or enter email
   - [ ] If entering email, verify OTP sent
   - [ ] If entering email, verify OTP verification

7. **Verification**
   - [ ] Verify modal closes
   - [ ] Verify data appears in main dashboard
   - [ ] Verify girl profile visible
   - [ ] Verify data entry visible

### Error Testing

1. **Validation Errors**
   - [ ] Try age < 18 (should reject)
   - [ ] Try rating < 5.0 (should reject)
   - [ ] Try rating > 10.0 (should reject)
   - [ ] Try negative amount (should reject)
   - [ ] Try zero duration (should reject)
   - [ ] Verify error messages display

2. **Network Errors**
   - [ ] Disable network (DevTools)
   - [ ] Try to save data
   - [ ] Verify error message displays
   - [ ] Enable network
   - [ ] Verify retry works

3. **Session Errors**
   - [ ] Clear localStorage
   - [ ] Refresh page mid-flow
   - [ ] Verify session restores or error shows

### Edge Cases

1. **Browser Refresh**
   - [ ] Complete Step 2
   - [ ] Refresh browser
   - [ ] Verify session persists
   - [ ] Verify can continue from current step

2. **Back Navigation**
   - [ ] Complete Step 3
   - [ ] Click "Back" button
   - [ ] Verify Step 2 data retained
   - [ ] Navigate forward again
   - [ ] Verify no data loss

3. **Zero Nuts Entry**
   - [ ] Enter 0 for number of nuts
   - [ ] Verify saves successfully
   - [ ] Verify CPN calculation handles correctly

4. **Modal Close**
   - [ ] Start onboarding
   - [ ] Click X button
   - [ ] Verify modal closes
   - [ ] Re-open onboarding
   - [ ] Verify session restores (if saved)

---

## Database Validation

### Check Tables Exist

```sql
-- Connect to Supabase and run:
SELECT table_name,
       (SELECT COUNT(*) FROM information_schema.columns
        WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name LIKE 'onboarding_%';
```

**Expected Output**:
```
onboarding_sessions         | 11
onboarding_girls           | 12
onboarding_data_entries    | 9
```

### Check RLS is Enabled

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename LIKE 'onboarding_%';
```

**Expected Output**:
```
onboarding_sessions        | t
onboarding_girls          | t
onboarding_data_entries   | t
```

### Check Indexes Exist

```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename LIKE 'onboarding_%';
```

**Expected Output**: At least 6 indexes

### Test RLS Policies

```sql
-- As authenticated user, try to access own data (should work)
SELECT * FROM onboarding_sessions WHERE user_id = auth.uid();

-- Try to access another user's data (should return empty)
SELECT * FROM onboarding_sessions WHERE user_id != auth.uid();
```

### Check Migration Function

```sql
-- Verify function exists
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name LIKE '%onboarding%'
  AND routine_schema = 'public';
```

**Expected Output**:
```
complete_onboarding_migration    | FUNCTION
cleanup_expired_onboarding_sessions | FUNCTION
update_onboarding_updated_at     | FUNCTION
```

---

## Performance Testing

### Measure API Response Times

**Using Browser DevTools**:
1. Open Network tab
2. Filter by "Fetch/XHR"
3. Complete onboarding flow
4. Check response times:
   - Create session: Should be < 500ms
   - Save girl: Should be < 300ms
   - Save data entry: Should be < 300ms
   - Complete migration: Should be < 2000ms

### Database Query Performance

```sql
-- Test session lookup
EXPLAIN ANALYZE
SELECT * FROM onboarding_sessions
WHERE user_id = 'test-uuid'
  AND is_completed = false;

-- Expected: Index Scan, < 5ms

-- Test girl data lookup
EXPLAIN ANALYZE
SELECT * FROM onboarding_girls
WHERE session_id = 'test-uuid';

-- Expected: Index Scan, < 5ms
```

---

## Troubleshooting

### Tests Failing

**Problem**: Unit tests fail with "cannot find module"
**Solution**:
```bash
npm install
npm run typecheck
```

**Problem**: Integration tests timeout
**Solution**:
- Check `.env` has correct Supabase credentials
- Verify Supabase project is accessible
- Increase timeout in test file

**Problem**: Database tests fail
**Solution**:
- Verify anonymous auth enabled in Supabase
- Check RLS policies are applied
- Ensure migration has been run

### Build Failing

**Problem**: TypeScript compilation errors
**Solution**:
```bash
npm run typecheck
# Fix any type errors shown
```

**Problem**: Missing dependencies
**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Runtime Issues

**Problem**: Onboarding modal doesn't open
**Solution**:
- Check browser console for errors
- Verify feature flag is enabled
- Check AuthContext is providing session

**Problem**: Data not saving
**Solution**:
- Check Network tab for API errors
- Verify Supabase connection
- Check RLS policies allow insert

**Problem**: Migration fails
**Solution**:
- Check database function exists
- Verify user permissions
- Review function logs in Supabase

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test Onboarding Flow

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run type check
        run: npm run typecheck

      - name: Run unit tests
        run: npm test -- --run

      - name: Build project
        run: npm run build

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Test Results Interpretation

### Coverage Report

```bash
npm run test:coverage
```

**Good Coverage**:
- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%

**Areas to Focus**:
- Uncovered error paths
- Edge case handling
- Component interaction logic

### Success Criteria

✅ **All tests pass**
✅ **Build succeeds**
✅ **No TypeScript errors**
✅ **Coverage > 80%**
✅ **Performance thresholds met**
✅ **Manual testing checklist complete**

---

## Getting Help

**Documentation**:
- Phase 5 Testing Report: `docs/onboarding/PHASE_5_TESTING_VALIDATION.md`
- Implementation Plan: `docs/onboarding/anonymous-session-implementation-plan.md`

**Common Issues**:
- Check existing test files for patterns
- Review Supabase dashboard for data
- Use browser DevTools for debugging

**Support**:
- Check project README
- Review test files for examples
- Consult implementation docs

---

**Last Updated**: October 7, 2025
**Version**: 1.0
**Status**: Production Ready
