import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import React  from 'react';
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
  givenWidth,
}) => {
  const {width} = useWindowDimensions();

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
            width: givenWidth ? givenWidth : width / 1.2,
            // marginVertical: 8,
          }}>
          <TextInput
            keyboardType={keyboardType}
            secureTextEntry={secureTextEntry ? !show : false}
            numberOfLines={1}
            value={text}
            onChangeText={txt => setText(txt)}
            placeholderTextColor={COLORS.PLACEHOLDERCOLOR}
            placeholder={placeholder}
            autoCapitalize="none"
            style={{
              fontSize: FONTS.FONTSIZE.MINI,
              fontFamily: FONTS.FONT_FAMILY.REGULAR,
              height: 38,
              paddingVertical: 0,
              color: COLORS.PRIMARYBLACK,
              width: '100%',
            }}
          />
        </View>
        <TouchableOpacity onPress={onPress}>{icon}</TouchableOpacity>
      </View>
    </View>
  );
};

export default InputComponent;
