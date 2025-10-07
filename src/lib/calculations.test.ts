import { describe, it, expect } from 'vitest';
import {
  calculateCostPerNut,
  calculateTimePerNut,
  calculateCostPerHour,
  calculateNutsPerHour,
  calculateEfficiencyScore,
  formatCurrency,
  formatTime,
  formatRating,
} from './calculations';

describe('calculations', () => {
  describe('calculateCostPerNut', () => {
    it('should calculate cost per nut correctly', () => {
      expect(calculateCostPerNut(100, 5)).toBe(20);
      expect(calculateCostPerNut(50, 10)).toBe(5);
    });

    it('should return 0 when nuts are 0', () => {
      expect(calculateCostPerNut(100, 0)).toBe(0);
    });

    it('should round to 2 decimal places', () => {
      expect(calculateCostPerNut(10, 3)).toBe(3.33);
    });
  });

  describe('calculateTimePerNut', () => {
    it('should calculate time per nut correctly', () => {
      expect(calculateTimePerNut(60, 6)).toBe(10);
      expect(calculateTimePerNut(120, 4)).toBe(30);
    });

    it('should return 0 when nuts are 0', () => {
      expect(calculateTimePerNut(60, 0)).toBe(0);
    });

    it('should round to 2 decimal places', () => {
      expect(calculateTimePerNut(10, 3)).toBe(3.33);
    });
  });

  describe('calculateCostPerHour', () => {
    it('should calculate cost per hour correctly', () => {
      expect(calculateCostPerHour(100, 60)).toBe(100);
      expect(calculateCostPerHour(50, 30)).toBe(100);
    });

    it('should return 0 when minutes are 0', () => {
      expect(calculateCostPerHour(100, 0)).toBe(0);
    });

    it('should round to 2 decimal places', () => {
      expect(calculateCostPerHour(10, 7)).toBe(85.71);
    });
  });

  describe('calculateNutsPerHour', () => {
    it('should calculate nuts per hour correctly', () => {
      expect(calculateNutsPerHour(10, 60)).toBe(10);
      expect(calculateNutsPerHour(5, 30)).toBe(10);
    });

    it('should return 0 when minutes are 0', () => {
      expect(calculateNutsPerHour(10, 0)).toBe(0);
    });

    it('should round to 2 decimal places', () => {
      expect(calculateNutsPerHour(7, 23)).toBe(18.26);
    });
  });

  describe('calculateEfficiencyScore', () => {
    it('should calculate efficiency score correctly', () => {
      const score = calculateEfficiencyScore(10, 50, 60, 8);
      expect(score).toBeGreaterThan(0);
    });

    it('should handle zero values correctly', () => {
      expect(calculateEfficiencyScore(0, 0, 0, 5)).toBe(5);
      expect(calculateEfficiencyScore(10, 0, 60, 8)).toBeGreaterThan(0);
    });

    it('should incorporate rating in score', () => {
      const score1 = calculateEfficiencyScore(10, 50, 60, 8);
      const score2 = calculateEfficiencyScore(10, 50, 60, 5);
      expect(score1).toBeGreaterThan(score2);
    });
  });

  describe('formatCurrency', () => {
    it('should format currency with $ and 2 decimals', () => {
      expect(formatCurrency(100)).toBe('$100.00');
      expect(formatCurrency(99.99)).toBe('$99.99');
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should handle decimal values', () => {
      expect(formatCurrency(10.5)).toBe('$10.50');
      expect(formatCurrency(10.555)).toBe('$10.55');
    });
  });

  describe('formatTime', () => {
    it('should format minutes when less than 60', () => {
      expect(formatTime(30)).toBe('30m');
      expect(formatTime(59)).toBe('59m');
    });

    it('should format hours and minutes', () => {
      expect(formatTime(90)).toBe('1h 30m');
      expect(formatTime(125)).toBe('2h 5m');
    });

    it('should format exact hours without minutes', () => {
      expect(formatTime(60)).toBe('1h');
      expect(formatTime(120)).toBe('2h');
    });
  });

  describe('formatRating', () => {
    it('should format rating with star symbol', () => {
      expect(formatRating(8)).toBe('★8.0/10');
      expect(formatRating(7.5)).toBe('★7.5/10');
    });

    it('should format to 1 decimal place', () => {
      expect(formatRating(9.99)).toBe('★10.0/10');
      expect(formatRating(5.55)).toBe('★5.5/10');
    });
  });
});
