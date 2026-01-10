import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import React, {useState} from 'react';
import COLORS from '../theme/Color';
import {IMAGE_URL} from '../connection/Config';
import {useNavigation} from '@react-navigation/native';
import {FontAwesome6} from "@react-native-vector-icons/fontawesome6";
import FONTS from '../theme/Fonts';
import CustomHeader from '../components/root/CustomHeader';
import {useNetworkStatus} from '../connection/UseNetworkStatus';
import Loader from '../components/root/Loader';
import Offline from '../components/root/Offline';
import FastImage from 'react-native-fast-image';
import moment from 'moment';
import {getFileType} from '../utils/fileType';
import {getImageUri} from '../constant/Module';

const MoreDetails = ({route}) => {
  const {newsItem} = route.params;
  const {width} = useWindowDimensions();

  const styles = StyleSheet.create({
    subtitle: {
      fontSize: FONTS.FONTSIZE.EXTRASMALL,
      color: COLORS.PLACEHOLDERCOLOR,
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      width: width / 1.1,
    },
    firstKey: {
      fontSize: FONTS.FONTSIZE.MEDIUM,
      color: COLORS.TITLECOLOR,
      fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
      width: width / 1.1,
    },
  });

  const {isConnected, networkLoading} = useNetworkStatus();
  const navigation = useNavigation();

  const formatDate = dateString => {
    const originalFormats = [
      'MM/DD/YYYY HH:mm:ss',
      'MM/DD/YYYY h:mm:ss A',
      'MM/DD/YYYY h:mm:ss',
      'DD-MM-YYYY',
      'YYYY-MM-DDTHH:mm:ss[Z]',
      'MM/DD/YYYY',
      'DD/MM/YYYY',
      'MM-DD-YYYY',
    ];

    const isValidDate = originalFormats.some(format =>
      moment(dateString, format, true).isValid(),
    );

    if (isValidDate) {
      const date = moment(dateString, originalFormats, true).utc();
      return date.format('YYYY-MM-DDTHH:mm:ss[Z]');
    } else {
      const date = moment(dateString, originalFormats, true).utc();
      return date.format('YYYY-MM-DDTHH:mm:ss[Z]');
    }
  };

  const formattedTime = time => {
    const formatedtime = moment(time, 'HH:mm A').format('h:mm A');
    return formatedtime;
  };

  const parsedContent = JSON.parse(newsItem.content) || [];
  const parsedKeys = JSON.parse(newsItem.keys) || [];

  const [imageErrors, setImageErrors] = useState({});

  const handleImageError = index => {
    setImageErrors(prev => ({...prev, [index]: true}));
  };

  return (
    <View style={{flex: 1, backgroundColor: COLORS.BACKGROUNDCOLOR}}>
      <CustomHeader
        leftIcon={
          <FontAwesome6 iconStyle='solid' name="angle-left" size={26} color={COLORS.LABELCOLOR} />
        }
        leftOnPress={() => navigation.goBack()}
      />

      {networkLoading ? (
        <Loader />
      ) : isConnected ? (
        <ScrollView
          contentContainerStyle={{paddingBottom: 10, flexGrow: 1}}
          showsVerticalScrollIndicator={false}>
          {parsedKeys?.map((key, keyIndex) => {
            const contentItem = parsedContent[key];
            if (
              contentItem &&
              contentItem.type === 'file' &&
              getFileType(getImageUri(contentItem?.value)) === 'image' &&
              contentItem.value
            ) {
              return (
                <View style={{height: 110, width: '100%'}}>
                  <FastImage
                    onError={() => handleImageError(contentItem.value)}
                    key={keyIndex}
                    source={
                      imageErrors[contentItem.value]
                        ? require('../assets/images/noimage.png')
                        : {
                            uri: IMAGE_URL + getImageUri(contentItem.value),
                            cache: FastImage.cacheControl.immutable,
                            priority: FastImage.priority.normal,
                          }
                    }
                    style={{width: '100%', height: '100%'}}
                    resizeMode={FastImage.resizeMode.contain}
                  />
                </View>
              );
            }
            return null;
          })}

          <View style={{marginHorizontal: 20, marginVertical: 10}}>
            {parsedKeys?.map((key, keyIndex) => {
              const contentItem = parsedContent[key];

              if (
                contentItem?.type == 'file' &&
                getFileType(getImageUri(contentItem?.value)) === 'image'
              ) {
                return null;
              }
              return (
                <Text
                  key={keyIndex}
                  style={keyIndex === 0 ? styles.firstKey : styles.subtitle}>
                  {contentItem?.value}
                </Text>
              );
            })}

            {parsedContent['date']?.value && parsedContent['time']?.value && (
              <Text style={styles.subtitle}>
                {`${moment(formatDate(parsedContent['date']?.value)).format(
                  'DD MMMM YYYY',
                )} @ ${formattedTime(parsedContent['time']?.value)}`}
              </Text>
            )}
          </View>
        </ScrollView>
      ) : (
        <Offline />
      )}
    </View>
  );
};

export default MoreDetails;
