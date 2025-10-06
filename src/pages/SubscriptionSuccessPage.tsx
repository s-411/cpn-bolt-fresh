import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Home } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getProductByPriceId } from '../stripe-config';

export const SubscriptionSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (user && sessionId) {
      fetchSubscriptionDetails();
    } else {
      setLoading(false);
    }
  }, [user, sessionId]);

  const fetchSubscriptionDetails = async () => {
    try {
      // Fetch updated user profile
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (userError) throw userError;

      // Fetch subscription details from Stripe view
      const { data: subscription, error: subError } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .single();

      if (subError) {
        console.error('Error fetching subscription:', subError);
      }

      setSubscriptionDetails({
        userProfile,
        subscription
      });
    } catch (error) {
      console.error('Error fetching subscription details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSubscriptionName = () => {
    if (subscriptionDetails?.subscription?.price_id) {
      const product = getProductByPriceId(subscriptionDetails.subscription.price_id);
      return product?.name || 'Player Mode';
    }
    return 'Player Mode';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
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