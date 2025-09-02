
<Modal,
  Form,
  Input,
  Button,
  Space,
  Card,
  Upload,
  message,
  Row,
  Col,
  Typography,
  Image,
  Divider,
  Progress,
  Table,
  Select
} from 'antd';
import { UploadOutlined, DeleteOutlined, EyeOutlined, PictureOutlined, EditOutlined } from '@ant-design/icons';
import { adminAPI } from '../utils/api';

const { Title, Text } = Typography;
const { Option } = Select;

const ThumbnailManager = ({ visible, onCancel, contentId, currentThumbnails = {}, onUpdate }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [ratioSpecs, setRatioSpecs] = useState({});
  const [thumbnails, setThumbnails] = useState({
    banner: '',
    landscape: '',
    portrait: '',
    square: ''
  });
  const [uploading, setUploading] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedUploadType, setSelectedUploadType] = useState('');
  const [uploadFile, setUploadFile] = useState(null);

  useEffect(() => {
    if (visible) {
      fetchThumbnailRatios();
      setThumbnails({
        banner: currentThumbnails.banner || '',
        landscape: currentThumbnails.landscape || '',
        portrait: currentThumbnails.portrait || '',
        square: currentThumbnails.square || ''
      });
    }
  }, [visible, currentThumbnails]);

  const fetchThumbnailRatios = async () => {
    try {
      const response = await adminAPI.getThumbnailRatios();
      if (response.data.success) {
        setRatioSpecs(response.data.ratios);
      }
    } catch (error) {
      console.error('Error fetching thumbnail ratios:', error);
    }
  };

  const handleThumbnailChange = (type, value) => {
    setThumbnails(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await adminAPI.updateContentThumbnails(contentId, thumbnails);
      message.success('Thumbnails updated successfully');
      onUpdate && onUpdate(thumbnails);
      onCancel();
    } catch (error) {
      console.error('Error updating thumbnails:', error);
      message.error('Failed to update thumbnails');
    } finally {
      setLoading(false);
    }
  };

  const getSignedUrl = async (fileName, fileType, fileSize) => {
    try {
      const response = await adminAPI.getSignedUrlForThumbnailUpload({
        fileName,
        fileType,
        fileSize
      });
      if (response.data.success) {
        return {
          signedUrl: response.data.signedUrl,
          publicUrl: response.data.publicUrl
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }
  };

  const handleFileUpload = async (file, type) => {
    setUploading(prev => ({ ...prev, [type]: true }));
    setUploadProgress(prev => ({ ...prev, [type]: 0 }));

    const fileName = `${type}_${Date.now()}_${file.name}`;
    
    const urlData = await getSignedUrl(fileName, file.type, file.size);
    if (!urlData) {
      message.error('Failed to get upload URL.');
      setUploading(prev => ({ ...prev, [type]: false }));
      return;
    }

    try {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentCompleted = Math.round((event.loaded * 100) / event.total);
          setUploadProgress(prev => ({ ...prev, [type]: percentCompleted }));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200 || xhr.status === 204) {
          handleThumbnailChange(type, urlData.publicUrl);
          message.success(`${type} uploaded successfully!`);
        } else {
          message.error(`Failed to upload ${type}. Status: ${xhr.status}`);
        }
        setUploading(prev => ({ ...prev, [type]: false }));
      });

      xhr.addEventListener('error', () => {
        message.error(`Failed to upload ${type}.`);
        setUploading(prev => ({ ...prev, [type]: false }));
      });

      xhr.open('PUT', urlData.signedUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);

    } catch (error) {
      console.error('Error uploading file:', error);
      message.error(`Failed to upload ${type}.`);
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const openUploadModal = () => {
    setUploadModalVisible(true);
    setSelectedUploadType('');
    setUploadFile(null);
  };

  const handleUploadModalOk = () => {
    if (!selectedUploadType) {
      message.error('Please select a thumbnail type');
      return;
    }
    if (!uploadFile) {
      message.error('Please select a file to upload');
      return;
    }

    handleFileUpload(uploadFile, selectedUploadType);
    setUploadModalVisible(false);
    setSelectedUploadType('');
    setUploadFile(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const columns = [
    {
      title: 'THUMBNAIL',
      dataIndex: 'thumbnail',
      key: 'thumbnail',
      width: 120,
      render: (_, record) => (
        <div style={{ width: 80, height: 60, border: '1px solid #d9d9d9', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
          {thumbnails[record.type] ? (
            <Image
              src={thumbnails[record.type]}
              alt={record.type}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RUG8A+5JwAAEkpJREFUeJzs2FVYVfccx/GX2ZAYsIJiBUNHjBGD3QWJDQqKBYJdBQ2iJAKCXQWJBYqCxE5N+a/8z/f8f/7/z/9/H9zW16+c9/P3/z73/9/f/v39/f0DQKH26HgQ="
            />
          ) : (
            <div style={{ 
              width: '100%', 
              height: '100%', 
              backgroundColor: '#f5f5f5', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '2px dashed #d9d9d9'
            }}>
              <PictureOutlined style={{ fontSize: '16px', color: '#999' }} />
            </div>
          )}
          
          {uploading[record.type] && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255,255,255,0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Progress 
                type="circle" 
                percent={uploadProgress[record.type]} 
                size={30}
                strokeWidth={8}
              />
            </div>
          )}
        </div>
      )
    },
    {
      title: 'TYPE',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <div>
          <div style={{ fontWeight: 500, textTransform: 'capitalize' }}>{type}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {ratioSpecs[type]?.ratio}
          </Text>
        </div>
      )
    },
    {
      title: 'SIZE',
      dataIndex: 'size',
      key: 'size',
      render: (_, record) => {
        const url = thumbnails[record.type];
        if (!url) return <Text type="secondary">-</Text>;
        
        // You can fetch actual file size via an API call if needed
        // For now, showing placeholder
        return <Text>{ratioSpecs[record.type]?.recommendedSize || '-'}</Text>;
      }
    },
    {
      title: 'ACTION',
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <Space>
          {thumbnails[record.type] && (
            <Button
              type="text"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => {
                Modal.info({
                  title: `${record.type.charAt(0).toUpperCase() + record.type.slice(1)} Preview`,
                  content: (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <Image
                        src={thumbnails[record.type]}
                        alt={`${record.type} thumbnail`}
                        style={{ maxWidth: '100%', maxHeight: '400px' }}
                      />
                    </div>
                  ),
                  width: 600,
                });
              }}
            />
          )}
          
          {thumbnails[record.type] && (
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => {
                const newUrl = prompt('Enter new URL:', thumbnails[record.type]);
                if (newUrl !== null) {
                  handleThumbnailChange(record.type, newUrl);
                }
              }}
            />
          )}
          
          {thumbnails[record.type] && (
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => handleThumbnailChange(record.type, '')}
            />
          )}
          
          <Button
            type="text"
            size="small"
            style={{ color: '#999' }}
          >
            ⋮
          </Button>
        </Space>
      )
    }
  ];

  const tableData = Object.keys(ratioSpecs).map(type => ({
    key: type,
    type,
    thumbnail: thumbnails[type],
  }));

  return (
    <>
      <Modal
        title="Upload Thumbnail"
        open={visible}
        onCancel={onCancel}
        width={800}
        footer={[
          <Button key="cancel" onClick={onCancel}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
            Update Thumbnails
          </Button>
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            Set your video thumbnail from your local storage images or you can download images and set it too.
          </Text>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={5} style={{ margin: 0 }}>Metadata</Title>
          <Button 
            type="primary" 
            icon={<UploadOutlined />}
            onClick={openUploadModal}
          >
            Upload File
          </Button>
        </div>

        <div style={{ marginBottom: 16, color: '#1890ff', cursor: 'pointer' }}>
          📎 Thumbnails
        </div>

        <Table
          columns={columns}
          dataSource={tableData}
          pagination={false}
          size="small"
          style={{ backgroundColor: '#fff' }}
        />
      </Modal>

      {/* Upload Modal */}
      <Modal
        title="Upload Thumbnail File"
        open={uploadModalVisible}
        onCancel={() => {
          setUploadModalVisible(false);
          setSelectedUploadType('');
          setUploadFile(null);
        }}
        onOk={handleUploadModalOk}
        okText="Upload"
        cancelText="Cancel"
        width={500}
      >
        <div style={{ marginBottom: 16 }}>
          <Text>Select thumbnail type and choose file to upload:</Text>
        </div>

        <Form layout="vertical">
          <Form.Item label="Thumbnail Type" required>
            <Select
              placeholder="Select thumbnail type"
              value={selectedUploadType}
              onChange={setSelectedUploadType}
              style={{ width: '100%' }}
            >
              {Object.entries(ratioSpecs).map(([type, spec]) => (
                <Option key={type} value={type}>
                  <div>
                    <div style={{ fontWeight: 500, textTransform: 'capitalize' }}>{type}</div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Ratio: {spec.ratio} | {spec.recommendedSize}
                    </Text>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Choose File" required>
            <Upload
              accept="image/*"
              showUploadList={true}
              beforeUpload={(file) => {
                const isImage = file.type.startsWith('image/');
                if (!isImage) {
                  message.error('You can only upload image files!');
                  return false;
                }

                const isLt10M = file.size / 1024 / 1024 < 10;
                if (!isLt10M) {
                  message.error('Image must be smaller than 10MB!');
                  return false;
                }

                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
                if (!allowedTypes.includes(file.type)) {
                  message.error('Only JPEG, PNG, WebP, and GIF images are allowed!');
                  return false;
                }

                setUploadFile(file);
                return false;
              }}
              fileList={uploadFile ? [uploadFile] : []}
              onRemove={() => setUploadFile(null)}
            >
              <Button icon={<UploadOutlined />}>Select File</Button>
            </Upload>
          </Form.Item>

          {selectedUploadType && ratioSpecs[selectedUploadType] && (
            <div style={{ 
              padding: 12, 
              backgroundColor: '#f6f8fa', 
              borderRadius: 6,
              marginTop: 8 
            }}>
              <Text strong>Recommended specifications:</Text>
              <br />
              <Text type="secondary">
                Aspect Ratio: {ratioSpecs[selectedUploadType].ratio}
              </Text>
              <br />
              <Text type="secondary">
                Size: {ratioSpecs[selectedUploadType].recommendedSize}
              </Text>
              <br />
              <Text type="secondary">
                {ratioSpecs[selectedUploadType].description}
              </Text>
            </div>
          )}
        </Form>
      </Modal>
    </>
  );
};

export default ThumbnailManager;
