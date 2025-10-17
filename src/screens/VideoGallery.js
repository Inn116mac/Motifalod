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
  ScrollView,
  RefreshControl,
} from 'react-native';
import {FontAwesome6} from "@react-native-vector-icons/fontawesome6";
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import Loader from '../components/root/Loader';
import {NOTIFY_MESSAGE} from '../constant/Module';
import {IMAGE_URL} from '../connection/Config';
import FONTS from '../theme/Fonts';
import COLORS from '../theme/Color';
import {useNavigation} from '@react-navigation/native';
import Video from 'react-native-video';
import NetInfo from '@react-native-community/netinfo';
import CustomTab from '../components/root/CustomTab';
import Offline from '../components/root/Offline';
import {useNetworkStatus} from '../connection/UseNetworkStatus';
import NoDataFound from '../components/root/NoDataFound';
import CustomHeader from '../components/root/CustomHeader';
import httpClient from '../connection/httpClient';
import FastImage from 'react-native-fast-image';
import {AntDesign} from "@react-native-vector-icons/ant-design";

const VideoGallery = ({route}) => {
  const {item} = route?.params?.data;
  const {height, width} = useWindowDimensions();

  const styles = StyleSheet.create({
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      maxHeight: '90%',
      backgroundColor: 'white',
      borderRadius: 10,
      elevation: 5,
      shadowColor: 'rgba(0, 0, 0, 0.3)',
      shadowOffset: {height: 2, width: 2},
      shadowOpacity: 1,
      shadowRadius: 5,
      overflow: 'hidden',
      margin: 20,
    },
    imageContainer: {
      paddingVertical: 4,
      borderRadius: 10,
      marginBottom: 10,
      overflow: 'hidden',
    },
    txtLabel: {
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
      fontSize: FONTS.FONTSIZE.SEMIMINI,
      color: COLORS.TITLECOLOR,
    },
    container: {
      flex: 1,
    },
    txtTitle: {
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
      fontSize: FONTS.FONTSIZE.SEMIMINI,
      color: COLORS.TITLECOLOR,
      width: widthPercentageToDP(60),
      letterSpacing: 1,
      marginBottom: 4,
    },
    txtAddress: {
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
      fontSize: FONTS.FONTSIZE.MINI,
      color: 'gray',
      marginTop: heightPercentageToDP(1),
      textAlign: 'center',
      width: '100%',
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
  const [isReresh, setIsRefresh] = useState(false);

  const [eventData, setEventData] = useState([]);
  const [filterLoading, setFilterLoading] = useState(false);
  const [isEventDataModal, setIsEventDataModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const handleRefresh = async () => {
    setIsRefresh(true);
    await getVideoGallery();
    setIsRefresh(false);
  };
  const navigation = useNavigation();

  const onChange = value => {
    if (value) {
      getVideoGallery();
    }
  };

  useEffect(() => {
    onEventFilter();
  }, []);

  useEffect(() => {
    getVideoGallery();
  }, [selectedEvent]);

  function onEventFilter() {
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setFilterLoading(true);
        httpClient
          .get(
            `module/configuration/dropdown?contentType=EVENT&moduleName=VIDEO GALLERY`,
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

  const getVideoGallery = () => {
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setIsRenderLoading(true);
        let data = JSON.stringify({
          category: '',
          moduleName: 'VIDEO GALLERY',
          pageNumber: 1,
          pageSize: 50,
          orderBy: '',
          eventId: selectedEvent ? selectedEvent?.id : 0,
        });

        httpClient
          .post('module/getimagedatabycategory', data)
          .then(response => {
            const {data} = response;
            const {status, message, result} = data;
            if (status || status == true) {
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

              const resultArray = Object.keys(groupedByTag).map(eventName => ({
                eventName,
                images: groupedByTag[eventName],
              }));
              if (resultArray?.length > 0) {
                setGalleryConfig(resultArray);
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
            navigation.goBack();
          })
          .finally(() => setIsRenderLoading(false));
      }
    });
  };

  const getForm = () => {
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setLoading(true);
        httpClient
          .get(`module/get?name=VIDEO%20GALLERY&isMobile=true&isTabView=false`)
          .then(response => {
            const temp = JSON.parse(response?.data?.result?.configuration);
            const temp1 = response?.data?.result;

            if (
              response.data.status &&
              response.data.result &&
              temp.length &&
              temp1
            ) {
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
            navigation.goBack();
          })
          .finally(() => setLoading(false));
      } else {
        NOTIFY_MESSAGE('Please check your internet connectivity');
      }
    });
  };

  useEffect(() => {
    if (modalVisible) {
      getForm();
    }
  }, [modalVisible]);

  const {isConnected, networkLoading} = useNetworkStatus();
  const [hasError, setHasError] = useState({});

  const handleVideoError = videoId => {
    setHasError(prevState => ({
      ...prevState,
      [videoId]: true,
    }));
  };

  const [videoLoading, setVideoLoading] = useState(true);

  const renderItem = ({item, index}) => {
    const consolidatedImages = item.images.flatMap(itm => {
      const imagePaths = Array.isArray(itm.videoPath)
        ? itm.videoPath
        : typeof itm.videoPath === 'string' &&
          itm.videoPath.trim().startsWith('[')
        ? JSON.parse(itm.videoPath)
        : [itm.videoPath];

      return imagePaths.map(videoPath => ({
        videoPath: videoPath,
        createdAt: itm.createdAt,
      }));
    });

    return (
      consolidatedImages.length > 0 && (
        <View key={index} style={styles.imageContainer}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingHorizontal: 10,
            }}>
            <Text numberOfLines={1} style={[styles.txtTitle]}>
              {item?.eventName ? item?.eventName : '-'}
            </Text>
            {consolidatedImages?.length >= 3 && (
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('VideoViewAllGallery', {
                    name: item.images[0].event,
                    header: item?.eventName,
                  });
                }}>
                <Text
                  style={[
                    styles.txtLabel,
                    {
                      fontSize: FONTS.FONTSIZE.SMALL,
                      alignSelf: 'center',
                      textAlignVertical: 'center',
                    },
                  ]}>
                  View all
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <View
            style={{
              flexDirection: 'row',
              paddingHorizontal: 10,
              gap: 10,
              overflow: 'hidden',
            }}>
            {consolidatedImages.slice(0, 3).map((img, index) => (
              <View
                key={`${img.videoPath}_${index}`}
                style={{width: width / 3 - 17}}>
                {hasError[`${img.videoPath}_${index}`] ? (
                  <FastImage
                    source={require('../assets/images/video.jpg')}
                    style={{
                      height: 100,
                      width: width / 3 - 18,
                      borderRadius: 10,
                    }}
                  />
                ) : (
                  <TouchableOpacity
                    // disabled={videoLoading[`${img.videoPath}_${index}`]}
                    onPress={() => {
                      navigation.navigate('VideoGalleryVideoScreen', {
                        videoData: img?.videoPath,
                      });
                    }}
                    style={{
                      borderRadius: 10,
                      overflow: 'hidden',
                    }}>
                    {videoLoading[`${img.videoPath}_${index}`] && (
                      <FastImage
                        source={require('../assets/images/Video_placeholder.png')}
                        style={{
                          height: 100,
                          width: width / 3 - 18,
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          bottom: 0,
                          right: 0,
                          zIndex: 1,
                        }}
                        resizeMode="stretch"
                      />
                    )}
                    <Video
                      onLoadStart={() =>
                        setVideoLoading(prevState => ({
                          ...prevState,
                          [`${img.videoPath}_${index}`]: true,
                        }))
                      }
                      onLoad={() =>
                        setVideoLoading(prevState => ({
                          ...prevState,
                          [`${img.videoPath}_${index}`]: false,
                        }))
                      }
                      onError={() =>
                        handleVideoError(`${img.videoPath}_${index}`)
                      }
                      source={{
                        uri: IMAGE_URL + img.videoPath,
                      }}
                      muted={true}
                      paused={true}
                      controls={false}
                      resizeMode="stretch"
                      style={{
                        height: 100,
                        width: width / 3 - 18,
                      }}
                      shutterColor="transparent"
                    />
                  </TouchableOpacity>
                )}
                <Text numberOfLines={1} style={styles.txtAddress}>
                  {img?.createdAt ? img?.createdAt : '-'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )
    );
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
        title={item?.name}
      />

      <View style={[styles.container]}>
        {networkLoading || isRnderLoading || filterLoading ? (
          <Loader />
        ) : isConnected ? (
          <View style={{flex: 1, overflow: 'hidden'}}>
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
              <FlatList
                refreshControl={
                  <RefreshControl
                    onRefresh={handleRefresh}
                    refreshing={isReresh}
                  />
                }
                contentContainerStyle={{
                  paddingHorizontal: 6,
                  paddingBottom: 60,
                }}
                data={rsvpConfig}
                keyExtractor={(item, index) => index?.toString()}
                showsVerticalScrollIndicator={false}
                maxToRenderPerBatch={10}
                windowSize={10}
                initialNumToRender={10}
                removeClippedSubviews={true}
                ListEmptyComponent={() => {
                  return <NoDataFound />;
                }}
                renderItem={renderItem}
              />
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
                Upload Videos
              </Text>
            </TouchableOpacity>
          </View>
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
                    isVideoGallery={true}
                    onChange={onChange}
                    isFromDashboard={true}
                  />
                ) : (
                  <View
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                    <Text
                      style={{
                        fontSize: FONTS.FONTSIZE.MEDIUM,
                        fontFamily: FONTS.FONT_FAMILY.EXTRA_LIGHT,
                      }}>
                      No data available
                    </Text>
                  </View>
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
};

export default VideoGallery;
