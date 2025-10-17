import {
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native';
import {useEffect, useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import COLORS from '../theme/Color';
import FONTS from '../theme/Fonts';
import NetInfo from '@react-native-community/netinfo';
import {NOTIFY_MESSAGE} from '../constant/Module';
import Loader from '../components/root/Loader';
import Offline from '../components/root/Offline';
import CustomHeader from '../components/root/CustomHeader';
import {FontAwesome6} from "@react-native-vector-icons/fontawesome6";
import httpClient from '../connection/httpClient';
import {useNetworkStatus} from '../connection/UseNetworkStatus';
import NoDataFound from '../components/root/NoDataFound';
import {AntDesign} from "@react-native-vector-icons/ant-design";
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';

const EventDashboard = ({route}) => {
  const {item} = route?.params?.data;
  let item1 = item;
  const {width, height} = useWindowDimensions();

  const data = [
    {
      id: 1,
      name: 'All',
    },
    {
      id: 2,
      name: 'Event',
    },
  ];

  const styles = StyleSheet.create({
    paginationText: {
      fontSize: FONTS.FONTSIZE.SMALL,
      color: 'blue',
      textAlign: 'center',
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    },
    modalContainer: {
      flex: 1,
      alignItems: 'flex-end',
      overflow: 'hidden',
    },
    modalContent: {
      width: widthPercentageToDP(42),
      backgroundColor: COLORS.PRIMARYWHITE,
      borderRadius: 8,
      top: heightPercentageToDP(12),
      right: widthPercentageToDP(3),
    },
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    eventModalContainer: {
      flex: 1,
      alignItems: 'center',
      overflow: 'hidden',
      justifyContent: 'center',
    },
    eventModalContent: {
      width: width / 1.2,
      maxHeight: height / 1.2,
      backgroundColor: COLORS.PRIMARYWHITE,
      borderRadius: 8,
    },
    filterContainer: {
      backgroundColor: COLORS.LABELCOLOR,
      borderRadius: 20,
      alignSelf: 'flex-end',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 10,
      paddingVertical: 4,
      right: 10,
    },
    container: {
      paddingHorizontal: 16,
      borderRadius: 8,
      marginVertical: 8,
    },
    eventTitle: {
      fontSize: FONTS.FONTSIZE.SEMI,
      fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
      marginBottom: 6,
      color: COLORS.TITLECOLOR,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    card: {
      width: '32%',
      paddingVertical: 16,
      borderWidth: 1,
      borderColor: COLORS.LABELCOLOR,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 10,
      shadowColor: COLORS.PRIMARYBLACK,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
      backgroundColor: COLORS.PRIMARYWHITE,
      marginTop: 4,
      overflow: 'hidden',
    },
    fullWidthCard: {
      width: '100%',
      borderWidth: 1,
      borderColor: COLORS.LABELCOLOR,
      borderRadius: 8,
      alignItems: 'center',
      backgroundColor: COLORS.PRIMARYWHITE,
      shadowColor: COLORS.PRIMARYBLACK,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
      marginVertical: 4,
      overflow: 'hidden',
    },
    topHalf: {
      paddingVertical: 4,
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      
    },
    divider: {
      height: 1,
      backgroundColor: COLORS.LABELCOLOR,
      width: '100%',
      alignSelf: 'center',
    },
    verticalDivider: {
      width: 1,
      backgroundColor: COLORS.LABELCOLOR,
      height: '100%',
    },
    bottomHalf: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'stretch',
    },
    rsvpColumn: {
      alignItems: 'center',
      flex: 1,
      paddingVertical: 4,
    },
    value: {
      fontSize: FONTS.FONTSIZE.SEMI,
      color: COLORS.TITLECOLOR,
      fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    },
    label: {
      fontSize: FONTS.FONTSIZE.SEMIMINI,
      color: COLORS.PRIMARYBLACK,
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      textAlign: 'center',
      marginTop: 4,
    },
  });

  const {isConnected, networkLoading} = useNetworkStatus();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [eventDashData, setEventDashData] = useState([]);

  const [eventData, setEventData] = useState([]);
  const [filterLoading, setFilterLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEventDataModal, setIsEventDataModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [hasMore, setHasMore] = useState(true);
  const [pageNumber, setPageNumber] = useState(1);

  const PAGE_SIZE = 10;

  useEffect(() => {
    onEventFilter();
  }, []);

  useEffect(() => {
    setPageNumber(1);
    setEventDashData([]);
  }, [selectedEvent]);

  useEffect(() => {
    if (pageNumber || selectedEvent) {
      getEventDashboardData();
    }
  }, [pageNumber, selectedEvent]);

  function onEventFilter() {
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setFilterLoading(true);
        httpClient
          .get(`module/configuration/dropdown?contentType=EVENT`)
          .then(response => {
            const {data} = response;
            const {status, message, result} = data;

            if (status || (status == true && result)) {
              setFilterLoading(false);
              // setSelectedEvent(result[0]);
              // const newEvent = {
              //   id: 0,
              //   name: 'All',
              // };
              // result.unshift(newEvent);
              setEventData(result);
            } else {
              NOTIFY_MESSAGE(message);
              setFilterLoading(false);
            }
          })
          .catch(err => {
            setFilterLoading(false);
            NOTIFY_MESSAGE(err ? 'Something Went Wrong.' : null);
            navigation.goBack();
          });
      } else {
        NOTIFY_MESSAGE('Please check your internet connectivity');
      }
    });
  }

  const getEventDashboardData = () => {
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setLoading(true);
        httpClient
          .get(
            `event/dashboard?pageNumber=${pageNumber}&pageSize=${PAGE_SIZE}&eventId=${
              selectedEvent ? selectedEvent?.id : 0
            }`,
          )
          .then(response => {
            if (response.data.status) {
              const totalRecords = response?.data?.result?.totalRecord || 0;
              const calculatedTotalPages = Math.ceil(totalRecords / PAGE_SIZE);

              const newData =
                response?.data?.result?.data || response?.data?.result;

              if (newData?.length > 0) {
                setEventDashData(newData);
              } else {
                setEventDashData([]);
              }

              const canLoadMore =
                pageNumber < calculatedTotalPages && newData.length > 0;
              setHasMore(canLoadMore);
            } else {
              NOTIFY_MESSAGE(
                response?.data?.message
                  ? response?.data?.message
                  : 'Something Went Wrong',
              );
            }
          })
          .catch(err => {
            setLoading(false);
            NOTIFY_MESSAGE(err || err?.message ? 'Something Went Wrong' : null);
            navigation.navigate('Dashboard');
          })
          .finally(() => setLoading(false));
      } else {
        NOTIFY_MESSAGE('Please check your internet connectivity');
      }
    });
  };

  const navigateToNameList = (title, item, type) => {
    navigation.navigate('NameListScreen', {title, item1: item, type});
  };

  const renderStatisticCard = (label, value, item, type) => {
    return (
      <TouchableOpacity
        disabled={!item1?.write}
        style={styles.card}
        onPress={() => {
          navigateToNameList(label, item, type);
        }}>
        <Text style={styles.value}>{value || 0}</Text>
        <Text style={styles.label}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const loadMore = () => {
    if (hasMore) {
      setPageNumber(prevPage => prevPage + 1);
    }
  };

  const [isReresh, setIsRefresh] = useState(false);
  const handleRefresh = async () => {
    setPageNumber(1);
    setIsRefresh(true);
    await getEventDashboardData();
    setIsRefresh(false);
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.BACKGROUNDCOLOR,
      }}>
      <CustomHeader
        leftIcon={
          <FontAwesome6 name="angle-left" iconStyle='solid' size={26} color={COLORS.LABELCOLOR} />
        }
        title={item?.name}
        leftOnPress={() => navigation.goBack()}
      />
      {networkLoading || loading || filterLoading ? (
        <Loader />
      ) : isConnected ? (
        <View style={{flex: 1}}>
          <TouchableOpacity
            activeOpacity={0.35}
            onPress={() => setIsEventDataModal(true)}
            style={styles.filterContainer}>
            <Text
              numberOfLines={2}
              style={{
                fontSize: FONTS.FONTSIZE.SMALL,
                fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                color: COLORS.PRIMARYWHITE,
                maxWidth: width / 1.2,
              }}>
              {selectedEvent?.name || 'Events'}
            </Text>
            <AntDesign name="down" size={18} color={COLORS.PRIMARYWHITE} />
          </TouchableOpacity>

          {eventDashData.length > 0 ? (
            <FlatList
              refreshControl={
                <RefreshControl
                  onRefresh={handleRefresh}
                  refreshing={isReresh}
                />
              }
              data={eventDashData}
              initialNumToRender={10}
              maxToRenderPerBatch={20}
              windowSize={10}
              removeClippedSubviews={true}
              keyExtractor={(item, index) => item?.eventId?.toString()}
              renderItem={({item}) => {
                return (
                  <View style={styles.container}>
                    <Text style={styles.eventTitle}>
                      {item?.eventName ? item?.eventName : '-'}
                    </Text>

                    {/* for positive responses */}
                    <View style={styles.fullWidthCard}>
                      {/* Top Half: Total RSVP Count */}
                      <TouchableOpacity
                        disabled={!item1?.write}
                        onPress={() => {
                          navigateToNameList(
                            'Total Yes Responses',
                            item,
                            'TotalYesResponseGuest',
                          );
                        }}
                        style={styles.topHalf}>
                        <Text style={styles.value}>
                          {item?.totalYesResponseGuest || 0}
                        </Text>
                        <Text style={styles.label}>Total Yes Responses</Text>
                      </TouchableOpacity>
                      {/* Divider Line */}
                      <View style={styles.divider} />
                      {/* Bottom Half: Adults & Kids RSVP */}
                      <View style={styles.bottomHalf}>
                        <TouchableOpacity
                          disabled={!item1?.write}
                          onPress={() => {
                            navigateToNameList(
                              'Total Adults with Yes Responses',
                              item,
                              'TotalYesNumberOfAdults',
                            );
                          }}
                          style={styles.rsvpColumn}>
                          <Text style={styles.value}>
                            {item?.totalYesNumberOfAdults || 0}
                          </Text>
                          <Text style={styles.label}>Adults</Text>
                        </TouchableOpacity>
                        <View style={styles.verticalDivider} />
                        <TouchableOpacity
                          disabled={!item1?.write}
                          onPress={() => {
                            navigateToNameList(
                              'Total Kids with Yes Responses',
                              item,
                              'TotalYesNumberOfKids',
                            );
                          }}
                          style={styles.rsvpColumn}>
                          <Text style={styles.value}>
                            {item?.totalYesNumberOfKids || 0}
                          </Text>
                          <Text style={styles.label}>Kids</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* for nagative responses */}
                    <View style={styles.fullWidthCard}>
                      {/* Top Half: Total RSVP Count */}
                      <TouchableOpacity
                        disabled={!item1?.write}
                        onPress={() => {
                          navigateToNameList(
                            'Total No Responses',
                            item,
                            'TotalNoResponseGuest',
                          );
                        }}
                        style={styles.topHalf}>
                        <Text style={styles.value}>
                          {item?.totalNoResponseGuest || 0}
                        </Text>
                        <Text style={styles.label}>Total No Responses</Text>
                      </TouchableOpacity>
                      {/* Divider Line */}
                      <View style={styles.divider} />
                      {/* Bottom Half: Adults & Kids RSVP */}
                      <View style={styles.bottomHalf}>
                        <TouchableOpacity
                          disabled={!item1?.write}
                          onPress={() => {
                            navigateToNameList(
                              'Total Adults with No Responses',
                              item,
                              'TotalNoNumberOfAdults',
                            );
                          }}
                          style={styles.rsvpColumn}>
                          <Text style={styles.value}>
                            {item?.totalNoNumberOfAdults || 0}
                          </Text>
                          <Text style={styles.label}>Adults</Text>
                        </TouchableOpacity>
                        <View style={styles.verticalDivider} />
                        <TouchableOpacity
                          disabled={!item1?.write}
                          onPress={() => {
                            navigateToNameList(
                              'Total Kids with No Responses',
                              item,
                              'TotalNoNumberOfKids',
                            );
                          }}
                          style={styles.rsvpColumn}>
                          <Text style={styles.value}>
                            {item?.totalNoNumberOfKids || 0}
                          </Text>
                          <Text style={styles.label}>Kids</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* for Maybe responses */}
                    <View style={styles.fullWidthCard}>
                      {/* Top Half: Total RSVP Count */}
                      <TouchableOpacity
                        disabled={!item1?.write}
                        onPress={() => {
                          navigateToNameList(
                            'Total Maybe Responses',
                            item,
                            'TotalMaybeResponseGuest',
                          );
                        }}
                        style={styles.topHalf}>
                        <Text style={styles.value}>
                          {item?.totalMaybeResponseGuest || 0}
                        </Text>
                        <Text style={styles.label}>Total Maybe Responses</Text>
                      </TouchableOpacity>
                      {/* Divider Line */}
                      <View style={styles.divider} />
                      {/* Bottom Half: Adults & Kids RSVP */}
                      <View style={styles.bottomHalf}>
                        <TouchableOpacity
                          disabled={!item1?.write}
                          onPress={() => {
                            navigateToNameList(
                              'Total Adults with Maybe Responses',
                              item,
                              'TotalMaybeNumberOfAdults',
                            );
                          }}
                          style={styles.rsvpColumn}>
                          <Text style={styles.value}>
                            {item?.totalMaybeNumberOfAdults || 0}
                          </Text>
                          <Text style={styles.label}>Adults</Text>
                        </TouchableOpacity>
                        <View style={styles.verticalDivider} />
                        <TouchableOpacity
                          disabled={!item1?.write}
                          onPress={() => {
                            navigateToNameList(
                              'Total Kids with Maybe Responses',
                              item,
                              'TotalMaybeNumberOfKids',
                            );
                          }}
                          style={styles.rsvpColumn}>
                          <Text style={styles.value}>
                            {item?.totalMaybeNumberOfKids || 0}
                          </Text>
                          <Text style={styles.label}>Kids</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.grid}>
                      {renderStatisticCard(
                        'Total RSVP',
                        item?.totalRsvpGuest,
                        item,
                        'TotalRsvpGuest',
                      )}
                      {renderStatisticCard(
                        'Not Yet RSVP',
                        item?.totalRSVPPendingGuest,
                        item,
                        'TotalRSVPPendingGuest',
                      )}
                      {renderStatisticCard(
                        'Total Attendee',
                        item?.totalCheckInGuest,
                        item,
                        'TotalCheckInGuest',
                      )}
                    </View>
                  </View>
                );
              }}
            />
          ) : (
            <NoDataFound />
          )}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: heightPercentageToDP('1%'),
              paddingHorizontal: widthPercentageToDP('5%'),
              gap: 30,
            }}>
            {pageNumber > 1 && (
              <TouchableOpacity
                onPress={() =>
                  setPageNumber(prevPage => Math.max(prevPage - 1, 1))
                }
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
        </View>
      ) : (
        <Offline />
      )}

      <Modal
        animationType="none"
        transparent={true}
        visible={isEventDataModal}
        onRequestClose={() => setIsEventDataModal(false)}
        style={{flex: 1}}>
        <View style={styles.eventModalContainer}>
          <TouchableWithoutFeedback onPress={() => setIsEventDataModal(false)}>
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>

          <View style={styles.eventModalContent}>
            <FlatList
              removeClippedSubviews={true}
              maxToRenderPerBatch={30}
              updateCellsBatchingPeriod={200}
              windowSize={40}
              initialNumToRender={10}
              data={eventData}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={{flexGrow: 1}}
              renderItem={({item: item1}) => (
                <TouchableOpacity
                  style={{
                    borderBottomWidth: 0.5,
                    borderBottomColor: COLORS.LIGHTGREY,
                    padding: 10,
                  }}
                  onPress={() => {
                    setSelectedEvent(item1);
                    setIsEventDataModal(false);
                  }}>
                  <Text
                    style={{
                      color: COLORS.TABLEROW,
                      fontSize: FONTS.FONTSIZE.EXTRASMALL,
                      fontFamily: FONTS.FONT_FAMILY.REGULAR,
                    }}>
                    {item1?.name}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={{flex: 1, height: 40}}>
                  <NoDataFound />
                </View>
              }
            />
          </View>
        </View>
      </Modal>
      {/* <Modal
        animationType="none"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
        style={{flex: 1}}>
        <View style={styles.modalContainer}>
          <TouchableWithoutFeedback onPress={() => setIsModalVisible(false)}>
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>
          <View style={styles.modalContent}>
            <FlatList
              removeClippedSubviews={true}
              maxToRenderPerBatch={30}
              updateCellsBatchingPeriod={200}
              windowSize={40}
              initialNumToRender={10}
              data={data}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={{flexGrow: 1}}
              renderItem={({item: item1}) => (
                <TouchableOpacity
                  style={{
                    borderBottomWidth: 0.5,
                    borderBottomColor: COLORS.LIGHTGREY,
                    padding: 10,
                  }}
                  onPress={() => {
                    if (item1?.name === 'Event') {
                                            setIsEventDataModal(true);
                      setIsModalVisible(false);
                    } else if (item1?.name === 'All') {
                      setSelectedEvent(null);
                      setIsModalVisible(false);
                    }
                  }}>
                  <Text
                    style={{
                      color: COLORS.TABLEROW,
                      fontSize: FONTS.FONTSIZE.EXTRASMALL,
                      fontFamily: FONTS.FONT_FAMILY.REGULAR,
                    }}>
                    {item1?.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal> */}
    </View>
  );
};

export default EventDashboard;
