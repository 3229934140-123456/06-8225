import { Router } from 'express';
import multer from 'multer';
import { readLanguages, readTranslations, writeTranslations } from '../store.js';
import type { TranslationEntry, ImportResult } from '../types';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

function flattenNested(obj: Record<string, any>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};

  for (const key of Object.keys(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(result, flattenNested(obj[key], newKey));
    } else {
      result[newKey] = String(obj[key]);
    }
  }

  return result;
}

router.get('/export/:lang', (req, res) => {
  const { lang } = req.params;
  const { format = 'nested', namespace } = req.query;

  const languages = readLanguages();
  const targetLang = languages.find((l) => l.code === lang);
  if (!targetLang) {
    return res.status(404).json({ error: 'Language not found' });
  }

  let translations = readTranslations();
  if (namespace) {
    translations = translations.filter((t) => t.namespace === String(namespace));
  }

  if (format === 'flat') {
    const flat: Record<string, string> = {};
    for (const t of translations) {
      flat[t.key] = t.translations[lang] || '';
    }
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${lang}.json"`);
    res.json(flat);
  } else {
    const nested: Record<string, any> = {};
    for (const t of translations) {
      const parts = t.key.split('.');
      let current = nested;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          current[parts[i]] = {};
        }
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = t.translations[lang] || '';
    }
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${lang}.json"`);
    res.json(nested);
  }
});

router.post('/import/:lang', upload.single('file'), (req, res) => {
  const { lang } = req.params;
  const { merge = 'true' } = req.query;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const languages = readLanguages();
  const targetLang = languages.find((l) => l.code === lang);
  if (!targetLang) {
    return res.status(404).json({ error: 'Language not found' });
  }

  let importedData: Record<string, any>;
  try {
    importedData = JSON.parse(file.buffer.toString('utf-8'));
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON file' });
  }

  const flatData = flattenNested(importedData);

  const translations = readTranslations();
  const result: ImportResult = {
    added: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  if (merge === 'false') {
    for (const t of translations) {
      delete t.translations[lang];
    }
  }

  for (const [key, value] of Object.entries(flatData)) {
    try {
      const existingIndex = translations.findIndex((t) => t.key === key);

      if (existingIndex === -1) {
        const newEntry: TranslationEntry = {
          key,
          namespace: 'imported',
          description: '',
          translations: { [lang]: value },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        translations.push(newEntry);
        result.added++;
      } else {
        translations[existingIndex].translations[lang] = value;
        translations[existingIndex].updatedAt = new Date().toISOString();
        result.updated++;
      }
    } catch (e) {
      result.errors.push(`Error processing key "${key}": ${e}`);
      result.skipped++;
    }
  }

  writeTranslations(translations);
  res.json(result);
});

export default router;
