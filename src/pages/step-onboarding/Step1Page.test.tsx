import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Step1Page } from './Step1Page';
import * as PersistenceService from '../../services/onboarding/persistence.service';
import * as ValidationService from '../../services/onboarding/validation.service';

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
    initializeSession: vi.fn(),
    getLocalGirlData: vi.fn(),
    saveGirl: vi.fn(),
    updateCurrentStep: vi.fn(),
  },
}));

describe('Step1Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(PersistenceService.PersistenceService, 'initializeSession').mockResolvedValue({
      success: true,
      data: {
        id: 'test-id',
        session_token: 'test-token',
        current_step: 1,
      } as any,
    });
    vi.spyOn(PersistenceService.PersistenceService, 'getLocalGirlData').mockReturnValue(null);
  });

  it('should render the form', async () => {
    render(
      <BrowserRouter>
        <Step1Page />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Age/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Rating/)).toBeInTheDocument();
  });

  it('should display validation errors for empty name', async () => {
    render(
      <BrowserRouter>
        <Step1Page />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/Name/) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: '' } });

    const submitButton = screen.getByRole('button', { name: /Continue/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
  });

  it('should update form fields', async () => {
    render(
      <BrowserRouter>
        <Step1Page />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/Name/) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Test Girl' } });

    expect(nameInput.value).toBe('Test Girl');
  });

  it('should submit form with valid data', async () => {
    vi.spyOn(PersistenceService.PersistenceService, 'saveGirl').mockResolvedValue({
      success: true,
    });
    vi.spyOn(PersistenceService.PersistenceService, 'updateCurrentStep').mockResolvedValue({
      success: true,
    });

    render(
      <BrowserRouter>
        <Step1Page />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/Name/);
    fireEvent.change(nameInput, { target: { value: 'Test Girl' } });

    const ageInput = screen.getByLabelText(/Age/);
    fireEvent.change(ageInput, { target: { value: '25' } });

    const submitButton = screen.getByRole('button', { name: /Continue/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(PersistenceService.PersistenceService.saveGirl).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/step-2');
    });
  });

  it('should load existing data from local storage', async () => {
    const existingData = {
      name: 'Existing Girl',
      age: 28,
      rating: 8.5,
    };

    vi.spyOn(PersistenceService.PersistenceService, 'getLocalGirlData').mockReturnValue(existingData);

    render(
      <BrowserRouter>
        <Step1Page />
      </BrowserRouter>
    );

    await waitFor(() => {
      const nameInput = screen.getByLabelText(/Name/) as HTMLInputElement;
      expect(nameInput.value).toBe('Existing Girl');
    });
  });

  it('should show progress bar at 25%', async () => {
    render(
      <BrowserRouter>
        <Step1Page />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
    });

    const progressBar = document.querySelector('.bg-cpn-yellow');
    expect(progressBar).toHaveStyle({ width: '25%' });
  });
});
