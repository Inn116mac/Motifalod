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
import FONTS from '../../theme/Fonts';
import COLORS from '../../theme/Color';
import {IMAGE_URL} from '../../connection/Config';
import NoDataFound from './NoDataFound';
import {getImageUri} from '../../constant/Module';

export default function Hotels({data}) {
  const {width, height} = useWindowDimensions();
  const navigation = useNavigation();

  const styles = StyleSheet.create({
    txtLabel: {
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
      color: COLORS.LABELCOLOR,
      fontSize: FONTS.FONTSIZE.EXTRASMALL,
      textAlign: 'center',
    },
    listContainer: {
      paddingVertical: 10,
      paddingHorizontal: 10,
    },
  });

  const [imageErrors, setImageErrors] = useState({});

  const renderHotelItem = ({item, index}) => {
    const hotelData = JSON.parse(item?.content);

    const imageItem = getImageUri(hotelData.image?.value);
    const nameItem = hotelData.name?.value;
    const detailsItem = hotelData.details?.value;
    const location = hotelData.location?.value;

    const handleImageError = index => {
      setImageErrors(prev => ({...prev, [index]: true}));
    };

    return (
      <View
        key={index}
        style={{
          borderRadius: 15,
       marginVertical: 10,
          flex: 1,
          borderBottomWidth: 0.6,
          borderBottomColor: COLORS.BOTTOMBORDERCOLOR,
          paddingBottom: 12,
        }}>
        <View
          style={{
            flexDirection: 'row',
            overflow: 'hidden',
            paddingLeft: 10,
            flex: 1,
          }}>
          <View
            style={{
              overflow: 'hidden',
            }}>
            <FastImage
              defaultSource={require('../../assets/images/Image_placeholder.png')}
              source={
                imageErrors[index]
                  ? require('../../assets/images/noimage.png')
                  : {
                      uri: IMAGE_URL + imageItem,
                      cache: FastImage.cacheControl.immutable,
                      priority: FastImage.priority.normal,
                    }
              }
               style={{
                height: height / 7,
                width: width / 3.5,
                borderRadius: 10,
                backgroundColor: '#f0f0f0',
              }}
              resizeMode={FastImage.resizeMode.cover}
              onError={() => handleImageError(index)}
            />
          </View>
          <View style={{marginHorizontal: 10, justifyContent: 'space-between'}}>
            <Text
              numberOfLines={2}
              style={{
                fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                fontSize: FONTS.FONTSIZE.EXTRASMALL,
                color: COLORS.TITLECOLOR,
                width: width / 1.7,
              }}>
              {nameItem ? nameItem : null}
            </Text>
            <Text
              numberOfLines={2}
              style={{
                fontFamily: FONTS.FONT_FAMILY.REGULAR,
                fontSize: FONTS.FONTSIZE.EXTRASMALL,
                color: COLORS.PLACEHOLDERCOLOR,
                width: width / 1.7,
                marginTop: 4,
              }}>
              {detailsItem ? detailsItem : null}
            </Text>

            <TouchableOpacity
              style={{
                borderWidth: 1,
                borderRadius: 8,
                borderColor: COLORS.LABELCOLOR,
                padding: 5,
                width: width / 3.5,
                marginTop: 5,
              }}
              onPress={() => {
                navigation.navigate('HotelDetails', {
                  hotelObj: item,
                  locationName: location,
                  detailsItem: detailsItem,
                });
              }}>
              <Text style={styles.txtLabel}>{'View More'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={{flex: 1, backgroundColor: COLORS.BACKGROUNDCOLOR}}>
      {data.length > 0 ? (
        <>
          <FlatList
            contentContainerStyle={styles.listContainer}
            data={data}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderHotelItem}
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
