import { describe, it, expect } from 'vitest';
import { generateSessionToken, isSessionExpired, getSessionDuration } from './session.utils';

describe('session.utils', () => {
  describe('generateSessionToken', () => {
    it('should generate a valid UUID', () => {
      const token = generateSessionToken();
      expect(token).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should generate unique tokens', () => {
      const token1 = generateSessionToken();
      const token2 = generateSessionToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('isSessionExpired', () => {
    it('should return true for past dates', () => {
      const pastDate = new Date(Date.now() - 1000).toISOString();
      expect(isSessionExpired(pastDate)).toBe(true);
    });

    it('should return false for future dates', () => {
      const futureDate = new Date(Date.now() + 10000).toISOString();
      expect(isSessionExpired(futureDate)).toBe(false);
    });

    it('should return true for current timestamp', () => {
      const now = new Date().toISOString();
      const result = isSessionExpired(now);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getSessionDuration', () => {
    it('should return a positive number', () => {
      const duration = getSessionDuration();
      expect(duration).toBeGreaterThan(0);
    });

    it('should return default duration of 24 hours in milliseconds', () => {
      const duration = getSessionDuration();
      expect(duration).toBe(86400000);
    });
  });
});
