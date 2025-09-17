import {View, Text, TouchableOpacity, useWindowDimensions} from 'react-native';
import React from 'react';
import COLORS from '../../theme/Color';
import FONTS from '../../theme/Fonts';

export default function CustomHeader({
  leftIcon,
  title,
  leftOnPress,
  rightOnPress,
  rightIcon,
}) {
  return (
    <View
      style={{
        // height: 50,
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 10,
        justifyContent: 'space-between',
        paddingLeft: 4,
      }}>
      <TouchableOpacity
        style={{
          paddingRight: 8,
          paddingLeft: 10,
          paddingVertical: 10,
        }}
        onPress={leftOnPress}>
        {leftIcon}
      </TouchableOpacity>
      {title && (
        <Text
          numberOfLines={1}
          style={{
            fontSize: FONTS.FONTSIZE.LARGE,
            color: COLORS.LABELCOLOR,
            fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
            paddingHorizontal: 4,
            flex: 1,
            textAlign: 'center',
          }}>
          {title}
        </Text>
      )}
      <TouchableOpacity onPress={rightOnPress}>{rightIcon}</TouchableOpacity>
    </View>
  );
}
