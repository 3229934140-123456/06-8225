import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Switch,
  Progress,
  Tag,
  Tooltip,
  Popconfirm,
  message,
  Typography,
} from 'antd';
import { PlusOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import type { LanguageWithProgress } from '../types';
import { languagesApi } from '../services/api';
import ImportExportModal from '../components/ImportExportModal';

const { Title } = Typography;

interface FormValues {
  code: string;
  name: string;
  nativeName: string;
  isDefault: boolean;
}

export default function LanguagesPage() {
  const [languages, setLanguages] = useState<LanguageWithProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLang, setEditingLang] = useState<LanguageWithProgress | null>(null);
  const [form] = Form.useForm<FormValues>();
  const [ioModalOpen, setIoModalOpen] = useState(false);
  const [ioModalLang, setIoModalLang] = useState<string>('');

  const fetchLanguages = async () => {
    setLoading(true);
    try {
      const data = await languagesApi.getAll();
      setLanguages(data);
    } catch (error: any) {
      message.error(error.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLanguages();
  }, []);

  const handleAdd = () => {
    setEditingLang(null);
    form.resetFields();
    form.setFieldsValue({ isDefault: false });
    setModalOpen(true);
  };

  const handleEdit = (lang: LanguageWithProgress) => {
    setEditingLang(lang);
    form.setFieldsValue({
      code: lang.code,
      name: lang.name,
      nativeName: lang.nativeName,
      isDefault: lang.isDefault,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingLang) {
        await languagesApi.update(editingLang.code, values);
        message.success('更新成功');
      } else {
        await languagesApi.create(values);
        message.success('创建成功');
      }
      setModalOpen(false);
      fetchLanguages();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const handleToggle = async (lang: LanguageWithProgress, enabled: boolean) => {
    try {
      await languagesApi.update(lang.code, { isEnabled: enabled });
      message.success(enabled ? '已启用' : '已禁用');
      fetchLanguages();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const handleDelete = async (lang: LanguageWithProgress) => {
    try {
      await languagesApi.remove(lang.code);
      message.success('删除成功');
      fetchLanguages();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const handleSetDefault = async (lang: LanguageWithProgress) => {
    try {
      await languagesApi.update(lang.code, { isDefault: true });
      message.success('已设为默认语言');
      fetchLanguages();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const handleImportExport = (lang: LanguageWithProgress) => {
    setIoModalLang(lang.code);
    setIoModalOpen(true);
  };

  const columns = [
    {
      title: '语言编码',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (code: string) => <code>{code}</code>,
    },
    {
      title: '英文名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '原生名称',
      dataIndex: 'nativeName',
      key: 'nativeName',
      width: 150,
    },
    {
      title: '翻译进度',
      key: 'progress',
      width: 250,
      render: (_: any, record: LanguageWithProgress) => {
        const { progress } = record;
        const status =
          progress.percentage === 100
            ? 'success'
            : progress.percentage >= 50
            ? 'active'
            : 'exception';
        return (
          <Tooltip title={`${progress.translated} / ${progress.total} 条已翻译`}>
            <Progress
              percent={progress.percentage}
              status={status as any}
              size="small"
            />
          </Tooltip>
        );
      },
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_: any, record: LanguageWithProgress) => (
        <Space>
          {record.isDefault && <Tag color="gold">默认</Tag>}
          {record.isEnabled ? (
            <Tag color="green">已启用</Tag>
          ) : (
            <Tag color="default">已禁用</Tag>
          )}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 320,
      render: (_: any, record: LanguageWithProgress) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => handleImportExport(record)}
          >
            导入/导出
          </Button>
          {!record.isDefault && (
            <Button
              type="link"
              size="small"
              onClick={() => handleSetDefault(record)}
            >
              设为默认
            </Button>
          )}
          <Switch
            size="small"
            checked={record.isEnabled}
            onChange={(checked) => handleToggle(record, checked)}
          />
          {!record.isDefault && (
            <Popconfirm
              title="确定删除此语言？"
              description="删除后该语言的翻译数据将保留，但语言配置将被移除。"
              onConfirm={() => handleDelete(record)}
            >
              <Button type="link" size="small" danger>
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          语言管理
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加语言
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={languages}
        rowKey="code"
        loading={loading}
      />

      <Modal
        title={editingLang ? '编辑语言' : '添加语言'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="code"
            label="语言编码"
            rules={[
              { required: true, message: '请输入语言编码' },
              { pattern: /^[a-z]{2}-[A-Z]{2}$/, message: '格式如：zh-CN, en-US' },
            ]}
          >
            <Input placeholder="例如：zh-CN" disabled={!!editingLang} />
          </Form.Item>
          <Form.Item
            name="name"
            label="英文名称"
            rules={[{ required: true, message: '请输入英文名称' }]}
          >
            <Input placeholder="例如：Chinese" />
          </Form.Item>
          <Form.Item
            name="nativeName"
            label="原生名称"
            rules={[{ required: true, message: '请输入原生名称' }]}
          >
            <Input placeholder="例如：简体中文" />
          </Form.Item>
          <Form.Item name="isDefault" label="设为默认语言" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <ImportExportModal
        open={ioModalOpen}
        langCode={ioModalLang}
        onClose={() => setIoModalOpen(false)}
        onSuccess={fetchLanguages}
      />
    </div>
  );
}
