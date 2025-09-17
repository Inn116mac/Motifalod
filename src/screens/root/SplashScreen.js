import React, {useEffect, useState} from 'react';
import {StyleSheet, View, Text, Animated} from 'react-native';
import {widthPercentageToDP as wp} from 'react-native-responsive-screen';
import COLORS from '../../theme/Color';
import {CommonActions, useNavigation} from '@react-navigation/native';
import {getData} from '../../utils/Storage';
import FONTS from '../../theme/Fonts';

const SplashScreen = () => {
  const [springValue] = useState(new Animated.Value(0.5));
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    Animated.spring(springValue, {
      toValue: 2,
      friction: 1,
      useNativeDriver: true,
    }).start();
  }, [springValue]);

  const getAuth = async () => {
    const user = await getData('user');
    setUserData(user);
  };

  useEffect(() => {
    getAuth();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (
        userData?.token === null ||
        userData?.token?.length === 0 ||
        !userData?.token
      ) {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{name: 'Login'}],
          }),
        );
      } else {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{name: 'Main'}],
          }),
        );
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [userData]);

  return (
    <View style={styles.container}>
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Animated.Image
          resizeMode="contain"
          source={require('../../../src/assets/images/Logo.png')}
          style={[
            styles.imageView,
            {
              transform: [{scale: springValue}],
            },
          ]}
        />
        <Text style={styles.txtLabel}>{`Welcome To \nMoti Falod`}</Text>
      </View>
      <View style={{}}>
        <Text
          style={{
            fontSize: FONTS.FONTSIZE.MEDIUM,
            fontFamily: FONTS.FONT_FAMILY.MEDIUM,
            color: COLORS.PRIMARYBLACK,
          }}>
          ~ Powered by{' '}
          <Text
            style={{
              fontSize: FONTS.FONTSIZE.SEMI,
              fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
              color: COLORS.TITLECOLOR,
            }}>
            PSMTECH LLC
          </Text>
        </Text>
      </View>
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUNDCOLOR,
  },
  txtLabel: {
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    fontSize: FONTS.FONTSIZE.SEMILARGE,
    color: COLORS.TITLECOLOR,
    marginTop: 50,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  imageView: {
    width: wp('20%'),
    height: wp('20%'),
    backgroundColor: 'transparent',
  },
});
