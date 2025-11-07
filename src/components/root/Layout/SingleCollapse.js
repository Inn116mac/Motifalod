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
import moment from 'moment';
import COLORS from '../../../theme/Color';
import FONTS from '../../../theme/Fonts';
import {IMAGE_URL} from '../../../connection/Config';
import {AntDesign} from '@react-native-vector-icons/ant-design';
import NoDataFound from '../NoDataFound';
import {getImageUri} from '../../../constant/Module';

export default function SingleCollapse({
  data,
  isMultiCollapse,
  pageNumber,
  PAGE_SIZE,
}) {
  const {width} = useWindowDimensions();

  const styles = StyleSheet.create({
    pkgLbl: {
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      fontSize: FONTS.FONTSIZE.SMALL,
      color: COLORS.PRIMARYBLACK,
    },
    titleText: {
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      fontSize: FONTS.FONTSIZE.EXTRASMALL,
      color: COLORS.PRIMARYBLACK,
      width: '50%',
      textAlign: 'left',
    },
    text: {
      fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
      fontSize: FONTS.FONTSIZE.EXTRASMALL,
      color: COLORS.PRIMARYBLACK,
      width: '50%',
      textAlign: 'left',
    },
    textView: {
      flexDirection: 'row',
    },
    image: {
      height: 50,
      width: 50,
      borderRadius: 5,
    },
  });
  const [openIndex, setOpenIndex] = useState({});
  const [imageErrors, setImageErrors] = useState({});

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

  const renderList = ({item, index}) => {
    const parsedContent = JSON.parse(item?.content || '{}');
    const parsedKeys = JSON.parse(item?.keys || '[]');
    const firstKey = parsedKeys[0];
    const firstKeyValue = parsedContent[firstKey]?.value || '';

    const number1 = (pageNumber - 1) * PAGE_SIZE + index + 1;
    const number = number1 <= 9 ? `0${number1}` : `${number1}`;

    const handleToggle = index => {
      if (isMultiCollapse) {
        setOpenIndex(prev => ({
          ...prev,
          [index]: !prev[index],
        }));
      } else {
        setOpenIndex(prev => (prev[index] ? {} : {[index]: true}));
      }
    };

    const handleImageError = index => {
      setImageErrors(prev => ({...prev, [index]: true}));
    };

    const isOpen = isMultiCollapse
      ? openIndex[index]
      : Object.keys(openIndex).includes(String(index));

    return (
      <View
        style={{
          backgroundColor: COLORS.PRIMARYWHITE,
          flex: 1,
          overflow: 'hidden',
          borderRadius: 10,
          padding: 6,
          margin: 6,
        }}
        key={index}>
        <TouchableOpacity
          onPress={() => {
            handleToggle(index);
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              width: width / 1.4,
            }}>
            <View
              style={{
                backgroundColor: COLORS.LABELCOLOR,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 10,
                maxWidth: '30%',
                padding: 6,
              }}>
              <Text style={[styles.pkgLbl, {color: COLORS.PRIMARYWHITE}]}>
                {number}
              </Text>
            </View>
            <View style={{}}>
              <Text
                style={{
                  fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                  fontSize: FONTS.FONTSIZE.EXTRASMALL,
                  color: COLORS.PLACEHOLDERCOLOR,
                }}>
                {firstKeyValue ? firstKeyValue : '-'}
              </Text>
            </View>
          </View>
          <View>
            {isOpen ? (
              <AntDesign name="up" size={20} color={COLORS.LABELCOLOR} />
            ) : (
              <AntDesign name="down" size={20} color={COLORS.LABELCOLOR} />
            )}
          </View>
        </TouchableOpacity>

        {isOpen && (
          <View style={{padding: 6}}>
            {parsedKeys?.map((key, keyIndex) => {
              const contentItem = parsedContent[key];

              if (contentItem) {
                if (
                  ['hidden', 'header', 'button', 'section'].includes(
                    contentItem.type,
                  )
                ) {
                  return null;
                }
                return (
                  <View key={key} style={styles.textView}>
                    <Text style={styles.titleText}>
                      {contentItem.label || '-'}:
                    </Text>
                    <Text style={styles.text}>
                      {contentItem.type === 'file' ? (
                        <FastImage
                          defaultSource={require('../../../assets/images/Image_placeholder.png')}
                          source={
                            imageErrors[keyIndex]
                              ? require('../../../assets/images/noimage.png')
                              : {
                                  uri:
                                    IMAGE_URL + getImageUri(contentItem.value),
                                  cache: FastImage.cacheControl.immutable,
                                  priority: FastImage.priority.normal,
                                }
                          }
                          style={styles.image}
                          resizeMode="cover"
                          onError={() => handleImageError(keyIndex)}
                        />
                      ) : contentItem.type === 'date' ? (
                        moment(formatDate(contentItem.value)).format(
                          'DD MMMM YYYY',
                        )
                      ) : contentItem.type === 'time' ? (
                        formattedTime(contentItem.value)
                      ) : (
                        <Text>{contentItem.value || '-'}</Text>
                      )}
                    </Text>
                  </View>
                );
              }
              return null;
            })}
          </View>
        )}
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
            renderItem={renderList}
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
