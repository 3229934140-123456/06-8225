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

function now(): string {
  return new Date().toISOString();
}

function e(
  key: string,
  namespace: string,
  description: string,
  zhCN: string,
  enUS: string,
  jaJP: string,
  completedZhCN = true,
  completedEnUS = true,
  completedJaJP = false
): TranslationEntry {
  return {
    key,
    namespace,
    description,
    translations: { 'zh-CN': zhCN, 'en-US': enUS, 'ja-JP': jaJP },
    completed: {
      'zh-CN': completedZhCN,
      'en-US': completedEnUS,
      'ja-JP': completedJaJP,
    },
    createdAt: now(),
    updatedAt: now(),
  };
}

function getDefaultTranslations(): TranslationEntry[] {
  return [
    e('app.title', 'ui', '系统标题', '多语言内容管理系统', 'i18n Content Management System', '多言語コンテンツ管理システム', true, true, true),
    e('language.management', 'ui', '语言管理菜单', '语言管理', 'Language Management', '言語管理', true, true, false),
    e('language.switch', 'ui', '语言切换标签', '语言切换', 'Switch Language', '言語切替', true, true, false),
    e('language.add', 'ui', '添加语言按钮', '添加语言', 'Add Language', '言語追加', true, true, false),
    e('language.code', 'ui', '语言编码字段', '语言编码', 'Language Code', '言語コード', true, true, false),
    e('language.name', 'ui', '英文名称字段', '英文名称', 'English Name', '英語名', true, true, false),
    e('language.nativeName', 'ui', '原生名称字段', '原生名称', 'Native Name', 'ネイティブ名', true, true, false),
    e('language.setDefault', 'ui', '设为默认语言', '设为默认语言', 'Set as Default', 'デフォルトに設定', true, true, false),
    e('language.isDefault', 'ui', '默认语言字段', '默认语言', 'Default Language', 'デフォルト言語', true, true, false),
    e('language.enabled', 'ui', '已启用状态', '已启用', 'Enabled', '有効', true, true, false),
    e('language.disabled', 'ui', '已禁用状态', '已禁用', 'Disabled', '無効', true, true, false),
    e('language.default', 'ui', '默认标签', '默认', 'Default', 'デフォルト', true, true, false),
    e('language.progress', 'ui', '翻译进度', '翻译进度', 'Translation Progress', '翻訳進捗', true, true, false),
    e('language.status', 'ui', '状态列', '状态', 'Status', 'ステータス', true, true, false),
    e('language.actions', 'ui', '操作列', '操作', 'Actions', '操作', true, true, false),
    e('language.edit', 'ui', '编辑按钮', '编辑', 'Edit', '編集', true, true, false),
    e('language.delete', 'ui', '删除按钮', '删除', 'Delete', '削除', true, true, false),
    e('language.importExport', 'ui', '导入导出按钮', '导入/导出', 'Import/Export', 'インポート/エクスポート', true, true, false),
    e('language.editTitle', 'ui', '编辑语言弹窗标题', '编辑语言', 'Edit Language', '言語編集', true, true, false),
    e('language.addTitle', 'ui', '添加语言弹窗标题', '添加语言', 'Add Language', '言語追加', true, true, false),

    e('translation.workbench', 'ui', '翻译工作台菜单', '翻译工作台', 'Translation Workbench', '翻訳ワークベンチ', true, true, false),
    e('translation.addTarget', 'ui', '添加翻译条目按钮', '添加翻译条目', 'Add Entry', 'エントリ追加', true, true, false),
    e('translation.targetLang', 'ui', '目标语言', '目标语言', 'Target Language', '対象言語', true, true, false),
    e('translation.defaultLang', 'ui', '默认语言列标题', '默认语言', 'Default Language', 'デフォルト言語', true, true, false),
    e('translation.key', 'ui', '键名列', '键名', 'Key', 'キー', true, true, false),
    e('translation.namespace', 'ui', '命名空间', '命名空间', 'Namespace', '名前空間', true, true, false),
    e('translation.description', 'ui', '描述列', '描述', 'Description', '説明', true, true, false),
    e('translation.unfilled', 'ui', '未填写状态', '未填写', 'Unfilled', '未入力', true, true, false),
    e('translation.filled', 'ui', '已填写状态', '已填写', 'Filled', '入力済', true, true, false),
    e('translation.completed', 'ui', '已完成状态', '已完成', 'Completed', '完了', true, true, false),
    e('translation.untranslated', 'ui', '未翻译', '未翻译', 'Not Translated', '未翻訳', true, true, false),
    e('translation.save', 'ui', '保存按钮', '保存', 'Save', '保存', true, true, true),
    e('translation.cancel', 'ui', '取消按钮', '取消', 'Cancel', 'キャンセル', true, true, true),
    e('translation.edit', 'ui', '编辑按钮', '编辑', 'Edit', '編集', true, true, false),
    e('translation.markComplete', 'ui', '标记完成按钮', '标记完成', 'Mark Complete', '完了にする', true, true, false),
    e('translation.batchMarkComplete', 'ui', '批量标记完成按钮', '批量标记完成', 'Batch Mark Complete', '一括完了', true, true, false),
    e('translation.batchMarkIncomplete', 'ui', '批量标记未完成', '批量标记未完成', 'Batch Mark Incomplete', '一括未完了', true, true, false),
    e('translation.searchPlaceholder', 'ui', '搜索框占位', '搜索键名或内容', 'Search key or content', 'キーまたは内容を検索', true, true, false),
    e('translation.selectLang', 'ui', '选择目标语言占位', '选择目标语言', 'Select Target Language', '対象言語を選択', true, true, false),
    e('translation.clickToEdit', 'ui', '点击编辑提示', '点击编辑', 'Click to edit', 'クリックして編集', true, true, false),
    e('translation.clickToTranslate', 'ui', '点击翻译提示', '点击翻译', 'Click to translate', 'クリックして翻訳', true, true, false),
    e('translation.addTitle', 'ui', '添加翻译条目弹窗标题', '添加翻译条目', 'Add Translation Entry', '翻訳エントリ追加', true, true, false),
    e('translation.keyName', 'ui', '翻译键名字段', '翻译键名', 'Translation Key', '翻訳キー', true, true, false),

    e('demo.page', 'ui', '演示页面菜单', '演示页面', 'Demo Page', 'デモページ', true, true, false),
    e('demo.featureInfo', 'ui', '功能说明标题', '功能说明', 'Feature Info', '機能説明', true, true, false),
    e('demo.featureDesc1', 'ui', '功能说明条目1', '根据浏览器语言或手动切换加载对应语言包', 'Load locale bundle based on browser language or manual switch', 'ブラウザ言語または手動切替に基づいて言語パックをロード', true, true, false),
    e('demo.featureDesc2', 'ui', '功能说明条目2', '翻译缺失时自动回退到默认语言', 'Auto fallback to default language when translation is missing', '翻訳がない場合デフォルト言語にフォールバック', true, true, false),
    e('demo.featureDesc3', 'ui', '功能说明条目3', '支持动态合并基础语言包和差异语言包', 'Support dynamic merge of base and diff language packs', '基本言語パックと差分言語パックの動的マージをサポート', true, true, false),
    e('demo.langSwitch', 'ui', '语言切换卡片标题', '语言切换', 'Language Switch', '言語切替', true, true, false),
    e('demo.currentLang', 'ui', '当前语言标签', '当前语言', 'Current Language', '現在の言語', true, true, false),
    e('demo.defaultLang', 'ui', '默认语言标签', '默认语言', 'Default Language', 'デフォルト言語', true, true, false),
    e('demo.translationDisplay', 'ui', '翻译展示卡片标题', '翻译展示（含来源标识）', 'Translation Display (with Source)', '翻訳表示（ソース付き）', true, true, false),
    e('demo.translationResult', 'ui', '翻译结果标签', '翻译结果', 'Translation', '翻訳結果', true, true, false),
    e('demo.fromDiff', 'ui', '来自差异包', '差异包', 'Diff Pack', '差分パック', true, true, false),
    e('demo.fromFallback', 'ui', '来自回退', '回退默认语言', 'Fallback', 'フォールバック', true, true, false),
    e('demo.translated', 'ui', '已翻译标签', '已翻译', 'Translated', '翻訳済', true, true, false),
    e('demo.paramExample', 'ui', '带参数翻译示例标题', '带参数的翻译示例', 'Translation with Parameters', 'パラメータ付き翻訳例', true, true, false),
    e('demo.noParam', 'ui', '无参数示例', '无参数示例', 'Without Params', 'パラメータなし', true, true, false),
    e('demo.withParam', 'ui', '带参数示例', '带参数示例', 'With Params', 'パラメータ付き', true, true, false),

    e('common.save', 'ui', '保存按钮', '保存', 'Save', '保存', true, true, true),
    e('common.cancel', 'ui', '取消按钮', '取消', 'Cancel', 'キャンセル', true, true, true),
    e('common.add', 'ui', '添加按钮', '添加', 'Add', '追加', true, true, false),
    e('common.delete', 'ui', '删除按钮', '删除', 'Delete', '削除', true, true, false),
    e('common.edit', 'ui', '编辑按钮', '编辑', 'Edit', '編集', true, true, false),
    e('common.confirm', 'ui', '确认', '确定', 'Confirm', '確認', true, true, false),
    e('common.operationSuccess', 'ui', '操作成功', '操作成功', 'Operation Successful', '操作成功', true, true, false),
    e('common.operationFailed', 'ui', '操作失败', '操作失败', 'Operation Failed', '操作失敗', true, true, false),
    e('common.loadFailed', 'ui', '加载失败', '加载失败', 'Load Failed', '読み込み失敗', true, true, false),
    e('common.total', 'ui', '共N条', '共 {count} 条', '{count} items in total', '全 {count} 件', true, true, false),
    e('common.noData', 'ui', '暂无数据', '暂无数据', 'No Data', 'データなし', true, true, false),

    e('io.exportTitle', 'ui', '导出标签', '导出', 'Export', 'エクスポート', true, true, false),
    e('io.importTitle', 'ui', '导入标签', '导入', 'Import', 'インポート', true, true, false),
    e('io.exportFormat', 'ui', '导出格式', '导出格式', 'Export Format', 'エクスポート形式', true, true, false),
    e('io.nested', 'ui', '嵌套结构', '嵌套结构', 'Nested', 'ネスト構造', true, true, false),
    e('io.flat', 'ui', '扁平结构', '扁平结构', 'Flat', 'フラット構造', true, true, false),
    e('io.importMode', 'ui', '导入模式', '导入模式', 'Import Mode', 'インポートモード', true, true, false),
    e('io.merge', 'ui', '合并模式', '合并模式（保留现有翻译）', 'Merge (keep existing)', 'マージ（既存を保持）', true, true, false),
    e('io.overwrite', 'ui', '覆盖模式', '覆盖模式（替换全部翻译）', 'Overwrite (replace all)', '上書き（全置換）', true, true, false),
    e('io.selectFile', 'ui', '选择文件', '选择 JSON 文件', 'Select JSON File', 'JSONファイルを選択', true, true, false),
    e('io.startImport', 'ui', '开始导入', '开始导入', 'Start Import', 'インポート開始', true, true, false),
    e('io.title', 'ui', '导入导出弹窗标题', '导入/导出', 'Import / Export', 'インポート/エクスポート', true, true, false),

    e('welcome', 'common', '欢迎语', '欢迎使用多语言内容管理系统', 'Welcome to the i18n CMS', '', true, true, false),
    e('home', 'common', '首页', '首页', 'Home', 'ホーム', true, true, true),
    e('settings', 'common', '设置', '设置', 'Settings', '', true, true, false),
    e('dashboard.title', 'dashboard', '仪表盘标题', '仪表盘', 'Dashboard', 'ダッシュボード', true, true, true),
    e('dashboard.totalUsers', 'dashboard', '用户总数', '用户总数', 'Total Users', '', true, true, false),
    e('greeting.morning', 'greeting', '早上问候语', '早上好', 'Good morning', 'おはようございます', true, true, true),
    e('greeting.afternoon', 'greeting', '下午问候语', '下午好', 'Good afternoon', '', true, true, false),
    e('greeting.evening', 'greeting', '晚上问候语', '晚上好', 'Good evening', 'こんばんは', true, true, true),
  ];
}

