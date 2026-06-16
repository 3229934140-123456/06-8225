import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Select,
  Tag,
  Popconfirm,
  Modal,
  Form,
  Input,
  message,
  Typography,
  List,
  Collapse,
} from 'antd';
import { PlusOutlined, HistoryOutlined } from '@ant-design/icons';
import type { LocaleBundleVersion, Language } from '../types';
import { versionsApi, languagesApi } from '../services/api';
import { useI18n } from '../i18n/I18nProvider';

const { Title, Text } = Typography;

export default function VersionsPage() {
  const { t, locale } = useI18n();
  const [data, setData] = useState<LocaleBundleVersion[]>([]);
  const [langs, setLangs] = useState<Language[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterLang, setFilterLang] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetch = async () => {
    setLoading(true);
    try {
      const [list, langList] = await Promise.all([
        versionsApi.getAll(filterLang || undefined),
        languagesApi.getAll(),
      ]);
      setData(list);
      setLangs(langList.filter((l: any) => l.isEnabled));
    } catch (err) {
      message.error(t('common.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [filterLang, t]);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      await versionsApi.create({
        lang: values.lang || filterLang || locale,
        description: values.description,
      });
      message.success(t('common.operationSuccess'));
      setModalOpen(false);
      form.resetFields();
      fetch();
    } catch (err) {
      message.error(t('common.operationFailed'));
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await versionsApi.publish(id);
      message.success(t('common.operationSuccess'));
      fetch();
    } catch (err) {
      message.error(t('common.operationFailed'));
    }
  };

  const handleRollback = async (id: string) => {
    try {
      await versionsApi.rollback(id);
      message.success(t('common.operationSuccess'));
      fetch();
    } catch (err) {
      message.error(t('common.operationFailed'));
    }
  };

  const getLangLabel = (code: string) =>
    langs.find((l) => l.code === code)?.nativeName || code;

  const changeTag = (change: any) => {
    if (!change.oldValue && change.newValue) {
      return <Tag color="green">{t('version.changeAdded')}</Tag>;
    }
    if (change.oldValue && !change.newValue) {
      return <Tag color="red">{t('version.changeRemoved')}</Tag>;
    }
    return <Tag color="orange">{t('version.changeModified')}</Tag>;
  };

  const columns = [
    {
      title: t('version.version'),
      dataIndex: 'version',
      key: 'version',
      width: 160,
      render: (v: string, record: LocaleBundleVersion) => (
        <Space>
          <Text strong>{v}</Text>
          {record.isCurrent && <Tag color="gold">{t('version.current')}</Tag>}
        </Space>
      ),
    },
    {
      title: t('version.lang'),
      dataIndex: 'lang',
      key: 'lang',
      width: 120,
      render: (code: string) => <Tag color="blue">{getLangLabel(code)}</Tag>,
    },
    {
      title: t('version.description'),
      dataIndex: 'description',
      key: 'description',
      width: 200,
      ellipsis: true,
    },
    {
      title: t('version.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: t('version.createdBy'),
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 100,
    },
    {
      title: t('version.publishedAt'),
      key: 'published',
      width: 170,
      render: (_: any, record: LocaleBundleVersion) =>
        record.publishedAt ? new Date(record.publishedAt).toLocaleString() : '-',
    },
    {
      title: t('version.changes'),
      key: 'changes',
      width: 120,
      render: (_: any, record: LocaleBundleVersion) => (
        <Tag>{record.changes.length}</Tag>
      ),
    },
    {
      title: t('language.actions'),
      key: 'actions',
      width: 260,
      render: (_: any, record: LocaleBundleVersion) => (
        <Space size="small">
          {!record.isCurrent && (
            <>
              <Popconfirm
                title={t('common.confirm')}
                okText={t('common.ok')}
                cancelText={t('common.cancel')}
                onConfirm={() => handlePublish(record.id)}
              >
                <Button type="link" size="small">{t('version.publish')}</Button>
              </Popconfirm>
              <Popconfirm
                title={t('common.confirm')}
                okText={t('common.ok')}
                cancelText={t('common.cancel')}
                onConfirm={() => handleRollback(record.id)}
              >
                <Button type="link" size="small" danger>{t('version.rollback')}</Button>
              </Popconfirm>
            </>
          )}
          {record.isCurrent && <Tag color="gold">{t('version.current')}</Tag>}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>{t('version.management')}</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          {t('version.createSnapshot')}
        </Button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Select
          placeholder={t('version.lang')}
          style={{ width: 180 }}
          allowClear
          value={filterLang || undefined}
          onChange={(v) => setFilterLang(v || '')}
        >
          {langs.map((l) => (
            <Select.Option key={l.code} value={l.code}>{l.nativeName}</Select.Option>
          ))}
        </Select>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        expandable={{
          expandedRowRender: (record) => (
            <Collapse
              items={[
                {
                  key: 'changes',
                  label: (
                    <Space>
                      <HistoryOutlined />
                      {t('version.changes')} ({record.changes.length})
                    </Space>
                  ),
                  children: (
                    <List
                      size="small"
                      dataSource={record.changes}
                      locale={{ emptyText: t('common.noData') }}
                      renderItem={(c) => (
                        <List.Item>
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <Space>
                              {changeTag(c)}
                              <code>{c.key}</code>
                              <Text type="secondary">
                                {new Date(c.changedAt).toLocaleString()} · {c.changedBy}
                              </Text>
                            </Space>
                            <div>
                              {c.oldValue && <div><Text type="secondary">- {c.oldValue}</Text></div>}
                              {c.newValue && <div><Text strong>+ {c.newValue}</Text></div>}
                            </div>
                          </Space>
                        </List.Item>
                      )}
                    />
                  ),
                },
              ]}
            />
          ),
        }}
      />

      <Modal
        title={t('version.createTitle')}
        open={modalOpen}
        onOk={handleCreate}
        onCancel={() => setModalOpen(false)}
        okText={t('common.ok')}
        cancelText={t('common.cancel')}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="lang"
            label={t('version.lang')}
            rules={[{ required: true, message: t('version.lang') }]}
            initialValue={filterLang || locale}
          >
            <Select>
              {langs.map((l) => (
                <Select.Option key={l.code} value={l.code}>{l.nativeName}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="description" label={t('version.description')}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
