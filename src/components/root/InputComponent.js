import {View, Text, TextInput, TouchableOpacity} from 'react-native';
import React from 'react';
import FONTS from '../../theme/Fonts';
import COLORS from '../../theme/Color';

const InputComponent = ({
  text,
  setText,
  title,
  placeholder,
  show,
  onPress,
  icon,
  secureTextEntry,
  keyboardType,
  maxLength,
}) => {
  return (
    <View style={{gap: 4}}>
      <Text
        style={{
          color: COLORS.TITLECOLOR,
          fontFamily: FONTS.FONT_FAMILY.MEDIUM,
          fontSize: FONTS.FONTSIZE.SMALL,
        }}>
        {title}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderRadius: 8,
          justifyContent: 'space-between',
          paddingHorizontal: 4,
          marginBottom: 8,
          backgroundColor: COLORS.PRIMARYWHITE,
          borderColor: COLORS.INPUTBORDER,
        }}>
        <View
          style={{
            flex: 1,
          }}>
          <TextInput
            keyboardType={keyboardType}
            secureTextEntry={secureTextEntry ? !show : false}
            numberOfLines={1}
            value={text}
            onChangeText={txt => setText(txt)}
            placeholderTextColor={COLORS.PLACEHOLDERCOLOR}
            placeholder={placeholder}
            maxLength={maxLength}
            autoCapitalize="none"
            style={{
              fontSize: FONTS.FONTSIZE.SMALL,
              fontFamily: FONTS.FONT_FAMILY.REGULAR,
              height: 44,
              paddingVertical: 0,
              color: COLORS.PRIMARYBLACK,
              width: '100%',
              includeFontPadding: false,
            }}
          />
        </View>
        {icon && <TouchableOpacity onPress={onPress}>{icon}</TouchableOpacity>}
      </View>
    </View>
  );
};

export default InputComponent;
