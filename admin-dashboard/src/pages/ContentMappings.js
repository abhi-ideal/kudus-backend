
import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Select,
  message,
  Tag,
  InputNumber,
  Switch,
  Row,
  Col,
  Input
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { adminAPI } from '../utils/api';

const { Option } = Select;

const ContentMappings = () => {
  const [mappings, setMappings] = useState([]);
  const [content, setContent] = useState([]);
  const [contentItems, setContentItems] = useState([]);
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
    fetchData();
  }, []);

  useEffect(() => {
    fetchMappings();
  }, [pagination.current, pagination.pageSize, filters]);

  const fetchData = async () => {
    try {
      // Fetch content and items for dropdowns
      const [contentResponse, itemsResponse] = await Promise.all([
        adminAPI.getContent({ limit: 1000 }),
        adminAPI.getContentItems({ limit: 1000 })
      ]);

      if (contentResponse.data.success) {
        setContent(contentResponse.data.content);
      }
      if (itemsResponse.data.success) {
        setContentItems(itemsResponse.data.items);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Failed to fetch data');
    }
  };

  const fetchMappings = async () => {
    try {
      setLoading(true);
      const params = {
        limit: pagination.pageSize,
        offset: (pagination.current - 1) * pagination.pageSize,
        search: filters.search || undefined,
        contentId: filters.contentId || undefined,
        itemId: filters.itemId || undefined
      };

      const response = await adminAPI.getContentMappings(params);

      if (response.data.success) {
        setMappings(response.data.mappings);
        setPagination(prev => ({
          ...prev,
          total: response.data.total
        }));
      }
    } catch (error) {
      console.error('Error fetching mappings:', error);
      message.error('Failed to fetch mappings');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingMapping(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (mapping) => {
    setEditingMapping(mapping);
    form.setFieldsValue({
      contentId: mapping.contentId,
      itemId: mapping.itemId,
      displayOrder: mapping.displayOrder,
      isFeatured: mapping.isFeatured
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
      console.error('Error saving mapping:', error);
      if (error.response?.status === 409) {
        message.error('This content is already mapped to this item');
      } else {
        message.error(`Failed to ${editingMapping ? 'update' : 'create'} mapping`);
      }
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminAPI.deleteContentMapping(id);
      message.success('Content mapping deleted successfully');
      fetchMappings();
    } catch (error) {
      message.error('Failed to delete mapping');
    }
  };

  const handleTableChange = (newPagination) => {
    setPagination(prev => ({
      ...prev,
      current: newPagination.current,
      pageSize: newPagination.pageSize
    }));
  };

  const columns = [
    {
      title: 'Content',
      dataIndex: 'content',
      key: 'content',
      render: (content) => content?.title || 'N/A',
      sorter: true,
    },
    {
      title: 'Content Item',
      dataIndex: 'item',
      key: 'item',
      render: (item) => item?.name || 'N/A',
    },
    {
      title: 'Display Order',
      dataIndex: 'displayOrder',
      key: 'displayOrder',
      render: (order) => <Tag color="blue">{order}</Tag>,
      sorter: true,
    },
    {
      title: 'Featured',
      dataIndex: 'isFeatured',
      key: 'isFeatured',
      render: (isFeatured) => (
        <Tag color={isFeatured ? 'gold' : 'default'}>
          {isFeatured ? 'Featured' : 'Normal'}
        </Tag>
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
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            Delete
          </Button>
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
              <h2 style={{ margin: 0 }}>Content to Items Mapping</h2>
              <p style={{ margin: '4px 0 0 0', color: '#666' }}>
                Assign content to multiple content items
              </p>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                Add Mapping
              </Button>
            </Col>
          </Row>
        </div>

        <Row gutter={16} style={{ marginBottom: '16px' }}>
          <Col span={8}>
            <Input.Search
              placeholder="Search by content title..."
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={(value) => setFilters(prev => ({ ...prev, search: value }))}
            />
          </Col>
          <Col span={8}>
            <Select
              style={{ width: '100%' }}
              placeholder="Filter by Content"
              allowClear
              showSearch
              optionFilterProp="children"
              onChange={(value) => setFilters(prev => ({ ...prev, contentId: value }))}
            >
              {content.map(item => (
                <Option key={item.id} value={item.id}>{item.title}</Option>
              ))}
            </Select>
          </Col>
          <Col span={8}>
            <Select
              style={{ width: '100%' }}
              placeholder="Filter by Content Item"
              allowClear
              showSearch
              optionFilterProp="children"
              onChange={(value) => setFilters(prev => ({ ...prev, itemId: value }))}
            >
              {contentItems.map(item => (
                <Option key={item.id} value={item.id}>{item.name}</Option>
              ))}
            </Select>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={mappings}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} mappings`,
          }}
          onChange={handleTableChange}
        />
      </Card>

      <Modal
        title={editingMapping ? 'Edit Content Mapping' : 'Add Content Mapping'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="contentId"
            label="Content"
            rules={[{ required: true, message: 'Please select content' }]}
          >
            <Select
              placeholder="Select content"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {content.map(item => (
                <Option key={item.id} value={item.id}>{item.title}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="itemId"
            label="Content Item"
            rules={[{ required: true, message: 'Please select content item' }]}
          >
            <Select
              placeholder="Select content item"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {contentItems.map(item => (
                <Option key={item.id} value={item.id}>{item.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="displayOrder"
            label="Display Order"
            rules={[
              { required: true, message: 'Please enter display order' },
              { type: 'number', min: 0, message: 'Display order must be 0 or greater' }
            ]}
            initialValue={0}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Enter display order"
              min={0}
            />
          </Form.Item>

          <Form.Item
            name="isFeatured"
            label="Featured"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch checkedChildren="Featured" unCheckedChildren="Normal" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingMapping ? 'Update' : 'Create'} Mapping
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ContentMappings;
