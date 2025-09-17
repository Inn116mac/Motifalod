import {View, Text} from 'react-native';
import React from 'react';
import FONTS from '../../theme/Fonts';
import COLORS from '../../theme/Color';

export default function NoDataFound() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <Text
        style={{
          fontSize: FONTS.FONTSIZE.MEDIUM,
          fontFamily: FONTS.FONT_FAMILY.MEDIUM,
          color: COLORS.PLACEHOLDERCOLOR,
        }}>
        No Data Found.
      </Text>
    </View>
  );
}