function getDefaultLanguages(): Language[] {
  return [
    { code: 'zh-CN', name: 'Chinese', nativeName: '简体中文', isDefault: true, isEnabled: true, createdAt: now() },
    { code: 'en-US', name: 'English', nativeName: 'English', isDefault: false, isEnabled: true, createdAt: now() },
    { code: 'ja-JP', name: 'Japanese', nativeName: '日本語', isDefault: false, isEnabled: true, createdAt: now() },
  ];
}

function initializeData() {
  ensureDataDir();

  if (!fs.existsSync(LANGUAGES_FILE)) {
    fs.writeFileSync(LANGUAGES_FILE, JSON.stringify(getDefaultLanguages(), null, 2));
  }

  if (!fs.existsSync(TRANSLATIONS_FILE)) {
    fs.writeFileSync(TRANSLATIONS_FILE, JSON.stringify(getDefaultTranslations(), null, 2));
  } else {
    migrateTranslations();
  }
}

function migrateTranslations() {
  try {
    const data = fs.readFileSync(TRANSLATIONS_FILE, 'utf-8');
    const entries: TranslationEntry[] = JSON.parse(data);
    let changed = false;

    for (const entry of entries) {
      if (!entry.completed) {
        entry.completed = {};
        for (const lang of Object.keys(entry.translations)) {
          entry.completed[lang] = !!(entry.translations[lang] && entry.translations[lang].trim() !== '');
        }
        changed = true;
      }
    }

    const defaultEntries = getDefaultTranslations();
    const existingKeys = new Set(entries.map((e) => e.key));

    for (const defaultEntry of defaultEntries) {
      if (!existingKeys.has(defaultEntry.key)) {
        const newEntry = { ...defaultEntry, createdAt: now(), updatedAt: now() };
        for (const lang of Object.keys(newEntry.translations)) {
          if (!newEntry.completed[lang]) {
            newEntry.completed[lang] = false;
          }
        }
        entries.push(newEntry);
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(TRANSLATIONS_FILE, JSON.stringify(entries, null, 2));
    }
  } catch {
    fs.writeFileSync(TRANSLATIONS_FILE, JSON.stringify(getDefaultTranslations(), null, 2));
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
