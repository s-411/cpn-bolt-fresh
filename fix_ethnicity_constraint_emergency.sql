-- ============================================================
-- EMERGENCY FIX: Ethnicity Constraint Violation
-- ============================================================
-- This script fixes the "girls_ethnicity_check" constraint violation
-- that prevents data migration during Step 3 of onboarding.
--
-- Run this immediately to fix affected users.
--
-- Estimated time: 1-2 minutes
-- ============================================================

-- STEP 1: Identify Affected Users
-- ============================================================
-- This shows users who have accounts but no data due to failed migration

SELECT
  u.id as user_id,
  u.email,
  u.created_at as account_created,
  tos.session_token,
  tos.girl_data->>'name' as girl_name,
  tos.girl_data->>'ethnicity' as entered_ethnicity,
  tos.girl_data->>'hair_color' as entered_hair_color,
  tos.created_at as session_created
FROM users u
JOIN temp_onboarding_sessions tos ON tos.user_email = u.email
WHERE tos.completed_at IS NULL
  AND u.created_at > NOW() - INTERVAL '7 days'  -- Last 7 days
  AND NOT EXISTS (
    SELECT 1 FROM girls WHERE girls.user_id = u.id
  )
ORDER BY u.created_at DESC;

-- STEP 2: Check Invalid Ethnicity Values
-- ============================================================
-- Shows what invalid values are in the temp sessions

SELECT
  girl_data->>'ethnicity' as ethnicity_value,
  COUNT(*) as count
FROM temp_onboarding_sessions
WHERE completed_at IS NULL
  AND girl_data->>'ethnicity' IS NOT NULL
  AND girl_data->>'ethnicity' != ''
  AND girl_data->>'ethnicity' NOT IN (
    'Asian', 'Black', 'Latina', 'White', 'Middle Eastern',
    'Indian', 'Mixed', 'Native American', 'Pacific Islander', 'Other'
  )
GROUP BY girl_data->>'ethnicity'
ORDER BY count DESC;

-- STEP 3: Check Invalid Hair Color Values
-- ============================================================

SELECT
  girl_data->>'hair_color' as hair_color_value,
  COUNT(*) as count
FROM temp_onboarding_sessions
WHERE completed_at IS NULL
  AND girl_data->>'hair_color' IS NOT NULL
  AND girl_data->>'hair_color' != ''
  AND girl_data->>'hair_color' NOT IN (
    'Blonde', 'Brunette', 'Black', 'Red', 'Auburn',
    'Gray/Silver', 'Dyed/Colorful', 'Other'
  )
GROUP BY girl_data->>'hair_color'
ORDER BY count DESC;

-- STEP 4: Fix Invalid Ethnicity Values
-- ============================================================
-- Maps common variations to valid values, defaults to 'Other'

UPDATE temp_onboarding_sessions
SET girl_data = jsonb_set(
  girl_data,
  '{ethnicity}',
  CASE
    -- Common variations
    WHEN LOWER(girl_data->>'ethnicity') = 'hispanic' THEN '"Latina"'::jsonb
    WHEN LOWER(girl_data->>'ethnicity') = 'latino' THEN '"Latina"'::jsonb
    WHEN LOWER(girl_data->>'ethnicity') = 'caucasian' THEN '"White"'::jsonb
    WHEN LOWER(girl_data->>'ethnicity') LIKE '%asian%' THEN '"Asian"'::jsonb
    WHEN LOWER(girl_data->>'ethnicity') LIKE '%black%' THEN '"Black"'::jsonb
    WHEN LOWER(girl_data->>'ethnicity') LIKE '%white%' THEN '"White"'::jsonb
    WHEN LOWER(girl_data->>'ethnicity') LIKE '%latin%' THEN '"Latina"'::jsonb
    WHEN LOWER(girl_data->>'ethnicity') LIKE '%middle east%' THEN '"Middle Eastern"'::jsonb
    WHEN LOWER(girl_data->>'ethnicity') LIKE '%indian%' THEN '"Indian"'::jsonb
    WHEN LOWER(girl_data->>'ethnicity') LIKE '%native%' THEN '"Native American"'::jsonb
    WHEN LOWER(girl_data->>'ethnicity') LIKE '%pacific%' THEN '"Pacific Islander"'::jsonb
    WHEN LOWER(girl_data->>'ethnicity') LIKE '%mixed%' THEN '"Mixed"'::jsonb
    -- Already valid (just fixing case)
    WHEN girl_data->>'ethnicity' IN (
      'Asian', 'Black', 'Latina', 'White', 'Middle Eastern',
      'Indian', 'Mixed', 'Native American', 'Pacific Islander', 'Other'
    ) THEN girl_data->'ethnicity'
    -- Default to Other for unknown values
    ELSE '"Other"'::jsonb
  END
)
WHERE completed_at IS NULL
  AND girl_data->>'ethnicity' IS NOT NULL
  AND girl_data->>'ethnicity' != '';

-- STEP 5: Fix Invalid Hair Color Values
-- ============================================================

