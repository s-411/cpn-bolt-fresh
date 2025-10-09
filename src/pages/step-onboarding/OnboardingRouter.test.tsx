import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { OnboardingRouter } from './OnboardingRouter';
import * as PersistenceService from '../../services/onboarding/persistence.service';
import { supabase } from '../../lib/supabase/client';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/onboarding-flow' }),
  };
});

vi.mock('../../services/onboarding/persistence.service', () => ({
  PersistenceService: {
    getLocalGirlData: vi.fn(),
    getLocalEntryData: vi.fn(),
    getCurrentStep: vi.fn(),
  },
}));

vi.mock('../../lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
  },
}));

describe('OnboardingRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should redirect authenticated users to dashboard', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null,
    } as any);

    render(
      <BrowserRouter>
        <OnboardingRouter />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('should redirect to step-1 if no girl data exists', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as any);

    vi.spyOn(PersistenceService.PersistenceService, 'getLocalGirlData').mockReturnValue(null);
    vi.spyOn(PersistenceService.PersistenceService, 'getLocalEntryData').mockReturnValue(null);
    vi.spyOn(PersistenceService.PersistenceService, 'getCurrentStep').mockReturnValue(1);

    render(
      <BrowserRouter>
        <OnboardingRouter />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/step-1', { replace: true });
    });
  });

  it('should redirect to step-2 if girl data exists but no entry data', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as any);

    vi.spyOn(PersistenceService.PersistenceService, 'getLocalGirlData').mockReturnValue({
      name: 'Test Girl',
      age: 25,
      rating: 7.5,
    });
    vi.spyOn(PersistenceService.PersistenceService, 'getLocalEntryData').mockReturnValue(null);
    vi.spyOn(PersistenceService.PersistenceService, 'getCurrentStep').mockReturnValue(1);

    render(
      <BrowserRouter>
        <OnboardingRouter />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/step-2', { replace: true });
    });
  });

  it('should redirect to step-3 if on step 2 with data', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
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
    vi.spyOn(PersistenceService.PersistenceService, 'getCurrentStep').mockReturnValue(2);

    render(
      <BrowserRouter>
        <OnboardingRouter />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/step-3', { replace: true });
    });
  });

  it('should redirect to step-4 if on step 3 with data', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
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
    vi.spyOn(PersistenceService.PersistenceService, 'getCurrentStep').mockReturnValue(3);

    render(
      <BrowserRouter>
        <OnboardingRouter />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/step-4', { replace: true });
    });
  });

  it('should show loading state initially', () => {
    vi.mocked(supabase.auth.getUser).mockImplementation(
      () =>
        new Promise(() => {
        })
    );

    render(
      <BrowserRouter>
        <OnboardingRouter />
      </BrowserRouter>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should handle errors gracefully and redirect to step-1', async () => {
    vi.mocked(supabase.auth.getUser).mockRejectedValue(new Error('Auth error'));

    render(
      <BrowserRouter>
        <OnboardingRouter />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/step-1', { replace: true });
    });
  });

  it('should reset to step-1 if step is beyond 4', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
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
    vi.spyOn(PersistenceService.PersistenceService, 'getCurrentStep').mockReturnValue(5);

    render(
      <BrowserRouter>
        <OnboardingRouter />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/step-1', { replace: true });
    });
  });
});
