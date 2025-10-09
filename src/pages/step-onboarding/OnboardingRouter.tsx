import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase/client';
import { PersistenceService } from '../../services/onboarding';

export function OnboardingRouter() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    determineRoute();
  }, []);

  const determineRoute = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        navigate('/', { replace: true });
        return;
      }

      const girlData = PersistenceService.getLocalGirlData();
      const entryData = PersistenceService.getLocalEntryData();
      const currentStep = PersistenceService.getCurrentStep();

      if (!girlData) {
        navigate('/step-1', { replace: true });
      } else if (!entryData) {
        navigate('/step-2', { replace: true });
      } else if (currentStep < 3) {
        navigate('/step-3', { replace: true });
      } else if (currentStep < 4) {
        navigate('/step-4', { replace: true });
      } else {
        navigate('/step-1', { replace: true });
      }
    } catch (error) {
      console.error('Routing error:', error);
      navigate('/step-1', { replace: true });
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-cpn-dark flex items-center justify-center">
        <div className="text-cpn-gray">Loading...</div>
      </div>
    );
  }

  return null;
}
