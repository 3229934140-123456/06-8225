import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { localeApi, languagesApi } from '../services/api';
import type { Language, LanguageWithProgress, KeySource } from '../types';

interface I18nContextType {
  locale: string;
  defaultLocale: string;
  messages: Record<string, string>;
  languages: Language[];
  isLoading: boolean;
  setLocale: (lang: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  getSource: (key: string) => KeySource;
  isFallback: (key: string) => boolean;
}

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEY = 'i18n_locale';

function detectBrowserLanguage(supportedLanguages: Language[]): string {
  const browserLang = navigator.language || 'zh-CN';
  const matched = supportedLanguages.find(
    (l) => l.code === browserLang || l.code.startsWith(browserLang.split('-')[0])
  );
  return matched?.code || 'zh-CN';
}

function formatMessage(message: string, params?: Record<string, string | number>): string {
  if (!params) return message;
  return message.replace(/\{(\w+)\}/g, (_, key) => {
    return params[key] !== undefined ? String(params[key]) : `{${key}}`;
  });
}

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<string>('zh-CN');
  const [defaultLocale, setDefaultLocale] = useState<string>('zh-CN');
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [keySources, setKeySources] = useState<Record<string, KeySource>>({});
  const [languages, setLanguages] = useState<Language[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadBundle = useCallback(async (lang: string, defaultLang: string) => {
    setIsLoading(true);
    try {
      const baseRes = await localeApi.getBundle(defaultLang, 'flat');
      const baseMessages: Record<string, string> = {};
      const sources: Record<string, KeySource> = {};

      for (const [k, v] of Object.entries(baseRes.bundle as Record<string, any>)) {
        baseMessages[k] = String(v);
        sources[k] = 'default';
      }

      if (lang === defaultLang) {
        setMessages(baseMessages);
        setKeySources(sources);
      } else {
        const diffRes = await localeApi.getDiff(lang);

        const merged = { ...baseMessages };
        const mergedSources = { ...sources };

        for (const [k] of Object.entries(merged)) {
          mergedSources[k] = 'fallback';
        }

        for (const [k, v] of Object.entries(diffRes.diff)) {
          merged[k] = v;
          mergedSources[k] = 'diff';
        }

        setMessages(merged);
        setKeySources(mergedSources);
      }
    } catch (error) {
      console.error('Failed to load locale bundle:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const [langs, defaultLang] = await Promise.all([
          languagesApi.getAll(),
          languagesApi.getDefault(),
        ]);

        const enabledLangs = langs.filter((l: LanguageWithProgress) => l.isEnabled);
        setLanguages(enabledLangs);

        const defLocale = defaultLang?.code || 'zh-CN';
        setDefaultLocale(defLocale);

        const savedLocale = localStorage.getItem(STORAGE_KEY);
        let initialLocale = defLocale;

        if (savedLocale) {
          const isStillValid = enabledLangs.some((l: Language) => l.code === savedLocale);
          if (isStillValid) {
            initialLocale = savedLocale;
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        } else {
          const browserLang = detectBrowserLanguage(enabledLangs);
          if (enabledLangs.some((l: Language) => l.code === browserLang)) {
            initialLocale = browserLang;
          }
        }

        setLocaleState(initialLocale);
        await loadBundle(initialLocale, defLocale);
      } catch (error) {
        console.error('Failed to initialize i18n:', error);
        setIsLoading(false);
      }
    };

    init();
  }, [loadBundle]);

  const setLocale = useCallback(
    async (lang: string) => {
      if (lang === locale) return;
      const isValid = languages.some((l) => l.code === lang && l.isEnabled);
      if (!isValid) {
        lang = defaultLocale;
      }
      localStorage.setItem(STORAGE_KEY, lang);
      setLocaleState(lang);
      await loadBundle(lang, defaultLocale);
    },
    [locale, defaultLocale, loadBundle, languages]
  );

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const message = messages[key];
      if (message !== undefined && message !== '') {
        return formatMessage(message, params);
      }
      return formatMessage(key, params);
    },
    [messages]
  );

  const getSource = useCallback(
    (key: string): KeySource => {
      return keySources[key] || 'fallback';
    },
    [keySources]
  );

  const isFallback = useCallback(
    (key: string): boolean => {
      return keySources[key] === 'fallback';
    },
    [keySources]
  );

  return (
    <I18nContext.Provider
      value={{
        locale,
        defaultLocale,
        messages,
        languages,
        isLoading,
        setLocale,
        t,
        getSource,
        isFallback,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
