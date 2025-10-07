import type { OnboardingFormData } from '../../types/onboarding.types';
import { calculateCostPerNut, formatCurrency } from '../../../../../lib/calculations';

interface PreviewStepProps {
  girlData: OnboardingFormData['girl'];
  entryData: OnboardingFormData['dataEntry'];
  onConfirm: () => void;
  onBack: () => void;
  onSkip: () => void;
  loading: boolean;
}

export function PreviewStep({ girlData, entryData, onConfirm, onBack, onSkip, loading }: PreviewStepProps) {
  const costPerNut = calculateCostPerNut(entryData.amount_spent, entryData.number_of_nuts);
  const costPerHour = entryData.duration_minutes > 0
    ? (entryData.amount_spent / (entryData.duration_minutes / 60))
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-white mb-2">Here's Your Summary</h3>
        <p className="text-gray-400 mb-6">Your first cost per nut calculation!</p>
      </div>

      <div className="bg-gray-800/50 rounded-lg p-6 space-y-4">
        <div>
          <h4 className="text-[#ffd700] font-bold mb-3">Girl Info</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Name:</span>
              <span className="text-white">{girlData.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Age:</span>
              <span className="text-white">{girlData.age}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Rating:</span>
              <span className="text-white">{girlData.rating.toFixed(1)}</span>
            </div>
            {girlData.ethnicity && (
              <div className="flex justify-between">
                <span className="text-gray-400">Ethnicity:</span>
                <span className="text-white">{girlData.ethnicity}</span>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-[#ffd700] font-bold mb-3">Date Info</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Date:</span>
              <span className="text-white">{new Date(entryData.date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Amount Spent:</span>
              <span className="text-white">{formatCurrency(entryData.amount_spent)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Duration:</span>
              <span className="text-white">{entryData.duration_minutes} minutes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Nuts:</span>
              <span className="text-white">{entryData.number_of_nuts}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-[#ffd700] font-bold mb-3">Your Metrics</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Cost Per Nut:</span>
              <span className="text-2xl font-bold text-[#ffd700]">
                {costPerNut === Infinity ? '∞' : formatCurrency(costPerNut)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Cost Per Hour:</span>
              <span className="text-white">{formatCurrency(costPerHour)}/hr</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-4">
        <p className="text-blue-400 text-sm">
          <span className="font-bold">Save Your Data!</span> Create an account to keep tracking
          and access your dashboard with analytics, leaderboards, and more.
        </p>
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
          type="button"
          onClick={onSkip}
          disabled={loading}
          className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Skip for Now
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 px-6 py-3 bg-[#ffd700] text-black rounded-lg font-bold hover:bg-[#e6c200] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Saving...' : 'Create Account'}
        </button>
      </div>
    </div>
  );
}
