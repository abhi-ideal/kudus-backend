import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Switch,
  message,
  Tag,
  Popconfirm,
  Select,
  Row,
  Col
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { adminAPI } from '../utils/api';

const { Option } = Select;

const Genres = () => {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingGenre, setEditingGenre] = useState(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    active: 'all'
  });

  useEffect(() => {
    fetchGenres();
  }, [pagination.current, pagination.pageSize, filters]);

  const fetchGenres = async () => {
    try {
      setLoading(true);
      const params = {
        limit: pagination.pageSize,
        offset: (pagination.current - 1) * pagination.pageSize,
        active: filters.active,
        search: filters.search || undefined
      };

      const response = await adminAPI.getGenres(params);

      if (response.data.success) {
        setGenres(response.data.genres);
        setPagination(prev => ({
          ...prev,
          total: response.data.total
        }));
      }
    } catch (error) {
      console.error('Error fetching genres:', error);
      message.error('Failed to fetch genres');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingGenre(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    const slug = generateSlug(name);
    form.setFieldsValue({ slug });
  };

  const handleEdit = (genre) => {
    setEditingGenre(genre);
    form.setFieldsValue({
      name: genre.name,
      slug: genre.slug,
      description: genre.description,
      isActive: genre.isActive
    });
    setIsModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      if (editingGenre) {
        await adminAPI.updateGenre(editingGenre.id, values);
        message.success('Genre updated successfully');
      } else {
        await adminAPI.createGenre(values);
        message.success('Genre created successfully');
      }

      setIsModalVisible(false);
      form.resetFields();
      fetchGenres();
    } catch (error) {
      console.error('Error saving genre:', error);
      if (error.response?.status === 409) {
        message.error('Genre already exists');
      } else {
        message.error(`Failed to ${editingGenre ? 'update' : 'create'} genre`);
      }
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminAPI.deleteGenre(id);
      message.success('Genre deleted successfully');
      fetchGenres();
    } catch (error) {
      console.error('Error deleting genre:', error);
      message.error('Failed to delete genre');
    }
  };

  const handleToggleStatus = async (genre) => {
    try {
      await adminAPI.updateGenre(genre.id, {
        name: genre.name,
        slug: genre.slug,
        description: genre.description,
        isActive: !genre.isActive
      });
      message.success(`Genre ${genre.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchGenres();
    } catch (error) {
      console.error('Error updating genre status:', error);
      message.error('Failed to update genre status');
    }
  };

  const handleChildProfileToggle = async (id, showOnChildProfile) => {
    try {
      await adminAPI.updateGenreChildProfile(id, { showOnChildProfile });
      message.success('Genre child profile visibility updated');
      fetchGenres();
    } catch (error) {
      console.error('Error updating genre child profile visibility:', error);
      message.error('Failed to update genre child profile visibility');
    }
  };

  const handleTableChange = (newPagination) => {
    setPagination(prev => ({
      ...prev,
      current: newPagination.current,
      pageSize: newPagination.pageSize
    }));
  };

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleStatusFilter = (value) => {
    setFilters(prev => ({ ...prev, active: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive, record) => (
        <Switch
          checked={isActive}
          onChange={() => handleToggleStatus(record)}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
        />
      ),
    },
    {
      title: 'Show on Child Profile',
      dataIndex: 'showOnChildProfile',
      key: 'showOnChildProfile',
      render: (showOnChildProfile, record) => (
        <Switch
          checked={showOnChildProfile}
          onChange={(checked) => handleChildProfileToggle(record.id, checked)}
          size="small"
        />
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this genre?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '16px' }}>
          <Row gutter={16} align="middle">
            <Col flex="auto">
              <h2 style={{ margin: 0 }}>Genre Management</h2>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                Add Genre
              </Button>
            </Col>
          </Row>
        </div>

        <Row gutter={16} style={{ marginBottom: '16px' }}>
          <Col span={12}>
            <Input.Search
              placeholder="Search genres..."
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="Filter by status"
              value={filters.active}
              onChange={handleStatusFilter}
            >
              <Option value="all">All Status</Option>
              <Option value="true">Active</Option>
              <Option value="false">Inactive</Option>
            </Select>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={genres}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} genres`,
          }}
          onChange={handleTableChange}
        />
      </Card>

      <Modal
        title={editingGenre ? 'Edit Genre' : 'Add New Genre'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ showOnChildProfile: true }}
        >
          <Form.Item
            name="name"
            label="Genre Name"
            rules={[
              { required: true, message: 'Please enter genre name' },
              { min: 2, message: 'Genre name must be at least 2 characters' },
              { max: 50, message: 'Genre name must not exceed 50 characters' }
            ]}
          >
            <Input 
              placeholder="Enter genre name" 
              onChange={handleNameChange}
            />
          </Form.Item>

          <Form.Item
            name="slug"
            label="Slug"
            rules={[
              { required: true, message: 'Please enter genre slug' },
              { min: 2, message: 'Slug must be at least 2 characters' },
              { max: 50, message: 'Slug must not exceed 50 characters' },
              { 
                pattern: /^[a-z0-9-]+$/, 
                message: 'Slug can only contain lowercase letters, numbers, and hyphens' 
              }
            ]}
          >
            <Input 
              placeholder="Enter genre slug (auto-generated from name)" 
              addonBefore="/"
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[
              { max: 500, message: 'Description must not exceed 500 characters' }
            ]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Enter genre description (optional)"
            />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Status"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>

          <Form.Item
            name="showOnChildProfile"
            label="Show on Child Profile"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="Yes" unCheckedChildren="No" />
          </Form.Item>


          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingGenre ? 'Update' : 'Create'} Genre
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Genres;