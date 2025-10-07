import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAnonymousSession } from '../hooks/useAnonymousSession';
import { OnboardingDataService } from '../services/onboardingData.service';
import { AnonymousAuthService } from '../services/anonymousAuth.service';
import type { OnboardingFormData } from '../types/onboarding.types';
import { OnboardingProgress } from './OnboardingProgress';
import { WelcomeStep } from './steps/WelcomeStep';
import { GirlEntryStep } from './steps/GirlEntryStep';
import { DataEntryStep } from './steps/DataEntryStep';
import { PreviewStep } from './steps/PreviewStep';
import { EmailConversionStep } from './steps/EmailConversionStep';

interface OnboardingFlowProps {
  onClose: () => void;
  onComplete: () => void;
}

export function OnboardingFlow({ onClose, onComplete }: OnboardingFlowProps) {
  const { session, loading, error, stepStatus, updateStep, completeOnboarding } = useAnonymousSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingFormData>({
    girl: {
      name: '',
      age: 18,
      rating: 6.0,
    },
    dataEntry: {
      date: new Date().toISOString().split('T')[0],
      amount_spent: 0,
      duration_minutes: 0,
      number_of_nuts: 1,
    },
  });
  const [girlId, setGirlId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);

  useEffect(() => {
    if (session && stepStatus.currentStep) {
      setCurrentStep(stepStatus.currentStep);
    }
  }, [session, stepStatus]);

  const handleNext = async () => {
    setStepError(null);
    setSubmitting(true);

    try {
      if (currentStep === 1) {
        setCurrentStep(2);
        await updateStep(2);
      } else if (currentStep === 2) {
        if (!session) throw new Error('No session');

        const { girl, error: girlError } = await OnboardingDataService.saveGirl(
          session.id,
          formData.girl
        );

        if (girlError || !girl) {
          throw new Error(girlError?.message || 'Failed to save girl');
        }

        setGirlId(girl.id);
        setCurrentStep(3);
        await updateStep(3);
      } else if (currentStep === 3) {
        if (!session || !girlId) throw new Error('Missing session or girl');

        const { error: entryError } = await OnboardingDataService.saveDataEntry(
          session.id,
          girlId,
          formData.dataEntry
        );

        if (entryError) {
          throw new Error(entryError.message || 'Failed to save data entry');
        }

        setCurrentStep(4);
        await updateStep(4);
      } else if (currentStep === 4) {
        const { success, error: migrationError } = await completeOnboarding();

        if (!success || migrationError) {
          throw new Error(migrationError?.message || 'Failed to complete onboarding');
        }

        onComplete();
      }
    } catch (err) {
      const error = err as Error;
      setStepError(error.message);
      console.error('Onboarding step error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setStepError(null);
    }
  };

  const handleSkipToEmail = async () => {
    setCurrentStep(5);
    await updateStep(5);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-[#1a1a1a] rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffd700] mx-auto mb-4"></div>
            <p>Setting up your experience...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-[#1a1a1a] rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-white text-center">
            <p className="mb-4">Unable to start onboarding</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#ffd700] text-black rounded hover:bg-[#e6c200]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#1a1a1a] border-b border-gray-800 p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-[#ffd700]">Welcome to CPN</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <OnboardingProgress currentStep={currentStep} totalSteps={5} />

          {stepError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded text-red-500 text-sm">
              {stepError}
            </div>
          )}

          {currentStep === 1 && (
            <WelcomeStep onNext={handleNext} loading={submitting} />
          )}

          {currentStep === 2 && (
            <GirlEntryStep
              data={formData.girl}
              onChange={(girl) => setFormData({ ...formData, girl })}
              onNext={handleNext}
              onBack={handleBack}
              loading={submitting}
            />
          )}

          {currentStep === 3 && (
            <DataEntryStep
              data={formData.dataEntry}
              onChange={(dataEntry) => setFormData({ ...formData, dataEntry })}
              onNext={handleNext}
              onBack={handleBack}
              loading={submitting}
            />
          )}

          {currentStep === 4 && (
            <PreviewStep
              girlData={formData.girl}
              entryData={formData.dataEntry}
              onConfirm={handleNext}
              onBack={handleBack}
              onSkip={handleSkipToEmail}
              loading={submitting}
            />
          )}

          {currentStep === 5 && (
            <EmailConversionStep
              onComplete={onComplete}
              onSkip={onComplete}
            />
          )}
        </div>
      </div>
    </div>
  );
}
