import React, {useState} from 'react';
import {StyleSheet, View, Text, FlatList, TouchableOpacity} from 'react-native';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import FastImage from 'react-native-fast-image';
import {useNavigation} from '@react-navigation/native';
import FONTS from '../../../theme/Fonts';
import COLORS from '../../../theme/Color';
import NoDataFound from '../NoDataFound';
import {getFileType} from '../../../utils/fileType';
import {IMAGE_URL} from '../../../connection/Config';
import moment from 'moment';
import {getImageUri} from '../../../constant/Module';

export default function OrderView({data, pageNumber, PAGE_SIZE}) {
  const [urlValidity, setUrlValidity] = useState({});
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

  const renderList = ({item, index}) => {
    const keys = data[0]?.keys ? JSON.parse(data[0]?.keys) : [];
    const number1 = (pageNumber - 1) * PAGE_SIZE + index + 1;
    const number = number1 <= 9 ? `0${number1}` : `${number1}`;
    const parsedContent = JSON.parse(item?.content);

    return (
      <View
        key={index}
        style={{
          backgroundColor: COLORS.PRIMARYWHITE,
          paddingHorizontal: widthPercentageToDP('4%'),
          paddingVertical: heightPercentageToDP('2%'),
          marginVertical: heightPercentageToDP('1%'),
          marginHorizontal: widthPercentageToDP('4%'),
          borderRadius: 10,
        }}>
        <View
          style={{
            backgroundColor: COLORS.LABELCOLOR,
            width: widthPercentageToDP('10%'),
            justifyContent: 'center',
            alignItems: 'center',
            borderTopRightRadius: 20,
            borderBottomRightRadius: 20,
          }}>
          <Text style={[styles.pkgLbl, {color: COLORS.PRIMARYWHITE}]}>
            {number}
          </Text>
        </View>
        <View>
          {keys.map(key => {
            const data = parsedContent[key];
            if (
              data &&
              (data?.type === 'hidden' ||
                data?.type === 'header' ||
                data?.type === 'button' ||
                data?.type === 'section')
            ) {
              return null;
            }

            return (
              data && (
                <View key={key} style={{marginVertical: 4}}>
                  <View style={styles.textView}>
                    <Text style={styles.titleText}>{data.label} :</Text>
                    {data.type === 'file' ? (
                      data.value ? (
                        getFileType(getImageUri(data.value)) === 'image' ? (
                          <TouchableOpacity
                            onPress={() => {
                              navigation.navigate('FullImageScreen', {
                                image: data.value,
                              });
                            }}>
                            <FastImage
                              defaultSource={require('../../../assets/images/Image_placeholder.png')}
                              source={
                                urlValidity[data.value]
                                  ? require('../../../assets/images/noimage.png')
                                  : {
                                      uri: IMAGE_URL + getImageUri(data.value),
                                      cache: FastImage.cacheControl.immutable,
                                      priority: FastImage.priority.normal,
                                    }
                              }
                              resizeMode={
                                urlValidity[data.value] ? 'contain' : 'cover'
                              }
                              style={{
                                height: 80,
                                width: 170,
                                borderRadius: 5,
                              }}
                              onError={() => {
                                setUrlValidity(prev => ({
                                  ...prev,
                                  [getImageUri(data.value)]: true,
                                }));
                              }}
                            />
                          </TouchableOpacity>
                        ) : null
                      ) : (
                        <Text style={styles.text}>-</Text>
                      )
                    ) : data.type === 'date' ? (
                      <Text style={styles.text}>
                        {data.value
                          ? moment(formatDate(data.value)).format(
                              'DD MMMM YYYY',
                            )
                          : '-'}
                      </Text>
                    ) : data.type === 'time' ? (
                      <Text style={styles.text}>
                        {data.value ? formattedTime(data.value) : '-'}
                      </Text>
                    ) : (
                      <Text style={styles.text}>
                        {data.value ? data.value : '-'}
                      </Text>
                    )}
                  </View>
                </View>
              )
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={{flex: 1}}>
      {data?.length > 0 ? (
        <>
          <FlatList
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{paddingBottom: 10}}
            data={data}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderList}
            removeClippedSubviews={true}
            maxToRenderPerBatch={30}
            updateCellsBatchingPeriod={200}
            windowSize={40}
            initialNumToRender={10}
          />
        </>
      ) : (
        <NoDataFound />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pkgLbl: {
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.SMALL,
  },
  titleText: {
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.EXTRASMALL,
    color: COLORS.PLACEHOLDERCOLOR,
    width: '50%',
  },
  text: {
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.EXTRASMALL,
    color: COLORS.PLACEHOLDERCOLOR,
    width: '50%',
    textAlign: 'left',
  },
  textView: {
    flexDirection: 'row',
  },
});
