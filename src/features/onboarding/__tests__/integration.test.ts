import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { supabase } from '../../../lib/supabase/client';
import { AnonymousAuthService } from '../services/anonymousAuth.service';
import { OnboardingDataService } from '../services/onboardingData.service';

describe('Onboarding Integration Tests', () => {
  let testUserId: string | null = null;
  let testSessionId: string | null = null;
  let testGirlId: string | null = null;

  afterAll(async () => {
    if (testUserId) {
      await supabase.auth.signOut();
    }
  });

  describe('Anonymous Session Creation', () => {
    it('should create anonymous user and onboarding session', async () => {
      const { user, session, error } = await AnonymousAuthService.createAnonymousSession();

      expect(error).toBeNull();
      expect(user).toBeTruthy();
      expect(session).toBeTruthy();
      expect(user?.is_anonymous).toBe(true);
      expect(session?.is_anonymous).toBe(true);
      expect(session?.current_step).toBe(1);

      testUserId = user?.id || null;
      testSessionId = session?.id || null;
    }, 10000);

    it('should retrieve existing session for user', async () => {
      if (!testUserId) {
        throw new Error('Test user not created');
      }

      const session = await AnonymousAuthService.getCurrentSession(testUserId);

      expect(session).toBeTruthy();
      expect(session?.id).toBe(testSessionId);
      expect(session?.is_completed).toBe(false);
    });

    it('should validate session is not expired', async () => {
      if (!testUserId) {
        throw new Error('Test user not created');
      }

      const session = await AnonymousAuthService.getCurrentSession(testUserId);
      expect(session).toBeTruthy();

      if (session) {
        const isExpired = AnonymousAuthService.isSessionExpired(session);
        expect(isExpired).toBe(false);
      }
    });
  });

  describe('Girl Data Management', () => {
    it('should save girl data to onboarding table', async () => {
      if (!testSessionId) {
        throw new Error('Test session not created');
      }

      const girlData = {
        name: 'Test Girl',
        age: 25,
        ethnicity: 'Caucasian',
        hair_color: 'Blonde',
        location_city: 'Los Angeles',
        location_country: 'USA',
        rating: 8.5,
      };

      const { girl, error } = await OnboardingDataService.saveGirl(
        testSessionId,
        girlData
      );

      expect(error).toBeNull();
      expect(girl).toBeTruthy();
      expect(girl?.name).toBe(girlData.name);
      expect(girl?.age).toBe(girlData.age);
      expect(girl?.rating).toBe(girlData.rating);
      expect(girl?.session_id).toBe(testSessionId);

      testGirlId = girl?.id || null;
    });

    it('should retrieve saved girl data', async () => {
      if (!testSessionId) {
        throw new Error('Test session not created');
      }

      const girl = await OnboardingDataService.getGirl(testSessionId);

      expect(girl).toBeTruthy();
      expect(girl?.id).toBe(testGirlId);
      expect(girl?.name).toBe('Test Girl');
    });

    it('should update girl data', async () => {
      if (!testGirlId) {
        throw new Error('Test girl not created');
      }

      const updates = {
        name: 'Updated Test Girl',
        age: 26,
      };

      const { girl, error } = await OnboardingDataService.updateGirl(
        testGirlId,
        updates
      );

      expect(error).toBeNull();
      expect(girl).toBeTruthy();
      expect(girl?.name).toBe(updates.name);
      expect(girl?.age).toBe(updates.age);
    });

    it('should enforce age validation (minimum 18)', async () => {
      if (!testSessionId) {
        throw new Error('Test session not created');
      }

      const invalidGirlData = {
        name: 'Invalid Age Girl',
        age: 17,
        rating: 7.0,
      };

      const { girl, error } = await OnboardingDataService.saveGirl(
        testSessionId,
        invalidGirlData
      );

      expect(girl).toBeNull();
      expect(error).toBeTruthy();
    });

    it('should enforce rating validation (5.0-10.0)', async () => {
      if (!testSessionId) {
        throw new Error('Test session not created');
      }

      const invalidRatingData = {
        name: 'Invalid Rating Girl',
        age: 25,
        rating: 11.0,
      };

      const { girl, error } = await OnboardingDataService.saveGirl(
        testSessionId,
        invalidRatingData
      );

      expect(girl).toBeNull();
      expect(error).toBeTruthy();
    });
  });

  describe('Data Entry Management', () => {
    it('should save data entry to onboarding table', async () => {
      if (!testSessionId || !testGirlId) {
        throw new Error('Test session or girl not created');
      }

      const entryData = {
        date: '2025-10-07',
        amount_spent: 150.50,
        duration_minutes: 90,
        number_of_nuts: 3,
      };

      const { entry, error } = await OnboardingDataService.saveDataEntry(
        testSessionId,
        testGirlId,
        entryData
      );

      expect(error).toBeNull();
      expect(entry).toBeTruthy();
      expect(entry?.date).toBe(entryData.date);
      expect(entry?.amount_spent).toBe(entryData.amount_spent);
      expect(entry?.duration_minutes).toBe(entryData.duration_minutes);
      expect(entry?.number_of_nuts).toBe(entryData.number_of_nuts);
    });

    it('should retrieve saved data entry', async () => {
      if (!testSessionId) {
        throw new Error('Test session not created');
      }

      const entry = await OnboardingDataService.getDataEntry(testSessionId);

      expect(entry).toBeTruthy();
      expect(entry?.girl_id).toBe(testGirlId);
      expect(entry?.amount_spent).toBe(150.50);
    });

    it('should enforce positive amount constraint', async () => {
      if (!testSessionId || !testGirlId) {
        throw new Error('Test session or girl not created');
      }

      const invalidEntryData = {
        date: '2025-10-07',
        amount_spent: -50.00,
        duration_minutes: 60,
        number_of_nuts: 1,
      };

      const { entry, error } = await OnboardingDataService.saveDataEntry(
        testSessionId,
        testGirlId,
        invalidEntryData
      );

      expect(entry).toBeNull();
      expect(error).toBeTruthy();
    });

    it('should enforce positive duration constraint', async () => {
      if (!testSessionId || !testGirlId) {
        throw new Error('Test session or girl not created');
      }

      const invalidEntryData = {
        date: '2025-10-07',
        amount_spent: 100.00,
        duration_minutes: 0,
        number_of_nuts: 1,
      };

      const { entry, error } = await OnboardingDataService.saveDataEntry(
        testSessionId,
        testGirlId,
        invalidEntryData
      );

      expect(entry).toBeNull();
      expect(error).toBeTruthy();
    });

    it('should allow zero nuts (valid use case)', async () => {
      if (!testSessionId || !testGirlId) {
        throw new Error('Test session or girl not created');
      }

      const validEntryData = {
        date: '2025-10-08',
        amount_spent: 100.00,
        duration_minutes: 60,
        number_of_nuts: 0,
      };

      const { entry, error } = await OnboardingDataService.saveDataEntry(
        testSessionId,
        testGirlId,
        validEntryData
      );

      expect(error).toBeNull();
      expect(entry).toBeTruthy();
      expect(entry?.number_of_nuts).toBe(0);
    });
  });

  describe('Session Management', () => {
    it('should update session step', async () => {
      if (!testSessionId) {
        throw new Error('Test session not created');
      }

      const success = await AnonymousAuthService.updateStep(testSessionId, 3);

      expect(success).toBe(true);

      if (testUserId) {
        const session = await AnonymousAuthService.getCurrentSession(testUserId);
        expect(session?.current_step).toBe(3);
      }
    });

    it('should check if user is anonymous', async () => {
      const isAnonymous = await AnonymousAuthService.isAnonymousUser();
      expect(isAnonymous).toBe(true);
    });
  });

  describe('Data Migration (Completion)', () => {
    it('should complete onboarding and migrate data', async () => {
      if (!testSessionId) {
        throw new Error('Test session not created');
      }

      const { success, error } = await OnboardingDataService.completeOnboarding(
        testSessionId
      );

      expect(success).toBe(true);
      expect(error).toBeNull();
    }, 10000);

    it('should mark session as completed', async () => {
      if (!testUserId) {
        throw new Error('Test user not created');
      }

      const session = await AnonymousAuthService.getCurrentSession(testUserId);

      expect(session).toBeNull();
    });

    it('should have migrated data to production tables', async () => {
      if (!testUserId) {
        throw new Error('Test user not created');
      }

      const { data: girls, error: girlsError } = await supabase
        .from('girls')
        .select('*')
        .eq('user_id', testUserId);

      expect(girlsError).toBeNull();
      expect(girls).toBeTruthy();
      expect(girls?.length).toBeGreaterThan(0);
      expect(girls?.[0]?.name).toContain('Test Girl');

      const { data: entries, error: entriesError } = await supabase
        .from('data_entries')
        .select('*')
        .eq('girl_id', girls?.[0]?.id);

      expect(entriesError).toBeNull();
      expect(entries).toBeTruthy();
      expect(entries?.length).toBeGreaterThan(0);
    });

    it('should not allow completing already completed session', async () => {
      if (!testSessionId) {
        throw new Error('Test session not created');
      }

      const { success, error } = await OnboardingDataService.completeOnboarding(
        testSessionId
      );

      expect(success).toBe(false);
      expect(error).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing session gracefully', async () => {
      const girl = await OnboardingDataService.getGirl('non-existent-session');
      expect(girl).toBeNull();
    });

    it('should handle invalid session ID', async () => {
      const { success, error } = await OnboardingDataService.completeOnboarding(
        'invalid-session-id'
      );

      expect(success).toBe(false);
      expect(error).toBeTruthy();
    });

    it('should provide meaningful error messages', () => {
      const testError = new Error('anonymous_provider_disabled');
      const message = AnonymousAuthService.getErrorMessage(testError);

      expect(message).toContain('Anonymous sign-in is not enabled');
    });
  });
});
