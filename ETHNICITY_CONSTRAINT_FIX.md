# Database Constraint Violation - Ethnicity Check Error

## Error Summary

**Error**: `new row for relation "girls" violates check constraint "girls_ethnicity_check"`

**Location**: Step 3 (Account Creation) - Data migration process
**Impact**: Account created successfully, but user data not migrated to production tables
**Severity**: HIGH - User loses their onboarding progress data

---

## 1. Root Cause Analysis

### The Problem

The database constraint `girls_ethnicity_check` enforces that the `ethnicity` field must be one of these **exact values**:

```sql
ethnicity TEXT CHECK (ethnicity IN (
  'Asian', 'Black', 'Latina', 'White', 'Middle Eastern',
  'Indian', 'Mixed', 'Native American', 'Pacific Islander', 'Other'
))
```

**Location**: `supabase/migrations/20251003170314_create_cpn_database_schema.sql:99`

### Why It's Failing

The Step 1 page allows users to enter **any free-text value** in the ethnicity field:

```tsx
// Step1Page.tsx:199-207
<input
  type="text"
  placeholder="Ethnicity (optional)"
  value={formData.ethnicity || ''}
  onChange={(e) => handleChange('ethnicity', e.target.value)}
  className="..."
  autoComplete="off"
/>
```

**Problem**: Users can type values like:
- "asian" (lowercase - fails constraint)
- "Hispanic" (not in allowed list - fails)
- "latino" (not "Latina" - fails)
- "white/asian" (mixed format - fails)
- Any other free-form text

### Validation Gap

The `ValidationService.validateGirlData()` only checks **length** but not **allowed values**:

```typescript
// validation.service.ts:39-41
if (data.ethnicity && data.ethnicity.length > 50) {
  errors.push({ field: 'ethnicity', message: 'Ethnicity must be 50 characters or less' });
}
```

**Missing**: No check that ethnicity matches the database constraint values.

### Migration Failure

When the migration function tries to insert the data:

```sql
-- Migration function line 124
INSERT INTO girls (..., ethnicity, ...)
VALUES (..., (v_session.girl_data->>'ethnicity')::TEXT, ...)
```

If the ethnicity value doesn't match the constraint, PostgreSQL throws the error and the entire migration fails.

---

## 2. Immediate Fix (Quick Resolution)

### Option A: Emergency Database Fix (Fastest - 5 minutes)

**For affected users in the database right now:**

```sql
-- 1. Check for invalid data in temp_onboarding_sessions
SELECT
  session_token,
  girl_data->>'ethnicity' as entered_ethnicity,
  girl_data->>'name' as name
FROM temp_onboarding_sessions
WHERE completed_at IS NULL
  AND girl_data->>'ethnicity' IS NOT NULL
  AND girl_data->>'ethnicity' NOT IN (
    'Asian', 'Black', 'Latina', 'White', 'Middle Eastern',
    'Indian', 'Mixed', 'Native American', 'Pacific Islander', 'Other'
  );

-- 2. Fix invalid ethnicity values (map to closest match)
UPDATE temp_onboarding_sessions
SET girl_data = jsonb_set(
  girl_data,
  '{ethnicity}',
  '"Other"'::jsonb
)
WHERE completed_at IS NULL
  AND girl_data->>'ethnicity' IS NOT NULL
  AND girl_data->>'ethnicity' NOT IN (
    'Asian', 'Black', 'Latina', 'White', 'Middle Eastern',
    'Indian', 'Mixed', 'Native American', 'Pacific Islander', 'Other'
  );
```

**User Recovery**:
- Users with failed migrations can now retry Step 3
- Their data will have ethnicity set to "Other" or closest match
- Migration will succeed

### Option B: Remove Constraint Temporarily (Not Recommended)

```sql
-- Remove constraint (DANGEROUS - allows any data)
ALTER TABLE girls DROP CONSTRAINT girls_ethnicity_check;

-- Add it back later with proper validation in place
ALTER TABLE girls ADD CONSTRAINT girls_ethnicity_check
  CHECK (ethnicity IN (...));
```

**⚠️ Warning**: Only use if Option A doesn't work. This opens data quality issues.

---

## 3. Data Validation Implementation

### Frontend Validation (Recommended Solution)

Replace the free-text input with a **dropdown select** in Step1Page.tsx:

