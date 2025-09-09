
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Typography, Spin, Table } from 'antd';
import {
  UserOutlined,
  VideoCameraOutlined,
  EyeOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { adminEndpoints } from '../utils/api';

const { Title } = Typography;

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState(null);
  const [contentStats, setContentStats] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [userStatsRes] = await Promise.all([
        adminEndpoints.getUserStatistics(),
        // You can add content stats API call here when available
      ]);
      console.log("userStatsRes");
      console.log(userStatsRes.data.data);
      setUserStats(userStatsRes.data.data);
      
      // Mock content stats for now
      setContentStats({
        totalContent: 450,
        totalViews: 125000,
        popularContent: [
          { title: 'Action Movies', views: 25000 },
          { title: 'Drama Series', views: 18000 },
          { title: 'Comedy Shows', views: 15000 },
        ]
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  const userGrowthData = userStats?.userGrowth?.map(item => ({
    date: item.date,
    users: parseInt(item.count)
  })) || [];

  const popularContentColumns = [
    {
      title: 'Content',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Views',
      dataIndex: 'views',
      key: 'views',
      render: (views) => views.toLocaleString(),
    },
  ];

  return (
    <div>
      <div className="content-header">
        <Title level={2}>Dashboard</Title>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={userStats?.totalUsers || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Users"
              value={userStats?.activeUsers || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Content"
              value={contentStats?.totalContent || 0}
              prefix={<VideoCameraOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Views"
              value={contentStats?.totalViews || 0}
              prefix={<EyeOutlined />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={16}>
          <Card title="User Growth (Last 30 Days)">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#1890ff" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Subscription Breakdown">
            <Row gutter={16}>
              {userStats?.subscriptionBreakdown?.map((sub, index) => (
                <Col span={24} key={index} style={{ marginBottom: 16 }}>
                  <Card size="small">
                    <Statistic
                      title={sub.subscription || 'Unknown'}
                      value={sub.count}
                      valueStyle={{ fontSize: '18px' }}
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title={<><TrophyOutlined /> Popular Content</>}>
            <Table
              dataSource={contentStats?.popularContent || []}
              columns={popularContentColumns}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Quick Stats">
            <Row gutter={16}>
              <Col span={12}>
                <div className="stats-card">
                  <div className="stats-number">
                    {userStats?.overview?.activePercentage || 0}%
                  </div>
                  <div>Active User Rate</div>
                </div>
              </Col>
              <Col span={12}>
                <div className="stats-card">
                  <div className="stats-number">
                    {userStats?.inactiveUsers || 0}
                  </div>
                  <div>Blocked Users</div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
