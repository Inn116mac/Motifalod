import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  Platform,
  Linking,
  TouchableOpacity,
  useWindowDimensions,
  ImageBackground,
} from 'react-native';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import moment from 'moment';
import FONTS from '../theme/Fonts';
import COLORS from '../theme/Color';
import {IMAGE_URL} from '../connection/Config';
import {useIsFocused, useNavigation} from '@react-navigation/native';
import Offline from '../components/root/Offline';
import {heightPercentageToDP} from 'react-native-responsive-screen';
import CustomHeader from '../components/root/CustomHeader';
import {useNetworkStatus} from '../connection/UseNetworkStatus';
import Loader from '../components/root/Loader';
import httpClient from '../connection/httpClient';
import NetInfo from '@react-native-community/netinfo';
import {getImageUri, NOTIFY_MESSAGE} from '../constant/Module';
import {SimpleLineIcons} from '@react-native-vector-icons/simple-line-icons';
import {AntDesign} from '@react-native-vector-icons/ant-design';
import {Ionicons} from '@react-native-vector-icons/ionicons';
import FastImage from 'react-native-fast-image';

const EventDetails = ({route}) => {
  const {width, height} = useWindowDimensions();

  const styles = StyleSheet.create({
    txtLabel: {
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
      fontSize: FONTS.FONTSIZE.SEMIMINI,
      color: COLORS.PLACEHOLDERCOLOR,
      width: '58%',
      textAlign: 'left',
    },
    container: {
      flex: 1,
    },
    label: {
      fontSize: FONTS.FONTSIZE.EXTRASMALL,
      fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
      color: COLORS.TITLECOLOR,
    },
    tabContianer: {
      padding: 6,
      backgroundColor: COLORS.PRIMARYWHITE,
      borderRadius: 10,
      overflow: 'hidden',
      marginBottom: 10,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    tabContianer1: {
      paddingHorizontal: 15,
      paddingVertical: 10,
      backgroundColor: COLORS.PRIMARYWHITE,
      borderRadius: 10,
      overflow: 'hidden',
      width: width / 3 - 10,
      height: 100,
      alignItems: 'center',
      justifyContent: 'center',
    },
    boldLbl: {
      fontSize: FONTS.FONTSIZE.SMALL,
      fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
      color: COLORS.TITLECOLOR,
      width: '42%',
      textAlign: 'left',
    },
  });
  const {evnentObj, isUpcommingEvent, item} = route.params;

  const navigation = useNavigation();
  const [qrImageUri, setQrImageUri] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isUpcommingEvent && evnentObj && evnentObj?.eventId) {
      getQrCode();
    } else {
      setLoading(false);
    }
  }, [evnentObj, isUpcommingEvent]);

  const getQrCode = async () => {
    const state = await NetInfo.fetch();
    if (state.isConnected) {
      setLoading(true);
      httpClient
        .get(`GetQRCode?Qrcodeid=${evnentObj?.eventId}`)
        .then(response => {
          if (response.data.status && response?.data?.result) {
            setQrImageUri(response?.data?.result);
          } else {
            NOTIFY_MESSAGE(
              response?.data?.message
                ? response?.data?.message
                : 'Something Went Wrong',
            );
          }
        })
        .catch(err => {
          NOTIFY_MESSAGE(err || err?.message ? 'Something Went Wrong' : null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      NOTIFY_MESSAGE('Please check your internet connectivity');
    }
  };

  const MapLinking = () => {
    const url = Platform.select({
      ios: `maps:0,0?q=${evnentObj?.location}`,
      android: `geo:0,0?q=${evnentObj?.location}`,
    });
    Linking.openURL(url);
  };

  const formattedTime = time => {
    const formatedtime = moment(time, 'HH:mm A').format('h:mm A');
    return formatedtime;
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
      if (evnentObj?.location) {
        try {
          const response = await fetch(
            `https://api.geoapify.com/v1/geocode/search?text=${evnentObj?.location}&format=json&apiKey=${key}`,
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
  }, [evnentObj, currentApiKeyIndex, isFocused]);

  useEffect(() => {
    if (locationData) {
      const imageMapurl = `https://maps.geoapify.com/v1/staticmap?style=osm-bright&width=600&height=400&center=lonlat:${locationData.longitude},${locationData.latitude}&zoom=14&apiKey=${apiKeys[currentApiKeyIndex]}`;
      setMapImageUrl(imageMapurl);
    }
  }, [locationData, currentApiKeyIndex, isFocused]);

  const {isConnected, networkLoading} = useNetworkStatus();
  const [hasError, setHasError] = useState(false);

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

  const imageUri = getImageUri(evnentObj?.image);
  const isFolded = width >= 600;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.BACKGROUNDCOLOR,
      }}>
      <CustomHeader
        leftOnPress={() => {
          navigation.goBack();
        }}
        leftIcon={
          <FontAwesome6
            name="angle-left"
            iconStyle="solid"
            size={26}
            color={COLORS.LABELCOLOR}
          />
        }
        rightIcon={
          qrImageUri && (
            <Ionicons
              name="qr-code-outline"
              color={COLORS.TITLECOLOR}
              size={24}
            />
          )
        }
        rightOnPress={() => {
          navigation.navigate('FullImageScreen', {
            image: qrImageUri,
            eventName: evnentObj?.name,
          });
        }}
        title={evnentObj?.name ? evnentObj?.name : 'Events'}
      />
      {networkLoading || loading ? (
        <Loader />
      ) : isConnected ? (
        <View style={styles.container}>
          <ScrollView
            style={styles.container}
            contentContainerStyle={{
              paddingBottom: 10,
              flexGrow: 1,
            }}
            showsVerticalScrollIndicator={false}>
            <View
              style={{
                height: isFolded ? height / 3 : height / 5,
                width: '100%',
              }}>
            <FastImage
                defaultSource={require('../assets/images/Image_placeholder.png')}
                onError={() => {
                  setHasError(true);
                }}
                style={{height: '100%', width: '100%'}}
                resizeMode="cover"
                source={
                  hasError
                    ? require('../assets/images/Logo.png')
                    : {uri: IMAGE_URL + imageUri}
                }>
                {/* <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    margin: 6,
                    maxWidth: '65%',
                  }}>
                  <View
                    style={{
                      backgroundColor: COLORS.LABELCOLOR,
                      paddingHorizontal: 6,
                      paddingVertical: 4,
                      borderRadius: 8,
                    }}>
                    <Text
                      numberOfLines={2}
                      style={{
                        fontSize: FONTS.FONTSIZE.EXTRASMALL,
                        fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
                        color: COLORS.PRIMARYWHITE,
                        textAlign: 'left',
                      }}>
                      {evnentObj?.name}
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    margin: 6,
                    width: '30%',
                  }}>
                  <View
                    style={{
                      backgroundColor: COLORS.TITLECOLOR,
                      paddingHorizontal: 6,
                      paddingVertical: 4,
                      borderRadius: 8,
                    }}>
                    <Text
                      numberOfLines={2}
                      style={{
                        fontSize: FONTS.FONTSIZE.EXTRASMALL,
                        fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
                        color: COLORS.PRIMARYWHITE,
                        textAlign: 'center',
                      }}>
                      {`${moment(formatDate(evnentObj?.date)).format(
                        'MMMM DD',
                      )}`}
                    </Text>
                  </View>
                </View> */}
           </FastImage>
            </View>

            <View
              style={{
                paddingHorizontal: 10,
                marginVertical: 10,
              }}>
              <View style={[styles.tabContianer]}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: 10,
                  }}>
                  <AntDesign
                    name="calendar"
                    size={20}
                    color={COLORS.PLACEHOLDERCOLOR}
                    style={{marginTop: 4}}
                  />
                  {(evnentObj?.date || evnentObj?.time) && (
                    <View>
                      <Text style={styles.label}>Date Time</Text>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                          width: width / 2.5,
                        }}>
                        <Text
                          numberOfLines={1}
                          style={{
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                            color: COLORS.PLACEHOLDERCOLOR,
                          }}>
                          {`${moment(formatDate(evnentObj?.date)).format(
                            'MMM DD, YYYY',
                          )}`}
                        </Text>
                        {evnentObj.time && (
                          <Text
                            numberOfLines={1}
                            style={{
                              fontSize: FONTS.FONTSIZE.EXTRASMALL,
                              fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                              color: COLORS.PLACEHOLDERCOLOR,
                            }}>
                            {`@ ${formattedTime(evnentObj.time)}`}
                          </Text>
                        )}
                        {evnentObj?.endTime && (
                          <Text
                            numberOfLines={1}
                            style={{
                              fontSize: FONTS.FONTSIZE.EXTRASMALL,
                              fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                              color: COLORS.PLACEHOLDERCOLOR,
                            }}>
                            {`- ${formattedTime(evnentObj?.endTime)}`}
                          </Text>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              </View>
              <TouchableOpacity
                onPress={() => MapLinking()}
                style={[styles.tabContianer]}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: 10,
                  }}>
                  <SimpleLineIcons
                    name="location-pin"
                    size={20}
                    color={COLORS.PLACEHOLDERCOLOR}
                    style={{marginTop: 4}}
                  />
                  <TouchableOpacity onPress={() => MapLinking()}>
                    <Text style={styles.label}>Venue</Text>
                    <TouchableOpacity
                      onPress={() => MapLinking()}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}>
                      <Text
                        style={{
                          fontSize: FONTS.FONTSIZE.EXTRASMALL,
                          fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                          color: 'blue',
                          width: width / 1.3,
                        }}>
                        {evnentObj?.venue ? evnentObj?.venue : '-'}
                      </Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
              <View style={[styles.tabContianer]}>
                <Text style={styles.label}>Message from the Host</Text>
                <Text
                  style={{
                    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                    fontSize: FONTS.FONTSIZE.SEMIMINI,
                    color: COLORS.PLACEHOLDERCOLOR,
                  }}>
                  {evnentObj.messagefromtheHost
                    ? evnentObj.messagefromtheHost
                    : '-'}
                </Text>
              </View>
              <View
                style={[
                  styles.tabContianer,
                  {
                    gap: 10,
                  },
                ]}>
                <View style={styles.row}>
                  <Text style={styles.boldLbl}>Coordinator Name</Text>
                  <Text style={styles.txtLabel}>
                    {evnentObj.eventCoordinator
                      ? evnentObj.eventCoordinator
                      : '-'}
                  </Text>
                </View>
                <View style={[styles.row]}>
                  <Text style={styles.boldLbl}>Coordinator Number</Text>
                  <Text style={[styles.txtLabel]}>
                    {evnentObj.eventcoordinatornumber
                      ? evnentObj.eventcoordinatornumber
                      : '-'}
                  </Text>
                </View>
                <View style={[styles.row]}>
                  <Text style={styles.boldLbl}>Parking Information</Text>
                  <Text style={[styles.txtLabel]}>
                    {evnentObj.parkingInformation
                      ? evnentObj.parkingInformation
                      : '-'}
                  </Text>
                </View>
                <View style={[styles.row]}>
                  <Text style={styles.boldLbl}>Food Team</Text>
                  <Text style={[styles.txtLabel]}>
                    {evnentObj.foodTeamName ? evnentObj.foodTeamName : '-'}
                  </Text>
                </View>
              </View>
              <View
                style={{
                  marginBottom: 10,
                  backgroundColor: COLORS.PRIMARYWHITE,
                  padding: 6,
                  borderRadius: 10,
                }}>
                <Text style={styles.label}>Overview</Text>
                <Text
                  style={{
                    fontSize: FONTS.FONTSIZE.SEMIMINI,
                    fontFamily: FONTS.FONT_FAMILY.REGULAR,
                    color: COLORS.PLACEHOLDERCOLOR,
                  }}>
                  {evnentObj?.details ? evnentObj?.details : '-'}
                </Text>
              </View>
              <View style={{marginBottom: 0}}>
                {evnentObj?.location == '' ? null : (
                  <View
                    style={{
                      paddingHorizontal: 15,
                      paddingVertical: 10,
                      backgroundColor: COLORS.PRIMARYWHITE,
                      borderRadius: 10,
                      marginVertical: heightPercentageToDP(2),
                      overflow: 'hidden',
                      marginTop: 0,
                      paddingHorizontal: 0,
                    }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: 6,
                      }}>
                      <View style={[{flex: 0.65}]}>
                        <Text numberOfLines={1} style={styles.label}>
                          Address
                        </Text>
                        <View
                          style={{
                            flexDirection: 'row',
                            gap: 4,
                            alignItems: 'center',
                          }}>
                          <SimpleLineIcons
                            name="location-pin"
                            size={20}
                            color={COLORS.PLACEHOLDERCOLOR}
                          />
                          <Text
                            style={{
                              marginTop: 4,
                              fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                              fontSize: FONTS.FONTSIZE.SEMIMINI,
                              color: COLORS.PLACEHOLDERCOLOR,
                            }}>
                            {evnentObj.location}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => MapLinking()}
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
                            {
                              fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                              fontSize: FONTS.FONTSIZE.SEMIMINI,
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
                          width: '96%',
                          resizeMode: 'cover',
                          borderRadius: 10,
                          margin: 6,
                        }}
                      />
                    )}
                  </View>
                )}
              </View>
              <View style={{marginBottom: 0}}>
                <View>
                  <Text style={styles.label}>Total Guests</Text>
                  <View
                    style={{
                      marginBottom: 10,
                      borderRadius: 10,
                    }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        justifyContent: 'space-between',
                      }}>
                      <TouchableOpacity
                        disabled={!item?.write}
                        onPress={() => {
                          navigation.navigate('NameListScreen', {
                            title: 'Total Number Of Adults',
                            item1: evnentObj,
                            type: 'TotalNumberOfAdults',
                          });
                        }}
                        style={styles.tabContianer1}>
                        <Text
                          numberOfLines={1}
                          style={{
                            fontSize: FONTS.FONTSIZE.SEMI,
                            fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                            textAlign: 'center',
                            color: COLORS.TITLECOLOR,
                          }}>
                          {evnentObj?.TotalNumberofGuests
                            ? evnentObj?.TotalNumberofGuests
                            : 0}
                        </Text>
                        <Text
                          numberOfLines={3}
                          style={{
                            fontSize: FONTS.FONTSIZE.MINI,
                            fontFamily: FONTS.FONT_FAMILY.EXTRA_LIGHT,
                            textAlign: 'center',
                            color: COLORS.PRIMARYBLACK,
                          }}>
                          Total Number Of Adults
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        disabled={!item?.write}
                        onPress={() => {
                          navigation.navigate('NameListScreen', {
                            title: 'Total Number Of Kids',
                            item1: evnentObj,
                            type: 'TotalNumberOfKids',
                          });
                        }}
                        style={styles.tabContianer1}>
                        <Text
                          numberOfLines={1}
                          style={{
                            fontSize: FONTS.FONTSIZE.SEMI,
                            fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                            textAlign: 'center',
                            color: COLORS.TITLECOLOR,
                          }}>
                          {evnentObj?.TotalNumberofKids
                            ? evnentObj?.TotalNumberofKids
                            : 0}
                        </Text>
                        <Text
                          numberOfLines={3}
                          style={{
                            fontSize: FONTS.FONTSIZE.MINI,
                            fontFamily: FONTS.FONT_FAMILY.EXTRA_LIGHT,
                            textAlign: 'center',
                            color: COLORS.PRIMARYBLACK,
                          }}>
                          Total Number Of Kids
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        disabled={!item?.write}
                        onPress={() => {
                          navigation.navigate('NameListScreen', {
                            title: 'Total Guests',
                            item1: evnentObj,
                            type: 'TotalRsvpGuest',
                          });
                        }}
                        style={styles.tabContianer1}>
                        <Text
                          numberOfLines={1}
                          style={{
                            fontSize: FONTS.FONTSIZE.SEMI,
                            fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                            textAlign: 'center',
                            color: COLORS.TITLECOLOR,
                          }}>
                          {evnentObj?.TotalGuests ? evnentObj?.TotalGuests : 0}
                        </Text>
                        <Text
                          numberOfLines={3}
                          style={{
                            fontSize: FONTS.FONTSIZE.MINI,
                            fontFamily: FONTS.FONT_FAMILY.EXTRA_LIGHT,
                            textAlign: 'center',
                            color: COLORS.PRIMARYBLACK,
                          }}>
                          Total Guests
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View
                    style={{
                      borderRadius: 10,
                      marginTop: 0,
                    }}>
                    <TouchableOpacity
                      disabled={!item?.write}
                      onPress={() => {
                        navigation.navigate('NameListScreen', {
                          title: 'Total RSVP Count',
                          item1: evnentObj,
                          type: 'TotalRsvpGuest',
                        });
                      }}
                      style={{
                        paddingHorizontal: 15,
                        paddingVertical: 10,
                        backgroundColor: COLORS.PRIMARYWHITE,
                        borderRadius: 10,
                        overflow: 'hidden',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 10,
                      }}>
                      <Text
                        numberOfLines={2}
                        style={{
                          fontSize: FONTS.FONTSIZE.SEMI,
                          fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                          textAlign: 'center',
                          color: COLORS.TITLECOLOR,
                        }}>
                        {evnentObj?.TotalRSVPCount
                          ? evnentObj?.TotalRSVPCount
                          : 0}
                      </Text>
                      <Text
                        numberOfLines={3}
                        style={{
                          fontSize: FONTS.FONTSIZE.MINI,
                          fontFamily: FONTS.FONT_FAMILY.EXTRA_LIGHT,
                          color: COLORS.PRIMARYBLACK,
                          textAlign: 'center',
                        }}>
                        Total RSVP Count
                      </Text>
                    </TouchableOpacity>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        justifyContent: 'space-between',
                      }}>
                      <TouchableOpacity
                        disabled={!item?.write}
                        onPress={() => {
                          navigation.navigate('NameListScreen', {
                            title: 'Total Yes Responses',
                            item1: evnentObj,
                            type: 'TotalYesResponseGuest',
                          });
                        }}
                        style={styles.tabContianer1}>
                        <Text
                          numberOfLines={2}
                          style={{
                            fontSize: FONTS.FONTSIZE.SEMI,
                            fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                            textAlign: 'center',
                            color: COLORS.TITLECOLOR,
                          }}>
                          {evnentObj?.TotalPositiveResponses
                            ? evnentObj?.TotalPositiveResponses
                            : 0}
                        </Text>
                        <Text
                          numberOfLines={3}
                          style={{
                            fontSize: FONTS.FONTSIZE.MINI,
                            fontFamily: FONTS.FONT_FAMILY.EXTRA_LIGHT,
                            textAlign: 'center',
                            color: COLORS.PRIMARYBLACK,
                          }}>
                          Total Yes Responses
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        disabled={!item?.write}
                        onPress={() => {
                          navigation.navigate('NameListScreen', {
                            title: 'Total No Responses',
                            item1: evnentObj,
                            type: 'TotalNoResponseGuest',
                          });
                        }}
                        style={styles.tabContianer1}>
                        <Text
                          numberOfLines={2}
                          style={{
                            fontSize: FONTS.FONTSIZE.SEMI,
                            fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                            textAlign: 'center',
                            color: COLORS.TITLECOLOR,
                          }}>
                          {evnentObj?.TotalNegativeResponses
                            ? evnentObj?.TotalNegativeResponses
                            : 0}
                        </Text>
                        <Text
                          numberOfLines={3}
                          style={{
                            fontSize: FONTS.FONTSIZE.MINI,
                            fontFamily: FONTS.FONT_FAMILY.EXTRA_LIGHT,
                            color: COLORS.PRIMARYBLACK,
                            textAlign: 'center',
                          }}>
                          Total No Responses
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        disabled={!item?.write}
                        onPress={() => {
                          navigation.navigate('NameListScreen', {
                            title: 'Total Maybe Responses',
                            item1: evnentObj,
                            type: 'TotalMaybeResponseGuest',
                          });
                        }}
                        style={styles.tabContianer1}>
                        <Text
                          numberOfLines={3}
                          style={{
                            fontSize: FONTS.FONTSIZE.SEMI,
                            fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                            textAlign: 'center',
                            color: COLORS.TITLECOLOR,
                          }}>
                          {evnentObj?.TotalMaybeResponses
                            ? evnentObj?.TotalMaybeResponses
                            : 0}
                        </Text>
                        <Text
                          numberOfLines={2}
                          style={{
                            fontSize: FONTS.FONTSIZE.MINI,
                            fontFamily: FONTS.FONT_FAMILY.EXTRA_LIGHT,
                            textAlign: 'center',
                            color: COLORS.PRIMARYBLACK,
                          }}>
                          Total Maybe Responses
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      ) : (
        <Offline />
      )}
    </View>
  );
};

export default EventDetails;
