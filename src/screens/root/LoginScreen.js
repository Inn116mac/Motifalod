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
import {Ionicons} from "@react-native-vector-icons/ionicons";
import {Entypo} from "@react-native-vector-icons/entypo";
import fonts from '../../theme/Fonts';
import NetInfo from '@react-native-community/netinfo';
import COLORS, {textInputBorderColor} from '../../theme/Color';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import {NOTIFY_MESSAGE} from '../../constant/Module';
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
import {Fontisto} from "@react-native-vector-icons/fontisto";

const LoginScreen = ({route}) => {
  const {width} = useWindowDimensions();
  const isFromNewPassword = route?.params?.isFromNewPassword || false;

  const styles = StyleSheet.create({
    formContainer: {
      backgroundColor: COLORS.PRIMARYWHITE,
      marginHorizontal: 10,
      borderRadius: 16,
      marginVertical: hp('4%'),
    },
    imageView: {
      alignSelf: 'center',
      width: 150,
      height: 150,
    },
    txtLabel: {
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      fontSize: fonts.FONTSIZE.SEMI,
      color: 'gray',
      textAlign: 'center',
      fontWeight: '600',
    },
    inputWrapper: {},
    label: {
      color: COLORS.TITLECOLOR,
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      fontSize: fonts.FONTSIZE.SMALL,
    },
    inputCont: {
      borderColor: textInputBorderColor,
      borderWidth: 1,
      borderRadius: 10,

      fontSize: fonts.FONTSIZE.SMALL,
      color: COLORS.PRIMARYBLACK,
    },
    forgotCont: {
      alignSelf: 'flex-end',
    },
    forogtLbl: {
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      fontSize: fonts.FONTSIZE.SMALL,
    },
    textContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flexGrow: 1,
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
    loginButton: {
      backgroundColor: COLORS.TITLECOLOR,
    },
    signupContainer: {
      alignItems: 'center',
    },
    signupText: {
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
      fontSize: fonts.FONTSIZE.MEDIUM,
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
        setUserName(cred.userName);
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

  const handlePrivacyPolicyClick = () => {
    Linking.openURL('https://www.psmtech.com/privacy-policy-for-motifalod-app/');
  };

  const handleLog = async () => {
    let data = JSON.stringify({
      userName: userName,
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
                await storeData('cred', {userName, password, rememberMe});
              } else {
                await removeData('cred');
              }
              const {result} = response.data;
              if (result) {
                await storeData('user', result);
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
              paddingHorizontal: 10,
              paddingTop: 10,
              flex: 1,
            }}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              automaticallyAdjustKeyboardInsets={true}
              contentContainerStyle={{
                flexGrow: 1,
                paddingBottom:
                  keyboardOpen && Platform.OS == 'android' ? 40 : 0,
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
                    setText={setUserName}
                    keyboardType={'email-address'}
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
          </View>
        ) : (
          <Offline />
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
