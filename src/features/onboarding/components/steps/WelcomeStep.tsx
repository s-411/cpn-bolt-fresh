interface WelcomeStepProps {
  onNext: () => void;
  loading: boolean;
}

export function WelcomeStep({ onNext, loading }: WelcomeStepProps) {
  return (
    <div className="text-center py-8">
      <h3 className="text-3xl font-bold text-white mb-4">
        Calculate Your Cost Per Nut
      </h3>
      <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
        Track your spending and get insights into your dating efficiency.
        No signup required to get started!
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-left">
        <div className="bg-gray-800/50 p-4 rounded-lg">
          <div className="text-[#ffd700] font-bold mb-2">1. Add a Girl</div>
          <p className="text-sm text-gray-400">Enter basic info about someone you're seeing</p>
        </div>
        <div className="bg-gray-800/50 p-4 rounded-lg">
          <div className="text-[#ffd700] font-bold mb-2">2. Log a Date</div>
          <p className="text-sm text-gray-400">Record what you spent and what happened</p>
        </div>
        <div className="bg-gray-800/50 p-4 rounded-lg">
          <div className="text-[#ffd700] font-bold mb-2">3. Get Insights</div>
          <p className="text-sm text-gray-400">See your cost per nut and other metrics</p>
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={loading}
        className="px-8 py-3 bg-[#ffd700] text-black rounded-lg font-bold hover:bg-[#e6c200] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Loading...' : "Let's Get Started"}
      </button>

      <p className="text-xs text-gray-500 mt-4">
        Try it now - no account required
      </p>
    </div>
  );
}
