import { Router } from 'express';
import { readLanguages, readTranslations } from '../store.js';
import type { LocaleBundle } from '../types';

const router = Router();

function buildLocaleBundle(langCode: string, fallbackCode: string): LocaleBundle {
  const translations = readTranslations();
  const bundle: LocaleBundle = {};

  for (const entry of translations) {
    const value = entry.translations[langCode]?.trim()
      ? entry.translations[langCode]
      : entry.translations[fallbackCode] || '';

    const parts = entry.key.split('.');
    let current: LocaleBundle | string = bundle;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (typeof current === 'object') {
        if (!current[part] || typeof current[part] === 'string') {
          current[part] = {};
        }
        current = current[part] as LocaleBundle;
      }
    }

    if (typeof current === 'object') {
      current[parts[parts.length - 1]] = value;
    }
  }

  return bundle;
}

function buildFlatBundle(langCode: string, fallbackCode: string): Record<string, string> {
  const translations = readTranslations();
  const bundle: Record<string, string> = {};

  for (const entry of translations) {
    const value = entry.translations[langCode]?.trim()
      ? entry.translations[langCode]
      : entry.translations[fallbackCode] || '';
    bundle[entry.key] = value;
  }

  return bundle;
}

router.get('/:lang', (req, res) => {
  const { lang } = req.params;
  const { format = 'nested', fallback } = req.query;

  const languages = readLanguages();
  const defaultLang = languages.find((l) => l.isDefault);
  const fallbackCode = typeof fallback === 'string' ? fallback : defaultLang?.code || 'zh-CN';

  const targetLang = languages.find((l) => l.code === lang);
  if (!targetLang) {
    return res.status(404).json({ error: 'Language not found' });
  }

  const bundle = format === 'flat'
    ? buildFlatBundle(lang, fallbackCode)
    : buildLocaleBundle(lang, fallbackCode);

  res.json({
    lang,
    fallbackLang: fallbackCode,
    bundle,
  });
});

router.get('/:lang/diff', (req, res) => {
  const { lang } = req.params;

  const languages = readLanguages();
  const defaultLang = languages.find((l) => l.isDefault);
  if (!defaultLang) {
    return res.status(500).json({ error: 'No default language configured' });
  }

  if (lang === defaultLang.code) {
    return res.json({
      lang,
      baseLang: defaultLang.code,
      diff: {},
    });
  }

  const translations = readTranslations();
  const diff: Record<string, string> = {};

  for (const entry of translations) {
    const targetValue = entry.translations[lang];
    const defaultValue = entry.translations[defaultLang.code];

    if (targetValue && targetValue.trim() !== '' && targetValue !== defaultValue) {
      diff[entry.key] = targetValue;
    }
  }

  res.json({
    lang,
    baseLang: defaultLang.code,
    diff,
  });
});

export default router;
