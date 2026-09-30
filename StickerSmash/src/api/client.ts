import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use local network IP instead of localhost so it works on Expo Go on physical devices
const API_URL = process.env.EXPO_PUBLIC_API_URL || ' https://diamondpr.onrender.com';

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
