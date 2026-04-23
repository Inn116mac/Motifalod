import React, {useEffect, useState} from 'react';
import AppNavigation from './src/navigation/AppNavigation';
import {LogBox, PermissionsAndroid, Platform} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;
import messaging from '@react-native-firebase/messaging';
import {getData, storeData} from './src/utils/Storage';
import DeviceInfo from 'react-native-device-info';
import {DrawerProvider} from './src/utils/DrawerContext';
import COLORS from './src/theme/Color';
import ZoomableView from './src/components/root/ZoomableView';
import UpdateModal from './src/components/root/UpdateModal';
import httpClient from './src/connection/httpClient';
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

const compareVersions = (v1, v2) => {
  const p1 = v1.split('.').map(Number);
  const p2 = v2.split('.').map(Number);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const a = p1[i] || 0;
    const b = p2[i] || 0;
    if (a < b) return -1;
    if (a > b) return 1;
  }
  return 0;
};
const App = () => {
  const [updateModal, setUpdateModal] = useState(null);

  const checkAppVersion = async () => {
    try {
      const currentVersion = DeviceInfo.getVersion();

      const response = await httpClient.get('app/version');
      if (response?.data?.status) {
        const result = response.data.result;

        // Pick the platform-specific block (android / ios)
        const platformData = result[Platform.OS];
        if (!platformData) return;

        const {latestVersion, forceUpdate, storeUrl} = platformData;
        const {message, updatedDate, appName} = result;

        const versionBehind =
          compareVersions(currentVersion, latestVersion) < 0;
        const isForced = versionBehind && forceUpdate;

        if (versionBehind) {
          setUpdateModal({
            visible: true,
            forceUpdate: isForced,
            latestVersion,
            message,
            storeUrl,
            updatedDate,
            appName,
          });
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    checkAppVersion();
  }, []);

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

  return (
    <DrawerProvider>
      <GestureHandlerRootView
        style={{flex: 1, backgroundColor: COLORS.BACKGROUNDCOLOR}}>
        {Platform.OS === 'android' ? (
          <ZoomableView disabled={!!updateModal}>
            <AppNavigation />
          </ZoomableView>
        ) : (
          <AppNavigation />
        )}
      </GestureHandlerRootView>
      {updateModal && (
        <UpdateModal
          visible={updateModal.visible}
          forceUpdate={updateModal.forceUpdate}
          latestVersion={updateModal.latestVersion}
          message={updateModal.message}
          storeUrl={updateModal.storeUrl}
          updatedDate={updateModal.updatedDate}
          appName={updateModal.appName}
          onDismiss={
            updateModal.forceUpdate ? undefined : () => setUpdateModal(null)
          }
        />
      )}
    </DrawerProvider>
  );
};

export default App;
