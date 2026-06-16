import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Space,
  Select,
  Tag,
  Popconfirm,
  message,
  Typography,
  Progress,
} from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import type { Content, ContentType } from '../types';
import { contentsApi, contentTypesApi } from '../services/api';
import { useI18n } from '../i18n/I18nProvider';

const { Title } = Typography;

export default function ContentsPage() {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const [data, setData] = useState<Content[]>([]);
  const [types, setTypes] = useState<ContentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const fetch = async () => {
    setLoading(true);
    try {
      const [list, typeList] = await Promise.all([
        contentsApi.getAll(),
        contentTypesApi.getAll(),
      ]);
      setData(list);
      setTypes(typeList);
    } catch (err) {
        message.error(t('common.loadFailed'));
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => { fetch(); }, []);

  const statusColor = (status: string) => {
    if (status === 'draft') return <Tag color="default">{t('content.statusDraft')}</Tag>;
    if (status === 'review') return <Tag color="orange">{t('content.statusReview')}</Tag>;
    if (status === 'published') return <Tag color="green">{t('content.statusPublished')}</Tag>;
    return status;
  };

  const handleDelete = async (id: string) => {
    try {
      await contentsApi.remove(id);
      message.success(t('common.operationSuccess'));
      fetch();
    } catch (err) {
      message.error(t('common.operationFailed'));
    }
  };

  const handleSetStatus = async (id: string, status: any) => {
    try {
      await contentsApi.setStatus(id, status);
      message.success(t('common.operationSuccess'));
      fetch();
    } catch (err) {
      message.error(t('common.operationFailed'));
    }
  };

  const getTitle = (c: Content) => {
    if (!c.fields || !c.fields.title) return `#${c.id}`;
    const v = c.fields.title[locale] || c.fields.title['zh-CN'];
    return v || `#${c.id}`;
  };

  const display = (c: Content) => {
    if (!c.languageProgress) return null;
    const total = c.languageProgress.length;
    const filled = c.languageProgress.filter((p) => p.filled).length;
    return (
      <Progress percent={Math.round((filled / total) * 100)} size="small" />
    );
  };

  const columns = [
    {
      title: t('content.title'),
      key: 'title',
      width: 220,
      render: (_: any, record: Content) => (
        <span>{getTitle(record)}</span>
      ),
    },
    {
      title: t('content.type'),
      dataIndex: 'typeName',
      key: 'typeName',
      width: 120,
      render: (name: string) => <Tag>{name}</Tag>,
    },
    {
      title: t('language.status'),
      key: 'status',
      width: 120,
      render: (_: any, record: Content) => statusColor(record.status),
    },
    {
      title: t('content.languageProgress'),
      key: 'langProgress',
      width: 180,
      render: (_: any, record: Content) => display(record),
    },
    {
      title: t('language.actions'),
      key: 'actions',
      width: 320,
      render: (_: any, record: Content) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/contents/${record.id}`)}
          >
            {t('common.edit')}
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/contents/${record.id}?preview=1`)}
          >
            {t('common.preview')}
          </Button>
          {record.status === 'draft' && (
            <Button type="link" size="small" onClick={() => handleSetStatus(record.id, 'review')}>
              {t('common.review')}
            </Button>
          )}
          {record.status === 'review' && (
            <Popconfirm
              title={t('content.publishWarning')}
              okText={t('common.ok')}
              cancelText={t('common.cancel')}
              onConfirm={() => handleSetStatus(record.id, 'published')}
            >
              <Button type="link" size="small">{t('common.publish')}</Button>
            </Popconfirm>
          )}
          <Popconfirm
            title={t('common.confirm')}
            okText={t('common.ok')}
            cancelText={t('common.cancel')}
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" size="small" danger>{t('common.delete')}</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>{t('content.management')}</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/contents/new')}
        >
          {t('common.add')}
        </Button>
      </div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
        <Select
          style={{ width: 160 }}
          placeholder={t('content.type')}
          allowClear
          value={filterType || undefined}
          onChange={(v) => setFilterType(v || '')}
        >
          {types.map((t) => (
            <Select.Option key={t.id} value={t.id}>{t.name}</Select.Option>
          ))}
        </Select>
        <Select
          style={{ width: 160 }}
          placeholder={t('language.status')}
          allowClear
          value={filterStatus || undefined}
          onChange={(v) => setFilterStatus(v || '')}
        >
          <Select.Option value="draft">{t('content.statusDraft')}</Select.Option>
          <Select.Option value="review">{t('content.statusReview')}</Select.Option>
          <Select.Option value="published">{t('content.statusPublished')}</Select.Option>
        </Select>
      </div>
      <Table
        columns={columns}
        dataSource={data.filter((c) => (!filterType || c.typeId === filterType) && (!filterStatus || c.status === filterStatus))}
        rowKey="id"
        loading={loading}
      />
    </div>
  );
}
