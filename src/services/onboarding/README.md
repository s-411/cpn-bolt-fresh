# Onboarding Services

This directory contains services for managing the multi-step onboarding flow with temporary data storage and migration to production tables.

## Architecture Overview

The onboarding system uses a dual-storage approach:
1. **Local Storage** - Client-side persistence for immediate data access and offline capability
2. **Database Sessions** - Server-side persistence via `temp_onboarding_sessions` table

This ensures data is never lost during the onboarding process, even if the user refreshes the page or navigates away.

## Services

### SessionService

Manages temporary onboarding sessions with the database.

```typescript
import { SessionService } from './session.service';

// Create a new session
const { session, error } = await SessionService.createSession();

// Get current session
const { session, error } = await SessionService.getSession(token);

// Update current step
await SessionService.updateStep(token, 2);

// Save girl data
await SessionService.saveGirlData(token, girlData);

// Save entry data
await SessionService.saveEntryData(token, entryData);
```

**Key Features:**
- Generates unique session tokens
- Stores tokens in localStorage for persistence
- 2-hour session expiration
- Automatic token management

### StorageService

Manages client-side localStorage for form data persistence.

```typescript
import { StorageService } from './storage.service';

// Save girl data locally
StorageService.saveGirlData({ name: 'Jane', age: 25, rating: 8.0 });

// Retrieve girl data
const girlData = StorageService.getGirlData();

// Save entry data
StorageService.saveEntryData({
  date: '2025-10-09',
  amount_spent: 100,
  duration_minutes: 60,
  number_of_nuts: 2,
});

// Check if any data exists
const hasData = StorageService.hasStoredData();

// Clear all onboarding data
StorageService.clearAll();
```

**Key Features:**
- Automatic key prefixing (`cpn_onboarding_`)
- Type-safe data operations
- Timestamp tracking for updates
- Safe error handling

### PersistenceService

High-level service that coordinates between SessionService and StorageService.

```typescript
import { PersistenceService } from './persistence.service';

// Initialize session (checks for existing or creates new)
const { data: session, error } = await PersistenceService.initializeSession();

// Save girl data (to both local and server)
await PersistenceService.saveGirl(girlData);

// Save entry data
await PersistenceService.saveEntry(entryData);

// Update current step
await PersistenceService.updateCurrentStep(3);

// Sync with server
await PersistenceService.syncWithServer();

// Get local data
const girlData = PersistenceService.getLocalGirlData();
const entryData = PersistenceService.getLocalEntryData();

// Clear everything
PersistenceService.clearAllData();
```

**Key Features:**
- Unified interface for data operations
- Automatic dual-storage (local + server)
- Server sync capabilities
- Session recovery

### ValidationService

Validates form data before saving or submission.

```typescript
import { ValidationService } from './validation.service';

// Validate girl data
const result = ValidationService.validateGirlData({
  name: 'Jane',
  age: 25,
  rating: 8.0,
});

if (!result.isValid) {
  console.log(result.errors); // Array of ValidationError
}

// Validate entry data
const entryResult = ValidationService.validateEntryData({
  date: '2025-10-09',
  amount_spent: 100,
  duration_minutes: 60,
  number_of_nuts: 2,
});

// Validate email
const emailResult = ValidationService.validateEmail('user@example.com');

// Validate password
const passwordResult = ValidationService.validatePassword('mypassword123');

// Helper methods
const errorMsg = ValidationService.getErrorMessage('name', result.errors);
const hasError = ValidationService.hasFieldError('age', result.errors);
const allMessages = ValidationService.getAllErrorMessages(result.errors);
```

**Validation Rules:**

**Girl Data:**
- name: Required, max 100 chars
- age: Required, 18-120
- rating: Required, 5.0-10.0
- ethnicity: Optional, max 50 chars
- hair_color: Optional, max 50 chars
- location_city: Optional, max 100 chars
- location_country: Optional, max 100 chars

**Entry Data:**
- date: Required, valid date, not in future
- amount_spent: Required, >= 0, < 1,000,000
- duration_minutes: Required, > 0, <= 1440 (24 hours)
- number_of_nuts: Required, >= 0, < 100

