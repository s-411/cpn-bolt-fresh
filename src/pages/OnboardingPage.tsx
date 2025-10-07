import { useNavigate } from 'react-router-dom';
import { OnboardingFlow } from '../features/onboarding/components';
import { isAnonymousOnboardingEnabled } from '../lib/config/features';

export function OnboardingPage() {
  const navigate = useNavigate();

  if (!isAnonymousOnboardingEnabled()) {
    navigate('/');
    return null;
  }

  const handleClose = () => {
    navigate('/');
  };

  const handleComplete = () => {
    navigate('/');
  };

  return (
    <OnboardingFlow
      onClose={handleClose}
      onComplete={handleComplete}
    />
  );
}
