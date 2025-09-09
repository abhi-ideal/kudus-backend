
import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { login } = useAuth();
  const navigate = useNavigate();

  // OTT-themed images and content
  const slides = [
    {
      image: 'https://images.unsplash.com/photo-1489599511076-4cfcdfdbcecf?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      title: 'Manage Your Content',
      subtitle: 'Upload, organize, and manage your streaming library'
    },
    {
      image: 'https://images.unsplash.com/photo-1535016120720-40c646be5580?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      title: 'Analytics & Insights',
      subtitle: 'Track viewership and engagement metrics'
    },
    {
      image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=2126&q=80',
      title: 'User Management',
      subtitle: 'Control user access and subscription plans'
    },
    {
      image: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      title: 'Content Discovery',
      subtitle: 'Curate featured content and recommendations'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const success = await login(values);
      if (success) {
        navigate('/dashboard');
      }
    } catch (error) {
      message.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex',
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
    }}>
      {/* Image Slider Section - 75% width */}
      <div style={{
        flex: '0 0 75%',
        position: 'relative',
        overflow: 'hidden',
        background: '#000'
      }}>
        {slides.map((slide, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: currentSlide === index ? 1 : 0,
              transition: 'opacity 1s ease-in-out',
              backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${slide.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              color: 'white',
              textAlign: 'center',
              padding: '0 60px'
            }}
          >
            <PlayCircleOutlined style={{ fontSize: '80px', marginBottom: '30px', color: '#e50914' }} />
            <h1 style={{ 
              fontSize: '48px', 
              fontWeight: '700', 
              marginBottom: '16px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              color: 'white'
            }}>
              {slide.title}
            </h1>
            <p style={{ 
              fontSize: '24px', 
              fontWeight: '300',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              color: 'rgba(255,255,255,0.9)',
              maxWidth: '600px'
            }}>
              {slide.subtitle}
            </p>
          </div>
        ))}
        
        {/* Slide Indicators */}
        <div style={{
          position: 'absolute',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '12px'
        }}>
          {slides.map((_, index) => (
            <div
              key={index}
              onClick={() => setCurrentSlide(index)}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: currentSlide === index ? '#e50914' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: '2px solid rgba(255,255,255,0.3)'
              }}
            />
          ))}
        </div>
      </div>

      {/* Login Form Section - 25% width */}
      <div style={{
        flex: '0 0 25%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        padding: '40px'
      }}>
        <Card
          style={{
            width: '100%',
            maxWidth: '400px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            border: 'none'
          }}
          bodyStyle={{ padding: '40px' }}
        >
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(45deg, #e50914, #ff6b6b)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 8px 16px rgba(229, 9, 20, 0.3)'
            }}>
              <PlayCircleOutlined style={{ fontSize: '30px', color: 'white' }} />
            </div>
            <Title level={2} style={{ 
              color: '#1a1a2e', 
              marginBottom: '8px',
              fontWeight: '700'
            }}>
              Kudus Admin
            </Title>
            <Text style={{ 
              color: '#666', 
              fontSize: '16px',
              fontWeight: '400'
            }}>
              Welcome back to your dashboard
            </Text>
          </div>

          <Form
            name="login"
            onFinish={onFinish}
            autoComplete="off"
            layout="vertical"
          >
            <Form.Item
              name="email"
              label={<span style={{ color: '#1a1a2e', fontWeight: '500' }}>Email Address</span>}
              rules={[
                {
                  required: true,
                  message: 'Please input your email!',
                },
                {
                  type: 'email',
                  message: 'Please enter a valid email!',
                },
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#666' }} />}
                placeholder="Enter your email"
                size="large"
                style={{
                  borderRadius: '8px',
                  border: '2px solid #e8e8e8',
                  fontSize: '16px'
                }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span style={{ color: '#1a1a2e', fontWeight: '500' }}>Password</span>}
              rules={[
                {
                  required: true,
                  message: 'Please input your password!',
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#666' }} />}
                placeholder="Enter your password"
                size="large"
                style={{
                  borderRadius: '8px',
                  border: '2px solid #e8e8e8',
                  fontSize: '16px'
                }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: '16px' }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
                style={{ 
                  width: '100%',
                  height: '48px',
                  borderRadius: '8px',
                  background: 'linear-gradient(45deg, #e50914, #ff6b6b)',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: '600',
                  boxShadow: '0 4px 12px rgba(229, 9, 20, 0.3)'
                }}
              >
                Sign In to Dashboard
              </Button>
            </Form.Item>
          </Form>

          <div style={{ 
            textAlign: 'center', 
            fontSize: '14px', 
            color: '#999',
            borderTop: '1px solid #eee',
            paddingTop: '20px'
          }}>
            <PlayCircleOutlined style={{ marginRight: '8px' }} />
            Secure admin access with Firebase authentication
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
