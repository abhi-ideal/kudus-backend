
import React, { createContext, useContext, useState, useEffect } from 'react';
import { message } from 'antd';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // You can validate token here if needed
      setUser({ token });
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      // Mock login since your backend uses Firebase Auth
      // In a real scenario, you'd call your auth API
      const mockToken = 'admin-mock-token-' + Date.now();
      localStorage.setItem('adminToken', mockToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${mockToken}`;
      setUser({ token: mockToken, ...credentials });
      message.success('Login successful');
      return true;
    } catch (error) {
      message.error('Login failed');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    message.success('Logged out successfully');
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
