# Step-Based Onboarding Pages

This directory contains the multi-step onboarding flow pages (/step-1 through /step-4).

## Overview

The step-based onboarding provides a guided experience for unauthenticated users to:
1. Add girl profile information
2. Add a data entry
3. Create an account
4. Choose a subscription plan

## Pages

### Step 1 - Add Girl Form (`Step1Page.tsx`)

The first step collects basic information about a girl profile.

**Route:** `/step-1`

**Features:**
- Mobile-responsive centered layout
- No navigation menu (clean, focused experience)
- Form fields:
  - Name (required)
  - Age (required, 18-120)
  - Rating (required, 5.0-10.0, slider input)
  - Ethnicity (optional)
  - Hair Color (optional)
  - City (optional)
  - Country (optional)
- Real-time validation with error display
- Auto-saves to localStorage and database
- Progress bar showing 25% completion
- Auto-redirects to /step-2 on success

**State Management:**
- Uses `PersistenceService` for dual-storage (local + server)
- Loads existing data if user returns to page
- Validates data using `ValidationService`
- Session token stored in localStorage

**User Flow:**
1. Page loads and initializes session
2. User fills in girl information
3. On submit, data is validated
4. If valid, data saves to both localStorage and database
5. Current step updated to 2
6. Auto-redirect to /step-2

## Architecture

### Data Flow

```
User Input → Validation → PersistenceService → [localStorage + Database]
                                                        ↓
                                                  Session Token
                                                        ↓
                                                  Navigate to Step 2
```

### Session Management

Each page uses the onboarding services located in `src/services/onboarding/`:

- `SessionService` - Database session management
- `StorageService` - localStorage wrapper
- `PersistenceService` - Unified data operations
- `ValidationService` - Form validation
- `MigrationService` - Data migration after signup

### Error Handling

All pages implement consistent error handling:

```typescript
// Field-specific errors
setErrors({ name: 'Name is required' });

// General errors
setErrors({ general: 'Failed to save data. Please try again.' });
```

## Styling

Pages use Tailwind CSS with the CPN theme:

- Background: `bg-cpn-dark`
- Cards: `bg-[#1a1a1a]` with `border-gray-800`
- Primary color: `text-cpn-yellow` / `bg-cpn-yellow`
- Text: `text-white` / `text-cpn-gray`
- Focus states: `focus:border-cpn-yellow`

### Mobile Optimization

- Centered layout with `max-w-md`
- Touch-friendly input sizes (py-3)
- Responsive padding (p-4)
- No fixed headers/footers
- Full-height backgrounds

## Testing

Run tests with:

```bash
npm test src/pages/step-onboarding/Step1Page.test.tsx
```

Tests cover:
- Form rendering
- Validation errors
- Field updates
- Form submission
- Loading existing data
- Progress bar display

## Navigation Flow

```
/step-1 → /step-2 → /step-3 → /step-4 → /welcome-premium
```

No back navigation on these pages - users should progress forward through the flow.

## Security

- No authentication required for steps 1-2
- Session tokens act as bearer credentials
- 2-hour session expiration
- Data migrates to authenticated user on step 3 signup
- RLS disabled on temp tables for unauthenticated access

## Future Steps

### Step 2 - Add Data Entry (TODO)
- Collect data entry information
- Date, amount spent, duration, number of nuts
- Auto-redirect to /step-3

### Step 3 - Sign Up (TODO)
- Email and password collection
- Account creation
- Data migration to permanent tables
- Auto-redirect to /step-4

### Step 4 - Subscription Selection (TODO)
- Display calculated CPN metrics
- Show 3 subscription options
- Stripe checkout integration
- Redirect to /welcome-premium after payment

## Implementation Notes

1. All pages must be accessible without authentication
2. Data persists across page refreshes via dual-storage
3. Sessions expire after 2 hours
4. Clean, minimal design without navigation chrome
5. Mobile-first responsive layouts
6. Consistent validation and error handling
7. Auto-progression to next step on success
