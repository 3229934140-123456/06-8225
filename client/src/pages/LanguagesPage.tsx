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
import { PlusOutlined } from '@ant-design/icons';
import type { LanguageWithProgress } from '../types';
import { languagesApi } from '../services/api';
import ImportExportModal from '../components/ImportExportModal';
import { useI18n } from '../i18n/I18nProvider';

const { Title } = Typography;

interface FormValues {
  code: string;
  name: string;
  nativeName: string;
  isDefault: boolean;
}

export default function LanguagesPage() {
  const { t } = useI18n();
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
      message.error(t('common.loadFailed'));
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
        message.success(t('common.operationSuccess'));
      } else {
        await languagesApi.create(values);
        message.success(t('common.operationSuccess'));
      }
      setModalOpen(false);
      fetchLanguages();
    } catch (error: any) {
      message.error(t('common.operationFailed'));
    }
  };

  const handleToggle = async (lang: LanguageWithProgress, enabled: boolean) => {
    try {
      await languagesApi.update(lang.code, { isEnabled: enabled });
      message.success(t('common.operationSuccess'));
      fetchLanguages();
    } catch (error: any) {
      message.error(t('common.operationFailed'));
    }
  };

  const handleDelete = async (lang: LanguageWithProgress) => {
    try {
      await languagesApi.remove(lang.code);
      message.success(t('common.operationSuccess'));
      fetchLanguages();
    } catch (error: any) {
      message.error(t('common.operationFailed'));
    }
  };

  const handleSetDefault = async (lang: LanguageWithProgress) => {
    try {
      await languagesApi.update(lang.code, { isDefault: true });
      message.success(t('common.operationSuccess'));
      fetchLanguages();
    } catch (error: any) {
      message.error(t('common.operationFailed'));
    }
  };

  const handleImportExport = (lang: LanguageWithProgress) => {
    setIoModalLang(lang.code);
    setIoModalOpen(true);
  };

  const columns = [
    {
      title: t('language.code'),
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (code: string) => <code>{code}</code>,
    },
    {
      title: t('language.name'),
      dataIndex: 'name',
      key: 'name',
      width: 140,
    },
    {
      title: t('language.nativeName'),
      dataIndex: 'nativeName',
      key: 'nativeName',
      width: 140,
    },
    {
      title: t('language.progress'),
      key: 'progress',
      width: 300,
      render: (_: any, record: LanguageWithProgress) => {
        const { progress } = record;
        const translatedStatus =
          progress.percentage === 100
            ? 'success'
            : progress.percentage >= 50
            ? 'active'
            : 'exception';
        const completedStatus =
          progress.completedPercentage === 100
            ? 'success'
            : progress.completedPercentage >= 50
            ? 'active'
            : 'exception';
        return (
          <div>
            <Tooltip title={`${t('translation.filled')}: ${progress.translated} / ${progress.total}`}>
              <Progress
                percent={progress.percentage}
                status={translatedStatus as any}
                size="small"
                format={(p) => `${t('translation.filled')} ${p}%`}
              />
            </Tooltip>
            <Tooltip title={`${t('translation.completed')}: ${progress.completed} / ${progress.total}`}>
              <Progress
                percent={progress.completedPercentage}
                status={completedStatus as any}
                size="small"
                strokeColor="#52c41a"
                format={(p) => `${t('translation.completed')} ${p}%`}
              />
            </Tooltip>
          </div>
        );
      },
    },
    {
      title: t('language.status'),
      key: 'status',
      width: 110,
      render: (_: any, record: LanguageWithProgress) => (
        <Space>
          {record.isDefault && <Tag color="gold">{t('language.default')}</Tag>}
          {record.isEnabled ? (
            <Tag color="green">{t('language.enabled')}</Tag>
          ) : (
            <Tag color="default">{t('language.disabled')}</Tag>
          )}
        </Space>
      ),
    },
    {
      title: t('language.actions'),
      key: 'actions',
      width: 320,
      render: (_: any, record: LanguageWithProgress) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleEdit(record)}>
            {t('language.edit')}
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => handleImportExport(record)}
          >
            {t('language.importExport')}
          </Button>
          {!record.isDefault && (
            <Button
              type="link"
              size="small"
              onClick={() => handleSetDefault(record)}
            >
              {t('language.setDefault')}
            </Button>
          )}
          <Switch
            size="small"
            checked={record.isEnabled}
            onChange={(checked) => handleToggle(record, checked)}
          />
          {!record.isDefault && (
            <Popconfirm
              title={t('common.confirm')}
              onConfirm={() => handleDelete(record)}
            >
              <Button type="link" size="small" danger>
                {t('language.delete')}
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
          {t('language.management')}
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          {t('language.add')}
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={languages}
        rowKey="code"
        loading={loading}
      />

      <Modal
        title={editingLang ? t('language.editTitle') : t('language.addTitle')}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="code"
            label={t('language.code')}
            rules={[
              { required: true, message: t('language.code') },
              { pattern: /^[a-z]{2}-[A-Z]{2}$/, message: 'zh-CN, en-US' },
            ]}
          >
            <Input placeholder="zh-CN" disabled={!!editingLang} />
          </Form.Item>
          <Form.Item
            name="name"
            label={t('language.name')}
            rules={[{ required: true, message: t('language.name') }]}
          >
            <Input placeholder="Chinese" />
          </Form.Item>
          <Form.Item
            name="nativeName"
            label={t('language.nativeName')}
            rules={[{ required: true, message: t('language.nativeName') }]}
          >
            <Input placeholder="简体中文" />
          </Form.Item>
          <Form.Item name="isDefault" label={t('language.setDefault')} valuePropName="checked">
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
