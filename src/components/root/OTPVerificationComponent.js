import React, {useState, useRef, useEffect} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  Keyboard,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {NOTIFY_MESSAGE} from '../../constant/Module';
import COLORS from '../../theme/Color';
import {widthPercentageToDP} from 'react-native-responsive-screen';
import FONTS from '../../theme/Fonts';
import ButtonComponent from '../../components/root/ButtonComponent';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import Offline from '../../components/root/Offline';
import {useNetworkStatus} from '../../connection/UseNetworkStatus';
import httpClient from '../../connection/httpClient';
import Loader from '../../components/root/Loader';
import CustomHeader from '../../components/root/CustomHeader';

const OTPVerificationComponent = ({
  userName,
  onVerifySuccess,
  onVerifyError,
  onBack,
  verifyApiEndpoint = 'member/verifyotp',
  resendApiEndpoint = 'member/forgetpassword',
  otpLength = 6,
  initialTimer = 60,
  showHeader = true,
  headerTitle = 'Moti Falod',
  instructionText = 'Please enter the 6 digit code that sent to your email address.',
  showLogo = true,
  logoSource = require('../../assets/images/Image.png'),
  customStyles = {},
  isFromDrawer,
}) => {
  const [otp, setOtp] = useState(Array(otpLength).fill(''));
  const [isTimer, setIsTimer] = useState(true);
  const [count, setCount] = useState(initialTimer);
  const [isLoading, setIsLoading] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const {isConnected, networkLoading} = useNetworkStatus();

  const inputs = Array.from({length: otpLength}, () => useRef(null));

  // Timer logic
  useEffect(() => {
    const interval = setInterval(() => {
      if (count === 0) {
        clearInterval(interval);
        setIsTimer(false);
      } else {
        setCount(count - 1);
      }
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [count]);

  // Auto dismiss keyboard when OTP is complete
  useEffect(() => {
    if (otp.every(digit => digit !== '')) {
      Keyboard.dismiss();
    }
  }, [otp]);

  // Keyboard listeners
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

  const validateOtp = otpString => {
    if (!otpString || otpString.length !== otpLength) {
      NOTIFY_MESSAGE(`Please enter a valid ${otpLength}-digit OTP`);
      return false;
    }

    if (!/^\d+$/.test(otpString)) {
      NOTIFY_MESSAGE('OTP should contain only numbers');
      return false;
    }

    return true;
  };

  const otpString = otp.join('');

  const onVerifyApiCall = () => {
    if (!validateOtp(otpString)) {
      return;
    }

    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setIsLoading(true);
        httpClient
          .post(`${verifyApiEndpoint}?userName=${userName}&otp=${otpString}`)
          .then(response => {
            if (response.data.status) {
              NOTIFY_MESSAGE(response.data.message);
              if (onVerifySuccess) {
                onVerifySuccess(response.data);
              }
            } else {
              NOTIFY_MESSAGE(response.data.message);
            }
          })
          .catch(err => {
            NOTIFY_MESSAGE(err || err?.message ? 'Something Went Wrong' : null);
            if (onVerifyError) {
              onVerifyError(err);
            }
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        NOTIFY_MESSAGE('Please check your internet connectivity');
      }
    });
  };

  const resendOtp = () => {
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        httpClient
          .post(`${resendApiEndpoint}?userName=${userName}`)
          .then(response => {
            if (response.data.status) {
              NOTIFY_MESSAGE(response?.data?.message);
            } else {
              NOTIFY_MESSAGE(response?.data?.message);
            }
          })
          .catch(err => {
            NOTIFY_MESSAGE(
              err || err?.message ? 'Something Went Wrong.' : null,
            );
          });
        setIsTimer(true);
        setCount(initialTimer);
        setOtp(Array(otpLength).fill(''));
      } else {
        NOTIFY_MESSAGE('Please check your internet connectivity');
      }
    });
  };

  return (
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? undefined : 'height'}>
      <View style={{flex: 1, backgroundColor: COLORS.BACKGROUNDCOLOR}}>
        {showHeader && (
          <CustomHeader
            leftOnPress={onBack}
            leftIcon={
              <FontAwesome6
                name="angle-left"
                size={26}
                color={COLORS.LABELCOLOR}
                iconStyle="solid"
              />
            }
          />
        )}
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: keyboardOpen && Platform.OS === 'android' ? 34 : 0,
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
            <View style={{flexGrow: 1, marginTop: isFromDrawer ? 0 : 30}}>
              {showLogo && (
                <>
                  <Image
                    resizeMode={'contain'}
                    source={logoSource}
                    style={{
                      alignSelf: 'center',
                      width: 150,
                      height: 150,
                      backgroundColor: 'transparent',
                    }}
                  />
                </>
              )}
              <Text
                style={{
                  fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
                  fontSize: FONTS.FONTSIZE.LARGE,
                  color: COLORS.TITLECOLOR,
                  textAlign: 'center',
                  marginTop: showLogo ? 0 : 20,
                }}>
                {instructionText}
              </Text>

              <View style={styles.container}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={inputs[index]}
                    style={[
                      styles.input,
                      customStyles.input,
                      {width: widthPercentageToDP(12)},
                    ]}
                    keyboardType="numeric"
                    maxLength={1}
                    value={digit}
                    onChangeText={text => handleChange(text, index)}
                    onKeyPress={e => handleKeyPress(e, index)}
                  />
                ))}
              </View>

              <View>
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
                      Didn't receive code?{' '}
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

export default OTPVerificationComponent;
