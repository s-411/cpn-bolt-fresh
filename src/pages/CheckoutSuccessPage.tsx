import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function CheckoutSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscriptionDetails, setSubscriptionDetails] = useState<{
    planName: string;
    amount: string;
    interval: string;
  } | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      navigate('/upgrade');
      return;
    }

    // Refresh user data to get updated subscription info
    const refreshSubscription = async () => {
      try {
        await refreshUser();
        
        // Get subscription details from user data
        if (user?.subscription_tier === 'player') {
          const isAnnual = user.subscription_plan_type === 'annual';
          setSubscriptionDetails({
            planName: isAnnual ? 'Player Mode - Annual' : 'Player Mode - Weekly',
            amount: isAnnual ? '$27.00' : '$1.99',
            interval: isAnnual ? 'year' : 'week'
          });
        }
      } catch (error) {
        console.error('Failed to refresh user data:', error);
      } finally {
        setLoading(false);
      }
    };

    // Wait a moment for webhook to process, then refresh
    setTimeout(refreshSubscription, 2000);
  }, [searchParams, navigate, user, refreshUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cpn-dark flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cpn-yellow animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Processing your subscription...</h2>
          <p className="text-gray-400">Please wait while we confirm your payment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cpn-dark flex items-center justify-center">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-gray-800 rounded-xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-green-500/10 p-4 rounded-full">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-4">
            Welcome to Player Mode!
          </h1>

          {subscriptionDetails && (
            <div className="bg-gray-700 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-white mb-2">Subscription Details</h3>
              <div className="text-sm text-gray-300 space-y-1">
                <p><span className="font-medium">Plan:</span> {subscriptionDetails.planName}</p>
                <p><span className="font-medium">Amount:</span> {subscriptionDetails.amount}/{subscriptionDetails.interval}</p>
                <p><span className="font-medium">Status:</span> <span className="text-green-400">Active</span></p>
              </div>
            </div>
          )}

          <p className="text-gray-300 mb-8">
            Your subscription is now active! You can now track up to 50 profiles and access 
            advanced analytics features.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-cpn-yellow text-black py-3 px-4 rounded-lg font-semibold hover:bg-yellow-400 transition-colors flex items-center justify-center"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
            
            <button
              onClick={() => navigate('/settings')}
              className="w-full bg-gray-700 text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
            >
              Manage Subscription
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}