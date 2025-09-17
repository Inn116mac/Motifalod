import {View, Text} from 'react-native';
import React from 'react';
import FONTS from '../../theme/Fonts';
import COLORS from '../../theme/Color';

export default function DowenloadProgress({progress}) {
  return (
    <View>
      <Text
        style={{
          fontFamily: FONTS.FONT_FAMILY.MEDIUM,
          color: COLORS.PRIMARYWHITE,
        }}>
        Downloading: {Math.round(progress * 100)}%
      </Text>
    </View>
  );
}
