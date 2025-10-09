/*
  # Fix Optional Fields in Migration Function

  1. Changes
    - Update `migrate_temp_onboarding_to_production` function to handle NULL/empty optional fields
    - Converts empty strings to NULL for ethnicity, hair_color, location_city, location_country
    - Ensures these fields don't violate CHECK constraints when empty
    - Allows users to complete onboarding with only required fields (name, age, rating)

  2. Security
    - Maintains existing RLS policies
    - No changes to table structure or permissions
*/

-- Update the migration function to properly handle optional fields
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
  v_location_city TEXT;
  v_location_country TEXT;
  v_result JSONB;
BEGIN
  -- Get the temporary session data
  SELECT * INTO v_session
  FROM temp_onboarding_sessions
  WHERE session_token = p_session_token
    AND completed_at IS NULL;

  -- Check if session exists and is not already completed
  IF v_session IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Session not found or already completed'
    );
  END IF;

  -- Check if session is expired
  IF v_session.expires_at < NOW() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Session has expired'
    );
  END IF;

  -- Insert girl data into production table
  IF v_session.girl_data IS NOT NULL THEN
    -- Extract and sanitize optional fields
    -- Convert empty strings and invalid values to NULL

    v_ethnicity := NULLIF(TRIM((v_session.girl_data->>'ethnicity')::TEXT), '');
    v_hair_color := NULLIF(TRIM((v_session.girl_data->>'hair_color')::TEXT), '');
    v_location_city := NULLIF(TRIM((v_session.girl_data->>'location_city')::TEXT), '');
    v_location_country := NULLIF(TRIM((v_session.girl_data->>'location_country')::TEXT), '');

    -- Validate ethnicity against allowed values, set to NULL if invalid
    IF v_ethnicity IS NOT NULL AND v_ethnicity NOT IN (
      'Asian', 'Black', 'Latina', 'White', 'Middle Eastern',
      'Indian', 'Mixed', 'Native American', 'Pacific Islander', 'Other'
    ) THEN
      v_ethnicity := NULL;
    END IF;

    -- Validate hair_color against allowed values, set to NULL if invalid
    IF v_hair_color IS NOT NULL AND v_hair_color NOT IN (
      'Blonde', 'Brunette', 'Black', 'Red', 'Auburn',
      'Gray/Silver', 'Dyed/Colorful', 'Other'
    ) THEN
      v_hair_color := NULL;
    END IF;

    INSERT INTO girls (
      user_id,
      name,
      age,
      rating,
      ethnicity,
      hair_color,
      location_city,
      location_country,
      is_active
    )
    VALUES (
      p_user_id,
      (v_session.girl_data->>'name')::TEXT,
      (v_session.girl_data->>'age')::INTEGER,
      COALESCE((v_session.girl_data->>'rating')::NUMERIC, 6.0),
      v_ethnicity,        -- NULL if empty or invalid
      v_hair_color,       -- NULL if empty or invalid
      v_location_city,    -- NULL if empty
      v_location_country, -- NULL if empty
      true
    )
    RETURNING id INTO v_girl_id;

    -- Insert data entry into production table
    IF v_session.entry_data IS NOT NULL AND v_girl_id IS NOT NULL THEN
      INSERT INTO data_entries (
        girl_id,
        date,
        amount_spent,
        duration_minutes,
        number_of_nuts
      )
      VALUES (
        v_girl_id,
        (v_session.entry_data->>'date')::DATE,
        (v_session.entry_data->>'amount_spent')::NUMERIC,
        (v_session.entry_data->>'duration_minutes')::INTEGER,
        (v_session.entry_data->>'number_of_nuts')::INTEGER
      );
    END IF;
  END IF;

  -- Mark the temporary session as completed
  UPDATE temp_onboarding_sessions
  SET
    completed_at = NOW(),
    converted_to_user_id = p_user_id,
    updated_at = NOW()
  WHERE session_token = p_session_token;

  -- Update user record to mark step onboarding as completed
  UPDATE users
  SET
    step_onboarding_completed = true,
    step_onboarding_source = 'step_flow',
    onboarding_completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Return success with details
  v_result := jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'girl_id', v_girl_id,
    'session_id', v_session.id
  );

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helpful comment
COMMENT ON FUNCTION migrate_temp_onboarding_to_production IS
  'Migrates onboarding session data to production tables. Converts empty strings to NULL for optional fields (ethnicity, hair_color, location_city, location_country) and validates against CHECK constraints.';
