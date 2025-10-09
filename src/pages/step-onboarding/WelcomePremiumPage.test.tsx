import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { WelcomePremiumPage } from './WelcomePremiumPage';
import { supabase } from '../../lib/supabase/client';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams('?session_id=test-session-id')],
  };
});

vi.mock('../../lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

global.fetch = vi.fn();

describe('WelcomePremiumPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          access_token: 'test-token',
          user: { id: 'test-user-id' },
        },
      },
      error: null,
    } as any);
  });

  it('should show verifying state initially', async () => {
    vi.mocked(global.fetch).mockImplementation(
      () =>
        new Promise(() => {
        })
    );

    render(
      <BrowserRouter>
        <WelcomePremiumPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Activating Your Subscription...')).toBeInTheDocument();
    expect(screen.getByText('Please wait while we set up your premium features')).toBeInTheDocument();
  });

  it('should display success page for premium subscription', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        status: 'active',
        subscription_tier: 'premium',
      }),
    } as Response);

    render(
      <BrowserRouter>
        <WelcomePremiumPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Welcome to Premium!')).toBeInTheDocument();
    });

    expect(screen.getByText('Your subscription is now active')).toBeInTheDocument();
    expect(screen.getByText("What's Unlocked")).toBeInTheDocument();
  });

  it('should display success page for VIP subscription', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        status: 'active',
        subscription_tier: 'vip',
      }),
    } as Response);

    render(
      <BrowserRouter>
        <WelcomePremiumPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Welcome to VIP!')).toBeInTheDocument();
    });

    expect(screen.getByText('API access')).toBeInTheDocument();
    expect(screen.getByText('White-glove support')).toBeInTheDocument();
  });

  it('should show error state on verification failure', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      json: async () => ({
        error: 'Verification failed',
      }),
    } as Response);

    render(
      <BrowserRouter>
        <WelcomePremiumPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Verification Issue')).toBeInTheDocument();
    });

    expect(screen.getByText('Verification failed')).toBeInTheDocument();
    expect(screen.getByText('Retry Verification')).toBeInTheDocument();
  });

  it('should handle authentication error', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: null,
      },
      error: null,
    } as any);

    render(
      <BrowserRouter>
        <WelcomePremiumPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Verification Issue')).toBeInTheDocument();
    });

    expect(screen.getByText('Not authenticated')).toBeInTheDocument();
  });

  it('should display premium features list', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        status: 'active',
        subscription_tier: 'premium',
      }),
    } as Response);

    render(
      <BrowserRouter>
        <WelcomePremiumPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Welcome to Premium!')).toBeInTheDocument();
    });

    expect(screen.getByText('Track up to 50 girls')).toBeInTheDocument();
    expect(screen.getByText('Advanced analytics & insights')).toBeInTheDocument();
    expect(screen.getByText('Data export (CSV)')).toBeInTheDocument();
    expect(screen.getByText('Comparison charts')).toBeInTheDocument();
    expect(screen.getByText('Leaderboards access')).toBeInTheDocument();
    expect(screen.getByText('Share features')).toBeInTheDocument();
  });

  it('should display next steps guide', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        status: 'active',
        subscription_tier: 'premium',
      }),
    } as Response);

    render(
      <BrowserRouter>
        <WelcomePremiumPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("What's Next?")).toBeInTheDocument();
    });

    expect(screen.getByText(/Explore your dashboard/)).toBeInTheDocument();
    expect(screen.getByText(/Add more girls and data entries/)).toBeInTheDocument();
    expect(screen.getByText(/Check out the leaderboards/)).toBeInTheDocument();
    expect(screen.getByText(/Export your data anytime/)).toBeInTheDocument();
  });

  it('should navigate to dashboard on continue click', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        status: 'active',
        subscription_tier: 'premium',
      }),
    } as Response);

    render(
      <BrowserRouter>
        <WelcomePremiumPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Welcome to Premium!')).toBeInTheDocument();
    });

    const continueButton = screen.getByRole('button', { name: /Go to Dashboard/ });
    fireEvent.click(continueButton);

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('should retry verification on retry button click', async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Verification failed',
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          status: 'active',
          subscription_tier: 'premium',
        }),
      } as Response);

    render(
      <BrowserRouter>
        <WelcomePremiumPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Verification Issue')).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: /Retry Verification/ });
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Welcome to Premium!')).toBeInTheDocument();
    });
  });

  it('should call verify-subscription endpoint with correct params', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        status: 'active',
        subscription_tier: 'premium',
      }),
    } as Response);

    render(
      <BrowserRouter>
        <WelcomePremiumPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/verify-subscription?session_id=test-session-id'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });
});
