import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Step4Page } from './Step4Page';
import * as PersistenceService from '../../services/onboarding/persistence.service';
import { supabase } from '../../lib/supabase/client';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../services/onboarding/persistence.service', () => ({
  PersistenceService: {
    getLocalGirlData: vi.fn(),
    getLocalEntryData: vi.fn(),
    clearLocalData: vi.fn(),
  },
}));

vi.mock('../../lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
    },
  },
}));

global.fetch = vi.fn();

describe('Step4Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null,
    } as any);

    vi.spyOn(PersistenceService.PersistenceService, 'getLocalGirlData').mockReturnValue({
      name: 'Test Girl',
      age: 25,
      rating: 7.5,
    });

    vi.spyOn(PersistenceService.PersistenceService, 'getLocalEntryData').mockReturnValue({
      date: '2025-10-09',
      amount_spent: 100,
      duration_minutes: 60,
      number_of_nuts: 2,
    });
  });

  it('should render subscription tiers', async () => {
    render(
      <BrowserRouter>
        <Step4Page />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Step 4 of 4')).toBeInTheDocument();
    });

    expect(screen.getByText('Choose Your Plan')).toBeInTheDocument();
    expect(screen.getAllByText('Free').length).toBeGreaterThan(0);
    expect(screen.getByText('Premium')).toBeInTheDocument();
    expect(screen.getByText('VIP')).toBeInTheDocument();
  });

  it('should display CPN calculation', async () => {
    render(
      <BrowserRouter>
        <Step4Page />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Your First CPN Calculation:')).toBeInTheDocument();
    });

    expect(screen.getByText('$50.00')).toBeInTheDocument();
    expect(screen.getByText(/Cost per nut with Test Girl/)).toBeInTheDocument();
  });

  it('should redirect to step-3 if not authenticated', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as any);

    render(
      <BrowserRouter>
        <Step4Page />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/step-3');
    });
  });

  it('should redirect to step-1 if no girl data exists', async () => {
    vi.spyOn(PersistenceService.PersistenceService, 'getLocalGirlData').mockReturnValue(null);

    render(
      <BrowserRouter>
        <Step4Page />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/step-1');
    });
  });

  it('should redirect to step-2 if no entry data exists', async () => {
    vi.spyOn(PersistenceService.PersistenceService, 'getLocalEntryData').mockReturnValue(null);

    render(
      <BrowserRouter>
        <Step4Page />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/step-2');
    });
  });

  it('should show recommended badge on Premium tier', async () => {
    render(
      <BrowserRouter>
        <Step4Page />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Step 4 of 4')).toBeInTheDocument();
    });

    expect(screen.getByText('RECOMMENDED')).toBeInTheDocument();
  });

  it('should handle free tier selection', async () => {
    render(
      <BrowserRouter>
        <Step4Page />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Step 4 of 4')).toBeInTheDocument();
    });

    const freeButton = screen.getByRole('button', { name: /Continue with Free/ });
    fireEvent.click(freeButton);

    await waitFor(() => {
      expect(PersistenceService.PersistenceService.clearLocalData).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('should handle premium subscription', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          access_token: 'test-token',
          user: { id: 'test-user-id' },
        },
      },
      error: null,
    } as any);

    vi.mocked(global.fetch).mockResolvedValue({
      json: async () => ({ url: 'https://checkout.stripe.com/test' }),
    } as Response);

    delete (window as any).location;
    (window as any).location = { href: '' };

    render(
      <BrowserRouter>
        <Step4Page />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Step 4 of 4')).toBeInTheDocument();
    });

    const premiumButton = screen.getByRole('button', { name: /Subscribe to Premium/ });
    fireEvent.click(premiumButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/stripe-checkout'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          }),
          body: expect.stringContaining('price_1SBdEy4N2PMxx1mWPFLurfxX'),
        })
      );
    });

    await waitFor(() => {
      expect(PersistenceService.PersistenceService.clearLocalData).toHaveBeenCalled();
    });
  });

  it('should show progress bar at 100%', async () => {
    render(
      <BrowserRouter>
        <Step4Page />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Step 4 of 4')).toBeInTheDocument();
    });

    const progressBar = document.querySelector('.bg-cpn-yellow');
    expect(progressBar).toHaveStyle({ width: '100%' });
  });

  it('should display all tier features', async () => {
    render(
      <BrowserRouter>
        <Step4Page />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Step 4 of 4')).toBeInTheDocument();
    });

    expect(screen.getByText('Track up to 5 girls')).toBeInTheDocument();
    expect(screen.getByText('Track up to 50 girls')).toBeInTheDocument();
    expect(screen.getByText('Unlimited girls')).toBeInTheDocument();
    expect(screen.getByText('Advanced analytics')).toBeInTheDocument();
    expect(screen.getByText('API access')).toBeInTheDocument();
  });

  it('should handle checkout error', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          access_token: 'test-token',
          user: { id: 'test-user-id' },
        },
      },
      error: null,
    } as any);

    vi.mocked(global.fetch).mockResolvedValue({
      json: async () => ({ error: 'Checkout failed' }),
    } as Response);

    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(
      <BrowserRouter>
        <Step4Page />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Step 4 of 4')).toBeInTheDocument();
    });

    const premiumButton = screen.getByRole('button', { name: /Subscribe to Premium/ });
    fireEvent.click(premiumButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Failed to start checkout. Please try again.');
    });

    alertSpy.mockRestore();
  });
});
