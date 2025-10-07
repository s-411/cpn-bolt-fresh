export const FEATURE_FLAGS = {
  ANONYMOUS_ONBOARDING: import.meta.env.VITE_ENABLE_ANONYMOUS_ONBOARDING === 'true',
} as const;

export function isAnonymousOnboardingEnabled(): boolean {
  return FEATURE_FLAGS.ANONYMOUS_ONBOARDING;
}
