import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Calculator, TrendingUp, BarChart3 } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';

export function StartPage() {
  const navigate = useNavigate();

  useEffect(() => {
    checkExistingUser();
  }, []);

  const checkExistingUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        navigate('/', { replace: true });
      }
    } catch (error) {
      console.error('Auth check error:', error);
    }
  };

  const handleStart = () => {
    navigate('/step-1');
  };

  return (
    <div className="min-h-screen bg-cpn-dark flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-cpn-yellow mb-4">CPN</h1>
          <p className="text-cpn-gray text-xl mb-2">Cost Per Nut Calculator</p>
          <p className="text-cpn-gray/70 text-sm">
            Track, analyze, and optimize your dating investments
          </p>
        </div>

        <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-8 md:p-12 mb-8">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">
            Welcome to Your Data-Driven Dating Journey
          </h2>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-cpn-yellow/10 rounded-full mb-4">
                <Calculator className="text-cpn-yellow" size={32} />
              </div>
              <h3 className="text-white font-bold mb-2">Calculate CPN</h3>
              <p className="text-cpn-gray text-sm">
                Track spending and results to understand your true cost per encounter
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-cpn-yellow/10 rounded-full mb-4">
                <TrendingUp className="text-cpn-yellow" size={32} />
              </div>
              <h3 className="text-white font-bold mb-2">Track Progress</h3>
              <p className="text-cpn-gray text-sm">
                Monitor trends over time and see how your investments improve
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-cpn-yellow/10 rounded-full mb-4">
                <BarChart3 className="text-cpn-yellow" size={32} />
              </div>
              <h3 className="text-white font-bold mb-2">Compare Data</h3>
              <p className="text-cpn-gray text-sm">
                Analyze multiple profiles and find your most efficient connections
              </p>
            </div>
          </div>

          <div className="bg-cpn-dark/50 border border-gray-800 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-bold text-white mb-4">What You'll Do:</h3>
            <ul className="space-y-3 text-cpn-gray text-sm">
              <li className="flex items-start gap-3">
                <span className="text-cpn-yellow font-bold">1.</span>
                <span>Add a girl profile with basic info (30 seconds)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cpn-yellow font-bold">2.</span>
                <span>Enter your first data point: date, amount spent, and results</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cpn-yellow font-bold">3.</span>
                <span>Create a free account to save your data</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cpn-yellow font-bold">4.</span>
                <span>Choose a plan (free or premium) and start tracking</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleStart}
            className="w-full bg-cpn-yellow hover:bg-cpn-yellow/90 text-cpn-dark font-bold py-4 px-8 rounded-lg transition-all flex items-center justify-center gap-2 text-lg"
          >
            <span>Get Started</span>
            <ArrowRight size={24} />
          </button>

          <p className="text-center text-cpn-gray text-xs mt-6">
            No credit card required to start. Takes less than 2 minutes.
          </p>
        </div>

        <div className="text-center text-cpn-gray text-sm">
          <p>
            Already have an account?{' '}
            <button
              onClick={() => navigate('/signin')}
              className="text-cpn-yellow hover:underline"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
