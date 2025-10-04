import React, { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { stripeProducts } from '../stripe-config';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

export function PricingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    setLoading(priceId);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        window.location.href = '/login';
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          price_id: priceId,
          success_url: `${window.location.origin}/success`,
          cancel_url: `${window.location.origin}/pricing`,
          mode: 'subscription',
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    } finally {
      setLoading(null);
    }
  };

  const getPrice = (priceId: string) => {
    if (priceId === 'price_1SBdEz4N2PMxx1mWQLpPCYCr') return '$27.00/year';
    if (priceId === 'price_1SBdEy4N2PMxx1mWPFLurfxX') return '$1.99/week';
    return 'Contact us';
  };

  const getFeatures = (priceId: string) => {
    const baseFeatures = [
      'Track up to 50 profiles',
      'Advanced analytics',
      'Data export',
      'Priority support',
    ];

    if (priceId === 'price_1SBdEz4N2PMxx1mWQLpPCYCr') {
      return [...baseFeatures, 'API access', 'Best value - 2 months free!'];
    }

    return baseFeatures;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Choose Your Plan
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Unlock the full potential of CPN with Player Mode
          </p>
        </div>

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0">
          {stripeProducts.map((product) => (
            <div
              key={product.priceId}
              className={`border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200 ${
                product.priceId === 'price_1SBdEz4N2PMxx1mWQLpPCYCr'
                  ? 'border-indigo-500 relative'
                  : ''
              }`}
            >
              {product.priceId === 'price_1SBdEz4N2PMxx1mWQLpPCYCr' && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="inline-flex px-4 py-1 rounded-full text-sm font-semibold tracking-wide uppercase bg-indigo-500 text-white">
                    Best Value
                  </span>
                </div>
              )}
              
              <div className="p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {product.name}
                </h3>
                <p className="mt-4 text-sm text-gray-500">
                  {product.description}
                </p>
                <p className="mt-8">
                  <span className="text-4xl font-extrabold text-gray-900">
                    {getPrice(product.priceId)}
                  </span>
                </p>
                <button
                  onClick={() => handleSubscribe(product.priceId)}
                  disabled={loading === product.priceId}
                  className={`mt-8 block w-full border border-transparent rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-opacity-75 ${
                    product.priceId === 'price_1SBdEz4N2PMxx1mWQLpPCYCr'
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-gray-800 hover:bg-gray-900'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading === product.priceId ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Processing...
                    </div>
                  ) : (
                    'Subscribe Now'
                  )}
                </button>
              </div>
              
              <div className="pt-6 pb-8 px-6">
                <h4 className="text-xs font-medium text-gray-900 tracking-wide uppercase">
                  What's included
                </h4>
                <ul className="mt-6 space-y-4">
                  {getFeatures(product.priceId).map((feature) => (
                    <li key={feature} className="flex space-x-3">
                      <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                      <span className="text-sm text-gray-500">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}