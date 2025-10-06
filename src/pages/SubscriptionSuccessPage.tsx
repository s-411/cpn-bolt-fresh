import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Home, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { getProductByPriceId } from '../stripe-config';

interface VerificationStatus {
  success: boolean;
  status: string;
  subscription?: any;
  error?: string;
  message?: string;
}

export const SubscriptionSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refreshProfile } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get('session_id');
  const MAX_POLLING_ATTEMPTS = 10;
  const POLLING_INTERVAL = 2000;

  useEffect(() => {
    if (user && sessionId) {
      verifySubscription();
    } else if (!sessionId) {
      setError('Missing session ID. Please contact support.');
      setLoading(false);
    }
  }, [user, sessionId]);

  const verifySubscription = async () => {
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();

      if (!authSession?.access_token) {
        throw new Error('Not authenticated');
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-subscription?session_id=${sessionId}`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authSession.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to verify subscription');
      }

      const result: VerificationStatus = await response.json();

      if (result.success && result.status === 'active') {
        setVerificationStatus(result);
        await refreshProfile();
        setLoading(false);
      } else if (result.status === 'pending' && pollingAttempts < MAX_POLLING_ATTEMPTS) {
        setPollingAttempts(prev => prev + 1);
        setTimeout(() => verifySubscription(), POLLING_INTERVAL);
      } else if (pollingAttempts >= MAX_POLLING_ATTEMPTS) {
        setError('Subscription is being processed. Please refresh the page in a moment.');
        setLoading(false);
      } else {
        throw new Error(result.message || 'Subscription verification failed');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || 'Failed to verify subscription');
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    setPollingAttempts(0);
    verifySubscription();
  };

  const getSubscriptionName = () => {
    if (verificationStatus?.subscription?.planType === 'weekly') {
      return 'Player Mode Weekly';
    } else if (verificationStatus?.subscription?.planType === 'annual') {
      return 'Player Mode Annual';
    }
    return 'Player Mode';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <Loader2 className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Activating Your Subscription
          </h2>
          <p className="text-gray-600 mb-4">
            Please wait while we confirm your payment...
          </p>
          {pollingAttempts > 0 && (
            <p className="text-sm text-gray-500">
              Attempt {pollingAttempts} of {MAX_POLLING_ATTEMPTS}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Processing Your Subscription
          </h2>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Verification
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-6">
            Your payment was successful. If this issue persists, contact support.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="mb-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to {getSubscriptionName()}!
          </h1>
          <p className="text-gray-600">
            Your subscription has been activated successfully. You now have access to all premium features.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">What's included:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Track up to 50 profiles</li>
            <li>• Advanced analytics and insights</li>
            <li>• Export data capabilities</li>
            <li>• Priority support</li>
          </ul>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            Go to Dashboard
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => navigate('/subscription')}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Manage Subscription
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          Questions? Contact our support team anytime.
        </p>
      </div>
    </div>
  );
};