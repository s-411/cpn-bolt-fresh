import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { PersistenceService, ValidationService, GirlFormData } from '../../services/onboarding';

export function Step1Page() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<GirlFormData>({
    name: '',
    age: 21,
    rating: 6.0,
    ethnicity: '',
    hair_color: '',
    location_city: '',
    location_country: '',
  });

  useEffect(() => {
    initializeSession();
  }, []);

  const initializeSession = async () => {
    try {
      const result = await PersistenceService.initializeSession();

      if (result.error) {
        console.error('Failed to initialize session:', result.error);
      }

      const existingData = PersistenceService.getLocalGirlData();
      if (existingData) {
        setFormData(existingData);
      }

      setLoading(false);
    } catch (error) {
      console.error('Initialization error:', error);
      setLoading(false);
    }
  };

  const handleChange = (field: keyof GirlFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = ValidationService.validateGirlData(formData);

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
      const result = await PersistenceService.saveGirl(formData);

      if (result.error) {
        console.error('Failed to save girl data:', result.error);
        setErrors({ general: 'Failed to save data. Please try again.' });
        setSubmitting(false);
        return;
      }

      await PersistenceService.updateCurrentStep(2);

      navigate('/step-2');
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
              <h2 className="text-2xl font-bold text-white">Step 1 of 4</h2>
              <span className="text-cpn-yellow text-sm">Add Girl</span>
            </div>
            <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
              <div className="bg-cpn-yellow h-full" style={{ width: '25%' }}></div>
            </div>
          </div>

          {errors.general && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded text-red-500 text-sm">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-cpn-gray mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`w-full bg-cpn-dark border ${
                  errors.name ? 'border-red-500' : 'border-gray-700'
                } rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cpn-yellow transition-colors`}
                placeholder="Enter name"
                disabled={submitting}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="age" className="block text-sm font-medium text-cpn-gray mb-2">
                Age <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="age"
                value={formData.age}
                onChange={(e) => handleChange('age', parseInt(e.target.value) || 18)}
                min="18"
                max="120"
                inputMode="numeric"
                pattern="[0-9]*"
                className={`w-full bg-cpn-dark border ${
                  errors.age ? 'border-red-500' : 'border-gray-700'
                } rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cpn-yellow transition-colors`}
                disabled={submitting}
              />
              {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
            </div>

            <div>
              <label htmlFor="rating" className="block text-sm font-medium text-cpn-gray mb-2">
                Rating <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  id="rating"
                  value={formData.rating}
                  onChange={(e) => handleChange('rating', parseFloat(e.target.value))}
                  min="5.0"
                  max="10.0"
                  step="0.1"
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  disabled={submitting}
                />
                <span className="text-cpn-yellow font-bold text-lg w-12 text-right">
                  {formData.rating.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-cpn-gray mt-1">
                <span>5.0</span>
                <span>10.0</span>
              </div>
              {errors.rating && <p className="text-red-500 text-sm mt-1">{errors.rating}</p>}
            </div>

            <div className="pt-4 border-t border-gray-800">
              <p className="text-sm text-cpn-gray mb-3">Optional Details</p>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Ethnicity (optional)"
                  value={formData.ethnicity || ''}
                  onChange={(e) => handleChange('ethnicity', e.target.value)}
                  className="w-full bg-cpn-dark border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-cpn-yellow transition-colors"
                  disabled={submitting}
                  autoComplete="off"
                />

                <input
                  type="text"
                  placeholder="Hair Color (optional)"
                  value={formData.hair_color || ''}
                  onChange={(e) => handleChange('hair_color', e.target.value)}
                  className="w-full bg-cpn-dark border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-cpn-yellow transition-colors"
                  disabled={submitting}
                  autoComplete="off"
                />

                <input
                  type="text"
                  placeholder="City (optional)"
                  value={formData.location_city || ''}
                  onChange={(e) => handleChange('location_city', e.target.value)}
                  className="w-full bg-cpn-dark border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-cpn-yellow transition-colors"
                  disabled={submitting}
                />

                <input
                  type="text"
                  placeholder="Country (optional)"
                  value={formData.location_country || ''}
                  onChange={(e) => handleChange('location_country', e.target.value)}
                  className="w-full bg-cpn-dark border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-cpn-yellow transition-colors"
                  disabled={submitting}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-cpn-yellow hover:bg-cpn-yellow/90 text-cpn-dark font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
          </form>

          <p className="text-center text-cpn-gray text-xs mt-4">
            Your data is saved securely as you progress
          </p>
        </div>
      </div>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: #ffd700;
          cursor: pointer;
          border-radius: 50%;
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: #ffd700;
          cursor: pointer;
          border-radius: 50%;
          border: none;
        }
      `}</style>
    </div>
  );
}
