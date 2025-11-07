import React, {useEffect, useState} from 'react';
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

const EventAttendee = ({route}) => {
  const {width, height} = useWindowDimensions();
  const {item} = route.params.data;

  const styles = StyleSheet.create({
    listContainer: {
      padding: 10,
      flexGrow: 1,
    },
    memberText: {
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      fontSize: FONTS.FONTSIZE.EXTRASMALL,
      color: COLORS.PLACEHOLDERCOLOR,
      width: widthPercentageToDP('35%'),
    },
    membervalue: {
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
      fontSize: FONTS.FONTSIZE.EXTRASMALL,
      color: COLORS.PLACEHOLDERCOLOR,
      width: widthPercentageToDP('50%'),
      textAlign: 'left',
    },
    itemContainer: {
      borderRadius: 10,
      overflow: 'hidden',
      backgroundColor: COLORS.TITLECOLOR,
      marginVertical: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    innerContainer: {
      gap: 10,
      paddingBottom: 10,
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
  });

  const navigation = useNavigation();

  const [isLoading, setIsLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [checkinData, setCheckinData] = useState([]);
  const [eventData, setEventData] = useState([]);
  const [isEventDataModal, setIsEventDataModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isReresh, setIsRefresh] = useState(false);

  const handleRefresh = async () => {
    setIsRefresh(true);
    await onGetCheckInApiCall();
    setIsRefresh(false);
  };

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

  useEffect(() => {
    onGetCheckInApiCall();
    onEventFilter();
  }, [selectedEvent]);

  function onGetCheckInApiCall() {
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setIsLoading(true);
        httpClient
          .get(
            `member/getcheckin?memberid=${0}&eventid=${
              selectedEvent ? selectedEvent?.id : 0
            }`,
          )
          .then(response => {
            const {data} = response;
            const {status, message, result} = data;
            if (status || (status == true && result)) {
              const groupedData = result.reduce((acc, item) => {
                const eventName = item.eventName;
                if (!acc[eventName]) {
                  acc[eventName] = [];
                }
                acc[eventName].push(item);
                return acc;
              }, {});

              const formattedData = Object.keys(groupedData).map(eventName => ({
                eventName,
                members: groupedData[eventName],
              }));
              setCheckinData(formattedData);
            } else {
              setCheckinData([]);
              NOTIFY_MESSAGE(message);
            }
          })
          .catch(err => {
            setIsLoading(false);
            NOTIFY_MESSAGE(err ? 'Something Went Wrong.' : null);
            navigation.goBack();
          })
          .finally(() => setIsLoading(false));
      }
    });
  }

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

  const [openIndices, setOpenIndices] = useState({});

  const renderList = ({item, index}) => {
    const isSelected = openIndices[index];

    const handleToggle = index => {
      setOpenIndices(prev => ({
        ...prev,
        [index]: !prev[index],
      }));
    };

    const handleToggleMember = memberIndex => {
      setOpenIndices(prev => {
        const newIndices = {...prev};
        const memberKey = `${index}-${memberIndex}`;

        if (newIndices[memberKey]) {
          delete newIndices[memberKey];
        } else {
          Object.keys(newIndices).forEach(key => {
            if (key.startsWith(`${index}-`)) {
              delete newIndices[key];
            }
          });
          newIndices[memberKey] = true;
        }

        return newIndices;
      });
    };

    return (
      <View key={index}>
        <TouchableOpacity
          onPress={() => handleToggle(index)}
          style={styles.itemContainer}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: FONTS.FONTSIZE.SEMIMINI,
              fontFamily: FONTS.FONT_FAMILY.MEDIUM,
              color: COLORS.PRIMARYWHITE,
              padding: 8,
            }}>
            {item?.eventName &&
            item.eventName !== 'null' &&
            item.eventName !== null
              ? item.eventName
              : '-'}
          </Text>
          <View
            activeOpacity={0.35}
            style={{
              paddingHorizontal: 8,
            }}>
            {isSelected ? (
              <AntDesign name="up" size={20} color={COLORS.PRIMARYWHITE} />
            ) : (
              <AntDesign name="down" size={20} color={COLORS.PRIMARYWHITE} />
            )}
          </View>
        </TouchableOpacity>
        {isSelected && (
          <View style={styles.innerContainer}>
            {item.members.map((member, memberIndex) => {
              const number =
                memberIndex + 1 < 10
                  ? `0${memberIndex + 1}`
                  : `${memberIndex + 1}`;

              const isMemberOpen = openIndices[`${index}-${memberIndex}`];
              return (
                <View key={memberIndex}>
                  <View
                    style={{
                      backgroundColor: COLORS.PRIMARYWHITE,
                      padding: 10,
                      borderRadius: 10,
                    }}>
                    <TouchableOpacity
                      onPress={() => {
                        handleToggleMember(memberIndex);
                      }}
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
                            maxWidth: '30%',
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
                                fontSize: FONTS.FONTSIZE.EXTRASMALL,
                              },
                            ]}>
                            {number}
                          </Text>
                        </View>
                        <Text
                          numberOfLines={1}
                          style={[
                            {
                              color: COLORS.PRIMARYBLACK,
                              fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                              fontSize: FONTS.FONTSIZE.EXTRASMALL,
                            },
                          ]}>
                          {member.firstname} {member.lastname}
                        </Text>
                      </View>
                      <View>
                        {isMemberOpen ? (
                          <AntDesign
                            name="up"
                            size={20}
                            color={COLORS.LABELCOLOR}
                          />
                        ) : (
                          <AntDesign
                            name="down"
                            size={20}
                            color={COLORS.LABELCOLOR}
                          />
                        )}
                      </View>
                    </TouchableOpacity>

                    {isMemberOpen && (
                      <View key={memberIndex}>
                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            marginTop: 10,
                          }}>
                          <Text style={styles.memberText}>Name : </Text>
                          <Text style={styles.membervalue}>
                            {member.firstname} {member.lastname}
                          </Text>
                        </View>
                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                          }}>
                          <Text style={styles.memberText}>Check In : </Text>
                          <Text style={styles.membervalue}>
                            {member.checkIn || '-'}
                          </Text>
                        </View>
                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                          }}>
                          <Text style={styles.memberText}>Member Name : </Text>
                          <Text style={styles.membervalue}>
                            {member.memberName || '-'}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
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
              iconStyle="solid"
              name="angle-left"
              size={26}
              color={COLORS.LABELCOLOR}
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
                        refreshing={isReresh}
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
