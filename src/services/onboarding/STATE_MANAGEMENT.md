# State Management and Data Flow

## Overview

The onboarding system uses a **dual-storage architecture** with multiple layers to ensure data persistence, fault tolerance, and seamless user experience across page refreshes and network issues.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Components                         │
│  (StartPage, Step1-4, WelcomePremiumPage, OnboardingRouter) │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                   PersistenceService                         │
│           (High-level coordination layer)                    │
└────────┬──────────────────────────────────┬────────────────┘
         │                                   │
┌────────▼──────────┐              ┌────────▼──────────────┐
│  StorageService   │              │   SessionService       │
│  (localStorage)   │              │   (Supabase DB)        │
└───────────────────┘              └────────────────────────┘
         │                                   │
         │                                   │
┌────────▼───────────────────────────────────▼───────────────┐
│                     Validation Layer                        │
│                   (ValidationService)                       │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

### Step 1: Girl Profile Entry

```
User Input (Step1Page)
    │
    ├─> ValidationService.validateGirlData()
    │       ├─> Check name, age, rating
    │       └─> Return errors or success
    │
    ├─> PersistenceService.saveGirl()
    │       │
    │       ├─> StorageService.saveGirlData() ────> localStorage
    │       │                                        "cpn_onboarding_girl"
    │       │
    │       └─> SessionService.saveGirlData() ────> Supabase
    │                                                temp_onboarding_sessions
    │                                                girl_data JSONB field
    │
    └─> PersistenceService.updateCurrentStep(2)
            │
            ├─> StorageService.saveCurrentStep() ──> localStorage
            │                                         "cpn_onboarding_step"
            │
            └─> SessionService.updateStep() ───────> Supabase
                                                      current_step field
```

### Step 2: Data Entry

```
User Input (Step2Page)
    │
    ├─> ValidationService.validateEntryData()
    │       ├─> Check date, amount, duration, nuts
    │       └─> Return errors or success
    │
    ├─> PersistenceService.saveEntry()
    │       │
    │       ├─> StorageService.saveEntryData() ───> localStorage
    │       │                                        "cpn_onboarding_entry"
    │       │
    │       └─> SessionService.saveEntryData() ───> Supabase
    │                                                entry_data JSONB field
    │
    └─> PersistenceService.updateCurrentStep(3)
```

### Step 3: Account Creation & Data Migration

```
User Input (Step3Page: email, password)
    │
    ├─> ValidationService.validateEmail()
    ├─> ValidationService.validatePassword()
    │
    ├─> supabase.auth.signUp()
    │       └─> Creates auth.users record
    │
    ├─> MigrationService.migrateSessionDataToUser(userId)
    │       │
    │       └─> Calls: migrate_temp_onboarding_to_production(token, user_id)
    │           │
    │           ├─> Inserts into girls table
    │           │   └─> Returns girl_id
    │           │
    │           ├─> Inserts into data_entries table
    │           │   └─> Links to girl_id
    │           │
    │           ├─> Updates profiles table
    │           │   └─> Sets onboarding_completed = true
    │           │
    │           └─> Deletes temp_onboarding_sessions record
    │
    ├─> StorageService.clearAll() ───────────────> localStorage
    │                                               Removes all temp data
    │
    └─> PersistenceService.updateCurrentStep(4)
```

### Step 4: Subscription Selection

```
User selects plan (Step4Page)
    │
    ├─> Fetch: /functions/v1/stripe-checkout
    │       └─> Creates Stripe Checkout Session
    │
    ├─> Redirects to Stripe
    │
    └─> User completes payment
            │
            ├─> Stripe webhook: /functions/v1/stripe-webhook
            │       └─> Updates profiles.subscription_tier
            │
            └─> Redirects to: /welcome-premium?session_id=xxx
                    │
                    └─> WelcomePremiumPage
                            └─> Verifies subscription status
```

## State Storage Locations

### localStorage Keys

| Key | Type | Description | Lifecycle |
|-----|------|-------------|-----------|
| `cpn_onboarding_token` | string | Session token (UUID) | Until migration or expiry |
| `cpn_onboarding_girl` | JSON | Girl profile data | Until migration |
| `cpn_onboarding_entry` | JSON | Data entry information | Until migration |
| `cpn_onboarding_step` | number | Current step (1-4) | Until migration |
| `cpn_onboarding_timestamp` | ISO string | Last update time | Until migration |

### Database Tables

#### temp_onboarding_sessions

```sql
{
  session_token: uuid,           -- Unique session identifier
  girl_data: jsonb,              -- Girl profile
  entry_data: jsonb,             -- Data entry
  current_step: integer,         -- Current step (1-4)
  expires_at: timestamp,         -- 2 hours from creation
  created_at: timestamp,
  updated_at: timestamp
}
```

#### girls (Production)

