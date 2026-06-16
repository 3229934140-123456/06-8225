import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Language, TranslationEntry } from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');

const LANGUAGES_FILE = path.join(DATA_DIR, 'languages.json');
const TRANSLATIONS_FILE = path.join(DATA_DIR, 'translations.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function initializeData() {
  ensureDataDir();

  if (!fs.existsSync(LANGUAGES_FILE)) {
    const defaultLanguages: Language[] = [
      {
        code: 'zh-CN',
        name: 'Chinese',
        nativeName: '简体中文',
        isDefault: true,
        isEnabled: true,
        createdAt: new Date().toISOString(),
      },
      {
        code: 'en-US',
        name: 'English',
        nativeName: 'English',
        isDefault: false,
        isEnabled: true,
        createdAt: new Date().toISOString(),
      },
      {
        code: 'ja-JP',
        name: 'Japanese',
        nativeName: '日本語',
        isDefault: false,
        isEnabled: true,
        createdAt: new Date().toISOString(),
      },
    ];
    fs.writeFileSync(LANGUAGES_FILE, JSON.stringify(defaultLanguages, null, 2));
  }

  if (!fs.existsSync(TRANSLATIONS_FILE)) {
    const sampleTranslations: TranslationEntry[] = [
      {
        key: 'welcome',
        namespace: 'common',
        description: '欢迎语',
        translations: {
          'zh-CN': '欢迎使用多语言内容管理系统',
          'en-US': 'Welcome to the i18n CMS',
          'ja-JP': '',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        key: 'home',
        namespace: 'common',
        description: '首页',
        translations: {
          'zh-CN': '首页',
          'en-US': 'Home',
          'ja-JP': 'ホーム',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        key: 'settings',
        namespace: 'common',
        description: '设置',
        translations: {
          'zh-CN': '设置',
          'en-US': 'Settings',
          'ja-JP': '',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        key: 'save',
        namespace: 'common',
        description: '保存按钮',
        translations: {
          'zh-CN': '保存',
          'en-US': 'Save',
          'ja-JP': '保存',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        key: 'cancel',
        namespace: 'common',
        description: '取消按钮',
        translations: {
          'zh-CN': '取消',
          'en-US': 'Cancel',
          'ja-JP': 'キャンセル',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        key: 'title',
        namespace: 'dashboard',
        description: '仪表盘标题',
        translations: {
          'zh-CN': '仪表盘',
          'en-US': 'Dashboard',
          'ja-JP': 'ダッシュボード',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        key: 'totalUsers',
        namespace: 'dashboard',
        description: '用户总数',
        translations: {
          'zh-CN': '用户总数',
          'en-US': 'Total Users',
          'ja-JP': '',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        key: 'greeting.morning',
        namespace: 'greeting',
        description: '早上问候语',
        translations: {
          'zh-CN': '早上好',
          'en-US': 'Good morning',
          'ja-JP': 'おはようございます',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        key: 'greeting.afternoon',
        namespace: 'greeting',
        description: '下午问候语',
        translations: {
          'zh-CN': '下午好',
          'en-US': 'Good afternoon',
          'ja-JP': '',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        key: 'greeting.evening',
        namespace: 'greeting',
        description: '晚上问候语',
        translations: {
          'zh-CN': '晚上好',
          'en-US': 'Good evening',
          'ja-JP': 'こんばんは',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    fs.writeFileSync(TRANSLATIONS_FILE, JSON.stringify(sampleTranslations, null, 2));
  }
}

export function readLanguages(): Language[] {
  initializeData();
  const data = fs.readFileSync(LANGUAGES_FILE, 'utf-8');
  return JSON.parse(data);
}

export function writeLanguages(languages: Language[]): void {
  ensureDataDir();
  fs.writeFileSync(LANGUAGES_FILE, JSON.stringify(languages, null, 2));
}

export function readTranslations(): TranslationEntry[] {
  initializeData();
  const data = fs.readFileSync(TRANSLATIONS_FILE, 'utf-8');
  return JSON.parse(data);
}

export function writeTranslations(translations: TranslationEntry[]): void {
  ensureDataDir();
  fs.writeFileSync(TRANSLATIONS_FILE, JSON.stringify(translations, null, 2));
}

initializeData();
