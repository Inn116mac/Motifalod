import React, {useEffect} from 'react';
import OTPVerificationComponent from '../../components/root/OTPVerificationComponent';
import {CommonActions, useNavigation} from '@react-navigation/native';
import {BackHandler} from 'react-native';

const VerifyScreen = ({route}) => {
  const userName = route?.params?.userName;
  const userInfo = route?.params?.userInfo;

  const navigation = useNavigation();

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
    <OTPVerificationComponent
      userName={userName}
      onVerifySuccess={data => {
        navigation.navigate('NewPassword', {
          userName: userName,
          userInfo: userInfo,
        });
      }}
      onVerifyError={error => {
        navigation.goBack();
      }}
      onBack={() => {
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
      otpLength={6}
      initialTimer={60}
      showHeader={true}
      showLogo={true}
    />
  );
};

export default VerifyScreen;
