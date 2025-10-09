import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Zap } from 'lucide-react';
import { SubscriptionCard } from '../components/SubscriptionCard';
import { STRIPE_PRODUCTS } from '../stripe-config';

export function UpgradePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (priceId: string) => {
    setLoading(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/checkout/success`,
          cancelUrl: `${window.location.origin}/upgrade`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cpn-dark">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-400 hover:text-white transition-colors mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-white">Upgrade to Player Mode</h1>
        </div>

        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-cpn-yellow/10 p-4 rounded-full">
              <Zap className="w-12 h-12 text-cpn-yellow" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Unlock Advanced Analytics & Unlimited Profiles
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Take your relationship tracking to the next level with Player Mode. 
            Get detailed insights, track multiple profiles, and access premium features.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          {STRIPE_PRODUCTS.map((product, index) => (
            <SubscriptionCard
              key={product.priceId}
              product={product}
              isPopular={index === 1} // Annual plan is popular
              onSubscribe={handleSubscribe}
              loading={loading}
            />
          ))}
        </div>

        <div className="bg-gray-800 rounded-xl p-6 max-w-4xl mx-auto">
          <div className="flex items-center mb-4">
            <Shield className="w-6 h-6 text-cpn-yellow mr-3" />
            <h3 className="text-lg font-semibold text-white">Secure Payment</h3>
          </div>
          <p className="text-gray-300 text-sm">
            All payments are processed securely through Stripe. Your payment information is encrypted 
            and never stored on our servers. Cancel anytime from your account settings.
          </p>
        </div>
      </div>
    </div>
  );
}