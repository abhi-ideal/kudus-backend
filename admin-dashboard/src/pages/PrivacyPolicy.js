
import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
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
  CheckCircleOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import { adminAPI } from '../utils/api';

const { TextArea } = Input;
const { Title } = Typography;

const PrivacyPolicy = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [viewingPolicy, setViewingPolicy] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.get('/common/privacy-policies');
      setPolicies(response.data.policies || []);
    } catch (error) {
      message.error('Failed to load privacy policies');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        effectiveDate: values.effectiveDate.format('YYYY-MM-DD'),
      };

      if (editingPolicy) {
        await adminAPI.put(`/common/privacy-policies/${editingPolicy.id}`, payload);
        message.success('Privacy policy updated successfully');
      } else {
        await adminAPI.post('/common/privacy-policies', payload);
        message.success('Privacy policy created successfully');
      }

      setModalVisible(false);
      setEditingPolicy(null);
      form.resetFields();
      loadPolicies();
    } catch (error) {
      message.error('Failed to save privacy policy');
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminAPI.delete(`/common/privacy-policies/${id}`);
      message.success('Privacy policy deleted successfully');
      loadPolicies();
    } catch (error) {
      message.error('Failed to delete privacy policy');
      console.error(error);
    }
  };

  const handleActivate = async (id) => {
    try {
      await adminAPI.put(`/common/privacy-policies/${id}`, { isActive: true });
      message.success('Privacy policy activated successfully');
      loadPolicies();
    } catch (error) {
      message.error('Failed to activate privacy policy');
      console.error(error);
    }
  };

  const showModal = (policy = null) => {
    setEditingPolicy(policy);
    setModalVisible(true);
    if (policy) {
      form.setFieldsValue({
        ...policy,
        effectiveDate: moment(policy.effectiveDate),
      });
    } else {
      form.resetFields();
    }
  };

  const showViewModal = (policy) => {
    setViewingPolicy(policy);
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
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
    },
    {
      title: 'Effective Date',
      dataIndex: 'effectiveDate',
      key: 'effectiveDate',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'gray'}>
          {isActive ? 'Active' : 'Inactive'}
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
          {!record.isActive && (
            <Button
              icon={<CheckCircleOutlined />}
              onClick={() => handleActivate(record.id)}
              style={{ color: 'green' }}
              size="small"
            />
          )}
          <Popconfirm
            title="Are you sure you want to delete this policy?"
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
            <Title level={2}>Privacy Policy Management</Title>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => showModal()}
            >
              Add Privacy Policy
            </Button>
          </Col>
        </Row>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={policies}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>

      <Modal
        title={editingPolicy ? 'Edit Privacy Policy' : 'Add Privacy Policy'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingPolicy(null);
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
              { required: true, message: 'Please enter title' },
              { min: 5, max: 200, message: 'Title must be between 5-200 characters' }
            ]}
          >
            <Input placeholder="Enter privacy policy title" />
          </Form.Item>

          <Form.Item
            name="content"
            label="Content"
            rules={[
              { required: true, message: 'Please enter content' },
            ]}
          >
            <TextArea
              rows={12}
              placeholder="Enter privacy policy content (supports HTML)"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="version"
                label="Version"
                rules={[{ required: true, message: 'Please enter version' }]}
              >
                <Input placeholder="e.g., 1.0, 2.1" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="effectiveDate"
                label="Effective Date"
                rules={[{ required: true, message: 'Please select effective date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="isActive"
            label="Set as Active"
            valuePropName="checked"
            extra="Only one privacy policy can be active at a time"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Privacy Policy Details"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={null}
        width={900}
      >
        {viewingPolicy && (
          <div>
            <Title level={4}>{viewingPolicy.title}</Title>
            <div style={{ marginBottom: 16 }}>
              <Tag color={viewingPolicy.isActive ? 'green' : 'gray'}>
                {viewingPolicy.isActive ? 'Active' : 'Inactive'}
              </Tag>
              <span style={{ marginLeft: 8 }}>
                Version: {viewingPolicy.version} | 
                Effective: {new Date(viewingPolicy.effectiveDate).toLocaleDateString()}
              </span>
            </div>
            <div>
              <strong>Content:</strong>
              <div
                style={{
                  marginTop: 8,
                  padding: 16,
                  background: '#f5f5f5',
                  borderRadius: 4,
                  whiteSpace: 'pre-wrap',
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}
              >
                {viewingPolicy.content}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PrivacyPolicy;