```tsx
// Step1Page.tsx - Replace lines 198-207 with:

const ETHNICITY_OPTIONS = [
  { value: '', label: 'Select ethnicity (optional)' },
  { value: 'Asian', label: 'Asian' },
  { value: 'Black', label: 'Black' },
  { value: 'Latina', label: 'Latina' },
  { value: 'White', label: 'White' },
  { value: 'Middle Eastern', label: 'Middle Eastern' },
  { value: 'Indian', label: 'Indian' },
  { value: 'Mixed', label: 'Mixed' },
  { value: 'Native American', label: 'Native American' },
  { value: 'Pacific Islander', label: 'Pacific Islander' },
  { value: 'Other', label: 'Other' },
];

// Replace the input with select
<select
  value={formData.ethnicity || ''}
  onChange={(e) => handleChange('ethnicity', e.target.value)}
  className="w-full bg-cpn-dark border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-cpn-yellow transition-colors"
  disabled={submitting}
>
  {ETHNICITY_OPTIONS.map((option) => (
    <option key={option.value} value={option.value}>
      {option.label}
    </option>
  ))}
</select>
```

### Backend Validation (Defense in Depth)

Add validation to `ValidationService.validateGirlData()`:

```typescript
// validation.service.ts - Add after line 41

const ALLOWED_ETHNICITIES = [
  'Asian', 'Black', 'Latina', 'White', 'Middle Eastern',
  'Indian', 'Mixed', 'Native American', 'Pacific Islander', 'Other'
];

if (data.ethnicity && data.ethnicity.length > 0) {
  if (data.ethnicity.length > 50) {
    errors.push({ field: 'ethnicity', message: 'Ethnicity must be 50 characters or less' });
  }

  if (!ALLOWED_ETHNICITIES.includes(data.ethnicity)) {
    errors.push({
      field: 'ethnicity',
      message: `Ethnicity must be one of: ${ALLOWED_ETHNICITIES.join(', ')}`
    });
  }
}
```

### Hair Color Validation (Same Issue)

The `hair_color` field has the same problem. Apply the same fix:

```typescript
const HAIR_COLOR_OPTIONS = [
  { value: '', label: 'Select hair color (optional)' },
  { value: 'Blonde', label: 'Blonde' },
  { value: 'Brunette', label: 'Brunette' },
  { value: 'Black', label: 'Black' },
  { value: 'Red', label: 'Red' },
  { value: 'Auburn', label: 'Auburn' },
  { value: 'Gray/Silver', label: 'Gray/Silver' },
  { value: 'Dyed/Colorful', label: 'Dyed/Colorful' },
  { value: 'Other', label: 'Other' },
];
```

---

## 4. Prevention Strategy

### A. Database Level Protection

#### Option 1: Make Fields Nullable (Recommended)

Since these fields are optional, allow NULL instead of empty strings:

```sql
-- Migration: relax_ethnicity_constraint.sql
ALTER TABLE girls
  ALTER COLUMN ethnicity DROP NOT NULL;

-- Constraint already allows NULL, but ensure empty strings become NULL
CREATE OR REPLACE FUNCTION normalize_girl_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Convert empty strings to NULL for constrained fields
  IF NEW.ethnicity = '' THEN
    NEW.ethnicity := NULL;
  END IF;

  IF NEW.hair_color = '' THEN
    NEW.hair_color := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER normalize_girl_data_before_insert
  BEFORE INSERT OR UPDATE ON girls
  FOR EACH ROW
  EXECUTE FUNCTION normalize_girl_data();
```

#### Option 2: Add Better Error Handling in Migration Function

Update the migration function to handle invalid values gracefully:

