import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import COLORS from './../theme/Color';
import {MaterialDesignIcons} from "@react-native-vector-icons/material-design-icons";
import {Ionicons} from "@react-native-vector-icons/ionicons";
import FONTS from '../theme/Fonts';
import {NOTIFY_MESSAGE} from '../constant/Module';
import Loader from '../components/root/Loader';
import {IMAGE_URL} from '../connection/Config';
import {getData} from '../utils/Storage';
import {useIsFocused, useNavigation} from '@react-navigation/native';
import Offline from '../components/root/Offline';
import CustomHeader from '../components/root/CustomHeader';
import {FontAwesome6} from "@react-native-vector-icons/fontawesome6";
import {useNetworkStatus} from '../connection/UseNetworkStatus';
import httpClient from '../connection/httpClient';
import FastImage from 'react-native-fast-image';
import moment from 'moment';

var DataArray = [];

export default function RegistrationPreviewAfterQrCode({route}) {
  const {userData, isSelfCheckIn} = route?.params;
  const [regConfig, setRegConfig] = useState([]);

  const [isRnderLoading, setIsRenderLoading] = useState(true);
  const [qrImgUrl, setQrImgUrl] = useState('');
  const [newArray, setNewArray] = useState([]);
  const isFocused = useIsFocused();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventLoading, setEventLoading] = useState(true);

  const {isConnected, networkLoading} = useNetworkStatus();

  const navigation = useNavigation();
  const [eventValue, setEventValue] = useState(null);

  useEffect(() => {
    const rsvpData = regConfig.find(item => item.headerKey === 'rsvp');

    if (rsvpData) {
      const eventConfig = rsvpData.headerConfig.find(
        config => config.name === 'event',
      );

      if (eventConfig && eventConfig?.values) {
        const eventName = eventConfig?.values?.find(value =>
          value?.label?.startsWith(eventConfig.value),
        );
        if (eventName) {
          setEventValue(eventName?.label);
        } else {
          setEventValue(null);
        }
      } else {
        setEventValue(null);
      }
    }
  }, [regConfig]);

  const getEvent = async () => {
    try {
      const event = await getData('event');
      setSelectedEvent(event);
      setEventLoading(false);
    } catch (error) {}
  };

  useEffect(() => {
    const fetchData = async () => {
      if (isFocused) {
        await getEvent();
      }
    };

    fetchData();
  }, [isFocused]);

  useEffect(() => {
    if (userData && route?.params?.memberId && !eventLoading) {
      onGetQrApiCall();
      onRenderRegApiCall();
    }
  }, [route?.params?.memberId, userData, eventLoading]);

  function onGetQrApiCall() {
    httpClient
      .get(
        `GetQRCode?Qrcodeid=${
          userData?.member
            ? userData?.member?.configurationId
            : route?.params?.memberId
        }`,
      )
      .then(response => {
        const {data} = response;
        const {status, message, result} = data;

        if (status || status == true) {
          setQrImgUrl(result);
        } else {
          NOTIFY_MESSAGE(message);
        }
      })
      .catch(error => {
        NOTIFY_MESSAGE(error ? 'Something Went Wrong.' : null);
      });
  }

  async function onRenderRegApiCall() {
    httpClient
      .get(
        `mobile/module/configurations/get?modulename=FAMILY%20MEMBER&moduleConfurationId=${
          selectedEvent
            ? route?.params?.memberId
            : userData?.member?.configurationId
        }&isMobile=true&eventId=${
          selectedEvent ? selectedEvent?.id : route?.params?.memberId
        }`,
      )
      .then(response => {
        const {data} = response;
        const {status, message, result} = data;
        setIsRenderLoading(false);
        if (status || status == true) {
          if (result?.configuration) {
            let resConfig = JSON.parse(result?.configuration);
            setRegConfig(resConfig);
          }
        } else {
          NOTIFY_MESSAGE(message);
        }
      })
      .catch(err => {
        NOTIFY_MESSAGE(err || err?.message ? 'Something Went Wrong' : null);
        setIsRenderLoading(false);
      });
  }

  const onCheckIn = () => {
    const newDate = moment(new Date()).format('MM/DD/YY h:mm A');

    const newArray1 = newArray.map((i, index) => {
      return {
        id: 0,
        eventid: selectedEvent ? selectedEvent.id : route?.params?.memberId,
        memberid: userData?.member
          ? userData?.member?.configurationId
          : route?.params?.memberId,
        firstname: i?.firstName?.value,
        lastname: i?.lastName?.value,
        checkIn: newDate,
        configurationId: i?.configurationid?.value,
      };
    });

    httpClient
      .post(`customer/checkin`, newArray1)
      .then(response => {
        const {data} = response;
        const {status, message, result} = data;
        if (status || status == true) {
          NOTIFY_MESSAGE(message || '');
          navigation.navigate('QrCodeScanScreen', {
            isSelfCheckIn: isSelfCheckIn,
          });
        } else {
          NOTIFY_MESSAGE(message);
        }
      })
      .catch(err => {
        NOTIFY_MESSAGE(err || err?.message ? 'Something Went Wrong' : null);
      });
  };

  const onCheck = (data, index) => {
    const newArray = regConfig.map(i => {
      if (i?.isMultiple && i?.userValues) {
        return {
          ...i,
          userValues: i.userValues.map((j, id) => {
            if (id === index) {
              return {...j, isselected: !j.isselected};
            }
            return j;
          }),
        };
      }
      return i;
    });

    setRegConfig(newArray);

    getCheckUsers(newArray);
  };

  const getCheckUsers = val => {
    const newValue =
      val?.length > 0
        ? val?.find(item => item?.headerKey === 'personalInfo')
        : {};

    const array = newValue?.userValues?.map(itm => {
      if (itm?.isselected) {
        return itm;
      }
    });
    const newArrays = array?.filter(itm => itm !== undefined);
    setNewArray(newArrays);
  };

  const [imageErrors, setImageErrors] = useState({});

  const handleImageError = index => {
    setImageErrors(prev => ({...prev, [index]: true}));
  };

  const getView = () => {
    return regConfig?.map((data, index) => {
      if (data?.headerKey === 'memberDetails') {
        return null;
      }

      const allAttendeesCheckedIn = data?.userValues?.every(
        user => user?.eventAttendanceStatus?.value?.toLowerCase() === 'true',
      );

      const shouldRenderHeaderConfig =
        data?.headerConfig &&
        data?.headerConfig.some(
          item => item?.value !== null && item?.value !== '',
        );

      const hasUserValues =
        data?.isMultiple &&
        data?.userValues &&
        data?.userValues?.some(user => {
          return Object.values(user).some(
            field => field?.value !== null && field?.value !== '',
          );
        });

      return (
        <View key={index} style={[styles.tabContianer, {marginTop: 0}]}>
          {(shouldRenderHeaderConfig || hasUserValues) &&
            !allAttendeesCheckedIn && (
              <Text style={[styles.boldLbl, {marginBottom: 8}]}>
                {data.headerLabel}
              </Text>
            )}
          <View>
            {data.isMultiple && data.userValues ? (
              <>
                {(() => {
                  const attendees = data.userValues.filter(
                    user =>
                      user.eventAttendanceStatus?.value?.toLowerCase() ===
                      'true',
                  );
                  return (
                    <>
                      {data.userValues.map((data, index) => {
                        let objectValue = Object.values(data);
                        const attendees = objectValue.filter(
                          item =>
                            item.name === 'eventAttendanceStatus' &&
                            item.value?.toLowerCase() === 'true',
                        );
                        return (
                          <View key={index}>
                            <>
                              {data.ischecked == true ? (
                                <>
                                  {objectValue.map((dataa, index) => {
                                    return dataa.name === 'firstName' ||
                                      dataa.name === 'lastName' ? (
                                      <View key={index} style={styles.lstrow}>
                                        <Text style={styles.txtlstLbl}>
                                          {dataa.label + ' : '}
                                        </Text>
                                        <Text style={styles.txtlstvalue}>
                                          {dataa.value ? dataa.value : '-'}
                                        </Text>
                                      </View>
                                    ) : null;
                                  })}
                                </>
                              ) : (
                                !attendees.length && (
                                  <>
                                    <TouchableOpacity
                                      onPress={() => {
                                        if (data.isselected) {
                                          const firstName =
                                            objectValue.find(
                                              item => item.name === 'firstName',
                                            )?.value || '';
                                          const lastName =
                                            objectValue.find(
                                              item => item.name === 'lastName',
                                            )?.value || '';

                                          DataArray.push({
                                            firstname: firstName,
                                            lastname: lastName,
                                          });
                                        }
                                        onCheck(data, index);
                                      }}
                                      style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 5,
                                      }}>
                                      {data.isselected ? (
                                        <Ionicons
                                          name="checkbox-outline"
                                          size={28}
                                          color={COLORS.LABELCOLOR}
                                        />
                                      ) : (
                                        <MaterialDesignIcons
                                          name="checkbox-blank-outline"
                                          size={28}
                                          color={COLORS.LABELCOLOR}
                                        />
                                      )}
                                      <Text
                                        style={{
                                          fontSize: FONTS.FONTSIZE.SMALL,
                                          color: COLORS.PLACEHOLDERCOLOR,
                                          fontFamily: FONTS.FONT_FAMILY.REGULAR,
                                        }}>
                                        Check In
                                      </Text>
                                    </TouchableOpacity>

                                    {objectValue
                                      .filter(
                                        item =>
                                          item.name === 'firstName' ||
                                          item.name === 'lastName',
                                      )
                                      .map((dataa, index) => (
                                        <View
                                          key={`${dataa.name}-${index}`}
                                          style={styles.lstrow}>
                                          <Text style={styles.txtlstLbl}>
                                            {dataa.label} :
                                          </Text>
                                          <Text style={styles.txtlstvalue}>
                                            {dataa.value || '-'}
                                          </Text>
                                        </View>
                                      ))}
                                  </>
                                )
                              )}
                            </>
                          </View>
                        );
                      })}
                      {attendees.length > 0 && (
                        <View style={{marginBottom: 0}}>
                          <Text
                            style={[
                              styles.boldLbl,
                              {color: COLORS.LABELCOLOR},
                            ]}>
                            Event Attendee :
                          </Text>
                          {attendees.map((attendee, idx) => (
                            <Text
                              numberOfLines={2}
                              key={idx}
                              style={{
                                width: '95%',
                                fontSize: FONTS.FONTSIZE.EXTRASMALL,
                                color: COLORS.PLACEHOLDERCOLOR,
                                marginVertical: 4,
                                marginHorizontal: 6,
                              }}>
                              {`${idx + 1} )  `}
                              <Text
                                style={{
                                  fontFamily: FONTS.FONT_FAMILY.REGULAR,
                                }}>
                                {`${attendee.firstName.value} ${attendee.lastName.value}`}
                              </Text>
                            </Text>
                          ))}
                        </View>
                      )}
                    </>
                  );
                })()}
              </>
            ) : shouldRenderHeaderConfig ? (
              data.headerConfig.map((configItem, index) => {
                let mediaUris = [];

                try {
                  const parsedValue =
                    configItem.type === 'file'
                      ? JSON.parse(configItem.value)
                      : [];
                  mediaUris = Array.isArray(parsedValue)
                    ? parsedValue
                    : [parsedValue];
                } catch (error) {
                  mediaUris = configItem.value ? [configItem.value] : [];
                }

                return configItem.type === 'file' ? (
                  <View key={index} style={styles.lstImgrow}>
                    <Text
                      style={styles.txtlstLbl}>{`${configItem.label} :`}</Text>
                    {mediaUris ? (
                      <ScrollView
                        contentContainerStyle={{gap: 10}}
                        horizontal
                        showsHorizontalScrollIndicator={false}>
                        {mediaUris?.map((uri, uriIndex) => (
                          <TouchableOpacity
                            disabled={imageErrors[uri]}
                            key={uriIndex}
                            onPress={() => {
                              navigation.navigate('FullImageScreen', {
                                image: uri,
                              });
                            }}>
                            <FastImage
                              onError={() => handleImageError(uri)}
                              style={{
                                height: 100,
                                width: 100,
                                borderRadius: 10,
                                marginRight: 5,
                              }}
                              source={
                                imageErrors[uri]
                                  ? require('../assets/images/noimage.png')
                                  : {
                                      uri: IMAGE_URL + uri,
                                      cache: FastImage.cacheControl.immutable,
                                      priority: FastImage.priority.normal,
                                    }
                              }
                            />
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    ) : (
                      <Text>-</Text>
                    )}
                  </View>
                ) : (
                  <View key={index} style={styles.lstrow}>
                    <Text style={styles.txtlstLbl}>
                      {configItem.label + ' : '}
                    </Text>
                    <Text style={styles.txtlstvalue}>
                      {configItem.value
                        ? (() => {
                            const parts = configItem.value
                              ?.split(',')
                              ?.map(p => p.trim());
                            return (
                              <>
                                {parts[0]}
                                {parts?.slice(1)?.map((part, idx) => (
                                  <Text key={idx} style={styles.txtlstvalue}>
                                    {',\n' + part}
                                  </Text>
                                ))}
                              </>
                            );
                          })()
                        : '-'}
                    </Text>
                  </View>
                );
              })
            ) : null}
          </View>
          {(shouldRenderHeaderConfig || hasUserValues) && (
            <View
              style={{
                borderBottomWidth: 1,
                marginTop: 10,
                borderBottomColor: COLORS.INPUTBORDER,
              }}
            />
          )}
        </View>
      );
    });
  };

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
          <FontAwesome6 name="angle-left" iconStyle='solid' size={26} color={COLORS.LABELCOLOR} />
        }
        title={
          route?.params?.selectedEvent
            ? route?.params?.selectedEvent
            : eventValue
            ? eventValue
            : ''
        }
      />
      {networkLoading || isRnderLoading || eventLoading ? (
        <Loader />
      ) : isConnected ? (
        <View style={styles.container}>
          <ScrollView style={styles.container}>
            <View
              style={[
                styles.tabContianer,
                {justifyContent: 'center', alignItems: 'center'},
              ]}>
              <View justifyContent={'center'} alignItems={'center'}>
                <Image
                  style={{height: 150, width: 150, marginBottom: 10}}
                  source={{uri: IMAGE_URL + qrImgUrl}}
                  resizeMode="contain"
                />
                {regConfig
                  ?.find(data => data?.headerKey === 'personalInfo')
                  ?.userValues?.every(
                    user =>
                      user?.eventAttendanceStatus?.value?.toLowerCase() ===
                      'true',
                  ) ? (
                  <Text
                    style={{
                      fontSize: FONTS.FONTSIZE.MEDIUM,
                      color: COLORS.PRIMARYGREEN,
                      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                      textAlign: 'center',
                    }}>
                    All members have checked in successfully!
                  </Text>
                ) : (
                  <TouchableOpacity
                    onPress={onCheckIn}
                    style={{
                      backgroundColor: COLORS.LABELCOLOR,
                      paddingLeft: 15,
                      paddingRight: 15,
                      paddingTop: 8,
                      paddingBottom: 8,
                      alignItems: 'center',
                      borderRadius: 8,
                    }}>
                    <Text
                      style={{
                        fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                        fontSize: FONTS.FONTSIZE.EXTRASMALL,
                        color: COLORS.PRIMARYWHITE,
                      }}>
                      Check In
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <View
              style={{
                borderBottomWidth: 1,
                borderBottomColor: COLORS.INPUTBORDER,
                marginHorizontal: 15,
              }}
            />
            {getView()}
          </ScrollView>
        </View>
      ) : (
        <Offline />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUNDCOLOR,
  },
  tabContianer: {
    borderRadius: 15,
    margin: 15,
  },
  txtlstLbl: {
    width: '50%',
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.EXTRASMALL,
    color: COLORS.PLACEHOLDERCOLOR,
  },
  img: {
    width: '100%',
    height: 150,
    borderRadius: 5,
    borderColor: COLORS.LIGHTGREY,
    marginVertical: 10,
  },
  txtlstvalue: {
    width: '50%',
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.EXTRASMALL,
    color: COLORS.PLACEHOLDERCOLOR,
  },
  lstrow: {
    paddingVertical: 2,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  lstImgrow: {
    paddingVertical: 2,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  boldLbl: {
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.SMALL,
    color: COLORS.TITLECOLOR,
  },
});
