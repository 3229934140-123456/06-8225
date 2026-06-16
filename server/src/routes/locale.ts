import { Router } from 'express';
import { readLanguages, readTranslations, readVersions } from '../store.js';
import type { LocaleBundle } from '../types';

const router = Router();

function getPublishedSnapshot(langCode: string): Record<string, string> | null {
  const versions = readVersions();
  const published = versions
    .filter((v) => v.lang === langCode && v.publishedAt)
    .sort((a, b) => new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime())[0];
  
  return published ? published.snapshot : null;
}

function getEffectiveFlatMap(langCode: string): Record<string, string> {
  const snapshot = getPublishedSnapshot(langCode);
  if (snapshot) {
    return snapshot;
  }
  const translations = readTranslations();
  const map: Record<string, string> = {};
  for (const entry of translations) {
    const v = entry.translations[langCode];
    if (v && v.trim()) map[entry.key] = v;
  }
  return map;
}

function buildLocaleBundle(langCode: string, fallbackCode: string): LocaleBundle {
  const targetMap = getEffectiveFlatMap(langCode);
  const fallbackMap = langCode !== fallbackCode ? getEffectiveFlatMap(fallbackCode) : {};
  const bundle: LocaleBundle = {};

  const allKeys = new Set([...Object.keys(targetMap), ...Object.keys(fallbackMap)]);

  for (const key of allKeys) {
    const value = targetMap[key]?.trim() ? targetMap[key] : fallbackMap[key] || '';
    const parts = key.split('.');
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
  const targetMap = getEffectiveFlatMap(langCode);
  const fallbackMap = langCode !== fallbackCode ? getEffectiveFlatMap(fallbackCode) : {};
  const bundle: Record<string, string> = {};

  const allKeys = new Set([...Object.keys(targetMap), ...Object.keys(fallbackMap)]);

  for (const key of allKeys) {
    bundle[key] = targetMap[key]?.trim() ? targetMap[key] : fallbackMap[key] || '';
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

  const targetMap = getEffectiveFlatMap(lang);
  const defaultMap = getEffectiveFlatMap(defaultLang.code);
  const diff: Record<string, string> = {};

  const allKeys = new Set([...Object.keys(targetMap), ...Object.keys(defaultMap)]);

  for (const key of allKeys) {
    const targetValue = targetMap[key];
    const defaultValue = defaultMap[key];
    if (targetValue && targetValue.trim() !== '' && targetValue !== defaultValue) {
      diff[key] = targetValue;
    }
  }

  res.json({
    lang,
    baseLang: defaultLang.code,
    diff,
  });
});

export default router;
