import React, { createContext, useContext, useState, useEffect } from 'react';
import { message } from 'antd';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';

// Firebase is already initialized in firebase.js

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
  const [token, setToken] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get the ID token and check for admin claims
          const idToken = await firebaseUser.getIdToken();
          const tokenResult = await firebaseUser.getIdTokenResult();

          // Check if user has admin role
          if (tokenResult.claims.admin) {
            setUser(firebaseUser);
            setToken(idToken);
            localStorage.setItem('adminToken', idToken);

            // Set default authorization header for all API calls
            const { authAPI, userAPI, contentAPI, streamingAPI, recommendationAPI, commonAPI } = await import('../utils/api');
            [authAPI, userAPI, contentAPI, streamingAPI, recommendationAPI, commonAPI].forEach(api => {
              api.defaults.headers.common['Authorization'] = `Bearer ${idToken}`;
            });
          } else {
            // User doesn't have admin role
            message.error('Admin access required');
            await signOut(auth);
            setUser(null);
            setToken(null);
            localStorage.removeItem('adminToken');
          }
        } catch (error) {
          console.error('Error getting token:', error);
          message.error('Authentication error');
          setUser(null);
          setToken(null);
          localStorage.removeItem('adminToken');
        }
      } else {
        setUser(null);
        setToken(null);
        localStorage.removeItem('adminToken');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      const { email, password } = credentials;

      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Get the ID token and check for admin claims
      const idToken = await firebaseUser.getIdToken();
      const tokenResult = await firebaseUser.getIdTokenResult();

      // Check if user has admin role
      if (!tokenResult.claims.admin) {
        await signOut(auth);
        message.error('Admin access required. Please contact your administrator.');
        return false;
      }

      message.success('Login successful');
      return true;
    } catch (error) {
      console.error('Login error:', error);

      // Handle specific Firebase auth errors
      switch (error.code) {
        case 'auth/user-not-found':
          message.error('No user found with this email address');
          break;
        case 'auth/wrong-password':
          message.error('Incorrect password');
          break;
        case 'auth/invalid-email':
          message.error('Invalid email address');
          break;
        case 'auth/too-many-requests':
          message.error('Too many failed attempts. Please try again later');
          break;
        default:
          message.error('Login failed. Please check your credentials');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      message.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      message.error('Error logging out');
    }
  };

  const refreshToken = async () => {
    if (auth.currentUser) {
      try {
        const newToken = await auth.currentUser.getIdToken(true);
        setToken(newToken);
        localStorage.setItem('adminToken', newToken);

        // Update authorization headers
        const { authAPI, userAPI, contentAPI, streamingAPI, recommendationAPI, commonAPI } = await import('../utils/api');
        [authAPI, userAPI, contentAPI, streamingAPI, recommendationAPI, commonAPI].forEach(api => {
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        });

        return newToken;
      } catch (error) {
        console.error('Token refresh error:', error);
        throw error;
      }
    }
    return null;
  };

  const value = {
    user,
    token,
    login,
    logout,
    loading,
    refreshToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};