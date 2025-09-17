import {getFontSize} from './fontConfig';

const FONTS = {

  FONTSIZE: {
    EXTRAMICRO:getFontSize(10),
    MICRO:getFontSize(11),
    EXTRAMINI: getFontSize(12),
    MINI: getFontSize(13),
    SEMIMINI: getFontSize(14),
    SMALL: getFontSize(15),
    EXTRASMALL: getFontSize(16),
    MEDIUM: getFontSize(17),
    SEMI: getFontSize(19),
    LARGE: getFontSize(21),
    MEDIUMLARGE: getFontSize(23),
    SEMILARGE: getFontSize(25),
    EXTRALARGE: getFontSize(27),
    BIG: getFontSize(29),
    BIGLARGE: getFontSize(33),
  },

  FONT_FAMILY: {
    THIN: 'Poppins-Thin',
    SEMI_BOLD: 'Poppins-SemiBold',
    REGULAR: 'Poppins-Regular',
    MEDIUM: 'Poppins-Medium',
    LIGHT: 'Poppins-Light',
    ITALIC: 'Poppins-Italic',
    EXTRA_LIGHT: 'Poppins-ExtraLight',
    EXTRA_BOLD: 'Poppins-ExtraBold',
    BOLD: 'Poppins-Bold',
    BLACK: 'Poppins-Black',
    ROBOTO_RG: 'roboto-regular',
    ROBOTO_700: 'roboto-700',
  },
};

export default FONTS;
