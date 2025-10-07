import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase/client';
import { AnonymousAuthService } from '../services/anonymousAuth.service';
import { OnboardingDataService } from '../services/onboardingData.service';
import type { OnboardingSession, OnboardingStepStatus } from '../types/onboarding.types';

export function useAnonymousSession() {
  const [session, setSession] = useState<OnboardingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [stepStatus, setStepStatus] = useState<OnboardingStepStatus>({
    currentStep: 1,
    completedSteps: [],
    sessionId: null,
    girlId: null,
  });

  const initializeSession = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const existingSession = await AnonymousAuthService.getCurrentSession(user.id);

        if (existingSession) {
          setSession(existingSession);
          setStepStatus(prev => ({
            ...prev,
            currentStep: existingSession.current_step,
            sessionId: existingSession.id,
          }));
          setLoading(false);
          return;
        }
      }

      const { user: newUser, session: newSession, error: createError } =
        await AnonymousAuthService.createAnonymousSession();

      if (createError) throw createError;
      if (!newSession) throw new Error('Failed to create session');

      setSession(newSession);
      setStepStatus(prev => ({
        ...prev,
        sessionId: newSession.id,
      }));
    } catch (err) {
      setError(err as Error);
      console.error('Failed to initialize session:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStep = useCallback(async (step: number) => {
    if (!session) return false;

    const success = await AnonymousAuthService.updateStep(session.id, step);
    if (success) {
      setSession(prev => prev ? { ...prev, current_step: step } : null);
      setStepStatus(prev => ({
        ...prev,
        currentStep: step,
        completedSteps: [...prev.completedSteps, step - 1].filter((s, i, arr) => arr.indexOf(s) === i),
      }));
    }
    return success;
  }, [session]);

  const completeOnboarding = useCallback(async () => {
    if (!session) return { success: false, error: new Error('No active session') };

    return await OnboardingDataService.completeOnboarding(session.id);
  }, [session]);

  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  return {
    session,
    loading,
    error,
    stepStatus,
    updateStep,
    completeOnboarding,
    reinitialize: initializeSession,
  };
}
