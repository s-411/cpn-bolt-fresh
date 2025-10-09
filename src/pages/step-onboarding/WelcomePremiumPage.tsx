import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Sparkles, ArrowRight, Loader2, X, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';

type VerificationState = 'verifying' | 'success' | 'error';

export function WelcomePremiumPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<VerificationState>('verifying');
  const [error, setError] = useState<string | null>(null);
  const [planType, setPlanType] = useState<string>('Premium');

  useEffect(() => {
    verifySubscription();
  }, []);

  const verifySubscription = async () => {
    try {
      setState('verifying');
      setError(null);

      const sessionId = searchParams.get('session_id');

      if (!sessionId) {
        throw new Error('No session ID found');
      }

      const {
        data: { session: authSession },
      } = await supabase.auth.getSession();

      if (!authSession?.access_token) {
        throw new Error('Not authenticated');
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-subscription?session_id=${sessionId}`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authSession.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to verify subscription');
      }

      const result = await response.json();

      if (!result.success || result.status !== 'active') {
        throw new Error(result.message || 'Subscription verification failed');
      }

      if (result.subscription_tier) {
        setPlanType(result.subscription_tier === 'premium' ? 'Premium' : 'VIP');
      }

      setState('success');
    } catch (err) {
      console.error('Verification error:', err);
      setError(err instanceof Error ? err.message : 'Failed to verify subscription');
      setState('error');
    }
  };

  const handleContinue = () => {
    navigate('/');
  };

  if (state === 'verifying') {
    return (
      <div className="min-h-screen bg-cpn-dark flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-cpn-yellow/10 rounded-full mb-6 animate-pulse">
              <Loader2 className="w-8 h-8 text-cpn-yellow animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Activating Your Subscription...</h1>
            <p className="text-cpn-gray">Please wait while we set up your premium features</p>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen bg-cpn-dark flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-[#1a1a1a] rounded-lg border border-red-500/20 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/10 rounded-full mb-6">
              <X className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Verification Issue</h1>
            <p className="text-cpn-gray mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={verifySubscription}
                className="w-full bg-cpn-yellow hover:bg-cpn-yellow/90 text-cpn-dark font-bold py-3 px-8 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Verification
              </button>
              <button
                onClick={handleContinue}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg transition-all"
              >
                Go to Dashboard
              </button>
            </div>
            <p className="text-xs text-cpn-gray mt-6">
              Your payment was successful. If this issue persists, contact support.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cpn-dark flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-cpn-yellow mb-2">CPN</h1>
          <p className="text-cpn-gray text-sm">Cost Per Nut Calculator</p>
        </div>

        <div className="bg-[#1a1a1a] rounded-lg border border-cpn-yellow/20 p-8 md:p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-cpn-yellow/10 rounded-full mb-6">
            <Sparkles className="w-10 h-10 text-cpn-yellow" />
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Welcome to {planType}!
          </h2>

          <p className="text-cpn-gray text-lg mb-2">Your subscription is now active</p>
          <p className="text-cpn-gray/70 text-sm mb-8">
            You now have access to all premium features
          </p>

          <div className="bg-cpn-yellow/5 border border-cpn-yellow/20 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center justify-center gap-2">
              <Check className="text-cpn-yellow" size={24} />
              <span>What's Unlocked</span>
            </h3>
            <div className="grid md:grid-cols-2 gap-3 text-left">
              <div className="flex items-start gap-2">
                <Check className="text-cpn-yellow flex-shrink-0 mt-0.5" size={18} />
                <span className="text-white text-sm">
                  {planType === 'VIP' ? 'Unlimited girls' : 'Track up to 50 girls'}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="text-cpn-yellow flex-shrink-0 mt-0.5" size={18} />
                <span className="text-white text-sm">Advanced analytics & insights</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="text-cpn-yellow flex-shrink-0 mt-0.5" size={18} />
                <span className="text-white text-sm">Data export (CSV)</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="text-cpn-yellow flex-shrink-0 mt-0.5" size={18} />
                <span className="text-white text-sm">Comparison charts</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="text-cpn-yellow flex-shrink-0 mt-0.5" size={18} />
                <span className="text-white text-sm">Leaderboards access</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="text-cpn-yellow flex-shrink-0 mt-0.5" size={18} />
                <span className="text-white text-sm">Share features</span>
              </div>
              {planType === 'VIP' && (
                <>
                  <div className="flex items-start gap-2">
                    <Check className="text-cpn-yellow flex-shrink-0 mt-0.5" size={18} />
                    <span className="text-white text-sm">API access</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="text-cpn-yellow flex-shrink-0 mt-0.5" size={18} />
                    <span className="text-white text-sm">White-glove support</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-cpn-dark/50 border border-gray-800 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-bold text-white mb-3">What's Next?</h3>
            <ul className="space-y-2 text-left text-cpn-gray text-sm">
              <li className="flex items-start gap-2">
                <span className="text-cpn-yellow">1.</span>
                <span>Explore your dashboard and see your first CPN calculation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cpn-yellow">2.</span>
                <span>Add more girls and data entries to build your analytics</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cpn-yellow">3.</span>
                <span>Check out the leaderboards to see how you compare</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cpn-yellow">4.</span>
                <span>Export your data anytime with the new export feature</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleContinue}
            className="w-full bg-cpn-yellow hover:bg-cpn-yellow/90 text-cpn-dark font-bold py-4 px-8 rounded-lg transition-all flex items-center justify-center gap-2 text-lg"
          >
            <span>Go to Dashboard</span>
            <ArrowRight size={20} />
          </button>

          <p className="text-cpn-gray text-xs mt-6">
            Thank you for supporting CPN! You can manage your subscription anytime from your account
            settings.
          </p>
        </div>
      </div>
    </div>
  );
}
