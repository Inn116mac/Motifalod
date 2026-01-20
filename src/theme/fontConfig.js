import {Dimensions, PixelRatio} from 'react-native';

// Get device screen dimensions
const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

// Use the smaller dimension for scaling
const SCALE = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT);

const BASE_WIDTH = 375;

// Font size configuration based on device type and size category
const fontConfig = {
  phone: {
    small: {min: 0.8, max: 1},
    medium: {min: 0.9, max: 1.1},
    large: {min: 1, max: 1.2},
  },
  tablet: {
    small: {min: 1.3, max: 1.4},
    medium: {min: 1.4, max: 1.5},
    large: {min: 1.5, max: 1.7},
  },
};

// Helper function to determine device type
export const getDeviceType = () => {
  const pixelDensity = PixelRatio.get();

  const adjustedWidth = SCREEN_WIDTH * pixelDensity;
  const adjustedHeight = SCREEN_HEIGHT * pixelDensity;

  if (pixelDensity < 2 && (adjustedWidth >= 1000 || adjustedHeight >= 1000)) {
    return 'tablet';
  } else if (
    pixelDensity === 2 &&
    (adjustedWidth >= 1920 || adjustedHeight >= 1920)
  ) {
    return 'tablet';
  } else {
    return 'phone';
  }
};

// Helper function to categorize screen size
const getScreenSizeCategory = () => {
  if (SCALE < 400) return 'small';
  if (SCALE > 450) return 'large';
  return 'medium';
};

// Main function to get responsive font size
export const getFontSize = size => {
  const deviceType = getDeviceType();
  const screenCategory = getScreenSizeCategory();

  const config = fontConfig[deviceType][screenCategory];

  // Calculate scale factor based on device width
  const scaleFactor = SCALE / BASE_WIDTH;

  // Clamp the scale factor within min and max bounds
  const clampedScaleFactor = Math.min(
    Math.max(scaleFactor, config.min),
    config.max,
  );

  // Calculate the scaled font size
  let newSize = size * clampedScaleFactor;

  // Optional: Slightly increase font size on tablets for better readability
  if (deviceType === 'tablet') {
    newSize *= 0.8; // Increase by 10%
  }

  // Round to nearest pixel and adjust for font scaling
  return (
    Math.round(PixelRatio.roundToNearestPixel(newSize)) /
    PixelRatio.getFontScale()
  );
};

// Function to dynamically adjust font configuration
export const adjustFontConfig = (
  deviceType,
  sizeCategory,
  minScale,
  maxScale,
) => {
  if (fontConfig[deviceType] && fontConfig[deviceType][sizeCategory]) {
    fontConfig[deviceType][sizeCategory] = {min: minScale, max: maxScale};
  }
};
