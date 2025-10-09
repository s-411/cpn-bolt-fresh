import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ValidationService } from './validation.service';
import { StorageService } from './storage.service';

describe('ValidationService', () => {
  describe('validateGirlData', () => {
    it('should validate correct girl data', () => {
      const result = ValidationService.validateGirlData({
        name: 'Test Girl',
        age: 25,
        rating: 7.5,
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty name', () => {
      const result = ValidationService.validateGirlData({
        name: '',
        age: 25,
        rating: 7.5,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'name',
        message: 'Name is required',
      });
    });

    it('should reject age below 18', () => {
      const result = ValidationService.validateGirlData({
        name: 'Test Girl',
        age: 17,
        rating: 7.5,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'age',
        message: 'Age must be at least 18',
      });
    });

    it('should reject rating below 5.0', () => {
      const result = ValidationService.validateGirlData({
        name: 'Test Girl',
        age: 25,
        rating: 4.5,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'rating',
        message: 'Rating must be at least 5.0',
      });
    });

    it('should reject rating above 10.0', () => {
      const result = ValidationService.validateGirlData({
        name: 'Test Girl',
        age: 25,
        rating: 10.5,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'rating',
        message: 'Rating must be 10.0 or less',
      });
    });
  });

  describe('validateEntryData', () => {
    it('should validate correct entry data', () => {
      const result = ValidationService.validateEntryData({
        date: '2025-10-09',
        amount_spent: 100,
        duration_minutes: 60,
        number_of_nuts: 2,
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject negative amount spent', () => {
      const result = ValidationService.validateEntryData({
        date: '2025-10-09',
        amount_spent: -10,
        duration_minutes: 60,
        number_of_nuts: 2,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'amount_spent',
        message: 'Amount spent cannot be negative',
      });
    });

    it('should reject zero duration', () => {
      const result = ValidationService.validateEntryData({
        date: '2025-10-09',
        amount_spent: 100,
        duration_minutes: 0,
        number_of_nuts: 2,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'duration_minutes',
        message: 'Duration must be greater than 0',
      });
    });

    it('should reject negative number of nuts', () => {
      const result = ValidationService.validateEntryData({
        date: '2025-10-09',
        amount_spent: 100,
        duration_minutes: 60,
        number_of_nuts: -1,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'number_of_nuts',
        message: 'Number of nuts cannot be negative',
      });
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email', () => {
      const result = ValidationService.validateEmail('test@example.com');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty email', () => {
      const result = ValidationService.validateEmail('');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'email',
        message: 'Email is required',
      });
    });

    it('should reject invalid email format', () => {
      const result = ValidationService.validateEmail('invalid-email');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'email',
        message: 'Invalid email format',
      });
    });
  });

  describe('validatePassword', () => {
    it('should validate correct password', () => {
      const result = ValidationService.validatePassword('password123');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject short password', () => {
      const result = ValidationService.validatePassword('short');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'password',
        message: 'Password must be at least 8 characters',
      });
    });

    it('should reject empty password', () => {
      const result = ValidationService.validatePassword('');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'password',
        message: 'Password is required',
      });
    });
  });

  describe('helper methods', () => {
    it('should get error message for field', () => {
      const errors = [
        { field: 'name', message: 'Name is required' },
        { field: 'age', message: 'Age must be at least 18' },
      ];

      const message = ValidationService.getErrorMessage('name', errors);
      expect(message).toBe('Name is required');
    });

    it('should check if field has error', () => {
      const errors = [
        { field: 'name', message: 'Name is required' },
        { field: 'age', message: 'Age must be at least 18' },
      ];

      expect(ValidationService.hasFieldError('name', errors)).toBe(true);
      expect(ValidationService.hasFieldError('rating', errors)).toBe(false);
    });

    it('should get all error messages', () => {
      const errors = [
        { field: 'name', message: 'Name is required' },
        { field: 'age', message: 'Age must be at least 18' },
      ];

      const messages = ValidationService.getAllErrorMessages(errors);
      expect(messages).toEqual(['Name is required', 'Age must be at least 18']);
    });
  });
});

describe('StorageService', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  describe('girl data operations', () => {
    it('should save and retrieve girl data', () => {
      const girlData = {
        name: 'Test Girl',
        age: 25,
        rating: 7.5,
      };

      const saved = StorageService.saveGirlData(girlData);
      const retrieved = StorageService.getGirlData();

      expect(saved).toBe(true);
      expect(retrieved).toEqual(girlData);
    });

    it('should return null for non-existent girl data', () => {
      const retrieved = StorageService.getGirlData();
      expect(retrieved).toBeNull();
    });
  });

  describe('entry data operations', () => {
    it('should save and retrieve entry data', () => {
      const entryData = {
        date: '2025-10-09',
        amount_spent: 100,
        duration_minutes: 60,
        number_of_nuts: 2,
      };

      const saved = StorageService.saveEntryData(entryData);
      const retrieved = StorageService.getEntryData();

      expect(saved).toBe(true);
      expect(retrieved).toEqual(entryData);
    });

    it('should return null for non-existent entry data', () => {
      const retrieved = StorageService.getEntryData();
      expect(retrieved).toBeNull();
    });
  });

  describe('step operations', () => {
    it('should save and retrieve current step', () => {
      const saved = StorageService.saveCurrentStep(2);
      const retrieved = StorageService.getCurrentStep();

      expect(saved).toBe(true);
      expect(retrieved).toBe(2);
    });
  });

  describe('clear operations', () => {
    it('should clear all data', () => {
      StorageService.saveGirlData({ name: 'Test', age: 25, rating: 7.5 });
      StorageService.saveEntryData({
        date: '2025-10-09',
        amount_spent: 100,
        duration_minutes: 60,
        number_of_nuts: 2,
      });
      StorageService.saveCurrentStep(2);

      const cleared = StorageService.clearAll();
      expect(cleared).toBe(true);

      expect(StorageService.getGirlData()).toBeNull();
      expect(StorageService.getEntryData()).toBeNull();
      expect(StorageService.getCurrentStep()).toBeNull();
    });
  });

  describe('hasStoredData', () => {
    it('should return true when girl data exists', () => {
      StorageService.saveGirlData({ name: 'Test', age: 25, rating: 7.5 });
      expect(StorageService.hasStoredData()).toBe(true);
    });

    it('should return true when entry data exists', () => {
      StorageService.saveEntryData({
        date: '2025-10-09',
        amount_spent: 100,
        duration_minutes: 60,
        number_of_nuts: 2,
      });
      expect(StorageService.hasStoredData()).toBe(true);
    });

    it('should return false when no data exists', () => {
      expect(StorageService.hasStoredData()).toBe(false);
    });
  });
});
