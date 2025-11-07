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
// import {NodeMediaClient} from 'react-native-nodemediaclient';
let PushNotification;
if (Platform.OS === 'android') {
  PushNotification = require('react-native-push-notification');
} else if (Platform.OS === 'ios') {
  PushNotification = require('@react-native-community/push-notification-ios');
}
LogBox.ignoreAllLogs();
const App = () => {
  // if (Platform.OS === 'ios') {
  //   NodeMediaClient.setLicense('');
  // } else {
  //   NodeMediaClient.setLicense('');
  // }
  const getDeviceId = async () => {
    const deviceId = await DeviceInfo.getUniqueId();
    await storeData('deviceId', deviceId);
  };
  useEffect(() => {
    const checkDeviceId = async () => {
      const deviceId = await getData('deviceId');
      // console.log('deviceId : ', deviceId);
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
          // console.log('Android notification permission denied');
          return;
        }
      }
    }
    // Handle iOS permissions (and Android <13)
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
    PushNotification.configure({
      onRegister: function (token) {},
      onNotification: function (notification) {
        PushNotification.createChannel({
          channelId: 'default-channel-id',
          channelName: `Default channel`,
          channelDescription: 'A default channel',
          vibrate: true,
          playSound: true,
          importance: 4,
          soundName: 'default',
        });
      },
      permissions: {
        alert: false,
        badge: false,
        sound: false,
      },
      popInitialNotification: true,
      requestPermissions: true,
    });
    messaging().onMessage(async remoteMessage => {
      // console.log('remoteMessage : ', JSON.stringify(remoteMessage));
      if (Platform.OS === 'android') {
        PushNotification.localNotification({
          title: remoteMessage.notification.title,
          message: remoteMessage.notification.body,
          channelId: 'default-channel-id',
          playSound: true,
          vibrate: true,
        });
      } else if (Platform.OS === 'ios') {
      }
    });
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      // console.log('background : ', JSON.stringify(remoteMessage));
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
