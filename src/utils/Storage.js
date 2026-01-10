import AsyncStorage from '@react-native-async-storage/async-storage';

export const storeData = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {}
};

export const getData = async key => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    return null;
  }
};

export const removeData = async key => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {}
};

export const setEventAdminVerified = async value => {
  try {
    await AsyncStorage.setItem('isEventAdminVerified', JSON.stringify(value));
  } catch (error) {
    console.log('Error setting event admin verification:', error);
  }
};

export const getEventAdminVerified = async () => {
  try {
    const value = await AsyncStorage.getItem('isEventAdminVerified');
    return value ? JSON.parse(value) : false;
  } catch (error) {
    console.log('Error getting event admin verification:', error);
    return false;
  }
};
