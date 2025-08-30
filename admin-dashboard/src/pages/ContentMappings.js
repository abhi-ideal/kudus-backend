
import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Select,
  Switch,
  InputNumber,
  message,
  Space,
  Tag,
  Popconfirm,
  Row,
  Col,
  Typography,
  Input,
  Divider
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  LinkOutlined
} from '@ant-design/icons';
import { adminAPI } from '../utils/api';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

const ContentMappings = () => {
  const [mappings, setMappings] = useState([]);
  const [contentItems, setContentItems] = useState([]);
  const [allContent, setAllContent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingMapping, setEditingMapping] = useState(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    contentId: null,
    itemId: null
  });

  useEffect(() => {
    fetchMappings();
    fetchContentItems();
    fetchAllContent();
  }, [pagination.current, pagination.pageSize, filters]);

  const fetchMappings = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters
      };
      
      const response = await adminAPI.getContentMappings(params);
      setMappings(response.data.mappings || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination?.total || 0
      }));
    } catch (error) {
      console.error('Error fetching content mappings:', error);
      message.error('Failed to fetch content mappings');
    } finally {
      setLoading(false);
    }
  };

  const fetchContentItems = async () => {
    try {
      const response = await adminAPI.getContentItems({ limit: 100 });
      setContentItems(response.data.data || response.data.items || []);
    } catch (error) {
      console.error('Error fetching content items:', error);
    }
  };

  const fetchAllContent = async () => {
    try {
      const response = await adminAPI.getContent({ limit: 1000 });
      setAllContent(response.data.content || []);
    } catch (error) {
      console.error('Error fetching content:', error);
    }
  };

  const handleCreateMapping = () => {
    setEditingMapping(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditMapping = (mapping) => {
    setEditingMapping(mapping);
    form.setFieldsValue({
      contentId: mapping.contentId,
      itemId: mapping.itemId,
      displayOrder: mapping.displayOrder || 0,
      isFeatured: mapping.isFeatured || false
    });
    setIsModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      if (editingMapping) {
        await adminAPI.updateContentMapping(editingMapping.id, values);
        message.success('Content mapping updated successfully');
      } else {
        await adminAPI.createContentMapping(values);
        message.success('Content mapping created successfully');
      }
      
      setIsModalVisible(false);
      form.resetFields();
      fetchMappings();
    } catch (error) {
      console.error('Error saving content mapping:', error);
      message.error(error.response?.data?.error || 'Failed to save content mapping');
    }
  };

  const handleDeleteMapping = async (id) => {
    try {
      await adminAPI.deleteContentMapping(id);
      message.success('Content mapping deleted successfully');
      fetchMappings();
    } catch (error) {
      console.error('Error deleting content mapping:', error);
      message.error('Failed to delete content mapping');
    }
  };

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleFilterByItem = (itemId) => {
    setFilters(prev => ({ ...prev, itemId }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleFilterByContent = (contentId) => {
    setFilters(prev => ({ ...prev, contentId }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const getContentTitle = (contentId) => {
    const content = allContent.find(c => c.id === contentId);
    return content ? content.title : 'Unknown Content';
  };

  const getItemName = (itemId) => {
    const item = contentItems.find(i => i.id === itemId);
    return item ? item.name : 'Unknown Item';
  };

  const columns = [
    {
      title: 'Content Item',
      dataIndex: 'itemId',
      key: 'itemId',
      render: (itemId, record) => (
        <div>
          <Text strong>{getItemName(itemId)}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.item?.slug}
          </Text>
        </div>
      ),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Select
            placeholder="Select content item"
            value={selectedKeys[0]}
            onChange={(value) => setSelectedKeys(value ? [value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 200 }}
            allowClear
          >
            {contentItems.map(item => (
              <Option key={item.id} value={item.id}>{item.name}</Option>
            ))}
          </Select>
          <div style={{ marginTop: 8 }}>
            <Button
              type="primary"
              onClick={() => confirm()}
              size="small"
              style={{ width: 90, marginRight: 8 }}
            >
              Filter
            </Button>
            <Button onClick={() => clearFilters()} size="small" style={{ width: 90 }}>
              Reset
            </Button>
          </div>
        </div>
      ),
      filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
    },
    {
      title: 'Assigned Content',
      dataIndex: 'contentId',
      key: 'contentId',
      render: (contentId, record) => (
        <div>
          <Text>{getContentTitle(contentId)}</Text>
          <br />
          <Tag color={record.content?.type === 'movie' ? 'blue' : 'green'}>
            {record.content?.type || 'Unknown'}
          </Tag>
          {record.content?.genre && (
            <div style={{ marginTop: 4 }}>
              {record.content.genre.slice(0, 2).map(g => (
                <Tag key={g} size="small">{g}</Tag>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Display Order',
      dataIndex: 'displayOrder',
      key: 'displayOrder',
      width: 120,
      sorter: true,
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
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditMapping(record)}
            size="small"
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this mapping?"
            onConfirm={() => handleDeleteMapping(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              <LinkOutlined /> Content Assignments
            </Title>
            <Text type="secondary">
              Assign content to different categories and manage their display order
            </Text>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateMapping}
            >
              Assign Content
            </Button>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Search
              placeholder="Search by content title"
              onSearch={handleSearch}
              allowClear
            />
          </Col>
          <Col span={8}>
            <Select
              placeholder="Filter by Content Item"
              style={{ width: '100%' }}
              onChange={handleFilterByItem}
              allowClear
            >
              {contentItems.map(item => (
                <Option key={item.id} value={item.id}>{item.name}</Option>
              ))}
            </Select>
          </Col>
          <Col span={8}>
            <Select
              placeholder="Filter by Content"
              style={{ width: '100%' }}
              onChange={handleFilterByContent}
              allowClear
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {allContent.map(content => (
                <Option key={content.id} value={content.id}>
                  {content.title} ({content.type})
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={mappings}
          loading={loading}
          rowKey="id"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} mappings`,
          }}
          onChange={(newPagination, filters, sorter) => {
            setPagination(prev => ({
              ...prev,
              current: newPagination.current,
              pageSize: newPagination.pageSize
            }));
          }}
        />
      </Card>

      <Modal
        title={editingMapping ? 'Edit Content Assignment' : 'Assign Content to Item'}
        visible={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
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
                  {contentItems.map(item => (
                    <Option key={item.id} value={item.id}>
                      {item.name}
                      <Text type="secondary"> ({item.slug})</Text>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="contentId"
                label="Content"
                rules={[{ required: true, message: 'Please select content' }]}
              >
                <Select
                  placeholder="Select content"
                  showSearch
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {allContent.map(content => (
                    <Option key={content.id} value={content.id}>
                      {content.title}
                      <Tag style={{ marginLeft: 8 }} color={content.type === 'movie' ? 'blue' : 'green'}>
                        {content.type}
                      </Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

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
            <Space>
              <Button type="primary" htmlType="submit">
                {editingMapping ? 'Update Assignment' : 'Create Assignment'}
              </Button>
              <Button onClick={() => {
                setIsModalVisible(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ContentMappings;
