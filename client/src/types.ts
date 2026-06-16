export type TranslationStatus = 'unfilled' | 'filled' | 'completed';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  isDefault: boolean;
  isEnabled: boolean;
  createdAt: string;
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

export interface TranslationEntry {
  key: string;
  namespace: string;
  description?: string;
  translations: Record<string, string>;
  completed: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}

export interface LocaleBundle {
  [key: string]: string | LocaleBundle;
}

export interface LocaleBundleResponse {
  lang: string;
  fallbackLang: string;
  bundle: LocaleBundle;
}

export interface LocaleDiffResponse {
  lang: string;
  baseLang: string;
  diff: Record<string, string>;
}

export interface ImportResult {
  added: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export type KeySource = 'diff' | 'fallback' | 'default';

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

export interface ContentLanguageProgress {
  lang: string;
  filled: boolean;
  missingFields: string[];
}

export interface Content {
  id: string;
  typeId: string;
  typeName?: string;
  status: ContentStatus;
  fields: Record<string, ContentLocalizedField>;
  author: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  languageProgress?: ContentLanguageProgress[];
}

export interface VersionChange {
  key: string;
  oldValue: string;
  newValue: string;
  changedAt: string;
  changedBy: string;
}

export interface LocaleBundleVersion {
  id: string;
  version: string;
  lang: string;
  description?: string;
  snapshot: Record<string, string>;
  changes: VersionChange[];
  publishedAt?: string;
  publishedBy?: string;
  isCurrent: boolean;
  createdAt: string;
  createdBy: string;
}
