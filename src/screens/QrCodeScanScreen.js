import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Alert,
  ScrollView,
  BackHandler,
  AppState,
  Platform,
  Linking,
} from 'react-native';
import COLORS from '../theme/Color';
import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from '@react-navigation/native';
import {Camera, CameraType} from 'react-native-camera-kit';
import {PermissionsAndroid} from 'react-native';
import {NOTIFY_MESSAGE} from '../constant/Module';
import {FontAwesome6} from "@react-native-vector-icons/fontawesome6";
import CustomHeader from '../components/root/CustomHeader';
import Loader from '../components/root/Loader';
import FONTS from '../theme/Fonts';
import NetInfo from '@react-native-community/netinfo';
import {getData, removeData, storeData} from '../utils/Storage';
import Offline from '../components/root/Offline';
import NoDataFound from '../components/root/NoDataFound';
import {AntDesign} from "@react-native-vector-icons/ant-design";
import {useNetworkStatus} from '../connection/UseNetworkStatus';
import httpClient from '../connection/httpClient';

const QrCodeScanScreen = ({route}) => {
  const {isSelfCheckIn} = route?.params;

  const isFocused = useIsFocused();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventLoading, setEventloading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);

  useEffect(() => {
    const getPermission = async () => {
      try {
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CAMERA,
          );
          setCameraPermissionGranted(
            granted === PermissionsAndroid.RESULTS.GRANTED,
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert(
              'Camera Permission Required',
              'Camera permission is needed to use this feature. Please enable it in app settings.',
              [
                {text: 'Cancel', style: 'cancel'},
                {
                  text: 'Open Settings',
                  onPress: () => Linking.openSettings(),
                },
              ],
              {cancelable: false},
            );
            setCameraPermissionGranted(false);
          }
        } else if (Platform.OS === 'ios') {
          setCameraPermissionGranted(true);
        }
      } catch (err) {
        setCameraPermissionGranted(false);
      }
    };

    getPermission();
  }, []);

  const getUser = async () => {
    const user = await getData('user');
    setUserData(user);
    setUserLoading(false);
  };

  useEffect(() => {
    getUser();
  }, []);

  const {isConnected, networkLoading} = useNetworkStatus();

  useEffect(() => {
    const appStateListener = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    return () => {
      appStateListener.remove();
    };
  }, []);

  const handleAppStateChange = async nextAppState => {
    if (nextAppState === 'background') {
      try {
        await removeData('event');
        const event = await getData('event');
        if (event === null) {
          setSelectedEvent(null);
          return;
        }
      } catch (error) {}
    }
  };

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        Alert.alert(
          'Confirm Exit',
          'Do you really want to exit From this screen?',
          [
            {
              text: 'Cancel',
              onPress: () => null,
              style: 'cancel',
            },
            {
              text: 'YES',
              onPress: () => {
                removeData('event');
                navigation.replace('Main');
              },
            },
          ],
        );
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction,
      );

      return () => backHandler.remove();
    }, [navigation]),
  );

  const getEvent = async () => {
    try {
      const event = await getData('event');

      if (event) {
        setSelectedEvent(event);
        setEventloading(true);
      } else {
        setEventloading(false);
      }
    } catch (error) {}
  };

  useEffect(() => {
    const fetchData = async () => {
      await getEvent();
    };
    fetchData();
  }, []);

  // useEffect(() => {
  //   const getPermission = async () => {
  //     try {
  //       if (Platform.OS === 'android') {
  //         const granted = await PermissionsAndroid.request(
  //           PermissionsAndroid.PERMISSIONS.CAMERA,
  //         );

  //         if (granted === PermissionsAndroid.RESULTS.GRANTED) {
  //         } else {
  //           Alert.alert(
  //             'Permission Denied',
  //             'Camera permission is required to use this feature.',
  //           );
  //         }
  //       } else if (Platform.OS === 'ios') {
  //       }
  //     } catch (err) {}
  //   };

  //   getPermission();
  // }, []);

  useEffect(() => {
    if (isSelfCheckIn) {
      setLoading(false);
      return;
    }
    getEventData();
  }, [isSelfCheckIn]);

  const getEventData = () => {
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setLoading(true);
        httpClient
          .get(
            `module/configuration/dropdown?contentType=event&moduleName=SCAN QR`,
          )
          .then(response => {
            setLoading(false);
            if (response.data.status) {
              if (response?.data?.result?.length > 0) {
                setEvents(response?.data?.result);
              } else {
                setEvents([]);
              }
            } else {
              setLoading(false);
              NOTIFY_MESSAGE(response.data.message);
            }
          })
          .catch(err => {
            setLoading(false);
            NOTIFY_MESSAGE(err || err?.message ? 'Something Went Wrong' : null);
            navigation.goBack();
          });
      } else {
        NOTIFY_MESSAGE('Please check your internet connectivity');
      }
    });
  };

  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState(null);

  const handleScan = e => {
    if (!isScanning) {
      setIsScanning(true);
      onScanQrCode(e);
    }
  };

  const onScanQrCode = async e => {
    let value = e;

    if (value) {
      try {
        const response = await httpClient.post(
          `common/ReadQRCode/${value}?scanFor=${
            isSelfCheckIn ? 'EVENT' : 'SIGN UP'
          }`,
        );

        const {data} = response;
        const {status, message, result} = data;

        if (status && result) {
          navigation.navigate('RegistrationPreviewAfterQrCode', {
            memberId: value,
            selectedEvent: selectedEvent?.name,
            userData: userData,
            isSelfCheckIn: isSelfCheckIn,
          });
        } else {
          setScanMessage(message || 'Something went wrong');
        }
      } catch (error) {
        setScanMessage(error?.message || 'Something went wrong');
      } finally {
        setIsScanning(false);
      }
    }
  };

  const messageTimeout = useRef(null);

  useEffect(() => {
    if (scanMessage) {
      clearTimeout(messageTimeout.current);
      messageTimeout.current = setTimeout(() => {
        setScanMessage(null);
      }, 5000);
    }

    return () => {
      clearTimeout(messageTimeout.current);
    };
  }, [scanMessage]);

  const handlePress = async () => {
    try {
      await removeData('event');
      const event = await getData('event');
      setSelectedEvent(event);

      if (isQrOpen) {
        setIsQrOpen(false);
      } else {
        navigation.replace('Main');
      }
    } catch (error) {}
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.BACKGROUNDCOLOR,
      }}>
      <CustomHeader
        leftOnPress={handlePress}
        leftIcon={
          <FontAwesome6 name="angle-left" iconStyle='solid' size={26} color={COLORS.LABELCOLOR} />
        }
        title={'Qrcode Scanner'}
      />
      {networkLoading || loading || userLoading ? (
        <Loader />
      ) : isConnected ? (
        !cameraPermissionGranted ? (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              marginHorizontal: 10,
            }}>
            <Text
              style={{
                fontSize: FONTS.FONTSIZE.MEDIUM,
                fontFamily: FONTS.FONT_FAMILY.BOLD,
                color: COLORS.PLACEHOLDERCOLOR,
                textAlign: 'center',
              }}>
              Camera permission is required to use this feature.
            </Text>
          </View>
        ) : isFocused && isSelfCheckIn ? (
          <View style={styles.qrContainer}>
            <Camera
              cameraType={CameraType.Back}
              style={styles.camera}
              scanBarcode={true}
              showFrame={true}
              frameColor={COLORS.PRIMARYWHITE}
              laserColor={'green'}
              onReadCode={event => {
                handleScan(event?.nativeEvent?.codeStringValue);
              }}
            />
            {scanMessage && (
              <Text
                style={{
                  position: 'absolute',
                  fontSize: FONTS.FONTSIZE.EXTRALARGE,
                  color: COLORS.PRIMARYRED,
                  fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                  textAlign: 'center',
                  top: 50,
                }}>
                {scanMessage}
              </Text>
            )}
          </View>
        ) : selectedEvent && isQrOpen ? (
          eventLoading && isFocused ? (
            <View style={styles.qrContainer}>
              <Camera
                cameraType={CameraType.Back}
                style={styles.camera}
                scanBarcode={true}
                showFrame={true}
                frameColor={COLORS.PRIMARYWHITE}
                laserColor={'green'}
                onReadCode={event => {
                  handleScan(event?.nativeEvent?.codeStringValue);
                }}
              />
              {scanMessage && (
                <Text
                  style={{
                    position: 'absolute',
                    fontSize: FONTS.FONTSIZE.EXTRALARGE,
                    color: COLORS.PRIMARYRED,
                    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                    textAlign: 'center',
                    top: 50,
                  }}>
                  {scanMessage}
                </Text>
              )}
            </View>
          ) : (
            <Loader />
          )
        ) : (
          <View
            style={{
              margin: 10,
              flex: 1,
            }}>
            <Text
              style={{
                fontSize: FONTS.FONTSIZE.EXTRASMALL,
                fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                color: COLORS.TITLECOLOR,
              }}>
              Choose Event
            </Text>
            <View
              style={{
                backgroundColor: COLORS.BACKGROUNDCOLOR,
                flex: 1,
                borderRadius: 10,
                overflow: 'hidden',
              }}>
              <TouchableOpacity
                onPress={() => {
                  setIsOpen(!isOpen);
                }}
                style={{
                  backgroundColor: COLORS.PRIMARYWHITE,
                  padding: 10,
                  justifyContent: 'space-between',
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                <Text
                  style={{
                    fontSize: FONTS.FONTSIZE.MINI,
                    fontFamily: FONTS.FONT_FAMILY.REGULAR,
                    color: COLORS.PRIMARYBLACK,
                  }}>
                  Choose Event
                </Text>
                {isOpen ? (
                  <AntDesign name="up" size={20} color={COLORS.LABELCOLOR} />
                ) : (
                  <AntDesign name="down" size={20} color={COLORS.LABELCOLOR} />
                )}
              </TouchableOpacity>
              <ScrollView
                nestedScrollEnabled={true}
                contentContainerStyle={{flexGrow: 1}}>
                {isOpen &&
                  (events?.length > 0 ? (
                    events?.map((item, index) => {
                      return (
                        <TouchableOpacity
                          key={index}
                          style={{
                            paddingHorizontal: 10,
                            backgroundColor: COLORS.PRIMARYWHITE,
                            paddingVertical: 6,
                          }}
                          onPress={async () => {
                            await storeData('event', item);
                            const event = await getData('event');
                            if (event) {
                              setSelectedEvent(event);
                              setIsQrOpen(true);
                              setEventloading(true);
                            }
                          }}>
                          <Text
                            numberOfLines={1}
                            style={{
                              fontSize: FONTS.FONTSIZE.EXTRASMALL,
                              fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                              color: COLORS.PRIMARYBLACK,
                              borderBottomWidth: 1,
                              borderBottomColor: COLORS.LIGHTGREY,
                              paddingBottom: 10,
                            }}>
                            {item.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <NoDataFound />
                  ))}
              </ScrollView>
            </View>
          </View>
        )
      ) : (
        <Offline />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  qrContainer: {
    margin: 20,
    borderRadius: 40,
    backgroundColor: COLORS.BACKGROUNDCOLOR,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  camera: {
    height: '100%',
    width: '100%',
    borderRadius: 20,
    borderColor: COLORS.PRIMARYWHITE,
    flex: 1,
  },
});

export default QrCodeScanScreen;
