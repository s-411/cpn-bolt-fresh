import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';
import { calculateCostPerNut, formatCurrency } from '../../lib/calculations';
import { PersistenceService } from '../../services/onboarding';

interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  interval: string;
  priceId: string;
  features: string[];
  recommended?: boolean;
}

const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'forever',
    priceId: '',
    features: [
      'Track up to 5 girls',
      'Basic CPN calculations',
      'Data entry & tracking',
      'Mobile responsive',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 1.99,
    interval: 'week',
    priceId: 'price_1SBdEy4N2PMxx1mWPFLurfxX',
    features: [
      'Track up to 50 girls',
      'Advanced analytics',
      'Data export (CSV)',
      'Comparison charts',
      'Priority support',
    ],
    recommended: true,
  },
  {
    id: 'vip',
    name: 'VIP',
    price: 27.0,
    interval: 'year',
    priceId: 'price_1SBdEz4N2PMxx1mWQLpPCYCr',
    features: [
      'Unlimited girls',
      'All Premium features',
      'API access',
      'Custom reports',
      'White-glove support',
      'Early access to features',
    ],
  },
];

export function Step4Page() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  const [girlName, setGirlName] = useState<string>('');
  const [cpnMetrics, setCpnMetrics] = useState<{
    costPerNut: number;
    totalSpent: number;
    totalNuts: number;
  } | null>(null);

  useEffect(() => {
    initializePage();
  }, []);

  const initializePage = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate('/step-3');
        return;
      }

      const girlData = PersistenceService.getLocalGirlData();
      const entryData = PersistenceService.getLocalEntryData();

      if (!girlData || !entryData) {
        if (!girlData) {
          navigate('/step-1');
        } else if (!entryData) {
          navigate('/step-2');
        }
        return;
      }

      setGirlName(girlData.name);

      const cpn = calculateCostPerNut(entryData.amount_spent, entryData.number_of_nuts);
      setCpnMetrics({
        costPerNut: cpn,
        totalSpent: entryData.amount_spent,
        totalNuts: entryData.number_of_nuts,
      });

      setLoading(false);
    } catch (error) {
      console.error('Initialization error:', error);
      setLoading(false);
    }
  };

  const handleSubscribe = async (tier: SubscriptionTier) => {
    if (tier.id === 'free') {
      handleContinueWithFree();
      return;
    }

    setSubscribing(true);
    setSelectedTier(tier.id);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        console.error('No session found');
        setSubscribing(false);
        setSelectedTier(null);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            priceId: tier.priceId,
            planType: tier.interval,
          }),
        }
      );

      const data = await response.json();

      if (data.error) {
        console.error('Checkout error:', data.error);
        alert('Failed to start checkout. Please try again.');
        setSubscribing(false);
        setSelectedTier(null);
        return;
      }

      if (data.url) {
        PersistenceService.clearLocalData();
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Subscribe error:', error);
      alert('An error occurred. Please try again.');
      setSubscribing(false);
      setSelectedTier(null);
    }
  };

  const handleContinueWithFree = () => {
    PersistenceService.clearLocalData();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cpn-dark flex items-center justify-center p-4">
        <div className="text-cpn-gray">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cpn-dark py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-cpn-yellow mb-2">CPN</h1>
          <p className="text-cpn-gray text-sm">Cost Per Nut Calculator</p>
        </div>

        <div className="text-center mb-8">
          <div className="inline-block bg-[#1a1a1a] rounded-lg p-6 border border-gray-800 mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Step 4 of 4</h2>
            <div className="w-64 bg-gray-800 h-2 rounded-full overflow-hidden mx-auto">
              <div className="bg-cpn-yellow h-full" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>

        {cpnMetrics && (
          <div className="bg-cpn-yellow/10 border border-cpn-yellow/20 rounded-lg p-6 mb-8 max-w-2xl mx-auto">
            <p className="text-cpn-yellow font-medium mb-3 text-center">
              Your First CPN Calculation:
            </p>
            <div className="text-center">
              <p className="text-4xl font-bold text-white mb-2">
                {formatCurrency(cpnMetrics.costPerNut)}
              </p>
              <p className="text-cpn-gray text-sm">Cost per nut with {girlName}</p>
              <div className="flex justify-center gap-6 mt-4 text-sm text-cpn-gray">
                <div>
                  <span className="text-white font-medium">{formatCurrency(cpnMetrics.totalSpent)}</span> spent
                </div>
                <div>
                  <span className="text-white font-medium">{cpnMetrics.totalNuts}</span> nuts
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <h3 className="text-3xl font-bold text-white mb-3">Choose Your Plan</h3>
          <p className="text-cpn-gray">Unlock advanced features to track and optimize your CPN</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {SUBSCRIPTION_TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`bg-[#1a1a1a] rounded-lg p-6 border-2 ${
                tier.recommended ? 'border-cpn-yellow' : 'border-gray-800'
              } relative transition-all hover:border-cpn-yellow/50`}
            >
              {tier.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cpn-yellow text-cpn-dark px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <Sparkles size={12} />
                  <span>RECOMMENDED</span>
                </div>
              )}

              <div className="text-center mb-6">
                <h4 className="text-2xl font-bold text-white mb-2">{tier.name}</h4>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-cpn-yellow">
                    {tier.price === 0 ? 'Free' : `$${tier.price}`}
                  </span>
                  {tier.price > 0 && (
                    <span className="text-cpn-gray text-sm">/{tier.interval}</span>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-cpn-gray">
                    <Check size={18} className="text-cpn-yellow flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(tier)}
                disabled={subscribing}
                className={`w-full py-3 px-4 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  tier.recommended
                    ? 'bg-cpn-yellow hover:bg-cpn-yellow/90 text-cpn-dark'
                    : 'bg-gray-800 hover:bg-gray-700 text-white'
                }`}
              >
                {subscribing && selectedTier === tier.id
                  ? 'Processing...'
                  : tier.id === 'free'
                  ? 'Continue with Free'
                  : `Subscribe to ${tier.name}`}
              </button>
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-cpn-gray text-sm mb-4">
            All plans include secure data storage and mobile access
          </p>
          <p className="text-cpn-gray text-xs">
            By subscribing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
