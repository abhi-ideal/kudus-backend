import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Typography,
  Card,
  Popconfirm,
  Upload,
  Row,
  Col,
  Switch,
  Image,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  UploadOutlined,
  SearchOutlined,
  StarOutlined,
  StarFilled,
} from '@ant-design/icons';
import { adminEndpoints } from '../utils/api';
import moment from 'moment';

// Assume ThumbnailManager is imported from a separate file
// import ThumbnailManager from './ThumbnailManager';

const ThumbnailManager = ({ visible, onCancel, contentId, currentThumbnails, onUpdate }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && currentThumbnails) {
      form.setFieldsValue({
        banner: currentThumbnails.banner || '',
        landscape: currentThumbnails.landscape || '',
        portrait: currentThumbnails.portrait || '',
        square: currentThumbnails.square || '',
      });
    }
  }, [visible, currentThumbnails, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await adminEndpoints.updateContentThumbnails(contentId, {
        thumbnailUrl: {
          banner: values.banner,
          landscape: values.landscape,
          portrait: values.portrait,
          square: values.square,
        },
      });
      message.success('Thumbnails updated successfully');
      onUpdate();
    } catch (error) {
      message.error('Failed to update thumbnails');
      console.error('Thumbnail update error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Manage Thumbnails"
      visible={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>Cancel</Button>,
        <Button key="save" type="primary" onClick={handleSave} loading={loading}>
          Save
        </Button>,
      ]}
      width={700}
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="banner" label="Banner (16:4)">
              <Input placeholder="Enter banner image URL (e.g., 1920x480px)" />
            </Form.Item>
            {currentThumbnails.banner && (
              <Image width={200} src={currentThumbnails.banner} alt="Banner" style={{ marginBottom: 10 }} />
            )}
          </Col>
          <Col span={12}>
            <Form.Item name="landscape" label="Landscape (16:9)">
              <Input placeholder="Enter landscape image URL (e.g., 1200x675px)" />
            </Form.Item>
            {currentThumbnails.landscape && (
              <Image width={200} src={currentThumbnails.landscape} alt="Landscape" style={{ marginBottom: 10 }} />
            )}
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="portrait" label="Portrait (2:3)">
              <Input placeholder="Enter portrait image URL (e.g., 500x750px)" />
            </Form.Item>
            {currentThumbnails.portrait && (
              <Image width={200} src={currentThumbnails.portrait} alt="Portrait" style={{ marginBottom: 10 }} />
            )}
          </Col>
          <Col span={12}>
            <Form.Item name="square" label="Square (1:1)">
              <Input placeholder="Enter square image URL (e.g., 500x500px)" />
            </Form.Item>
            {currentThumbnails.square && (
              <Image width={200} src={currentThumbnails.square} alt="Square" style={{ marginBottom: 10 }} />
            )}
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};


