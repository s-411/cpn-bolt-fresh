import { supabase } from '../../lib/supabase/client';
import { SessionService } from './session.service';
import { StorageService } from './storage.service';

export interface MigrationResult {
  success: boolean;
  userId?: string;
  girlId?: string;
  error?: Error;
}

export class MigrationService {
  static async migrateSessionDataToUser(userId: string): Promise<MigrationResult> {
    try {
      const token = SessionService.getStoredToken();

      if (!token) {
        throw new Error('No session token found');
      }

      const { data, error } = await supabase.rpc('migrate_temp_onboarding_to_production', {
        p_session_token: token,
        p_user_id: userId,
      });

      if (error) {
        console.error('Migration RPC error:', error);
        throw error;
      }

      const result = data as any;

      if (!result || !result.success) {
        throw new Error(result?.error || 'Migration failed');
      }

      SessionService.clearStoredToken();
      StorageService.clearAll();

      return {
        success: true,
        userId: result.user_id,
        girlId: result.girl_id,
      };
    } catch (error) {
      console.error('Migration service error:', error);
      return {
        success: false,
        error: error as Error,
      };
    }
  }

  static async checkMigrationStatus(userId: string): Promise<{ completed: boolean; error?: Error }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('step_onboarding_completed, step_onboarding_source')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      return {
        completed: data?.step_onboarding_completed === true,
      };
    } catch (error) {
      return {
        completed: false,
        error: error as Error,
      };
    }
  }

  static async verifyMigratedData(userId: string): Promise<{
    hasGirl: boolean;
    hasEntry: boolean;
    error?: Error;
  }> {
    try {
      const { data: girls, error: girlsError } = await supabase
        .from('girls')
        .select('id')
        .eq('user_id', userId);

      if (girlsError) throw girlsError;

      const hasGirl = (girls?.length || 0) > 0;
      let hasEntry = false;

      if (hasGirl && girls && girls.length > 0) {
        const { data: entries, error: entriesError } = await supabase
          .from('data_entries')
          .select('id')
          .eq('girl_id', girls[0].id);

        if (entriesError) throw entriesError;

        hasEntry = (entries?.length || 0) > 0;
      }

      return {
        hasGirl,
        hasEntry,
      };
    } catch (error) {
      return {
        hasGirl: false,
        hasEntry: false,
        error: error as Error,
      };
    }
  }

  static hasActiveSession(): boolean {
    const token = SessionService.getStoredToken();
    return !!token;
  }

  static clearLocalSession(): void {
    SessionService.clearStoredToken();
    StorageService.clearAll();
  }

  static async cleanupExpiredSessions(): Promise<{ success: boolean; deletedCount?: number; error?: Error }> {
    try {
      const { data, error } = await supabase.rpc('cleanup_expired_temp_onboarding_sessions');

      if (error) throw error;

      const result = data as any;

      return {
        success: result?.success || false,
        deletedCount: result?.deleted_count || 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
      };
    }
  }

  static async getSessionMetrics(): Promise<{
    totalSessions: number;
    completedSessions: number;
    activeSessions: number;
    error?: Error;
  }> {
    try {
      const { count: total, error: totalError } = await supabase
        .from('temp_onboarding_sessions')
        .select('*', { count: 'exact', head: true });

      const { count: completed, error: completedError } = await supabase
        .from('temp_onboarding_sessions')
        .select('*', { count: 'exact', head: true })
        .not('completed_at', 'is', null);

      const { count: active, error: activeError } = await supabase
        .from('temp_onboarding_sessions')
        .select('*', { count: 'exact', head: true })
        .is('completed_at', null)
        .gt('expires_at', new Date().toISOString());

      if (totalError || completedError || activeError) {
        throw totalError || completedError || activeError;
      }

      return {
        totalSessions: total || 0,
        completedSessions: completed || 0,
        activeSessions: active || 0,
      };
    } catch (error) {
      return {
        totalSessions: 0,
        completedSessions: 0,
        activeSessions: 0,
        error: error as Error,
      };
    }
  }
}
