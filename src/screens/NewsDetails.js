import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import React, {useEffect, useState} from 'react';
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
import {getImageUri} from '../constant/Module';

const NewsDetails = ({route}) => {
  const {newsItem} = route.params;
  const {width, height} = useWindowDimensions();
  const isFolded = width >= 600;

  const styles = StyleSheet.create({
    title: {
      fontSize: FONTS.FONTSIZE.EXTRASMALL,
      fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
      color: COLORS.TITLECOLOR,
      width: width / 1.2,
    },
    subtitle: {
      fontSize: FONTS.FONTSIZE.EXTRASMALL,
      color: COLORS.PLACEHOLDERCOLOR,
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      width: width / 1.1,
    },
    dateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 5,
    },
  });

  const [imagePath, setImagePath] = useState(null);
  const {isConnected, networkLoading} = useNetworkStatus();
  const navigation = useNavigation();

  const [description, setDescription] = useState('');
  const [date, setDate] = useState(null);
  const [timeValue, setTimeValue] = useState(null);
  const [heading, setHeading] = useState(null);

  useEffect(() => {
    if (newsItem?.content) {
      const parsedContent = JSON.parse(newsItem.content);
      setDescription(parsedContent.description?.value || '');
      setDate(parsedContent.date?.value || '');
      setTimeValue(parsedContent.time?.value || '');
      setHeading(parsedContent.heading?.value || '');
      setImagePath(getImageUri(parsedContent.image?.value));
    }
  }, [newsItem]);

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

  const [hasError, setHasError] = useState(false);

  return (
    <View style={{flex: 1, backgroundColor: COLORS.BACKGROUNDCOLOR}}>
      <CustomHeader
        leftIcon={
          <FontAwesome6 name="angle-left" iconStyle='solid' size={26} color={COLORS.LABELCOLOR} />
        }
        title={heading}
        leftOnPress={() => navigation.goBack()}
      />

      {networkLoading ? (
        <Loader />
      ) : isConnected ? (
        <ScrollView
          contentContainerStyle={{paddingBottom: 10, flexGrow: 1}}
          showsVerticalScrollIndicator={false}>
          <View style={{height: isFolded ? height / 3 : height / 5}}>
            <FastImage
              defaultSource={require('../assets/images/Image_placeholder.png')}
              source={
                hasError
                  ? require('../assets/images/noimage.png')
                  : {
                      uri: IMAGE_URL + imagePath,
                      cache: FastImage.cacheControl.immutable,
                      priority: FastImage.priority.normal,
                    }
              }
              style={{height: '100%', width: '100%'}}
              resizeMode={hasError ? 'contain' : 'cover'}
              onError={() => {
                setHasError(true);
              }}
            />
          </View>
          <View
            style={{
              marginHorizontal: 10,
              marginVertical: 10,
            }}>
            <Text style={styles.title}>{heading}</Text>
            <View style={styles.dateContainer}>
              <Text style={styles.subtitle}>
                {date || timeValue
                  ? `${
                      date &&
                      moment(formatDate(date)).format('DD MMMM YYYY') + ' @'
                      }${date ? ' ' : ''}${
                      timeValue ? formattedTime(timeValue) : ''
                    }`
                  : null}
              </Text>
            </View>
            <View
              style={{
                borderBottomWidth: 0.6,
                borderBottomColor: COLORS.BOTTOMBORDERCOLOR,
                marginBottom: 10,
              }}
            />
            <Text style={styles.subtitle}>{description}</Text>
          </View>
        </ScrollView>
      ) : (
        <Offline />
      )}
    </View>
  );
};

export default NewsDetails;
