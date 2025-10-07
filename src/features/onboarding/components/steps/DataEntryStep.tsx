import { useState } from 'react';
import type { OnboardingFormData } from '../../types/onboarding.types';

interface DataEntryStepProps {
  data: OnboardingFormData['dataEntry'];
  onChange: (data: OnboardingFormData['dataEntry']) => void;
  onNext: () => void;
  onBack: () => void;
  loading: boolean;
}

export function DataEntryStep({ data, onChange, onNext, onBack, loading }: DataEntryStepProps) {
  const [errors, setErrors] = useState<Partial<Record<keyof OnboardingFormData['dataEntry'], string>>>({});

  const validate = () => {
    const newErrors: Partial<Record<keyof OnboardingFormData['dataEntry'], string>> = {};

    if (!data.date) {
      newErrors.date = 'Date is required';
    }

    if (data.amount_spent < 0) {
      newErrors.amount_spent = 'Amount must be non-negative';
    }

    if (data.duration_minutes <= 0) {
      newErrors.duration_minutes = 'Duration must be positive';
    }

    if (data.number_of_nuts < 0) {
      newErrors.number_of_nuts = 'Number of nuts must be non-negative';
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
        <h3 className="text-2xl font-bold text-white mb-2">Log Your First Date</h3>
        <p className="text-gray-400 mb-6">Enter the details from a recent encounter.</p>
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-2">
          Date <span className="text-red-500">*</span>
        </label>
        <input
          id="date"
          type="date"
          value={data.date}
          onChange={(e) => onChange({ ...data, date: e.target.value })}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#ffd700]"
          disabled={loading}
          max={new Date().toISOString().split('T')[0]}
        />
        {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
      </div>

      <div>
        <label htmlFor="amount_spent" className="block text-sm font-medium text-gray-300 mb-2">
          Amount Spent ($) <span className="text-red-500">*</span>
        </label>
        <input
          id="amount_spent"
          type="number"
          min="0"
          step="0.01"
          value={data.amount_spent}
          onChange={(e) => onChange({ ...data, amount_spent: parseFloat(e.target.value) || 0 })}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#ffd700]"
          placeholder="0.00"
          disabled={loading}
        />
        {errors.amount_spent && <p className="text-red-500 text-sm mt-1">{errors.amount_spent}</p>}
        <p className="text-xs text-gray-500 mt-1">Dinner, drinks, activities, etc.</p>
      </div>

      <div>
        <label htmlFor="duration_minutes" className="block text-sm font-medium text-gray-300 mb-2">
          Duration (minutes) <span className="text-red-500">*</span>
        </label>
        <input
          id="duration_minutes"
          type="number"
          min="1"
          value={data.duration_minutes}
          onChange={(e) => onChange({ ...data, duration_minutes: parseInt(e.target.value) || 0 })}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#ffd700]"
          placeholder="120"
          disabled={loading}
        />
        {errors.duration_minutes && <p className="text-red-500 text-sm mt-1">{errors.duration_minutes}</p>}
        <p className="text-xs text-gray-500 mt-1">How long was the encounter?</p>
      </div>

      <div>
        <label htmlFor="number_of_nuts" className="block text-sm font-medium text-gray-300 mb-2">
          Number of Nuts <span className="text-red-500">*</span>
        </label>
        <input
          id="number_of_nuts"
          type="number"
          min="0"
          value={data.number_of_nuts}
          onChange={(e) => onChange({ ...data, number_of_nuts: parseInt(e.target.value) || 0 })}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#ffd700]"
          placeholder="1"
          disabled={loading}
        />
        {errors.number_of_nuts && <p className="text-red-500 text-sm mt-1">{errors.number_of_nuts}</p>}
        <p className="text-xs text-gray-500 mt-1">Zero is okay - we're all in different situations</p>
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
