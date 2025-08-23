
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
  Avatar
} from 'antd';
import {
  EditOutlined,
  SaveOutlined,
  UploadOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  PlayCircleOutlined,
  ShieldOutlined,
  BarChartOutlined,
  StarOutlined,
  ArrowLeftOutlined,
  EyeOutlined,
  UserOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { adminAPI } from '../utils/api';
import moment from 'moment';

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
  const [form] = Form.useForm();

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
    }
  }, [id]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getContentById(id);
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

      await adminAPI.updateContent(id, updateData);
      message.success('Content updated successfully');
      loadContent();
    } catch (error) {
      message.error('Failed to update content');
    } finally {
      setSaving(false);
    }
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
      icon: <ShieldOutlined />,
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
  ];

  const thumbnailSizes = [
    { label: '150x150', value: '150x150' },
    { label: '300x300', value: '300x300' },
    { label: '500x500', value: '500x500' },
    { label: '800x800', value: '800x800' },
    { label: '1080x1080', value: '1080x1080' },
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
            
            {thumbnailSizes.map(size => (
              <Card key={size.value} size="small" style={{ marginBottom: 16 }}>
                <Row align="middle">
                  <Col span={4}>
                    <Text strong>{size.label}</Text>
                  </Col>
                  <Col span={12}>
                    <Upload
                      name="thumbnail"
                      listType="picture-card"
                      className="thumbnail-uploader"
                      showUploadList={false}
                      beforeUpload={() => false}
                    >
                      {content.thumbnailUrl?.[size.value] ? (
                        <img src={content.thumbnailUrl[size.value]} alt="thumbnail" style={{ width: '100%' }} />
                      ) : (
                        <div>
                          <PictureOutlined />
                          <div style={{ marginTop: 8 }}>Upload</div>
                        </div>
                      )}
                    </Upload>
                  </Col>
                  <Col span={8}>
                    <Button type="primary" icon={<UploadOutlined />}>
                      Upload {size.label}
                    </Button>
                  </Col>
                </Row>
              </Card>
            ))}
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
    </div>
  );
};

export default ContentDetails;