**Email:**
- Required, valid format, max 255 chars

**Password:**
- Required, 8-72 chars

### MigrationService

Handles migration of temporary session data to production tables after user signup.

```typescript
import { MigrationService } from './migration.service';

// Migrate session data after user signs up
const result = await MigrationService.migrateSessionDataToUser(userId);

if (result.success) {
  console.log('Girl ID:', result.girlId);
  console.log('User ID:', result.userId);
}

// Check if user has completed onboarding
const { completed } = await MigrationService.checkMigrationStatus(userId);

// Verify migrated data exists
const verification = await MigrationService.verifyMigratedData(userId);
console.log('Has girl:', verification.hasGirl);
console.log('Has entry:', verification.hasEntry);

// Cleanup expired sessions (admin function)
const cleanup = await MigrationService.cleanupExpiredSessions();
console.log('Deleted:', cleanup.deletedCount);

// Get metrics
const metrics = await MigrationService.getSessionMetrics();
console.log('Total sessions:', metrics.totalSessions);
console.log('Completed:', metrics.completedSessions);
console.log('Active:', metrics.activeSessions);
```

**Key Features:**
- Calls database RPC function for safe migration
- Automatic cleanup after successful migration
- Verification methods for debugging
- Admin utilities for session management

## Usage Flow

### Step 1: Initialize Session

```typescript
import { PersistenceService } from '@/services/onboarding';

const { data: session, error } = await PersistenceService.initializeSession();
if (error) {
  // Handle error
}
```

### Step 2: Save Girl Data

```typescript
import { ValidationService, PersistenceService } from '@/services/onboarding';

const girlData = {
  name: 'Jane',
  age: 25,
  rating: 8.0,
};

// Validate first
const validation = ValidationService.validateGirlData(girlData);
if (!validation.isValid) {
  // Show errors
  return;
}

// Save
const result = await PersistenceService.saveGirl(girlData);
if (result.success) {
  // Navigate to step 2
}
```

### Step 3: Save Entry Data

```typescript
const entryData = {
  date: '2025-10-09',
  amount_spent: 100,
  duration_minutes: 60,
  number_of_nuts: 2,
};

const validation = ValidationService.validateEntryData(entryData);
if (!validation.isValid) {
  // Show errors
  return;
}

const result = await PersistenceService.saveEntry(entryData);
if (result.success) {
  // Navigate to step 3
}
```

### Step 4: Sign Up and Migrate

```typescript
import { supabase } from '@/lib/supabase/client';
import { MigrationService } from '@/services/onboarding';

// Sign up user
const { data: authData, error: authError } = await supabase.auth.signUp({
  email,
  password,
});

if (authError || !authData.user) {
  // Handle error
  return;
}

// Migrate session data to user account
const result = await MigrationService.migrateSessionDataToUser(authData.user.id);

if (result.success) {
  // Navigate to step 4 or welcome page
} else {
  // Handle migration error
}
```

## Error Handling

All services return consistent error structures:

```typescript
interface PersistenceResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}
```

Always check for errors before proceeding:

```typescript
const result = await PersistenceService.saveGirl(girlData);
if (!result.success) {
  console.error('Failed to save:', result.error?.message);
  // Show user-friendly error message
  return;
}
```

## Testing

Run tests with:

```bash
npm test src/services/onboarding/onboarding.service.test.ts
```

## Security Considerations

1. **Session Tokens**: Stored in localStorage and act as bearer tokens. Keep secure.
2. **Expiration**: Sessions expire after 2 hours to limit exposure.
3. **No RLS**: `temp_onboarding_sessions` table has RLS disabled for unauthenticated access.
4. **Data Cleanup**: Expired sessions are automatically cleaned up.
5. **Migration**: Uses SECURITY DEFINER function for safe data transfer.

## Database Functions

The services rely on these PostgreSQL functions:

- `migrate_temp_onboarding_to_production(session_token, user_id)` - Migrates data
- `cleanup_expired_temp_onboarding_sessions()` - Cleanup expired sessions

These are created in the database migration file.
