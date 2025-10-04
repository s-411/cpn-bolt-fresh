export interface StripeProduct {
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
}

export const stripeProducts: StripeProduct[] = [
  {
    priceId: 'price_1SBdEz4N2PMxx1mWQLpPCYCr',
    name: 'Player Mode - Annual',
    description: 'Yearly access to CPN - Everything in Player Mode plus API access and priority support',
    mode: 'subscription'
  },
  {
    priceId: 'price_1SBdEy4N2PMxx1mWPFLurfxX',
    name: 'Player Mode Subscription',
    description: 'Weekly subscription to CPN Player Mode - Track up to 50 profiles, advanced analytics, and more',
    mode: 'subscription'
  }
];