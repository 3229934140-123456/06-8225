import { Card, Typography, Space, Tag, Button, Divider, Alert, Row, Col } from 'antd';
import { useI18n } from '../i18n/I18nProvider';

const { Title, Paragraph, Text } = Typography;

export default function DemoPage() {
  const { t, isFallback, locale, defaultLocale, setLocale, languages, isLoading } = useI18n();

  const demoKeys = [
    'welcome',
    'home',
    'settings',
    'save',
    'cancel',
    'dashboard.title',
    'dashboard.totalUsers',
    'greeting.morning',
    'greeting.afternoon',
    'greeting.evening',
  ];

  return (
    <div>
      <Title level={4}>多语言演示页面</Title>

      <Alert
        message="功能说明"
        description={
          <div>
            <p>本页面演示多语言系统的核心功能：</p>
            <ul>
              <li>根据浏览器语言或手动切换加载对应语言包</li>
              <li>翻译缺失时自动 fallback 到默认语言（{defaultLocale}）</li>
              <li>支持动态合并基础语言包和差异语言包</li>
            </ul>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card title="语言切换" style={{ marginBottom: 24 }}>
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
          当前语言: <Text strong>{locale}</Text>
          ，默认语言: <Text strong>{defaultLocale}</Text>
        </Paragraph>
      </Card>

      <Card title="翻译展示（含 Fallback 标识）">
        <Row gutter={[16, 16]}>
          {demoKeys.map((key) => (
            <Col span={12} key={key}>
              <Card size="small" title={<code>{key}</code>}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text type="secondary">翻译结果：</Text>
                    <br />
                    {isFallback(key) ? (
                      <span className="fallback-text">{t(key)}</span>
                    ) : (
                      <Text strong>{t(key)}</Text>
                    )}
                  </div>
                  {isFallback(key) && (
                    <Tag color="orange">Fallback 到默认语言</Tag>
                  )}
                  {!isFallback(key) && <Tag color="green">已翻译</Tag>}
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Divider />

      <Card title="带参数的翻译示例">
        <Paragraph>
          支持插值参数，例如 <code>{`{name}，欢迎回来`}</code>
        </Paragraph>
        <Space direction="vertical">
          <div>
            <Text type="secondary">无参数示例 (welcome):</Text>
            <br />
            <Text strong>{t('welcome')}</Text>
          </div>
          <div>
            <Text type="secondary">模拟带参数 (假设模板为 "你好，&#123;name&#125;"):</Text>
            <br />
            <Text strong>{t('welcome', { name: '张三' })}</Text>
          </div>
        </Space>
      </Card>
    </div>
  );
}
