import { Router } from 'express';
import {
  readContents,
  writeContents,
  readContentTypes,
  readLanguages,
} from '../store.js';
import type { Content, ContentLanguageProgress, ContentStatus } from '../types';

const router = Router();

function genId(): string {
  return 'c_' + Math.random().toString(36).slice(2, 10);
}

function computeLanguageProgress(
  content: Content,
  typeId: string
): ContentLanguageProgress[] {
  const types = readContentTypes();
  const langs = readLanguages().filter((l) => l.isEnabled);
  const contentType = types.find((t) => t.id === typeId);
  if (!contentType) return [];

  return langs.map((lang) => {
    const missingFields: string[] = [];
    for (const field of contentType.fields) {
      const requiredTranslatable = field.required && field.translatable;
      const requiredNonTranslatable = field.required && !field.translatable;

      if (requiredNonTranslatable) {
        const val = content.fields[field.key]?.[lang.code] ?? content.fields[field.key]?.['zh-CN'] ?? '';
        if (!val || !String(val).trim()) missingFields.push(field.key);
      } else if (requiredTranslatable) {
        const val = content.fields[field.key]?.[lang.code] ?? '';
        if (!val || !String(val).trim()) missingFields.push(field.key);
      }
    }
    return {
      lang: lang.code,
      filled: missingFields.length === 0,
      missingFields,
    };
  });
}

router.get('/', (_req, res) => {
  const contents = readContents();
  const types = readContentTypes();
  const result = contents.map((c) => ({
    ...c,
    typeName: types.find((t) => t.id === c.typeId)?.name || c.typeId,
    languageProgress: computeLanguageProgress(c, c.typeId),
  }));
  res.json(result);
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const contents = readContents();
  const found = contents.find((c) => c.id === id);
  if (!found) return res.status(404).json({ error: 'Content not found' });

  const types = readContentTypes();
  res.json({
    ...found,
    typeName: types.find((t) => t.id === found.typeId)?.name || found.typeId,
    languageProgress: computeLanguageProgress(found, found.typeId),
  });
});

router.post('/', (req, res) => {
  const { typeId, fields, author = 'admin' } = req.body;
  if (!typeId) return res.status(400).json({ error: 'typeId is required' });

  const types = readContentTypes();
  if (!types.find((t) => t.id === typeId)) {
    return res.status(400).json({ error: 'Invalid typeId' });
  }

  const contents = readContents();
  const newContent: Content = {
    id: genId(),
    typeId,
    status: 'draft',
    fields: fields || {},
    author,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  contents.push(newContent);
  writeContents(contents);
  res.status(201).json(newContent);
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { fields, status } = req.body;
  const contents = readContents();
  const idx = contents.findIndex((c) => c.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Content not found' });

  if (fields) contents[idx].fields = fields;
  const validStatuses: ContentStatus[] = ['draft', 'review', 'published'];
  if (status && validStatuses.includes(status)) {
    contents[idx].status = status;
    if (status === 'published') {
      contents[idx].publishedAt = new Date().toISOString();
    }
  }
  contents[idx].updatedAt = new Date().toISOString();

  writeContents(contents);

  res.json({
    ...contents[idx],
    languageProgress: computeLanguageProgress(contents[idx], contents[idx].typeId),
  });
});

router.patch('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses: ContentStatus[] = ['draft', 'review', 'published'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status, must be draft/review/published' });
  }

  const contents = readContents();
  const idx = contents.findIndex((c) => c.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Content not found' });

  contents[idx].status = status;
  if (status === 'published') {
    contents[idx].publishedAt = new Date().toISOString();
  }
  contents[idx].updatedAt = new Date().toISOString();
  writeContents(contents);

  res.json({
    ...contents[idx],
    languageProgress: computeLanguageProgress(contents[idx], contents[idx].typeId),
  });
});

router.get('/:id/progress', (req, res) => {
  const { id } = req.params;
  const contents = readContents();
  const found = contents.find((c) => c.id === id);
  if (!found) return res.status(404).json({ error: 'Content not found' });
  res.json(computeLanguageProgress(found, found.typeId));
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const contents = readContents();
  const found = contents.find((c) => c.id === id);
  if (!found) return res.status(404).json({ error: 'Content not found' });

  writeContents(contents.filter((c) => c.id !== id));
  res.json({ success: true });
});

export default router;
