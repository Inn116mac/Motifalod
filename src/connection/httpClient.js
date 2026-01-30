import axios from 'axios';
import * as Config from '../connection/Config';
import {getData, removeData} from '../utils/Storage';
import {NavigationService} from '../utils/NavigationService';
import messaging from '@react-native-firebase/messaging';

const httpClient = axios.create({
  baseURL: Config.API_HOST,
  headers: {
    Accept: '*',
    'Content-Type': 'application/json',
  },
});

const unsubscribeFromTopic = async () => {
  const topic = 'motifalod';
  try {
    await messaging().unsubscribeFromTopic(topic);
    console.log('Successfully unsubscribed from topic due to session expiry');
  } catch (error) {
    console.error('Error unsubscribing from topic:', error);
  }
};

let isLoggingOut = false;

const handleLogout = async () => {
  if (isLoggingOut) return; // Atomic check
  isLoggingOut = true;

  try {
    await unsubscribeFromTopic();
    await removeData('user');
    NavigationService.reset('Login');
  } catch (err) {
    console.error('Logout error:', err);
  } finally {
    // Optional: Reset flag after delay to allow relogin
    setTimeout(() => {
      isLoggingOut = false;
    }, 5000);
  }
};

httpClient.interceptors.request.use(
  async config => {
    const userRes = await getData('user');
    if (userRes && userRes.token) {
      config.headers['Authorization'] = `Bearer ${userRes.token}`;
    } else {
      delete config.headers['Authorization'];
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

httpClient.interceptors.response.use(
  async response => {
    if (response.data && response.data.message === 'Token is invalid') {
      if (isLoggingOut) return response;
      await handleLogout();
      return Promise.resolve({
        data: {
          status: false,
          message: 'Session expired. Please log in to your account.',
        },
      });
    }
    return response;
  },
  async error => {
    // console.log('error : ', JSON.stringify(error?.response));
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      if (isLoggingOut) return Promise.reject(error);
      await handleLogout();
      return Promise.resolve({
        data: {
          status: false,
          message: 'Session expired. Please log in to your account.',
        },
      });
    }
    return Promise.reject(error.toString());
  },
);

export default httpClient;