```sql
{
  id: uuid,                      -- Primary key
  user_id: uuid,                 -- FK to auth.users
  name: text,
  age: integer,
  rating: numeric,
  ethnicity: text,
  hair_color: text,
  location_city: text,
  location_country: text,
  created_at: timestamp
}
```

#### data_entries (Production)

```sql
{
  id: uuid,                      -- Primary key
  user_id: uuid,                 -- FK to auth.users
  girl_id: uuid,                 -- FK to girls
  date: date,
  amount_spent: numeric,
  duration_minutes: integer,
  number_of_nuts: integer,
  created_at: timestamp
}
```

## State Synchronization

### Dual-Storage Benefits

1. **Resilience**: If server fails, data persists in localStorage
2. **Performance**: Read from localStorage (instant), write to both
3. **Offline Support**: User can fill forms offline, sync later
4. **Recovery**: Can restore from either source

### Sync Strategy

```typescript
// Write Operation (Optimistic)
async function saveData(data) {
  // 1. Save to localStorage immediately (instant feedback)
  StorageService.saveGirlData(data);

  // 2. Save to server (background)
  try {
    await SessionService.saveGirlData(token, data);
  } catch (error) {
    // Server failed but localStorage succeeded
    // User can continue, will sync later
    console.error('Server sync failed:', error);
  }
}

// Read Operation (localStorage-first)
function loadData() {
  // Always read from localStorage for instant load
  return StorageService.getGirlData();
}
```

## Session Lifecycle

### Phase 1: Session Creation (Step 1 Entry)

```
User visits /start
    │
    └─> Clicks "Get Started"
            │
            └─> Navigates to /step-1
                    │
                    ├─> Step1Page.useEffect()
                    │       └─> PersistenceService.initializeSession()
                    │               │
                    │               ├─> Check localStorage for token
                    │               │   └─> Found: Resume session
                    │               │   └─> Not found: Create new
                    │               │
                    │               └─> SessionService.createSession()
                    │                       ├─> Generate UUID token
                    │                       ├─> Store in localStorage
                    │                       └─> Create DB record
                    │
                    └─> User fills girl form
                            └─> Saves data (see Step 1 flow above)
```

### Phase 2: Session Resume (Page Refresh)

```
User refreshes page on Step 2
    │
    └─> OnboardingRouter or Step2Page loads
            │
            ├─> PersistenceService.initializeSession()
            │       ├─> Finds token in localStorage
            │       └─> SessionService.getSession(token)
            │               ├─> Fetches from DB
            │               └─> Returns session with data
            │
            ├─> StorageService.getGirlData()
            │       └─> Returns cached girl data
            │
            └─> StorageService.getEntryData()
                    └─> Returns cached entry data
```

### Phase 3: Session Migration (Sign Up)

```
User signs up (Step 3)
    │
    └─> MigrationService.migrateSessionDataToUser()
            │
            ├─> Calls DB function: migrate_temp_onboarding_to_production()
            │       │
            │       ├─> BEGIN TRANSACTION
            │       │
            │       ├─> INSERT INTO girls (...) RETURNING id
            │       ├─> INSERT INTO data_entries (girl_id, ...)
            │       ├─> UPDATE profiles SET onboarding_completed = true
            │       ├─> DELETE FROM temp_onboarding_sessions
            │       │
            │       └─> COMMIT
            │
            ├─> SessionService.clearStoredToken()
            │       └─> Removes from localStorage
            │
            └─> StorageService.clearAll()
                    └─> Removes all temp data
```

### Phase 4: Session Expiry

```
Session older than 2 hours
    │
    ├─> SessionService.getSession(token)
    │       └─> Returns null (expired)
    │
    └─> PersistenceService.initializeSession()
            └─> Creates new session
                    ├─> Generates new token
                    └─> User starts fresh
```

## Routing and Navigation Guards

### OnboardingRouter Logic

```typescript
async function determineRoute() {
  // 1. Check authentication
  const { user } = await supabase.auth.getUser();
  if (user) {
    return navigate('/'); // Already authenticated
  }

  // 2. Check data progression
  const girl = PersistenceService.getLocalGirlData();
  const entry = PersistenceService.getLocalEntryData();
  const step = PersistenceService.getCurrentStep();

  // 3. Route based on data
  if (!girl) return '/step-1';           // No data: Start
  if (!entry) return '/step-2';          // Has girl: Add entry
  if (step < 3) return '/step-3';        // Has both: Sign up
  if (step < 4) return '/step-4';        // Signed up: Subscribe

  return '/step-1'; // Fallback
}
```

## Error Handling and Recovery

### Service Layer Error Pattern

```typescript
interface PersistenceResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
}

// Usage
const result = await PersistenceService.saveGirl(girlData);
if (!result.success) {
  // Show user-friendly error
  setErrors({ general: result.error?.message || 'Failed to save' });
  return;
}
```

### Error Recovery Strategies

