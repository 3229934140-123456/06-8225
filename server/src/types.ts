export interface Language {
  code: string;
  name: string;
  nativeName: string;
  isDefault: boolean;
  isEnabled: boolean;
  createdAt: string;
}

export interface TranslationEntry {
  key: string;
  namespace: string;
  description?: string;
  translations: Record<string, string>;
  completed: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}

export interface TranslationProgress {
  total: number;
  translated: number;
  completed: number;
  percentage: number;
  completedPercentage: number;
}

export interface LanguageWithProgress extends Language {
  progress: TranslationProgress;
}

export interface LocaleBundle {
  [key: string]: string | LocaleBundle;
}

export interface ImportResult {
  added: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export type TranslationStatus = 'unfilled' | 'filled' | 'completed';
