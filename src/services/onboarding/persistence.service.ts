import { SessionService, GirlFormData, EntryFormData, TempOnboardingSession } from './session.service';
import { StorageService } from './storage.service';

export interface PersistenceResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
}

export class PersistenceService {
  static async initializeSession(): Promise<PersistenceResult<TempOnboardingSession>> {
    try {
      const existingToken = SessionService.getStoredToken();

      if (existingToken) {
        const { session, error } = await SessionService.getSession(existingToken);

        if (session && !error) {
          return { success: true, data: session };
        }

        SessionService.clearStoredToken();
        StorageService.clearAll();
      }

      const { session, error } = await SessionService.createSession();

      if (error || !session) {
        throw error || new Error('Failed to create session');
      }

      return { success: true, data: session };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  static async getCurrentSession(): Promise<PersistenceResult<TempOnboardingSession>> {
    try {
      const token = SessionService.getStoredToken();

      if (!token) {
        throw new Error('No active session found');
      }

      const { session, error } = await SessionService.getSession(token);

      if (error || !session) {
        throw error || new Error('Session not found');
      }

      return { success: true, data: session };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  static async saveGirl(girlData: GirlFormData): Promise<PersistenceResult<void>> {
    try {
      const token = SessionService.getStoredToken();

      if (!token) {
        throw new Error('No active session');
      }

      StorageService.saveGirlData(girlData);

      const { success, error } = await SessionService.saveGirlData(token, girlData);

      if (!success || error) {
        throw error || new Error('Failed to save girl data');
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  static async saveEntry(entryData: EntryFormData): Promise<PersistenceResult<void>> {
    try {
      const token = SessionService.getStoredToken();

      if (!token) {
        throw new Error('No active session');
      }

      StorageService.saveEntryData(entryData);

      const { success, error } = await SessionService.saveEntryData(token, entryData);

      if (!success || error) {
        throw error || new Error('Failed to save entry data');
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  static async updateCurrentStep(step: number): Promise<PersistenceResult<void>> {
    try {
      const token = SessionService.getStoredToken();

      if (!token) {
        throw new Error('No active session');
      }

      StorageService.saveCurrentStep(step);

      const { success, error } = await SessionService.updateStep(token, step);

      if (!success || error) {
        throw error || new Error('Failed to update step');
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  static getLocalGirlData(): GirlFormData | null {
    return StorageService.getGirlData();
  }

  static getLocalEntryData(): EntryFormData | null {
    return StorageService.getEntryData();
  }

  static getLocalStep(): number | null {
    return StorageService.getCurrentStep();
  }

  static async restoreFromLocal(): Promise<PersistenceResult<void>> {
    try {
      const token = SessionService.getStoredToken();

      if (!token) {
        throw new Error('No active session');
      }

      const girlData = StorageService.getGirlData();
      if (girlData) {
        await SessionService.saveGirlData(token, girlData);
      }

      const entryData = StorageService.getEntryData();
      if (entryData) {
        await SessionService.saveEntryData(token, entryData);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  static clearAllData(): void {
    SessionService.clearStoredToken();
    StorageService.clearAll();
  }

  static hasLocalData(): boolean {
    return StorageService.hasStoredData();
  }

  static async syncWithServer(): Promise<PersistenceResult<TempOnboardingSession>> {
    try {
      const token = SessionService.getStoredToken();

      if (!token) {
        throw new Error('No active session');
      }

      const { session, error } = await SessionService.getSession(token);

      if (error || !session) {
        throw error || new Error('Failed to sync with server');
      }

      if (session.girl_data) {
        StorageService.saveGirlData(session.girl_data as GirlFormData);
      }

      if (session.entry_data) {
        StorageService.saveEntryData(session.entry_data as EntryFormData);
      }

      if (session.current_step) {
        StorageService.saveCurrentStep(session.current_step);
      }

      return { success: true, data: session };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}
