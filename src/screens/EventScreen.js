import {
  View,
  Text,
  RefreshControl,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Platform,
  Linking,
  useWindowDimensions,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import COLORS from '../theme/Color';
import {useNavigation} from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import FONTS from '../theme/Fonts';
import Loader from '../components/root/Loader';
import {getData} from '../utils/Storage';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import moment from 'moment';
import {NOTIFY_MESSAGE} from '../constant/Module';
import * as Calendar from 'expo-calendar';
import Offline from '../components/root/Offline';
import {useNetworkStatus} from '../connection/UseNetworkStatus';
import NoDataFound from '../components/root/NoDataFound';
import CustomHeader from '../components/root/CustomHeader';
import httpClient from '../connection/httpClient';

const EventScreen = ({route}) => {
  const styles = StyleSheet.create({
    paginationText: {
      fontSize: FONTS.FONTSIZE.SMALL,
      color: 'blue',
      textAlign: 'center',
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    },
    listContainer: {
      padding: heightPercentageToDP('1.5%'),
    },
    lstCont: {
      marginBottom: 10,
      borderRadius: 15,
      backgroundColor: COLORS.PRIMARYWHITE,
      overflow: 'hidden',
    },
    txtTitle: {
      fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
      fontSize: FONTS.FONTSIZE.SEMI,
      color: COLORS.TITLECOLOR,
      letterSpacing: 1,
    },
    txtAddress: {
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
      fontSize: FONTS.FONTSIZE.MINI,
      color: COLORS.PLACEHOLDERCOLOR,
      letterSpacing: 1,
      marginBottom: 2,
    },
    txtAction: {
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
      fontSize:
        Platform.OS === 'ios' ? FONTS.FONTSIZE.SMALL : FONTS.FONTSIZE.SEMIMINI,
      color: COLORS.PRIMARYBLACK,
    },
    txtLabel: {
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      fontSize: FONTS.FONTSIZE.LARGE,
      color: 'white',
    },
    listContainer: {
      padding: heightPercentageToDP(1),
    },
    viewLine: {
      height: 10,
      width: 1,
      backgroundColor: 'gray',
      marginLeft: widthPercentageToDP(1),
      marginRight: widthPercentageToDP(1),
    },
  });

  const data = [
    {id: 0, title: 'Upcoming Events', icon: 'calendar'},
    {id: 1, title: 'Past Events', icon: 'refresh'},
  ];

  const {item} = route?.params?.data;

  const [colors, setColors] = useState([
    'orange',
    'lightseagreen',
    'mediumorchid',
    'olivedrab',
  ]);

  const navigation = useNavigation();
  const PAGE_SIZE = 10;
  const {width, height} = useWindowDimensions();
  const isFolded = width >= 600;
  const [isReresh, setIsRefresh] = useState(false);
  const [activeTab, setActiveTab] = useState(data[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoading1, setIsLoading1] = useState(false);
  const [upEventRes, setUpEventRes] = useState([]);
  const [pastEventRes, setPastEventRes] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageNumber1, setPageNumber1] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (activeTab.id === 0) {
      onUpComingEvents();
    }
  }, [pageNumber, activeTab.id]);

  useEffect(() => {
    if (activeTab.id === 1) {
      onPastEventApiCall();
    }
  }, [pageNumber1, activeTab.id]);

  function onUpComingEvents() {
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setIsLoading(true);

        let eventdata = {
          familyMemberId: 0,
          pageNumber: pageNumber,
          pageSize: PAGE_SIZE,
        };

        httpClient
          .post('event/upcoming/pagination', eventdata)
          .then(response => {
            const {data} = response;
            const {status, message, result} = data;
            if (status || (status == true && result)) {
              const totalRecords = response?.data?.result?.totalRecord || 0;
              const calculatedTotalPages = Math.ceil(totalRecords / PAGE_SIZE);
              const newData = result?.data;

              if (newData?.length > 0) {
                setUpEventRes(newData);
              } else {
                setUpEventRes([]);
              }

              const canLoadMore =
                pageNumber < calculatedTotalPages && newData.length > 0;
              setHasMore(canLoadMore);
            } else {
              NOTIFY_MESSAGE(message ? message : 'Something Went Wrong');
            }
          })
          .catch(err => {
            setIsLoading(false);
            NOTIFY_MESSAGE(err || err?.message ? 'Something Went Wrong' : null);
          })
          .finally(() => setIsLoading(false));
      } else {
        NOTIFY_MESSAGE('Please check your internet connectivity');
      }
    });
  }

  const loadMore = () => {
    if (hasMore && activeTab?.id === 0) {
      setPageNumber(prevPage => prevPage + 1);
    } else if (hasMore && activeTab?.id === 1) {
      setPageNumber1(prevPage => prevPage + 1);
    }
  };

  function onPastEventApiCall() {
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setIsLoading1(true);
        let data = {
          familyMemberId: 0,
          pageNumber: pageNumber1,
          pageSize: PAGE_SIZE,
        };

        httpClient
          .post('event/past/pagination', data)
          .then(response => {
            const {data} = response;
            const {status, message, result} = data;
            if (status || (status == true && result)) {
              const totalRecords = response?.data?.result?.totalRecord || 0;
              const calculatedTotalPages = Math.ceil(totalRecords / PAGE_SIZE);
              const newData = result?.data;

              if (newData?.length > 0) {
                setPastEventRes(newData);
              } else {
                setPastEventRes([]);
              }

              const canLoadMore =
                pageNumber1 < calculatedTotalPages && newData.length > 0;
              setHasMore(canLoadMore);
            } else {
              NOTIFY_MESSAGE(message);
            }
          })
          .catch(err => {
            setIsLoading1(false);
            NOTIFY_MESSAGE(err || err?.message ? 'Something Went Wrong' : null);
            navigation.navigate('Dashboard');
          })
          .finally(() => {
            setIsLoading1(false);
          });
      } else {
        NOTIFY_MESSAGE('Please check your internet connectivity');
      }
    });
  }

  function onRefreshAction() {
    setIsRefresh(true);
    setPageNumber(1);
    setPageNumber1(1);
    setUpEventRes([]);
    setPastEventRes([]);
    if (activeTab?.id === 0) {
      onUpComingEvents();
      setIsRefresh(false);
    } else {
      onPastEventApiCall();
      setIsRefresh(false);
    }
  }

  const requestCalendarPermission = async () => {
    const {status} = await Calendar.requestCalendarPermissionsAsync();
    return status === 'granted';
  };

  const handleAddCalenderClick = async itm => {
    const hasPermission = await requestCalendarPermission();
    if (!hasPermission) {
      Alert.alert('Calendar permission denied');
      return;
    }

    // Helper function to convert date and time to proper datetime
    const convertDateTime = (dateStr, timeStr) => {
      const dateTimeStr = `${dateStr} ${timeStr}`;

      const momentObj = moment(dateTimeStr, 'MM/DD/YYYY hh:mm A');

      if (!momentObj.isValid()) {
        throw new Error(`Invalid date format: ${dateTimeStr}`);
      }

      return momentObj.toDate();
    };

    // Calculate start date
    const startDateTime = convertDateTime(itm.date, itm.time);

    // Calculate end date
    let endDateTime;
    if (itm.endTime && itm.endTime.trim()) {
      endDateTime = convertDateTime(itm.date, itm.endTime);

      // If end time is earlier than start time, assume it's next day
      const startDate = new Date(startDateTime);
      const endDate = new Date(endDateTime);

      if (endDate <= startDate) {
        // Add one day to end date
        endDate.setDate(endDate.getDate() + 1);
        endDateTime = endDate.toISOString();
      }
    } else {
      // If no endTime provided, default to 24 hours later
      const startDate = new Date(startDateTime);
      const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000); // Add 24 hours
      endDateTime = endDate.toISOString();
    }

    const eventDetails = {
      title: itm.name,
      startDate: startDateTime,
      endDate: endDateTime,
      location: itm.location,
      notes: itm.messagefromtheHost || '',
    };

    try {
      if (hasPermission) {
        const eventId = await Calendar.createEventInCalendarAsync(eventDetails);
      } else {
        Alert.alert('Calendar permission denied');
      }
    } catch (error) {
      Alert.alert('Error', 'Error adding event to calendar: ' + error.message);
    }
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

  const formattedTime = time => {
    const formatedtime = moment(time, 'HH:mm A').format('h:mm A');
    return formatedtime;
  };

  const MapLinking = location => {
    const url = Platform.select({
      ios: `maps:0,0?q=${location}`,
      android: `geo:0,0?q=${location}`,
    });
    Linking.openURL(url);
  };

  const renderEvenetItem = ({item, index}) => {
    const formattedDate = formatDate(item.date);

    const forValidate = moment(formattedDate, 'YYYY-MM-DDTHH:mm:ss[Z]', true);
    const isValidDate = forValidate?.isValid();

    return (
      <TouchableOpacity
        key={item?.eventId || index?.toString()}
        activeOpacity={0.8}
        style={styles.lstCont}
        onPress={() => {
          navigation.navigate('EventDetails', {
            evnentObj: item,
            isUpcommingEvent: activeTab?.id === 0,
            item: item,
          });
        }}>
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: 10,
            gap: isFolded ? 5 : 0,
          }}>
          <View
            style={{
              backgroundColor: colors[index % colors.length],
              alignContent: 'center',
              borderBottomLeftRadius: 10,
              borderBottomRightRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              bottom: 10,
              padding: 8,
            }}>
            <Text
              numberOfLines={2}
              style={{
                letterSpacing: 1,
                color: COLORS.PRIMARYWHITE,
                width: widthPercentageToDP('13%'),
                textAlign: 'center',
                fontSize: FONTS.FONTSIZE.BIG,
                fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
                top: 10,
              }}>
              {isValidDate ? moment(formattedDate).format('DD') : 'N/A'}
            </Text>
            <Text
              numberOfLines={2}
              style={{
                fontSize: FONTS.FONTSIZE.EXTRASMALL,
                fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                color: COLORS.PRIMARYWHITE,
                letterSpacing: 1,
                width: widthPercentageToDP('13%'),
                textAlign: 'center',
                marginTop: Platform.OS === 'ios' ? 4 : 0,
              }}>
              {isValidDate ? moment(formattedDate).format('MMM') : 'N/A'}
            </Text>
            <Text
              numberOfLines={2}
              style={{
                fontSize: FONTS.FONTSIZE.SEMIMINI,
                fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
                color: COLORS.PRIMARYWHITE,
                letterSpacing: 1,
                width: widthPercentageToDP('13%'),
                textAlign: 'center',
                top: 6,
                textTransform: 'uppercase',
              }}>
              {isValidDate ? moment(formattedDate).format('ddd') : 'N/A'}
            </Text>
          </View>

          <View
            style={{
              marginLeft: 5,
              paddingVertical: 2,
              flex: 1,
              gap: Platform.OS == 'ios' ? 2 : 0,
            }}>
            <Text
              numberOfLines={1}
              style={[
                styles.txtTitle,
                {
                  width:
                    activeTab?.id === 0 &&
                    (item?.isRSVPEnable == '1' ||
                      item?.isRSVPEnable?.toLowerCase() == 'yes')
                      ? '76%'
                      : '100%',
                },
              ]}>
              {item.name}
            </Text>
            <Text numberOfLines={1} style={[styles.txtAddress]}>
              {item.venue}
            </Text>
            <Text
              onPress={() => MapLinking(item?.location)}
              numberOfLines={2}
              style={[styles.txtAddress, {color: '#006effff'}]}>
              {item?.location}
            </Text>
            <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
              <Text
                style={[
                  styles.txtAction,
                  {color: COLORS.PRIMARYRED, flex: 0.7, textAlign: 'center'},
                ]}>
                {formattedTime(item?.time)}
              </Text>
              <View style={styles.viewLine} />
              {activeTab?.id === 0 && (
                <View style={{flex: 1.4, alignItems: 'center'}}>
                  <TouchableOpacity
                    onPress={() => handleAddCalenderClick(item)}>
                    <Text
                      style={[
                        styles.txtAction,
                        {
                          textDecorationLine: 'underline',
                          color: COLORS.PRIMARYGREEN,
                          textAlign: 'center',
                        },
                      ]}
                      numberOfLines={2}
                      ellipsizeMode="tail">
                      Add to Calendar
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              {activeTab?.id == 0 && <View style={styles.viewLine} />}
              <Text
                style={[
                  styles.txtAction,
                  {
                    textAlign: 'center',
                    flex: 1,
                  },
                ]}
                numberOfLines={2}
                ellipsizeMode="tail">
                Guest : {item?.TotalGuests || 0}
              </Text>
            </View>
          </View>
          {activeTab?.id === 0 &&
          (item?.isRSVPEnable == '1' ||
            item?.isRSVPEnable?.toLowerCase() == 'yes') ? (
            <TouchableOpacity
              style={{
                backgroundColor: COLORS.LABELCOLOR,
                position: 'absolute',
                right: 0,
                top: 10,
                paddingHorizontal: widthPercentageToDP(4),
                justifyContent: 'center',
                alignItems: 'center',
                borderBottomLeftRadius: 20,
                borderTopLeftRadius: 20,
                paddingVertical: heightPercentageToDP(0.2),
              }}
              onPress={() => {
                let data = {
                  item: item,
                  isRsvp: true,
                  isShow: true,
                  eventId: item?.eventId,
                };
                navigation.navigate('Form', {
                  data: data,
                });
              }}>
              <Text
                style={[
                  styles.txtLabel,
                  {
                    fontSize: FONTS.FONTSIZE.MEDIUM,
                    alignSelf: 'center',
                    textAlignVertical: 'center',
                  },
                ]}>
                {'RSVP'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  const {isConnected, networkLoading} = useNetworkStatus();

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
        title={item?.name}
      />
      <View style={{flex: 1}}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}>
          {data?.map(item => {
            const active = item?.id === activeTab?.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                  borderBottomWidth: active ? 2 : 0,
                  borderBottomColor: COLORS.TITLECOLOR,
                  paddingHorizontal: 2,
                  borderBottomLeftRadius: 20,
                  borderBottomRightRadius: 20,
                  marginBottom: 4,
                }}
                onPress={() => {
                  setActiveTab(item);
                  if (item.id === 0) {
                    setPageNumber(1);
                    setHasMore(true);
                  } else {
                    setPageNumber1(1);
                    setHasMore(true);
                  }
                }}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: FONTS.FONTSIZE.SMALL,
                    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
                    color: active ? COLORS.TITLECOLOR : COLORS.INACTIVETAB,
                    textAlign: 'center',
                  }}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {networkLoading || isLoading || isLoading1 ? (
          <Loader />
        ) : isConnected ? (
          <>
            {(activeTab?.id === 0 && upEventRes.length > 0) ||
            (activeTab?.id === 1 && pastEventRes.length > 0) ? (
              <View
                style={{
                  flex: 1,
                }}>
                <FlatList
                  contentContainerStyle={styles.listContainer}
                  showsVerticalScrollIndicator={false}
                  data={activeTab?.id === 0 ? upEventRes : pastEventRes}
                  refreshControl={
                    <RefreshControl
                      refreshing={isReresh}
                      onRefresh={onRefreshAction}
                    />
                  }
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={30}
                  updateCellsBatchingPeriod={200}
                  windowSize={40}
                  initialNumToRender={10}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={renderEvenetItem}
                />
                {/* {hasMore && !isLoading && !isLoading1 && (
                  <TouchableOpacity
                    onPress={loadMore}
                    style={{
                      alignSelf: 'center',
                      paddingVertical: heightPercentageToDP('1.5%'),
                      paddingHorizontal: widthPercentageToDP('5%'),
                    }}>
                    <Text
                      style={{
                        fontSize: FONTS.FONTSIZE.SMALL,
                        color: 'blue',
                        textAlign: 'center',
                        fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                      }}>
                      Load More...
                    </Text>
                  </TouchableOpacity>
                )} */}
              </View>
            ) : (
              <NoDataFound />
            )}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: heightPercentageToDP('1.5%'),
                paddingHorizontal: widthPercentageToDP('5%'),
                gap: 30,
              }}>
              {((activeTab?.id == 0 && pageNumber > 1) ||
                (activeTab?.id == 1 && pageNumber1 > 1)) && (
                <TouchableOpacity
                  onPress={() => {
                    if (activeTab?.id == 0) {
                      setPageNumber(prevPage => Math.max(prevPage - 1, 1));
                    } else {
                      setPageNumber1(prevPage => Math.max(prevPage - 1, 1));
                    }
                  }}
                  style={{}}>
                  <Text style={styles.paginationText}>Previous</Text>
                </TouchableOpacity>
              )}
              {hasMore && (
                <TouchableOpacity onPress={loadMore} style={{}}>
                  <Text style={styles.paginationText}>Load More</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        ) : (
          <Offline />
        )}
      </View>
    </View>
  );
};

export default EventScreen;
