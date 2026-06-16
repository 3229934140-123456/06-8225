import { Router } from 'express';
import {
  readVersions,
  writeVersions,
  readTranslations,
} from '../store.js';
import type { LocaleBundleVersion } from '../types';

const router = Router();

function genId(): string {
  return 'v_' + Math.random().toString(36).slice(2, 10);
}

function buildSnapshot(lang: string): Record<string, string> {
  const translations = readTranslations();
  const snapshot: Record<string, string> = {};
  for (const t of translations) {
    snapshot[t.key] = t.translations[lang] || '';
  }
  return snapshot;
}

function computeDiff(
  oldSnapshot: Record<string, string>,
  newSnapshot: Record<string, string>
): LocaleBundleVersion['changes'] {
  const changes: LocaleBundleVersion['changes'] = [];
  const allKeys = new Set([...Object.keys(oldSnapshot), ...Object.keys(newSnapshot)]);
  const now = new Date().toISOString();

  for (const key of allKeys) {
    const oldVal = oldSnapshot[key] || '';
    const newVal = newSnapshot[key] || '';
    if (oldVal !== newVal) {
      changes.push({
        key,
        oldValue: oldVal,
        newValue: newVal,
        changedAt: now,
        changedBy: 'admin',
      });
    }
  }
  return changes;
}

router.get('/', (req, res) => {
  const { lang } = req.query;
  let versions = readVersions();
  if (lang) {
    versions = versions.filter((v) => v.lang === String(lang));
  }
  versions.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
  res.json(versions);
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const versions = readVersions();
  const found = versions.find((v) => v.id === id);
  if (!found) return res.status(404).json({ error: 'Version not found' });
  res.json(found);
});

router.post('/', (req, res) => {
  const { lang, description, createdBy = 'admin' } = req.body;
  if (!lang) return res.status(400).json({ error: 'lang is required' });

  const versions = readVersions();
  const current = versions.find((v) => v.lang === lang && v.isCurrent);
  const currentSnapshot = current?.snapshot || {};
  const newSnapshot = buildSnapshot(lang);
  const changes = computeDiff(currentSnapshot, newSnapshot);

  const newVersion: LocaleBundleVersion = {
    id: genId(),
    version: `v${Date.now()}`,
    lang,
    description: description || '',
    snapshot: newSnapshot,
    changes,
    isCurrent: false,
    createdAt: new Date().toISOString(),
    createdBy,
  };
  versions.push(newVersion);
  writeVersions(versions);
  res.status(201).json(newVersion);
});

router.post('/:id/publish', (req, res) => {
  const { id } = req.params;
  const versions = readVersions();
  const idx = versions.findIndex((v) => v.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Version not found' });

  const target = versions[idx];
  for (const v of versions) {
    if (v.lang === target.lang) v.isCurrent = false;
  }
  versions[idx].isCurrent = true;
  versions[idx].publishedAt = new Date().toISOString();
  versions[idx].publishedBy = 'admin';
  writeVersions(versions);
  res.json(versions[idx]);
});

router.post('/:id/rollback', (req, res) => {
  const { id } = req.params;
  const versions = readVersions();
  const idx = versions.findIndex((v) => v.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Version not found' });

  const target = versions[idx];
  for (const v of versions) {
    if (v.lang === target.lang) v.isCurrent = false;
  }
  versions[idx].isCurrent = true;
  versions[idx].publishedAt = new Date().toISOString();
  versions[idx].publishedBy = 'admin';
  writeVersions(versions);
  res.json(versions[idx]);
});

export default router;
