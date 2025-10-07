# Environment Variable Recovery Guide

## Current Status

Your `.env` file has been successfully restored with all required variables. However, **Stripe configuration still needs your actual API keys**.

## What Was Recovered

### ✅ Fully Configured (No Action Needed)
- `VITE_APP_URL` - Your production URL
- `VITE_SUPABASE_URL` - Database connection URL
- `VITE_SUPABASE_ANON_KEY` - Database authentication key
- `VITE_ENABLE_ANONYMOUS_ONBOARDING` - Feature flag (enabled)
- `VITE_ONBOARDING_SESSION_DURATION` - Session timeout (24 hours)

### ⚠️ Requires Your Input (Placeholder Values)
- `VITE_STRIPE_PUBLISHABLE_KEY` - Needs your Stripe publishable key
- `VITE_STRIPE_PRICE_PLAYER_MODE_WEEKLY` - Needs your weekly subscription price ID
- `VITE_STRIPE_PRICE_PLAYER_MODE_ANNUAL` - Needs your annual subscription price ID

## Application Status

**Current State:** Application will run but subscription features will be disabled until Stripe keys are configured.

- ✅ Database connections work
- ✅ Authentication works
- ✅ Core features work
- ⚠️ Subscription/payment features require Stripe setup

## Quick Recovery Steps

### Option 1: Run Without Subscriptions (Fastest)
If you want to test the app without payment features:

1. The app will work as-is
2. You'll see a warning in the console about Stripe configuration
3. Users won't be able to subscribe to paid plans
4. All other features function normally

### Option 2: Configure Stripe (Complete Recovery)

Follow the detailed guide in `STRIPE_SETUP_GUIDE.md` or follow these quick steps:

1. **Get Stripe Keys** (5 minutes)
   - Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
   - Copy your Publishable Key (starts with `pk_test_`)

2. **Create Products** (10 minutes)
   - Go to [Stripe Products](https://dashboard.stripe.com/test/products)
   - Create "Player Mode Weekly" at $1.99/week
   - Create "Player Mode Annual" at $27/year
   - Copy both Price IDs (start with `price_`)

3. **Update .env File**
   ```env
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_KEY
   VITE_STRIPE_PRICE_PLAYER_MODE_WEEKLY=price_YOUR_WEEKLY_ID
   VITE_STRIPE_PRICE_PLAYER_MODE_ANNUAL=price_YOUR_ANNUAL_ID
   ```

4. **Restart Dev Server**
   ```bash
   npm run dev
   ```

5. **Verify Success**
   - Look for: "✓ Stripe Configuration Valid" in console
   - Test subscription flow

## Production Deployment

Your production site at `app.cost-per-nut.com` also needs these environment variables configured in your hosting platform:

### Required Environment Variables for Production:
```
VITE_APP_URL=https://app.cost-per-nut.com
VITE_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw
VITE_ENABLE_ANONYMOUS_ONBOARDING=true
VITE_ONBOARDING_SESSION_DURATION=86400000
VITE_STRIPE_PUBLISHABLE_KEY=<your_stripe_key>
VITE_STRIPE_PRICE_PLAYER_MODE_WEEKLY=<your_weekly_price_id>
VITE_STRIPE_PRICE_PLAYER_MODE_ANNUAL=<your_annual_price_id>
```

**Important:** Configure these in your hosting platform (Netlify, Vercel, etc.), then redeploy.

## Prevention Measures

### 1. Version Control Best Practices
Your `.env` file is correctly listed in `.gitignore`, which is good. However:

- ✅ `.env.example` is committed (safe template)
- ✅ `.env` is NOT committed (secure)
- 💡 Consider keeping a secure backup of your actual `.env` file

### 2. Backup Strategy
Create a secure backup of your `.env` file:

```bash
# Copy to a secure location outside the project
cp .env ~/.env.backups/cost-per-nut-$(date +%Y%m%d).env
```

### 3. Documentation
- Keep `STRIPE_SETUP_GUIDE.md` updated with your actual Stripe account details (but not the keys themselves)
- Document which Stripe account/project you're using
- Note the product names in Stripe that correspond to your price IDs

### 4. Environment Variable Management Tools
Consider using:
- **1Password** - Store env vars in secure notes
- **Doppler** - Environment variable management service
- **Infisical** - Open-source secrets management
- Your hosting platform's secret management (Netlify/Vercel environment variables)

### 5. Development Workflow
Before making significant changes:
1. Verify `.env` exists: `ls -la .env`
2. Check it has content: `wc -l .env` (should show ~18 lines)
3. Keep a recent backup in a secure location

## Verification Checklist

Run through this checklist to ensure everything is working:

- [ ] `.env` file exists in project root
- [ ] File contains all 8 required variables
- [ ] Supabase URL and keys are present
- [ ] App URL matches your domain
- [ ] Build completes successfully (`npm run build`)
- [ ] Dev server starts without errors (`npm run dev`)
- [ ] No "Missing Supabase environment variables" error
- [ ] Can access `/onboarding/step-1` route
- [ ] Page loads (not blank)

### Optional (If Configuring Stripe):
- [ ] Stripe publishable key added
- [ ] Weekly price ID added
- [ ] Annual price ID added
- [ ] Console shows "✓ Stripe Configuration Valid"
- [ ] Can access subscription page
- [ ] Stripe checkout loads correctly

## Troubleshooting

### Issue: Blank page in production
**Cause:** Environment variables not configured in hosting platform

**Solution:**
1. Log into your hosting platform (Netlify/Vercel)
2. Navigate to Site Settings → Environment Variables
3. Add all required variables
4. Trigger a new deployment

### Issue: "Missing Supabase environment variables" error
**Cause:** `.env` file missing or not loaded

**Solution:**
1. Verify `.env` exists: `cat .env`
2. Check variables are correct
3. Restart dev server
4. For production, check hosting platform env vars

### Issue: Build fails
**Cause:** TypeScript or dependency issues

**Solution:**
1. Run `npm install` to ensure dependencies are installed
2. Run `npm run typecheck` to identify TypeScript errors
3. Check the error message for specific issues

### Issue: Stripe warnings in console
**Cause:** Stripe keys are placeholder values

**Solution:**
- This is expected if you haven't configured Stripe yet
- App will work without subscriptions
- Follow Option 2 above to configure Stripe

## Current .env File Contents

Your `.env` file now contains:

```env
# Application URL
VITE_APP_URL=https://app.cost-per-nut.com

# Supabase Configuration
VITE_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe Configuration (needs your actual values)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
VITE_STRIPE_PRICE_PLAYER_MODE_WEEKLY=price_your_weekly_price_id_here
VITE_STRIPE_PRICE_PLAYER_MODE_ANNUAL=price_your_annual_price_id_here

# Feature Flags
VITE_ENABLE_ANONYMOUS_ONBOARDING=true
VITE_ONBOARDING_SESSION_DURATION=86400000
```

## Related Documentation

- `STRIPE_SETUP_GUIDE.md` - Complete Stripe configuration guide
- `SUBSCRIPTION_SETUP.md` - Subscription system documentation
- `.env.example` - Template with all required variables
- `README.md` - Project overview and setup

## Summary

✅ **Your `.env` file has been successfully restored!**

The application will now run with full database functionality. Subscription features will work once you configure Stripe with your actual API keys (optional, but recommended for production use).

**Next Steps:**
1. Test the application locally: `npm run dev`
2. Verify `/onboarding/step-1` loads correctly
3. (Optional) Configure Stripe for subscription features
4. Configure production environment variables in your hosting platform
5. Redeploy to production
