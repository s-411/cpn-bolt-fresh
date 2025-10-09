import { GirlFormData, EntryFormData } from './session.service';

const STORAGE_PREFIX = 'cpn_onboarding_';

export interface StorageData {
  girl?: GirlFormData;
  entry?: EntryFormData;
  currentStep?: number;
  lastUpdated?: string;
}

export class StorageService {
  static isAvailable(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  static getKey(key: string): string {
    return `${STORAGE_PREFIX}${key}`;
  }

  static set<T>(key: string, value: T): boolean {
    if (!this.isAvailable()) return false;

    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(this.getKey(key), serialized);
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  }

  static get<T>(key: string): T | null {
    if (!this.isAvailable()) return null;

    try {
      const item = localStorage.getItem(this.getKey(key));
      if (!item) return null;

      return JSON.parse(item) as T;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  }

  static remove(key: string): boolean {
    if (!this.isAvailable()) return false;

    try {
      localStorage.removeItem(this.getKey(key));
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  }

  static clear(): boolean {
    if (!this.isAvailable()) return false;

    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  }

  static saveGirlData(data: GirlFormData): boolean {
    return this.set('girl_data', {
      ...data,
      lastUpdated: new Date().toISOString(),
    });
  }

  static getGirlData(): GirlFormData | null {
    const data = this.get<GirlFormData & { lastUpdated: string }>('girl_data');
    if (!data) return null;

    const { lastUpdated, ...girlData } = data;
    return girlData;
  }

  static saveEntryData(data: EntryFormData): boolean {
    return this.set('entry_data', {
      ...data,
      lastUpdated: new Date().toISOString(),
    });
  }

  static getEntryData(): EntryFormData | null {
    const data = this.get<EntryFormData & { lastUpdated: string }>('entry_data');
    if (!data) return null;

    const { lastUpdated, ...entryData } = data;
    return entryData;
  }

  static saveCurrentStep(step: number): boolean {
    return this.set('current_step', step);
  }

  static getCurrentStep(): number | null {
    return this.get<number>('current_step');
  }

  static getAllData(): StorageData {
    return {
      girl: this.getGirlData(),
      entry: this.getEntryData(),
      currentStep: this.getCurrentStep(),
    };
  }

  static hasStoredData(): boolean {
    const girl = this.getGirlData();
    const entry = this.getEntryData();
    return !!(girl || entry);
  }

  static clearAll(): boolean {
    return this.clear();
  }
}
