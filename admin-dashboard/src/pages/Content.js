
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
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { adminAPI } from '../utils/api';
import moment from 'moment';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const Content = () => {
  const navigate = useNavigate();
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
  const [form] = Form.useForm();

  useEffect(() => {
    loadContent();
  }, [pagination.current, pagination.pageSize]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
      };
      
      const response = await adminAPI.getContent(params);
      const { content: contentData, pagination: paginationData } = response.data;
      
      setContent(contentData);
      setPagination({
        ...pagination,
        total: paginationData.totalItems,
      });
    } catch (error) {
      message.error('Failed to load content');
    } finally {
      setLoading(false);
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
      await adminAPI.deleteContent(contentId);
      message.success('Content deleted successfully');
      loadContent();
    } catch (error) {
      message.error('Failed to delete content');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const submitData = {
        ...values,
        genre: Array.isArray(values.genre) ? values.genre : [values.genre],
        cast: Array.isArray(values.cast) ? values.cast : values.cast?.split(',').map(c => c.trim()) || [],
      };

      if (modalType === 'create') {
        await adminAPI.createContent(submitData);
        message.success('Content created successfully');
      } else {
        await adminAPI.updateContent(selectedContent.id, submitData);
        message.success('Content updated successfully');
      }
      
      setModalVisible(false);
      loadContent();
    } catch (error) {
      message.error(`Failed to ${modalType} content`);
    }
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
            title="Are you sure you want to delete this content?"
            onConfirm={() => handleDeleteContent(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
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
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default Content;
