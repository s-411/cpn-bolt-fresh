import { useState } from 'react';
import type { OnboardingFormData } from '../../types/onboarding.types';

interface GirlEntryStepProps {
  data: OnboardingFormData['girl'];
  onChange: (data: OnboardingFormData['girl']) => void;
  onNext: () => void;
  onBack: () => void;
  loading: boolean;
}

export function GirlEntryStep({ data, onChange, onNext, onBack, loading }: GirlEntryStepProps) {
  const [errors, setErrors] = useState<Partial<Record<keyof OnboardingFormData['girl'], string>>>({});

  const validate = () => {
    const newErrors: Partial<Record<keyof OnboardingFormData['girl'], string>> = {};

    if (!data.name || data.name.trim().length === 0) {
      newErrors.name = 'Name is required';
    }

    if (data.age < 18) {
      newErrors.age = 'Must be 18 or older';
    } else if (data.age > 120) {
      newErrors.age = 'Invalid age';
    }

    if (data.rating < 5.0 || data.rating > 10.0) {
      newErrors.rating = 'Rating must be between 5.0 and 10.0';
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-white mb-2">Add Your First Girl</h3>
        <p className="text-gray-400 mb-6">Let's start tracking. Enter some basic info.</p>
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
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#ffd700]"
          placeholder="e.g., Sarah"
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
          value={data.age}
          onChange={(e) => onChange({ ...data, age: parseInt(e.target.value) || 18 })}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#ffd700]"
          disabled={loading}
        />
        {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
      </div>

      <div>
        <label htmlFor="rating" className="block text-sm font-medium text-gray-300 mb-2">
          Rating (5.0 - 10.0) <span className="text-red-500">*</span>
        </label>
        <input
          id="rating"
          type="number"
          min="5.0"
          max="10.0"
          step="0.1"
          value={data.rating}
          onChange={(e) => onChange({ ...data, rating: parseFloat(e.target.value) || 6.0 })}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#ffd700]"
          disabled={loading}
        />
        {errors.rating && <p className="text-red-500 text-sm mt-1">{errors.rating}</p>}
      </div>

      <div>
        <label htmlFor="ethnicity" className="block text-sm font-medium text-gray-300 mb-2">
          Ethnicity (Optional)
        </label>
        <input
          id="ethnicity"
          type="text"
          value={data.ethnicity || ''}
          onChange={(e) => onChange({ ...data, ethnicity: e.target.value })}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#ffd700]"
          placeholder="e.g., Asian, Latina, etc."
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="hair_color" className="block text-sm font-medium text-gray-300 mb-2">
          Hair Color (Optional)
        </label>
        <input
          id="hair_color"
          type="text"
          value={data.hair_color || ''}
          onChange={(e) => onChange({ ...data, hair_color: e.target.value })}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#ffd700]"
          placeholder="e.g., Blonde, Brunette, etc."
          disabled={loading}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3 bg-[#ffd700] text-black rounded-lg font-bold hover:bg-[#e6c200] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </form>
  );
}
