import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL for API calls (ensuring trailing /api path is present)
const rawUrl = (process.env.EXPO_PUBLIC_API_URL || 'https://diamondpr.onrender.com/api').trim().replace(/\/+$/, '');
const API_URL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`;

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach the JWT token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('jwt_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error fetching token from storage', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
