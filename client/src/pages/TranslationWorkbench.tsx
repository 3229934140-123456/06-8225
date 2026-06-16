import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Select,
  Input,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  message,
  Typography,
  Tooltip,
  Empty,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import type { TranslationEntry, Language, TranslationStatus } from '../types';
import { translationsApi, languagesApi } from '../services/api';
import { useI18n } from '../i18n/I18nProvider';

const { Title } = Typography;
const { TextArea } = Input;

export default function TranslationWorkbench() {
  const { t } = useI18n();
  const [translations, setTranslations] = useState<TranslationEntry[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLang, setSelectedLang] = useState<string>('');
  const [selectedNamespace, setSelectedNamespace] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<TranslationStatus | 'all'>('all');
  const [searchText, setSearchText] = useState<string>('');
  const [editingKey, setEditingKey] = useState<string>('');
  const [editValue, setEditValue] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [defaultLang, setDefaultLang] = useState<string>('zh-CN');
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedNamespace) params.namespace = selectedNamespace;
      if (selectedLang && filterStatus !== 'all') {
        params.lang = selectedLang;
        params.status = filterStatus;
      }
      if (searchText) params.search = searchText;
      const data = await translationsApi.getAll(params);
      setTranslations(data);
      setSelectedRowKeys([]);
    } catch (error: any) {
      message.error(t('common.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [selectedNamespace, selectedLang, filterStatus, searchText, t]);

  useEffect(() => {
    const init = async () => {
      try {
        const [langs, ns] = await Promise.all([
          languagesApi.getAll(),
          translationsApi.getNamespaces(),
        ]);
        const enabledLangs = langs.filter((l) => l.isEnabled);
        setLanguages(enabledLangs);
        setNamespaces(ns);
        const defLang = langs.find((l) => l.isDefault);
        if (defLang) setDefaultLang(defLang.code);
        const nonDefault = enabledLangs.find((l) => !l.isDefault);
        const initial = nonDefault?.code || defLang?.code || 'en-US';
        setSelectedLang(initial);
      } catch (error: any) {
        message.error(t('common.loadFailed'));
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedLang) {
      fetchData();
    }
  }, [fetchData, selectedLang]);

  const getStatus = (entry: TranslationEntry, lang: string): TranslationStatus => {
    const val = entry.translations[lang];
    if (!val || val.trim() === '') return 'unfilled';
    if (entry.completed && entry.completed[lang]) return 'completed';
    return 'filled';
  };

  const handleEdit = (record: TranslationEntry) => {
    setEditingKey(record.key);
    setEditValue(record.translations[selectedLang] || '');
  };

  const handleSave = async (record: TranslationEntry) => {
    try {
      await translationsApi.translate(record.key, selectedLang, editValue);
      message.success(t('common.operationSuccess'));
      setEditingKey('');
      fetchData();
    } catch (error: any) {
      message.error(t('common.operationFailed'));
    }
  };

  const handleCancel = () => {
    setEditingKey('');
    setEditValue('');
  };

  const handleToggleComplete = async (record: TranslationEntry, completed: boolean) => {
    try {
      await translationsApi.complete(record.key, selectedLang, completed);
      message.success(t('common.operationSuccess'));
      fetchData();
    } catch (error: any) {
      message.error(t('common.operationFailed'));
    }
  };

  const handleBatchComplete = async (completed: boolean) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择条目');
      return;
    }
    try {
      await translationsApi.batchComplete(selectedRowKeys, selectedLang, completed);
      message.success(t('common.operationSuccess'));
      setSelectedRowKeys([]);
      fetchData();
    } catch (error: any) {
      message.error(t('common.operationFailed'));
    }
  };

  const handleAdd = () => {
    form.resetFields();
    setModalOpen(true);
  };

  const handleAddSubmit = async () => {
    try {
      const values = await form.validateFields();
      await translationsApi.create({
        key: values.key,
        namespace: values.namespace || 'common',
        description: values.description,
        translations: {
          [selectedLang]: values.translation || '',
        },
      });
      message.success(t('common.operationSuccess'));
      setModalOpen(false);
      fetchData();
    } catch (error: any) {
      message.error(t('common.operationFailed'));
    }
  };

  const unfilledCount = translations.filter((e) => getStatus(e, selectedLang) === 'unfilled').length;
  const filledCount = translations.filter((e) => getStatus(e, selectedLang) === 'filled').length;
  const completedCount = translations.filter((e) => getStatus(e, selectedLang) === 'completed').length;

  const columns = [
    {
      title: t('translation.key'),
      dataIndex: 'key',
      key: 'key',
      width: 240,
      render: (key: string) => <code>{key}</code>,
    },
    {
      title: t('translation.namespace'),
      dataIndex: 'namespace',
      key: 'namespace',
      width: 110,
      render: (ns: string) => <Tag color="blue">{ns}</Tag>,
    },
    {
      title: t('translation.description'),
      dataIndex: 'description',
      key: 'description',
      width: 140,
      ellipsis: true,
    },
    {
      title: `${t('translation.defaultLang')}`,
      key: 'default',
      width: 180,
      ellipsis: true,
      render: (_: any, record: TranslationEntry) => (
        <Tooltip title={record.translations[defaultLang]}>
          {record.translations[defaultLang] || <span style={{ color: '#999' }}>-</span>}
        </Tooltip>
      ),
    },
    {
      title: () => {
        const langName = languages.find((l) => l.code === selectedLang)?.nativeName || selectedLang;
        return (
          <Space>
            {t('translation.targetLang')} ({langName})
            <Tag color="green">{completedCount}</Tag>
            <Tag color="orange">{filledCount}</Tag>
            <Tag color="red">{unfilledCount}</Tag>
          </Space>
        );
      },
      key: 'translation',
      width: 280,
      render: (_: any, record: TranslationEntry) => {
        const isEditing = editingKey === record.key;
        if (isEditing) {
          return (
            <Space direction="vertical" style={{ width: '100%' }}>
              <TextArea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                autoSize={{ minRows: 2, maxRows: 4 }}
                autoFocus
              />
              <Space>
                <Button size="small" type="primary" onClick={() => handleSave(record)}>
                  {t('translation.save')}
                </Button>
                <Button size="small" onClick={handleCancel}>
                  {t('translation.cancel')}
                </Button>
              </Space>
            </Space>
          );
        }
        const status = getStatus(record, selectedLang);
        const val = record.translations[selectedLang];
        return (
          <div onClick={() => handleEdit(record)} style={{ cursor: 'pointer' }}>
            {status === 'unfilled' ? (
              <Tooltip title={t('translation.clickToTranslate')}>
                <span style={{ color: '#ff4d4f', fontStyle: 'italic' }}>{t('translation.unfilled')}</span>
              </Tooltip>
            ) : (
              <Tooltip title={t('translation.clickToEdit')}>
                <span>{val}</span>
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      title: t('language.status'),
      key: 'status',
      width: 120,
      render: (_: any, record: TranslationEntry) => {
        const status = getStatus(record, selectedLang);
        if (status === 'completed') {
          return <Tag color="green">{t('translation.completed')}</Tag>;
        }
        if (status === 'filled') {
          return <Tag color="orange">{t('translation.filled')}</Tag>;
        }
        return <Tag color="red">{t('translation.unfilled')}</Tag>;
      },
    },
    {
      title: t('language.actions'),
      key: 'actions',
      width: 180,
      render: (_: any, record: TranslationEntry) => {
        const status = getStatus(record, selectedLang);
        return (
          <Space size="small">
            <Button type="link" size="small" onClick={() => handleEdit(record)}>
              {t('translation.edit')}
            </Button>
            {status === 'filled' && (
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleToggleComplete(record, true)}
              >
                {t('translation.markComplete')}
              </Button>
            )}
            {status === 'completed' && (
              <Popconfirm
                title={t('translation.batchMarkIncomplete')}
                onConfirm={() => handleToggleComplete(record, false)}
              >
                <Button type="link" size="small" icon={<CloseOutlined />} danger>
                  {t('translation.filled')}
                </Button>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          {t('translation.workbench')}
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          {t('translation.addTarget')}
        </Button>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Select
          value={selectedLang || undefined}
          onChange={setSelectedLang}
          style={{ width: 180 }}
          placeholder={t('translation.selectLang')}
        >
          {languages.map((l) => (
            <Select.Option key={l.code} value={l.code}>
              {l.nativeName} ({l.code})
            </Select.Option>
          ))}
        </Select>

        <Select
          value={selectedNamespace || undefined}
          onChange={(v) => setSelectedNamespace(v || '')}
          style={{ width: 150 }}
          placeholder={t('translation.namespace')}
          allowClear
        >
          {namespaces.map((ns) => (
            <Select.Option key={ns} value={ns}>
              {ns}
            </Select.Option>
          ))}
        </Select>

        <Select
          value={filterStatus}
          onChange={(v) => setFilterStatus(v as TranslationStatus | 'all')}
          style={{ width: 180 }}
        >
          <Select.Option value="all">All</Select.Option>
          <Select.Option value="unfilled">
            <span style={{ color: '#ff4d4f' }}>{t('translation.unfilled')}</span> ({unfilledCount})
          </Select.Option>
          <Select.Option value="filled">
            <span style={{ color: '#faad14' }}>{t('translation.filled')}</span> ({filledCount})
          </Select.Option>
          <Select.Option value="completed">
            <span style={{ color: '#52c41a' }}>{t('translation.completed')}</span> ({completedCount})
          </Select.Option>
        </Select>

        <Input.Search
          placeholder={t('translation.searchPlaceholder')}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onSearch={(v) => setSearchText(v)}
          style={{ width: 250 }}
          allowClear
        />
      </div>

      {selectedRowKeys.length > 0 && (
        <div style={{ marginBottom: 16, padding: '8px 16px', background: '#f6f6f6', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>已选择 {selectedRowKeys.length} 项</span>
          <Button
            size="small"
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => handleBatchComplete(true)}
          >
            {t('translation.batchMarkComplete')}
          </Button>
          <Popconfirm
            title={t('translation.batchMarkIncomplete')}
            onConfirm={() => handleBatchComplete(false)}
          >
            <Button size="small" icon={<CloseOutlined />} danger>
              {t('translation.batchMarkIncomplete')}
            </Button>
          </Popconfirm>
          <Button size="small" onClick={() => setSelectedRowKeys([])}>
            {t('translation.cancel')}
          </Button>
        </div>
      )}

      <Table
        columns={columns}
        dataSource={translations}
        rowKey="key"
        loading={loading}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys as string[]),
          getCheckboxProps: (record) => ({
            disabled: getStatus(record, selectedLang) === 'unfilled',
          }),
        }}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => t('common.total', { count: total }),
        }}
        locale={{
          emptyText: <Empty description={t('common.noData')} />,
        }}
      />

      <Modal
        title={t('translation.addTitle')}
        open={modalOpen}
        onOk={handleAddSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="key"
            label={t('translation.keyName')}
            rules={[{ required: true, message: t('translation.keyName') }]}
          >
            <Input placeholder="greeting.morning" />
          </Form.Item>
          <Form.Item
            name="namespace"
            label={t('translation.namespace')}
            initialValue="common"
          >
            <Input placeholder="common" />
          </Form.Item>
          <Form.Item name="description" label={t('translation.description')}>
            <Input />
          </Form.Item>
          <Form.Item name="translation" label={`${t('translation.targetLang')} (${selectedLang})`}>
            <TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
