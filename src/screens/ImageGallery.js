import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import COLORS from '../theme/Color';
import FONTS from '../theme/Fonts';
import Loader from '../components/root/Loader';
import CustomTab from '../components/root/CustomTab';
import Offline from '../components/root/Offline';
import {IMAGE_URL} from '../connection/Config';
import NetInfo from '@react-native-community/netinfo';
import {useIsFocused, useNavigation} from '@react-navigation/native';
import {FontAwesome6} from "@react-native-vector-icons/fontawesome6";
import {AntDesign} from "@react-native-vector-icons/ant-design";
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import NoDataFound from '../components/root/NoDataFound';
import {useNetworkStatus} from '../connection/UseNetworkStatus';
import CustomHeader from '../components/root/CustomHeader';
import httpClient from '../connection/httpClient';

export default function ImageGallery({route}) {
  const {item} = route?.params?.data;
  const {height, width} = useWindowDimensions();

  const styles = StyleSheet.create({
    headingText: {
      fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
      fontSize: FONTS.FONTSIZE.LARGE,
      color: COLORS.PRIMARYWHITE,
      textAlign: 'center',
    },
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      maxHeight: '90%',
      backgroundColor: COLORS.BACKGROUNDCOLOR,
      borderRadius: 10,
      elevation: 5,
      shadowColor: 'rgba(0, 0, 0, 0.3)',
      shadowOffset: {height: 2, width: 2},
      shadowOpacity: 1,
      shadowRadius: 5,
      overflow: 'hidden',
      margin: 20,
    },
    scrollContent: {
      flexGrow: 1,
    },
    noDataView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    noDataText: {
      fontSize: FONTS.FONTSIZE.MEDIUM,
      fontFamily: FONTS.FONT_FAMILY.EXTRA_LIGHT,
    },
    imageContainer: {
      paddingVertical: 4,
      borderRadius: 10,
      overflow: 'hidden',
    },
    txtLabel: {
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
      fontSize: FONTS.FONTSIZE.SEMIMINI,
      color: COLORS.TITLECOLOR,
      textAlign: 'center',
    },
    image: {
      height: 100,
      width: width / 3 - 17,
      marginTop: 4,
      borderRadius: 10,
    },
    container: {
      flex: 1,
      overflow: 'hidden',
    },
    listContainer: {
      padding: 15,
      paddingBottom: 80,
    },
    txtTitle: {
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
      fontSize: FONTS.FONTSIZE.SEMIMINI,
      color: COLORS.TITLECOLOR,
      letterSpacing: 1,
    },
    txtAddress: {
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
      fontSize: 10,
      color: 'grey',
      marginTop: heightPercentageToDP(1),
      width: '100%',
      textAlign: 'center',
    },
    modalContainer1: {
      flex: 1,
      alignItems: 'flex-end',
      overflow: 'hidden',
    },
    modalContent1: {
      width: widthPercentageToDP(42),
      backgroundColor: COLORS.PRIMARYWHITE,
      borderRadius: 8,
      top: heightPercentageToDP(12),
      right: widthPercentageToDP(3),
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
  });

  const [isRnderLoading, setIsRenderLoading] = useState(true);
  const [rsvpConfig, setGalleryConfig] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [moduleData, setModuleData] = useState([]);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const {isConnected, networkLoading} = useNetworkStatus();
  const [isReresh, setIsRefresh] = useState(false);

  const [eventData, setEventData] = useState([]);
  const [filterLoading, setFilterLoading] = useState(false);
  const [isEventDataModal, setIsEventDataModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const handleRefresh = async () => {
    setIsRefresh(true);
    await getImageGallery();
    setIsRefresh(false);
  };
  const onChange = value => {
    if (value) {
      getImageGallery();
    }
  };

  useEffect(() => {
    onEventFilter();
  }, []);

  useEffect(() => {
    getImageGallery();
  }, [selectedEvent]);

  function onEventFilter() {
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setFilterLoading(true);
        httpClient
          .get(
            `module/configuration/dropdown?contentType=EVENT&moduleName=IMAGE GALLERY`,
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

  const getImageGallery = () => {
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setIsRenderLoading(true);
        let data = {
          category: '',
          moduleName: 'IMAGE GALLERY',
          pageNumber: 1,
          pageSize: 50,
          orderBy: 'order',
          eventId: selectedEvent ? selectedEvent?.id : 0,
        };

        httpClient
          .post('module/getimagedatabycategory', data)
          .then(response => {
            const {data} = response;
            const {status, message, result} = data;

            if (status || status == true) {
              if (result?.data.length > 0) {
                const groupedByTag = result?.data?.reduce((acc, item) => {
                  const {eventName, ...rest} = item;

                  if (!acc[eventName]) {
                    acc[eventName] = [rest];
                  } else {
                    if (acc[eventName].length < 3) {
                      acc[eventName].push(rest);
                    }
                  }
                  return acc;
                }, {});

                const resultArray = Object.keys(groupedByTag).map(
                  eventName => ({
                    eventName,
                    images: groupedByTag[eventName],
                  }),
                );
                if (resultArray?.length > 0) {
                  setGalleryConfig(resultArray);
                } else {
                  setGalleryConfig([]);
                }
              } else {
                setGalleryConfig([]);
              }
            } else {
              NOTIFY_MESSAGE(
                response?.data?.message
                  ? response?.data?.message
                  : 'Something Went Wrong',
              );
            }
          })
          .catch(error => {
            setIsRenderLoading(false);
            NOTIFY_MESSAGE(
              error || error?.message ? 'Something Went Wrong' : null,
            );
            navigation.navigate('Dashboard');
          })
          .finally(() => setIsRenderLoading(false));
      }
    });
  };

  useEffect(() => {
    if (modalVisible) {
      getForm();
    }
  }, [modalVisible, isFocused]);

  const getForm = () => {
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setLoading(true);
        httpClient
          .get(`module/get?name=IMAGE%20GALLERY&isMobile=true&isTabView=false`)
          .then(response => {
            const temp = JSON.parse(response?.data?.result?.configuration);
            const temp1 = response?.data?.result;
            if (response.data.status && temp.length && temp1) {
              setResponse(temp1);
              setModuleData(temp);
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

  const [hasError, setHasError] = useState({});

  const handleimgError = index => {
    setHasError(prevState => ({
      ...prevState,
      [index]: true,
    }));
  };

  const renderItem = ({item, index}) => {
    const consolidatedImages = item?.images?.flatMap(itm => {
      const imagePaths = Array.isArray(itm?.imagePath)
        ? itm?.imagePath
        : typeof itm.imagePath === 'string' &&
          itm.imagePath.trim().startsWith('[')
        ? JSON.parse(itm.imagePath)
        : [itm.imagePath];

      return imagePaths.map(imagePath => ({
        imagePath: imagePath,
        createdAt: itm.createdAt,
      }));
    });

    return (
      consolidatedImages?.length > 0 && (
        <View key={String(index)} style={styles.imageContainer}>
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
                width: width / 1.6,
              }}>
              <Text numberOfLines={1} style={[styles.txtTitle]}>
                {item?.eventName && item?.eventName !== 'null'
                  ? item?.eventName
                  : '-'}
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                  fontSize: FONTS.FONTSIZE.SEMIMINI,
                  color: COLORS.TITLECOLOR,
                  textAlign: 'center',
                  paddingHorizontal: 2,
                }}>
                {item?.images[0]?.eventAttendancestatus === 1
                  ? '(Attended)'
                  : '(Missed)'}
              </Text>
            </View>
            {consolidatedImages?.length >= 3 && (
              <TouchableOpacity
                style={{
                  paddingHorizontal: heightPercentageToDP('0.5%'),
                  borderBottomLeftRadius: 20,
                  borderTopLeftRadius: 20,
                  paddingVertical: 2,
                }}
                onPress={() =>
                  navigation.navigate('ImageVIewAllGallery', {
                    name: item?.images[0]?.eventId,
                    header: item?.eventName,
                  })
                }>
                <Text style={[styles.txtLabel, {}]}>View all</Text>
              </TouchableOpacity>
            )}
          </View>

          <View
            style={{
              flexDirection: 'row',
              gap: 10,
              alignItems: 'center',
              width: width / 3 - 18,
            }}>
            {consolidatedImages?.slice(0, 3).map((img, index) => (
              <TouchableOpacity
                disabled={hasError[`${img.imagePath}_${index}`]}
                key={`${img.imagePath}_${index}`}
                onPress={() => {
                  navigation.navigate('FullImageScreen', {
                    image: img.imagePath,
                  });
                }}>
                <FastImage
                  defaultSource={require('../assets/images/Image_placeholder.png')}
                  source={
                    hasError[`${img.imagePath}_${index}`]
                      ? require('../assets/images/noimage.png')
                      : {
                          uri: IMAGE_URL + img.imagePath,
                          cache: FastImage.cacheControl.immutable,
                          priority: FastImage.priority.normal,
                        }
                  }
                  style={styles.image}
                  resizeMode={FastImage.resizeMode.cover}
                  onError={() => handleimgError(`${img.imagePath}_${index}`)}
                />
                <Text numberOfLines={1} style={styles.txtAddress}>
                  {img.createdAt ? img.createdAt : '-'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )
    );
  };

  return (
    <View style={{flex: 1, backgroundColor: COLORS.BACKGROUNDCOLOR}}>
      <CustomHeader
        leftOnPress={() => {
          navigation.goBack();
        }}
        leftIcon={
          <FontAwesome6 name="angle-left" iconStyle='solid' size={26} color={COLORS.LABELCOLOR} />
        }
        title={item?.name}
      />

      <View style={[styles.container]}>
        {networkLoading || isRnderLoading || filterLoading ? (
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

            {rsvpConfig.length > 0 ? (
              <View style={{flex: 1}}>
                <FlatList
                  refreshControl={
                    <RefreshControl
                      onRefresh={handleRefresh}
                      refreshing={isReresh}
                    />
                  }
                  contentContainerStyle={styles.listContainer}
                  data={rsvpConfig}
                  keyExtractor={(item, index) => index?.toString()}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={() => <NoDataFound />}
                  renderItem={renderItem}
                  maxToRenderPerBatch={10}
                  windowSize={10}
                  initialNumToRender={10}
                  removeClippedSubviews={true}
                />
              </View>
            ) : (
              <NoDataFound />
            )}
            <TouchableOpacity
              style={[
                {
                  backgroundColor: COLORS.LABELCOLOR,
                  marginTop: 10,
                  justifyContent: 'center',
                  alignItems: 'center',
                  alignSelf: 'center',
                  borderRadius: 10,
                  height: heightPercentageToDP(7),
                  shadowColor: 'rgba(0,0,0, .4)',
                  shadowOffset: {height: 1, width: 1},
                  shadowOpacity: 1,
                  shadowRadius: 1,
                  elevation: 2,
                  width: '90%',
                },
                {
                  position: 'absolute',
                  bottom: heightPercentageToDP(2),
                },
              ]}
              onPress={() => {
                setModalVisible(true);
              }}>
              <Text
                style={{
                  color: COLORS.PRIMARYWHITE,
                  fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                  fontSize: FONTS.FONTSIZE.EXTRASMALL,
                }}>
                Upload Files
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <Offline />
        )}
      </View>
      <Modal transparent={true} visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <TouchableWithoutFeedback
            onPress={() => {
              setModalVisible(false);
            }}>
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>

          <View style={styles.modalContent}>
            <ScrollView
              style={styles.scrollContent}
              nestedScrollEnabled={true}
              contentContainerStyle={{flexGrow: 1}}
              keyboardShouldPersistTaps="handled">
              {!loading ? (
                moduleData.length > 0 && response ? (
                  <CustomTab
                    data={moduleData}
                    response1={response}
                    setModalVisible1={setModalVisible}
                    isImageGallery={true}
                    isFromDashboard={true}
                    onChange={onChange}
                  />
                ) : (
                  <NoDataFound />
                )
              ) : (
                <Loader />
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

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
