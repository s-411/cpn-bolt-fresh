import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PersistenceService } from './persistence.service';
import { StorageService } from './storage.service';
import { SessionService } from './session.service';
import { ValidationService } from './validation.service';
import { MigrationService } from './migration.service';

describe('Data Flow Integration Tests', () => {
  beforeEach(() => {
    StorageService.clearAll();
    vi.clearAllMocks();
  });

  describe('Complete Onboarding Flow', () => {
    it('should handle full onboarding workflow', async () => {
      const girlData = {
        name: 'Jane Doe',
        age: 25,
        rating: 8.5,
      };

      const entryData = {
        date: '2025-10-09',
        amount_spent: 150,
        duration_minutes: 90,
        number_of_nuts: 2,
      };

      const validation1 = ValidationService.validateGirlData(girlData);
      expect(validation1.isValid).toBe(true);

      StorageService.saveGirlData(girlData);
      expect(StorageService.getGirlData()).toEqual(girlData);

      StorageService.saveCurrentStep(2);
      expect(StorageService.getCurrentStep()).toBe(2);

      const validation2 = ValidationService.validateEntryData(entryData);
      expect(validation2.isValid).toBe(true);

      StorageService.saveEntryData(entryData);
      expect(StorageService.getEntryData()).toEqual(entryData);

      StorageService.saveCurrentStep(3);
      expect(StorageService.getCurrentStep()).toBe(3);

      expect(StorageService.hasStoredData()).toBe(true);
    });
  });

  describe('Data Persistence Across Page Refresh', () => {
    it('should persist girl data in localStorage', () => {
      const girlData = {
        name: 'Test Girl',
        age: 22,
        rating: 7.0,
        ethnicity: 'Asian',
      };

      StorageService.saveGirlData(girlData);

      const retrieved = StorageService.getGirlData();
      expect(retrieved).toEqual(girlData);
      expect(retrieved?.name).toBe('Test Girl');
      expect(retrieved?.ethnicity).toBe('Asian');
    });

    it('should persist entry data in localStorage', () => {
      const entryData = {
        date: '2025-10-09',
        amount_spent: 200,
        duration_minutes: 120,
        number_of_nuts: 3,
      };

      StorageService.saveEntryData(entryData);

      const retrieved = StorageService.getEntryData();
      expect(retrieved).toEqual(entryData);
    });

    it('should persist current step', () => {
      StorageService.saveCurrentStep(3);
      expect(StorageService.getCurrentStep()).toBe(3);

      StorageService.saveCurrentStep(4);
      expect(StorageService.getCurrentStep()).toBe(4);
    });

    it('should update data when saving multiple times', () => {
      StorageService.saveGirlData({ name: 'Test 1', age: 25, rating: 8.0 });
      const first = StorageService.getGirlData();
      expect(first?.name).toBe('Test 1');

      StorageService.saveGirlData({ name: 'Test 2', age: 26, rating: 9.0 });
      const second = StorageService.getGirlData();
      expect(second?.name).toBe('Test 2');
      expect(second?.age).toBe(26);
    });
  });

  describe('Data Validation Edge Cases', () => {
    it('should reject invalid girl data', () => {
      const invalidData = [
        { name: '', age: 25, rating: 8.0 },
        { name: 'Jane', age: 17, rating: 8.0 },
        { name: 'Jane', age: 25, rating: 4.9 },
        { name: 'Jane', age: 25, rating: 10.1 },
        { name: 'Jane', age: 150, rating: 8.0 },
      ];

      invalidData.forEach((data) => {
        const result = ValidationService.validateGirlData(data as any);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it('should reject invalid entry data', () => {
      const invalidData = [
        { date: '2025-10-09', amount_spent: -1, duration_minutes: 60, number_of_nuts: 2 },
        { date: '2025-10-09', amount_spent: 100, duration_minutes: 0, number_of_nuts: 2 },
        { date: '2025-10-09', amount_spent: 100, duration_minutes: 60, number_of_nuts: -1 },
        { date: '2025-10-09', amount_spent: 100, duration_minutes: 1500, number_of_nuts: 2 },
        { date: '2099-12-31', amount_spent: 100, duration_minutes: 60, number_of_nuts: 2 },
      ];

      invalidData.forEach((data) => {
        const result = ValidationService.validateEntryData(data as any);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it('should validate email formats', () => {
      const validEmails = [
        'user@example.com',
        'test+tag@domain.co.uk',
        'user.name@example.com',
      ];

      validEmails.forEach((email) => {
        const result = ValidationService.validateEmail(email);
        expect(result.isValid).toBe(true);
      });

      const invalidEmails = [
        '',
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
      ];

      invalidEmails.forEach((email) => {
        const result = ValidationService.validateEmail(email);
        expect(result.isValid).toBe(false);
      });
    });

    it('should validate password requirements', () => {
      const validPasswords = [
        'password123',
        'MyP@ssw0rd',
        'securepassword',
        '12345678',
      ];

      validPasswords.forEach((password) => {
        const result = ValidationService.validatePassword(password);
        expect(result.isValid).toBe(true);
      });

      const invalidPasswords = [
        '',
        'short',
        '1234567',
      ];

      invalidPasswords.forEach((password) => {
        const result = ValidationService.validatePassword(password);
        expect(result.isValid).toBe(false);
      });
    });
  });

  describe('State Consistency', () => {
    it('should maintain data consistency between saves', () => {
      const girlData1 = { name: 'Girl 1', age: 25, rating: 8.0 };
      StorageService.saveGirlData(girlData1);
      expect(StorageService.getGirlData()).toEqual(girlData1);

      const girlData2 = { name: 'Girl 2', age: 26, rating: 9.0 };
      StorageService.saveGirlData(girlData2);
      expect(StorageService.getGirlData()).toEqual(girlData2);
      expect(StorageService.getGirlData()?.name).toBe('Girl 2');
    });

    it('should track step progression correctly', () => {
      expect(StorageService.getCurrentStep()).toBeNull();

      StorageService.saveCurrentStep(2);
      expect(StorageService.getCurrentStep()).toBe(2);

      StorageService.saveCurrentStep(3);
      expect(StorageService.getCurrentStep()).toBe(3);

      StorageService.saveCurrentStep(4);
      expect(StorageService.getCurrentStep()).toBe(4);
    });

    it('should clear all data atomically', () => {
      StorageService.saveGirlData({ name: 'Test', age: 25, rating: 8.0 });
      StorageService.saveEntryData({
        date: '2025-10-09',
        amount_spent: 100,
        duration_minutes: 60,
        number_of_nuts: 2,
      });
      StorageService.saveCurrentStep(3);

      expect(StorageService.hasStoredData()).toBe(true);

      StorageService.clearAll();

      expect(StorageService.getGirlData()).toBeNull();
      expect(StorageService.getEntryData()).toBeNull();
      expect(StorageService.getCurrentStep()).toBeNull();
      expect(StorageService.hasStoredData()).toBe(false);
    });
  });

  describe('Error Recovery', () => {
    it('should handle missing data gracefully', () => {
      expect(StorageService.getGirlData()).toBeNull();
      expect(StorageService.getEntryData()).toBeNull();
      expect(StorageService.getCurrentStep()).toBeNull();
      expect(StorageService.hasStoredData()).toBe(false);
    });

    it('should handle corrupted localStorage data', () => {
      localStorage.setItem('cpn_onboarding_girl', 'invalid json{');

      const girlData = StorageService.getGirlData();
      expect(girlData).toBeNull();
    });

    it('should provide helpful validation error messages', () => {
      const result = ValidationService.validateGirlData({
        name: '',
        age: 17,
        rating: 4.0,
      } as any);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);

      const nameError = ValidationService.getErrorMessage('name', result.errors);
      expect(nameError).toBeTruthy();

      const ageError = ValidationService.getErrorMessage('age', result.errors);
      expect(ageError).toBeTruthy();

      const allErrors = ValidationService.getAllErrorMessages(result.errors);
      expect(allErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Session Token Management', () => {
    it('should store and retrieve session token', () => {
      const token = 'test-token-123';
      SessionService.setStoredToken(token);

      const retrieved = SessionService.getStoredToken();
      expect(retrieved).toBe(token);
    });

    it('should clear session token', () => {
      SessionService.setStoredToken('test-token');
      expect(SessionService.getStoredToken()).toBeTruthy();

      SessionService.clearStoredToken();
      expect(SessionService.getStoredToken()).toBeNull();
    });
  });

  describe('Data Migration Preparation', () => {
    it('should have all required data before migration', () => {
      const girlData = { name: 'Test', age: 25, rating: 8.0 };
      const entryData = {
        date: '2025-10-09',
        amount_spent: 100,
        duration_minutes: 60,
        number_of_nuts: 2,
      };

      StorageService.saveGirlData(girlData);
      StorageService.saveEntryData(entryData);

      const hasGirl = StorageService.getGirlData() !== null;
      const hasEntry = StorageService.getEntryData() !== null;

      expect(hasGirl).toBe(true);
      expect(hasEntry).toBe(true);
      expect(StorageService.hasStoredData()).toBe(true);
    });

    it('should validate all data before migration', () => {
      const girlData = StorageService.getGirlData();
      const entryData = StorageService.getEntryData();

      if (girlData) {
        const validation = ValidationService.validateGirlData(girlData);
        expect(validation.isValid).toBe(true);
      }

      if (entryData) {
        const validation = ValidationService.validateEntryData(entryData);
        expect(validation.isValid).toBe(true);
      }
    });
  });

  describe('Optional Fields Handling', () => {
    it('should handle optional girl fields', () => {
      const minimalGirl = {
        name: 'Jane',
        age: 25,
        rating: 8.0,
      };

      const validation1 = ValidationService.validateGirlData(minimalGirl);
      expect(validation1.isValid).toBe(true);

      const fullGirl = {
        ...minimalGirl,
        ethnicity: 'Asian',
        hair_color: 'Black',
        location_city: 'NYC',
        location_country: 'USA',
      };

      const validation2 = ValidationService.validateGirlData(fullGirl);
      expect(validation2.isValid).toBe(true);

      StorageService.saveGirlData(fullGirl);
      const retrieved = StorageService.getGirlData();
      expect(retrieved?.ethnicity).toBe('Asian');
      expect(retrieved?.location_city).toBe('NYC');
    });
  });

  describe('Boundary Values', () => {
    it('should accept boundary age values', () => {
      const ages = [18, 25, 50, 100, 120];

      ages.forEach((age) => {
        const result = ValidationService.validateGirlData({
          name: 'Test',
          age,
          rating: 8.0,
        });
        expect(result.isValid).toBe(true);
      });
    });

    it('should accept boundary rating values', () => {
      const ratings = [5.0, 7.5, 10.0];

      ratings.forEach((rating) => {
        const result = ValidationService.validateGirlData({
          name: 'Test',
          age: 25,
          rating,
        });
        expect(result.isValid).toBe(true);
      });
    });

    it('should accept zero nuts (edge case)', () => {
      const result = ValidationService.validateEntryData({
        date: '2025-10-09',
        amount_spent: 100,
        duration_minutes: 60,
        number_of_nuts: 0,
      });
      expect(result.isValid).toBe(true);
    });

    it('should accept high amounts', () => {
      const result = ValidationService.validateEntryData({
        date: '2025-10-09',
        amount_spent: 50000,
        duration_minutes: 120,
        number_of_nuts: 5,
      });
      expect(result.isValid).toBe(true);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle rapid sequential saves', () => {
      const iterations = 10;

      for (let i = 0; i < iterations; i++) {
        StorageService.saveGirlData({
          name: `Girl ${i}`,
          age: 25 + i,
          rating: 7.0 + i * 0.1,
        });
      }

      const final = StorageService.getGirlData();
      expect(final?.name).toBe('Girl 9');
      expect(final?.age).toBe(34);
    });

    it('should handle interleaved operations', () => {
      StorageService.saveGirlData({ name: 'Girl 1', age: 25, rating: 8.0 });
      StorageService.saveCurrentStep(2);
      StorageService.saveEntryData({
        date: '2025-10-09',
        amount_spent: 100,
        duration_minutes: 60,
        number_of_nuts: 2,
      });
      StorageService.saveCurrentStep(3);

      expect(StorageService.getGirlData()?.name).toBe('Girl 1');
      expect(StorageService.getEntryData()?.amount_spent).toBe(100);
      expect(StorageService.getCurrentStep()).toBe(3);
    });
  });
});
