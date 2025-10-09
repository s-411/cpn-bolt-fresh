import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Step3Page } from './Step3Page';
import * as PersistenceService from '../../services/onboarding/persistence.service';
import * as MigrationService from '../../services/onboarding/migration.service';
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
    updateCurrentStep: vi.fn(),
  },
}));

vi.mock('../../services/onboarding/migration.service', () => ({
  MigrationService: {
    migrateSessionDataToUser: vi.fn(),
  },
}));

vi.mock('../../lib/supabase/client', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
    },
  },
}));

describe('Step3Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('should render the form', async () => {
    render(
      <BrowserRouter>
        <Step3Page />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Step 3 of 4')).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/)).toBeInTheDocument();
  });

  it('should display progress summary', async () => {
    render(
      <BrowserRouter>
        <Step3Page />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Your Progress So Far:')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Girl')).toBeInTheDocument();
    expect(screen.getByText('2025-10-09')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should redirect to step-1 if no girl data exists', async () => {
    vi.spyOn(PersistenceService.PersistenceService, 'getLocalGirlData').mockReturnValue(null);

    render(
      <BrowserRouter>
        <Step3Page />
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
        <Step3Page />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/step-2');
    });
  });

  it('should toggle password visibility', async () => {
    render(
      <BrowserRouter>
        <Step3Page />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Step 3 of 4')).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText(/Password/) as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    const toggleButton = screen.getByRole('button', { name: '' });
    fireEvent.click(toggleButton);

    expect(passwordInput.type).toBe('text');

    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('password');
  });

  it('should have proper input types and constraints', async () => {
    render(
      <BrowserRouter>
        <Step3Page />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Step 3 of 4')).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/Email/) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/Password/) as HTMLInputElement;

    expect(emailInput.getAttribute('type')).toBe('email');
    expect(passwordInput.getAttribute('type')).toBe('password');
    expect(emailInput.placeholder).toBe('your@email.com');
    expect(passwordInput.placeholder).toBe('Min 8 characters');
  });

  it('should display validation errors for short password', async () => {
    render(
      <BrowserRouter>
        <Step3Page />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Step 3 of 4')).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/Email/);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const passwordInput = screen.getByLabelText(/Password/);
    fireEvent.change(passwordInput, { target: { value: 'short' } });

    const submitButton = screen.getByRole('button', { name: /Create Account/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    });
  });

  it('should navigate back to step 2 when back button is clicked', async () => {
    render(
      <BrowserRouter>
        <Step3Page />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Step 3 of 4')).toBeInTheDocument();
    });

    const backButton = screen.getByRole('button', { name: /Back/ });
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/step-2');
  });

  it('should create account and migrate data successfully', async () => {
    const mockUser = { id: 'test-user-id', email: 'test@example.com' };

    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: { user: mockUser, session: null },
      error: null,
    } as any);

    vi.spyOn(MigrationService.MigrationService, 'migrateSessionDataToUser').mockResolvedValue({
      success: true,
      userId: mockUser.id,
      girlId: 'test-girl-id',
    });

    vi.spyOn(PersistenceService.PersistenceService, 'updateCurrentStep').mockResolvedValue({
      success: true,
    });

    render(
      <BrowserRouter>
        <Step3Page />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Step 3 of 4')).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/Email/);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const passwordInput = screen.getByLabelText(/Password/);
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    const submitButton = screen.getByRole('button', { name: /Create Account/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    await waitFor(() => {
      expect(MigrationService.MigrationService.migrateSessionDataToUser).toHaveBeenCalledWith(
        mockUser.id
      );
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/step-4');
    });
  });

  it('should show progress bar at 75%', async () => {
    render(
      <BrowserRouter>
        <Step3Page />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Step 3 of 4')).toBeInTheDocument();
    });

    const progressBar = document.querySelector('.bg-cpn-yellow');
    expect(progressBar).toHaveStyle({ width: '75%' });
  });

  it('should display auth error message', async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Email already in use', name: 'AuthError', status: 400 },
    } as any);

    render(
      <BrowserRouter>
        <Step3Page />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Step 3 of 4')).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/Email/);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const passwordInput = screen.getByLabelText(/Password/);
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    const submitButton = screen.getByRole('button', { name: /Create Account/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email already in use')).toBeInTheDocument();
    });
  });
});
