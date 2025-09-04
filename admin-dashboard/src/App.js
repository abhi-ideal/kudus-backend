import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Content from './pages/Content';
import Login from './pages/Login';
import ContentDetails from './pages/ContentDetails';
import UserDetails from './pages/UserDetails';
import Genres from './pages/Genres';
import FAQ from './pages/FAQ';
import ContactUs from './pages/ContactUs';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import ContentMappings from './pages/ContentMappings';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#e50914',
        },
      }}
    >
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/users" element={<Users />} />
                      <Route path="/users/:id" element={<UserDetails />} /> {/* Added route for UserDetails */}
                      <Route path="/content" element={<Content />} />
                      <Route path="/content/:id" element={<ContentDetails />} /> {/* Added route for ContentDetails */}
                      <Route path="/content-mappings" element={<ContentMappings />} />
                      <Route path="/genres" element={<Genres />} />
                      <Route path="/faq" element={<FAQ />} />
                      <Route path="/contact-us" element={<ContactUs />} />
                      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                      <Route path="/terms-conditions" element={<TermsConditions />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;