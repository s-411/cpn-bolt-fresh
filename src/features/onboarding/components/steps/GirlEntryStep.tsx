import { useState } from 'react';
import type { OnboardingFormData } from '../../types/onboarding.types';

interface GirlEntryStepProps {
  data: OnboardingFormData['girl'];
  onChange: (data: OnboardingFormData['girl']) => void;
  onNext: () => void;
  onBack: () => void;
  loading: boolean;
}

const ETHNICITY_OPTIONS = [
  'Prefer not to say',
  'Asian',
  'Black',
  'Latina',
  'Middle Eastern',
  'Mixed',
  'White',
  'Other'
];

const HAIR_COLOR_OPTIONS = [
  'Select hair color...',
  'Blonde',
  'Brunette',
  'Black',
  'Red',
  'Auburn',
  'Gray/White',
  'Other'
];

const RATING_OPTIONS = [5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0, 9.5, 10.0];

export function GirlEntryStep({ data, onChange, onNext, onBack, loading }: GirlEntryStepProps) {
  const [errors, setErrors] = useState<Partial<Record<keyof OnboardingFormData['girl'], string>>>({});

  const validate = () => {
    const newErrors: Partial<Record<keyof OnboardingFormData['girl'], string>> = {};

    if (!data.name || data.name.trim().length === 0) {
      newErrors.name = 'Name is required';
    }

    if (!data.age || data.age < 18) {
      newErrors.age = 'Must be 18 or older';
    } else if (data.age > 120) {
      newErrors.age = 'Invalid age';
    }

    if (!data.rating || data.rating < 5.0 || data.rating > 10.0) {
      newErrors.rating = 'Please select a hotness rating';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onNext();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Add Girl Profile</h2>
          <p className="text-gray-400">Let's start by adding your first girl profile</p>
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={data.name}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
            className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#d4e157] transition-colors"
            placeholder="Enter name..."
            disabled={loading}
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="age" className="block text-sm font-medium text-gray-300 mb-2">
            Age <span className="text-red-500">*</span>
          </label>
          <input
            id="age"
            type="number"
            min="18"
            max="120"
            value={data.age || ''}
            onChange={(e) => onChange({ ...data, age: parseInt(e.target.value) || 0 })}
            className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#d4e157] transition-colors"
            placeholder="18"
            disabled={loading}
          />
          {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
        </div>

        <div>
          <label htmlFor="ethnicity" className="block text-sm font-medium text-gray-300 mb-2">
            Ethnicity (Optional)
          </label>
          <select
            id="ethnicity"
            value={data.ethnicity || 'Prefer not to say'}
            onChange={(e) => onChange({ ...data, ethnicity: e.target.value === 'Prefer not to say' ? '' : e.target.value })}
            className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#d4e157] transition-colors appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23999' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 1rem center'
            }}
            disabled={loading}
          >
            {ETHNICITY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="hair_color" className="block text-sm font-medium text-gray-300 mb-2">
            Hair Color (Optional)
          </label>
          <select
            id="hair_color"
            value={data.hair_color || 'Select hair color...'}
            onChange={(e) => onChange({ ...data, hair_color: e.target.value === 'Select hair color...' ? '' : e.target.value })}
            className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#d4e157] transition-colors appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23999' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 1rem center'
            }}
            disabled={loading}
          >
            {HAIR_COLOR_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Hotness Rating <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-7 gap-2 mb-3">
            {RATING_OPTIONS.slice(0, 7).map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => onChange({ ...data, rating })}
                disabled={loading}
                className={`
                  px-4 py-2.5 rounded-lg font-medium transition-all
                  ${data.rating === rating
                    ? 'bg-[#d4e157] text-black shadow-lg'
                    : 'bg-[#2a2a2a] text-gray-300 border border-gray-700 hover:border-gray-600'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {rating.toFixed(1)}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-5 gap-2 mb-4">
            {RATING_OPTIONS.slice(7).map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => onChange({ ...data, rating })}
                disabled={loading}
                className={`
                  px-4 py-2.5 rounded-lg font-medium transition-all
                  ${data.rating === rating
                    ? 'bg-[#d4e157] text-black shadow-lg'
                    : 'bg-[#2a2a2a] text-gray-300 border border-gray-700 hover:border-gray-600'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {rating.toFixed(1)}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400 px-1">
            <span>5.0-6.0: Below Average</span>
            <span>8.5-10.0: Exceptional</span>
          </div>
          {errors.rating && <p className="text-red-500 text-sm mt-2">{errors.rating}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-4 bg-[#d4e157] text-black rounded-lg font-bold text-lg hover:bg-[#c5d247] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
        >
          {loading ? 'Saving...' : 'Add Expenses'}
        </button>
      </form>
    </div>
  );
}
