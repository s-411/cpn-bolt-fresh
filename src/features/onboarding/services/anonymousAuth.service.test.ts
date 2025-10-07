import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnonymousAuthService } from './anonymousAuth.service';

vi.mock('../../../lib/supabase/client', () => ({
  supabase: {
    auth: {
      signInAnonymously: vi.fn(),
      getUser: vi.fn(),
      updateUser: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
      single: vi.fn(),
    })),
  },
}));

describe('AnonymousAuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createAnonymousSession', () => {
    it('should handle anonymous sign in errors', async () => {
      const { supabase } = await import('../../../lib/supabase/client');
      vi.mocked(supabase.auth.signInAnonymously).mockResolvedValue({
        data: { user: null, session: null },
        error: new Error('Auth error'),
      } as any);

      const result = await AnonymousAuthService.createAnonymousSession();

      expect(result.user).toBeNull();
      expect(result.session).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });

  describe('isAnonymousUser', () => {
    it('should return false when no user', async () => {
      const { supabase } = await import('../../../lib/supabase/client');
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const result = await AnonymousAuthService.isAnonymousUser();

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      const { supabase } = await import('../../../lib/supabase/client');
      vi.mocked(supabase.auth.getUser).mockRejectedValue(new Error('Error'));

      const result = await AnonymousAuthService.isAnonymousUser();

      expect(result).toBe(false);
    });

    it('should return true when user is anonymous', async () => {
      const { supabase } = await import('../../../lib/supabase/client');
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { is_anonymous: true } as any },
        error: null,
      } as any);

      const result = await AnonymousAuthService.isAnonymousUser();

      expect(result).toBe(true);
    });
  });

  describe('isSessionExpired', () => {
    it('should return true for expired session', () => {
      const expiredSession = {
        expires_at: new Date(Date.now() - 1000).toISOString(),
      } as any;

      const result = AnonymousAuthService.isSessionExpired(expiredSession);

      expect(result).toBe(true);
    });

    it('should return false for valid session', () => {
      const validSession = {
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      } as any;

      const result = AnonymousAuthService.isSessionExpired(validSession);

      expect(result).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('should return custom message for known errors', () => {
      const error = new Error('anonymous_provider_disabled');
      const message = AnonymousAuthService.getErrorMessage(error);

      expect(message).toContain('Anonymous sign-in is not enabled');
    });

    it('should return original message for unknown errors', () => {
      const error = new Error('Unknown error');
      const message = AnonymousAuthService.getErrorMessage(error);

      expect(message).toBe('Unknown error');
    });
  });
});
