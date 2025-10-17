import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {NOTIFY_MESSAGE, REGX} from '../../constant/Module';
import COLORS from '../../theme/Color';
import {widthPercentageToDP} from 'react-native-responsive-screen';
import FONTS from '../../theme/Fonts';
import InputComponent from '../../components/root/InputComponent';
import ButtonComponent from '../../components/root/ButtonComponent';
import {useNavigation} from '@react-navigation/native';
import CustomHeader from '../../components/root/CustomHeader';
import {FontAwesome6} from "@react-native-vector-icons/fontawesome6";
import Offline from '../../components/root/Offline';
import httpClient from '../../connection/httpClient';
import {useNetworkStatus} from '../../connection/UseNetworkStatus';
import Loader from '../../components/root/Loader';

const ForgotPass = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const {isConnected, networkLoading} = useNetworkStatus();
  const [isLoading, setIsLoading] = useState(false);

  function onForgotApiCall() {
    if (!email || email.trim().length === 0) {
      return NOTIFY_MESSAGE('Please enter a valid email address');
    }

    if (!REGX.EMAIL.test(email)) {
      return NOTIFY_MESSAGE('Invalid email. Please enter valid email address.');
    }
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setIsLoading(true);
        httpClient
          .post(`member/forgetpassword?userName=${email}`)
          .then(response => {
            if (response.data.status) {
              NOTIFY_MESSAGE(response.data.message);
              navigation.navigate('Verify', {
                userName: email,
              });
            } else {
              NOTIFY_MESSAGE(response.data.message);
            }
          })
          .catch(err => {
            NOTIFY_MESSAGE(err || err?.message ? 'Something Went Wrong' : null);
            navigation.goBack();
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        NOTIFY_MESSAGE('Please check your internet connectivity');
      }
    });
  }

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
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.BACKGROUNDCOLOR,
        }}>
        <CustomHeader
          leftOnPress={() => {
            navigation.goBack();
          }}
          leftIcon={
            <FontAwesome6
              name="angle-left"
              size={26}
              iconStyle='solid'
              color={COLORS.LABELCOLOR}
            />
          }
        />
        <ScrollView
          automaticallyAdjustKeyboardInsets={true}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: keyboardOpen && Platform.OS == 'android' ? 34 : 0,
          }}
          showsVerticalScrollIndicator={false}
          style={{
            borderRadius: 10,
            marginHorizontal: widthPercentageToDP('4%'),
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
                Please Enter Your Email Address To Receive a Verification Code.
              </Text>

              <View style={{marginBottom: 15}}>
                <InputComponent
                  text={email}
                  setText={setEmail}
                  placeholder={'Email'}
                  title={'Email'}
                />
              </View>
              <View style={{marginTop: 'auto'}}>
                <Text
                  style={{
                    textAlign: 'center',
                    fontFamily: FONTS.FONT_FAMILY.REGULAR,
                    fontSize: FONTS.FONTSIZE.SEMIMINI,
                    color: COLORS.PLACEHOLDERCOLOR,
                  }}>
                  Enter the email address associated with your account.
                </Text>
                <ButtonComponent
                  title={isLoading ? 'Please Wait...' : 'Continue'}
                  onPress={onForgotApiCall}
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

export default ForgotPass;
