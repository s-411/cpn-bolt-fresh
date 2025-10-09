import { supabase } from '../../lib/supabase/client';

export interface TempOnboardingSession {
  id: string;
  session_token: string;
  current_step: number;
  expires_at: string;
  girl_data: GirlFormData | null;
  entry_data: EntryFormData | null;
  user_email: string | null;
  converted_to_user_id: string | null;
  completed_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface GirlFormData {
  name: string;
  age: number;
  rating: number;
  ethnicity?: string;
  hair_color?: string;
  location_city?: string;
  location_country?: string;
}

export interface EntryFormData {
  date: string;
  amount_spent: number;
  duration_minutes: number;
  number_of_nuts: number;
}

const SESSION_TOKEN_KEY = 'cpn_onboarding_session_token';
const SESSION_EXPIRY_HOURS = 2;

export class SessionService {
  static generateSessionToken(): string {
    return `cpn_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  static getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(SESSION_TOKEN_KEY);
  }

  static setStoredToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SESSION_TOKEN_KEY, token);
  }

  static clearStoredToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(SESSION_TOKEN_KEY);
  }

  static async createSession(): Promise<{ session: TempOnboardingSession | null; error: Error | null }> {
    try {
      const token = this.generateSessionToken();

      const { data, error } = await supabase
        .from('temp_onboarding_sessions')
        .insert({
          session_token: token,
          current_step: 1,
          metadata: {
            created_via: 'step_flow',
            user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
            created_timestamp: new Date().toISOString(),
          },
        })
        .select()
        .single();

      if (error) throw error;

      this.setStoredToken(token);

      return { session: data as TempOnboardingSession, error: null };
    } catch (error) {
      console.error('Failed to create session:', error);
      return { session: null, error: error as Error };
    }
  }

  static async getSession(token?: string): Promise<{ session: TempOnboardingSession | null; error: Error | null }> {
    try {
      const sessionToken = token || this.getStoredToken();

      if (!sessionToken) {
        return { session: null, error: new Error('No session token found') };
      }

      const { data, error } = await supabase
        .from('temp_onboarding_sessions')
        .select('*')
        .eq('session_token', sessionToken)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        return { session: null, error: new Error('Session not found') };
      }

      if (new Date(data.expires_at) < new Date()) {
        return { session: null, error: new Error('Session expired') };
      }

      if (data.completed_at) {
        return { session: null, error: new Error('Session already completed') };
      }

      return { session: data as TempOnboardingSession, error: null };
    } catch (error) {
      console.error('Failed to get session:', error);
      return { session: null, error: error as Error };
    }
  }

  static async updateStep(token: string, step: number): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { error } = await supabase
        .from('temp_onboarding_sessions')
        .update({ current_step: step })
        .eq('session_token', token);

      if (error) throw error;

      return { success: true, error: null };
    } catch (error) {
      console.error('Failed to update step:', error);
      return { success: false, error: error as Error };
    }
  }

  static async saveGirlData(token: string, girlData: GirlFormData): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { error } = await supabase
        .from('temp_onboarding_sessions')
        .update({
          girl_data: girlData,
          current_step: 2,
        })
        .eq('session_token', token);

      if (error) throw error;

      return { success: true, error: null };
    } catch (error) {
      console.error('Failed to save girl data:', error);
      return { success: false, error: error as Error };
    }
  }

  static async saveEntryData(token: string, entryData: EntryFormData): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { error } = await supabase
        .from('temp_onboarding_sessions')
        .update({
          entry_data: entryData,
          current_step: 3,
        })
        .eq('session_token', token);

      if (error) throw error;

      return { success: true, error: null };
    } catch (error) {
      console.error('Failed to save entry data:', error);
      return { success: false, error: error as Error };
    }
  }

  static async saveUserEmail(token: string, email: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { error } = await supabase
        .from('temp_onboarding_sessions')
        .update({
          user_email: email,
        })
        .eq('session_token', token);

      if (error) throw error;

      return { success: true, error: null };
    } catch (error) {
      console.error('Failed to save user email:', error);
      return { success: false, error: error as Error };
    }
  }

  static isSessionExpired(session: TempOnboardingSession): boolean {
    return new Date(session.expires_at) < new Date();
  }

  static getSessionRemainingTime(session: TempOnboardingSession): number {
    const expiresAt = new Date(session.expires_at);
    const now = new Date();
    return Math.max(0, expiresAt.getTime() - now.getTime());
  }

  static formatRemainingTime(milliseconds: number): string {
    const minutes = Math.floor(milliseconds / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${remainingMinutes}m`;
  }
}
