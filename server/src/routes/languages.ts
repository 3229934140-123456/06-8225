import { Router } from 'express';
import { readLanguages, writeLanguages, readTranslations } from '../store.js';
import type { Language, LanguageWithProgress, TranslationProgress } from '../types';

const router = Router();

function calculateProgress(langCode: string): TranslationProgress {
  const translations = readTranslations();
  const total = translations.length;
  let translated = 0;

  for (const t of translations) {
    if (t.translations[langCode] && t.translations[langCode].trim() !== '') {
      translated++;
    }
  }

  return {
    total,
    translated,
    percentage: total === 0 ? 100 : Math.round((translated / total) * 100),
  };
}

router.get('/', (_req, res) => {
  const languages = readLanguages();
  const result: LanguageWithProgress[] = languages.map((lang) => ({
    ...lang,
    progress: calculateProgress(lang.code),
  }));
  res.json(result);
});

router.post('/', (req, res) => {
  const { code, name, nativeName, isDefault = false } = req.body;

  if (!code || !name || !nativeName) {
    return res.status(400).json({ error: 'code, name, nativeName are required' });
  }

  const languages = readLanguages();

  if (languages.some((l) => l.code === code)) {
    return res.status(409).json({ error: 'Language code already exists' });
  }

  if (isDefault) {
    languages.forEach((l) => (l.isDefault = false));
  }

  const newLanguage: Language = {
    code,
    name,
    nativeName,
    isDefault,
    isEnabled: true,
    createdAt: new Date().toISOString(),
  };

  languages.push(newLanguage);
  writeLanguages(languages);

  const translations = readTranslations();
  translations.forEach((t) => {
    if (!t.translations[code]) {
      t.translations[code] = '';
    }
  });

  res.status(201).json({
    ...newLanguage,
    progress: { total: translations.length, translated: 0, percentage: 0 },
  });
});

router.put('/:code', (req, res) => {
  const { code } = req.params;
  const { name, nativeName, isEnabled, isDefault } = req.body;

  const languages = readLanguages();
  const langIndex = languages.findIndex((l) => l.code === code);

  if (langIndex === -1) {
    return res.status(404).json({ error: 'Language not found' });
  }

  if (isDefault) {
    languages.forEach((l) => (l.isDefault = false));
  }

  if (name !== undefined) languages[langIndex].name = name;
  if (nativeName !== undefined) languages[langIndex].nativeName = nativeName;
  if (isEnabled !== undefined) languages[langIndex].isEnabled = isEnabled;
  if (isDefault !== undefined) languages[langIndex].isDefault = isDefault;

  writeLanguages(languages);

  res.json({
    ...languages[langIndex],
    progress: calculateProgress(code),
  });
});

router.delete('/:code', (req, res) => {
  const { code } = req.params;
  const languages = readLanguages();

  const lang = languages.find((l) => l.code === code);
  if (!lang) {
    return res.status(404).json({ error: 'Language not found' });
  }

  if (lang.isDefault) {
    return res.status(400).json({ error: 'Cannot delete default language' });
  }

  const filtered = languages.filter((l) => l.code !== code);
  writeLanguages(filtered);

  res.json({ success: true });
});

router.get('/default', (_req, res) => {
  const languages = readLanguages();
  const defaultLang = languages.find((l) => l.isDefault);
  res.json(defaultLang || null);
});

export default router;
