export function generateSessionToken(): string {
  return crypto.randomUUID();
}

export function isSessionExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

export function getSessionDuration(): number {
  return parseInt(import.meta.env.VITE_ONBOARDING_SESSION_DURATION || '86400000', 10);
}
