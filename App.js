import React, {useEffect, useRef} from 'react';
import AppNavigation from './src/navigation/AppNavigation';
import {LogBox, PermissionsAndroid, Platform, StyleSheet} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;
import messaging from '@react-native-firebase/messaging';
import {getData, storeData} from './src/utils/Storage';
import DeviceInfo from 'react-native-device-info';
import {DrawerProvider} from './src/utils/DrawerContext';
import COLORS from './src/theme/Color';
import ZoomableView from './src/components/root/ZoomableView';
let PushNotification;
let PushNotificationIOS;
if (Platform.OS === 'android') {
  PushNotification = require('react-native-push-notification');
} else if (Platform.OS === 'ios') {
  PushNotification = require('@react-native-community/push-notification-ios');
  PushNotificationIOS =
    require('@react-native-community/push-notification-ios').default;
}
LogBox.ignoreAllLogs();
messaging().setBackgroundMessageHandler(async remoteMessage => {});
const App = () => {
  const getDeviceId = async () => {
    const deviceId = await DeviceInfo.getUniqueId();
    await storeData('deviceId', deviceId);
  };
  useEffect(() => {
    const checkDeviceId = async () => {
      const deviceId = await getData('deviceId');
      if (!deviceId) {
        await getDeviceId();
      }
    };
    checkDeviceId();
  }, []);
  useEffect(() => {
    const initializeNotifications = async () => {
      createNotification();
    };
    initializeNotifications();
  }, []);
  useEffect(() => {
    const checkDeviceToken = async () => {
      const existingToken = await getData('deviceToken');
      if (!existingToken) {
        await requestUserPermission();
      }
    };
    checkDeviceToken();
  }, []);
  const requestUserPermission = async () => {
    if (Platform.OS === 'android') {
      const hasPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      if (!hasPermission) {
        const status = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        if (status !== 'granted') {
          return;
        }
      }
    }
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    if (enabled) {
      const token = await messaging().getToken();
      await storeData('deviceToken', token);
    }
  };

  const createNotification = () => {
    if (Platform.OS === 'android') {
      PushNotification.createChannel({
        channelId: 'default-channel-id',
        channelName: 'Default channel',
        channelDescription: 'A default channel',
        vibrate: true,
        playSound: true,
        importance: 4,
        soundName: 'default',
      });
    }

    PushNotification.configure({
      onRegister: function (token) {},
      onNotification: function (notification) {
        if (Platform.OS === 'ios') {
          notification.finish(PushNotificationIOS.FetchResult.NoData);
        }
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });

    messaging().onMessage(async remoteMessage => {
      if (Platform.OS === 'android') {
        PushNotification.localNotification({
          id: Math.floor(Math.random() * 1000000), // Add unique ID
          channelId: 'default-channel-id',
          title: remoteMessage.notification?.title || '',
          message: remoteMessage.notification?.body || '',
          playSound: true,
          vibrate: true,
        });
      }
    });
  };
  const scrollRef = useRef(null);

  return (
    <DrawerProvider>
      <GestureHandlerRootView
        style={{flex: 1, backgroundColor: COLORS.BACKGROUNDCOLOR}}>
        {Platform.OS === 'android' ? (
          <ZoomableView simultaneousHandlers={scrollRef}>
            <AppNavigation />
          </ZoomableView>
        ) : (
          <AppNavigation />
        )}
      </GestureHandlerRootView>
    </DrawerProvider>
  );
};

export default App;
