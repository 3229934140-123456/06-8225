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
} from 'antd';
import { PlusOutlined, FilterOutlined, CheckOutlined } from '@ant-design/icons';
import type { TranslationEntry, Language } from '../types';
import { translationsApi, languagesApi } from '../services/api';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function TranslationWorkbench() {
  const [translations, setTranslations] = useState<TranslationEntry[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLang, setSelectedLang] = useState<string>('en-US');
  const [selectedNamespace, setSelectedNamespace] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchText, setSearchText] = useState<string>('');
  const [editingKey, setEditingKey] = useState<string>('');
  const [editValue, setEditValue] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [defaultLang, setDefaultLang] = useState<string>('zh-CN');

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
    } catch (error: any) {
      message.error(error.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [selectedNamespace, selectedLang, filterStatus, searchText]);

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
        if (enabledLangs.length > 0 && !enabledLangs.find((l) => l.code === selectedLang)) {
          setSelectedLang(enabledLangs[0].code);
        }
      } catch (error: any) {
        message.error(error.message || '加载失败');
      }
    };
    init();
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isTranslated = (entry: TranslationEntry) => {
    const val = entry.translations[selectedLang];
    return val && val.trim() !== '';
  };

  const handleEdit = (record: TranslationEntry) => {
    setEditingKey(record.key);
    setEditValue(record.translations[selectedLang] || '');
  };

  const handleSave = async (record: TranslationEntry) => {
    try {
      await translationsApi.translate(record.key, selectedLang, editValue);
      message.success('保存成功');
      setEditingKey('');
      fetchData();
    } catch (error: any) {
      message.error(error.message || '保存失败');
    }
  };

  const handleCancel = () => {
    setEditingKey('');
    setEditValue('');
  };

  const handleMarkComplete = async (record: TranslationEntry) => {
    try {
      const value = record.translations[selectedLang] || record.translations[defaultLang] || '';
      await translationsApi.translate(record.key, selectedLang, value);
      message.success('已标记完成');
      fetchData();
    } catch (error: any) {
      message.error(error.message || '操作失败');
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
      message.success('添加成功');
      setModalOpen(false);
      fetchData();
    } catch (error: any) {
      message.error(error.message || '添加失败');
    }
  };

  const translatedCount = translations.filter((t) => isTranslated(t)).length;
  const totalCount = translations.length;

  const columns = [
    {
      title: '键名',
      dataIndex: 'key',
      key: 'key',
      width: 250,
      render: (key: string) => <code>{key}</code>,
    },
    {
      title: '命名空间',
      dataIndex: 'namespace',
      key: 'namespace',
      width: 120,
      render: (ns: string) => <Tag color="blue">{ns}</Tag>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 150,
      ellipsis: true,
    },
    {
      title: () => {
        const langName = languages.find((l) => l.code === defaultLang)?.nativeName || defaultLang;
        return `默认语言 (${langName})`;
      },
      key: 'default',
      width: 200,
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
            目标语言 ({langName})
            {totalCount > 0 && (
              <Tag color={translatedCount === totalCount ? 'green' : 'orange'}>
                {translatedCount}/{totalCount}
              </Tag>
            )}
          </Space>
        );
      },
      key: 'translation',
      width: 300,
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
                  保存
                </Button>
                <Button size="small" onClick={handleCancel}>
                  取消
                </Button>
              </Space>
            </Space>
          );
        }
        const translated = isTranslated(record);
        return (
          <div onClick={() => handleEdit(record)} style={{ cursor: 'pointer' }}>
            {translated ? (
              <Tooltip title="点击编辑">
                <span>{record.translations[selectedLang]}</span>
              </Tooltip>
            ) : (
              <Tooltip title="点击翻译">
                <span style={{ color: '#faad14', fontStyle: 'italic' }}>未翻译</span>
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_: any, record: TranslationEntry) =>
        isTranslated(record) ? (
          <Tag color="green">已翻译</Tag>
        ) : (
          <Tag color="orange">待翻译</Tag>
        ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_: any, record: TranslationEntry) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          {!isTranslated(record) && (
            <Button
              type="link"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleMarkComplete(record)}
            >
              标记完成
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          翻译工作台
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加翻译条目
        </Button>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Select
          value={selectedLang}
          onChange={setSelectedLang}
          style={{ width: 180 }}
          placeholder="选择目标语言"
        >
          {languages.map((l) => (
            <Option key={l.code} value={l.code}>
              {l.nativeName} ({l.code})
            </Option>
          ))}
        </Select>

        <Select
          value={selectedNamespace || undefined}
          onChange={(v) => setSelectedNamespace(v || '')}
          style={{ width: 150 }}
          placeholder="命名空间"
          allowClear
        >
          {namespaces.map((ns) => (
            <Option key={ns} value={ns}>
              {ns}
            </Option>
          ))}
        </Select>

        <Select
          value={filterStatus}
          onChange={setFilterStatus}
          style={{ width: 150 }}
          prefix={<FilterOutlined />}
        >
          <Option value="all">全部</Option>
          <Option value="translated">已翻译</Option>
          <Option value="untranslated">待翻译</Option>
        </Select>

        <Input.Search
          placeholder="搜索键名或内容"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onSearch={(v) => setSearchText(v)}
          style={{ width: 250 }}
          allowClear
        />
      </div>

      <Table
        columns={columns}
        dataSource={translations}
        rowKey="key"
        loading={loading}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        locale={{
          emptyText: <Empty description="暂无翻译条目" />,
        }}
      />

      <Modal
        title="添加翻译条目"
        open={modalOpen}
        onOk={handleAddSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="key"
            label="翻译键名"
            rules={[{ required: true, message: '请输入翻译键名' }]}
          >
            <Input placeholder="例如：greeting.morning" />
          </Form.Item>
          <Form.Item
            name="namespace"
            label="命名空间"
            initialValue="common"
          >
            <Input placeholder="例如：common" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input placeholder="可选，描述此翻译的用途" />
          </Form.Item>
          <Form.Item name="translation" label={`翻译内容 (${selectedLang})`}>
            <TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
