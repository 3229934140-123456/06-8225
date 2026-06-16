import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { localeApi, languagesApi } from '../services/api';
import type { Language, LanguageWithProgress } from '../types';

interface I18nContextType {
  locale: string;
  defaultLocale: string;
  messages: Record<string, string>;
  languages: Language[];
  isLoading: boolean;
  setLocale: (lang: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
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

function flattenNested(obj: Record<string, any>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of Object.keys(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      Object.assign(result, flattenNested(obj[key], newKey));
    } else {
      result[newKey] = String(obj[key]);
    }
  }
  return result;
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
  const [defaultMessages, setDefaultMessages] = useState<Record<string, string>>({});
  const [languages, setLanguages] = useState<Language[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadBundle = useCallback(async (lang: string, defaultLang: string) => {
    setIsLoading(true);
    try {
      const [targetRes, defaultRes] = await Promise.all([
        localeApi.getBundle(lang, 'flat', defaultLang),
        defaultLang !== lang ? localeApi.getBundle(defaultLang, 'flat') : Promise.resolve(null),
      ]);

      const targetMessages = flattenNested(targetRes.bundle as Record<string, any>);
      setMessages(targetMessages);

      if (defaultRes) {
        setDefaultMessages(flattenNested(defaultRes.bundle as Record<string, any>));
      } else {
        setDefaultMessages(targetMessages);
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
        const browserLang = detectBrowserLanguage(enabledLangs);
        const initialLocale = savedLocale || browserLang || defLocale;

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
      localStorage.setItem(STORAGE_KEY, lang);
      setLocaleState(lang);
      await loadBundle(lang, defaultLocale);
    },
    [locale, defaultLocale, loadBundle]
  );

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const message = messages[key];
      if (message !== undefined && message !== '') {
        return formatMessage(message, params);
      }
      const fallback = defaultMessages[key] || key;
      return formatMessage(fallback, params);
    },
    [messages, defaultMessages]
  );

  const isFallback = useCallback(
    (key: string): boolean => {
      return !messages[key] || messages[key] === '';
    },
    [messages]
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
