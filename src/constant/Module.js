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

export const formatPhoneToUS = value => {
  if (!value) return '';

  // Remove all non-numeric characters
  const numericValue = value.replace(/[^0-9]/g, '');

  // Only format if we have digits
  if (numericValue.length === 0) return '';

  // Format as (XXX) XXX-XXXX
  if (numericValue.length <= 3) {
    return numericValue;
  } else if (numericValue.length <= 6) {
    return `(${numericValue.slice(0, 3)}) ${numericValue.slice(3)}`;
  } else {
    return `(${numericValue.slice(0, 3)}) ${numericValue.slice(
      3,
      6,
    )}-${numericValue.slice(6, 10)}`;
  }
};

export const unformatPhone = value => {
  if (!value) return '';
  return value.replace(/[^0-9]/g, '');
};

export const isPhoneField = name => {
  const phoneFieldNames = [
    'contact',
    'phoneNumber',
    'coordinateNumber',
    'contactnumber',
    'eventcoordinatornumber',
    'phone',
    'Phone Number',
    'phone Number',
  ];
  return phoneFieldNames.includes(name);
};
