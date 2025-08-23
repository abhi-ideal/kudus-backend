
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Table,
  Tag,
  Button,
  Spin,
  message,
  Tabs,
  Typography,
  Space,
  Avatar,
  Statistic,
  Row,
  Col,
  Timeline,
  Progress
} from 'antd';
import {
  ArrowLeftOutlined,
  UserOutlined,
  PlayCircleOutlined,
  CreditCardOutlined,
  CalendarOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { adminEndpoints } from '../utils/api';
import moment from 'moment';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [watchHistory, setWatchHistory] = useState([]);
  const [subscriptionHistory, setSubscriptionHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    loadUserDetails();
  }, [id]);

  const loadUserDetails = async () => {
    try {
      setLoading(true);
      
      // Load user basic info
      const userResponse = await adminEndpoints.getUserById(id);
      setUser(userResponse.data.user || userResponse.data);
      
      // Load user activity (watch history)
      const activityResponse = await adminEndpoints.getUserActivity(id);
      setWatchHistory(activityResponse.data.watchHistory?.items || []);
      
      // For subscription history, we'll use placeholder data since the API might not have this endpoint yet
      // In a real implementation, you'd call something like: await adminEndpoints.getUserSubscriptionHistory(id);
      setSubscriptionHistory([
        {
          id: 1,
          plan: 'Premium',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          status: 'active',
          amount: 99.99,
          paymentMethod: 'Credit Card'
        },
        {
          id: 2,
          plan: 'Basic',
          startDate: '2023-01-01',
          endDate: '2023-12-31',
          status: 'expired',
          amount: 49.99,
          paymentMethod: 'PayPal'
        }
      ]);
      
    } catch (error) {
      console.error('Error loading user details:', error);
      message.error('Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const watchHistoryColumns = [
    {
      title: 'Content',
      dataIndex: 'contentTitle',
      key: 'contentTitle',
      render: (title, record) => (
        <Space>
          <PlayCircleOutlined />
          <div>
            <div>{title || 'Unknown Content'}</div>
            {record.episodeTitle && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Episode: {record.episodeTitle}
              </Text>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: 'Progress',
      dataIndex: 'progressPercentage',
      key: 'progressPercentage',
      render: (progress) => (
        <Progress 
          percent={Math.round(progress || 0)} 
          size="small" 
          status={progress >= 90 ? 'success' : 'active'}
        />
      ),
    },
    {
      title: 'Watch Time',
      dataIndex: 'watchDuration',
      key: 'watchDuration',
      render: (duration, record) => (
        <Text>
          {Math.floor((duration || 0) / 60)}m / {Math.floor((record.totalDuration || 0) / 60)}m
        </Text>
      ),
    },
    {
      title: 'Device',
      dataIndex: 'deviceType',
      key: 'deviceType',
      render: (device) => (
        <Tag color="blue">{device || 'Unknown'}</Tag>
      ),
    },
    {
      title: 'Watched At',
      dataIndex: 'watchedAt',
      key: 'watchedAt',
      render: (date) => moment(date).format('MMM DD, YYYY HH:mm'),
    },
  ];

  const subscriptionColumns = [
    {
      title: 'Plan',
      dataIndex: 'plan',
      key: 'plan',
      render: (plan) => (
        <Tag color={plan === 'Premium' ? 'gold' : 'blue'}>{plan}</Tag>
      ),
    },
    {
      title: 'Period',
      key: 'period',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text>{moment(record.startDate).format('MMM DD, YYYY')}</Text>
          <Text type="secondary">to {moment(record.endDate).format('MMM DD, YYYY')}</Text>
        </Space>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `$${amount}`,
    },
    {
      title: 'Payment Method',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : status === 'expired' ? 'red' : 'orange'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Title level={4}>User not found</Title>
        <Button onClick={() => navigate('/users')}>Back to Users</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="content-header">
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/users')}
          >
            Back to Users
          </Button>
          <Title level={2} style={{ margin: 0 }}>User Details</Title>
        </Space>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane
          tab={
            <span>
              <UserOutlined />
              Profile
            </span>
          }
          key="profile"
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={8}>
              <Card>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <Avatar 
                    size={80} 
                    icon={<UserOutlined />} 
                    src={user.photoURL}
                  />
                  <Title level={4} style={{ marginTop: '10px', marginBottom: '5px' }}>
                    {user.displayName || 'No Name'}
                  </Title>
                  <Text type="secondary">{user.email}</Text>
                </div>
                
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic 
                      title="Profiles" 
                      value={user.profiles?.length || 0} 
                      prefix={<UserOutlined />}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic 
                      title="Account Age" 
                      value={moment().diff(moment(user.createdAt), 'days')} 
                      suffix="days"
                      prefix={<CalendarOutlined />}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
            
            <Col xs={24} lg={16}>
              <Card title="User Information">
                <Descriptions column={2} bordered>
                  <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
                  <Descriptions.Item label="Display Name">
                    {user.displayName || 'Not set'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag color={user.status === 'active' ? 'green' : 'red'}>
                      {(user.status || 'active').toUpperCase()}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Subscription">
                    <Tag color={
                      user.subscriptionType === 'premium' ? 'gold' : 
                      user.subscriptionType === 'family' ? 'purple' : 'default'
                    }>
                      {(user.subscriptionType || 'free').toUpperCase()}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Subscription Status">
                    <Tag color={user.subscriptionStatus === 'active' ? 'green' : 'orange'}>
                      {(user.subscriptionStatus || 'inactive').toUpperCase()}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Subscription End">
                    {user.subscriptionEndDate 
                      ? moment(user.subscriptionEndDate).format('MMM DD, YYYY')
                      : 'N/A'
                    }
                  </Descriptions.Item>
                  <Descriptions.Item label="Created At">
                    {moment(user.createdAt).format('MMM DD, YYYY HH:mm')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Last Login">
                    {user.lastLoginAt 
                      ? moment(user.lastLoginAt).format('MMM DD, YYYY HH:mm')
                      : 'Never'
                    }
                  </Descriptions.Item>
                  <Descriptions.Item label="Firebase UID" span={2}>
                    <Text code>{user.firebaseUid}</Text>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane
          tab={
            <span>
              <PlayCircleOutlined />
              Watching History
            </span>
          }
          key="watching"
        >
          <Card 
            title={
              <Space>
                <ClockCircleOutlined />
                Watching History
              </Space>
            }
          >
            <Table
              columns={watchHistoryColumns}
              dataSource={watchHistory}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} items`,
              }}
              scroll={{ x: 800 }}
            />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <CreditCardOutlined />
              Subscription History
            </span>
          }
          key="subscription"
        >
          <Card 
            title={
              <Space>
                <CreditCardOutlined />
                Subscription History
              </Space>
            }
          >
            <Table
              columns={subscriptionColumns}
              dataSource={subscriptionHistory}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} subscriptions`,
              }}
            />
            
            <div style={{ marginTop: '20px' }}>
              <Title level={5}>Subscription Timeline</Title>
              <Timeline>
                {subscriptionHistory.map((sub) => (
                  <Timeline.Item
                    key={sub.id}
                    color={sub.status === 'active' ? 'green' : sub.status === 'expired' ? 'red' : 'orange'}
                  >
                    <div>
                      <Text strong>{sub.plan} Plan</Text>
                      <br />
                      <Text type="secondary">
                        {moment(sub.startDate).format('MMM DD, YYYY')} - {moment(sub.endDate).format('MMM DD, YYYY')}
                      </Text>
                      <br />
                      <Text>Amount: ${sub.amount} via {sub.paymentMethod}</Text>
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            </div>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default UserDetails;
