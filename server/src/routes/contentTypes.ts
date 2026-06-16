import { Router } from 'express';
import { readContentTypes, writeContentTypes } from '../store.js';
import type { ContentType } from '../types';

const router = Router();

function genId(): string {
  return 'ct_' + Math.random().toString(36).slice(2, 10);
}

router.get('/', (_req, res) => {
  const types = readContentTypes();
  res.json(types);
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const types = readContentTypes();
  const found = types.find((t) => t.id === id);
  if (!found) return res.status(404).json({ error: 'Content type not found' });
  res.json(found);
});

router.post('/', (req, res) => {
  const { name, description, fields } = req.body;
  if (!name || !Array.isArray(fields)) {
    return res.status(400).json({ error: 'name and fields (array) are required' });
  }

  const types = readContentTypes();
  const newType: ContentType = {
    id: genId(),
    name,
    description: description || '',
    fields,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  types.push(newType);
  writeContentTypes(types);
  res.status(201).json(newType);
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, fields } = req.body;
  const types = readContentTypes();
  const idx = types.findIndex((t) => t.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Content type not found' });

  if (name !== undefined) types[idx].name = name;
  if (description !== undefined) types[idx].description = description;
  if (Array.isArray(fields)) types[idx].fields = fields;
  types[idx].updatedAt = new Date().toISOString();

  writeContentTypes(types);
  res.json(types[idx]);
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const types = readContentTypes();
  const found = types.find((t) => t.id === id);
  if (!found) return res.status(404).json({ error: 'Content type not found' });

  writeContentTypes(types.filter((t) => t.id !== id));
  res.json({ success: true });
});

export default router;
