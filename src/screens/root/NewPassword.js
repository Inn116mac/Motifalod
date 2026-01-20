import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  BackHandler,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {NOTIFY_MESSAGE} from '../../constant/Module';
import COLORS from '../../theme/Color';
import {widthPercentageToDP} from 'react-native-responsive-screen';
import FONTS from '../../theme/Fonts';
import ButtonComponent from '../../components/root/ButtonComponent';
import {CommonActions, useNavigation} from '@react-navigation/native';
import CustomHeader from '../../components/root/CustomHeader';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import Offline from '../../components/root/Offline';
import InputComponent from '../../components/root/InputComponent';
import {Entypo} from '@react-native-vector-icons/entypo';
import httpClient from '../../connection/httpClient';
import {useNetworkStatus} from '../../connection/UseNetworkStatus';
import Loader from '../../components/root/Loader';

const NewPassword = ({route}) => {
  const userName = route?.params?.userName;

  const navigation = useNavigation();
  const {isConnected, networkLoading} = useNetworkStatus();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [show, setShow] = useState(false);
  const [show1, setShow1] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  function onUpdateApiCall() {
    if (!password && !confirmPassword) {
      return alert('Password and Confirm Password must be entered.');
    }
    if (password !== confirmPassword) {
      return alert('Password and Confirm Password must be same.');
    }

    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setIsLoading(true);
        httpClient
          .post(
            `member/updatepassword?userName=${userName}&newPassword=${password}`,
          )
          .then(response => {
            if (response.data.status) {
              NOTIFY_MESSAGE(response.data.message);
              navigation.navigate('Login', {
                isFromNewPassword: true,
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

  useEffect(() => {
    const handleBackPress = () => {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: 'Login',
            },
          ],
        }),
      );
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress,
    );

    return () => {
      backHandler.remove();
    };
  }, [navigation]);

  return (
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.BACKGROUNDCOLOR,
        }}>
        <CustomHeader
          leftOnPress={() => {
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [
                  {
                    name: 'Login',
                  },
                ],
              }),
            );
          }}
          leftIcon={
            <FontAwesome6
              iconStyle="solid"
              name="angle-left"
              size={26}
              color={COLORS.LABELCOLOR}
            />
          }
        />
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom:
              keyboardOpen && Platform.OS == 'android'
                ? 34
                : keyboardOpen && Platform.OS == 'ios'
                ? 40
                : 0,
          }}
          keyboardShouldPersistTaps="handled"
          scrollToOverflowEnabled={true}
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
                Your new password must be different from priviously used
                password.
              </Text>

              <View
                style={{
                  gap: 4,
                }}>
                <InputComponent
                  givenWidth={'80%'}
                  title={'New Password *'}
                  placeholder={'Enter Password'}
                  text={password}
                  setText={setPassword}
                  icon={
                    show ? (
                      <Entypo name="eye" size={20} color={COLORS.TITLECOLOR} />
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
                <InputComponent
                  givenWidth={'80%'}
                  title={'Confirm New Password *'}
                  placeholder={'Enter Confirm Password'}
                  text={confirmPassword}
                  setText={setConfirmPassword}
                  icon={
                    show1 ? (
                      <Entypo name="eye" size={20} color={COLORS.TITLECOLOR} />
                    ) : (
                      <Entypo
                        name="eye-with-line"
                        size={20}
                        color={COLORS.TITLECOLOR}
                      />
                    )
                  }
                  show={show1}
                  secureTextEntry={true}
                  onPress={() => {
                    setShow1(!show1);
                  }}
                />
              </View>

              <View
                style={{
                  marginTop: 'auto',
                }}>
                <ButtonComponent
                  title={isLoading ? 'Please Wait...' : 'Update Password'}
                  onPress={onUpdateApiCall}
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

export default NewPassword;
