import { supabase } from '../../../lib/supabase/client';
import type { OnboardingGirl, OnboardingDataEntry, OnboardingFormData } from '../types/onboarding.types';

export class OnboardingDataService {
  static async saveGirl(
    sessionId: string,
    girlData: OnboardingFormData['girl']
  ): Promise<{ girl: OnboardingGirl | null; error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('onboarding_girls')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          ...girlData,
        })
        .select()
        .single();

      if (error) throw error;

      return { girl: data, error: null };
    } catch (error) {
      console.error('Failed to save girl:', error);
      return { girl: null, error: error as Error };
    }
  }

  static async updateGirl(
    girlId: string,
    girlData: Partial<OnboardingFormData['girl']>
  ): Promise<{ girl: OnboardingGirl | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('onboarding_girls')
        .update(girlData)
        .eq('id', girlId)
        .select()
        .single();

      if (error) throw error;

      return { girl: data, error: null };
    } catch (error) {
      console.error('Failed to update girl:', error);
      return { girl: null, error: error as Error };
    }
  }

  static async getGirl(sessionId: string): Promise<OnboardingGirl | null> {
    try {
      const { data, error } = await supabase
        .from('onboarding_girls')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get girl:', error);
      return null;
    }
  }

  static async saveDataEntry(
    sessionId: string,
    girlId: string,
    entryData: OnboardingFormData['dataEntry']
  ): Promise<{ entry: OnboardingDataEntry | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('onboarding_data_entries')
        .insert({
          session_id: sessionId,
          girl_id: girlId,
          ...entryData,
        })
        .select()
        .single();

      if (error) throw error;

      return { entry: data, error: null };
    } catch (error) {
      console.error('Failed to save data entry:', error);
      return { entry: null, error: error as Error };
    }
  }

  static async getDataEntry(sessionId: string): Promise<OnboardingDataEntry | null> {
    try {
      const { data, error } = await supabase
        .from('onboarding_data_entries')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get data entry:', error);
      return null;
    }
  }

  static async completeOnboarding(
    sessionId: string
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { data, error } = await supabase.rpc('complete_onboarding_migration', {
        p_session_id: sessionId,
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Migration failed');
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      return { success: false, error: error as Error };
    }
  }
}
