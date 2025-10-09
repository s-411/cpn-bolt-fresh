import { useState } from 'react';
import { Crown, Zap, Check } from 'lucide-react';
import { formatPrice, type StripeProduct } from '../stripe-config';

interface SubscriptionCardProps {
  product: StripeProduct;
  isPopular?: boolean;
  onSubscribe: (priceId: string) => Promise<void>;
  loading?: boolean;
}

export function SubscriptionCard({ product, isPopular, onSubscribe, loading }: SubscriptionCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      await onSubscribe(product.priceId);
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    'Track up to 50 profiles',
    'Advanced analytics dashboard',
    'Export data capabilities',
    'Priority customer support'
  ];

  if (product.interval === 'year') {
    features.push('API access included');
  }

  return (
    <div className={`relative bg-gray-800 rounded-xl p-6 border-2 transition-all duration-300 hover:scale-105 ${
      isPopular ? 'border-cpn-yellow shadow-lg shadow-cpn-yellow/20' : 'border-gray-700 hover:border-gray-600'
    }`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-cpn-yellow text-black px-3 py-1 rounded-full text-sm font-semibold">
            Most Popular
          </span>
        </div>
      )}

      <div className="text-center mb-6">
        <div className="flex justify-center mb-3">
          {product.interval === 'year' ? (
            <Crown className="w-8 h-8 text-cpn-yellow" />
          ) : (
            <Zap className="w-8 h-8 text-cpn-yellow" />
          )}
        </div>
        
        <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
        
        <div className="mb-3">
          <span className="text-3xl font-bold text-cpn-yellow">
            {formatPrice(product.price)}
          </span>
          <span className="text-gray-400 ml-1">
            /{product.interval === 'week' ? 'week' : 'year'}
          </span>
        </div>

        {product.interval === 'year' && (
          <div className="text-sm text-green-400 font-medium">
            Save 73% vs weekly
          </div>
        )}
      </div>

      <p className="text-gray-300 text-sm mb-6 leading-relaxed">
        {product.description}
      </p>

      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center text-sm text-gray-300">
            <Check className="w-4 h-4 text-cpn-yellow mr-3 flex-shrink-0" />
            {feature}
          </li>
        ))}
      </ul>

      <button
        onClick={handleSubscribe}
        disabled={isLoading || loading}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
          isPopular
            ? 'bg-cpn-yellow text-black hover:bg-yellow-400 disabled:bg-yellow-600'
            : 'bg-gray-700 text-white hover:bg-gray-600 disabled:bg-gray-800'
        } disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {isLoading || loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2"></div>
            Processing...
          </div>
        ) : (
          `Subscribe to ${product.name}`
        )}
      </button>
    </div>
  );
}