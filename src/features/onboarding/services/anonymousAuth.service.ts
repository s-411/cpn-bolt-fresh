import { supabase } from '../../../lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { OnboardingSession } from '../types/onboarding.types';

export class AnonymousAuthService {
  private static readonly AUTH_ERROR_MESSAGES: Record<string, string> = {
    'anonymous_provider_disabled': 'Anonymous sign-in is not enabled. Please enable it in Supabase Dashboard > Authentication > Providers.',
    'email_exists': 'This email is already registered. Please sign in instead.',
    'invalid_credentials': 'Invalid email or password.',
    'user_not_found': 'User not found.',
  };

  static getErrorMessage(error: Error): string {
    const message = error.message.toLowerCase();
    for (const [key, value] of Object.entries(this.AUTH_ERROR_MESSAGES)) {
      if (message.includes(key)) {
        return value;
      }
    }
    return error.message;
  }

  static async isAnonymousAuthEnabled(): Promise<boolean> {
    try {
      const testResult = await supabase.auth.signInAnonymously();
      if (testResult.data.user) {
        await supabase.auth.signOut();
        return true;
      }
      return false;
    } catch (error: any) {
      if (error.message?.includes('anonymous_provider_disabled')) {
        return false;
      }
      return false;
    }
  }
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
      const err = error as Error;
      console.error('Failed to create anonymous session:', err);
      return {
        user: null,
        session: null,
        error: new Error(this.getErrorMessage(err)),
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
        .gt('expires_at', new Date().toISOString())
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

  static isSessionExpired(session: OnboardingSession): boolean {
    return new Date(session.expires_at) < new Date();
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
    email: string,
    password: string
  ): Promise<{ error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.is_anonymous) {
        throw new Error('User is not anonymous');
      }

      const { error } = await supabase.auth.updateUser({
        email,
        password,
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      const err = error as Error;
      console.error('Failed to convert anonymous user:', err);
      return { error: new Error(this.getErrorMessage(err)) };
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
