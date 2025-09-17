import {Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import COLORS from '../../theme/Color';
import FONTS from '../../theme/Fonts';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function ButtonComponent({
  title,
  onPress,
  disabled,
  backgroundColor,
  width,
  textColor,
  paddingVertical,
  borderRadius,
  marginVertical,
  isReport,
  paddingHorizontal
}) {
  return (
    <TouchableOpacity
      disabled={disabled}
      style={{
        backgroundColor: backgroundColor ? backgroundColor : COLORS.LABELCOLOR,
        borderRadius: borderRadius ? borderRadius : 10,
        paddingVertical: paddingVertical ? paddingVertical : 8,
        marginVertical: marginVertical ? marginVertical : 10,
        paddingHorizontal: paddingHorizontal ? paddingHorizontal : 0,
        width: width ? width  : '100%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.LABELCOLOR,
        flexDirection: isReport ? 'row' : null,
        alignItems: isReport ? 'center' : null,
        justifyContent: isReport ? 'center' : null,
        gap: isReport ? 6 : null,
      }}
      onPress={onPress}>
        {isReport ? (
        <MaterialCommunityIcons
          name="microsoft-excel"
          size={32}
          color={COLORS.PRIMARYWHITE}
        />
      ) : null}
      <Text
        style={{
          color: textColor ? textColor : COLORS.PRIMARYWHITE,
          fontSize: FONTS.FONTSIZE.EXTRASMALL,
          fontFamily: FONTS.FONT_FAMILY.MEDIUM,
          textAlign: 'center',
        }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}
