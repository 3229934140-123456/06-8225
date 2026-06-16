import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Layout, Menu, Select, Space, Typography } from 'antd';
import {
  GlobalOutlined,
  TranslationOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';
import { useI18n } from './i18n/I18nProvider';
import LanguagesPage from './pages/LanguagesPage';
import TranslationWorkbench from './pages/TranslationWorkbench';
import DemoPage from './pages/DemoPage';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

function App() {
  const { locale, setLocale, languages, t, isLoading } = useI18n();
  const location = useLocation();

  const menuItems = [
    {
      key: '/languages',
      icon: <GlobalOutlined />,
      label: <Link to="/languages">{t('language.management')}</Link>,
    },
    {
      key: '/translations',
      icon: <TranslationOutlined />,
      label: <Link to="/translations">{t('translation.workbench')}</Link>,
    },
    {
      key: '/demo',
      icon: <ExperimentOutlined />,
      label: <Link to="/demo">{t('demo.page')}</Link>,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#001529',
          padding: '0 24px',
        }}
      >
        <Title level={4} style={{ color: 'white', margin: 0, flex: 1 }}>
          {t('app.title')}
        </Title>
        <Space>
          <span style={{ color: 'white' }}>{t('language.switch')}:</span>
          <Select
            value={locale}
            onChange={setLocale}
            style={{ width: 150 }}
            loading={isLoading}
            options={languages.map((l) => ({
              value: l.code,
              label: l.nativeName,
            }))}
          />
        </Space>
      </Header>
      <Layout>
        <Sider width={220} theme="dark">
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            style={{ height: '100%', borderRight: 0 }}
          />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
              background: 'white',
              borderRadius: 8,
            }}
          >
            <Routes>
              <Route path="/" element={<LanguagesPage />} />
              <Route path="/languages" element={<LanguagesPage />} />
              <Route path="/translations" element={<TranslationWorkbench />} />
              <Route path="/demo" element={<DemoPage />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}

export default App;
