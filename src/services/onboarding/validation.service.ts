import { GirlFormData, EntryFormData } from './session.service';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export class ValidationService {
  static validateGirlData(data: Partial<GirlFormData>): ValidationResult {
    const errors: ValidationError[] = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Name is required' });
    } else if (data.name.length > 100) {
      errors.push({ field: 'name', message: 'Name must be 100 characters or less' });
    }

    if (data.age === undefined || data.age === null) {
      errors.push({ field: 'age', message: 'Age is required' });
    } else if (data.age < 18) {
      errors.push({ field: 'age', message: 'Age must be at least 18' });
    } else if (data.age > 120) {
      errors.push({ field: 'age', message: 'Age must be 120 or less' });
    }

    if (data.rating === undefined || data.rating === null) {
      errors.push({ field: 'rating', message: 'Rating is required' });
    } else if (data.rating < 5.0) {
      errors.push({ field: 'rating', message: 'Rating must be at least 5.0' });
    } else if (data.rating > 10.0) {
      errors.push({ field: 'rating', message: 'Rating must be 10.0 or less' });
    }

    if (data.ethnicity && data.ethnicity.length > 50) {
      errors.push({ field: 'ethnicity', message: 'Ethnicity must be 50 characters or less' });
    }

    if (data.hair_color && data.hair_color.length > 50) {
      errors.push({ field: 'hair_color', message: 'Hair color must be 50 characters or less' });
    }

    if (data.location_city && data.location_city.length > 100) {
      errors.push({ field: 'location_city', message: 'City must be 100 characters or less' });
    }

    if (data.location_country && data.location_country.length > 100) {
      errors.push({ field: 'location_country', message: 'Country must be 100 characters or less' });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateEntryData(data: Partial<EntryFormData>): ValidationResult {
    const errors: ValidationError[] = [];

    if (!data.date) {
      errors.push({ field: 'date', message: 'Date is required' });
    } else {
      const dateObj = new Date(data.date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      if (isNaN(dateObj.getTime())) {
        errors.push({ field: 'date', message: 'Invalid date format' });
      } else if (dateObj > today) {
        errors.push({ field: 'date', message: 'Date cannot be in the future' });
      }
    }

    if (data.amount_spent === undefined || data.amount_spent === null) {
      errors.push({ field: 'amount_spent', message: 'Amount spent is required' });
    } else if (data.amount_spent < 0) {
      errors.push({ field: 'amount_spent', message: 'Amount spent cannot be negative' });
    } else if (data.amount_spent > 999999.99) {
      errors.push({ field: 'amount_spent', message: 'Amount spent is too large' });
    }

    if (data.duration_minutes === undefined || data.duration_minutes === null) {
      errors.push({ field: 'duration_minutes', message: 'Duration is required' });
    } else if (data.duration_minutes <= 0) {
      errors.push({ field: 'duration_minutes', message: 'Duration must be greater than 0' });
    } else if (data.duration_minutes > 1440) {
      errors.push({ field: 'duration_minutes', message: 'Duration cannot exceed 24 hours' });
    }

    if (data.number_of_nuts === undefined || data.number_of_nuts === null) {
      errors.push({ field: 'number_of_nuts', message: 'Number of nuts is required' });
    } else if (data.number_of_nuts < 0) {
      errors.push({ field: 'number_of_nuts', message: 'Number of nuts cannot be negative' });
    } else if (data.number_of_nuts > 99) {
      errors.push({ field: 'number_of_nuts', message: 'Number of nuts seems unrealistic' });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateEmail(email: string): ValidationResult {
    const errors: ValidationError[] = [];

    if (!email || email.trim().length === 0) {
      errors.push({ field: 'email', message: 'Email is required' });
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push({ field: 'email', message: 'Invalid email format' });
      } else if (email.length > 255) {
        errors.push({ field: 'email', message: 'Email is too long' });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validatePassword(password: string): ValidationResult {
    const errors: ValidationError[] = [];

    if (!password || password.length === 0) {
      errors.push({ field: 'password', message: 'Password is required' });
    } else if (password.length < 8) {
      errors.push({ field: 'password', message: 'Password must be at least 8 characters' });
    } else if (password.length > 72) {
      errors.push({ field: 'password', message: 'Password must be 72 characters or less' });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static getErrorMessage(field: string, errors: ValidationError[]): string | null {
    const error = errors.find((err) => err.field === field);
    return error ? error.message : null;
  }

  static hasFieldError(field: string, errors: ValidationError[]): boolean {
    return errors.some((err) => err.field === field);
  }

  static getAllErrorMessages(errors: ValidationError[]): string[] {
    return errors.map((err) => err.message);
  }
}
