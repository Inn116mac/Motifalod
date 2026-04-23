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
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {Ionicons} from '@react-native-vector-icons/ionicons';
import FONTS from '../theme/Fonts';
import {NOTIFY_MESSAGE} from '../constant/Module';
import Loader from '../components/root/Loader';
import {IMAGE_URL} from '../connection/Config';
import {getData} from '../utils/Storage';
import {useIsFocused, useNavigation} from '@react-navigation/native';
import Offline from '../components/root/Offline';
import CustomHeader from '../components/root/CustomHeader';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {useNetworkStatus} from '../connection/UseNetworkStatus';
import httpClient from '../connection/httpClient';
import FastImage from 'react-native-fast-image';
import moment from 'moment';
import {Entypo} from '@react-native-vector-icons/entypo';

var DataArray = [];

const ADDRESS_KEYS = [
  'address',
  'street',
  'city',
  'state',
  'zip',
  'postal',
  'country',
  'province',
];
const isAddrField = s => ADDRESS_KEYS.some(k => s?.toLowerCase().includes(k));

const getFieldVal = (userValue, fieldName) =>
  Object.values(userValue).find(f => f.name === fieldName)?.value || '';


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
          isSelfCheckIn
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
        memberid: isSelfCheckIn
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

  const personalInfoSection = regConfig.find(
    d => d.headerKey === 'personalInfo',
  );
  const attendees = personalInfoSection?.userValues || [];
  const totalCount = attendees.length;
  const checkedInCount = attendees.filter(
    u => u.eventAttendanceStatus?.value?.toLowerCase() === 'true',
  ).length;
  const pendingCount = totalCount - checkedInCount;


  const renderOtherSections = () => {
    const filtered = regConfig.filter(
      s =>
        !['personalInfo', 'memberDetails', 'rsvp'].includes(s.headerKey) &&
        s.headerConfig,
    );

    const allAddressLines = [];
    filtered.forEach(section => {
      const isSectionAddr =
        isAddrField(section.headerKey) || isAddrField(section.headerLabel);
      if (isSectionAddr) {
        const line = section.headerConfig
          .filter(c => c.value && c.value !== '')
          .map(c => c.value)
          .join(', ');
        if (line) allAddressLines.push(line);
      } else {
        const line = section.headerConfig
          .filter(
            c =>
              c.value &&
              c.value !== '' &&
              (isAddrField(c.name) || isAddrField(c.label)),
          )
          .map(c => c.value)
          .join(', ');
        if (line) allAddressLines.push(line);
      }
    });

    const cards = filtered
      .filter(s => !(isAddrField(s.headerKey) || isAddrField(s.headerLabel)))
      .map((section, idx) => {
        const items = section.headerConfig.filter(
          c =>
            c.value &&
            c.value !== '' &&
            !isAddrField(c.name) &&
            !isAddrField(c.label),
        );
        if (!items.length) return null;

        return (
          <View key={idx} style={styles.sectionCard}>
            <View style={styles.sectionCardHeader}>
              <View style={styles.sectionIconBox}>
                <MaterialDesignIcons
                  name="card-account-details-outline"
                  size={16}
                  color={'#3D74E8'}
                />
              </View>
              <Text style={styles.sectionCardTitle}>{section.headerLabel}</Text>
            </View>
            <View style={styles.sectionDivider} />
            {items.map((item, i) => {
              const isFile = item.type === 'file';
              let fileUris = [];
              if (isFile) {
                try {
                  const parsed = JSON.parse(item.value);
                  fileUris = Array.isArray(parsed)
                    ? parsed.filter(Boolean)
                    : parsed
                    ? [parsed]
                    : [];
                } catch {
                  fileUris = item.value ? [item.value] : [];
                }
              }
              const lower = item.value?.toLowerCase();
              const isYesNo = lower === 'yes' || lower === 'no';
              return (
                <View
                  key={i}
                  style={[
                    isFile ? styles.dataRowColumn : styles.dataRow,
                    i > 0 && styles.dataRowBorder,
                  ]}>
                  <Text style={styles.dataLabel}>{item.label}</Text>
                  {isFile ? (
                    <View style={{marginTop: 4}}>
                      {fileUris.length > 0 ? (
                        fileUris.map((uri, fi) => {
                          const fileName = uri.split('/').pop() || uri;
                          return (
                            <TouchableOpacity
                              key={fi}
                              onPress={() =>
                                navigation.navigate('FullImageScreen', {
                                  image: uri,
                                })
                              }>
                              <Text style={styles.fileLink}>
                                {fi + 1}. {fileName}
                              </Text>
                            </TouchableOpacity>
                          );
                        })
                      ) : (
                        <Text style={styles.noFileText}>
                          No Files to Display
                        </Text>
                      )}
                    </View>
                  ) : isYesNo ? (
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor:
                            lower === 'yes' ? '#eafee9' : '#FEE2E2',
                        },
                      ]}>
                      <Text
                        style={[
                          styles.badgeText,
                          {color: lower === 'yes' ? 'green' : '#DC2626'},
                        ]}>
                        {item.value}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.dataValue} numberOfLines={2}>
                      {item.value}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        );
      });

    const addrCards = allAddressLines.map((line, i) => (
      <View key={`addr-${i}`} style={styles.addrCard}>
        <View style={styles.addrIconCircle}>
          <MaterialDesignIcons
            name="map-marker-outline"
            size={20}
            color={'#3D74E8'}
          />
        </View>
        <Text style={styles.addrCardText}>{line}</Text>
      </View>
    ));

    return [...cards, ...addrCards];
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
          <FontAwesome6
            name="angle-left"
            iconStyle="solid"
            size={26}
            color={COLORS.LABELCOLOR}
          />
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
          <ScrollView style={styles.scrollContent}>
  
              {/* QR Card */}
              <View style={styles.qrCard}>
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: '#D6E4F7',
                    backgroundColor: '#fff',
                    marginBottom: 8,
                  }}>
                  <Image
                    style={{height: 160, width: 160, marginBottom: 10}}
                    source={{uri: IMAGE_URL + qrImgUrl}}
                    resizeMode="contain"
                  />
                </View>
                {regConfig
                  ?.find(data => data?.headerKey === 'personalInfo')
                  ?.userValues?.every(
                    user =>
                      user?.eventAttendanceStatus?.value?.toLowerCase() ===
                      'true',
                  ) ? (
                  <Text style={styles.allCheckedText}>
                    All members have checked in successfully!
                  </Text>
                ) : (
                  <TouchableOpacity
                    onPress={onCheckIn}
                    style={styles.checkInAllBtn}>
                    <Entypo name="check" size={20} color="#fff" />
                    <Text style={styles.checkInAllText}>Check In</Text>
                  </TouchableOpacity>
                )}
              </View>

              
   
          {/* Attendees */}
          {attendees.length > 0 && (
            <>
              {checkedInCount > 0 && (
                <View style={styles.attendeeCard}>
                  <View style={styles.groupHeaderGreen}>
                    <Text style={styles.groupHeaderTextGreen}>
                      Checked In ({checkedInCount})
                    </Text>
                  </View>
                  {attendees
                    .filter(
                      a =>
                        a.eventAttendanceStatus?.value?.toLowerCase() === 'true',
                    )
                    .map((attendee, index) => {
                      const firstName = getFieldVal(attendee, 'firstName');
                      const lastName = getFieldVal(attendee, 'lastName');
                      return (
                        <View
                          key={`in-${index}`}
                          style={[
                            styles.attendeeRow,
                            index > 0 && styles.attendeeRowBorder,
                          ]}>
                          <View
                            style={[styles.avatar, {backgroundColor: '#bbb5b544'}]}>
                            <Text style={styles.avatarText}>{index + 1}</Text>
                          </View>
                          <Text style={styles.attendeeName}>
                            {`${firstName} ${lastName}`.trim()}
                          </Text>
                        </View>
                      );
                    })}
                </View>
              )}

              {pendingCount > 0 && (
                <View style={[styles.attendeeCard, {borderColor: '#f2808043'}]}>
                  <View style={styles.groupHeaderOrange}>
                    <Text style={styles.groupHeaderText}>
                      Awaiting Check-In ({pendingCount})
                    </Text>
                  </View>
                  {attendees
                    .filter(
                      a =>
                        a.eventAttendanceStatus?.value?.toLowerCase() !== 'true',
                    )
                    .map((attendee, index) => {
                      const globalIndex = attendees.indexOf(attendee);
                      const firstName = getFieldVal(attendee, 'firstName');
                      const lastName = getFieldVal(attendee, 'lastName');
                      return (
                        <View
                          key={`out-${index}`}
                          style={[
                            styles.attendeeRow,
                            index > 0 && styles.attendeeRowBorder,
                          ]}>
                          <TouchableOpacity
                            onPress={() => onCheck(attendee, globalIndex)}
                            activeOpacity={0.7}>
                            <MaterialDesignIcons
                              name={
                                attendee.isselected
                                  ? 'checkbox-marked'
                                  : 'checkbox-blank-outline'
                              }
                              size={24}
                              color={
                                attendee.isselected
                                  ? COLORS.LABELCOLOR
                                  : '#D1D5DB'
                              }
                            />
                          </TouchableOpacity>
                          <View
                            style={[styles.avatar, {backgroundColor: '#bbb5b544'}]}>
                            <Text style={styles.avatarText}>{index + 1}</Text>
                          </View>
                          <Text style={styles.attendeeName}>
                            {`${firstName} ${lastName}`.trim()}
                          </Text>
                        </View>
                      );
                    })}
                </View>
              )}
            </>
          )}

          {/* Payment / other sections */}
          {renderOtherSections()}
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
  scrollContent: {paddingHorizontal: 16, paddingVertical: 8, paddingBottom: 32},
  qrCard: {
    backgroundColor: '#F4F8FF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#D6E4F7',
  },
  qrImage: {width: 160, height: 160, marginBottom: 10},
  allCheckedText: {
    fontSize: FONTS.FONTSIZE.SMALL,
    color: '#0daf0d',
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    textAlign: 'center',
  },
  checkInAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#3D74E8',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  checkInAllText: {
    color: '#fff',
    fontSize: FONTS.FONTSIZE.SMALL,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    includeFontPadding: false,
  },
  attendeeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#d8edcf',
  },
  attendeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  attendeeRowBorder: {borderTopWidth: 1, borderTopColor: '#F3F4F6'},
  groupHeaderGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8F7EE',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  groupHeaderOrange: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDEEE8',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  groupHeaderTextGreen: {
    color: '#1A5C30',
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    includeFontPadding: false,
  },
  groupHeaderText: {
    color: '#9B3512',
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    includeFontPadding: false,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: FONTS.FONTSIZE.MINI,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    includeFontPadding: false,
    color: COLORS.PLACEHOLDERCOLOR,
  },
  attendeeName: {
    fontSize: FONTS.FONTSIZE.SMALL,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: COLORS.PLACEHOLDERCOLOR,
    includeFontPadding: false,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#D6E4F7',
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: '#def0f67b',
  },
  sectionIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCardTitle: {
    fontSize: FONTS.FONTSIZE.SMALL,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    color: '#3D74E8',
    includeFontPadding: false,
  },
  sectionDivider: {height: 1, backgroundColor: '#F3F4F6'},
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dataRowBorder: {borderTopWidth: 1, borderTopColor: '#F3F4F6'},
  dataRowColumn: {
    flexDirection: 'column',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dataLabel: {
    flex: 1,
    fontSize: FONTS.FONTSIZE.MINI,
    color: COLORS.PLACEHOLDERCOLOR,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
  },
  dataValue: {
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    color: COLORS.PLACEHOLDERCOLOR,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    textAlign: 'right',
    maxWidth: '55%',
  },
  fileLink: {
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    color: COLORS.PLACEHOLDERCOLOR,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    textDecorationLine: 'underline',
  },
  noFileText: {
    fontSize: FONTS.FONTSIZE.EXTRAMINI,
    color: COLORS.LABELCOLOR,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
  },
  addrCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.TABLEBORDER,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  addrIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4F8FF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  addrCardText: {
    flex: 1,
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    color: COLORS.PLACEHOLDERCOLOR,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
  },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    includeFontPadding: false,
  },
});
