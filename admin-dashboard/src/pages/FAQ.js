
import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Space,
  message,
  Popconfirm,
  Tag,
  Typography,
  Card,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { adminAPI } from '../utils/api';

const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;

const FAQ = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [viewingFaq, setViewingFaq] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadFAQs();
  }, []);

  const loadFAQs = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.get('/common/admin/help-articles');
      setFaqs(response.data.articles || []);
    } catch (error) {
      message.error('Failed to load FAQs');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        tags: values.tags || [],
        isFAQ: true,
      };

      if (editingFaq) {
        await adminAPI.put(`/common/admin/help-articles/${editingFaq.id}`, payload);
        message.success('FAQ updated successfully');
      } else {
        await adminAPI.post('/common/admin/help-articles', payload);
        message.success('FAQ created successfully');
      }

      setModalVisible(false);
      setEditingFaq(null);
      form.resetFields();
      loadFAQs();
    } catch (error) {
      message.error('Failed to save FAQ');
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminAPI.delete(`/common/admin/help-articles/${id}`);
      message.success('FAQ deleted successfully');
      loadFAQs();
    } catch (error) {
      message.error('Failed to delete FAQ');
      console.error(error);
    }
  };

  const showModal = (faq = null) => {
    setEditingFaq(faq);
    setModalVisible(true);
    if (faq) {
      form.setFieldsValue({
        ...faq,
        tags: faq.tags || [],
      });
    } else {
      form.resetFields();
    }
  };

  const showViewModal = (faq) => {
    setViewingFaq(faq);
    setViewModalVisible(true);
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category) => (
        <Tag color="blue">{category?.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Published',
      dataIndex: 'isPublished',
      key: 'isPublished',
      render: (published) => (
        <Tag color={published ? 'green' : 'red'}>
          {published ? 'Published' : 'Draft'}
        </Tag>
      ),
    },
    {
      title: 'Order',
      dataIndex: 'order',
      key: 'order',
    },
    {
      title: 'Views',
      dataIndex: 'viewCount',
      key: 'viewCount',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => showViewModal(record)}
            size="small"
          />
          <Button
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
            type="primary"
            size="small"
          />
          <Popconfirm
            title="Are you sure you want to delete this FAQ?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button
              icon={<DeleteOutlined />}
              danger
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="content-header">
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2}>FAQ Management</Title>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => showModal()}
            >
              Add FAQ
            </Button>
          </Col>
        </Row>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={faqs}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>

      <Modal
        title={editingFaq ? 'Edit FAQ' : 'Add FAQ'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingFaq(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="title"
            label="Title"
            rules={[
              { required: true, message: 'Please enter FAQ title' },
              { min: 5, max: 200, message: 'Title must be between 5-200 characters' }
            ]}
          >
            <Input placeholder="Enter FAQ title" />
          </Form.Item>

          <Form.Item
            name="content"
            label="Content"
            rules={[
              { required: true, message: 'Please enter FAQ content' },
              { min: 20, max: 10000, message: 'Content must be between 20-10000 characters' }
            ]}
          >
            <TextArea
              rows={8}
              placeholder="Enter FAQ content (supports HTML)"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: 'Please select category' }]}
              >
                <Select placeholder="Select category">
                  <Option value="account">Account</Option>
                  <Option value="billing">Billing</Option>
                  <Option value="streaming">Streaming</Option>
                  <Option value="features">Features</Option>
                  <Option value="content">Content</Option>
                  <Option value="general">General</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="order"
                label="Display Order"
                initialValue={0}
              >
                <Input type="number" placeholder="0" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="tags"
            label="Tags"
          >
            <Select
              mode="tags"
              placeholder="Add tags"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="isPublished"
            label="Published"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="FAQ Details"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={null}
        width={800}
      >
        {viewingFaq && (
          <div>
            <Title level={4}>{viewingFaq.title}</Title>
            <div style={{ marginBottom: 16 }}>
              <Tag color="blue">{viewingFaq.category?.toUpperCase()}</Tag>
              <Tag color={viewingFaq.isPublished ? 'green' : 'red'}>
                {viewingFaq.isPublished ? 'Published' : 'Draft'}
              </Tag>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>Content:</strong>
              <div
                style={{
                  marginTop: 8,
                  padding: 16,
                  background: '#f5f5f5',
                  borderRadius: 4,
                  whiteSpace: 'pre-wrap'
                }}
              >
                {viewingFaq.content}
              </div>
            </div>
            {viewingFaq.tags && viewingFaq.tags.length > 0 && (
              <div>
                <strong>Tags:</strong>
                <div style={{ marginTop: 8 }}>
                  {viewingFaq.tags.map((tag, index) => (
                    <Tag key={index}>{tag}</Tag>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FAQ;
