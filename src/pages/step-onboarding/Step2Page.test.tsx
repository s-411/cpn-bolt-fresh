import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Step2Page } from './Step2Page';
import * as PersistenceService from '../../services/onboarding/persistence.service';

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
    saveEntry: vi.fn(),
    updateCurrentStep: vi.fn(),
  },
}));

describe('Step2Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(PersistenceService.PersistenceService, 'getLocalGirlData').mockReturnValue({
      name: 'Test Girl',
      age: 25,
      rating: 7.5,
    });
    vi.spyOn(PersistenceService.PersistenceService, 'getLocalEntryData').mockReturnValue(null);
  });

  it('should render the form', async () => {
    render(
      <BrowserRouter>
        <Step2Page />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Step 2 of 4')).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/Date/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Amount Spent/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Duration/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Number of Nuts/)).toBeInTheDocument();
  });

  it('should display girl name from step 1', async () => {
    render(
      <BrowserRouter>
        <Step2Page />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Adding data for:/)).toBeInTheDocument();
      expect(screen.getByText('Test Girl')).toBeInTheDocument();
    });
  });

  it('should redirect to step-1 if no girl data exists', async () => {
    vi.spyOn(PersistenceService.PersistenceService, 'getLocalGirlData').mockReturnValue(null);

    render(
      <BrowserRouter>
        <Step2Page />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/step-1');
    });
  });

  it('should have proper input constraints', async () => {
    render(
      <BrowserRouter>
        <Step2Page />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Step 2 of 4')).toBeInTheDocument();
    });

    const dateInput = screen.getByLabelText(/Date/) as HTMLInputElement;
    const amountInput = screen.getByLabelText(/Amount Spent/) as HTMLInputElement;
    const durationInput = screen.getByLabelText(/Duration/) as HTMLInputElement;
    const nutsInput = screen.getByLabelText(/Number of Nuts/) as HTMLInputElement;

    expect(dateInput.getAttribute('type')).toBe('date');
    expect(amountInput.getAttribute('type')).toBe('number');
    expect(amountInput.getAttribute('min')).toBe('0');
    expect(durationInput.getAttribute('min')).toBe('1');
    expect(durationInput.getAttribute('max')).toBe('1440');
    expect(nutsInput.getAttribute('min')).toBe('0');
    expect(nutsInput.getAttribute('max')).toBe('99');
  });

  it('should navigate back to step 1 when back button is clicked', async () => {
    render(
      <BrowserRouter>
        <Step2Page />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Step 2 of 4')).toBeInTheDocument();
    });

    const backButton = screen.getByRole('button', { name: /Back/ });
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/step-1');
  });

  it('should submit form with valid data', async () => {
    vi.spyOn(PersistenceService.PersistenceService, 'saveEntry').mockResolvedValue({
      success: true,
    });
    vi.spyOn(PersistenceService.PersistenceService, 'updateCurrentStep').mockResolvedValue({
      success: true,
    });

    render(
      <BrowserRouter>
        <Step2Page />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Step 2 of 4')).toBeInTheDocument();
    });

    const amountInput = screen.getByLabelText(/Amount Spent/);
    fireEvent.change(amountInput, { target: { value: '100' } });

    const durationInput = screen.getByLabelText(/Duration/);
    fireEvent.change(durationInput, { target: { value: '60' } });

    const nutsInput = screen.getByLabelText(/Number of Nuts/);
    fireEvent.change(nutsInput, { target: { value: '2' } });

    const submitButton = screen.getByRole('button', { name: /Continue/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(PersistenceService.PersistenceService.saveEntry).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/step-3');
    });
  });

  it('should load existing entry data from local storage', async () => {
    const existingEntry = {
      date: '2025-10-01',
      amount_spent: 150,
      duration_minutes: 90,
      number_of_nuts: 3,
    };

    vi.spyOn(PersistenceService.PersistenceService, 'getLocalEntryData').mockReturnValue(
      existingEntry
    );

    render(
      <BrowserRouter>
        <Step2Page />
      </BrowserRouter>
    );

    await waitFor(() => {
      const amountInput = screen.getByLabelText(/Amount Spent/) as HTMLInputElement;
      expect(amountInput.value).toBe('150');
    });
  });

  it('should show progress bar at 50%', async () => {
    render(
      <BrowserRouter>
        <Step2Page />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Step 2 of 4')).toBeInTheDocument();
    });

    const progressBar = document.querySelector('.bg-cpn-yellow');
    expect(progressBar).toHaveStyle({ width: '50%' });
  });

  it('should display duration in hours and minutes', async () => {
    render(
      <BrowserRouter>
        <Step2Page />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Step 2 of 4')).toBeInTheDocument();
    });

    const durationInput = screen.getByLabelText(/Duration/);
    fireEvent.change(durationInput, { target: { value: '125' } });

    await waitFor(() => {
      expect(screen.getByText('2h 5m')).toBeInTheDocument();
    });
  });
});
