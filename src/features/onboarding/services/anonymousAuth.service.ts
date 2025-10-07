import { supabase } from '../../../lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { OnboardingSession } from '../types/onboarding.types';

export class AnonymousAuthService {
  static async createAnonymousSession(): Promise<{
    user: User | null;
    session: OnboardingSession | null;
    error: Error | null;
  }> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously();

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user returned from anonymous sign in');

      const sessionToken = crypto.randomUUID();
      const { data: sessionData, error: sessionError } = await supabase
        .from('onboarding_sessions')
        .insert({
          user_id: authData.user.id,
          session_token: sessionToken,
          current_step: 1,
          is_anonymous: true,
          metadata: {
            created_via: 'anonymous_flow',
            user_agent: navigator.userAgent,
          },
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      return {
        user: authData.user,
        session: sessionData,
        error: null,
      };
    } catch (error) {
      console.error('Failed to create anonymous session:', error);
      return {
        user: null,
        session: null,
        error: error as Error,
      };
    }
  }

  static async getCurrentSession(userId: string): Promise<OnboardingSession | null> {
    try {
      const { data, error } = await supabase
        .from('onboarding_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_completed', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get current session:', error);
      return null;
    }
  }

  static async updateStep(sessionId: string, step: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('onboarding_sessions')
        .update({ current_step: step })
        .eq('id', sessionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to update step:', error);
      return false;
    }
  }

  static async convertAnonymousToPermanent(
    email: string
  ): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.updateUser({ email });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Failed to convert anonymous user:', error);
      return { error: error as Error };
    }
  }

  static async isAnonymousUser(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.is_anonymous ?? false;
    } catch {
      return false;
    }
  }
}
