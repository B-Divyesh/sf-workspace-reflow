export type Theme = 'light' | 'dark';

export interface ReflowPreferences {
  fontSize: 20 | 24 | 28;
  measure: 42 | 56 | 70;
  theme: Theme;
}

export interface SiteRule {
  origin: string;
  selector: string;
  label: string;
  preferences: ReflowPreferences;
  updatedAt: string;
}

export const DEFAULT_PREFERENCES: ReflowPreferences = {
  fontSize: 24,
  measure: 56,
  theme: 'light'
};

export const RULES_KEY = 'workspaceReflow.rules';
export const PREFERENCES_KEY = 'workspaceReflow.preferences';
