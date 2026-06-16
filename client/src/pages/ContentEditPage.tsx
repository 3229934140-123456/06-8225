import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Button,
  Card,
  Space,
  Tabs,
  Input,
  DatePicker,
  InputNumber,
  Tag,
  Popconfirm,
  message,
  Typography,
  Alert,
  Row,
  Col,
  Empty,
  Select,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import type { Content, ContentType, ContentLanguageProgress } from '../types';
import { contentsApi, contentTypesApi, languagesApi } from '../services/api';
import { useI18n } from '../i18n/I18nProvider';

const { Title } = Typography;
const { TextArea } = Input;

export default function ContentEditPage() {
  const { t, locale } = useI18n();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isPreview = params.get('preview') === '1';
  const isNew = id === 'new';

  const [content, setContent] = useState<Content | null>(null);
  const [types, setTypes] = useState<ContentType[]>([]);
  const [langs, setLangs] = useState<any[]>([]);
  const [activeLang, setActiveLang] = useState<string>(locale);
  const [progress, setProgress] = useState<ContentLanguageProgress[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [typeList, langList] = await Promise.all([
          contentTypesApi.getAll(),
          languagesApi.getAll(),
        ]);
        setTypes(typeList);
        setLangs(langList.filter((l: any) => l.isEnabled));

        if (isNew) {
          if (typeList.length > 0) setSelectedTypeId(typeList[0].id);
        } else if (id) {
          const c = await contentsApi.get(id);
          setContent(c);
          setSelectedTypeId(c.typeId);
          setProgress(c.languageProgress || []);
        }
      } catch (err: any) {
        message.error(t('common.loadFailed'));
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, isNew, t]);

  const contentType = useMemo(
    () => types.find((t) => t.id === selectedTypeId),
    [types, selectedTypeId]
  );

  const missingLangs = progress.filter((p) => !p.filled);

  const handleFieldChange = (fieldKey: string, lang: string, value: string) => {
    if (!content) return;
    setContent({
      ...content,
      fields: {
        ...content.fields,
        [fieldKey]: {
          ...content.fields[fieldKey],
          [lang]: value,
        },
      },
    });
  };

  const handleSave = async (status: 'draft' | 'review' | 'published') => {
    if (!contentType) return;
    try {
      let payload: any = {
        typeId: selectedTypeId,
        fields: content?.fields || {},
        status,
      };
      if (isNew) {
        await contentsApi.create(payload);
      } else if (content) {
        await contentsApi.update(content.id, payload);
        if (status !== content.status) {
          await contentsApi.setStatus(content.id, status);
        }
      }
      message.success(t('common.operationSuccess'));
      navigate('/contents');
    } catch (err: any) {
      message.error(t('common.operationFailed'));
    }
  };

  const renderField = (field: any, lang: string, readonly = false) => {
    const value = content?.fields?.[field.key]?.[lang] || '';
    const style = readonly ? { background: '#f5f5f5' } : undefined;

    if (readonly) {
      if (field.type === 'richtext') {
        return <div dangerouslySetInnerHTML={{ __html: value }} />;
      }
      if (field.type === 'image' && value) {
        return <img src={value} alt="" style={{ maxWidth: '100%' }} />;
      }
      return <div>{value || '-'}</div>;
    }

    if (field.type === 'richtext') {
      return (
        <TextArea
          value={value}
          rows={6}
          onChange={(e) => handleFieldChange(field.key, lang, e.target.value)}
        />
      );
    }
    if (field.type === 'image') {
      return (
        <Input
          value={value}
          placeholder="https://..."
          onChange={(e) => handleFieldChange(field.key, lang, e.target.value)}
        />
      );
    }
    if (field.type === 'date') {
      return (
        <Input
          type="date"
          value={value}
          onChange={(e) => handleFieldChange(field.key, lang, e.target.value)}
        />
      );
    }
    if (field.type === 'number') {
      return (
        <InputNumber
          style={{ width: '100%' }}
          value={value ? Number(value) : undefined}
          onChange={(v) =>
            handleFieldChange(field.key, lang, v !== null && v !== undefined ? String(v) : '')
          }
        />
      );
    }
    return (
      <Input
        value={value}
        onChange={(e) => handleFieldChange(field.key, lang, e.target.value)}
      />
    );
  };

  if (loading) return <div>{t('common.loadFailed')}</div>;

  if (!isNew && !content) {
    return (
      <Empty description={t('common.noData')} />
    );
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/contents')}>
          {t('common.back')}
        </Button>
        <Title level={4} style={{ margin: 0 }}>
          {isPreview
            ? t('content.previewTitle')
            : isNew
            ? t('content.addTitle')
            : t('content.editTitle')}
        </Title>
      </Space>

      {isNew && (
        <Card style={{ marginBottom: 16 }}>
          <Space>
            <span>{t('content.type')}:</span>
            <Select
              value={selectedTypeId}
              onChange={setSelectedTypeId}
              style={{ width: 200 }}
            >
              {types.map((t) => (
                <Select.Option key={t.id} value={t.id}>{t.name}</Select.Option>
              ))}
            </Select>
          </Space>
        </Card>
      )}

      {contentType && missingLangs.length > 0 && (
        <Alert
          style={{ marginBottom: 16 }}
          type="warning"
          showIcon
          message={t('content.publishWarning')}
          description={
            <Space wrap>
              {missingLangs.map((p) => (
                <Tag key={p.lang} color="orange">
                  {p.lang}: {p.missingFields.join(', ')}
                </Tag>
              ))}
            </Space>
          }
        />
      )}

      {contentType && (
        <>
          {isPreview ? (
            <Tabs
              activeKey={activeLang}
              onChange={setActiveLang}
              items={langs.map((l) => ({
                key: l.code,
                label: l.nativeName,
                children: (
                  <Card title={t('content.previewLang') + ': ' + l.nativeName}>
                    <Row gutter={[16, 16]}>
                      {contentType.fields.map((f) => (
                        <Col xs={24} key={f.key}>
                          <Typography.Title level={5} style={{ marginBottom: 4 }}>
                            {f.label}
                            {f.required && <span style={{ color: 'red' }}> *</span>}
                            {f.translatable && (
                              <Tag color="blue" style={{ marginLeft: 8 }}>
                                {t('contentType.translatable')}
                              </Tag>
                            )}
                          </Typography.Title>
                          {renderField(f, l.code, true)}
                        </Col>
                      ))}
                    </Row>
                  </Card>
                ),
              }))}
            />
          ) : (
            <Tabs
              activeKey={activeLang}
              onChange={setActiveLang}
              items={langs.map((l) => {
                const pg = progress.find((p) => p.lang === l.code);
                return {
                  key: l.code,
                  label: (
                    <Space>
                      {l.nativeName}
                      {pg && (
                        pg.filled ? (
                          <Tag color="green">{t('content.filled')}</Tag>
                        ) : (
                          <Tag color="orange">{t('content.missingFields')}</Tag>
                        )
                      )}
                    </Space>
                  ),
                  children: (
                    <Card>
                      <Row gutter={[16, 16]}>
                        {contentType.fields.map((f) => {
                          const nonTranslatable = !f.translatable;
                          const shouldShow = !nonTranslatable || l.isDefault || l.code === 'zh-CN';
                          return (
                            <Col xs={24} key={f.key}>
                              <Typography.Title level={5} style={{ marginBottom: 4 }}>
                                {f.label}
                                {f.required && <span style={{ color: 'red' }}> *</span>}
                                {f.translatable && (
                                  <Tag color="blue" style={{ marginLeft: 8 }}>
                                    {t('contentType.translatable')}
                                  </Tag>
                                )}
                                {nonTranslatable && (
                                  <Tag color="default" style={{ marginLeft: 8 }}>
                                    (shared)
                                  </Tag>
                                )}
                              </Typography.Title>
                              {renderField(f, nonTranslatable ? 'zh-CN' : l.code)}
                            </Col>
                          );
                        })}
                      </Row>
                    </Card>
                  ),
                };
              })}
            />
          )}

          {!isPreview && (
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Space>
                <Button onClick={() => navigate('/contents')}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={() => handleSave('draft')}>
                  {t('common.draft')}
                </Button>
                <Button onClick={() => handleSave('review')}>
                  {t('common.review')}
                </Button>
                <Popconfirm
                  title={t('content.publishWarning')}
                  okText={t('common.ok')}
                  cancelText={t('common.cancel')}
                  onConfirm={() => handleSave('published')}
                >
                  <Button type="primary">{t('common.publish')}</Button>
                </Popconfirm>
              </Space>
            </div>
          )}
        </>
      )}
    </div>
  );
}
