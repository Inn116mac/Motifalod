import React, {useRef} from 'react';
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  Platform,
  Alert,
  PermissionsAndroid,
  TouchableOpacity,
} from 'react-native';
import FONTS from '../../../theme/Fonts';
import {captureRef} from 'react-native-view-shot';
import RNFS from 'react-native-fs';
import COLORS from '../../../theme/Color';
import {widthPercentageToDP} from 'react-native-responsive-screen';
import Share from 'react-native-share';

const Template1 = ({data}) => {
  const templateRef = useRef(null);

  const checkStoragePermission = async () => {
    if (Platform.OS === 'android') {
      if (Platform.Version < 29) {
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        );

        if (granted) {
          return true;
        } else {
          const status = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          );

          if (status === PermissionsAndroid.RESULTS.GRANTED) {
            return true;
          } else {
            throw new Error('Storage permission not granted');
          }
        }
      } else {
        return true; 
      }
    }
    return true; 
  };

  const handleCaptureTemplate = async () => {
    await checkStoragePermission();
    try {
      const uri = await captureRef(templateRef, {
        format: 'jpg',
        quality: 0.8,
      });

      saveCapturedTemplate(uri);
    } catch (error) {
    }
  };

  const saveCapturedTemplate = async uri => {
    try {
      const fileName = `template_${Date.now()}.jpg`;
      const filePath =
        Platform.OS === 'ios'
          ? `${RNFS.DocumentDirectoryPath}/${fileName}`
          : `${RNFS.DownloadDirectoryPath}/${fileName}`;

      await RNFS.moveFile(uri, filePath);

      await shareCapturedTemplate(filePath);

      Alert.alert('Success', `Template saved to ${filePath}`);
    } catch (error) {
      // console.error('Error saving template:', error);
    }
  };

  const shareCapturedTemplate = async filePath => {
    try {
      const shareOptions = {
        title: 'Share Event Template',
        url: 'file://' + filePath,
        type: 'image/jpeg',
        failOnCancel: false,
      };

      await Share.open(shareOptions);
    } catch (error) {
      // console.error('Error sharing template:', error);
    }
  };

  return (
    <View style={{flex: 1}}>
      <View collapsable={false} ref={templateRef} style={{flex: 0.85}}>
        <ImageBackground
          source={require('../../../assets/images/Template1.png')}
          style={styles.backgroundImage}
          resizeMode="cover">
          <View style={styles.textContainer}>
            <Text style={styles.title}>You are invited to</Text>
            <Text style={styles.eventName}>{data.name}</Text>
            <Text style={styles.dateVenue}>
              {data.date} | {data.time}
            </Text>
            <Text style={styles.location}>{data?.location}</Text>
          </View>
        </ImageBackground>
      </View>
      <View style={styles.downloadButtonContainer}>
        <TouchableOpacity
          onPress={handleCaptureTemplate}
          style={{
            backgroundColor: COLORS.LABELCOLOR,
            padding: 10,
            borderRadius: 10,
            width: widthPercentageToDP('50%'),
          }}>
          <Text
            style={{
              color: COLORS.PRIMARYWHITE,
              fontSize: FONTS.FONTSIZE.MEDIUM,
              fontFamily: FONTS.FONT_FAMILY.MEDIUM,
              textAlign: 'center',
            }}>
            Download & share
          </Text>
        </TouchableOpacity>
        {/* <TouchableOpacity
          onPress={shareCapturedTemplate}
          style={{
            backgroundColor: COLORS.PRIMARYWHITE,
            padding: 10,
            borderRadius: 10,
            width: widthPercentageToDP('40%'),
            borderWidth: 1,
            borderColor: COLORS.LABELCOLOR,
          }}>
          <Text
            style={{
              color: COLORS.LABELCOLOR,
              fontSize: FONTS.FONTSIZE.MEDIUM,
              fontFamily: FONTS.FONT_FAMILY.MEDIUM,
              textAlign: 'center',
            }}>
            Share
          </Text>
        </TouchableOpacity> */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  downloadButtonContainer: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 10,
    overflow: 'hidden',
  },
  textContainer: {
    flex: 1,
    marginTop: 30,
    width: '60%',
    alignSelf: 'flex-end',
    paddingRight: 20,
    alignItems: 'flex-end',
    gap: 20,
  },
  title: {
    fontSize: FONTS.FONTSIZE.MEDIUM,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    color: '#FBF7DA',
    textAlign: 'right',
  },
  eventName: {
    fontSize: FONTS.FONTSIZE.BIG,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: '#F7A7A6',
    textShadowColor: '#ccc',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,

    letterSpacing: 1,
    textAlign: 'center',
    fontSize: FONTS.FONTSIZE.BIG,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
  },
  dateVenue: {
    fontSize: FONTS.FONTSIZE.SEMI,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    color: COLORS.PRIMARYWHITE,
    marginBottom: 10,
    textAlign: 'left',
  },
  location: {
    fontSize: FONTS.FONTSIZE.EXTRASMALL,
    fontFamily: FONTS.FONT_FAMILY.ITALIC,
    color: COLORS.PRIMARYWHITE,
    textAlign: 'right',
    marginBottom: 20,
    letterSpacing: 1,
  },
});

export default Template1;
