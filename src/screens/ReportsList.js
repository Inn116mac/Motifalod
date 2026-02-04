import {
  View,
  Text,
  useWindowDimensions,
  FlatList,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {useNetworkStatus} from '../connection/UseNetworkStatus';
import COLORS from '../theme/Color';
import {useNavigation} from '@react-navigation/native';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import Offline from '../components/root/Offline';
import CustomHeader from '../components/root/CustomHeader';
import Loader from '../components/root/Loader';
import FONTS from '../theme/Fonts';
import NetInfo from '@react-native-community/netinfo';
import httpClient from '../connection/httpClient';
import {NOTIFY_MESSAGE} from '../constant/Module';
import NoDataFound from '../components/root/NoDataFound';
import {AntDesign} from '@react-native-vector-icons/ant-design';

const ReportsList = ({route}) => {
  const {isConnected, networkLoading} = useNetworkStatus();
  const navigation = useNavigation();
  const {item} = route?.params?.data;
  const {width, height} = useWindowDimensions();

  const styles = StyleSheet.create({
    eventModalContainer: {
      flex: 1,
      alignItems: 'center',
      overflow: 'hidden',
      justifyContent: 'center',
    },
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
  });

  const [loading, setLoading] = useState(true);
  const [reportsList, setReportsList] = useState([]);
  const [eventData, setEventData] = useState([]);
  const [isEventDataModal, setIsEventDataModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    if (selectedEvent) {
      getReportsList();
    } else {
      setReportsList([]);
    }
  }, [selectedEvent]);

  useEffect(() => {
    onEventFilter();
  }, []);

  function onEventFilter() {
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        httpClient
          .get(
            `module/configuration/dropdown?contentType=EVENT&moduleName=Reports`,
          )
          .then(response => {
            const {data} = response;
            const {status, message, result} = data;

            if (status) {
              if (result?.length > 0) {
                setSelectedEvent(result[0]);
                setEventData(result);
              } else {
                setSelectedEvent(null);
                setEventData([]);
                setLoading(false);
              }
            } else {
              NOTIFY_MESSAGE(message);
              setLoading(false);
            }
          })
          .catch(err => {
            NOTIFY_MESSAGE(err ? 'Something Went Wrong.' : null);
            navigation.goBack();
          });
      } else {
        NOTIFY_MESSAGE('Please check your internet connectivity');
      }
    });
  }

  function formatLabel(label) {
    let formatted = label?.charAt(0)?.toUpperCase() + label?.slice(1);
    formatted = formatted?.replace(/rsvp/gi, 'RSVP');
    return formatted;
  }

  const getReportsList = () => {
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setLoading(true);
        httpClient
          .post(
            `Report/dashboard/count?eventId=${
              selectedEvent ? selectedEvent?.id : 0
            }`,
          )
          .then(async response => {
            if (response.data.status) {
              if (response?.data?.result?.length > 0) {
                const reportObj = response.data.result[0];
                const reportItems = Object.entries(reportObj).map(
                  ([label, value]) => ({
                    label: formatLabel(label),
                    value,
                  }),
                );
                setReportsList(reportItems);
              } else {
                setReportsList([]);
              }
            } else {
              NOTIFY_MESSAGE(response?.data?.message);
              setLoading(false);
            }
          })
          .catch(error => {
            setLoading(false);
            NOTIFY_MESSAGE(
              error || error.message ? 'Something Went Wrong' : null,
            );
            navigation.goBack();
          })
          .finally(() => {
            setLoading(false);
            setRefreshing(false);
          });
      } else {
        NOTIFY_MESSAGE('Please check your internet connectivity');
      }
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    getReportsList();
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
        title={item?.name}
        leftOnPress={() => navigation.goBack()}
      />
      {networkLoading || loading ? (
        <Loader />
      ) : isConnected ? (
        <View style={{flex: 1}}>
          <View
            style={{
              marginHorizontal: 8,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}>
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
          </View>
          <FlatList
            contentContainerStyle={{margin: 10, paddingBottom: 15, flexGrow: 1}}
            data={reportsList}
            keyExtractor={(item, index) => String(index)}
            renderItem={({item: item1, index}) => {
              return (
                <TouchableOpacity
                  onPress={() => {
                    navigation.navigate('ReportsData', {
                      item1: item1,
                      selectedEventFromList: selectedEvent,
                    });
                  }}
                  key={index}
                  style={{
                    marginVertical: 8,
                    backgroundColor: COLORS.PRIMARYWHITE,
                    padding: 8,
                    borderRadius: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                  <Text
                    ellipsizeMode="tail"
                    numberOfLines={2}
                    style={{
                      color: COLORS.PRIMARYBLACK,
                      fontSize: FONTS.FONTSIZE.EXTRASMALL,
                      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                      marginRight: 10,
                      flex: 1,
                    }}>
                    {item1?.label}
                  </Text>
                  <Text
                    ellipsizeMode="tail"
                    numberOfLines={2}
                    style={{
                      color: COLORS.LABELCOLOR,
                      fontSize: FONTS.FONTSIZE.MEDIUM,
                      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                      textAlign: 'right',
                    }}>
                    {item1?.value}
                  </Text>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={!loading ? () => <NoDataFound /> : null}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
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

export default ReportsList;
