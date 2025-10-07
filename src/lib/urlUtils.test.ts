import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getPageParam,
  getSessionId,
  setPageParam,
  clearPageParam,
  isSubscriptionSuccessPage,
} from './urlUtils';

describe('urlUtils', () => {
  beforeEach(() => {
    delete (window as any).location;
    (window as any).location = {
      href: 'http://localhost:3000',
      search: '',
    };
    window.history.pushState = vi.fn();
    window.history.replaceState = vi.fn();
  });

  describe('getPageParam', () => {
    it('should return page parameter from URL', () => {
      (window as any).location.search = '?page=dashboard';
      expect(getPageParam()).toBe('dashboard');
    });

    it('should return null when page parameter is not present', () => {
      (window as any).location.search = '';
      expect(getPageParam()).toBeNull();
    });
  });

  describe('getSessionId', () => {
    it('should return session_id parameter from URL', () => {
      (window as any).location.search = '?session_id=abc123';
      expect(getSessionId()).toBe('abc123');
    });

    it('should return null when session_id is not present', () => {
      (window as any).location.search = '';
      expect(getSessionId()).toBeNull();
    });
  });

  describe('setPageParam', () => {
    it('should set page parameter in URL', () => {
      (window as any).location.href = 'http://localhost:3000';
      setPageParam('analytics');

      expect(window.history.pushState).toHaveBeenCalledWith(
        {},
        '',
        'http://localhost:3000/?page=analytics'
      );
    });

    it('should update existing page parameter', () => {
      (window as any).location.href = 'http://localhost:3000?page=old';
      setPageParam('new');

      expect(window.history.pushState).toHaveBeenCalledWith(
        {},
        '',
        'http://localhost:3000/?page=new'
      );
    });
  });

  describe('clearPageParam', () => {
    it('should remove page parameter from URL', () => {
      (window as any).location.href = 'http://localhost:3000?page=dashboard';
      clearPageParam();

      expect(window.history.replaceState).toHaveBeenCalledWith(
        {},
        '',
        'http://localhost:3000/'
      );
    });

    it('should remove both page and session_id parameters', () => {
      (window as any).location.href = 'http://localhost:3000?page=success&session_id=123';
      clearPageParam();

      expect(window.history.replaceState).toHaveBeenCalledWith(
        {},
        '',
        'http://localhost:3000/'
      );
    });
  });

  describe('isSubscriptionSuccessPage', () => {
    it('should return true when page is subscription-success', () => {
      (window as any).location.search = '?page=subscription-success';
      expect(isSubscriptionSuccessPage()).toBe(true);
    });

    it('should return false for other pages', () => {
      (window as any).location.search = '?page=dashboard';
      expect(isSubscriptionSuccessPage()).toBe(false);
    });

    it('should return false when no page parameter', () => {
      (window as any).location.search = '';
      expect(isSubscriptionSuccessPage()).toBe(false);
    });
  });
});
