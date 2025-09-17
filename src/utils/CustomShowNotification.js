// import PushNotification from 'react-native-push-notification';
// import {Alert, Platform} from 'react-native';
// import FileViewer from 'react-native-file-viewer';
// import PushNotificationIOS from '@react-native-community/push-notification-ios';


// PushNotification.configure({
//   onNotification: function (notification) {
//     console.log('notify : ',notification);
    
//     const filePath = notification?.data?.filePath || notification?.filePath;
//     if (filePath) {
//       openDownloadedFile(filePath);
//     }
//     if (Platform.OS === 'ios') {
//       notification.finish(PushNotificationIOS.FetchResult.NoData);
//     }
//     // notification.finish(PushNotificationIOS.FetchResult.NoData);
//   },
//   popInitialNotification: true,
//   requestPermissions: Platform.OS === 'ios',
// });

// PushNotification.createChannel(
//   {
//     channelId: 'downloads',
//     channelName: 'Downloads', 
//   },
//   created => console.log(`createChannel returned '${created}'`),
// );

// // Function to show notification
// export const showDownloadNotification = (filePath, fileName) => {
//   console.log('Sending notification for:', filePath, fileName);
//   PushNotification.localNotification({
//     title: 'Download Complete',
//     message: `${fileName} downloaded successfully.`,
//     data: {filePath}, // Pass file path for click handling
//     channelId: 'downloads', // Make sure to create this channel
//   });
// };

// // Function to open file 
// export const openDownloadedFile = async (filePath) => {
//     try {
//       await FileViewer.open(filePath, { showOpenWithDialog: true });
//     } catch (error) {
//       Alert.alert('Error', 'Unable to open file.');
//     }
//   };