import React from 'react';
import { Crown, Loader2 } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';

export function SubscriptionStatus() {
  const { subscription, loading, getSubscriptionName, isActive } = useSubscription();

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {isActive() ? (
        <Crown className="h-4 w-4 text-yellow-500" />
      ) : (
        <div className="h-4 w-4 rounded-full bg-gray-300" />
      )}
      <span className={`text-sm font-medium ${isActive() ? 'text-yellow-600' : 'text-gray-600'}`}>
        {getSubscriptionName()}
      </span>
    </div>
  );
}