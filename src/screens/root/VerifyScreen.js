import React, {useState, useRef, useEffect} from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TextInput,
  ScrollView,
  Keyboard,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {NOTIFY_MESSAGE} from '../../constant/Module';
import COLORS from '../../theme/Color';
import {widthPercentageToDP} from 'react-native-responsive-screen';
import FONTS from '../../theme/Fonts';
import ButtonComponent from '../../components/root/ButtonComponent';
import {useNavigation} from '@react-navigation/native';
import CustomHeader from '../../components/root/CustomHeader';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import Offline from '../../components/root/Offline';
import {useNetworkStatus} from '../../connection/UseNetworkStatus';
import httpClient from '../../connection/httpClient';
import Loader from '../../components/root/Loader';

const VerifyScreen = ({route}) => {
  const userName = route?.params?.userName;

  const navigation = useNavigation();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isTimer, setIsTimer] = useState(true);
  const [count, setCount] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const {isConnected, networkLoading} = useNetworkStatus();

  useEffect(() => {
    const inerval = setInterval(() => {
      if (count == 0) {
        clearInterval(inerval);
        setIsTimer(false);
      } else {
        setCount(count - 1);
      }
    }, 1000);
    return () => {
      clearInterval(inerval);
    };
  }, [count]);

  const inputs = Array.from({length: 6}, () => useRef(null));

  useEffect(() => {
    if (otp.every(digit => digit !== '')) {
      Keyboard.dismiss();
    }
  }, [otp]);

  const handleChange = (text, index) => {
    if (/^[0-9]$/.test(text) || text === '') {
      const newOtp = [...otp];
      newOtp[index] = text;
      setOtp(newOtp);

      if (text && index < otp.length - 1) {
        inputs[index + 1].current.focus();
      }
    }
  };

  const handleKeyPress = (e, index) => {
    const {key} = e.nativeEvent;

    if (key === 'Backspace') {
      if (otp[index] === '') {
        if (index > 0) {
          inputs[index - 1].current.focus();
        }
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    } else {
      if (!/^[0-9]$/.test(key)) {
        e.preventDefault();
      }
    }
  };

  function validateOtp(otp) {
    if (!otp || otp.length !== 6) {
      NOTIFY_MESSAGE('Please enter a valid 6-digit OTP');
      return false;
    }

    if (!/^\d{6}$/.test(otp)) {
      NOTIFY_MESSAGE('OTP should contain only numbers');
      return false;
    }

    return true;
  }

  const otpString = otp.join('');

  function onVerifyApiCall() {
    if (!validateOtp(otpString)) {
      return;
    }
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setIsLoading(true);
        if (otpString?.length > 5 && otpString?.length < 7) {
          httpClient
            .post(`member/verifyotp?userName=${userName}&otp=${otpString}`)
            .then(response => {
              if (response.data.status) {
                NOTIFY_MESSAGE(response.data.message);
                navigation.navigate('NewPassword', {
                  userName: userName,
                });
              } else {
                NOTIFY_MESSAGE(response.data.message);
              }
            })
            .catch(err => {
              NOTIFY_MESSAGE(
                err || err?.message ? 'Something Went Wrong' : null,
              );
              navigation.goBack();
            })
            .finally(() => {
              setIsLoading(false);
            });
        }
      } else {
        NOTIFY_MESSAGE('Please check your internet connectivity');
      }
    });
  }

  const resendOtp = () => {
    setOtp(['', '', '', '', '', '']);
    httpClient
      .post(`member/forgetpassword?userName=${userName}`)
      .then(response => {
        if (response.data.status) {
          NOTIFY_MESSAGE(response?.data?.message);
        } else {
          NOTIFY_MESSAGE(response?.data?.message);
        }
      })
      .catch(err => {
        NOTIFY_MESSAGE(err || err?.message ? 'Something Went Wrong.' : null);
      });
    setIsTimer(true);
    setCount(30);
  };

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

  return (
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? undefined : 'height'}>
      <View style={{flex: 1, backgroundColor: COLORS.BACKGROUNDCOLOR}}>
        <CustomHeader
          leftOnPress={() => {
            navigation.goBack();
          }}
          leftIcon={
            <FontAwesome6
              name="angle-left"
              size={26}
              color={COLORS.LABELCOLOR}
            />
          }
        />
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: keyboardOpen && Platform.OS == 'android' ? 34 : 0,
          }}
          showsVerticalScrollIndicator={false}
          style={{
            borderRadius: 10,
            marginHorizontal: widthPercentageToDP('4%'),
            paddingHorizontal: widthPercentageToDP('4%'),
          }}>
          {networkLoading ? (
            <Loader />
          ) : isConnected ? (
            <View style={{flexGrow: 1, marginTop: 30}}>
              <Image
                resizeMode={'contain'}
                source={require('../../assets/images/Logo.png')}
                style={{
                  alignSelf: 'center',
                  width: 150,
                  height: 150,
                  backgroundColor: 'transparent',
                }}
              />

              <Text
                style={{
                  fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
                  fontSize: FONTS.FONTSIZE.LARGE,
                  color: COLORS.TITLECOLOR,
                  textAlign: 'center',
                  marginTop: 10,
                }}>
                Please enter the 6 digit code that send to your email address.
              </Text>

              <View style={styles.container}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={inputs[index]}
                    style={styles.input}
                    keyboardType="numeric"
                    maxLength={1}
                    value={digit}
                    onChangeText={text => handleChange(text, index)}
                    onKeyPress={e => handleKeyPress(e, index)}
                  />
                ))}
              </View>

              <View style={{}}>
                {isTimer ? (
                  <Text
                    style={{
                      fontSize: FONTS.FONTSIZE.SMALL,
                      color: COLORS.TITLECOLOR,
                      textAlign: 'right',
                      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                    }}>
                    00:{String(count).padStart(2, '0')}
                  </Text>
                ) : (
                  <TouchableOpacity onPress={resendOtp}>
                    <Text
                      style={{
                        textAlign: 'center',
                        color: COLORS.TITLECOLOR,
                        fontSize: FONTS.FONTSIZE.SMALL,
                        fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
                      }}>
                      Didn't receive code ?{' '}
                      <Text
                        style={{
                          color: COLORS.LABELCOLOR,
                          fontSize: FONTS.FONTSIZE.SMALL,
                          fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
                          textDecorationLine: 'underline',
                        }}>
                        resend
                      </Text>
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={{marginTop: 'auto'}}>
                <ButtonComponent
                  title={isLoading ? 'Please Wait...' : 'Verify and Proceed'}
                  onPress={onVerifyApiCall}
                  disabled={isLoading}
                />
              </View>
            </View>
          ) : (
            <Offline />
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 10,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  input: {
    borderWidth: 2,
    borderColor: COLORS.INPUTBORDER,
    width: widthPercentageToDP(12),
    textAlign: 'center',
    fontSize: FONTS.FONTSIZE.MEDIUM,
    color: COLORS.PRIMARYBLACK,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    borderRadius: 10,
    paddingVertical: 0,
    height: 50,
    backgroundColor: COLORS.PRIMARYWHITE,
  },
});
export default VerifyScreen;
