import {
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import COLORS from '../theme/Color';
import CustomHeader from '../components/root/CustomHeader';
import {useIsFocused, useNavigation} from '@react-navigation/native';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import {IMAGE_URL} from '../connection/Config';
import FONTS from '../theme/Fonts';
import moment from 'moment';
import {useNetworkStatus} from '../connection/UseNetworkStatus';
import Offline from '../components/root/Offline';
import FastImage from 'react-native-fast-image';
import {getImageUri} from '../constant/Module';

const EntertainmentDetails = ({route}) => {
  const {entertainmentObj} = route?.params;
  const {width, height} = useWindowDimensions();
  const navigation = useNavigation();

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
    container: {
      flex: 1,
      paddingHorizontal: 10,
      marginVertical: 8,
    },
    tabContianer: {
      backgroundColor: COLORS.PRIMARYWHITE,
      borderRadius: 10,
      overflow: 'hidden',
      width: width / 1.05,
    },
    label: {
      fontSize: FONTS.FONTSIZE.SMALL,
      fontFamily: FONTS.FONT_FAMILY.BOLD,
      color: COLORS.TITLECOLOR,
    },
  });

  const [imagePath, setImagePath] = useState(null);
  const [entertainmentName, setEntertainmentHotelName] = useState('');
  const [locationName, setLocationName] = useState(null);
  const [timeValue, setTimeValue] = useState(null);
  const [dateValue, setDateValue] = useState(null);
  const [venueValue, setVanueValue] = useState(null);

  useEffect(() => {
    let entertainmentData;

    try {
      entertainmentData = JSON.parse(entertainmentObj.content);
    } catch (error) {
      return;
    }

    if (entertainmentData.title) {
      setEntertainmentHotelName(entertainmentData.title.value);
    }
    if (entertainmentData.location) {
      setLocationName(entertainmentData.location.value);
    }
    if (entertainmentData.date) {
      setDateValue(entertainmentData.date.value);
    }
    if (entertainmentData.time) {
      setTimeValue(entertainmentData.time.value);
    }
    if (entertainmentData.venue) {
      setVanueValue(entertainmentData.venue.value);
    }
    if (entertainmentData.image) {
      setImagePath(getImageUri(entertainmentData.image.value));
    }
  }, [entertainmentObj]);

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
  ];
  const [currentApiKeyIndex, setCurrentApiKeyIndex] = useState(0);

  const [locationData, setLocationData] = useState(null);

  const [mapImageUrl, setMapImageUrl] = useState('');
  const isFocused = useIsFocused();

  useEffect(() => {
    const fetchLocationCoordinates = async key => {
      const content = JSON.parse(entertainmentObj?.content);

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
  }, [entertainmentObj, currentApiKeyIndex, isFocused]);

  useEffect(() => {
    if (locationData) {
      const imageMapurl = `https://maps.geoapify.com/v1/staticmap?style=osm-bright&width=600&height=400&center=lonlat:${locationData.longitude},${locationData.latitude}&zoom=14&apiKey=${apiKeys[currentApiKeyIndex]}`;
      setMapImageUrl(imageMapurl);
    }
  }, [locationData, currentApiKeyIndex, isFocused]);

  const formattedTime = time => {
    const formatedtime = moment(time, 'HH:mm A').format('h:mm A');
    return formatedtime;
  };

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

  const {isConnected, networkLoading} = useNetworkStatus();
  const [hasError, setHasError] = useState(false);
  const isFolded = width >= 600;

  return (
    <View style={{flex: 1, backgroundColor: COLORS.BACKGROUNDCOLOR}}>
      <CustomHeader
        leftOnPress={() => {
          navigation.goBack();
        }}
        leftIcon={
          <FontAwesome6 name="angle-left" size={26} color={COLORS.LABELCOLOR} />
        }
        title={entertainmentName}
      />
      {isConnected ? (
        <ScrollView
          contentContainerStyle={{
            paddingBottom: 10,
            flexGrow: 1,
          }}>
          <View style={{height: isFolded ? height / 3 : height / 5}}>
            <FastImage
              defaultSource={require('../assets/images/Image_placeholder.png')}
              source={
                hasError
                  ? require('../assets/images/entertainment_bg.png')
                  : {
                      uri: IMAGE_URL + imagePath,
                      cache: FastImage.cacheControl.immutable,
                      priority: FastImage.priority.normal,
                    }
              }
              style={{height: '100%', width: '100%'}}
              resizeMode="cover"
              onError={() => {
                setHasError(true);
              }}
            />
          </View>
          <View style={styles.container}>
            <View
              style={{
                marginBottom: 10,
              }}>
              {entertainmentName && (
                <Text
                  style={{
                    fontSize: FONTS.FONTSIZE.MEDIUMLARGE,
                    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                    color: COLORS.TITLECOLOR,
                    textTransform: 'capitalize',
                  }}>
                  {entertainmentName ? entertainmentName : null}
                </Text>
              )}
              {locationName && (
                <Text
                  style={{
                    fontSize: FONTS.FONTSIZE.SEMIMINI,
                    fontFamily: FONTS.FONT_FAMILY.REGULAR,
                    color: COLORS.PLACEHOLDERCOLOR,
                  }}>
                  {locationName ? locationName : null}
                </Text>
              )}

              {(dateValue || timeValue) && (
                <Text
                  style={{
                    fontSize: FONTS.FONTSIZE.SEMIMINI,
                    fontFamily: FONTS.FONT_FAMILY.REGULAR,
                    color: COLORS.PLACEHOLDERCOLOR,
                  }}>
                  {dateValue || timeValue
                    ? `${moment(formatDate(dateValue)).format(
                        'DD MMMM YYYY , dddd',
                      )} @ ${formattedTime(timeValue)}`
                    : null}
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
            {venueValue && (
              <View style={{marginBottom: 10}}>
                <Text style={styles.label}>Venue</Text>
                <Text
                  style={{
                    fontSize: FONTS.FONTSIZE.SEMIMINI,
                    fontFamily: FONTS.FONT_FAMILY.REGULAR,
                    color: COLORS.PLACEHOLDERCOLOR,
                  }}>
                  {venueValue ? venueValue : null}
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
            <View style={[styles.tabContianer, {marginTop: 10}]}>
              {locationName && (
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
                      {'Location'}
                    </Text>
                    <Text
                      numberOfLines={2}
                      style={[
                        styles.txtLabel1,
                        {marginTop: 4, marginHorizontal: 10},
                      ]}>
                      {locationName}
                    </Text>

                    <TouchableOpacity
                      onPress={() => MapLinking(locationName)}
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
                            color: 'white',
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

export default EntertainmentDetails;
