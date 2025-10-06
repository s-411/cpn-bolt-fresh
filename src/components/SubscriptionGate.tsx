import { ReactNode, useState } from 'react';
import { Lock } from 'lucide-react';
import UpgradeModal from './UpgradeModal';

interface SubscriptionGateProps {
  children: ReactNode;
  isLocked: boolean;
  featureName: string;
}

export default function SubscriptionGate({ children, isLocked, featureName }: SubscriptionGateProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="relative">
        <div className="filter blur-sm pointer-events-none select-none opacity-40">
          {children}
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8 bg-zinc-900/95 rounded-2xl border border-zinc-800 backdrop-blur-sm">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500/10 rounded-full mb-4">
              <Lock className="w-8 h-8 text-yellow-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              {featureName} Locked
            </h2>
            <p className="text-zinc-400 mb-6">
              Activate Player Mode to unlock {featureName.toLowerCase()} and all premium features
            </p>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-8 rounded-lg transition-all"
            >
              Activate Player Mode
            </button>
          </div>
        </div>
      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName={featureName}
      />
    </>
  );
}
