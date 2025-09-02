import React, { useState, useEffect } from 'react';
import {
  Modal,
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
  Progress
} from 'antd';
import { UploadOutlined, DeleteOutlined, EyeOutlined, PictureOutlined } from '@ant-design/icons';
import { adminAPI } from '../utils/api';

const { Title, Text } = Typography;

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

    // Generate unique filename
    const fileName = `${type}_${Date.now()}_${file.name}`;
    
    const urlData = await getSignedUrl(fileName, file.type, file.size);
    if (!urlData) {
      message.error('Failed to get upload URL.');
      setUploading(prev => ({ ...prev, [type]: false }));
      return;
    }

    try {
      // Create XMLHttpRequest for upload progress tracking
      const xhr = new XMLHttpRequest();
      
      // Set up progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentCompleted = Math.round((event.loaded * 100) / event.total);
          setUploadProgress(prev => ({ ...prev, [type]: percentCompleted }));
        }
      });

      // Set up completion handlers
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

      // Send the file
      xhr.open('PUT', urlData.signedUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);

    } catch (error) {
      console.error('Error uploading file:', error);
      message.error(`Failed to upload ${type}.`);
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };


  const ThumbnailInput = ({ type, spec, value }) => (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Row gutter={16} align="middle">
        <Col span={6}>
          <div>
            <Title level={5} style={{ margin: 0, textTransform: 'capitalize' }}>
              {type}
            </Title>
            <Text type="secondary" style={{ fontSize: '12px', fontWeight: 'bold' }}>
              Ratio: {spec.ratio}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: '11px' }}>
              Size: {spec.recommendedSize}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {spec.description}
            </Text>
          </div>
        </Col>
        <Col span={10}>
          <Input
            placeholder={`Enter ${type} image URL`}
            value={value}
            onChange={(e) => handleThumbnailChange(type, e.target.value)}
            style={{ marginBottom: 8 }}
          />

          {/* Upload Progress */}
          {uploading[type] && (
            <Progress 
              percent={uploadProgress[type]} 
              size="small" 
              status="active"
              format={percent => `${percent}%`}
            />
          )}

          {/* Current Thumbnail Preview */}
          {value && (
            <div 
              style={{ 
                marginTop: 8, 
                border: '1px solid #d9d9d9', 
                borderRadius: 4, 
                padding: 4,
                cursor: 'pointer',
                position: 'relative'
              }}
              onClick={() => {
                Modal.info({
                  title: `${type.charAt(0).toUpperCase() + type.slice(1)} Preview`,
                  content: (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <Image
                        src={value}
                        alt={`${type} thumbnail`}
                        style={{ maxWidth: '100%', maxHeight: '300px' }}
                        fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RUG8A+5JwAAEkpJREFUeJzs2FVYVfccx/GX2ZAYsIJiBUNHjBGD3QWJDQqKBYJdBQ2iJAKCXQWJBYqCxE5N+a/8z/f8f/7/z/9/H9zW12+c9/P3/z73/9/f/v39/f0DQKH26HgQ="
                      />
                    </div>
                  ),
                  width: 600,
                });
              }}
            >
              <Image
                src={value}
                alt={`${type} thumbnail`}
                style={{ width: '100%', height: '60px', objectFit: 'cover' }}
                fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RUG8A+5JwAAEkpJREFUeJzs2FVYVfccx/GX2ZAYsIJiBUNHjBGD3QWJDQqKBYJdBQ2iJAKCXQWJBYqCxE5N+a/8z/f8f/7/z/9/H9zW12+c9/P3/z73/9/f/v39/f0DQKH26HgQ="
              />
              <div style={{
                position: 'absolute',
                top: 2,
                right: 2,
                background: 'rgba(0,0,0,0.5)',
                color: 'white',
                borderRadius: 2,
                padding: '2px 4px',
                fontSize: '10px'
              }}>
                Click to preview
              </div>
            </div>
          )}
        </Col>
        <Col span={8}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Upload
              accept="image/*"
              showUploadList={false}
              beforeUpload={(file) => {
                // Validate file type
                const isImage = file.type.startsWith('image/');
                if (!isImage) {
                  message.error('You can only upload image files!');
                  return false;
                }

                // Validate file size (max 10MB)
                const isLt10M = file.size / 1024 / 1024 < 10;
                if (!isLt10M) {
                  message.error('Image must be smaller than 10MB!');
                  return false;
                }

                // Additional file type validation
                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
                if (!allowedTypes.includes(file.type)) {
                  message.error('Only JPEG, PNG, WebP, and GIF images are allowed!');
                  return false;
                }

                handleFileUpload(file, type);
                return false; // Prevent default upload
              }}
              disabled={uploading[type]}
            >
              <Button 
                icon={<PictureOutlined />} 
                block
                loading={uploading[type]}
                disabled={uploading[type]}
                type={uploading[type] ? "default" : "primary"}
              >
                {uploading[type] ? `Uploading... ${uploadProgress[type] || 0}%` : 'Upload Image'}
              </Button>
            </Upload>

            {value && (
              <Space>
                <Button
                  icon={<EyeOutlined />}
                  size="small"
                  onClick={() => {
                    Modal.info({
                      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Preview`,
                      content: (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                          <Image
                            src={value}
                            alt={`${type} thumbnail`}
                            style={{ maxWidth: '100%', maxHeight: '300px' }}
                            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RUG8A+5JwAAEkpJREFUeJzs2FVYVfccx/GX2ZAYsIJiBUNHjBGD3QWJDQqKBYJdBQ2iJAKCXQWJBYqCxE5N+a/8z/f8f/7/z/9/H9zW12+c9/P3/z73/9/f/v39/f0DQKH26HgQ="
                          />
                        </div>
                      ),
                      width: 600,
                    });
                  }}
                >
                  Preview
                </Button>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                  onClick={() => handleThumbnailChange(type, '')}
                >
                  Remove
                </Button>
              </Space>
            )}
          </Space>
        </Col>
      </Row>
    </Card>
  );

  return (
    <Modal
      title="Thumbnail Management"
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
      <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          Upload or provide URLs for different aspect ratios. Each ratio serves different UI components.
        </Text>

        {Object.entries(ratioSpecs).map(([type, spec]) => (
          <ThumbnailInput
            key={type}
            type={type}
            spec={spec}
            value={thumbnails[type]}
          />
        ))}

        <Divider />

        <Title level={5}>Current Thumbnails</Title>
        <Row gutter={16}>
          {Object.entries(ratioSpecs).map(([type, spec]) => (
            <Col span={6} key={type}>
              <Card 
                size="small" 
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                    <Text type="secondary" style={{ fontSize: '10px' }}>
                      {spec.ratio}
                    </Text>
                  </div>
                }
                actions={[
                  <Upload
                    key="upload"
                    accept="image/*"
                    showUploadList={false}
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

                      handleFileUpload(file, type);
                      return false;
                    }}
                    disabled={uploading[type]}
                  >
                    <Button 
                      type="link" 
                      icon={<UploadOutlined />} 
                      size="small"
                      loading={uploading[type]}
                      disabled={uploading[type]}
                    >
                      {uploading[type] ? `${uploadProgress[type] || 0}%` : 'Upload'}
                    </Button>
                  </Upload>,
                  thumbnails[type] && (
                    <Button
                      key="preview"
                      type="link"
                      icon={<EyeOutlined />}
                      size="small"
                      onClick={() => {
                        Modal.info({
                          title: `${type.charAt(0).toUpperCase() + type.slice(1)} Preview`,
                          content: (
                            <div style={{ textAlign: 'center', padding: '20px' }}>
                              <Image
                                src={thumbnails[type]}
                                alt={`${type} thumbnail`}
                                style={{ maxWidth: '100%', maxHeight: '400px' }}
                                fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RUG8A+5JwAAEkpJREFUeJzs2FVYVfccx/GX2ZAYsIJiBUNHjBGD3QWJDQqKBYJdBQ2iJAKCXQWJBYqCxE5N+a/8z/f8f/7/z/9/H9zW16+c9/P3/z73/9/f/v39/f0DQKH26HgQ="
                              />
                            </div>
                          ),
                          width: 600,
                        });
                      }}
                    >
                      Preview
                    </Button>
                  ),
                  thumbnails[type] && (
                    <Button
                      key="remove"
                      type="link"
                      danger
                      icon={<DeleteOutlined />}
                      size="small"
                      onClick={() => handleThumbnailChange(type, '')}
                    >
                      Remove
                    </Button>
                  )
                ].filter(Boolean)}
              >
                <div style={{ position: 'relative' }}>
                  {thumbnails[type] ? (
                    <Image
                      src={thumbnails[type]}
                      alt={`${type} thumbnail`}
                      style={{ width: '100%', height: '80px', objectFit: 'cover' }}
                      fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RUG8A+5JwAAEkpJREFUeJzs2FVYVfccx/GX2ZAYsIJiBUNHjBGD3QWJDQqKBYJdBQ2iJAKCXQWJBYqCxE5N+a/8z/f8f/7/z/9/H9zW16+c9/P3/z73/9/f/v39/f0DQKH26HgQ="
                    />
                  ) : (
                    <div 
                      style={{ 
                        width: '100%', 
                        height: '80px', 
                        backgroundColor: '#f5f5f5', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        border: '2px dashed #d9d9d9',
                        borderRadius: '4px'
                      }}
                    >
                      <div style={{ textAlign: 'center', color: '#999' }}>
                        <PictureOutlined style={{ fontSize: '24px', marginBottom: '4px' }} />
                        <br />
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          No image
                        </Text>
                      </div>
                    </div>
                  )}
                  
                  {uploading[type] && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(255,255,255,0.8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '4px'
                    }}>
                      <Progress 
                        type="circle" 
                        percent={uploadProgress[type]} 
                        size={40}
                        strokeWidth={8}
                      />
                    </div>
                  )}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </Modal>
  );
};

export default ThumbnailManager;