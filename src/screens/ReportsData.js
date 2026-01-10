import {
  View,
  Text,
  useWindowDimensions,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import React, {useCallback, useEffect, useState} from 'react';
import {useNetworkStatus} from '../connection/UseNetworkStatus';
import COLORS from '../theme/Color';
import {useNavigation} from '@react-navigation/native';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import Offline from '../components/root/Offline';
import CustomHeader from '../components/root/CustomHeader';
import Loader from '../components/root/Loader';
import FONTS from '../theme/Fonts';
import {formatPhoneToUS, isPhoneField, NOTIFY_MESSAGE} from '../constant/Module';
import NetInfo from '@react-native-community/netinfo';
import httpClient from '../connection/httpClient';
import NoDataFound from '../components/root/NoDataFound';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import {AntDesign} from '@react-native-vector-icons/ant-design';
import {IMAGE_URL} from '../connection/Config';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

const ReportsData = ({route}) => {
  const {width, height} = useWindowDimensions();

  const allowedEventFilter = [
    'RSVPs Completed',
    'Event Attendees',
    'RSVPed but Did Not Attend',
    'Attended Event Without RSVP',
    'Event Expenses',
    'RSVP Yes Responses',
    'RSVP No Responses',
    'RSVP May be Responses',
  ];

  const styles = StyleSheet.create({
    listContainer: {
      marginHorizontal: 10,
      borderRadius: 10,
      flexGrow: 1,
    },
    pkgLbl: {
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      fontSize: FONTS.FONTSIZE.SMALL,
      color: COLORS.PRIMARYBLACK,
    },
    titleText: {
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      fontSize: FONTS.FONTSIZE.EXTRASMALL,
      color: COLORS.PRIMARYBLACK,
      width: '48%',
      marginRight: 4,
    },
    text: {
      fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
      fontSize: FONTS.FONTSIZE.EXTRASMALL,
      color: COLORS.PRIMARYBLACK,
      width: '50%',
      textAlign: 'left',
    },
    paginationText: {
      fontSize: FONTS.FONTSIZE.SMALL,
      color: 'blue',
      textAlign: 'center',
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    },
    tableContainer: {
      borderRadius: 10,
      overflow: 'hidden',
      marginHorizontal: 10,
      marginVertical: 10,
      borderRadius: 5,
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
      borderRadius: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
  });

  const {isConnected, networkLoading} = useNetworkStatus();
  const navigation = useNavigation();
  const {item1, selectedEventFromList} = route?.params;

  const [isLoading, setIsLoading] = useState(true);

  const [reportsData, setReportsData] = useState([]);

  const [eventData, setEventData] = useState([]);

  const [filterLoading, setFilterLoading] = useState(false);
  const [isEventDataModal, setIsEventDataModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [downloadLoading, setDownloadLoading] = useState(false);

  const [pageNumber, setPageNumber] = useState(1);

  const [total, setTotal] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = () => {
    setOpenIndex(null);
    if (hasMore) {
      setPageNumber(prevPage => prevPage + 1);
    }
  };

  const PAGE_SIZE = 20;

  useEffect(() => {
    onEventFilter();
  }, [selectedEventFromList]);

  useEffect(() => {
    setPageNumber(1);
    setReportsData([]);
  }, [selectedEvent]);

  function onEventFilter() {
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setFilterLoading(true);
        httpClient
          .get(
            `module/configuration/dropdown?contentType=EVENT&moduleName=Reports`,
          )
          .then(response => {
            const {data} = response;
            const {status, message, result} = data;

            if (status || (status == true && result)) {
              const filterEvent = result?.find(
                item => item?.name === selectedEventFromList?.name,
              );

              setSelectedEvent(filterEvent);
              setEventData(result);
              setFilterLoading(false);
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
    if (pageNumber && selectedEvent) {
      getViewData();
    }
  }, [item1, selectedEvent, pageNumber]);

  const getFileLink = () => {
    let data = {
      reportType: item1?.label,
      keyword: '',
      eventId: selectedEvent ? selectedEvent?.id : 0,
      isDownload: true,
      pageNumber: 0,
      pageSize: 0,
    };

    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setDownloadLoading(true);
        httpClient
          .post(`Report/Get`, data)
          .then(async response => {
            if (response.data.status) {
              const filePath = response.data.result;
              navigation.navigate('FileViewer', {
                fileUrl: `${IMAGE_URL}${filePath}`,
              });
            } else {
              NOTIFY_MESSAGE(response?.data?.message);
            }
          })
          .catch(error => {
            setDownloadLoading(false);
            NOTIFY_MESSAGE(
              error || error.message ? 'Something Went Wrong' : null,
            );
            navigation.goBack();
          })
          .finally(() => {
            setDownloadLoading(false);
          });
      } else {
        NOTIFY_MESSAGE('Please check your internet connectivity');
      }
    });
  };

  const getViewData = useCallback(() => {
    let data = {
      reportType: item1?.label,
      keyword: '',
      eventId: selectedEvent ? selectedEvent?.id : 0,
      isDownload: false,
      pageNumber: pageNumber,
      pageSize: PAGE_SIZE,
    };

    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setIsLoading(true);
        httpClient
          .post(`Report/Get`, data)
          .then(response => {
            if (response.data.status) {
              const totalRecords = response?.data?.totalRecords || 0;

              const calculatedTotalPages = Math.ceil(totalRecords / PAGE_SIZE);

              setTotal(response?.data?.total ?? response?.data?.totalRecords);
              const newData = response?.data?.result;
              if (newData?.length > 0) {
                setReportsData(newData);
              } else {
                setReportsData([]);
              }
              const canLoadMore =
                pageNumber < calculatedTotalPages && newData.length > 0;
              setHasMore(canLoadMore);
            } else {
              NOTIFY_MESSAGE(response?.data?.message);
            }
          })
          .catch(error => {
            setIsLoading(false);
            NOTIFY_MESSAGE(
              error || error.message ? 'Something Went Wrong' : null,
            );
            navigation.goBack();
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        NOTIFY_MESSAGE('Please check your internet connectivity');
      }
    });
  }, [item1, navigation, selectedEvent, pageNumber, PAGE_SIZE]);

  const [openIndex, setOpenIndex] = useState(null);

  const renderItem = ({item, index}) => {
    const number1 = (pageNumber - 1) * PAGE_SIZE + index + 1;
    const number = number1 <= 9 ? `0${number1}` : `${number1}`;

    const member =
      item1?.label == 'Donation'
        ? item[`donar's Name`]
        : item1?.label == 'Event Expenses'
        ? item['event']
        : item['Member'] || item['member'] || '-';


    const total = item['Total'];

    const keys = Object.keys(item);

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
          marginVertical: 8,
        }}
        key={index}>
        <TouchableOpacity
          onPress={() => {
            handleToggle(index);
          }}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
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
                numberOfLines={2}
                style={{
                  fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                  fontSize: FONTS.FONTSIZE.EXTRASMALL,
                  color: COLORS.PLACEHOLDERCOLOR,
                }}>
                {member ? member : '-'} {total ? ` (${total})` : ''}
              </Text>
            </View>
          </View>
          {openIndex === index ? (
            <AntDesign name="up" size={20} color={COLORS.LABELCOLOR} />
          ) : (
            <AntDesign name="down" size={20} color={COLORS.LABELCOLOR} />
          )}
        </TouchableOpacity>
        {openIndex === index && (
          <View
            key={index.toString()}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 4,
            }}>
            <View style={{gap: 4}}>
              {keys.map(key => {
                if (
                  (item1?.label == 'Donation' && key == `donar's Name`) ||
                  (item1?.label == 'Event Expenses' && key == 'event') ||
                  key?.toLocaleLowerCase() === 'member' ||
                  key?.toLocaleLowerCase() == 'total'
                ) {
                  return null;
                }

                let value = item[key];
                let isArray = Array.isArray(value);

                let finalKey = key == 'FamilyMembers' ? 'Members' : key;

                const isPhone = isPhoneField(key);

                return (
                  <View
                    style={{
                      flexDirection: isArray ? null : 'row',
                    }}
                    key={key}>
                    <Text
                      style={[
                        styles.titleText,
                        {textTransform: 'capitalize'},
                      ]}>{`${finalKey} :`}</Text>
                    {isArray ? (
                      <View>
                        {value.length === 0 ? (
                          <Text style={styles.text}>-</Text>
                        ) : (
                          value.map((arrItem, arrIdx) => (
                            <View
                              key={arrIdx}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'flex-start',
                                marginBottom: 2,
                              }}>
                              {/* Index */}
                              <Text
                                style={{
                                  fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
                                  fontSize: FONTS.FONTSIZE.EXTRASMALL,
                                  color: COLORS.PRIMARYBLACK,
                                  marginRight: 4,
                                }}>
                                {arrIdx + 1}.
                              </Text>
                              {/* Key-value pairs in the same row */}
                              {typeof arrItem === 'object' &&
                              arrItem !== null ? (
                                <View style={{}}>
                                  {Object.entries(arrItem).map(([k, v], i) => {
                                    const isPhone = isPhoneField(k);

                                    // ✅ Format phone number if it's a phone field
                                    const displayValue =
                                      isPhone && v
                                        ? formatPhoneToUS(v)
                                        : v
                                        ? v
                                        : '-';

                                    return (
                                      <View
                                        key={i}
                                        style={{
                                          flexDirection: 'row',
                                          marginBottom: 2,
                                          alignItems: 'flex-start',
                                        }}>
                                        <Text
                                          style={{
                                            fontFamily:
                                              FONTS.FONT_FAMILY.REGULAR,
                                            fontSize: FONTS.FONTSIZE.EXTRASMALL,
                                            color: COLORS.PRIMARYBLACK,
                                            marginRight: 2,
                                            width: '45%',
                                          }}>
                                          {k} :
                                        </Text>
                                        <Text
                                          style={{
                                            fontFamily:
                                              FONTS.FONT_FAMILY.SEMI_BOLD,
                                            fontSize: FONTS.FONTSIZE.EXTRASMALL,
                                            color: COLORS.PLACEHOLDERCOLOR,
                                            marginLeft: 4,
                                            width: '50%',
                                          }}>
                                          {displayValue}
                                        </Text>
                                      </View>
                                    );
                                  })}
                                </View>
                              ) : (
                                <Text style={styles.text}>{arrItem}</Text>
                              )}
                            </View>
                          ))
                        )}
                      </View>
                    ) : (
                      <Text style={styles.text}>
                        {value !== null && value !== undefined && value !== ''
                          ? isPhone && value
                            ? formatPhoneToUS(value.toString()) // ✅ Format phone for non-array values
                            : value.toString()
                          : '-'}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.BACKGROUNDCOLOR,
      }}>
      <CustomHeader
        leftIcon={
          <FontAwesome6
            name="angle-left"
            iconStyle="solid"
            size={26}
            color={COLORS.LABELCOLOR}
          />
        }
        title={item1?.label}
        leftOnPress={() => navigation.goBack()}
        rightIcon={
          reportsData.length > 0 && (
            <MaterialDesignIcons
              name="microsoft-excel"
              size={34}
              color={COLORS.PRIMARYGREEN}
            />
          )
        }
        rightOnPress={() => {
          if (downloadLoading) return;
          getFileLink();
        }}
      />
      {networkLoading || isLoading || filterLoading ? (
        <Loader />
      ) : isConnected ? (
        <View style={{flex: 1}}>
          <View
            style={{
              marginHorizontal: 8,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-end',
              marginBottom: 10,
            }}>
            {allowedEventFilter.includes(item1?.label) && (
              <TouchableOpacity
                activeOpacity={0.35}
                onPress={() => setIsEventDataModal(true)}
                style={styles.filterContainer}>
                <Text
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
            )}
          </View>
          {reportsData.length > 0 && (
            <Text
              style={{
                marginHorizontal: 10,
                color: COLORS.TITLECOLOR,
                fontSize: FONTS.FONTSIZE.EXTRASMALL,
                fontFamily: FONTS.FONT_FAMILY.MEDIUM,
              }}>
              {item1?.label?.toLowerCase().includes('total')
                ? item1?.label
                : `Total ${item1?.label}`}{' '}
              : {total || 0}
            </Text>
          )}

          {reportsData?.length > 0 ? (
            <FlatList
              data={reportsData}
              initialNumToRender={10}
              maxToRenderPerBatch={20}
              windowSize={10}
              removeClippedSubviews={true}
              keyExtractor={(item, index) => index?.toString()}
              renderItem={renderItem}
              contentContainerStyle={styles.listContainer}
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
                onPress={() => {
                  setOpenIndex(null);
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

          <Modal
            animationType="none"
            transparent={true}
            visible={isEventDataModal}
            onRequestClose={() => setIsEventDataModal(false)}
            style={{flex: 1}}>
            <View style={styles.eventModalContainer}>
              <TouchableWithoutFeedback
                onPress={() => setIsEventDataModal(false)}>
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
      ) : (
        <Offline />
      )}
    </View>
  );
};

export default ReportsData;
