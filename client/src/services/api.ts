import type {
  LanguageWithProgress,
  Language,
  TranslationEntry,
  LocaleBundleResponse,
  ImportResult,
} from '../types';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

export const languagesApi = {
  getAll: () => request<LanguageWithProgress[]>('/languages'),
  getDefault: () => request<Language | null>('/languages/default'),
  create: (data: Partial<Language>) =>
    request<LanguageWithProgress>('/languages', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (code: string, data: Partial<Language>) =>
    request<LanguageWithProgress>(`/languages/${code}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  remove: (code: string) =>
    request<{ success: boolean }>(`/languages/${code}`, { method: 'DELETE' }),
};

export const translationsApi = {
  getAll: (params?: {
    namespace?: string;
    lang?: string;
    status?: 'translated' | 'untranslated';
    search?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.namespace) query.set('namespace', params.namespace);
    if (params?.lang) query.set('lang', params.lang);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return request<TranslationEntry[]>(`/translations${qs ? `?${qs}` : ''}`);
  },
  getNamespaces: () => request<string[]>('/translations/namespaces'),
  get: (key: string) => request<TranslationEntry>(`/translations/${key}`),
  create: (data: Partial<TranslationEntry>) =>
    request<TranslationEntry>('/translations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (key: string, data: Partial<TranslationEntry>) =>
    request<TranslationEntry>(`/translations/${key}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  translate: (key: string, lang: string, value: string) =>
    request<TranslationEntry>(`/translations/${key}/translate`, {
      method: 'PATCH',
      body: JSON.stringify({ lang, value }),
    }),
  remove: (key: string) =>
    request<{ success: boolean }>(`/translations/${key}`, { method: 'DELETE' }),
};

export const localeApi = {
  getBundle: (lang: string, format: 'nested' | 'flat' = 'nested', fallback?: string) => {
    const query = new URLSearchParams();
    query.set('format', format);
    if (fallback) query.set('fallback', fallback);
    return request<LocaleBundleResponse>(`/locale/${lang}?${query.toString()}`);
  },
  getDiff: (lang: string) =>
    request<{ lang: string; baseLang: string; diff: Record<string, string> }>(
      `/locale/${lang}/diff`
    ),
};

export const ioApi = {
  export: (lang: string, format: 'nested' | 'flat' = 'nested', namespace?: string) => {
    const query = new URLSearchParams();
    query.set('format', format);
    if (namespace) query.set('namespace', namespace);
    return `${API_BASE}/io/export/${lang}?${query.toString()}`;
  },
  import: (lang: string, file: File, merge = true) => {
    const formData = new FormData();
    formData.append('file', file);
    const query = new URLSearchParams();
    query.set('merge', String(merge));
    return fetch(`${API_BASE}/io/import/${lang}?${query.toString()}`, {
      method: 'POST',
      body: formData,
    }).then((res) => {
      if (!res.ok) throw new Error('Import failed');
      return res.json() as Promise<ImportResult>;
    });
  },
};
