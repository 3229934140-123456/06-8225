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

export type FieldType = 'text' | 'richtext' | 'image' | 'date' | 'number';

export interface ContentField {
  key: string;
  label: string;
  type: FieldType;
  translatable: boolean;
  required: boolean;
}

export interface ContentType {
  id: string;
  name: string;
  description?: string;
  fields: ContentField[];
  createdAt: string;
  updatedAt: string;
}

export type ContentStatus = 'draft' | 'review' | 'published';

export interface ContentLocalizedField {
  [langCode: string]: string;
}

export interface Content {
  id: string;
  typeId: string;
  status: ContentStatus;
  fields: Record<string, ContentLocalizedField>;
  author: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentLanguageProgress {
  lang: string;
  filled: boolean;
  missingFields: string[];
}

export interface LocaleBundleVersion {
  id: string;
  version: string;
  lang: string;
  description?: string;
  snapshot: Record<string, string>;
  changes: Array<{
    key: string;
    oldValue: string;
    newValue: string;
    changedAt: string;
    changedBy: string;
  }>;
  publishedAt?: string;
  publishedBy?: string;
  isCurrent: boolean;
  createdAt: string;
  createdBy: string;
}

export type KeySource = 'diff' | 'fallback' | 'default';
