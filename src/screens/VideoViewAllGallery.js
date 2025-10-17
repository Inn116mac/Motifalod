import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  FlatList,
} from 'react-native';
import {FontAwesome6} from "@react-native-vector-icons/fontawesome6";
import {
  heightPercentageToDP,
} from 'react-native-responsive-screen';
import Video from 'react-native-video';
import {useNavigation} from '@react-navigation/native';
import FONTS from '../theme/Fonts';
import COLORS from '../theme/Color';
import {IMAGE_URL} from '../connection/Config';
import {NOTIFY_MESSAGE} from '../constant/Module';
import Loader from '../components/root/Loader';
import NetInfo from '@react-native-community/netinfo';
import Offline from '../components/root/Offline';
import CustomHeader from '../components/root/CustomHeader';
import NoDataFound from '../components/root/NoDataFound';
import {useNetworkStatus} from '../connection/UseNetworkStatus';
import httpClient from '../connection/httpClient';
import FastImage from 'react-native-fast-image';

const VideoViewAllGallery = ({route}) => {
  const {width} = useWindowDimensions();

  const styles = StyleSheet.create({
    imageContainer: {
      marginHorizontal: 6,
      marginVertical: 10,
    },
    container: {
      flex: 1,
      overflow: 'hidden',
    },
  });

  const navigation = useNavigation();
  const [isRnderLoading, setIsRenderLoading] = useState(true);
  const [rsvpConfig, setGalleryConfig] = useState([]);

  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (pageNumber) {
      getVideoGallery();
    }
  }, [pageNumber]);

  const PAGE_SIZE = 4;

  const getVideoGallery = () => {
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setIsRenderLoading(true);

        let data = {
          category: route?.params?.name,
          moduleName: 'VIDEO GALLERY',
          pageNumber: pageNumber,
          pageSize: PAGE_SIZE,
          orderBy: 'order',
        };

        httpClient
          .post('module/getimagedatabycategory', data)
          .then(response => {
            const totalRecords = response?.data?.result?.totalRecord || 0;
            const calculatedTotalPages = Math.ceil(totalRecords / PAGE_SIZE);
            const {data} = response;
            const {status, message, result} = data;
            if ((status || status == true) && result?.data.length) {
              const newData = result?.data;

              if (newData?.length > 0) {
                setGalleryConfig(newData);
              } else {
                setGalleryConfig([]);
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
          .catch(error => {
            NOTIFY_MESSAGE(
              error || error?.message ? 'Something Went Wrong' : null,
            );
            setIsRenderLoading(false);
          })
          .finally(() => {
            setIsRenderLoading(false);
          });
      }
    });
  };

  const loadMore = () => {
    if (hasMore) {
      setPageNumber(prevPage => prevPage + 1);
    }
  };

  const [hasError, setHasError] = useState({});

  const handleVideoError = index => {
    setHasError(prevState => ({
      ...prevState,
      [index]: true,
    }));
  };

  const {isConnected, networkLoading} = useNetworkStatus();

  const allImages = rsvpConfig.flatMap(item => {
    const imagePaths = Array.isArray(item.videoPath)
      ? item.videoPath
      : typeof item.videoPath === 'string' &&
        item.videoPath.trim().startsWith('[')
      ? JSON.parse(item.videoPath)
      : [item.videoPath];

    return imagePaths.map(videoPath => ({
      videoPath: videoPath,
      createdAt: item.createdAt,
    }));
  });

  const [videoLoading, setVideoLoading] = useState(true);

  const renderItem = ({item, index}) => {
    const uniqueKey = index;
    return !hasError[uniqueKey] ? (
      <View
        style={{
          borderRadius: 10,
          overflow: 'hidden',
        }}>
        <TouchableOpacity
          disabled={videoLoading[uniqueKey]}
          style={styles.imageContainer}
          onPress={() => {
            if (item?.videoPath) {
              navigation.navigate('VideoGalleryVideoScreen', {
                videoData: item?.videoPath,
              });
            }
          }}>
          {videoLoading[uniqueKey] && (
            <FastImage
              source={require('../assets/images/Video_placeholder.png')}
              style={{
                height: 100,
                width: width / 3 - 20,
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
                [uniqueKey]: true,
              }))
            }
            onLoad={() =>
              setVideoLoading(prevState => ({
                ...prevState,
                [uniqueKey]: false,
              }))
            }
            onError={() => handleVideoError(uniqueKey)}
            source={{uri: IMAGE_URL + item?.videoPath}}
            resizeMode="stretch"
            style={{
              height: 100,
              width: width / 3 - 20,
            }}
            muted={true}
            paused={true}
            controls={false}
            shutterColor="transparent"
          />
        </TouchableOpacity>
      </View>
    ) : (
      <View style={styles.imageContainer}>
        <FastImage
          source={require('../assets/images/video.jpg')}
          style={{
            height: 100,
            width: width / 3 - 20,
            borderRadius: 10,
          }}
        />
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
        leftOnPress={() => {
          navigation.goBack();
        }}
        leftIcon={
          <FontAwesome6 name="angle-left" iconStyle='solid' size={26} color={COLORS.LABELCOLOR} />
        }
        title={route.params?.header}
      />
      <View style={[styles.container]}>
        {networkLoading || isRnderLoading ? (
          <Loader />
        ) : isConnected ? (
          <View style={{flex: 1}}>
            {rsvpConfig.length > 0 ? (
              <FlatList
                contentContainerStyle={{
                  paddingBottom: 10,
                  overflow: 'hidden',
                  margin: 10,
                }}
                data={allImages}
                keyExtractor={(item, index) => index?.toString()}
                showsVerticalScrollIndicator={false}
                numColumns={3}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={10}
                initialNumToRender={10}
                renderItem={renderItem}
              />
            ) : (
              <NoDataFound />
            )}

            {(hasMore || pageNumber > 1) && rsvpConfig.length > 0 && (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 30,
                }}>
                {pageNumber > 1 && (
                  <TouchableOpacity
                    onPress={() =>
                      setPageNumber(prevPage => Math.max(prevPage - 1, 1))
                    }
                    style={{
                      paddingVertical: heightPercentageToDP('1%'),
                    }}>
                    <Text
                      style={{
                        fontSize: FONTS.FONTSIZE.SMALL,
                        color: 'blue',
                        textAlign: 'center',
                        fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                      }}>
                      Previous
                    </Text>
                  </TouchableOpacity>
                )}
                {hasMore && (
                  <TouchableOpacity
                    onPress={loadMore}
                    style={{
                      paddingVertical: heightPercentageToDP('1%'),
                    }}>
                    <Text
                      style={{
                        fontSize: FONTS.FONTSIZE.SMALL,
                        color: 'blue',
                        textAlign: 'center',
                        fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                      }}>
                      Load More
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        ) : (
          <Offline />
        )}
      </View>
    </View>
  );
};

export default VideoViewAllGallery;
