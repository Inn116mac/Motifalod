import {View, Text, useWindowDimensions} from 'react-native';
import React from 'react';
import LottieView from 'lottie-react-native';
import COLORS from '../../theme/Color';
import FONTS from '../../theme/Fonts';

export default function Offline() {
  const {width, height} = useWindowDimensions();

  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <LottieView
        source={require('../../assets/LottieAnimation/offline.json')}
        autoPlay
        loop
        style={{width: width / 1.5, height: height / 3.5}}
      />
      <Text
        style={{
          fontSize: FONTS.FONTSIZE.MEDIUM,
          fontFamily: FONTS.FONT_FAMILY.BOLD,
          color: COLORS.TITLECOLOR,
        }}>
        You Are Offline..!
      </Text>
    </View>
  );
}
