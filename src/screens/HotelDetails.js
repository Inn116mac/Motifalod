import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  Linking,
  Platform,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import {FontAwesome6} from "@react-native-vector-icons/fontawesome6";
import COLORS from '../theme/Color';
import {IMAGE_URL} from '../connection/Config';
import FONTS from '../theme/Fonts';
import {useIsFocused, useNavigation} from '@react-navigation/native';
import Offline from '../components/root/Offline';
import CustomHeader from '../components/root/CustomHeader';
import {useNetworkStatus} from '../connection/UseNetworkStatus';
import FastImage from 'react-native-fast-image';
import {getImageUri} from '../constant/Module';

const HotelDetails = ({route}) => {
  const {hotelObj} = route?.params;
  const location = route?.params?.locationName;
  const detailsItem = route?.params?.detailsItem;
  const {width, height} = useWindowDimensions();
  const [hotelValues, setHotelValues] = useState(null);

  const isFolded = width >= 600;

  const styles = StyleSheet.create({
    txtLabel: {
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      fontSize: FONTS.FONTSIZE.SEMIMINI,
      color: COLORS.LABELCOLOR,
    },
    txtLabel1: {
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      fontSize: FONTS.FONTSIZE.SEMIMINI,
      color: COLORS.PLACEHOLDERCOLOR,
    },
    tabContianer: {
      backgroundColor: COLORS.PRIMARYWHITE,
      borderRadius: 10,
      overflow: 'hidden',
    },
    tabContianer1: {
      backgroundColor: COLORS.PRIMARYWHITE,
      borderRadius: 10,
      width: width / 2.15,
      paddingVertical: 5,
      paddingHorizontal: 10,
      gap: 5,
      flex: 1,
      height: height / 5,
    },
    label: {
      fontSize: FONTS.FONTSIZE.SMALL,
      fontFamily: FONTS.FONT_FAMILY.BOLD,
      color: COLORS.TITLECOLOR,
    },
    boldLbl: {
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
      fontSize: FONTS.FONTSIZE.SEMIMINI,
      color: COLORS.TITLECOLOR,
    },
  });

  const [imagePath, setImagePath] = useState(null);

  const [hotelName, setHotelName] = useState('');
  const navigation = useNavigation();
  const {isConnected, networkLoading} = useNetworkStatus();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (hotelObj?.content) {
      const hotelData = JSON.parse(hotelObj.content);
      setHotelValues(hotelData);
      setHotelName(hotelData.name?.value || '');
      setImagePath(getImageUri(hotelData.image?.value));
    }
  }, [hotelObj]);

  const MapLinking = val => {
    const url = Platform.select({
      ios: `maps:0,0?q=${val}`,
      android: `geo:0,0?q=${val}`,
    });
    Linking.openURL(url);
  };

  const apiKeys = [
    '634fc5372c154780b0856a1cd18932ff',
    '217b31c8acb045d9a31d3319ea9f4875',
    'c6b353e96f9a456796f8004d6c600234',
    'e80a242e57d24c4eaf30ea8f448d194a',
    'ceafee16de904b7da61cec2fa0be9d3f',
    'e5414f3130ab4dba85381256091884ae',
    'ac227cc474944266b2fffea1c371128c',
    '26d64443025a4162826c67c6df59d97d',
    '02d5fe32ddf94e1da7d85d3b98cf3237',
    'f80d9dc7b2804c05ba1b891d90610b48',
    '7e66e73054da43ce87a279e184110edf',
    '66ad375eb7514b32835d8c91fe295419',
    '6b28bda8af634d2a92d2b843b1691c8a',
  ];
  const [currentApiKeyIndex, setCurrentApiKeyIndex] = useState(0);

  const [locationData, setLocationData] = useState(null);

  const [mapImageUrl, setMapImageUrl] = useState('');
  const isFocused = useIsFocused();

  useEffect(() => {
    const fetchLocationCoordinates = async key => {
      const content = JSON.parse(hotelObj?.content);

      const locationItem = content?.location;

      if (locationItem) {
        const location = locationItem?.value;

        try {
          const response = await fetch(
            `https://api.geoapify.com/v1/geocode/search?text=${location}&format=json&apiKey=${key}`,
          );

          if (response.ok) {
            const data = await response.json();
            if (data?.results && data?.results?.length > 0) {
              const {lat, lon} = data.results[0];
              setLocationData({latitude: lat, longitude: lon});
            } else {
              setLocationData(null);
            }
          } else if (response.status === 401) {
            if (currentApiKeyIndex < apiKeys.length - 1) {
              setCurrentApiKeyIndex(currentApiKeyIndex + 1);
              await fetchLocationCoordinates(apiKeys[currentApiKeyIndex]);
            } else {
              setLocationData(null);
            }
          } else {
            setLocationData(null);
          }
        } catch (error) {
          if (error.response && error.response.status === 401) {
            if (currentApiKeyIndex < apiKeys.length - 1) {
              setCurrentApiKeyIndex(currentApiKeyIndex + 1);
              await fetchResults(apiKeys[currentApiKeyIndex]);
            } else {
              setLocationData(null);
            }
          } else {
            setLocationData(null);
          }
        }
      }
    };

    fetchLocationCoordinates(apiKeys[currentApiKeyIndex]);
  }, [hotelObj, currentApiKeyIndex, isFocused]);

  useEffect(() => {
    if (locationData) {
      const imageMapurl = `https://maps.geoapify.com/v1/staticmap?style=osm-bright&width=600&height=400&center=lonlat:${locationData.longitude},${locationData.latitude}&zoom=14&apiKey=${apiKeys[currentApiKeyIndex]}`;
      setMapImageUrl(imageMapurl);
    }
  }, [locationData, currentApiKeyIndex, isFocused]);

  return (
    <View style={{flex: 1, backgroundColor: COLORS.BACKGROUNDCOLOR}}>
      <CustomHeader
        leftOnPress={() => {
          navigation.goBack();
        }}
        leftIcon={
          <FontAwesome6 name="angle-left" iconStyle='solid' size={26} color={COLORS.LABELCOLOR} />
        }
        title={hotelName}
      />

      {isConnected ? (
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: 10,
          }}>
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
          <View style={{paddingHorizontal: 10, marginVertical: 8}}>
            <View
              style={{
                marginBottom: 10,
              }}>
              {hotelName && (
                <Text
                  style={{
                    fontSize: FONTS.FONTSIZE.MEDIUMLARGE,
                    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                    color: COLORS.TITLECOLOR,
                    textTransform: 'capitalize',
                  }}>
                  {hotelName ? hotelName : null}
                </Text>
              )}
              {location && (
                <Text
                  style={{
                    fontSize: FONTS.FONTSIZE.SEMIMINI,
                    fontFamily: FONTS.FONT_FAMILY.REGULAR,
                    color: COLORS.PLACEHOLDERCOLOR,
                  }}>
                  {location ? location : null}
                </Text>
              )}
              <View
                style={{
                  borderBottomWidth: 1,
                  marginTop: 10,
                  borderBottomColor: COLORS.INPUTBORDER,
                }}
              />
            </View>
            {detailsItem && (
              <View style={{marginBottom: 10}}>
                <Text style={styles.label}>Details</Text>
                <Text
                  style={{
                    fontSize: FONTS.FONTSIZE.SEMIMINI,
                    fontFamily: FONTS.FONT_FAMILY.REGULAR,
                    color: COLORS.PLACEHOLDERCOLOR,
                  }}>
                  {detailsItem ? detailsItem : null}
                </Text>
                <View
                  style={{
                    borderBottomWidth: 1,
                    marginTop: 10,
                    borderBottomColor: COLORS.INPUTBORDER,
                  }}
                />
              </View>
            )}
            <View style={{marginBottom: 10}}>
              <Text style={styles.label}>Good To Know</Text>
              <View
                style={{
                  flexDirection: 'row',
                  gap: 5,
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                <View>
                  <View style={{}}>
                    {hotelValues?.website && (
                      <TouchableOpacity
                        disabled={hotelValues?.website?.value == null}
                        onPress={() => {
                          const url = `https://${hotelValues?.website?.value}`;
                          if (url) {
                            Linking.openURL(url);
                          }
                        }}
                        style={[styles.tabContianer1, {marginTop: 8}]}>
                        <View>
                          <View>
                            <Text numberOfLines={2} style={styles.boldLbl}>
                              {hotelValues?.website?.label}
                            </Text>
                            <Text numberOfLines={2} style={styles.txtLabel}>
                              {hotelValues?.website?.value
                                ? hotelValues?.website?.value
                                : '-'}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                <View>
                  <View>
                    {hotelValues?.promoCode && (
                      <View style={[styles.tabContianer1, {marginTop: 4}]}>
                        <View>
                          <Text numberOfLines={2} style={styles.boldLbl}>
                            {hotelValues?.promoCode.label}
                          </Text>

                          <Text numberOfLines={2} style={[styles.txtLabel1]}>
                            {hotelValues?.promoCode?.value
                              ? hotelValues?.promoCode?.value
                              : '-'}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  gap: 5,
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                <View>
                  <View>
                    {hotelValues?.coordinateName && (
                      <View style={[styles.tabContianer1, {marginTop: 8}]}>
                        <Text numberOfLines={2} style={styles.boldLbl}>
                          {hotelValues?.coordinateName?.label}
                        </Text>
                        <Text numberOfLines={2} style={styles.txtLabel1}>
                          {hotelValues?.coordinateName?.value
                            ? hotelValues?.coordinateName?.value
                            : '-'}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <View>
                  <View style={{}}>
                    {hotelValues?.coordinateNumber && (
                      <TouchableOpacity
                        onPress={() => {
                          const url = `tel:${hotelValues?.coordinateNumber?.value}`;
                          if (url) {
                            Linking.openURL(url);
                          }
                        }}
                        style={[styles.tabContianer1, {marginTop: 8}]}>
                        <View>
                          <Text numberOfLines={2} style={styles.boldLbl}>
                            {hotelValues?.coordinateNumber?.label}
                          </Text>
                          <Text numberOfLines={2} style={styles.txtLabel1}>
                            {hotelValues?.coordinateNumber?.value
                              ? hotelValues?.coordinateNumber?.value
                              : '-'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </View>
            <View
              style={{
                borderBottomWidth: 1,
                marginTop: 10,
                borderBottomColor: COLORS.INPUTBORDER,
              }}
            />
            <View style={[styles.tabContianer, {marginTop: 10}]}>
              {hotelValues?.location && (
                <View
                  style={{
                    paddingVertical: 10,
                    borderRadius: 10,
                    overflow: 'hidden',
                  }}>
                  <View>
                    <Text
                      numberOfLines={2}
                      style={[styles.label, {marginHorizontal: 10}]}>
                      {hotelValues?.location.label}
                    </Text>
                    <Text
                      numberOfLines={2}
                      style={[
                        styles.txtLabel1,
                        {marginTop: 4, marginHorizontal: 10},
                      ]}>
                      {hotelValues?.location?.value}
                    </Text>

                    <TouchableOpacity
                      onPress={() => MapLinking(hotelValues?.location?.value)}
                      style={{
                        backgroundColor: COLORS.LABELCOLOR,
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        paddingHorizontal: 15,
                        paddingVertical: 5,
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderBottomLeftRadius: 20,
                        borderTopLeftRadius: 20,
                      }}>
                      <Text
                        style={[
                          styles.txtLabel,
                          {
                            fontSize: FONTS.FONTSIZE.MINI,
                            alignSelf: 'center',
                            textAlignVertical: 'center',
                            color: COLORS.PRIMARYWHITE,
                          },
                        ]}>
                        GET DIRECTION
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {locationData?.latitude && locationData?.longitude && (
                    <Image
                      source={{
                        uri: mapImageUrl,
                      }}
                      style={{
                        height: 170,
                        width: '95%',
                        resizeMode: 'cover',
                        marginHorizontal: 10,
                        borderRadius: 10,
                        marginTop: 5,
                      }}
                    />
                  )}
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      ) : (
        <Offline />
      )}
    </View>
  );
};

export default HotelDetails;
