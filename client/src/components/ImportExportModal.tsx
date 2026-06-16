import { useState } from 'react';
import { Modal, Tabs, Button, Upload, message, Space, Select, Typography } from 'antd';
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { ioApi } from '../services/api';
import { useI18n } from '../i18n/I18nProvider';

const { Text } = Typography;

interface ImportExportModalProps {
  open: boolean;
  langCode: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ImportExportModal({
  open,
  langCode,
  onClose,
  onSuccess,
}: ImportExportModalProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<string>('export');
  const [exportFormat, setExportFormat] = useState<'nested' | 'flat'>('nested');
  const [importFile, setImportFile] = useState<UploadFile | null>(null);
  const [mergeMode, setMergeMode] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);

  const handleExport = () => {
    const url = ioApi.export(langCode, exportFormat);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${langCode}.json`;
    link.click();
    message.success(t('common.operationSuccess'));
  };

  const handleImport = async () => {
    if (!importFile || !importFile.originFileObj) {
      message.error(t('io.selectFile'));
      return;
    }

    setLoading(true);
    try {
      const result = await ioApi.import(langCode, importFile.originFileObj, mergeMode);
      message.success(t('common.operationSuccess'));
      onSuccess?.();
      onClose();
    } catch (error: any) {
      message.error(t('common.operationFailed'));
    } finally {
      setLoading(false);
    }
  };

  const tabItems = [
    {
      key: 'export',
      label: t('io.exportTitle'),
      children: (
        <div style={{ padding: '16px 0' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text type="secondary">{t('io.exportFormat')}：</Text>
              <Select
                value={exportFormat}
                onChange={setExportFormat as any}
                style={{ width: 200, marginLeft: 12 }}
              >
                <Select.Option value="nested">{t('io.nested')}</Select.Option>
                <Select.Option value="flat">{t('io.flat')}</Select.Option>
              </Select>
            </div>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleExport}
            >
              {t('io.exportTitle')} {langCode}.json
            </Button>
          </Space>
        </div>
      ),
    },
    {
      key: 'import',
      label: t('io.importTitle'),
      children: (
        <div style={{ padding: '16px 0' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text type="secondary">{t('io.importMode')}：</Text>
              <Select
                value={mergeMode}
                onChange={setMergeMode}
                style={{ width: 260, marginLeft: 12 }}
              >
                <Select.Option value={true}>{t('io.merge')}</Select.Option>
                <Select.Option value={false}>{t('io.overwrite')}</Select.Option>
              </Select>
            </div>
            <Upload
              beforeUpload={(file) => {
                setImportFile({
                  uid: file.uid,
                  name: file.name,
                  originFileObj: file,
                  status: 'done',
                });
                return false;
              }}
              maxCount={1}
              accept=".json"
              onRemove={() => setImportFile(null)}
            >
              <Button icon={<UploadOutlined />}>{t('io.selectFile')}</Button>
            </Upload>
            {importFile && (
              <Text type="success">{importFile.name}</Text>
            )}
            <Button
              type="primary"
              onClick={handleImport}
              loading={loading}
              disabled={!importFile}
            >
              {t('io.startImport')}
            </Button>
          </Space>
        </div>
      ),
    },
  ];

  return (
    <Modal
      title={`${t('io.title')} - ${langCode}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={520}
      destroyOnHidden
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />
    </Modal>
  );
}
