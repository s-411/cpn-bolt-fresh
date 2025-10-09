import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';
import {
  PersistenceService,
  ValidationService,
  MigrationService,
} from '../../services/onboarding';

export function Step3Page() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const [girlName, setGirlName] = useState<string>('');
  const [entryData, setEntryData] = useState<{
    date: string;
    amount: number;
    nuts: number;
  } | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    initializePage();
  }, []);

  const initializePage = async () => {
    try {
      const girlData = PersistenceService.getLocalGirlData();
      const entry = PersistenceService.getLocalEntryData();

      if (!girlData || !entry) {
        if (!girlData) {
          navigate('/step-1');
        } else {
          navigate('/step-2');
        }
        return;
      }

      setGirlName(girlData.name);
      setEntryData({
        date: entry.date,
        amount: entry.amount_spent,
        nuts: entry.number_of_nuts,
      });

      setLoading(false);
    } catch (error) {
      console.error('Initialization error:', error);
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
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
    navigate('/step-2');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const emailValidation = ValidationService.validateEmail(formData.email);
    const passwordValidation = ValidationService.validatePassword(formData.password);

    const allErrors: Record<string, string> = {};

    if (!emailValidation.isValid) {
      emailValidation.errors.forEach((err) => {
        allErrors[err.field] = err.message;
      });
    }

    if (!passwordValidation.isValid) {
      passwordValidation.errors.forEach((err) => {
        allErrors[err.field] = err.message;
      });
    }

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      return;
    }

    setSubmitting(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        console.error('Auth error:', authError);
        setErrors({ general: authError.message || 'Failed to create account. Please try again.' });
        setSubmitting(false);
        return;
      }

      if (!authData.user) {
        setErrors({ general: 'Failed to create account. Please try again.' });
        setSubmitting(false);
        return;
      }

      const migrationResult = await MigrationService.migrateSessionDataToUser(authData.user.id);

      if (!migrationResult.success || migrationResult.error) {
        console.error('Migration error:', migrationResult.error);
        setErrors({
          general: 'Account created but failed to save your data. Please contact support.',
        });
        setSubmitting(false);
        return;
      }

      await PersistenceService.updateCurrentStep(4);

      navigate('/step-4');
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
              <h2 className="text-2xl font-bold text-white">Step 3 of 4</h2>
              <span className="text-cpn-yellow text-sm">Create Account</span>
            </div>
            <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
              <div className="bg-cpn-yellow h-full" style={{ width: '75%' }}></div>
            </div>
          </div>

          <div className="mb-6 p-4 bg-cpn-yellow/10 border border-cpn-yellow/20 rounded-lg space-y-2">
            <p className="text-cpn-yellow text-sm font-medium">Your Progress So Far:</p>
            <div className="text-sm text-cpn-gray space-y-1">
              <div className="flex justify-between">
                <span>Girl:</span>
                <span className="text-white font-medium">{girlName}</span>
              </div>
              {entryData && (
                <>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span className="text-white font-medium">{entryData.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="text-white font-medium">${entryData.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nuts:</span>
                    <span className="text-white font-medium">{entryData.nuts}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {errors.general && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded text-red-500 text-sm">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-cpn-gray mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                autoComplete="email"
                inputMode="email"
                className={`w-full bg-cpn-dark border ${
                  errors.email ? 'border-red-500' : 'border-gray-700'
                } rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cpn-yellow transition-colors`}
                placeholder="your@email.com"
                disabled={submitting}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-cpn-gray mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  autoComplete="new-password"
                  className={`w-full bg-cpn-dark border ${
                    errors.password ? 'border-red-500' : 'border-gray-700'
                  } rounded-lg px-4 py-3 pr-12 text-white focus:outline-none focus:border-cpn-yellow transition-colors`}
                  placeholder="Min 8 characters"
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cpn-gray hover:text-white transition-colors p-2"
                  disabled={submitting}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              <p className="text-xs text-cpn-gray mt-1">Must be at least 8 characters</p>
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
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ChevronRight size={20} />
                  </>
                )}
              </button>
            </div>
          </form>

          <p className="text-center text-cpn-gray text-xs mt-4">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
