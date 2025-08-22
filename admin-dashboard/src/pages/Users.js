
import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Typography,
  Card,
  Popconfirm,
} from 'antd';
import {
  EyeOutlined,
  StopOutlined,
  CheckOutlined,
  EditOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { adminAPI } from '../utils/api';
import moment from 'moment';

const { Title } = Typography;
const { Option } = Select;

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('view');
  const [selectedUser, setSelectedUser] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters,
      };
      
      console.log('Loading users with params:', params);
      const response = await adminAPI.getUsers(params);
      console.log('API Response:', response.data);
      
      // Handle the response format from the updated API
      if (response.data && response.data.users) {
        const { users: userData, pagination: paginationData } = response.data;
        
        setUsers(userData || []);
        setPagination(prev => ({
          ...prev,
          total: paginationData?.totalItems || paginationData?.total || 0,
          current: paginationData?.currentPage || prev.current,
          pageSize: prev.pageSize
        }));
      } else {
        console.error('Unexpected API response format:', response.data);
        setUsers([]);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      message.error(`Failed to load users: ${error.response?.data?.message || error.message}`);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, filters, loading]);

  const handleTableChange = (paginationData, filtersData) => {
    setPagination({
      ...pagination,
      current: paginationData.current,
      pageSize: paginationData.pageSize,
    });
  };

  const handleViewUser = async (userId) => {
    try {
      const response = await adminAPI.getUserById(userId);
      setSelectedUser(response.data);
      setModalType('view');
      setModalVisible(true);
    } catch (error) {
      message.error('Failed to load user details');
    }
  };

  const handleBlockUser = async (userId) => {
    try {
      await adminAPI.blockUser(userId, 'Blocked by admin');
      message.success('User blocked successfully');
      loadUsers();
    } catch (error) {
      message.error('Failed to block user');
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      await adminAPI.unblockUser(userId);
      message.success('User unblocked successfully');
      loadUsers();
    } catch (error) {
      message.error('Failed to unblock user');
    }
  };

  const handleUpdateSubscription = (user) => {
    setSelectedUser(user);
    setModalType('subscription');
    form.setFieldsValue({
      subscription: user.subscription,
      subscriptionEndDate: user.subscriptionEndDate,
    });
    setModalVisible(true);
  };

  const handleSubscriptionSubmit = async () => {
    try {
      const values = await form.validateFields();
      await adminAPI.updateUserSubscription(selectedUser.id, values);
      message.success('Subscription updated successfully');
      setModalVisible(false);
      loadUsers();
    } catch (error) {
      message.error('Failed to update subscription');
    }
  };

  const columns = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      ellipsis: true,
    },
    {
      title: 'Display Name',
      dataIndex: 'displayName',
      key: 'displayName',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => {
        const userStatus = status || (record.isActive ? 'active' : 'inactive');
        return (
          <Tag color={userStatus === 'active' ? 'green' : 'red'}>
            {userStatus?.toUpperCase() || 'UNKNOWN'}
          </Tag>
        );
      },
    },
    {
      title: 'Subscription',
      dataIndex: 'subscription',
      key: 'subscription',
      render: (subscription, record) => {
        const subType = subscription || record.subscriptionType || 'free';
        return (
          <Tag color={
            subType === 'premium' ? 'gold' : 
            subType === 'family' ? 'purple' : 'default'
          }>
            {subType?.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'Profiles',
      dataIndex: 'profiles',
      key: 'profiles',
      render: (profiles) => profiles?.length || 0,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => moment(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewUser(record.id)}
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleUpdateSubscription(record)}
          />
          {record.status === 'active' ? (
            <Popconfirm
              title="Are you sure you want to block this user?"
              onConfirm={() => handleBlockUser(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button type="text" danger icon={<StopOutlined />} />
            </Popconfirm>
          ) : (
            <Popconfirm
              title="Are you sure you want to unblock this user?"
              onConfirm={() => handleUnblockUser(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button type="text" icon={<CheckOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="content-header">
        <Title level={2}>User Management</Title>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={loadUsers}
        >
          Refresh
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} users`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 800 }}
        />
      </Card>

      <Modal
        title={
          modalType === 'view' ? 'User Details' : 'Update Subscription'
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={
          modalType === 'view' ? (
            <Button onClick={() => setModalVisible(false)}>Close</Button>
          ) : (
            <Space>
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button type="primary" onClick={handleSubscriptionSubmit}>
                Update
              </Button>
            </Space>
          )
        }
        width={600}
      >
        {modalType === 'view' && selectedUser ? (
          <div>
            <p><strong>Email:</strong> {selectedUser.user?.email}</p>
            <p><strong>Display Name:</strong> {selectedUser.user?.displayName}</p>
            <p><strong>Status:</strong> 
              <Tag color={selectedUser.user?.status === 'active' ? 'green' : 'red'}>
                {selectedUser.user?.status?.toUpperCase()}
              </Tag>
            </p>
            <p><strong>Subscription:</strong> {selectedUser.user?.subscription || 'free'}</p>
            <p><strong>Profiles:</strong> {selectedUser.user?.profiles?.length || 0}</p>
            <p><strong>Account Age:</strong> {selectedUser.statistics?.accountAge} days</p>
            <p><strong>Total Watch Time:</strong> {Math.round((selectedUser.statistics?.totalWatchTime || 0) / 60)} minutes</p>
          </div>
        ) : (
          <Form form={form} layout="vertical">
            <Form.Item
              name="subscription"
              label="Subscription Plan"
              rules={[{ required: true, message: 'Please select a subscription plan' }]}
            >
              <Select placeholder="Select subscription plan">
                <Option value="free">Free</Option>
                <Option value="premium">Premium</Option>
                <Option value="family">Family</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="subscriptionEndDate"
              label="Subscription End Date"
            >
              <Input type="date" />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default Users;
