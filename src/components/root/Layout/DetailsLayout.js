import React, {useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import {useNavigation} from '@react-navigation/native';
import moment from 'moment';
import COLORS from '../../../theme/Color';
import FONTS from '../../../theme/Fonts';
import {IMAGE_URL} from '../../../connection/Config';
import NoDataFound from '../NoDataFound';
import {getImageUri} from '../../../constant/Module';

export default function DetailsLayout({data}) {
  const navigation = useNavigation();
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
      width: width / 3.5,
      borderRadius: 10,
    },
    subtitle: {
      fontSize: FONTS.FONTSIZE.EXTRASMALL,
      color: COLORS.PLACEHOLDERCOLOR,
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
    },
    firstKey: {
      fontSize: FONTS.FONTSIZE.MEDIUM,
      color: COLORS.TITLECOLOR,
      fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
      marginBottom: 4,
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

  const [imageErrors, setImageErrors] = useState({});

  const renderNewsItem = ({item, index}) => {
    const parsedContent = JSON.parse(item.content || '{}');
    const keys = JSON.parse(item.keys || '[]');

    const formattedKeys = keys.filter(
      key => parsedContent[key]?.type !== 'file',
    );
    const filterKeys = formattedKeys.slice(0, 2);

    const handleImageError = index => {
      setImageErrors(prev => ({...prev, [index]: true}));
    };

    return (
      <View key={index} style={styles.card}>
        {keys.map(key => {
          const contentItem = parsedContent[key];

          if (contentItem) {
            if (contentItem && contentItem.type === 'file') {
              return (
                <FastImage
                  defaultSource={require('../../../assets/images/Image_placeholder.png')}
                  key={key}
                  onError={() => handleImageError(index)}
                  source={
                    imageErrors[index]
                      ? require('../../../assets/images/noimage.png')
                      : {
                          uri: IMAGE_URL + getImageUri(contentItem.value),
                          cache: FastImage.cacheControl.immutable,
                          priority: FastImage.priority.normal,
                        }
                  }
                  style={{width: 110, height: 110, borderRadius: 10}}
                  resizeMode={FastImage.resizeMode.cover}
                />
              );
            }
          }
          return null;
        })}

        <View style={{flex:1}}>
          {filterKeys.map((key, keyIndex) => {
            const contentItem = parsedContent[key];

            if (contentItem) {
              if (
                ['hidden', 'header', 'button', 'section'].includes(
                  contentItem.type,
                )
              ) {
                return null;
              } else if (contentItem.value) {
                if (contentItem.type === 'date') {
                  return (
                    <Text key={keyIndex} style={styles.subtitle}>
                      {moment(formatDate(contentItem.value)).format(
                        'DD MMMM YYYY',
                      )}
                    </Text>
                  );
                } else if (contentItem.type === 'time') {
                  return (
                    <Text key={keyIndex} style={styles.subtitle}>
                      {formattedTime(contentItem.value)}
                    </Text>
                  );
                } else {
                  return (
                    <Text
                      key={keyIndex}
                      style={
                        keyIndex === 0 ? styles.firstKey : styles.subtitle
                      }>
                      {contentItem.value}
                    </Text>
                  );
                }
              }
            }
            return null;
          })}

          <TouchableOpacity
            onPress={() =>
              navigation.navigate('MoreDetails', {
                newsItem: item,
              })
            }>
            <Text
              style={{
                fontSize: FONTS.FONTSIZE.MEDIUM,
                color: COLORS.LABELCOLOR,
                fontFamily: FONTS.FONT_FAMILY.MEDIUM,
              }}>
              View More
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
