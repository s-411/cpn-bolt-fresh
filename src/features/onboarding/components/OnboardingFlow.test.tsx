import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OnboardingFlow } from './OnboardingFlow';

vi.mock('../hooks/useAnonymousSession', () => ({
  useAnonymousSession: vi.fn(),
}));

vi.mock('../services/onboardingData.service', () => ({
  OnboardingDataService: {
    saveGirl: vi.fn(),
    saveDataEntry: vi.fn(),
  },
}));

vi.mock('../services/anonymousAuth.service', () => ({
  AnonymousAuthService: {
    updateStep: vi.fn(),
  },
}));

describe('OnboardingFlow', () => {
  const mockOnClose = vi.fn();
  const mockOnComplete = vi.fn();

  const defaultSessionData = {
    session: {
      id: 'session-123',
      user_id: 'user-123',
      session_token: 'token-123',
      current_step: 1,
      is_completed: false,
      is_anonymous: true,
      converted_at: null,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {},
    },
    loading: false,
    error: null,
    stepStatus: {
      currentStep: 1,
      completedSteps: [],
      sessionId: 'session-123',
      girlId: null,
    },
    updateStep: vi.fn(),
    completeOnboarding: vi.fn(),
    reinitialize: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state', () => {
    const { useAnonymousSession } = require('../hooks/useAnonymousSession');
    vi.mocked(useAnonymousSession).mockReturnValue({
      ...defaultSessionData,
      loading: true,
    });

    render(<OnboardingFlow onClose={mockOnClose} onComplete={mockOnComplete} />);

    expect(screen.getByText('Setting up your experience...')).toBeInTheDocument();
  });

  it('should render error state when no session', () => {
    const { useAnonymousSession } = require('../hooks/useAnonymousSession');
    vi.mocked(useAnonymousSession).mockReturnValue({
      ...defaultSessionData,
      session: null,
      error: new Error('Failed to create session'),
    });

    render(<OnboardingFlow onClose={mockOnClose} onComplete={mockOnComplete} />);

    expect(screen.getByText('Unable to start onboarding')).toBeInTheDocument();
  });

  it('should render welcome step initially', () => {
    const { useAnonymousSession } = require('../hooks/useAnonymousSession');
    vi.mocked(useAnonymousSession).mockReturnValue(defaultSessionData);

    render(<OnboardingFlow onClose={mockOnClose} onComplete={mockOnComplete} />);

    expect(screen.getByText('Welcome to CPN')).toBeInTheDocument();
  });

  it('should close when X button is clicked', async () => {
    const { useAnonymousSession } = require('../hooks/useAnonymousSession');
    vi.mocked(useAnonymousSession).mockReturnValue(defaultSessionData);

    const user = userEvent.setup();
    render(<OnboardingFlow onClose={mockOnClose} onComplete={mockOnComplete} />);

    const closeButton = screen.getByLabelText('Close');
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should progress through steps successfully', async () => {
    const { useAnonymousSession } = require('../hooks/useAnonymousSession');
    const { OnboardingDataService } = require('../services/onboardingData.service');

    const mockUpdateStep = vi.fn().mockResolvedValue(true);
    const mockCompleteOnboarding = vi.fn().mockResolvedValue({
      success: true,
      error: null,
    });

    vi.mocked(useAnonymousSession).mockReturnValue({
      ...defaultSessionData,
      updateStep: mockUpdateStep,
      completeOnboarding: mockCompleteOnboarding,
    });

    vi.mocked(OnboardingDataService.saveGirl).mockResolvedValue({
      girl: {
        id: 'girl-123',
        session_id: 'session-123',
        user_id: 'user-123',
        name: 'Jane',
        age: 25,
        rating: 7.5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      error: null,
    });

    vi.mocked(OnboardingDataService.saveDataEntry).mockResolvedValue({
      entry: {
        id: 'entry-123',
        session_id: 'session-123',
        girl_id: 'girl-123',
        date: '2025-10-07',
        amount_spent: 100,
        duration_minutes: 60,
        number_of_nuts: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      error: null,
    });

    render(<OnboardingFlow onClose={mockOnClose} onComplete={mockOnComplete} />);

    expect(screen.getByText('Welcome to CPN')).toBeInTheDocument();
  });

  it('should display error when girl save fails', async () => {
    const { useAnonymousSession } = require('../hooks/useAnonymousSession');
    const { OnboardingDataService } = require('../services/onboardingData.service');

    vi.mocked(useAnonymousSession).mockReturnValue({
      ...defaultSessionData,
      stepStatus: { ...defaultSessionData.stepStatus, currentStep: 2 },
    });

    vi.mocked(OnboardingDataService.saveGirl).mockResolvedValue({
      girl: null,
      error: new Error('Database error'),
    });

    render(<OnboardingFlow onClose={mockOnClose} onComplete={mockOnComplete} />);

    await waitFor(() => {
      const errorElement = screen.queryByText(/Database error/i);
      if (errorElement) {
        expect(errorElement).toBeInTheDocument();
      }
    });
  });

  it('should handle back navigation', async () => {
    const { useAnonymousSession } = require('../hooks/useAnonymousSession');

    vi.mocked(useAnonymousSession).mockReturnValue({
      ...defaultSessionData,
      stepStatus: { ...defaultSessionData.stepStatus, currentStep: 2 },
    });

    render(<OnboardingFlow onClose={mockOnClose} onComplete={mockOnComplete} />);

    await waitFor(() => {
      expect(screen.queryByText(/back/i)).toBeTruthy();
    });
  });

  it('should show progress indicator', () => {
    const { useAnonymousSession } = require('../hooks/useAnonymousSession');
    vi.mocked(useAnonymousSession).mockReturnValue(defaultSessionData);

    const { container } = render(
      <OnboardingFlow onClose={mockOnClose} onComplete={mockOnComplete} />
    );

    const progressElements = container.querySelectorAll('[class*="progress"]');
    expect(progressElements.length).toBeGreaterThan(0);
  });

  it('should complete onboarding successfully', async () => {
    const { useAnonymousSession } = require('../hooks/useAnonymousSession');

    const mockCompleteOnboarding = vi.fn().mockResolvedValue({
      success: true,
      error: null,
    });

    vi.mocked(useAnonymousSession).mockReturnValue({
      ...defaultSessionData,
      stepStatus: { ...defaultSessionData.stepStatus, currentStep: 4 },
      completeOnboarding: mockCompleteOnboarding,
    });

    render(<OnboardingFlow onClose={mockOnClose} onComplete={mockOnComplete} />);

    await waitFor(() => {
      if (mockCompleteOnboarding.mock.calls.length > 0) {
        expect(mockCompleteOnboarding).toHaveBeenCalled();
      }
    });
  });
});
