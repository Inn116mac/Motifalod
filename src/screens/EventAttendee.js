import React, {useCallback, useEffect, useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  useWindowDimensions,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  RefreshControl,
} from 'react-native';
import COLORS from '../theme/Color';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import Loader from '../components/root/Loader';
import {NOTIFY_MESSAGE} from '../constant/Module';
import FONTS from '../theme/Fonts';
import NetInfo from '@react-native-community/netinfo';
import Offline from '../components/root/Offline';
import CustomHeader from '../components/root/CustomHeader';
import {AntDesign} from '@react-native-vector-icons/ant-design';
import NoDataFound from '../components/root/NoDataFound';
import {useNetworkStatus} from '../connection/UseNetworkStatus';
import httpClient from '../connection/httpClient';
import {useNavigation} from '@react-navigation/native';
import httpClientV2 from '../connection/httpClientV2';

const EventAttendee = ({route}) => {
  const {width, height} = useWindowDimensions();
  const {item} = route.params.data;

  const styles = StyleSheet.create({
    paginationText: {
      fontSize: FONTS.FONTSIZE.SMALL,
      color: 'blue',
      textAlign: 'center',
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    },
    listContainer: {
      padding: 10,
      flexGrow: 1,
    },
    memberText: {
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      fontSize: FONTS.FONTSIZE.SMALL,
      color: COLORS.PLACEHOLDERCOLOR,
      width: widthPercentageToDP('35%'),
    },
    membervalue: {
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
      fontSize: FONTS.FONTSIZE.SMALL,
      color: COLORS.PLACEHOLDERCOLOR,
      width: widthPercentageToDP('50%'),
      textAlign: 'left',
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
  });

  const navigation = useNavigation();

  const [isLoading, setIsLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [checkinData, setCheckinData] = useState([]);

  const [eventData, setEventData] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;

  const [isEventDataModal, setIsEventDataModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isRefresh, setIsRefresh] = useState(false);
  const [openIndices, setOpenIndices] = useState(null);

  const fetchCheckinData = useCallback(async () => {
    const state = await NetInfo.fetch();
    if (state.isConnected) {
      setIsLoading(true);
      try {
        const response = await httpClientV2.get(
          `member/getcheckin?memberid=${0}&eventid=${
            selectedEvent ? selectedEvent?.id : 0
          }&pageNumber=${pageNumber}&pageSize=${PAGE_SIZE}`,
        );

        const {data} = response;
        const {status, message, result} = data;

        if (status || (status === true && result)) {
          const totalRecords = result?.totalRecord || 0;
          const calculatedTotalPages = Math.ceil(totalRecords / PAGE_SIZE);
          const apiData = result?.data || [];

          setCheckinData(apiData);

          const canLoadMore =
            pageNumber < calculatedTotalPages && apiData.length > 0;
          setHasMore(canLoadMore);
        } else {
          setCheckinData([]);
          NOTIFY_MESSAGE(message || 'No data found');
        }
      } catch (err) {
        NOTIFY_MESSAGE('Something Went Wrong.');
      } finally {
        setIsLoading(false);
      }
    }
  }, [pageNumber, selectedEvent]);

  const handleRefresh = useCallback(async () => {
    setIsRefresh(true);
    setOpenIndices(null);

    if (pageNumber === 1) {
      await fetchCheckinData();
    } else {
      setPageNumber(1);
    }

    setIsRefresh(false);
  }, [pageNumber, fetchCheckinData]);

  useEffect(() => {
    onEventFilter();
  }, []);

  useEffect(() => {
    fetchCheckinData();
  }, [pageNumber, selectedEvent]);

  useEffect(() => {
    setOpenIndices(null);
    if (pageNumber !== 1) {
      setPageNumber(1);
    }
  }, [selectedEvent]);

  const loadMore = async () => {
    if (hasMore) {
      setPageNumber(prev => prev + 1);
    }
  };

  function onEventFilter() {
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setFilterLoading(true);
        httpClient
          .get(
            `module/configuration/dropdown?contentType=EVENT&moduleName=${item?.constantName}`,
          )
          .then(response => {
            const {data} = response;
            const {status, message, result} = data;
            if (status || (status == true && result)) {
              setFilterLoading(false);
              const newEvent = {
                id: 0,
                name: 'All',
              };
              result.unshift(newEvent);
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

  const renderList = ({item, index}) => {
    const handleToggleMember = index => {
      setOpenIndices(openIndices === index ? null : index);
    };

    const number1 = (pageNumber - 1) * PAGE_SIZE + index + 1;
    const number = number1 <= 9 ? `0${number1}` : `${number1}`;

    const isMemberOpen = openIndices == index;

    return (
      <TouchableOpacity
        style={{
          backgroundColor: COLORS.PRIMARYWHITE,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 10,
          marginBottom: 10,
        }}
        onPress={() => {
          handleToggleMember(index);
        }}>
        <View
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
                maxWidth: '20%',
                padding: 6,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 10,
              }}>
              <Text
                style={[
                  {
                    color: COLORS.PRIMARYWHITE,
                    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                    fontSize: FONTS.FONTSIZE.SEMIMINI,
                    textAlign: 'center',
                  },
                ]}>
                {number}
              </Text>
            </View>
            <View>
              <Text
                numberOfLines={1}
                style={[
                  {
                    color: COLORS.PRIMARYBLACK,
                    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                    fontSize: FONTS.FONTSIZE.SMALL,
                  },
                ]}>
                {item?.firstname} {item?.lastname}
              </Text>
              <Text
                numberOfLines={1}
                style={[
                  {
                    color: COLORS.TABLELABELTEXTCOLOR,
                    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                    fontSize: FONTS.FONTSIZE.SEMIMINI,
                  },
                ]}>
                {item?.eventName}
              </Text>
            </View>
          </View>
          <View>
            {isMemberOpen ? (
              <AntDesign name="up" size={16} color={COLORS.LABELCOLOR} />
            ) : (
              <AntDesign name="down" size={16} color={COLORS.LABELCOLOR} />
            )}
          </View>
        </View>

        {isMemberOpen && (
          <View key={index}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: 10,
              }}>
              <Text style={styles.memberText}>Name : </Text>
              <Text style={styles.membervalue}>
                {item?.firstname} {item?.lastname}
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}>
              <Text style={styles.memberText}>Check In : </Text>
              <Text style={styles.membervalue}>{item?.checkIn || '-'}</Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}>
              <Text style={styles.memberText}>Event : </Text>
              <Text style={styles.membervalue}>{item?.eventName || '-'}</Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}>
              <Text style={styles.memberText}>Member Name : </Text>
              <Text style={styles.membervalue}>{item?.memberName || '-'}</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const {isConnected, networkLoading} = useNetworkStatus();

  return (
    <View style={{flex: 1, backgroundColor: COLORS.BACKGROUNDCOLOR}}>
      <View
        style={{
          flex: 1,
        }}>
        <CustomHeader
          leftOnPress={() => {
            navigation.goBack();
          }}
          leftIcon={
            <FontAwesome6
              name="angle-left"
              size={26}
              color={COLORS.LABELCOLOR}
              iconStyle="solid"
            />
          }
          title={item?.name}
        />

        <View style={{flex: 1}}>
          {networkLoading || isLoading || filterLoading ? (
            <Loader />
          ) : isConnected ? (
            <>
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

              {checkinData.length > 0 ? (
                <View style={{flex: 1}}>
                  <FlatList
                    refreshControl={
                      <RefreshControl
                        onRefresh={handleRefresh}
                        refreshing={isRefresh}
                      />
                    }
                    contentContainerStyle={styles.listContainer}
                    data={checkinData}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={renderList}
                    removeClippedSubviews={true}
                    maxToRenderPerBatch={30}
                    updateCellsBatchingPeriod={200}
                    windowSize={40}
                    initialNumToRender={10}
                  />
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
                        onPress={() => {
                          setPageNumber(prevPage => Math.max(prevPage - 1, 1));
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
                </View>
              ) : (
                <NoDataFound />
              )}
            </>
          ) : (
            <Offline />
          )}
        </View>
      </View>

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

          {eventData.length > 0 ? (
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
              />
            </View>
          ) : (
            <View style={[styles.eventModalContent, {flex: 0.05}]}>
              <NoDataFound />
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

export default EventAttendee;
