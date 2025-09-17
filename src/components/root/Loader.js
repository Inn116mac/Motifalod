import {View, Text, ActivityIndicator} from 'react-native';
import React from 'react';
import COLORS from '../../theme/Color';
import FONTS from '../../theme/Fonts';

export default function Loader() {
  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <ActivityIndicator size={'large'} color={COLORS.TITLECOLOR} />
      <Text
        style={{
          fontSize: FONTS.FONTSIZE.MEDIUM,
          fontFamily: FONTS.FONT_FAMILY.MEDIUM,
          color: COLORS.TITLECOLOR,
        }}>
        Please Wait...
      </Text>
    </View>
  );
}