```sql
-- Update migration function (lines 106-130)
CREATE OR REPLACE FUNCTION migrate_temp_onboarding_to_production(
  p_session_token TEXT,
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_session RECORD;
  v_girl_id UUID;
  v_ethnicity TEXT;
  v_hair_color TEXT;
  v_result JSONB;
BEGIN
  -- ... existing code ...

  -- Validate and sanitize ethnicity
  v_ethnicity := (v_session.girl_data->>'ethnicity')::TEXT;
  IF v_ethnicity IS NOT NULL AND v_ethnicity != '' THEN
    -- Check if it's a valid value
    IF v_ethnicity NOT IN (
      'Asian', 'Black', 'Latina', 'White', 'Middle Eastern',
      'Indian', 'Mixed', 'Native American', 'Pacific Islander', 'Other'
    ) THEN
      -- Map common variations or default to 'Other'
      v_ethnicity := CASE
        WHEN LOWER(v_ethnicity) = 'hispanic' THEN 'Latina'
        WHEN LOWER(v_ethnicity) = 'caucasian' THEN 'White'
        WHEN LOWER(v_ethnicity) LIKE '%asian%' THEN 'Asian'
        WHEN LOWER(v_ethnicity) LIKE '%black%' THEN 'Black'
        ELSE 'Other'
      END;
    END IF;
  ELSE
    v_ethnicity := NULL; -- Convert empty to NULL
  END IF;

  -- Same for hair_color
  v_hair_color := (v_session.girl_data->>'hair_color')::TEXT;
  IF v_hair_color IS NOT NULL AND v_hair_color != '' THEN
    IF v_hair_color NOT IN (
      'Blonde', 'Brunette', 'Black', 'Red', 'Auburn',
      'Gray/Silver', 'Dyed/Colorful', 'Other'
    ) THEN
      v_hair_color := 'Other';
    END IF;
  ELSE
    v_hair_color := NULL;
  END IF;

  -- Insert with sanitized values
  INSERT INTO girls (
    user_id, name, age, rating,
    ethnicity,      -- Use sanitized value
    hair_color,     -- Use sanitized value
    location_city, location_country, is_active
  )
  VALUES (
    p_user_id,
    (v_session.girl_data->>'name')::TEXT,
    (v_session.girl_data->>'age')::INTEGER,
    COALESCE((v_session.girl_data->>'rating')::NUMERIC, 6.0),
    v_ethnicity,    -- Sanitized
    v_hair_color,   -- Sanitized
    (v_session.girl_data->>'location_city')::TEXT,
    (v_session.girl_data->>'location_country')::TEXT,
    true
  )
  RETURNING id INTO v_girl_id;

  -- ... rest of function ...
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### B. Application Level Protection

#### 1. Constants File for Allowed Values

Create `src/lib/constants/formOptions.ts`:

```typescript
export const ETHNICITY_OPTIONS = [
  { value: '', label: 'Select ethnicity (optional)' },
  { value: 'Asian', label: 'Asian' },
  { value: 'Black', label: 'Black' },
  { value: 'Latina', label: 'Latina' },
  { value: 'White', label: 'White' },
  { value: 'Middle Eastern', label: 'Middle Eastern' },
  { value: 'Indian', label: 'Indian' },
  { value: 'Mixed', label: 'Mixed' },
  { value: 'Native American', label: 'Native American' },
  { value: 'Pacific Islander', label: 'Pacific Islander' },
  { value: 'Other', label: 'Other' },
] as const;

export const ALLOWED_ETHNICITIES = ETHNICITY_OPTIONS
  .map(opt => opt.value)
  .filter(val => val !== '');

export const HAIR_COLOR_OPTIONS = [
  { value: '', label: 'Select hair color (optional)' },
  { value: 'Blonde', label: 'Blonde' },
  { value: 'Brunette', label: 'Brunette' },
  { value: 'Black', label: 'Black' },
  { value: 'Red', label: 'Red' },
  { value: 'Auburn', label: 'Auburn' },
  { value: 'Gray/Silver', label: 'Gray/Silver' },
  { value: 'Dyed/Colorful', label: 'Dyed/Colorful' },
  { value: 'Other', label: 'Other' },
] as const;

export const ALLOWED_HAIR_COLORS = HAIR_COLOR_OPTIONS
  .map(opt => opt.value)
  .filter(val => val !== '');
