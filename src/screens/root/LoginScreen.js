import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Linking,
  ScrollView,
  useWindowDimensions,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import {Ionicons} from '@react-native-vector-icons/ionicons';
import {Entypo} from '@react-native-vector-icons/entypo';
import fonts from '../../theme/Fonts';
import NetInfo from '@react-native-community/netinfo';
import COLORS, {textInputBorderColor} from '../../theme/Color';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import {formatPhoneToUS, NOTIFY_MESSAGE} from '../../constant/Module';
import FONTS from '../../theme/Fonts';
import {CommonActions, useNavigation} from '@react-navigation/native';
import ButtonComponent from '../../components/root/ButtonComponent';
import InputComponent from '../../components/root/InputComponent';
import {getData, removeData, storeData} from '../../utils/Storage';
import Offline from '../../components/root/Offline';
import httpClient from '../../connection/httpClient';
import {useNetworkStatus} from '../../connection/UseNetworkStatus';
import Loader from '../../components/root/Loader';
import messaging from '@react-native-firebase/messaging';
import DeviceInfo from 'react-native-device-info';
import {Fontisto} from '@react-native-vector-icons/fontisto';
import Carousel from 'react-native-reanimated-carousel';
import {Feather} from '@react-native-vector-icons/feather';
import {FontAwesome5} from '@react-native-vector-icons/fontawesome5';

