
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
  Divider
} from 'antd';
import { UploadOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
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

  const ThumbnailInput = ({ type, spec, value }) => (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Row gutter={16} align="middle">
        <Col span={6}>
          <div>
            <Title level={5} style={{ margin: 0, textTransform: 'capitalize' }}>
              {type}
            </Title>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {spec.ratio} • {spec.recommendedSize}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {spec.description}
            </Text>
          </div>
        </Col>
        <Col span={12}>
          <Input
            placeholder={`Enter ${type} image URL`}
            value={value}
            onChange={(e) => handleThumbnailChange(type, e.target.value)}
          />
        </Col>
        <Col span={6}>
          <Space>
            {value && (
              <>
                <Button
                  icon={<EyeOutlined />}
                  onClick={() => {
                    Modal.info({
                      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Preview`,
                      content: (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                          <Image
                            src={value}
                            alt={`${type} thumbnail`}
                            style={{ maxWidth: '100%', maxHeight: '300px' }}
                            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RUG8A+5JwAAEkpJREFUeJzs2FVYVfccx/GX2ZAYsIJiBUNHjBGD3QWJDQqKBYJdBQ2iJAKCXQWJBYqCxE5N+a/8z/f8f/7/z/9/H9zW12+c9/P3/z73/9/f/v39/f0DQKH26HgQ=="
                          />
                        </div>
                      ),
                      width: 600,
                    });
                  }}
                />
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleThumbnailChange(type, '')}
                />
              </>
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
        
        <Title level={5}>Current Thumbnails Preview</Title>
        <Row gutter={16}>
          {Object.entries(thumbnails).map(([type, url]) => (
            url && (
              <Col span={6} key={type}>
                <Card size="small" title={type.charAt(0).toUpperCase() + type.slice(1)}>
                  <Image
                    src={url}
                    alt={`${type} thumbnail`}
                    style={{ width: '100%', height: '80px', objectFit: 'cover' }}
                    fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RUG8A+5JwAAEkpJREFUeJzs2FVYVfccx/GX2ZAYsIJiBUNHjBGD3QWJDQqKBYJdBQ2iJAKCXQWJBYqCxE5N+a/8z/f8f/7/z/9/H9zW12+c9/P3/z73/9/f/v39/f0DQKH26HgQ="
                  />
                </Card>
              </Col>
            )
          ))}
        </Row>
      </div>
    </Modal>
  );
};

export default ThumbnailManager;