UPDATE temp_onboarding_sessions
SET girl_data = jsonb_set(
  girl_data,
  '{hair_color}',
  CASE
    -- Common variations
    WHEN LOWER(girl_data->>'hair_color') = 'blonde' THEN '"Blonde"'::jsonb
    WHEN LOWER(girl_data->>'hair_color') = 'blond' THEN '"Blonde"'::jsonb
    WHEN LOWER(girl_data->>'hair_color') = 'brunette' THEN '"Brunette"'::jsonb
    WHEN LOWER(girl_data->>'hair_color') = 'brown' THEN '"Brunette"'::jsonb
    WHEN LOWER(girl_data->>'hair_color') = 'black' THEN '"Black"'::jsonb
    WHEN LOWER(girl_data->>'hair_color') = 'red' THEN '"Red"'::jsonb
    WHEN LOWER(girl_data->>'hair_color') = 'auburn' THEN '"Auburn"'::jsonb
    WHEN LOWER(girl_data->>'hair_color') LIKE '%gray%' THEN '"Gray/Silver"'::jsonb
    WHEN LOWER(girl_data->>'hair_color') LIKE '%silver%' THEN '"Gray/Silver"'::jsonb
    WHEN LOWER(girl_data->>'hair_color') LIKE '%grey%' THEN '"Gray/Silver"'::jsonb
    WHEN LOWER(girl_data->>'hair_color') LIKE '%dyed%' THEN '"Dyed/Colorful"'::jsonb
    WHEN LOWER(girl_data->>'hair_color') LIKE '%color%' THEN '"Dyed/Colorful"'::jsonb
    WHEN LOWER(girl_data->>'hair_color') LIKE '%pink%' THEN '"Dyed/Colorful"'::jsonb
    WHEN LOWER(girl_data->>'hair_color') LIKE '%blue%' THEN '"Dyed/Colorful"'::jsonb
    WHEN LOWER(girl_data->>'hair_color') LIKE '%purple%' THEN '"Dyed/Colorful"'::jsonb
    -- Already valid (just fixing case)
    WHEN girl_data->>'hair_color' IN (
      'Blonde', 'Brunette', 'Black', 'Red', 'Auburn',
      'Gray/Silver', 'Dyed/Colorful', 'Other'
    ) THEN girl_data->'hair_color'
    -- Default to Other for unknown values
    ELSE '"Other"'::jsonb
  END
)
WHERE completed_at IS NULL
  AND girl_data->>'hair_color' IS NOT NULL
  AND girl_data->>'hair_color' != '';

-- STEP 6: Convert Empty Strings to NULL
-- ============================================================
-- The database allows NULL but not empty strings for optional constrained fields

UPDATE temp_onboarding_sessions
SET girl_data = CASE
  WHEN girl_data->>'ethnicity' = '' THEN girl_data - 'ethnicity'
  ELSE girl_data
END
WHERE completed_at IS NULL
  AND girl_data->>'ethnicity' = '';

UPDATE temp_onboarding_sessions
SET girl_data = CASE
  WHEN girl_data->>'hair_color' = '' THEN girl_data - 'hair_color'
  ELSE girl_data
END
WHERE completed_at IS NULL
  AND girl_data->>'hair_color' = '';

-- STEP 7: Verify Fixes
-- ============================================================
-- Should return 0 rows if all fixes worked

SELECT
  session_token,
  girl_data->>'ethnicity' as ethnicity,
  girl_data->>'hair_color' as hair_color
FROM temp_onboarding_sessions
WHERE completed_at IS NULL
  AND (
    (girl_data->>'ethnicity' IS NOT NULL
     AND girl_data->>'ethnicity' != ''
     AND girl_data->>'ethnicity' NOT IN (
       'Asian', 'Black', 'Latina', 'White', 'Middle Eastern',
       'Indian', 'Mixed', 'Native American', 'Pacific Islander', 'Other'
     ))
    OR
    (girl_data->>'hair_color' IS NOT NULL
     AND girl_data->>'hair_color' != ''
     AND girl_data->>'hair_color' NOT IN (
       'Blonde', 'Brunette', 'Black', 'Red', 'Auburn',
       'Gray/Silver', 'Dyed/Colorful', 'Other'
     ))
  );

-- STEP 8: Get List of Users to Retry Migration
-- ============================================================
-- These users can now retry Step 3 and migration should succeed

SELECT
  u.id as user_id,
  u.email,
  tos.session_token,
  'Ready to retry migration' as status
FROM users u
JOIN temp_onboarding_sessions tos ON tos.user_email = u.email
WHERE tos.completed_at IS NULL
  AND u.created_at > NOW() - INTERVAL '7 days'
  AND NOT EXISTS (
    SELECT 1 FROM girls WHERE girls.user_id = u.id
  )
ORDER BY u.created_at DESC;

-- ============================================================
-- NEXT STEPS:
-- ============================================================
-- 1. For each user in Step 8 results, you can either:
--    a) Have them retry Step 3 in the UI (they'll need their session token)
--    b) Manually trigger migration with:
--       SELECT migrate_temp_onboarding_to_production('session_token', 'user_id'::uuid);
--
-- 2. Send recovery email to affected users
--
-- 3. Deploy frontend fixes to prevent future occurrences
-- ============================================================
