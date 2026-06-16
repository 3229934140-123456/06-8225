import { Router } from 'express';
import { readTranslations, writeTranslations } from '../store.js';
import type { TranslationEntry } from '../types';

const router = Router();

router.get('/', (req, res) => {
  const { namespace, lang, status, search } = req.query;
  let translations = readTranslations();

  if (namespace) {
    translations = translations.filter((t) => t.namespace === namespace);
  }

  if (search) {
    const searchLower = String(search).toLowerCase();
    translations = translations.filter(
      (t) =>
        t.key.toLowerCase().includes(searchLower) ||
        t.description?.toLowerCase().includes(searchLower) ||
        Object.values(t.translations).some((v) =>
          v.toLowerCase().includes(searchLower)
        )
    );
  }

  if (lang && status) {
    const langCode = String(lang);
    if (status === 'translated') {
      translations = translations.filter(
        (t) => t.translations[langCode] && t.translations[langCode].trim() !== ''
      );
    } else if (status === 'untranslated') {
      translations = translations.filter(
        (t) => !t.translations[langCode] || t.translations[langCode].trim() === ''
      );
    }
  }

  res.json(translations);
});

router.get('/namespaces', (_req, res) => {
  const translations = readTranslations();
  const namespaces = [...new Set(translations.map((t) => t.namespace))];
  res.json(namespaces);
});

router.get('/:key', (req, res) => {
  const { key } = req.params;
  const translations = readTranslations();
  const entry = translations.find((t) => t.key === key);

  if (!entry) {
    return res.status(404).json({ error: 'Translation key not found' });
  }

  res.json(entry);
});

router.post('/', (req, res) => {
  const { key, namespace, description, translations: trans } = req.body;

  if (!key || !namespace) {
    return res.status(400).json({ error: 'key and namespace are required' });
  }

  const translations = readTranslations();

  if (translations.some((t) => t.key === key)) {
    return res.status(409).json({ error: 'Translation key already exists' });
  }

  const newEntry: TranslationEntry = {
    key,
    namespace,
    description: description || '',
    translations: trans || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  translations.push(newEntry);
  writeTranslations(translations);

  res.status(201).json(newEntry);
});

router.put('/:key', (req, res) => {
  const { key } = req.params;
  const { namespace, description, translations: trans } = req.body;

  const translations = readTranslations();
  const entryIndex = translations.findIndex((t) => t.key === key);

  if (entryIndex === -1) {
    return res.status(404).json({ error: 'Translation key not found' });
  }

  if (namespace !== undefined) translations[entryIndex].namespace = namespace;
  if (description !== undefined) translations[entryIndex].description = description;
  if (trans !== undefined) {
    translations[entryIndex].translations = {
      ...translations[entryIndex].translations,
      ...trans,
    };
  }
  translations[entryIndex].updatedAt = new Date().toISOString();

  writeTranslations(translations);

  res.json(translations[entryIndex]);
});

router.patch('/:key/translate', (req, res) => {
  const { key } = req.params;
  const { lang, value } = req.body;

  if (!lang) {
    return res.status(400).json({ error: 'lang is required' });
  }

  const translations = readTranslations();
  const entryIndex = translations.findIndex((t) => t.key === key);

  if (entryIndex === -1) {
    return res.status(404).json({ error: 'Translation key not found' });
  }

  translations[entryIndex].translations[lang] = value || '';
  translations[entryIndex].updatedAt = new Date().toISOString();

  writeTranslations(translations);

  res.json(translations[entryIndex]);
});

router.delete('/:key', (req, res) => {
  const { key } = req.params;
  const translations = readTranslations();

  const entry = translations.find((t) => t.key === key);
  if (!entry) {
    return res.status(404).json({ error: 'Translation key not found' });
  }

  const filtered = translations.filter((t) => t.key !== key);
  writeTranslations(filtered);

  res.json({ success: true });
});

export default router;
