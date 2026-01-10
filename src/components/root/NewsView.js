import React, {useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import COLORS from '../../theme/Color';
import FONTS from '../../theme/Fonts';
import {IMAGE_URL} from '../../connection/Config';
import FastImage from 'react-native-fast-image';
import NoDataFound from './NoDataFound';
import {useNavigation} from '@react-navigation/native';
import moment from 'moment';
import {getImageUri} from '../../constant/Module';

export default function NewsView({data}) {
  const navigation = useNavigation();
  const [imageErrors, setImageErrors] = useState({});
  const {width, height} = useWindowDimensions();
  const styles = StyleSheet.create({
    card: {
      borderRadius: 10,
      flexDirection: 'row',
      borderBottomWidth: 0.6,
      borderBottomColor: COLORS.BOTTOMBORDERCOLOR,
      gap: 10,
      marginVertical: 10,
      paddingBottom: 10,
    },
    image: {
      height: height / 7,
      width: width / 3.2,
      borderRadius: 10,
      backgroundColor: '#f0f0f0',
    },
    title: {
      fontSize: FONTS.FONTSIZE.EXTRASMALL,
      // marginBottom: 4,
      fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
      color: COLORS.TITLECOLOR,
      width: width / 1.8,
    },
    date: {
      fontSize: FONTS.FONTSIZE.EXTRASMALL,
      // marginBottom: 4,
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      color: COLORS.PLACEHOLDERCOLOR,
      width: width / 1.8,
    },
    subtitle: {
      fontSize: FONTS.FONTSIZE.EXTRASMALL,
      color: COLORS.PLACEHOLDERCOLOR,
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      width: width / 1.8,
    },
  });

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

  const renderNewsItem = ({item, index}) => {
    const parsedContent = JSON.parse(item.content);

    const heading = parsedContent.heading?.value;
    const description = parsedContent.description?.value;
    const imageUri = getImageUri(parsedContent?.image?.value);
    const date = parsedContent.date ? parsedContent.date?.value : '';

    const time = parsedContent.time ? parsedContent.time?.value : '';

    const handleImageError = index => {
      setImageErrors(prev => ({...prev, [index]: true}));
    };

    return (
      <TouchableOpacity
        key={index}
        style={styles.card}
        activeOpacity={0.35}
        onPress={() =>
          navigation.navigate('NewsDetails', {
            newsItem: item,
          })
        }>
        <FastImage
          defaultSource={require('../../assets/images/Image_placeholder.png')}
          source={
            imageErrors[index]
              ? require('../../assets/images/noimage.png')
              : {
                  uri: IMAGE_URL + imageUri,
                  cache: FastImage.cacheControl.immutable,
                  priority: FastImage.priority.normal,
                }
          }
          onError={() => handleImageError(index)}
          style={styles.image}
          resizeMode={imageErrors[index] ? 'contain' : 'cover'}
        />
        <View style={{}}>
          <Text numberOfLines={2} style={styles.title}>
            {heading}
          </Text>
          <Text numberOfLines={2} style={styles.date}>
            {date || time
              ? `${
                  date && moment(formatDate(date)).format('DD MMMM YYYY') + ' @'
                }${date ? ' ' : ''}${time ? formattedTime(time) : ''}`
              : null}
          </Text>

          <Text numberOfLines={2} style={styles.subtitle}>
            {description}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{flex: 1}}>
      {data?.length > 0 ? (
        <View style={{flex: 1}}>
          <FlatList
            contentContainerStyle={{
              flexGrow: 1,
              padding: 10,
            }}
            data={data}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderNewsItem}
            removeClippedSubviews={true}
            maxToRenderPerBatch={30}
            updateCellsBatchingPeriod={200}
            windowSize={40}
            initialNumToRender={10}
          />
        </View>
      ) : (
        <NoDataFound />
      )}
    </View>
  );
}
