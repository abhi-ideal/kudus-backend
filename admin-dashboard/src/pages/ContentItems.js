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
  Col,
  InputNumber
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  DragOutlined
} from '@ant-design/icons';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { adminEndpoints } from '../utils/api';

const { Option } = Select;

const DraggableRow = ({ index, moveRow, className, style, ...restProps }) => {
  const ref = React.useRef();
  const [{ isOver, dropClassName }, drop] = useDrop({
    accept: 'row',
    collect: (monitor) => {
      const { index: dragIndex } = monitor.getItem() || {};
      if (dragIndex === index) {
        return {};
      }
      return {
        isOver: monitor.isOver(),
        dropClassName: dragIndex < index ? ' drop-over-downward' : ' drop-over-upward',
      };
    },
    drop: (item) => {
      moveRow(item.index, index);
    },
  });
  const [, drag] = useDrag({
    type: 'row',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  drop(drag(ref));
  return (
    <tr
      ref={ref}
      className={`${className}${isOver ? dropClassName : ''}`}
      style={{ cursor: 'move', ...style }}
      {...restProps}
    />
  );
};

const ContentItems = () => {
  const [contentItems, setContentItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    active: 'all'
  });

  useEffect(() => {
    fetchContentItems();
  }, [pagination.current, pagination.pageSize, filters]);

  const fetchContentItems = async () => {
    try {
      setLoading(true);
      const params = {
        limit: pagination.pageSize,
        offset: (pagination.current - 1) * pagination.pageSize,
        active: filters.active,
        search: filters.search || undefined
      };

      const response = await adminAPI.getContentItems(params);

      if (response.data.success) {
        setContentItems(response.data.items || response.data.data || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.total || response.data.pagination?.total || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching content items:', error);
      message.error('Failed to fetch content items');
    } finally {
      setLoading(false);
    }
  };

  const moveRow = async (dragIndex, hoverIndex) => {
    const dragItem = contentItems[dragIndex];
    const hoverItem = contentItems[hoverIndex];

    // Update local state immediately for smooth UX
    const newItems = [...contentItems];
    newItems.splice(dragIndex, 1);
    newItems.splice(hoverIndex, 0, dragItem);
    setContentItems(newItems);

    try {
      // Update display order on server
      await adminAPI.updateContentItemOrder(dragItem.id, {
        newOrder: hoverItem.displayOrder,
        oldOrder: dragItem.displayOrder
      });
      message.success('Order updated successfully');
    } catch (error) {
      console.error('Error updating order:', error);
      message.error('Failed to update order');
      // Revert on error
      fetchContentItems();
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
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

  const handleEdit = (item) => {
    setEditingItem(item);
    form.setFieldsValue({
      name: item.name,
      slug: item.slug,
      description: item.description,
      displayOrder: item.displayOrder,
      isActive: item.isActive,
      showOnChildProfile: item.showOnChildProfile
    });
    setIsModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      if (editingItem) {
        await adminAPI.updateContentItem(editingItem.id, values);
        message.success('Content item updated successfully');
      } else {
        await adminAPI.createContentItem(values);
        message.success('Content item created successfully');
      }

      setIsModalVisible(false);
      form.resetFields();
      fetchContentItems();
    } catch (error) {
      console.error('Error saving content item:', error);
      if (error.response?.status === 409) {
        message.error('Content item already exists');
      } else {
        message.error(`Failed to ${editingItem ? 'update' : 'create'} content item`);
      }
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminAPI.deleteContentItem(id);
      message.success('Content item deleted successfully');
      fetchContentItems();
    } catch (error) {
      message.error('Failed to delete content item');
    }
  };

  const handleChildProfileToggle = async (id, showOnChildProfile) => {
    try {
      await adminAPI.updateContentItemChildProfile(id, { showOnChildProfile });
      message.success('Content item child profile visibility updated');
      fetchContentItems();
    } catch (error) {
      message.error('Failed to update content item child profile visibility');
    }
  };

  const handleToggleStatus = async (item) => {
    try {
      await adminAPI.updateContentItem(item.id, {
        name: item.name,
        slug: item.slug,
        description: item.description,
        displayOrder: item.displayOrder,
        isActive: !item.isActive
      });
      message.success(`Content item ${item.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchContentItems();
    } catch (error) {
      console.error('Error updating content item status:', error);
      message.error('Failed to update content item status');
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
      title: <DragOutlined />,
      dataIndex: 'drag',
      width: 50,
      className: 'drag-visible',
      render: () => <DragOutlined style={{ cursor: 'grab', color: '#999' }} />,
    },
    {
      title: 'Display Order',
      dataIndex: 'displayOrder',
      key: 'displayOrder',
      width: 120,
      sorter: true,
      render: (order) => <Tag color="blue">{order}</Tag>
    },
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
      render: (slug) => <code>{slug}</code>
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
      render: (isActive) => (
        <span style={{ color: isActive ? 'green' : 'red' }}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
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
            title="Are you sure you want to delete this content item?"
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
              <h2 style={{ margin: 0 }}>Content Items Management</h2>
              <p style={{ margin: '4px 0 0 0', color: '#666' }}>
                Drag and drop rows to reorder content items
              </p>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                Add Content Item
              </Button>
            </Col>
          </Row>
        </div>

        <Row gutter={16} style={{ marginBottom: '16px' }}>
          <Col span={12}>
            <Input.Search
              placeholder="Search content items..."
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

        <DndProvider backend={HTML5Backend}>
          <Table
            columns={columns}
            dataSource={contentItems}
            rowKey="id"
            loading={loading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} content items`,
            }}
            onChange={handleTableChange}
            components={{
              body: {
                row: DraggableRow,
              },
            }}
            onRow={(_, index) => ({
              index,
              moveRow,
            })}
          />
        </DndProvider>
      </Card>

      <Modal
        title={editingItem ? 'Edit Content Item' : 'Add New Content Item'}
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
            name="name"
            label="Content Item Name"
            rules={[
              { required: true, message: 'Please enter content item name' },
              { min: 2, message: 'Name must be at least 2 characters' },
              { max: 100, message: 'Name must not exceed 100 characters' }
            ]}
          >
            <Input 
              placeholder="Enter content item name" 
              onChange={handleNameChange}
            />
          </Form.Item>

          <Form.Item
            name="slug"
            label="Slug"
            rules={[
              { required: true, message: 'Please enter content item slug' },
              { min: 2, message: 'Slug must be at least 2 characters' },
              { max: 100, message: 'Slug must not exceed 100 characters' },
              { 
                pattern: /^[a-z0-9-]+$/, 
                message: 'Slug can only contain lowercase letters, numbers, and hyphens' 
              }
            ]}
          >
            <Input 
              placeholder="Enter content item slug (auto-generated from name)" 
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
              placeholder="Enter content item description (optional)"
            />
          </Form.Item>

          <Form.Item
            name="displayOrder"
            label="Display Order"
            rules={[
              { required: true, message: 'Please enter display order' },
              { type: 'number', min: 0, message: 'Display order must be 0 or greater' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Enter display order"
              min={0}
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
            initialValue={false}
          >
            <Switch checkedChildren="Yes" unCheckedChildren="No" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingItem ? 'Update' : 'Create'} Content Item
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <style jsx>{`
        .drop-over-upward td {
          border-top: 2px dashed #1890ff;
        }
        .drop-over-downward td {
          border-bottom: 2px dashed #1890ff;
        }
      `}</style>
    </div>
  );
};

export default ContentItems;