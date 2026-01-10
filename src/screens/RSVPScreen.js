import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
  Modal,
  TouchableWithoutFeedback,
  BackHandler,
} from 'react-native';
import {FontAwesome6} from "@react-native-vector-icons/fontawesome6";
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import FONTS from '../theme/Fonts';
import COLORS from '../theme/Color';
import Loader from '../components/root/Loader';
import {NOTIFY_MESSAGE} from '../constant/Module';
import {useNavigation} from '@react-navigation/native';
import Offline from '../components/root/Offline';
import NoDataFound from '../components/root/NoDataFound';
import {useNetworkStatus} from '../connection/UseNetworkStatus';
import CustomHeader from '../components/root/CustomHeader';
import NetInfo from '@react-native-community/netinfo';
import {AntDesign} from "@react-native-vector-icons/ant-design";
import httpClient from '../connection/httpClient';

export default function RsvpList({}) {
  const {width, height} = useWindowDimensions();

  const styles = StyleSheet.create({
    paginationText: {
      fontSize: FONTS.FONTSIZE.SMALL,
      color: 'blue',
      textAlign: 'center',
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
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
      marginBottom: 8,
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
    pkgLbl: {
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      fontSize: FONTS.FONTSIZE.EXTRASMALL,
      color: COLORS.PRIMARYBLACK,
      textAlign: 'left',
    },
    titleText: {
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      fontSize: FONTS.FONTSIZE.EXTRASMALL,
      color: COLORS.PRIMARYBLACK,
      width: '50%',
    },
    text: {
      fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
      fontSize: FONTS.FONTSIZE.EXTRASMALL,
      color: COLORS.PRIMARYBLACK,
      width: '50%',
      textAlign: 'left',
    },
    textView: {
      flexDirection: 'row',
    },
  });
  const navigation = useNavigation();

  const [isLoading, setIsLoading] = useState(true);
  const [rsvpList, setRsvpList] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const {isConnected, networkLoading} = useNetworkStatus();

  const [isEventDataModal, setIsEventDataModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [eventData, setEventData] = useState([]);
  const [filterLoading, setFilterLoading] = useState(false);

  useEffect(() => {
    onEventFilter();
  }, []);

  useEffect(() => {
    setPageNumber(1);
    setRsvpList([]);
  }, [selectedEvent]);

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

  useEffect(() => {
    const fetchData = async () => {
      if (pageNumber) {
        await getRsvpList();
      }
    };
    fetchData();
  }, [pageNumber, selectedEvent]);

  const PAGE_SIZE = 20;

  const getRsvpList = () => {
    let data = {
      pageNumber: pageNumber,
      pageSize: PAGE_SIZE,
      keyword: 'rsvp',
      orderBy: 'order',
      orderType: -1,
      type: 'RSVP',
      eventId: selectedEvent ? selectedEvent?.id : 0,
    };
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setIsLoading(true);
        httpClient
          .post(`module/mobile/configuration/pagination`, data)
          .then(response => {
            if (response.data.status) {
              const totalRecords = response?.data?.result?.totalRecord || 0;
              const calculatedTotalPages = Math.ceil(totalRecords / PAGE_SIZE);
              const newData = response?.data?.result?.data;
              if (newData?.length > 0) {
                setRsvpList(newData);
              } else {
                setRsvpList([]);
              }
              const canLoadMore =
                pageNumber < calculatedTotalPages && newData.length > 0;
              setHasMore(canLoadMore);
            } else {
              NOTIFY_MESSAGE(
                response?.data?.message
                  ? response?.data?.message
                  : 'Something Went Wrong.',
              );
            }
          })
          .catch(error => {
            setIsLoading(false);
            NOTIFY_MESSAGE(
              error || error.message ? 'Something Went Wrong.' : null,
            );
          })
          .finally(() => setIsLoading(false));
      } else {
        NOTIFY_MESSAGE('Please check your internet connectivity');
      }
    });
  };

  const loadMore = () => {
    if (hasMore) {
      setPageNumber(prevPage => prevPage + 1);
    }
  };
  const [openIndex, setOpenIndex] = useState(null);

  const renderrsvpList = ({item, index}) => {
    const number1 = (pageNumber - 1) * PAGE_SIZE + index + 1;
    const number = number1 <= 9 ? `0${number1}` : `${number1}`;

    const keys = Array.isArray(rsvpList[0]?.keys)
      ? rsvpList[0].keys
      : JSON.parse(rsvpList[0]?.keys || '[]');

    const parsedContent = JSON.parse(item?.content);

    const eventEntry = parsedContent?.event?.value;
    const res = parsedContent?.selectyourResponse?.value;
    const member = parsedContent?.member?.value;
    const handleToggle = index => {
      setOpenIndex(openIndex === index ? null : index);
    };

    return (
      <View
        style={{
          backgroundColor: COLORS.PRIMARYWHITE,
          flex: 1,
          overflow: 'hidden',
          borderRadius: 10,
          padding: 6,
          margin: 6,
        }}
        key={index}>
        <TouchableOpacity
          onPress={() => {
            handleToggle(index);
          }}
          style={{
            flexDirection: 'row',
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
                maxWidth: '30%',
                padding: 6,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 10,
              }}>
              <Text style={[styles.pkgLbl, {color: COLORS.PRIMARYWHITE}]}>
                {number}
              </Text>
            </View>
            <View style={{}}>
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                  fontSize: FONTS.FONTSIZE.EXTRASMALL,
                  color: COLORS.PLACEHOLDERCOLOR,
                  width:
                    res?.toLowerCase() == 'may be' ? width / 1.6 : width / 1.45,
                }}>
                {member ? member : '-'}
              </Text>
              {eventEntry && (
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                    fontSize: FONTS.FONTSIZE.SMALL,
                    color: COLORS.PLACEHOLDERCOLOR,
                    width:
                    res?.toLowerCase() == 'may be' ? width / 1.6 : width / 1.45,
                  }}>
                  {eventEntry ? eventEntry : null}
                </Text>
              )}
            </View>
          </View>

          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                fontSize: FONTS.FONTSIZE.EXTRASMALL,
                color:
                  res?.toLowerCase() == 'yes'
                    ? COLORS.PRIMARYGREEN
                    : res?.toLowerCase() == 'no'
                    ? COLORS.PRIMARYRED
                    : COLORS.PRIMARYORANGE,
                textAlign: 'right',
                marginRight: 4,
              }}>
              {res ? res : null}
            </Text>
            {openIndex === index ? (
              <AntDesign name="up" size={20} color={COLORS.LABELCOLOR} />
            ) : (
              <AntDesign name="down" size={20} color={COLORS.LABELCOLOR} />
            )}
          </View>
        </TouchableOpacity>
        {openIndex === index && (
          <View
            key={index.toString()}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 4,
            }}>
            <View style={{gap: 4}}>
              {keys?.map(key => {
                const data = parsedContent[key];
                return (
                  data && (
                    <View style={styles.textView} key={key}>
                      <Text style={styles.titleText}>
                        {data.label === 'Select your Response'
                          ? 'Response :'
                          : data.label === 'Add a comments'
                          ? 'Comments :'
                          : `${data.label} :`}
                      </Text>
                      <Text style={styles.text}>
                        {data.value
                          ? (() => {
                              const parts = data.value
                                ?.split(',')
                                ?.map(p => p.trim());
                              return (
                                <>
                                  {parts[0]}
                                  {parts?.slice(1)?.map((part, idx) => (
                                    <Text key={idx} style={styles.text}>
                                      {',\n' + part}
                                    </Text>
                                  ))}
                                </>
                              );
                            })()
                          : '-'}
                      </Text>
                    </View>
                  )
                );
              })}
            </View>
          </View>
        )}
      </View>
    );
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        navigation.navigate('Dashboard');
      },
    );

    return () => backHandler.remove();
  }, [navigation]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.BACKGROUNDCOLOR,
      }}>
      <CustomHeader
        leftOnPress={() => {
          navigation.navigate('Dashboard');
        }}
        leftIcon={
          <FontAwesome6 name="angle-left" iconStyle='solid' size={26} color={COLORS.LABELCOLOR} />
        }
        title={'RSVP'}
      />

      {networkLoading || isLoading || filterLoading ? (
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
                maxWidth: width / 1.25,
              }}>
              {selectedEvent?.name || 'Events'}
            </Text>
            <AntDesign name="down" size={18} color={COLORS.PRIMARYWHITE} />
          </TouchableOpacity>

          {rsvpList.length > 0 ? (
            <View style={{flex: 1}}>
              <FlatList
                showsVerticalScrollIndicator={true}
                contentContainerStyle={{paddingBottom: 10}}
                data={rsvpList}
                keyExtractor={(item, index) => index?.toString()}
                renderItem={renderrsvpList}
                removeClippedSubviews={true}
                maxToRenderPerBatch={30}
                updateCellsBatchingPeriod={200}
                windowSize={40}
                initialNumToRender={10}
              />
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
    </View>
  );
}
