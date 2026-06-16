import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Popconfirm,
  message,
  Typography,
  Tag,
  List,
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ContentType, ContentField, FieldType } from '../types';
import { contentTypesApi } from '../services/api';
import { useI18n } from '../i18n/I18nProvider';

const { Title } = Typography;
const { Option } = Select;

export default function ContentTypesPage() {
  const { t } = useI18n();
  const [data, setData] = useState<ContentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ContentType | null>(null);
  const [form] = Form.useForm();

  const fetch = async () => {
    setLoading(true);
    try {
      setData(await contentTypesApi.getAll());
    } catch (err: any) {
      message.error(t('common.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const handleAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ fields: [{ key: '', label: '', type: 'text', translatable: true, required: false }] });
    setModalOpen(true);
  };

  const handleEdit = (record: ContentType) => {
    setEditing(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      fields: record.fields,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await contentTypesApi.update(editing.id, values);
      } else {
        await contentTypesApi.create(values);
      }
      message.success(t('common.operationSuccess'));
      setModalOpen(false);
      fetch();
    } catch (err: any) {
      message.error(t('common.operationFailed'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await contentTypesApi.remove(id);
      message.success(t('common.operationSuccess'));
      fetch();
    } catch (err: any) {
      message.error(t('common.operationFailed'));
    }
  };

  const fieldTypeLabel = (type: FieldType) => {
    const map: Record<FieldType, string> = {
      text: t('contentType.fieldTypeText'),
      richtext: t('contentType.fieldTypeRichText'),
      image: t('contentType.fieldTypeImage'),
      date: t('contentType.fieldTypeDate'),
      number: t('contentType.fieldTypeNumber'),
    };
    return map[type];
  };

  const columns = [
    {
      title: t('contentType.name'),
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: t('contentType.description'),
      dataIndex: 'description',
      key: 'description',
      width: 200,
      ellipsis: true,
    },
    {
      title: t('contentType.fields'),
      key: 'fields',
      render: (_: any, record: ContentType) => (
        <List
          size="small"
          dataSource={record.fields}
          renderItem={(f: ContentField) => (
            <List.Item>
              <Space>
                <code>{f.key}</code>
                <Tag>{f.label}</Tag>
                <Tag color="blue">{fieldTypeLabel(f.type)}</Tag>
                {f.translatable && <Tag color="green">{t('contentType.translatable')}</Tag>}
                {f.required && <Tag color="red">{t('contentType.required')}</Tag>}
              </Space>
            </List.Item>
          )}
        />
      ),
    },
    {
      title: t('language.actions'),
      key: 'actions',
      width: 150,
      render: (_: any, record: ContentType) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleEdit(record)}>
            {t('common.edit')}
          </Button>
          <Popconfirm
            title={t('common.confirm')}
            okText={t('common.ok')}
            cancelText={t('common.cancel')}
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" size="small" danger>
              {t('common.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>{t('contentType.management')}</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          {t('common.add')}
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={editing ? t('contentType.editTitle') : t('contentType.addTitle')}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText={t('common.ok')}
        cancelText={t('common.cancel')}
        destroyOnHidden
        width={720}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label={t('contentType.name')}
            rules={[{ required: true, message: t('contentType.name') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label={t('contentType.description')}>
            <Input />
          </Form.Item>
          <Form.Item label={t('contentType.fields')}>
            <Form.List name="fields">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item
                        {...restField}
                        name={[name, 'key']}
                        rules={[{ required: true, message: t('contentType.fieldKey') }]}
                        noStyle
                      >
                        <Input placeholder={t('contentType.fieldKey')} style={{ width: 140 }} />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'label']}
                        rules={[{ required: true, message: t('contentType.fieldLabel') }]}
                        noStyle
                      >
                        <Input placeholder={t('contentType.fieldLabel')} style={{ width: 140 }} />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'type']}
                        initialValue="text"
                        noStyle
                      >
                        <Select style={{ width: 140 }}>
                          <Option value="text">{t('contentType.fieldTypeText')}</Option>
                          <Option value="richtext">{t('contentType.fieldTypeRichText')}</Option>
                          <Option value="image">{t('contentType.fieldTypeImage')}</Option>
                          <Option value="date">{t('contentType.fieldTypeDate')}</Option>
                          <Option value="number">{t('contentType.fieldTypeNumber')}</Option>
                        </Select>
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'translatable']}
                        valuePropName="checked"
                        initialValue={true}
                        noStyle
                      >
                        <Switch checkedChildren={t('contentType.translatable')} unCheckedChildren={t('contentType.translatable')} />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'required']}
                        valuePropName="checked"
                        initialValue={false}
                        noStyle
                      >
                        <Switch checkedChildren={t('contentType.required')} unCheckedChildren={t('contentType.required')} />
                      </Form.Item>
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(name)}
                      />
                    </Space>
                  ))}
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    {t('contentType.addField')}
                  </Button>
                </>
              )}
            </Form.List>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