| Error Type | Recovery Strategy |
|------------|------------------|
| Network failure | Data saved to localStorage, retry later |
| Validation error | Show inline errors, keep form data |
| Session expired | Create new session, preserve form state |
| Migration failure | Keep temp data, allow retry |
| Auth failure | Show error, preserve form data |

## State Consistency Rules

### Invariants

1. **localStorage and DB stay in sync**: Write to both on every save
2. **Step number matches data**: Can't be on Step 3 without girl+entry
3. **Session token required**: Token must exist before any data operations
4. **Migration is atomic**: All data moves or none (database transaction)
5. **No orphaned data**: Temp data cleaned up after migration

### Validation Before State Changes

```typescript
// Before saving
const validation = ValidationService.validateGirlData(data);
if (!validation.isValid) {
  // Don't update state
  return;
}

// Before navigation
if (!hasRequiredData) {
  // Redirect to correct step
  navigate('/step-1');
  return;
}
```

## Performance Considerations

### Optimistic Updates

- UI updates immediately on user input
- Database writes happen in background
- No loading spinners for save operations (except final submit)

### Data Loading

- Read from localStorage first (instant)
- No loading states for cached data
- Only show loading during initial session check

### Network Efficiency

- Batch writes where possible
- Use single RPC call for migration (not multiple inserts)
- Cache session token in memory during page lifecycle

## Testing State Management

### Test Coverage

- ✅ Session creation and recovery
- ✅ Data persistence (localStorage + DB)
- ✅ Validation before saves
- ✅ Migration atomicity
- ✅ Error handling and recovery
- ✅ Navigation guards
- ✅ Edge cases (expired sessions, missing data)

### Key Test Scenarios

1. **Happy Path**: Create → Save → Migrate → Complete
2. **Page Refresh**: Data persists across reload
3. **Network Failure**: Continues working offline
4. **Session Expiry**: Handles gracefully
5. **Auth Check**: Prevents duplicate onboarding
6. **Data Loss**: Never loses user input

## Security Considerations

### Session Token Security

- **Storage**: localStorage (XSS vulnerable, acceptable for temp data)
- **Expiry**: 2 hours maximum lifetime
- **Scope**: Only for temp onboarding data
- **Cleanup**: Deleted after migration

### Data Access Control

- **Temp sessions**: No RLS (unauthenticated access needed)
- **Production tables**: RLS enabled (user can only access own data)
- **Migration function**: SECURITY DEFINER (safe privilege escalation)

### Data Validation

- **Client-side**: Immediate feedback, UX
- **Server-side**: Database constraints, security
- **Both required**: Defense in depth

## Debugging and Monitoring

### localStorage Inspector

```typescript
// View all onboarding data
const token = localStorage.getItem('cpn_onboarding_token');
const girl = localStorage.getItem('cpn_onboarding_girl');
const entry = localStorage.getItem('cpn_onboarding_entry');
const step = localStorage.getItem('cpn_onboarding_step');

console.log({ token, girl, entry, step });
```

### Session Metrics

```typescript
const metrics = await MigrationService.getSessionMetrics();
// Returns: { totalSessions, completedSessions, activeSessions, expiredSessions }
```

### Database Queries

```sql
-- View active sessions
SELECT session_token, current_step, created_at, expires_at
FROM temp_onboarding_sessions
WHERE expires_at > now()
ORDER BY created_at DESC;

-- View user's migrated data
SELECT g.name, g.age, g.rating, de.date, de.amount_spent, de.number_of_nuts
FROM girls g
JOIN data_entries de ON g.id = de.girl_id
WHERE g.user_id = '[user-id]';
```

## Best Practices

### Component Usage

```typescript
// ✅ DO: Use PersistenceService for coordination
const result = await PersistenceService.saveGirl(data);

// ❌ DON'T: Call low-level services directly from components
const result = await SessionService.saveGirlData(token, data);
```

### Error Handling

```typescript
// ✅ DO: Check for errors and show user feedback
if (!result.success) {
  setErrors({ general: 'Failed to save data' });
  return;
}

// ❌ DON'T: Silently fail
await PersistenceService.saveGirl(data); // No error check
```

### State Updates

```typescript
// ✅ DO: Validate before updating state
const validation = ValidationService.validateGirlData(data);
if (validation.isValid) {
  await PersistenceService.saveGirl(data);
}

// ❌ DON'T: Save invalid data
await PersistenceService.saveGirl(data); // No validation
```

## Future Enhancements

### Potential Improvements

1. **Offline Queue**: Queue writes when offline, sync when online
2. **State Machine**: Formalize state transitions
3. **Undo/Redo**: Track change history
4. **Auto-save**: Save on input (debounced)
5. **Cloud Backup**: Optional email backup link
6. **Analytics**: Track drop-off points
7. **A/B Testing**: Different onboarding flows

### Migration Path

The current architecture supports these enhancements without major refactoring:
- Services are isolated and testable
- State is centralized in PersistenceService
- Database schema supports additional metadata
- Component coupling is minimal
