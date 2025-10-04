import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

interface Subscription {
  subscription_status: string;
  price_id: string | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    const fetchSubscription = async () => {
      try {
        const { data, error } = await supabase
          .from('stripe_user_subscriptions')
          .select('*')
          .maybeSingle();

        if (error) {
          console.error('Error fetching subscription:', error);
        } else {
          setSubscription(data);
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [user]);

  const getSubscriptionName = () => {
    if (!subscription || !subscription.price_id) return 'Free';
    
    if (subscription.price_id === 'price_1SBdEz4N2PMxx1mWQLpPCYCr') {
      return 'Player Mode - Annual';
    }
    if (subscription.price_id === 'price_1SBdEy4N2PMxx1mWPFLurfxX') {
      return 'Player Mode Subscription';
    }
    
    return 'Premium';
  };

  const isActive = () => {
    return subscription?.subscription_status === 'active';
  };

  return {
    subscription,
    loading,
    getSubscriptionName,
    isActive,
  };
}