```

#### 2. Update All Forms

Apply to these files:
- `src/pages/step-onboarding/Step1Page.tsx` (onboarding)
- `src/components/AddGirlModal.tsx` (add girl)
- `src/components/EditGirlModal.tsx` (edit girl)
- `src/pages/DataEntry.tsx` (quick entry)

#### 3. Add Migration Test Suite

Create `src/services/onboarding/migration.service.test.ts`:

```typescript
describe('MigrationService - Constraint Validation', () => {
  it('should handle invalid ethnicity values', async () => {
    const invalidData = {
      name: 'Test',
      age: 25,
      rating: 8.0,
      ethnicity: 'hispanic', // Invalid - not in constraint list
      hair_color: 'blonde',   // Invalid - lowercase
    };

    // Test that validation catches this
    const validation = ValidationService.validateGirlData(invalidData);
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContainEqual({
      field: 'ethnicity',
      message: expect.stringContaining('must be one of')
    });
  });

  it('should allow empty ethnicity', async () => {
    const validData = {
      name: 'Test',
      age: 25,
      rating: 8.0,
      ethnicity: '', // Empty should be allowed
    };

    const validation = ValidationService.validateGirlData(validData);
    expect(validation.isValid).toBe(true);
  });
});
```

### C. Monitoring and Alerting

Add error tracking to catch similar issues:

```typescript
// In migration.service.ts
static async migrateSessionDataToUser(userId: string): Promise<MigrationResult> {
  try {
    // ... existing code ...
  } catch (error) {
    console.error('Migration service error:', error);

    // Send to error tracking service (e.g., Sentry)
    if (error instanceof Error && error.message.includes('check constraint')) {
      // Alert: Database constraint violation
      trackConstraintViolation({
        constraint: extractConstraintName(error.message),
        userId,
        error: error.message,
      });
    }

    return {
      success: false,
      error: error as Error,
    };
  }
}
```

---

## 5. User Impact Assessment

### Affected Users

**Who is impacted**:
- Users who entered free-text ethnicity or hair color values that don't match the database constraints
- Users who typed lowercase variations (e.g., "asian" instead of "Asian")
- Users who entered values like "Hispanic", "Caucasian", "Brown hair", etc.

**Current State**:
- ✅ User account created successfully in `auth.users`
- ✅ User record exists in `users` table
- ❌ Girl profile NOT created in `girls` table
- ❌ Data entry NOT created in `data_entries` table
- ❌ Temporary session still exists with `completed_at = NULL`

### User Experience Impact

**What users see**:
```
"Account created but failed to save your data. Please contact support."
```

**What users experience**:
1. They can sign in successfully
2. Their dashboard is empty (no girls, no data)
3. They lost all the onboarding data they entered
4. They need to re-enter everything manually

### Recovery Path for Affected Users

#### Option 1: Manual Data Re-entry (Current)
- User signs in
- Dashboard is empty
- Must manually add girl profile via "Add Girl" button
- Must manually add data entry

#### Option 2: Automated Recovery (Recommended)

1. **Identify affected users**:
```sql
SELECT
  u.id as user_id,
  u.email,
  tos.session_token,
  tos.girl_data,
  tos.entry_data,
  tos.created_at
FROM users u
JOIN temp_onboarding_sessions tos ON tos.user_email = u.email
WHERE tos.completed_at IS NULL
  AND u.created_at > '2025-10-01' -- Recent users
  AND NOT EXISTS (
    SELECT 1 FROM girls WHERE girls.user_id = u.id
  );
```

2. **Fix their temp data**:
```sql
-- Fix ethnicity values
UPDATE temp_onboarding_sessions
SET girl_data = jsonb_set(
  girl_data,
  '{ethnicity}',
  CASE
    WHEN girl_data->>'ethnicity' IN (
      'Asian', 'Black', 'Latina', 'White', 'Middle Eastern',
      'Indian', 'Mixed', 'Native American', 'Pacific Islander', 'Other'
    ) THEN girl_data->'ethnicity'
    ELSE '"Other"'::jsonb
  END
)
WHERE completed_at IS NULL
  AND girl_data->>'ethnicity' IS NOT NULL
  AND girl_data->>'ethnicity' != '';

-- Fix hair_color values
UPDATE temp_onboarding_sessions
SET girl_data = jsonb_set(
  girl_data,
  '{hair_color}',
  CASE
    WHEN girl_data->>'hair_color' IN (
      'Blonde', 'Brunette', 'Black', 'Red', 'Auburn',
      'Gray/Silver', 'Dyed/Colorful', 'Other'
    ) THEN girl_data->'hair_color'
    ELSE '"Other"'::jsonb
  END
)
WHERE completed_at IS NULL
  AND girl_data->>'hair_color' IS NOT NULL
  AND girl_data->>'hair_color' != '';
```

3. **Re-run migration**:
```sql
-- For each affected user
SELECT migrate_temp_onboarding_to_production(
  'their_session_token',
  'their_user_id'::uuid
);
```

4. **Send recovery email**:
```
Subject: Your CPN Data Has Been Restored

Hi [Name],

We noticed you experienced an issue during signup that prevented your
initial data from being saved. Good news - we've recovered your data!

Your girl profile and data entry have now been added to your account.
Please sign in to verify everything looks correct:

https://your-app.com/

If anything seems incorrect, please reply to this email.

Thanks for your patience!
The CPN Team
```

### Support Response Template

For users who contact support:

```
Hi [User],

I'm sorry you experienced this issue during signup. This was caused by
a data validation problem that we've now fixed.

Here's what happened:
- Your account was created successfully
- Your onboarding data couldn't be transferred due to a format mismatch
- We've now corrected the issue and recovered your data

Your account should now show:
- 1 girl profile
- 1 data entry
- All the information you entered during onboarding

Please sign in and verify everything looks correct. If you notice any
issues or missing data, please let me know.

We've implemented additional validation to prevent this from happening
to other users in the future.

