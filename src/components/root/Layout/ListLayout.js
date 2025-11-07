import React, {useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import moment from 'moment';
import COLORS from '../../../theme/Color';
import FONTS from '../../../theme/Fonts';
import {IMAGE_URL} from '../../../connection/Config';
import NoDataFound from '../NoDataFound';
import {getImageUri} from '../../../constant/Module';

export default function ListLayout({data}) {
  const [imageErrors, setImageErrors] = useState({});
  const styles = StyleSheet.create({
    card: {
      borderRadius: 10,
      flexDirection: 'row',
      gap: 10,
      marginVertical: 8,
      backgroundColor: COLORS.PRIMARYWHITE,
      padding: 10,
      alignItems: 'center',
    },
    image: {
      height: 100,
      width: 100,
      borderRadius: 50,
    },
    subtitle: {
      fontSize: FONTS.FONTSIZE.SEMIMINI,
      color: COLORS.PLACEHOLDERCOLOR,
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
    },
    firstKey: {
      fontSize: FONTS.FONTSIZE.EXTRASMALL,
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

  const renderNewsItem = ({item, index}) => {
    const parsedContent = JSON.parse(item.content || '{}');
    const keys = JSON.parse(item.keys || '[]');

    const formattedKeys = keys.filter(
      key => parsedContent[key]?.type !== 'file',
    );

    const handleImageError = index => {
      setImageErrors(prev => ({...prev, [index]: true}));
    };

    return (
      <View key={index} style={styles.card}>
        {keys.map(key => {
          const contentItem = parsedContent[key];

          if (contentItem && contentItem.type === 'file') {
            return (
              <FastImage
                defaultSource={require('../../../assets/images/Image_placeholder.png')}
                key={key}
                source={
                  imageErrors[index]
                    ? require('../../../assets/images/noimage.png')
                    : {
                        uri: IMAGE_URL + getImageUri(contentItem.value),
                        cache: FastImage.cacheControl.immutable,
                        priority: FastImage.priority.normal,
                      }
                }
                style={styles.image}
                onError={() => handleImageError(index)}
                resizeMode="cover"
              />
            );
          }
          return null;
        })}

        <View style={{flex: 1}}>
          {formattedKeys.map((key, keyIndex) => {
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
