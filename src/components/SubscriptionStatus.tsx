import { Crown, Zap, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getProductByPriceId } from '../stripe-config';

export function SubscriptionStatus() {
  const { user } = useAuth();

  if (!user) return null;

  const getSubscriptionDisplay = () => {
    switch (user.subscription_tier) {
      case 'player':
        const product = getProductByPriceId(user.stripe_price_id || '');
        const planName = product?.name || 'Player Mode';
        return {
          icon: user.subscription_plan_type === 'annual' ? Crown : Zap,
          name: planName,
          color: 'text-cpn-yellow',
          bgColor: 'bg-cpn-yellow/10'
        };
      case 'boyfriend':
        return {
          icon: User,
          name: 'Boyfriend Mode',
          color: 'text-blue-400',
          bgColor: 'bg-blue-400/10'
        };
      default:
        return {
          icon: User,
          name: 'Free',
          color: 'text-gray-400',
          bgColor: 'bg-gray-400/10'
        };
    }
  };

  const subscription = getSubscriptionDisplay();
  const Icon = subscription.icon;

  return (
    <div className={`inline-flex items-center px-3 py-1.5 rounded-full ${subscription.bgColor}`}>
      <Icon className={`w-4 h-4 mr-2 ${subscription.color}`} />
      <span className={`text-sm font-medium ${subscription.color}`}>
        {subscription.name}
      </span>
    </div>
  );
}