const LoginScreen = ({route}) => {
  const {width, height} = useWindowDimensions();

  const getLogoSize = () => {
    if (height <= 800) return 130; // Your 797px fold phone + small devices
    if (height <= 900) return 150; // Regular phones
    if (width >= 800) return 160; // Tablets
    return 140;
  };
  const logoSize = getLogoSize();

  const isFromNewPassword = route?.params?.isFromNewPassword || false;

  const styles = StyleSheet.create({
    imageView: {
      alignSelf: 'center',
      width: logoSize,
      height: logoSize,
    },
    privacyContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
    },
    checkIcon: {
      paddingHorizontal: wp('2%'),
    },
    privacyText: {
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      fontSize: fonts.FONTSIZE.SMALL,
      color: COLORS.PLACEHOLDERCOLOR,
      paddingVertical: 0,
      width: width / 1.3,
    },
    privacyLink: {
      color: 'blue',
      textDecorationLine: 'underline',
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
      fontSize: fonts.FONTSIZE.SMALL,
      paddingVertical: 0,
    },
  });

  useEffect(() => {
    if (isFromNewPassword) {
      setPassword('');
    }
  }, [isFromNewPassword]);

  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [show, setShow] = useState(false);

  const [deviceToken, setDeviceToken] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const navigation = useNavigation();
  const [rememberMe, setRememberMe] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [inputType, setInputType] = useState('');

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardOpen(true),
    );
    const hide = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardOpen(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    const loadCred = async () => {
      const cred = await getData('cred');

      if (cred && cred.userName) {
        const storedUserName = cred.userName;

        const numericOnly = storedUserName.replace(/[^0-9]/g, '');
        if (numericOnly.length === 10) {
          setUserName(formatPhoneToUS(numericOnly));
          setInputType('phone');
        } else {
          setUserName(storedUserName);
          setInputType('email');
        }

        setPassword(cred.password);
        setRememberMe(cred.rememberMe);
      }
    };
    loadCred();
  }, []);

  useEffect(() => {
    const checkDeviceToken = async () => {
      const token = await getData('deviceToken');
      if (token) {
        setDeviceToken(token);
      } else {
        messaging()
          .getToken()
          .then(async token => {
            if (token) {
              await storeData('deviceToken', token);
              setDeviceToken(token);
            }
          });
      }
    };

    checkDeviceToken();
  }, []);

  useEffect(() => {
    const checkDeviceId = async () => {
      const deviceId = await getData('deviceId');
      if (deviceId) {
        setDeviceId(deviceId);
      } else {
        const deviceId = await DeviceInfo.getUniqueId();
        if (deviceId) {
          await storeData('deviceId', deviceId);
          setDeviceId(deviceId);
        }
      }
    };

    checkDeviceId();
  }, []);

  const handleUserNameChange = value => {
    if (value.includes('@')) {
      setUserName(value);
      setInputType('email');
      return;
    }

    const isPhoneLike = /^[\d\s()-]*$/.test(value);

    if (isPhoneLike) {
      // Format as phone number
      const formatted = formatPhoneToUS(value);
      setUserName(formatted);
      setInputType('phone');
    } else {
      // Treat as email
      setUserName(value);
      setInputType('email');
    }
  };

  const handlePrivacyPolicyClick = () => {
    Linking.openURL(
      'https://www.psmtech.com/privacy-policy-for-motifalod-app/',
    );
  };

  const subscribeToTopic = async () => {
    const topic = 'motifalod';
    try {
      await messaging().subscribeToTopic(topic);
      console.log('Successfully subscribed to topic:', topic);
    } catch (error) {
      console.error('Error subscribing to topic:', error);
    }
  };

  const handleLog = async () => {
    let loginUserName = userName;
    if (inputType === 'phone') {
      loginUserName = unformatPhone(userName);
    }

    let data = JSON.stringify({
      userName: loginUserName,
      password: password,
      device: {
        deviceId: deviceId,
        deviceType: Platform.OS === 'android' ? 'android' : 'ios',
        deviceToken: deviceToken,
      },
    });

    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setIsLoading(true);
        httpClient
          .post(`member/login`, data)
          .then(async response => {
            if (response.data.status && response?.data?.result) {
              if (rememberMe) {
                await storeData('cred', {
                  userName: loginUserName,
                  password,
                  rememberMe,
                });
              } else {
                await removeData('cred');
              }
              const {result} = response.data;
              if (result) {
                await storeData('user', result);
                await subscribeToTopic();
                navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{name: 'Main'}],
                  }),
                );
                setUserName('');
                setPassword('');
              }
            } else {
              setIsLoading(false);
              NOTIFY_MESSAGE(
                response?.data?.message
                  ? response?.data?.message
                  : 'Something Went Wrong',
              );
            }
          })
          .catch(err => {
            setIsLoading(false);
            NOTIFY_MESSAGE(err || err?.message ? 'Something Went Wrong' : null);
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        NOTIFY_MESSAGE('Please check your internet connectivity');
      }
    });
  };

  const sponsorBanners = [
    {
      id: '1',
      title: 'Technology Sponsor - PSMTECH LLC',
      name: ' Low Voltage & Inngenius Software Services',
      phone: '(336) 805-6626',
      url: 'https://www.psmtech.com',
      bg: '#174880c9',
      icon: 'zap',
    },
    {
      id: '2',
      title: 'PSMTECH LLC - Low Voltage Services',
      name: 'Professional Installation & Support',
      phone: '(336) 805-6626',
      url: 'https://www.psmtech.com',
      bg: '#059669',
      icon: 'phone',
    },
    {
      id: '3',
      title: 'Inngenius Software Services',
      name: 'Web Development & Review Management',
      phone: '(336) 805-6626',
      url: 'https://www.inngenius.com',
      bg: '#d55b09be',
      icon: 'globe',
    },
  ];

  const {isConnected, networkLoading} = useNetworkStatus();

  return (
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? undefined : 'height'}>
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.BACKGROUNDCOLOR,
        }}>
        {networkLoading ? (
          <Loader />
        ) : isConnected ? (
          <View
            style={{
              flex: 1,
            }}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              automaticallyAdjustKeyboardInsets={true}
              contentContainerStyle={{
                flexGrow: 1,
                paddingBottom:
                  keyboardOpen && Platform.OS == 'android' ? 40 : 0,
                paddingHorizontal: 10,
                justifyContent: 'center',
              }}>
              <View style={{marginTop: 50}}>
                <Image
                  resizeMode={'contain'}
                  source={require('../../../src/assets/images/Logo.png')}
                  style={styles.imageView}
                />
                <Text
                  style={{
                    textAlign: 'center',
                    fontSize: FONTS.FONTSIZE.LARGE,
                    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
                    color: COLORS.TITLECOLOR,
                    marginTop: 8,
                    marginHorizontal: 20,
                  }}>
                  Welcome, Please login to your account
                </Text>

                <View style={{marginTop: 20}}>
                  <InputComponent
                    title={'Email/Phone'}
                    placeholder={'Email/Phone'}
                    text={userName}
                    setText={handleUserNameChange}
                    keyboardType={'email-address'}
                    maxLength={inputType === 'phone' ? 14 : undefined}
                  />
                  <InputComponent
                    title={'Password'}
                    placeholder={'Password'}
                    text={password}
                    setText={setPassword}
                    icon={
                      show ? (
                        <Entypo
                          name="eye"
                          size={20}
                          color={COLORS.TITLECOLOR}
                        />
                      ) : (
                        <Entypo
                          name="eye-with-line"
                          size={20}
                          color={COLORS.TITLECOLOR}
                        />
                      )
                    }
                    show={show}
                    secureTextEntry={true}
                    onPress={() => {
                      setShow(!show);
                    }}
                  />
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginHorizontal: 10,
                    }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                      }}>
                      <TouchableOpacity
                        style={{width: '12%'}}
                        onPress={() => setRememberMe(!rememberMe)}>
                        <Fontisto
                          name={
                            rememberMe ? 'checkbox-active' : 'checkbox-passive'
                          }
                          size={18}
                          color={COLORS.TITLECOLOR}
                        />
                      </TouchableOpacity>
                      <Text
                        style={{
                          color: COLORS.TITLECOLOR,
                          fontSize: FONTS.FONTSIZE.SMALL,
                          fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                        }}>
                        Remember Me
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        navigation.navigate('ForgotPass');
                      }}>
                      <Text
                        style={{
                          textAlign: 'right',
                          color: COLORS.LABELCOLOR,
                          fontSize: FONTS.FONTSIZE.SMALL,
                          fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                        }}>
                        Forgot Password?
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.privacyContainer}>
                  <Ionicons
                    name={'checkbox-sharp'}
                    color={COLORS.LABELCOLOR}
                    size={24}
                    style={styles.checkIcon}
                  />
                  <Text style={styles.privacyText}>
                    {'Please accept the privacy policy before continuing. '}
                    <Text
                      onPress={handlePrivacyPolicyClick}
                      style={styles.privacyLink}>
                      Privacy & Policy
                    </Text>
                  </Text>
                </View>
              </View>

              <View
                style={{
                  marginTop: 'auto',
                }}>
                <TouchableOpacity
                  style={{
                    marginTop: 18,
                  }}
                  onPress={() => {
                    navigation.navigate('Signup');
                  }}>
                  <Text
                    style={{
                      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                      fontSize: FONTS.FONTSIZE.LARGE,
                      textAlign: 'center',
                      color: COLORS.TITLECOLOR,
                    }}>
                    New to Moti Falod? {''}
                    <Text
                      style={{
                        fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                        fontSize: FONTS.FONTSIZE.LARGE,
                        textAlign: 'center',
                        color: COLORS.TITLECOLOR,
                        textDecorationLine: 'underline',
                      }}>
                      Sign Up
                    </Text>
                  </Text>
                </TouchableOpacity>
                <ButtonComponent
                  title={isLoading ? 'Please Wait...' : 'Login'}
                  onPress={handleLog}
                  disabled={isLoading}
                  isLogin={true}
                  width={'100%'}
                  paddingVertical={10}
                />
              </View>
            </ScrollView>
            <View>
              <Carousel
                width={width}
                height={70}
                data={sponsorBanners}
                loop
                autoPlay
                autoPlayInterval={3000}
                scrollAnimationDuration={600}
                panGestureHandlerProps={{
                  activeOffsetX: [-10, 10],
                }}
                renderItem={({item}) => (
                  <TouchableOpacity
                    activeOpacity={0.35}
                    disabled={isLoading}
                    onPress={() => Linking.openURL(item.url)}
                    style={{
                      flex: 1,
                      backgroundColor: item.bg,
                      justifyContent: 'center',
                      paddingHorizontal: 18,
                    }}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      <View
                        style={{
                          marginRight: 8,
                        }}>
                        <Feather
                          name={item.icon}
                          size={17}
                          color={COLORS.PRIMARYWHITE}
                        />
                      </View>
                      <Text
                        numberOfLines={1}
                        style={{
                          color: COLORS.PRIMARYWHITE,
                          fontSize: FONTS.FONTSIZE.MINI,
                          fontFamily: FONTS.FONT_FAMILY.BOLD,
                        }}>
                        {item.title}
                      </Text>
                    </View>
                    <View
                      style={{
                        marginLeft: 25,
                      }}>
                      <Text
                        numberOfLines={1}
                        style={{
                          color: COLORS.PRIMARYWHITE,
                          fontSize: FONTS.FONTSIZE.TOOSMALL,
                          fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                        }}>
                        {item.name}
                      </Text>
                    </View>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      <TouchableOpacity
                        onPress={() => {
                          if (item?.phone) {
                            const phoneUrl =
                              Platform.OS === 'ios'
                                ? `telprompt:${item.phone}`
                                : `tel:${item.phone}`;
                            Linking.openURL(phoneUrl);
                          }
                        }}
                        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                          marginLeft: 2,
                        }}>
                        <FontAwesome5
                          name={'phone-alt'}
                          size={14}
                          color={'white'}
                          style={{marginTop: -3, marginLeft: 2}}
                          iconStyle="solid"
                        />
                        <Text
                          numberOfLines={1}
                          style={{
                            color: COLORS.PRIMARYWHITE,
                            fontSize: FONTS.FONTSIZE.EXTRAMINI,
                            fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                          }}>
                          {item?.phone}
                        </Text>
                      </TouchableOpacity>
                      <Text
                        numberOfLines={1}
                        style={{
                          color: COLORS.PRIMARYWHITE,
                          fontSize: FONTS.FONTSIZE.EXTRAMINI,
                          fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
                          marginLeft: 5,
                        }}>
                        • {item.url.replace('https://', '')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        ) : (
          <Offline />
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
