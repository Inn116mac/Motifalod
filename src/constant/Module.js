import {Platform, ToastAndroid, Alert} from 'react-native';

export function NOTIFY_MESSAGE(msg) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  } else {
    Alert.alert(msg);
  }
}

export function SHOW_ALERT(title, msg) {
  Alert.alert(
    title ? title : 'Alert',
    msg,
    [
      {
        text: 'Cancel',
        onPress: () => {},
        style: 'cancel',
      },
      {text: 'OK', onPress: () => {}},
    ],
    {cancelable: false},
  );
}

export const REGX = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  HTML: /(<([^>]+)>)/gi,
  WEBSITE:
    /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,9}(:[0-9]{1,5})?(\/.*)?$/,
};

export const capitalizeFirstLetter = string => {
  if (!string) return '';
  return string?.charAt(0)?.toUpperCase() + string?.slice(1);
};

export const getImageUri = imageData => {
  if (!imageData) return null;
  try {
    const parsed = JSON.parse(imageData);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed[0];
    }
    return imageData;
  } catch (e) {
    return imageData;
  }
};
