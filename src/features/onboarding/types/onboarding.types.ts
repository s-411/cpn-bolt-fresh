export interface OnboardingSession {
  id: string;
  user_id: string;
  session_token: string;
  current_step: number;
  is_completed: boolean;
  is_anonymous: boolean;
  converted_at: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

export interface OnboardingGirl {
  id: string;
  session_id: string;
  user_id: string;
  name: string;
  age: number;
  ethnicity?: string;
  hair_color?: string;
  location_city?: string;
  location_country?: string;
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface OnboardingDataEntry {
  id: string;
  session_id: string;
  girl_id: string;
  date: string;
  amount_spent: number;
  duration_minutes: number;
  number_of_nuts: number;
  created_at: string;
  updated_at: string;
}

export interface OnboardingFormData {
  girl: {
    name: string;
    age: number;
    ethnicity?: string;
    hair_color?: string;
    location_city?: string;
    location_country?: string;
    rating: number;
  };
  dataEntry: {
    date: string;
    amount_spent: number;
    duration_minutes: number;
    number_of_nuts: number;
  };
}

export interface OnboardingStepStatus {
  currentStep: number;
  completedSteps: number[];
  sessionId: string | null;
  girlId: string | null;
}
