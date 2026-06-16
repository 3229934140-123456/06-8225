import { Card, Typography, Space, Tag, Button, Alert, Row, Col } from 'antd';
import { useI18n } from '../i18n/I18nProvider';
import type { KeySource } from '../types';

const { Title, Paragraph, Text } = Typography;

const sourceColorMap: Record<KeySource, string> = {
  default: 'blue',
  diff: 'green',
  fallback: 'orange',
};

const sourceLabelKeyMap: Record<KeySource, string> = {
  default: 'language.default',
  diff: 'demo.fromDiff',
  fallback: 'demo.fromFallback',
};

export default function DemoPage() {
  const { t, getSource, locale, defaultLocale, setLocale, languages, isLoading } = useI18n();

  const demoKeys = [
    'welcome',
    'home',
    'settings',
    'dashboard.title',
    'dashboard.totalUsers',
    'greeting.morning',
    'greeting.afternoon',
    'greeting.evening',
  ];

  const isDefaultLang = locale === defaultLocale;

  return (
    <div>
      <Title level={4}>{t('demo.page')}</Title>

      <Alert
        message={t('demo.featureInfo')}
        description={
          <div>
            <ul>
              <li>{t('demo.featureDesc1')}</li>
              <li>{t('demo.featureDesc2')}（{defaultLocale}）</li>
              <li>{t('demo.featureDesc3')}</li>
            </ul>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card title={t('demo.langSwitch')} style={{ marginBottom: 24 }}>
        <Space wrap>
          {languages.map((lang) => (
            <Button
              key={lang.code}
              type={locale === lang.code ? 'primary' : 'default'}
              onClick={() => setLocale(lang.code)}
              loading={isLoading}
            >
              {lang.nativeName} ({lang.code})
            </Button>
          ))}
        </Space>
        <Paragraph style={{ marginTop: 16, marginBottom: 0 }}>
          {t('demo.currentLang')}: <Text strong>{locale}</Text>
          ，{t('demo.defaultLang')}: <Text strong>{defaultLocale}</Text>
        </Paragraph>
      </Card>

      <Card title={t('demo.translationDisplay')} style={{ marginBottom: 24 }}>
        {!isDefaultLang && (
          <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
            <Tag color="green">{t('demo.fromDiff')}</Tag>
            <Tag color="orange">{t('demo.fromFallback')}</Tag>
            <Tag color="blue">{t('language.default')}</Tag>
          </div>
        )}
        <Row gutter={[16, 16]}>
          {demoKeys.map((key) => {
            const source = getSource(key);
            const color = sourceColorMap[source];
            const label = t(sourceLabelKeyMap[source]);

            return (
              <Col span={12} key={key}>
                <Card size="small" title={<code>{key}</code>}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text type="secondary">{t('demo.translationResult')}：</Text>
                      <br />
                      <Text strong style={{ fontSize: 15 }}>{t(key)}</Text>
                    </div>
                    {!isDefaultLang && (
                      <Tag color={color}>{label}</Tag>
                    )}
                  </Space>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Card>

      <Card title={t('demo.paramExample')}>
        <Paragraph>
          {t('demo.featureDesc3')}
        </Paragraph>
        <Space direction="vertical">
          <div>
            <Text type="secondary">{t('demo.noParam')} (welcome):</Text>
            <br />
            <Text strong>{t('welcome')}</Text>
          </div>
          <div>
            <Text type="secondary">{t('demo.withParam')}:</Text>
            <br />
            <Text strong>{t('welcome', { name: 'Trae' })}</Text>
          </div>
        </Space>
      </Card>
    </div>
  );
}
