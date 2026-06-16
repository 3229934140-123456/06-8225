import { useState, useRef } from 'react';
import { Modal, Tabs, Button, Upload, message, Space, Select, Typography } from 'antd';
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { ioApi } from '../services/api';

const { Text } = Typography;
const { Option } = Select;

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
  const [activeTab, setActiveTab] = useState<string>('export');
  const [exportFormat, setExportFormat] = useState<'nested' | 'flat'>('nested');
  const [importFile, setImportFile] = useState<UploadFile | null>(null);
  const [mergeMode, setMergeMode] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const url = ioApi.export(langCode, exportFormat);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${langCode}.json`;
    link.click();
    message.success('导出成功');
  };

  const handleImport = async () => {
    if (!importFile || !importFile.originFileObj) {
      message.error('请选择文件');
      return;
    }

    setLoading(true);
    try {
      const result = await ioApi.import(langCode, importFile.originFileObj, mergeMode);
      message.success(
        `导入成功：新增 ${result.added} 条，更新 ${result.updated} 条`
      );
      onSuccess?.();
      onClose();
    } catch (error: any) {
      message.error(error.message || '导入失败');
    } finally {
      setLoading(false);
    }
  };

  const tabItems = [
    {
      key: 'export',
      label: '导出',
      children: (
        <div style={{ padding: '16px 0' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text type="secondary">导出格式：</Text>
              <Select
                value={exportFormat}
                onChange={setExportFormat as any}
                style={{ width: 200, marginLeft: 12 }}
              >
                <Option value="nested">嵌套结构 (nested)</Option>
                <Option value="flat">扁平结构 (flat)</Option>
              </Select>
            </div>
            <div style={{ color: '#999', fontSize: 12 }}>
              <p>嵌套结构示例：</p>
              <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
{`{
  "greeting": {
    "morning": "早上好"
  }
}`}
              </pre>
              <p>扁平结构示例：</p>
              <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
{`{
  "greeting.morning": "早上好"
}`}
              </pre>
            </div>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleExport}
            >
              导出 {langCode}.json
            </Button>
          </Space>
        </div>
      ),
    },
    {
      key: 'import',
      label: '导入',
      children: (
        <div style={{ padding: '16px 0' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text type="secondary">导入模式：</Text>
              <Select
                value={mergeMode}
                onChange={setMergeMode}
                style={{ width: 200, marginLeft: 12 }}
              >
                <Option value={true}>合并模式（保留现有翻译）</Option>
                <Option value={false}>覆盖模式（替换全部翻译）</Option>
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
              <Button icon={<UploadOutlined />}>选择 JSON 文件</Button>
            </Upload>
            {importFile && (
              <Text type="success">已选择：{importFile.name}</Text>
            )}
            <Button
              type="primary"
              onClick={handleImport}
              loading={loading}
              disabled={!importFile}
            >
              开始导入
            </Button>
          </Space>
        </div>
      ),
    },
  ];

  return (
    <Modal
      title={`语言 ${langCode} - 导入/导出`}
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
