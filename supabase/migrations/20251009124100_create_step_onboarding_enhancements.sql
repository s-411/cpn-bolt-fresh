/*
  # Step-Based Onboarding Flow - Schema Enhancements
  
  ## Overview
  Enhances the existing temp_onboarding_sessions table and creates supporting infrastructure
  for the multi-step onboarding flow (/step-1 through /step-4) with Stripe payment integration.
  
  ## Changes Made
  
  1. **Indexes for Performance**
     - Add index on session_token for fast lookup during step navigation
     - Add index on expires_at for efficient cleanup operations
     - Add index on converted_to_user_id for tracking conversion rates
  
  2. **Data Migration Function**
     - Create function to migrate temp session data to production tables
     - Automatically creates girl profile and data entry for new user
     - Links all data to the authenticated user account
     - Marks session as completed and sets conversion timestamp
  
  3. **Cleanup Function**
     - Create function to remove expired temporary sessions
     - Runs automatically to prevent data buildup
     - Protects completed sessions from deletion
  
  4. **Triggers**
     - Auto-update updated_at timestamp on temp_onboarding_sessions
     - Track when data is modified for auditing
  
  5. **Security**
     - RLS is disabled on temp_onboarding_sessions to allow unauthenticated access
     - Access controlled via session_token which acts as a bearer token
     - Sessions expire after 2 hours to limit exposure
     - Completed sessions are preserved for 7 days for analytics
  
  ## Important Notes
  - Sessions are accessible WITHOUT authentication using session_token
  - Session tokens must be kept secure and treated as temporary credentials
  - Data automatically migrates to production tables upon user signup
  - Expired sessions are cleaned up to prevent database bloat
*/

-- Add performance indexes for temp_onboarding_sessions
CREATE INDEX IF NOT EXISTS idx_temp_onboarding_sessions_token 
  ON temp_onboarding_sessions(session_token);

CREATE INDEX IF NOT EXISTS idx_temp_onboarding_sessions_expires 
  ON temp_onboarding_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_temp_onboarding_sessions_converted 
  ON temp_onboarding_sessions(converted_to_user_id) 
  WHERE converted_to_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_temp_onboarding_sessions_completed 
  ON temp_onboarding_sessions(completed_at) 
  WHERE completed_at IS NOT NULL;

-- Add trigger for auto-updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_temp_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_temp_onboarding_sessions_updated_at ON temp_onboarding_sessions;
CREATE TRIGGER update_temp_onboarding_sessions_updated_at
  BEFORE UPDATE ON temp_onboarding_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_temp_onboarding_updated_at();

-- Function to migrate temporary session data to production tables
CREATE OR REPLACE FUNCTION migrate_temp_onboarding_to_production(
  p_session_token TEXT,
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_session RECORD;
  v_girl_id UUID;
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
      (v_session.girl_data->>'ethnicity')::TEXT,
      (v_session.girl_data->>'hair_color')::TEXT,
      (v_session.girl_data->>'location_city')::TEXT,
      (v_session.girl_data->>'location_country')::TEXT,
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

-- Function to cleanup expired temporary sessions
CREATE OR REPLACE FUNCTION cleanup_expired_temp_onboarding_sessions()
RETURNS JSONB AS $$
DECLARE
  v_deleted_count INTEGER;
  v_preserved_count INTEGER;
BEGIN
  -- Delete expired sessions that are not completed
  -- Keep completed sessions for 7 days for analytics
  DELETE FROM temp_onboarding_sessions
  WHERE expires_at < NOW()
    AND (
      completed_at IS NULL 
      OR completed_at < NOW() - INTERVAL '7 days'
    );
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  -- Count preserved completed sessions
  SELECT COUNT(*) INTO v_preserved_count
  FROM temp_onboarding_sessions
  WHERE completed_at IS NOT NULL
    AND completed_at >= NOW() - INTERVAL '7 days';
  
  RETURN jsonb_build_object(
    'success', true,
    'deleted_count', v_deleted_count,
    'preserved_completed_count', v_preserved_count,
    'cleanup_timestamp', NOW()
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION migrate_temp_onboarding_to_production(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION migrate_temp_onboarding_to_production(TEXT, UUID) TO anon;
GRANT EXECUTE ON FUNCTION cleanup_expired_temp_onboarding_sessions() TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION migrate_temp_onboarding_to_production(TEXT, UUID) IS 
  'Migrates temporary onboarding session data to production tables after user signup. Called automatically during step 3 (sign up).';

COMMENT ON FUNCTION cleanup_expired_temp_onboarding_sessions() IS 
  'Removes expired temporary sessions. Should be called periodically via cron job or manually.';

COMMENT ON COLUMN temp_onboarding_sessions.session_token IS 
  'Unique token used to access session data without authentication. Acts as bearer token.';

COMMENT ON COLUMN temp_onboarding_sessions.girl_data IS 
  'JSON object containing girl profile data: {name, age, rating, ethnicity, hair_color, location_city, location_country}';

COMMENT ON COLUMN temp_onboarding_sessions.entry_data IS 
  'JSON object containing data entry: {date, amount_spent, duration_minutes, number_of_nuts}';
