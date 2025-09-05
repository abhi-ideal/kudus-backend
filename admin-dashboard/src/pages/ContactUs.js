
import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  message,
  Tag,
  Typography,
  Card,
  Row,
  Col,
  Badge,
  Descriptions,
} from 'antd';
import {
  EyeOutlined,
  EditOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { adminAPI } from '../utils/api';

const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;

const ContactUs = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [responseModalVisible, setResponseModalVisible] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.get('/contact-us');
      setTickets(response.data.tickets || []);
    } catch (error) {
      message.error('Failed to load support tickets');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (values) => {
    try {
      await adminAPI.put(`/contact-us/${selectedTicket.id}`, values);
      message.success('Response sent successfully');
      setResponseModalVisible(false);
      setSelectedTicket(null);
      form.resetFields();
      loadTickets();
    } catch (error) {
      message.error('Failed to send response');
      console.error(error);
    }
  };

  const showTicketDetails = (ticket) => {
    setSelectedTicket(ticket);
    setModalVisible(true);
  };

  const showResponseModal = (ticket) => {
    setSelectedTicket(ticket);
    setResponseModalVisible(true);
    form.setFieldsValue({
      status: ticket.status,
      priority: ticket.priority,
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      new: 'blue',
      in_progress: 'orange',
      resolved: 'green',
      closed: 'gray',
    };
    return colors[status] || 'default';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'green',
      medium: 'orange',
      high: 'red',
      urgent: 'purple',
    };
    return colors[priority] || 'default';
  };

  const columns = [
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status?.toUpperCase().replace('_', ' ')}
        </Tag>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => (
        <Tag color={getPriorityColor(priority)}>
          {priority?.toUpperCase()}
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
            onClick={() => showTicketDetails(record)}
            size="small"
          />
          <Button
            icon={<EditOutlined />}
            onClick={() => showResponseModal(record)}
            type="primary"
            size="small"
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="content-header">
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2}>Contact Us Management</Title>
          </Col>
          <Col>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadTickets}
            >
              Refresh
            </Button>
          </Col>
        </Row>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={tickets}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>

      <Modal
        title="Ticket Details"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedTicket && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Subject" span={2}>
                {selectedTicket.subject}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {selectedTicket.email}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(selectedTicket.status)}>
                  {selectedTicket.status?.toUpperCase().replace('_', ' ')}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Priority">
                <Tag color={getPriorityColor(selectedTicket.priority)}>
                  {selectedTicket.priority?.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Created">
                {new Date(selectedTicket.createdAt).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Message" span={2}>
                <div style={{
                  padding: 12,
                  background: '#f5f5f5',
                  borderRadius: 4,
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedTicket.description || selectedTicket.message}
                </div>
              </Descriptions.Item>
              {selectedTicket.adminResponse && (
                <Descriptions.Item label="Admin Response" span={2}>
                  <div style={{
                    padding: 12,
                    background: '#e6f7ff',
                    borderRadius: 4,
                    whiteSpace: 'pre-wrap'
                  }}>
                    {selectedTicket.adminResponse}
                  </div>
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}
      </Modal>

      <Modal
        title="Respond to Ticket"
        open={responseModalVisible}
        onCancel={() => {
          setResponseModalVisible(false);
          setSelectedTicket(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleResponse}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Please select status' }]}
              >
                <Select>
                  <Option value="new">New</Option>
                  <Option value="in_progress">In Progress</Option>
                  <Option value="resolved">Resolved</Option>
                  <Option value="closed">Closed</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="priority"
                label="Priority"
                rules={[{ required: true, message: 'Please select priority' }]}
              >
                <Select>
                  <Option value="low">Low</Option>
                  <Option value="medium">Medium</Option>
                  <Option value="high">High</Option>
                  <Option value="urgent">Urgent</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="adminResponse"
            label="Response"
            rules={[{ required: true, message: 'Please enter response' }]}
          >
            <TextArea
              rows={6}
              placeholder="Enter your response to the customer"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ContactUs;
