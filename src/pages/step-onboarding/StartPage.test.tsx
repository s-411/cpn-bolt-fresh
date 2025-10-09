import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { StartPage } from './StartPage';
import { supabase } from '../../lib/supabase/client';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
  },
}));

describe('StartPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as any);
  });

  it('should render the start page', async () => {
    render(
      <BrowserRouter>
        <StartPage />
      </BrowserRouter>
    );

    expect(screen.getByText('CPN')).toBeInTheDocument();
    expect(screen.getByText('Cost Per Nut Calculator')).toBeInTheDocument();
    expect(
      screen.getByText('Welcome to Your Data-Driven Dating Journey')
    ).toBeInTheDocument();
  });

  it('should display features section', () => {
    render(
      <BrowserRouter>
        <StartPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Calculate CPN')).toBeInTheDocument();
    expect(screen.getByText('Track Progress')).toBeInTheDocument();
    expect(screen.getByText('Compare Data')).toBeInTheDocument();
  });

  it('should display onboarding steps', () => {
    render(
      <BrowserRouter>
        <StartPage />
      </BrowserRouter>
    );

    expect(screen.getByText("What You'll Do:")).toBeInTheDocument();
    expect(screen.getByText(/Add a girl profile/)).toBeInTheDocument();
    expect(screen.getByText(/Enter your first data point/)).toBeInTheDocument();
    expect(screen.getByText(/Create a free account/)).toBeInTheDocument();
    expect(screen.getByText(/Choose a plan/)).toBeInTheDocument();
  });

  it('should navigate to step-1 when Get Started is clicked', async () => {
    render(
      <BrowserRouter>
        <StartPage />
      </BrowserRouter>
    );

    const startButton = screen.getByRole('button', { name: /Get Started/ });
    fireEvent.click(startButton);

    expect(mockNavigate).toHaveBeenCalledWith('/step-1');
  });

  it('should navigate to signin when Sign In is clicked', async () => {
    render(
      <BrowserRouter>
        <StartPage />
      </BrowserRouter>
    );

    const signInButton = screen.getByRole('button', { name: /Sign In/ });
    fireEvent.click(signInButton);

    expect(mockNavigate).toHaveBeenCalledWith('/signin');
  });

  it('should redirect authenticated users to dashboard', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null,
    } as any);

    render(
      <BrowserRouter>
        <StartPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('should display call to action', () => {
    render(
      <BrowserRouter>
        <StartPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Get Started')).toBeInTheDocument();
    expect(
      screen.getByText('No credit card required to start. Takes less than 2 minutes.')
    ).toBeInTheDocument();
  });

  it('should display sign in prompt', () => {
    render(
      <BrowserRouter>
        <StartPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Already have an account?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/ })).toBeInTheDocument();
  });
});
