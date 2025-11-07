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
      await removeData('user');
      NavigationService.reset('Login');
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
      await unsubscribeFromTopic();
      await removeData('user');
      NavigationService.reset('Login');
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