Thanks for your patience!
```

---

## 6. Implementation Checklist

### Immediate (Today)

- [ ] Run SQL to identify affected users
- [ ] Run SQL to fix invalid ethnicity/hair_color values in temp tables
- [ ] Re-run migration for affected users
- [ ] Send recovery emails to affected users
- [ ] Monitor for any additional failures

### Short-term (This Week)

- [ ] Replace ethnicity text input with dropdown in Step1Page.tsx
- [ ] Replace hair_color text input with dropdown in Step1Page.tsx
- [ ] Add validation to ValidationService for allowed values
- [ ] Update AddGirlModal.tsx with dropdowns
- [ ] Update EditGirlModal.tsx with dropdowns
- [ ] Update DataEntry.tsx with dropdowns
- [ ] Add migration function sanitization logic
- [ ] Deploy fixes to production

### Medium-term (This Sprint)

- [ ] Create constants file for form options
- [ ] Add comprehensive migration tests
- [ ] Implement error tracking for constraint violations
- [ ] Add database trigger for empty string → NULL conversion
- [ ] Update documentation
- [ ] Review all other CHECK constraints for similar issues

### Long-term (Next Sprint)

- [ ] Audit all database constraints for UX mismatches
- [ ] Implement constraint-driven form generation
- [ ] Add migration retry logic in UI
- [ ] Create admin dashboard for failed migrations
- [ ] Add proactive data validation before migration
- [ ] Implement better error messages for users

---

## 7. Testing Plan

### Manual Testing

1. **Test invalid ethnicity entry**:
   - Go to Step 1
   - Enter "hispanic" (lowercase) in ethnicity
   - Complete steps 2-3
   - Verify: Should show validation error OR auto-correct to "Latina"

2. **Test empty ethnicity**:
   - Go to Step 1
   - Leave ethnicity blank
   - Complete steps 2-3
   - Verify: Migration succeeds, ethnicity is NULL

3. **Test valid ethnicity from dropdown**:
   - Go to Step 1
   - Select "Asian" from dropdown
   - Complete steps 2-3
   - Verify: Migration succeeds, ethnicity is "Asian"

### Automated Testing

```typescript
// Add to migration.service.test.ts

describe('Ethnicity Constraint Validation', () => {
  const VALID_ETHNICITIES = [
    'Asian', 'Black', 'Latina', 'White', 'Middle Eastern',
    'Indian', 'Mixed', 'Native American', 'Pacific Islander', 'Other'
  ];

  const INVALID_ETHNICITIES = [
    'asian',      // lowercase
    'Hispanic',   // not in list
    'Caucasian',  // not in list
    'white/asian', // mixed format
    'Other race',  // has space
  ];

  INVALID_ETHNICITIES.forEach(ethnicity => {
    it(`should reject invalid ethnicity: ${ethnicity}`, async () => {
      const data = {
        name: 'Test',
        age: 25,
        rating: 8.0,
        ethnicity,
      };

      const validation = ValidationService.validateGirlData(data);
      expect(validation.isValid).toBe(false);
    });
  });

  VALID_ETHNICITIES.forEach(ethnicity => {
    it(`should accept valid ethnicity: ${ethnicity}`, async () => {
      const data = {
        name: 'Test',
        age: 25,
        rating: 8.0,
        ethnicity,
      };

      const validation = ValidationService.validateGirlData(data);
      expect(validation.isValid).toBe(true);
    });
  });
});
```

---

## 8. Summary

### Root Cause
Database CHECK constraint requires exact values, but frontend allows free-text input, causing migration failures.

### Immediate Fix
Run SQL to sanitize existing invalid data and retry migrations for affected users.

### Long-term Solution
- Replace text inputs with dropdowns
- Add frontend and backend validation
- Improve migration function to handle edge cases
- Add monitoring and alerts

### User Impact
- Users with invalid data: Account created but data lost
- Recovery: Run SQL fixes and retry migration
- Prevention: Fix forms to prevent invalid input

### Priority
**HIGH** - Affects new user onboarding and data integrity

---

## 9. Related Issues to Check

Similar problems may exist with:
- ❓ `hair_color` field (same CHECK constraint issue)
- ❓ `subscription_tier` field in users table
- ❓ `subscription_status` field in users table
- ❓ Any other TEXT fields with CHECK constraints

Run audit:
```sql
SELECT
  conname as constraint_name,
  conrelid::regclass as table_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE contype = 'c'  -- CHECK constraints
  AND connamespace = 'public'::regnamespace
ORDER BY conrelid::regclass::text;
```
