/*
  # Create Onboarding Tables for Anonymous Sessions

  1. New Tables
    - `onboarding_sessions` - Tracks anonymous onboarding sessions
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `session_token` (text, unique) - Unique token for session identification
      - `current_step` (integer) - Current step in onboarding (1-4)
      - `is_completed` (boolean) - Whether onboarding is complete
      - `is_anonymous` (boolean) - Whether user is still anonymous
      - `converted_at` (timestamptz) - When anonymous user became permanent
      - `expires_at` (timestamptz) - Session expiration (24 hours)
      - `metadata` (jsonb) - Additional session metadata

    - `onboarding_girls` - Temporary girl profiles during onboarding
      - `id` (uuid, primary key)
      - `session_id` (uuid, references onboarding_sessions)
      - `user_id` (uuid, references auth.users)
      - Girl profile fields (same as production girls table)

    - `onboarding_data_entries` - Temporary data entries during onboarding
      - `id` (uuid, primary key)
      - `session_id` (uuid, references onboarding_sessions)
      - `girl_id` (uuid, references onboarding_girls)
      - Data entry fields (same as production data_entries table)

  2. Security
    - Enable RLS on all onboarding tables
    - Users (including anonymous) can only access their own data
    - Migration function to transfer data to production tables
    - Cleanup function for expired sessions

  3. Important Notes
    - Sessions expire after 24 hours
    - Anonymous users can create and manage onboarding data
    - Data is migrated to production tables after email verification
    - Expired sessions are cleaned up automatically
*/

-- Create onboarding_sessions table
CREATE TABLE IF NOT EXISTS onboarding_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  current_step INTEGER DEFAULT 1 CHECK (current_step BETWEEN 1 AND 4),
  is_completed BOOLEAN DEFAULT false,
  is_anonymous BOOLEAN DEFAULT true,
  converted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create onboarding_girls table
CREATE TABLE IF NOT EXISTS onboarding_girls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES onboarding_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 18 AND age <= 120),
  ethnicity TEXT,
  hair_color TEXT,
  location_city TEXT,
  location_country TEXT,
  rating NUMERIC(3,1) NOT NULL DEFAULT 6.0 CHECK (rating >= 5.0 AND rating <= 10.0),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create onboarding_data_entries table
CREATE TABLE IF NOT EXISTS onboarding_data_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES onboarding_sessions(id) ON DELETE CASCADE,
  girl_id UUID NOT NULL REFERENCES onboarding_girls(id) ON DELETE CASCADE,

  date DATE NOT NULL,
  amount_spent NUMERIC(10,2) NOT NULL CHECK (amount_spent >= 0),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  number_of_nuts INTEGER NOT NULL CHECK (number_of_nuts >= 0),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_user_id ON onboarding_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_expires_at ON onboarding_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_is_completed ON onboarding_sessions(is_completed);
CREATE INDEX IF NOT EXISTS idx_onboarding_girls_session_id ON onboarding_girls(session_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_girls_user_id ON onboarding_girls(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_data_entries_session_id ON onboarding_data_entries(session_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_data_entries_girl_id ON onboarding_data_entries(girl_id);

-- Add comments for documentation
COMMENT ON TABLE onboarding_sessions IS 'Tracks anonymous onboarding sessions - cleaned up after 24h or completion';
COMMENT ON TABLE onboarding_girls IS 'Temporary girl data during onboarding - migrated to production girls table on completion';
COMMENT ON TABLE onboarding_data_entries IS 'Temporary data entries during onboarding - migrated to production data_entries table on completion';

-- Enable RLS on all onboarding tables
ALTER TABLE onboarding_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_girls ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_data_entries ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ONBOARDING_SESSIONS POLICIES
-- ============================================

CREATE POLICY "Users can view own onboarding sessions"
  ON onboarding_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own onboarding sessions"
  ON onboarding_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own onboarding sessions"
  ON onboarding_sessions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- ONBOARDING_GIRLS POLICIES
-- ============================================

CREATE POLICY "Users can view own onboarding girls"
  ON onboarding_girls FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own onboarding girls"
  ON onboarding_girls FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    session_id IN (
      SELECT id FROM onboarding_sessions
      WHERE user_id = auth.uid() AND is_completed = false
    )
  );

CREATE POLICY "Users can update own onboarding girls"
  ON onboarding_girls FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- ONBOARDING_DATA_ENTRIES POLICIES
-- ============================================

CREATE POLICY "Users can view own onboarding data entries"
  ON onboarding_data_entries FOR SELECT
  TO authenticated
  USING (
    session_id IN (
      SELECT id FROM onboarding_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own onboarding data entries"
  ON onboarding_data_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    session_id IN (
      SELECT id FROM onboarding_sessions
      WHERE user_id = auth.uid() AND is_completed = false
    )
  );

CREATE POLICY "Users can update own onboarding data entries"
  ON onboarding_data_entries FOR UPDATE
  TO authenticated
  USING (
    session_id IN (
      SELECT id FROM onboarding_sessions WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    session_id IN (
      SELECT id FROM onboarding_sessions WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_onboarding_sessions_updated_at
  BEFORE UPDATE ON onboarding_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_updated_at();

CREATE TRIGGER update_onboarding_girls_updated_at
  BEFORE UPDATE ON onboarding_girls
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_updated_at();

CREATE TRIGGER update_onboarding_data_entries_updated_at
  BEFORE UPDATE ON onboarding_data_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_updated_at();

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_onboarding_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM onboarding_sessions
  WHERE expires_at < NOW() AND is_completed = false;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to migrate onboarding data to production tables
CREATE OR REPLACE FUNCTION complete_onboarding_migration(p_session_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_girl_id UUID;
  v_new_girl_id UUID;
  v_migrated_girls INTEGER := 0;
  v_migrated_entries INTEGER := 0;
  v_result JSONB;
BEGIN
  SELECT user_id INTO v_user_id
  FROM onboarding_sessions
  WHERE id = p_session_id AND is_completed = false;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Session not found or already completed'
    );
  END IF;

  FOR v_girl_id IN
    SELECT id FROM onboarding_girls WHERE session_id = p_session_id
  LOOP
    INSERT INTO girls (user_id, name, age, ethnicity, hair_color, location_city, location_country, rating, is_active)
    SELECT user_id, name, age, ethnicity, hair_color, location_city, location_country, rating, true
    FROM onboarding_girls
    WHERE id = v_girl_id
    RETURNING id INTO v_new_girl_id;

    INSERT INTO data_entries (girl_id, date, amount_spent, duration_minutes, number_of_nuts)
    SELECT v_new_girl_id, date, amount_spent, duration_minutes, number_of_nuts
    FROM onboarding_data_entries
    WHERE girl_id = v_girl_id;

    GET DIAGNOSTICS v_migrated_entries = ROW_COUNT;
    v_migrated_girls := v_migrated_girls + 1;
  END LOOP;

  UPDATE onboarding_sessions
  SET is_completed = true, converted_at = NOW()
  WHERE id = p_session_id;

  UPDATE users
  SET onboarding_completed_at = NOW()
  WHERE id = v_user_id;

  v_result := jsonb_build_object(
    'success', true,
    'migrated_girls', v_migrated_girls,
    'migrated_entries', v_migrated_entries,
    'user_id', v_user_id
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION cleanup_expired_onboarding_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION complete_onboarding_migration(UUID) TO authenticated;
