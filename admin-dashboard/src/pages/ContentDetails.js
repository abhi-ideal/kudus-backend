import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Layout,
  Menu,
  Card,
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Upload,
  Switch,
  Table,
  Rate,
  Progress,
  Statistic,
  Row,
  Col,
  Typography,
  message,
  Divider,
  Tag,
  List,
  Avatar,
  Modal,
  Popconfirm,
  Image
} from 'antd';
import {
  EditOutlined,
  SaveOutlined,
  UploadOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  PlayCircleOutlined,
  SafetyOutlined,
  BarChartOutlined,
  StarOutlined,
  ArrowLeftOutlined,
  EyeOutlined,
  UserOutlined,
  ClockCircleOutlined,
  LinkOutlined,
  PlusOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { adminEndpoints } from '../utils/api';
import moment from 'moment';
import ThumbnailManager from '../components/ThumbnailManager';

const { Sider, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ContentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedMenuItem, setSelectedMenuItem] = useState('metadata');
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isThumbnailModalVisible, setIsThumbnailModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [mappings, setMappings] = useState([]);
  const [contentItems, setContentItems] = useState([]);
  const [mappingsLoading, setMappingsLoading] = useState(false);
  const [isAddMappingVisible, setIsAddMappingVisible] = useState(false);
  const [mappingForm] = Form.useForm();

  // Mock data for analytics, ratings, and reviews
  const [analytics] = useState({
    totalViews: 125000,
    dailyViews: 3500,
    averageWatchTime: 85,
    completionRate: 78,
    viewsGrowth: 12.5,
    topCountries: [
      { country: 'United States', views: 45000 },
      { country: 'United Kingdom', views: 22000 },
      { country: 'Canada', views: 18000 },
      { country: 'Australia', views: 15000 }
    ],
    deviceBreakdown: [
      { device: 'Mobile', percentage: 45 },
      { device: 'Desktop', percentage: 35 },
      { device: 'TV', percentage: 20 }
    ]
  });

  const [reviews] = useState([
    {
      id: 1,
      user: 'John Doe',
      rating: 4.5,
      comment: 'Great movie! Really enjoyed the storyline.',
      date: '2024-01-15',
      avatar: null
    },
    {
      id: 2,
      user: 'Jane Smith',
      rating: 5,
      comment: 'Excellent cinematography and acting.',
      date: '2024-01-14',
      avatar: null
    },
    {
      id: 3,
      user: 'Mike Johnson',
      rating: 3.5,
      comment: 'Good but could be better.',
      date: '2024-01-13',
      avatar: null
    }
  ]);

  useEffect(() => {
    if (id) {
      loadContent();
      loadContentMappings();
      loadContentItems();
    }
  }, [id]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const response = await adminEndpoints.getContentById(id);
      const contentData = response.data.content || response.data.data;
      setContent(contentData);

      // Set form values
      form.setFieldsValue({
        ...contentData,
        genre: contentData.genre || [],
        cast: Array.isArray(contentData.cast) ? contentData.cast.join(', ') : contentData.cast,
      });
    } catch (error) {
      message.error('Failed to load content details');
      navigate('/content');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const values = await form.validateFields();

      const updateData = {
        ...values,
        cast: typeof values.cast === 'string' 
          ? values.cast.split(',').map(c => c.trim()).filter(c => c)
          : values.cast
      };

      await adminEndpoints.updateContent(id, updateData);
      message.success('Content updated successfully');
      loadContent();
    } catch (error) {
      message.error('Failed to update content');
    } finally {
      setSaving(false);
    }
  };

  const loadContentMappings = async () => {
    try {
      setMappingsLoading(true);
      const response = await adminEndpoints.getContentMappings({ contentId: id });
      setMappings(response.data.mappings || []);
    } catch (error) {
      console.error('Error loading content mappings:', error);
      message.error('Failed to load content mappings');
    } finally {
      setMappingsLoading(false);
    }
  };

  const loadContentItems = async () => {
    try {
      const response = await adminEndpoints.getContentItems({ limit: 100 });
      setContentItems(response.data.items || []);
    } catch (error) {
      console.error('Error loading content items:', error);
    }
  };

  const handleAddMapping = async (values) => {
    try {
      await adminEndpoints.createContentMapping({
        ...values,
        contentId: id
      });
      message.success('Content mapping created successfully');
      setIsAddMappingVisible(false);
      mappingForm.resetFields();
      loadContentMappings();
    } catch (error) {
      console.error('Error creating content mapping:', error);
      message.error('Failed to create content mapping');
    }
  };

  const handleDeleteMapping = async (mappingId) => {
    try {
      await adminEndpoints.deleteContentMapping(mappingId);
      message.success('Content mapping deleted successfully');
      loadContentMappings();
    } catch (error) {
      console.error('Error deleting content mapping:', error);
      message.error('Failed to delete content mapping');
    }
  };

  const handleEdit = () => {
    form.setFieldsValue({
      title: content.title,
      description: content.description,
      type: content.type,
      genre: content.genre,
      duration: content.duration,
      releaseYear: content.releaseYear,
      rating: content.rating,
      language: content.language,
      isActive: content.isActive
    });
    setIsEditModalVisible(true);
  };

  const handleThumbnailUpdate = (updatedThumbnails) => {
    setContent(prev => ({
      ...prev,
      thumbnailUrl: updatedThumbnails
    }));
    loadContent(); // Refresh to get latest data
  };

  const menuItems = [
    {
      key: 'metadata',
      icon: <EditOutlined />,
      label: 'Metadata',
    },
    {
      key: 'thumbnails',
      icon: <PictureOutlined />,
      label: 'Thumbnails',
    },
    {
      key: 'video',
      icon: <VideoCameraOutlined />,
      label: 'Video',
    },
    {
      key: 'trailer',
      icon: <PlayCircleOutlined />,
      label: 'Trailer',
    },
    {
      key: 'access-control',
      icon: <SafetyOutlined />,
      label: 'Access Control',
    },
    {
      key: 'analytics',
      icon: <BarChartOutlined />,
      label: 'Analytics',
    },
    {
      key: 'ratings-reviews',
      icon: <StarOutlined />,
      label: 'Ratings & Reviews',
    },
    {
      key: 'content-mappings',
      icon: <LinkOutlined />,
      label: 'Content Mappings',
    },
  ];

  const renderContent = () => {
    if (!content) return null;

    switch (selectedMenuItem) {
      case 'metadata':
        return (
          <Card title="Content Metadata" extra={
            <Button type="primary" loading={saving} onClick={handleSave} icon={<SaveOutlined />}>
              Save Changes
            </Button>
          }>
            <Form form={form} layout="vertical">
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    name="title"
                    label="Title"
                    rules={[{ required: true, message: 'Please enter content title' }]}
                  >
                    <Input placeholder="Enter content title" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="type"
                    label="Type"
                    rules={[{ required: true, message: 'Please select content type' }]}
                  >
                    <Select placeholder="Select content type">
                      <Option value="movie">Movie</Option>
                      <Option value="series">Series</Option>
                      <Option value="documentary">Documentary</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="description" label="Description">
                <TextArea rows={4} placeholder="Enter content description" />
              </Form.Item>

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    name="genre"
                    label="Genre"
                    rules={[{ required: true, message: 'Please select at least one genre' }]}
                  >
                    <Select mode="multiple" placeholder="Select genres">
                      <Option value="action">Action</Option>
                      <Option value="comedy">Comedy</Option>
                      <Option value="drama">Drama</Option>
                      <Option value="horror">Horror</Option>
                      <Option value="romance">Romance</Option>
                      <Option value="sci-fi">Sci-Fi</Option>
                      <Option value="thriller">Thriller</Option>
                      <Option value="documentary">Documentary</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="ageRating" label="Age Rating">
                    <Select placeholder="Select age rating">
                      <Option value="G">G</Option>
                      <Option value="PG">PG</Option>
                      <Option value="PG-13">PG-13</Option>
                      <Option value="R">R</Option>
                      <Option value="NC-17">NC-17</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item name="duration" label="Duration (minutes)">
                    <InputNumber min={1} placeholder="Duration" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="releaseYear" label="Release Year">
                    <InputNumber min={1900} max={new Date().getFullYear() + 5} placeholder="Release year" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="language" label="Language">
                    <Select placeholder="Select language">
                      <Option value="en">English</Option>
                      <Option value="es">Spanish</Option>
                      <Option value="fr">French</Option>
                      <Option value="de">German</Option>
                      <Option value="hi">Hindi</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="director" label="Director">
                <Input placeholder="Enter director name" />
              </Form.Item>

              <Form.Item name="cast" label="Cast (comma separated)">
                <Input placeholder="Enter cast members (comma separated)" />
              </Form.Item>

              <Form.Item name="isActive" label="Status" valuePropName="checked">
                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
              </Form.Item>
            </Form>
          </Card>
        );

      case 'thumbnails':
        return (
          <Card title="Thumbnail Management">
            <div style={{ marginBottom: 24 }}>
              <Title level={4}>Upload Thumbnails</Title>
              <Text type="secondary">Upload thumbnails for different sizes and resolutions</Text>
            </div>

            <Row gutter={16}>
              {Object.entries(content.thumbnailUrl || {}).map(([ratio, url]) => (
                url && (
                  <Col span={6} key={ratio}>
                    <Card size="small" title={ratio.charAt(0).toUpperCase() + ratio.slice(1)}>
                      <Image
                        src={url}
                        alt={`${ratio} thumbnail`}
                        style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                        fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RUG8A+5JwAAEkpJREFUeJzs2FVYVfccx/GX2ZAYsIJiBUNHjBGD3QWJDQqKBYJdBQ2iJAKCXQWJBYqCxE5N+a/8z/f8f/7/z/9/H9zW12+c9/P3/z73/9/f/v39/f0DQKH26HgQ="
                      />
                    </Card>
                  </Col>
                )
              ))}
              <Col span={24}>
                <div style={{
                  border: '1px dashed #d9d9d9',
                  padding: '40px',
                  textAlign: 'center',
                  color: '#999',
                  marginTop: 16
                }}>
                  No thumbnails available. Click "Manage Thumbnails" to add them.
                </div>
              </Col>
            </Row>

            <Button
              type="primary"
              onClick={() => setIsThumbnailModalVisible(true)}
              icon={<UploadOutlined />}
              style={{ marginTop: 16 }}
            >
              Manage Thumbnails
            </Button>
          </Card>
        );

      case 'video':
        return (
          <Card title="Video Management">
            <div style={{ marginBottom: 24 }}>
              <Title level={4}>Main Video</Title>
              <Text type="secondary">Upload and manage the main video content</Text>
            </div>

            <Card size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <div>
                    <Text strong>Current Video</Text>
                    <br />
                    <Text type="secondary">{content.videoUrl || 'No video uploaded'}</Text>
                  </div>
                </Col>
                <Col span={12}>
                  <Upload
                    name="video"
                    beforeUpload={() => false}
                    showUploadList={false}
                  >
                    <Button icon={<UploadOutlined />} size="large" type="primary">
                      Upload Video
                    </Button>
                  </Upload>
                </Col>
              </Row>
            </Card>

            <Card size="small" title="Video Quality Options">
              <Row gutter={16}>
                <Col span={6}>
                  <Card size="small">
                    <Statistic title="480p" value="Available" />
                    <Button size="small">Upload 480p</Button>
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small">
                    <Statistic title="720p" value="Available" />
                    <Button size="small">Upload 720p</Button>
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small">
                    <Statistic title="1080p" value="Processing" />
                    <Button size="small" disabled>Processing...</Button>
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small">
                    <Statistic title="4K" value="Not Available" />
                    <Button size="small">Upload 4K</Button>
                  </Card>
                </Col>
              </Row>
            </Card>
          </Card>
        );

      case 'trailer':
        return (
          <Card title="Trailer Management">
            <div style={{ marginBottom: 24 }}>
              <Title level={4}>Movie Trailer</Title>
              <Text type="secondary">Upload and manage trailer content</Text>
            </div>

            <Card size="small">
              <Row gutter={16} align="middle">
                <Col span={8}>
                  <div>
                    <Text strong>Current Trailer</Text>
                    <br />
                    <Text type="secondary">{content.trailerUrl || 'No trailer uploaded'}</Text>
                    {content.trailerUrl && (
                      <div style={{ marginTop: 8 }}>
                        <Button icon={<PlayCircleOutlined />} size="small">
                          Preview Trailer
                        </Button>
                      </div>
                    )}
                  </div>
                </Col>
                <Col span={8}>
                  <Upload
                    name="trailer"
                    beforeUpload={() => false}
                    showUploadList={false}
                  >
                    <Button icon={<UploadOutlined />} type="primary">
                      Upload New Trailer
                    </Button>
                  </Upload>
                </Col>
                <Col span={8}>
                  <Form.Item label="Trailer URL" style={{ margin: 0 }}>
                    <Input placeholder="Or paste trailer URL" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Card>
        );

      case 'access-control':
        return (
          <Card title="Access Control & Geo-Restrictions">
            <Form layout="vertical">
              <Card size="small" title="Global Availability" style={{ marginBottom: 16 }}>
                <Form.Item name="isGloballyAvailable" valuePropName="checked">
                  <Switch
                    checkedChildren="Global"
                    unCheckedChildren="Restricted"
                    defaultChecked={content.isGloballyAvailable}
                  />
                  <Text style={{ marginLeft: 8 }}>Make available globally</Text>
                </Form.Item>
              </Card>

              <Row gutter={16}>
                <Col span={12}>
                  <Card size="small" title="Available Countries">
                    <Form.Item name="availableCountries">
                      <Select
                        mode="multiple"
                        placeholder="Select available countries"
                        defaultValue={content.availableCountries}
                      >
                        <Option value="US">United States</Option>
                        <Option value="CA">Canada</Option>
                        <Option value="UK">United Kingdom</Option>
                        <Option value="AU">Australia</Option>
                        <Option value="DE">Germany</Option>
                        <Option value="FR">France</Option>
                        <Option value="IN">India</Option>
                        <Option value="JP">Japan</Option>
                      </Select>
                    </Form.Item>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" title="Restricted Countries">
                    <Form.Item name="restrictedCountries">
                      <Select
                        mode="multiple"
                        placeholder="Select restricted countries"
                        defaultValue={content.restrictedCountries}
                      >
                        <Option value="CN">China</Option>
                        <Option value="RU">Russia</Option>
                        <Option value="KP">North Korea</Option>
                        <Option value="IR">Iran</Option>
                      </Select>
                    </Form.Item>
                  </Card>
                </Col>
              </Row>

              <Card size="small" title="Subscription Requirements">
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item name="requiresPremium" valuePropName="checked">
                      <Switch checkedChildren="Premium Only" unCheckedChildren="Free Access" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="requiresFamily" valuePropName="checked">
                      <Switch checkedChildren="Family Plan" unCheckedChildren="Any Plan" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="ageRestricted" valuePropName="checked">
                      <Switch checkedChildren="Age Restricted" unCheckedChildren="All Ages" />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
                Save Access Control Settings
              </Button>
            </Form>
          </Card>
        );

      case 'analytics':
        return (
          <div>
            <Card title="Content Analytics" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={6}>
                  <Card size="small">
                    <Statistic
                      title="Total Views"
                      value={analytics.totalViews}
                      prefix={<EyeOutlined />}
                      suffix={
                        <Text type="success">
                          +{analytics.viewsGrowth}%
                        </Text>
                      }
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small">
                    <Statistic
                      title="Daily Views"
                      value={analytics.dailyViews}
                      prefix={<EyeOutlined />}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small">
                    <Statistic
                      title="Avg Watch Time"
                      value={analytics.averageWatchTime}
                      suffix="%"
                      prefix={<ClockCircleOutlined />}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small">
                    <Statistic
                      title="Completion Rate"
                      value={analytics.completionRate}
                      suffix="%"
                    />
                  </Card>
                </Col>
              </Row>
            </Card>

            <Row gutter={16}>
              <Col span={12}>
                <Card title="Top Countries" size="small">
                  <List
                    dataSource={analytics.topCountries}
                    renderItem={item => (
                      <List.Item>
                        <List.Item.Meta
                          title={item.country}
                          description={`${item.views.toLocaleString()} views`}
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Device Breakdown" size="small">
                  {analytics.deviceBreakdown.map(item => (
                    <div key={item.device} style={{ marginBottom: 8 }}>
                      <div style={{ marginBottom: 4 }}>
                        <Text>{item.device}</Text>
                        <Text style={{ float: 'right' }}>{item.percentage}%</Text>
                      </div>
                      <Progress percent={item.percentage} showInfo={false} />
                    </div>
                  ))}
                </Card>
              </Col>
            </Row>
          </div>
        );

      case 'ratings-reviews':
        return (
          <div>
            <Card title="Ratings & Reviews Overview" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={6}>
                  <Card size="small">
                    <Statistic
                      title="Average Rating"
                      value={4.2}
                      precision={1}
                      prefix={<StarOutlined />}
                      suffix="/ 5.0"
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small">
                    <Statistic
                      title="Total Reviews"
                      value={1247}
                      prefix={<UserOutlined />}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small">
                    <div>
                      <Text strong>Rating Distribution</Text>
                      <div style={{ marginTop: 8 }}>
                        {[5, 4, 3, 2, 1].map(rating => (
                          <div key={rating} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                            <span style={{ width: 20 }}>{rating}</span>
                            <Rate disabled defaultValue={1} count={1} style={{ fontSize: 12, marginRight: 8 }} />
                            <Progress percent={rating * 20} size="small" showInfo={false} style={{ flex: 1 }} />
                            <span style={{ marginLeft: 8, width: 30 }}>{Math.floor(Math.random() * 200)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small">
                    <Statistic
                      title="Recent Reviews"
                      value={25}
                      suffix="this week"
                    />
                  </Card>
                </Col>
              </Row>
            </Card>

            <Card title="Recent Reviews">
              <List
                dataSource={reviews}
                renderItem={review => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} />}
                      title={
                        <div>
                          <Text strong>{review.user}</Text>
                          <Rate disabled defaultValue={review.rating} style={{ marginLeft: 8, fontSize: 12 }} />
                          <Text type="secondary" style={{ marginLeft: 8 }}>
                            {moment(review.date).format('MMM DD, YYYY')}
                          </Text>
                        </div>
                      }
                      description={review.comment}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </div>
        );

      case 'content-mappings':
        return (
          <div>
            <Card
              title="Content Assignments"
              extra={
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setIsAddMappingVisible(true)}
                >
                  Add to Item
                </Button>
              }
              style={{ marginBottom: 16 }}
            >
              <div style={{ marginBottom: 16 }}>
                <Text type="secondary">
                  Assign this content to different categories/items to control where it appears in the application.
                </Text>
              </div>

              <Table
                dataSource={mappings}
                loading={mappingsLoading}
                rowKey="id"
                pagination={false}
                columns={[
                  {
                    title: 'Content Item',
                    dataIndex: 'itemId',
                    key: 'itemId',
                    render: (itemId, record) => {
                      const item = contentItems.find(i => i.id === itemId);
                      return (
                        <div>
                          <Text strong>{item?.name || 'Unknown Item'}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {item?.slug}
                          </Text>
                        </div>
                      );
                    },
                  },
                  {
                    title: 'Display Order',
                    dataIndex: 'displayOrder',
                    key: 'displayOrder',
                    width: 120,
                    render: (order) => <Text>{order || 0}</Text>
                  },
                  {
                    title: 'Featured',
                    dataIndex: 'isFeatured',
                    key: 'isFeatured',
                    width: 100,
                    render: (isFeatured) => (
                      <Tag color={isFeatured ? 'gold' : 'default'}>
                        {isFeatured ? 'Featured' : 'Normal'}
                      </Tag>
                    )
                  },
                  {
                    title: 'Actions',
                    key: 'actions',
                    width: 100,
                    render: (_, record) => (
                      <Button
                        type="link"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteMapping(record.id)}
                        size="small"
                      >
                        Remove
                      </Button>
                    ),
                  },
                ]}
              />
            </Card>

            <Modal
              title="Assign Content to Item"
              visible={isAddMappingVisible}
              onCancel={() => {
                setIsAddMappingVisible(false);
                mappingForm.resetFields();
              }}
              footer={null}
              width={500}
            >
              <Form
                form={mappingForm}
                layout="vertical"
                onFinish={handleAddMapping}
              >
                <Form.Item
                  name="itemId"
                  label="Content Item"
                  rules={[{ required: true, message: 'Please select a content item' }]}
                >
                  <Select
                    placeholder="Select content item"
                    showSearch
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {contentItems
                      .filter(item => !mappings.some(m => m.itemId === item.id))
                      .map(item => (
                        <Option key={item.id} value={item.id}>
                          {item.name}
                          <Text type="secondary"> ({item.slug})</Text>
                        </Option>
                      ))}
                  </Select>
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="displayOrder"
                      label="Display Order"
                      rules={[{ required: true, message: 'Please enter display order' }]}
                    >
                      <InputNumber
                        min={0}
                        placeholder="Display order (0-100)"
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="isFeatured"
                      label="Featured Content"
                      valuePropName="checked"
                    >
                      <Switch checkedChildren="Featured" unCheckedChildren="Normal" />
                    </Form.Item>
                  </Col>
                </Row>

                <Divider />

                <Form.Item style={{ marginBottom: 0 }}>
                  <Button type="primary" htmlType="submit" style={{ marginRight: 8 }}>
                    Add Assignment
                  </Button>
                  <Button onClick={() => {
                    setIsAddMappingVisible(false);
                    mappingForm.resetFields();
                  }}>
                    Cancel
                  </Button>
                </Form.Item>
              </Form>
            </Modal>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/content')}
          style={{ marginRight: 16 }}
        >
          Back to Content
        </Button>
        <Title level={2} style={{ display: 'inline', margin: 0 }}>
          {content?.title || 'Content Details'}
        </Title>
      </div>

      <Layout style={{ background: '#fff', minHeight: '80vh' }}>
        <Sider width={250} style={{ background: '#fafafa' }}>
          <Menu
            mode="inline"
            selectedKeys={[selectedMenuItem]}
            items={menuItems}
            onClick={({ key }) => setSelectedMenuItem(key)}
            style={{ height: '100%', borderRight: 0 }}
          />
        </Sider>
        <Layout style={{ padding: '0 24px' }}>
          <Content style={{ padding: '24px 0', minHeight: 280 }}>
            {renderContent()}
          </Content>
        </Layout>
      </Layout>

      <ThumbnailManager
        visible={isThumbnailModalVisible}
        onCancel={() => setIsThumbnailModalVisible(false)}
        contentId={id}
        currentThumbnails={content?.thumbnailUrl || {}}
        onUpdate={handleThumbnailUpdate}
      />
    </div>
  );
};

export default ContentDetails;