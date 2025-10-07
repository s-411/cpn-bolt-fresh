import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OnboardingDataService } from './onboardingData.service';

vi.mock('../../../lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      maybeSingle: vi.fn(),
    })),
    rpc: vi.fn(),
  },
}));

describe('OnboardingDataService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveGirl', () => {
    it('should save girl data successfully', async () => {
      const { supabase } = await import('../../../lib/supabase/client');
      const mockUser = { id: 'user-123' };
      const mockGirl = {
        id: 'girl-123',
        session_id: 'session-123',
        user_id: 'user-123',
        name: 'Jane',
        age: 25,
        rating: 7.5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser as any },
        error: null,
      });

      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockGirl, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await OnboardingDataService.saveGirl('session-123', {
        name: 'Jane',
        age: 25,
        rating: 7.5,
      });

      expect(result.girl).toEqual(mockGirl);
      expect(result.error).toBeNull();
    });

    it('should handle missing user error', async () => {
      const { supabase } = await import('../../../lib/supabase/client');

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await OnboardingDataService.saveGirl('session-123', {
        name: 'Jane',
        age: 25,
        rating: 7.5,
      });

      expect(result.girl).toBeNull();
      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain('No authenticated user');
    });

    it('should handle database errors', async () => {
      const { supabase } = await import('../../../lib/supabase/client');
      const mockUser = { id: 'user-123' };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser as any },
        error: null,
      });

      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await OnboardingDataService.saveGirl('session-123', {
        name: 'Jane',
        age: 25,
        rating: 7.5,
      });

      expect(result.girl).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });

  describe('updateGirl', () => {
    it('should update girl data successfully', async () => {
      const { supabase } = await import('../../../lib/supabase/client');
      const mockGirl = {
        id: 'girl-123',
        session_id: 'session-123',
        user_id: 'user-123',
        name: 'Jane Updated',
        age: 26,
        rating: 8.0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockGirl, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await OnboardingDataService.updateGirl('girl-123', {
        name: 'Jane Updated',
        age: 26,
      });

      expect(result.girl).toEqual(mockGirl);
      expect(result.error).toBeNull();
    });
  });

  describe('getGirl', () => {
    it('should retrieve girl data successfully', async () => {
      const { supabase } = await import('../../../lib/supabase/client');
      const mockGirl = {
        id: 'girl-123',
        session_id: 'session-123',
        user_id: 'user-123',
        name: 'Jane',
        age: 25,
        rating: 7.5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: mockGirl, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await OnboardingDataService.getGirl('session-123');

      expect(result).toEqual(mockGirl);
    });

    it('should return null when no girl found', async () => {
      const { supabase } = await import('../../../lib/supabase/client');

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await OnboardingDataService.getGirl('session-123');

      expect(result).toBeNull();
    });
  });

  describe('saveDataEntry', () => {
    it('should save data entry successfully', async () => {
      const { supabase } = await import('../../../lib/supabase/client');
      const mockEntry = {
        id: 'entry-123',
        session_id: 'session-123',
        girl_id: 'girl-123',
        date: '2025-10-07',
        amount_spent: 100,
        duration_minutes: 60,
        number_of_nuts: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockEntry, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await OnboardingDataService.saveDataEntry(
        'session-123',
        'girl-123',
        {
          date: '2025-10-07',
          amount_spent: 100,
          duration_minutes: 60,
          number_of_nuts: 2,
        }
      );

      expect(result.entry).toEqual(mockEntry);
      expect(result.error).toBeNull();
    });

    it('should handle validation errors', async () => {
      const { supabase } = await import('../../../lib/supabase/client');

      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Check constraint violated' },
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await OnboardingDataService.saveDataEntry(
        'session-123',
        'girl-123',
        {
          date: '2025-10-07',
          amount_spent: -100, // Invalid negative amount
          duration_minutes: 60,
          number_of_nuts: 2,
        }
      );

      expect(result.entry).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });

  describe('completeOnboarding', () => {
    it('should complete onboarding migration successfully', async () => {
      const { supabase } = await import('../../../lib/supabase/client');

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: { success: true, migrated_girls: 1, migrated_entries: 1 },
        error: null,
      });

      const result = await OnboardingDataService.completeOnboarding('session-123');

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(supabase.rpc).toHaveBeenCalledWith('complete_onboarding_migration', {
        p_session_id: 'session-123',
      });
    });

    it('should handle migration function errors', async () => {
      const { supabase } = await import('../../../lib/supabase/client');

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'Function error' },
      });

      const result = await OnboardingDataService.completeOnboarding('session-123');

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('should handle migration failure from function', async () => {
      const { supabase } = await import('../../../lib/supabase/client');

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: { success: false, error: 'Session not found or already completed' },
        error: null,
      });

      const result = await OnboardingDataService.completeOnboarding('session-123');

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain('Session not found');
    });
  });
});