const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const Content = () => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selectedContent, setSelectedContent] = useState(null);
  const [isThumbnailModalVisible, setIsThumbnailModalVisible] = useState(false);
  const [selectedContentForThumbnails, setSelectedContentForThumbnails] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [genreFilter, setGenreFilter] = useState([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [ageRatingFilter, setAgeRatingFilter] = useState([]);
  const [featuredFilter, setFeaturedFilter] = useState('');
  const [genres, setGenres] = useState([]);
  const [genresLoading, setGenresLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadContent();
  }, [pagination.current, pagination.pageSize, searchText, statusFilter, genreFilter, typeFilter, ageRatingFilter, featuredFilter]);

  useEffect(() => {
    fetchGenres();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
      };

      // Add search parameter
      if (searchText.trim()) {
        params.search = searchText.trim();
      }

      // Add status filter
      if (statusFilter) {
        params.status = statusFilter;
      }

      // Add genre filter (multiple selection)
      if (genreFilter && genreFilter.length > 0) {
        params.genre = genreFilter.join(',');
      }

      // Add type filter (multiple selection)
      if (typeFilter && typeFilter.length > 0) {
        params.type = typeFilter.join(',');
      }

      // Add age rating filter (multiple selection)
      if (ageRatingFilter && ageRatingFilter.length > 0) {
        params.ageRating = ageRatingFilter.join(',');
      }

      // Add featured filter
      if (featuredFilter) {
        params.featured = featuredFilter;
      }

      const response = await adminEndpoints.getContent(params);
      const { content: contentData, pagination: paginationData } = response.data;

      setContent(contentData);
      setPagination({
        ...pagination,
        total: paginationData.total,
      });
    } catch (error) {
      message.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const fetchGenres = async () => {
    setGenresLoading(true);
    try {
      const response = await adminEndpoints.getGenres({ active: true, limit: 100 });

      if (response.data && response.data.genres) {
        setGenres(response.data.genres);
      } else {
        setGenres([]);
      }
    } catch (error) {
      console.error('Error fetching genres:', error);
      message.error('Failed to fetch genres');
      setGenres([]);
    } finally {
      setGenresLoading(false);
    }
  };

  const handleTableChange = (paginationData) => {
    setPagination({
      ...pagination,
      current: paginationData.current,
      pageSize: paginationData.pageSize,
    });
  };

  const handleCreateContent = () => {
    setModalType('create');
    setSelectedContent(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditContent = (contentItem) => {
    setModalType('edit');
    setSelectedContent(contentItem);
    form.setFieldsValue({
      ...contentItem,
      genre: contentItem.genre,
      cast: contentItem.cast,
    });
    setModalVisible(true);
  };

  const handleViewContent = (contentId) => {
    navigate(`/content/${contentId}`);
  };

  const handleDeleteContent = async (contentId) => {
    try {
      await adminEndpoints.deleteContent(contentId);
      message.success('Content deleted successfully');
      loadContent();
    } catch (error) {
      message.error('Failed to delete content');
    }
  };

  const handleFeatureContent = async (contentId, isFeatured) => {
    try {
      if (isFeatured) {
        await adminEndpoints.unfeatureContent(contentId);
        message.success('Content unfeatured successfully');
      } else {
        await adminEndpoints.featureContent(contentId);
        message.success('Content featured successfully');
      }
      loadContent();
    } catch (error) {
      message.error(`Failed to ${isFeatured ? 'unfeature' : 'feature'} content`);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const submitData = {
        ...values,
        genre: Array.isArray(values.genre) ? values.genre : [values.genre],
        cast: Array.isArray(values.cast) ? values.cast : values.cast?.split(',').map(c => c.trim()) || [],
        isActive: values.isActive === undefined ? true : values.isActive, // Default to active if not provided
      };

      if (modalType === 'create') {
        await adminEndpoints.createContent(submitData);
        message.success('Content created successfully');
      } else {
        await adminEndpoints.updateContent(selectedContent.id, submitData);
        message.success('Content updated successfully');
      }

      setModalVisible(false);
      loadContent();
    } catch (error) {
      message.error(`Failed to ${modalType} content`);
    }
  };

  const fetchContent = loadContent; // Alias for clarity in onUpdate

  const handleSearch = (value) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, current: 1 })); // Reset to first page
  };

  const handleStatusFilter = (value) => {
    setStatusFilter(value);
    setPagination(prev => ({ ...prev, current: 1 })); // Reset to first page
  };

  const handleGenreFilter = (value) => {
    setGenreFilter(value);
    setPagination(prev => ({ ...prev, current: 1 })); // Reset to first page
  };

  const handleTypeFilter = (value) => {
    setTypeFilter(value);
    setPagination(prev => ({ ...prev, current: 1 })); // Reset to first page
  };

  const handleAgeRatingFilter = (value) => {
    setAgeRatingFilter(value);
    setPagination(prev => ({ ...prev, current: 1 })); // Reset to first page
  };

  const handleFeaturedFilter = (value) => {
    setFeaturedFilter(value);
    setPagination(prev => ({ ...prev, current: 1 })); // Reset to first page
  };

  const handleClearFilters = () => {
    setSearchText('');
    setStatusFilter('');
    setGenreFilter([]);
    setTypeFilter('');
    setAgeRatingFilter([]);
    setFeaturedFilter('');
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'movie' ? 'blue' : 'green'}>
          {type?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Genre',
      dataIndex: 'genre',
      key: 'genre',
      render: (genres) => (
        <div>
          {genres?.slice(0, 2).map((genre, index) => (
            <Tag key={index} size="small">{genre}</Tag>
          ))}
          {genres?.length > 2 && <Tag size="small">+{genres.length - 2}</Tag>}
        </div>
      ),
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration) => duration ? `${duration} min` : '-',
    },
    {
      title: 'Year',
      dataIndex: 'releaseYear',
      key: 'releaseYear',
    },
    {
      title: 'Age Rating',
      dataIndex: 'ageRating',
      key: 'ageRating',
      render: (ageRating) => (
        <Tag color="orange" size="small">
          {ageRating || 'NR'}
        </Tag>
      ),
    },
    {
      title: 'Views',
      dataIndex: 'views',
      key: 'views',
      render: (views) => (views || 0).toLocaleString(),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'ACTIVE' : 'INACTIVE'}
        </Tag>
      ),
    },
    {
      title: 'Featured',
      dataIndex: 'isFeatured',
      key: 'isFeatured',
      width: 100,
      align: 'center',
      render: (isFeatured, record) => (
        <Switch
          checked={isFeatured}
          onChange={(checked) => handleFeatureContent(record.id, isFeatured)}
          checkedChildren="★"
          unCheckedChildren="☆"
          style={{ backgroundColor: isFeatured ? '#faad14' : undefined }}
        />
      ),
    },
    {
      title: 'Thumbnails',
      dataIndex: 'thumbnailUrl',
      key: 'thumbnailUrl',
      width: 120,
      render: (thumbnailUrl, record) => {
        if (thumbnailUrl && typeof thumbnailUrl === 'object') {
          // Show the first available thumbnail
          const firstThumbnail = thumbnailUrl.landscape || thumbnailUrl.square ||
                                thumbnailUrl.portrait || thumbnailUrl.banner;
          if (firstThumbnail) {
            return (
              <div style={{ position: 'relative' }}>
                <Image
                  src={firstThumbnail}
                  alt="Content thumbnail"
                  width={60}
                  height={40}
                  style={{ objectFit: 'cover', borderRadius: 4 }}
                  fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RUG8A+5JwAAEkpJREFUeJzs2FVYVfccx/GX2ZAYsIJiBUNHjBGD3QWJDQqKBYJdBQ2iJAKCXQWJBYqCxE5N+a/8z/f8f/7/z/9/H9zW16+c9/P3/z73/9/f/v39/f0DQKH26HgQ="
                />
                <div style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  background: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  padding: '2px 4px',
                  fontSize: '10px',
                  borderRadius: 2
                }}>
                  {Object.keys(thumbnailUrl).filter(key => thumbnailUrl[key]).length}
                </div>
              </div>
            );
          }
        }

        return (
          <div style={{
            width: 60,
            height: 40,
            backgroundColor: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 4,
            color: '#999',
            fontSize: '12px'
          }}>
            No Image
          </div>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewContent(record.id)}
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditContent(record)}
          />
          <Popconfirm
            title={record.isFeatured ? 'Remove this content from featured list?' : 'Add this content to featured list?'}
            onConfirm={() => handleFeatureContent(record.id, record.isFeatured)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              icon={record.isFeatured ? <StarFilled /> : <StarOutlined />}
              style={{
                color: record.isFeatured ? '#faad14' : '#666',
                fontSize: '16px'
              }}
              title={record.isFeatured ? 'Click to unfeature' : 'Click to feature'}
            />
          </Popconfirm>
          <Popconfirm
            title="Are you sure you want to delete this content?"
            onConfirm={() => handleDeleteContent(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
          <Button
            type="link"
            onClick={() => navigate(`/content/${record.id}`)}
          >
            View Details
          </Button>
          <Button
            type="link"
            onClick={() => {
              setSelectedContentForThumbnails(record);
              setIsThumbnailModalVisible(true);
            }}
          >
            Thumbnails
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="content-header">
        <Title level={2}>Content Management</Title>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateContent}
          >
            Add Content
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={loadContent}
          >
            Refresh
          </Button>
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input.Search
              placeholder="Search by title or description"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={handleSearch}
              allowClear
              enterButton={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} sm={6} md={4} lg={3}>
            <Select
              placeholder="Status"
              value={statusFilter}
              onChange={handleStatusFilter}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={6} lg={4}>
            <Select
              mode="multiple"
              placeholder="Type"
              value={typeFilter}
              onChange={handleTypeFilter}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="movie">Movie</Option>
              <Option value="series">Series</Option>
              <Option value="documentary">Documentary</Option>
              <Option value="short">Short</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={6} lg={4}>
            <Select
              mode="multiple"
              placeholder="Genre"
              value={genreFilter}
              onChange={handleGenreFilter}
              allowClear
              style={{ width: '100%' }}
              loading={genresLoading}
            >
              {genres.map(genre => (
                <Option key={genre.id} value={genre.slug}>
                  {genre.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8} md={6} lg={4}>
            <Select
              mode="multiple"
              placeholder="Age Rating"
              value={ageRatingFilter}
              onChange={handleAgeRatingFilter}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="G">G</Option>
              <Option value="PG">PG</Option>
              <Option value="PG-13">PG-13</Option>
              <Option value="R">R</Option>
              <Option value="NC-17">NC-17</Option>
              <Option value="U">U</Option>
              <Option value="12A">12A</Option>
              <Option value="15">15</Option>
              <Option value="18">18</Option>
            </Select>
          </Col>
          <Col xs={24} sm={6} md={4} lg={3}>
            <Select
              placeholder="Featured"
              value={featuredFilter}
              onChange={handleFeaturedFilter}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="featured">Featured</Option>
              <Option value="not-featured">Not Featured</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4} lg={3}>
            <Button onClick={handleClearFilters}>
              Clear Filters
            </Button>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={content}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title={
          modalType === 'view' ? 'Content Details' :
          modalType === 'create' ? 'Create Content' : 'Edit Content'
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={
          modalType === 'view' ? (
            <Button onClick={() => setModalVisible(false)}>Close</Button>
          ) : (
            <Space>
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button type="primary" onClick={handleSubmit}>
                {modalType === 'create' ? 'Create' : 'Update'}
              </Button>
            </Space>
          )
        }
        width={800}
      >
        {modalType === 'view' && selectedContent ? (
          <div>
            <p><strong>Title:</strong> {selectedContent.title}</p>
            <p><strong>Description:</strong> {selectedContent.description}</p>
            <p><strong>Type:</strong> {selectedContent.type}</p>
            <p><strong>Genre:</strong> {selectedContent.genre?.join(', ')}</p>
            <p><strong>Director:</strong> {selectedContent.director}</p>
            <p><strong>Cast:</strong> {selectedContent.cast?.join(', ')}</p>
            <p><strong>Duration:</strong> {selectedContent.duration} minutes</p>
            <p><strong>Release Year:</strong> {selectedContent.releaseYear}</p>
            <p><strong>Language:</strong> {selectedContent.language}</p>
            <p><strong>Age Rating:</strong> {selectedContent.ageRating}</p>
            <p><strong>Views:</strong> {(selectedContent.views || 0).toLocaleString()}</p>
            <p><strong>Status:</strong> {selectedContent.isActive ? 'Active' : 'Inactive'}</p>
            <p><strong>Created:</strong> {moment(selectedContent.createdAt).format('MMM DD, YYYY HH:mm')}</p>
          </div>
        ) : (
          <Form form={form} layout="vertical">
            <Form.Item
              name="title"
              label="Title"
              rules={[{ required: true, message: 'Please enter content title' }]}
            >
              <Input placeholder="Enter content title" />
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
            >
              <TextArea rows={3} placeholder="Enter content description" />
            </Form.Item>

            <Form.Item
              name="type"
              label="Type"
              rules={[{ required: true, message: 'Please select content type' }]}
            >
              <Select placeholder="Select content type">
                <Option value="movie">Movie</Option>
                <Option value="series">Series</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="genre"
              label="Genre"
              rules={[{ required: true, message: 'Please select at least one genre!' }]}
            >
              <Select
                mode="multiple"
                placeholder="Select genres"
                loading={genresLoading}
              >
                {genres.map(genre => (
                  <Option key={genre.id} value={genre.slug}>
                    {genre.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="director"
              label="Director"
            >
              <Input placeholder="Enter director name" />
            </Form.Item>

            <Form.Item
              name="cast"
              label="Cast"
            >
              <Input placeholder="Enter cast members (comma separated)" />
            </Form.Item>

            <Form.Item
              name="duration"
              label="Duration (minutes)"
            >
              <InputNumber min={1} placeholder="Enter duration in minutes" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="releaseYear"
              label="Release Year"
            >
              <InputNumber min={1900} max={new Date().getFullYear() + 5} placeholder="Enter release year" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="language"
              label="Language"
            >
              <Select placeholder="Select language">
                <Option value="en">English</Option>
                <Option value="es">Spanish</Option>
                <Option value="fr">French</Option>
                <Option value="de">German</Option>
                <Option value="hi">Hindi</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="ageRating"
              label="Age Rating"
            >
              <Select placeholder="Select age rating">
                <Option value="G">G</Option>
                <Option value="PG">PG</Option>
                <Option value="PG-13">PG-13</Option>
                <Option value="R">R</Option>
                <Option value="NC-17">NC-17</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="isActive"
              label="Status"
              valuePropName="checked"
            >
              <Select placeholder="Select status">
                <Option value={true}>Active</Option>
                <Option value={false}>Inactive</Option>
              </Select>
            </Form.Item>
          </Form>
        )}
      </Modal>

      <ThumbnailManager
        visible={isThumbnailModalVisible}
        onCancel={() => {
          setIsThumbnailModalVisible(false);
          setSelectedContentForThumbnails(null);
        }}
        contentId={selectedContentForThumbnails?.id}
        currentThumbnails={selectedContentForThumbnails?.thumbnailUrl || {}}
        onUpdate={() => {
          fetchContent();
          setIsThumbnailModalVisible(false);
          setSelectedContentForThumbnails(null);
        }}
      />
    </div>
  );
};

export default Content;