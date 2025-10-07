import { useState } from 'react';
import { AnonymousAuthService } from '../../services/anonymousAuth.service';

interface EmailConversionStepProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function EmailConversionStep({ onComplete, onSkip }: EmailConversionStepProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email');
      return false;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { error: conversionError } = await AnonymousAuthService.convertAnonymousToPermanent(
        email,
        password
      );

      if (conversionError) {
        throw conversionError;
      }

      onComplete();
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to create account');
      console.error('Email conversion error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-white mb-2">Create Your Account</h3>
        <p className="text-gray-400 mb-6">
          Save your data and unlock the full CPN experience.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500 rounded text-red-500 text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#ffd700]"
          placeholder="your.email@example.com"
          disabled={loading}
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
          Password <span className="text-red-500">*</span>
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#ffd700]"
          placeholder="Minimum 6 characters"
          disabled={loading}
          required
          minLength={6}
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
          Confirm Password <span className="text-red-500">*</span>
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#ffd700]"
          placeholder="Re-enter your password"
          disabled={loading}
          required
          minLength={6}
        />
      </div>

      <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-4">
        <p className="text-blue-400 text-sm">
          By creating an account, you'll keep all your data and get access to:
        </p>
        <ul className="mt-2 space-y-1 text-sm text-blue-300">
          <li>• Full dashboard and analytics</li>
          <li>• Track multiple girls and dates</li>
          <li>• Leaderboards and comparisons</li>
          <li>• Export your data anytime</li>
        </ul>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onSkip}
          disabled={loading}
          className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Skip for Now
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3 bg-[#ffd700] text-black rounded-lg font-bold hover:bg-[#e6c200] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </div>

      <p className="text-xs text-gray-500 text-center">
        No spam, no BS. Your data stays private.
      </p>
    </form>
  );
}
