export function useAnonymousSession() {
  return {
    session: null,
    loading: true,
    error: null,
    stepStatus: {
      currentStep: 1,
      completedSteps: [],
      sessionId: null,
      girlId: null,
    },
    updateStep: async () => false,
    completeOnboarding: async () => ({ success: false, error: new Error('Not implemented') }),
    reinitialize: async () => {},
  };
}
