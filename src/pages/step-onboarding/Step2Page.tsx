import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { PersistenceService, ValidationService, EntryFormData } from '../../services/onboarding';

export function Step2Page() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [girlName, setGirlName] = useState<string>('');

  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState<EntryFormData>({
    date: today,
    amount_spent: 0,
    duration_minutes: 60,
    number_of_nuts: 1,
  });

  useEffect(() => {
    initializePage();
  }, []);

  const initializePage = async () => {
    try {
      const girlData = PersistenceService.getLocalGirlData();

      if (!girlData) {
        navigate('/step-1');
        return;
      }

      setGirlName(girlData.name);

      const existingEntry = PersistenceService.getLocalEntryData();
      if (existingEntry) {
        setFormData(existingEntry);
      }

      setLoading(false);
    } catch (error) {
      console.error('Initialization error:', error);
      setLoading(false);
    }
  };

  const handleChange = (field: keyof EntryFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleBack = () => {
    navigate('/step-1');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = ValidationService.validateEntryData(formData);

    if (!validation.isValid) {
      const errorMap: Record<string, string> = {};
      validation.errors.forEach((err) => {
        errorMap[err.field] = err.message;
      });
      setErrors(errorMap);
      return;
    }

    setSubmitting(true);

    try {
      const result = await PersistenceService.saveEntry(formData);

      if (result.error) {
        console.error('Failed to save entry data:', result.error);
        setErrors({ general: 'Failed to save data. Please try again.' });
        setSubmitting(false);
        return;
      }

      await PersistenceService.updateCurrentStep(3);

      navigate('/step-3');
    } catch (error) {
      console.error('Submit error:', error);
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cpn-dark flex items-center justify-center p-4">
        <div className="text-cpn-gray">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cpn-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-cpn-yellow mb-2">CPN</h1>
          <p className="text-cpn-gray text-sm">Cost Per Nut Calculator</p>
        </div>

        <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-white">Step 2 of 4</h2>
              <span className="text-cpn-yellow text-sm">Add Data</span>
            </div>
            <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
              <div className="bg-cpn-yellow h-full" style={{ width: '50%' }}></div>
            </div>
          </div>

          {girlName && (
            <div className="mb-6 p-3 bg-cpn-yellow/10 border border-cpn-yellow/20 rounded-lg">
              <p className="text-cpn-yellow text-sm">
                Adding data for: <span className="font-bold">{girlName}</span>
              </p>
            </div>
          )}

          {errors.general && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded text-red-500 text-sm">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-cpn-gray mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                max={today}
                className={`w-full bg-cpn-dark border ${
                  errors.date ? 'border-red-500' : 'border-gray-700'
                } rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cpn-yellow transition-colors`}
                disabled={submitting}
              />
              {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
            </div>

            <div>
              <label htmlFor="amount_spent" className="block text-sm font-medium text-cpn-gray mb-2">
                Amount Spent ($) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="amount_spent"
                value={formData.amount_spent}
                onChange={(e) => handleChange('amount_spent', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                inputMode="decimal"
                className={`w-full bg-cpn-dark border ${
                  errors.amount_spent ? 'border-red-500' : 'border-gray-700'
                } rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cpn-yellow transition-colors`}
                placeholder="0.00"
                disabled={submitting}
              />
              {errors.amount_spent && (
                <p className="text-red-500 text-sm mt-1">{errors.amount_spent}</p>
              )}
            </div>

            <div>
              <label htmlFor="duration_minutes" className="block text-sm font-medium text-cpn-gray mb-2">
                Duration (minutes) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="duration_minutes"
                value={formData.duration_minutes}
                onChange={(e) => handleChange('duration_minutes', parseInt(e.target.value) || 0)}
                min="1"
                max="1440"
                inputMode="numeric"
                pattern="[0-9]*"
                className={`w-full bg-cpn-dark border ${
                  errors.duration_minutes ? 'border-red-500' : 'border-gray-700'
                } rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cpn-yellow transition-colors`}
                placeholder="60"
                disabled={submitting}
              />
              {errors.duration_minutes && (
                <p className="text-red-500 text-sm mt-1">{errors.duration_minutes}</p>
              )}
              <p className="text-xs text-cpn-gray mt-1">
                {formData.duration_minutes > 0 &&
                  `${Math.floor(formData.duration_minutes / 60)}h ${formData.duration_minutes % 60}m`}
              </p>
            </div>

            <div>
              <label htmlFor="number_of_nuts" className="block text-sm font-medium text-cpn-gray mb-2">
                Number of Nuts <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="number_of_nuts"
                value={formData.number_of_nuts}
                onChange={(e) => handleChange('number_of_nuts', parseInt(e.target.value) || 0)}
                min="0"
                max="99"
                inputMode="numeric"
                pattern="[0-9]*"
                className={`w-full bg-cpn-dark border ${
                  errors.number_of_nuts ? 'border-red-500' : 'border-gray-700'
                } rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cpn-yellow transition-colors`}
                placeholder="1"
                disabled={submitting}
              />
              {errors.number_of_nuts && (
                <p className="text-red-500 text-sm mt-1">{errors.number_of_nuts}</p>
              )}
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleBack}
                disabled={submitting}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} />
                <span>Back</span>
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-cpn-yellow hover:bg-cpn-yellow/90 text-cpn-dark font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <span>Continue</span>
                    <ChevronRight size={20} />
                  </>
                )}
              </button>
            </div>
          </form>

          <p className="text-center text-cpn-gray text-xs mt-4">
            Your data is saved securely as you progress
          </p>
        </div>
      </div>
    </div>
  );
}
