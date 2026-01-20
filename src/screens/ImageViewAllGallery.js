import React, {useEffect, useState, useRef, useCallback} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import FONTS from '../theme/Fonts';
import COLORS from '../theme/Color';
import {IMAGE_URL} from '../connection/Config';
import {NOTIFY_MESSAGE} from '../constant/Module';
import Loader from '../components/root/Loader';
import {useNavigation} from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import NetInfo from '@react-native-community/netinfo';
import Offline from '../components/root/Offline';
import {useNetworkStatus} from '../connection/UseNetworkStatus';
import CustomHeader from '../components/root/CustomHeader';
import NoDataFound from '../components/root/NoDataFound';
import httpClient from '../connection/httpClient';

export default function ImageViewAllGallery({route}) {
  const [isRenderLoading, setIsRenderLoading] = useState(true);
  const [rsvpConfig, setGalleryConfig] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const {width} = useWindowDimensions();

  const styles = StyleSheet.create({
    headingText: {
      fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
      fontSize: FONTS.FONTSIZE.LARGE,
      color: COLORS.PRIMARYWHITE,
      textAlign: 'center',
    },
    imageContainer: {
      borderRadius: 12,
      marginTop: 10,
      marginHorizontal: 4,
      marginVertical: 4,
    },
    image: {
      height: heightPercentageToDP(13),
      width: width / 3 - 18,
      borderRadius: 10,
      backgroundColor: '#f0f0f0',
    },
    container: {
      flex: 1,
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.7)',
      borderRadius: 10,
    },
  });

  const navigation = useNavigation();
  const PAGE_SIZE = 4; // API page size (number of records per page)

  // 🔥 Batch loading system
  const [visibleImages, setVisibleImages] = useState(new Set());
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [allImageKeys, setAllImageKeys] = useState([]);
  const loadingImages = useRef(new Set());
  const BATCH_SIZE = 6; // Number of images to load at once
  const processingBatchTransition = useRef(false);

  // 🔥 Retry system
  const [hasError, setHasError] = useState({});
  const [retryCount, setRetryCount] = useState({});
  const [retryKey, setRetryKey] = useState({});
  const retryTimeouts = useRef({});
  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [1000, 2000, 3000];

  const {isConnected, networkLoading} = useNetworkStatus();

  useEffect(() => {
    if (pageNumber) {
      getImageGallery();
    }
  }, [pageNumber]);

  // 🔥 Reset batch when data changes
  useEffect(() => {
    if (Platform.OS === 'ios' && rsvpConfig.length > 0) {
      buildImageKeysList();
    }
  }, [rsvpConfig]);

  const getImageGallery = () => {
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setIsRenderLoading(true);
        const data = {
          category: route?.params?.name,
          moduleName: 'IMAGE GALLERY',
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
            const {status, result} = data;

            if (status && result?.data.length) {
              const newData = result?.data;
              if (newData?.length > 0) {
                setGalleryConfig(newData);
                // Reset batch loading for new page
                if (Platform.OS === 'ios') {
                  setCurrentBatchIndex(0);
                  setVisibleImages(new Set());
                  loadingImages.current = new Set();
                  processingBatchTransition.current = false;
                }

                // Reset error states for new page
                setHasError({});
                setRetryCount({});
                setRetryKey({});

                Object.values(retryTimeouts.current).forEach(timeout => {
                  clearTimeout(timeout);
                });
              } else {
                setGalleryConfig([]);
              }

              const canLoadMore =
                pageNumber < calculatedTotalPages && newData.length > 0;
              setHasMore(canLoadMore);
            } else {
              NOTIFY_MESSAGE(response?.data?.message || 'Something Went Wrong');
            }
          })
          .catch(error => {
            NOTIFY_MESSAGE('Something Went Wrong');
            setIsRenderLoading(false);
          })
          .finally(() => {
            setIsRenderLoading(false);
          });
      } else {
        NOTIFY_MESSAGE('Please check your internet connectivity');
      }
    });
  };

  // 🔥 Build flat list of image keys
  const buildImageKeysList = () => {
    if (Platform.OS === 'android') return;
    const allImgs = rsvpConfig.flatMap((item, itemIndex) => {
      const imagePaths = Array.isArray(item.imagePath)
        ? item.imagePath
        : typeof item.imagePath === 'string' &&
          item.imagePath.trim().startsWith('[')
        ? JSON.parse(item.imagePath)
        : [item.imagePath];

      return imagePaths.map((_, pathIndex) => `${itemIndex}_${pathIndex}`);
    });

    setAllImageKeys(allImgs);
    setCurrentBatchIndex(0);
  };

  // 🔥 Load next batch when current batch index changes
  useEffect(() => {
    if (Platform.OS === 'android') return;
    if (allImageKeys.length === 0) return;

    // Reset the transition flag when starting a new batch
    processingBatchTransition.current = false;

    const startIndex = currentBatchIndex * BATCH_SIZE;
    const endIndex = Math.min(startIndex + BATCH_SIZE, allImageKeys.length);
    const currentBatch = allImageKeys.slice(startIndex, endIndex);

    if (currentBatch.length > 0) {
      setVisibleImages(prev => {
        const newSet = new Set(prev);
        currentBatch.forEach(key => newSet.add(key));
        return newSet;
      });

      currentBatch.forEach(key => loadingImages.current.add(key));
    }
  }, [allImageKeys, currentBatchIndex, BATCH_SIZE]);

  const handleImageLoad = useCallback(
    imageKey => {
      const hasFailed = hasError[imageKey] === true;

      if (!hasFailed) {
        setHasError(prev => ({...prev, [imageKey]: false}));

        if (Platform.OS === 'ios') {
          loadingImages.current.delete(imageKey);
          checkBatchCompletion();
        }
      }
    },
    [hasError, currentBatchIndex, allImageKeys],
  );

  const handleImageError = useCallback(
    imageKey => {
      const attempts = retryCount[imageKey] || 0;

      if (attempts < MAX_RETRIES) {
        const nextAttempt = attempts + 1;
        const delay = RETRY_DELAYS[attempts] || 1000;

        console.warn(
          `⚠️ Image error: ${imageKey}, retry ${nextAttempt}/${MAX_RETRIES} in ${delay}ms`,
        );

        retryTimeouts.current[imageKey] = setTimeout(() => {
          setRetryCount(prev => ({...prev, [imageKey]: nextAttempt}));
          setRetryKey(prev => ({...prev, [imageKey]: Date.now()}));

          if (Platform.OS === 'ios') {
            loadingImages.current.add(imageKey);
          }
        }, delay);
      } else {
        // PERMANENT FAILURE - Prevent further state updates
        console.error(
          `❌ Image permanently failed: ${imageKey} after ${MAX_RETRIES} retries`,
        );

        // Set error state ONCE
        setHasError(prev => {
          if (prev[imageKey] === true) return prev; // Already failed, don't update
          return {...prev, [imageKey]: true};
        });

        if (Platform.OS === 'ios') {
          loadingImages.current.delete(imageKey);
          checkBatchCompletion();
        }
      }
    },
    [retryCount], // Minimal dependencies
  );

  // 🔥 Check if batch is complete
  const checkBatchCompletion = useCallback(() => {
    if (Platform.OS === 'android') return;
    const startIndex = currentBatchIndex * BATCH_SIZE;
    const endIndex = Math.min(startIndex + BATCH_SIZE, allImageKeys.length);
    const currentBatch = allImageKeys.slice(startIndex, endIndex);

    const batchComplete = currentBatch.every(
      key => !loadingImages.current.has(key),
    );

    if (batchComplete && !processingBatchTransition.current) {
      processingBatchTransition.current = true;

      setTimeout(() => {
        const nextStartIndex = (currentBatchIndex + 1) * BATCH_SIZE;
        if (nextStartIndex < allImageKeys.length) {
          setCurrentBatchIndex(prev => prev + 1);
        } else {
        }
      }, 300);
    }
  }, [currentBatchIndex, allImageKeys, BATCH_SIZE]);

  // 🔥 Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(retryTimeouts.current).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, []);

  const loadMore = () => {
    if (hasMore && !isRenderLoading) {
      setPageNumber(prevPage => prevPage + 1);
    }
  };

  const loadPrevious = () => {
    if (pageNumber > 1 && !isRenderLoading) {
      setPageNumber(prevPage => Math.max(prevPage - 1, 1));
    }
  };

  const allImages = rsvpConfig.flatMap((item, itemIndex) => {
    const imagePaths = Array.isArray(item.imagePath)
      ? item.imagePath
      : typeof item.imagePath === 'string' &&
        item.imagePath.trim().startsWith('[')
      ? JSON.parse(item.imagePath)
      : [item.imagePath];

    return imagePaths.map((imagePath, pathIndex) => ({
      imagePath: imagePath,
      createdAt: item.createdAt,
      imageKey: `${itemIndex}_${pathIndex}`,
    }));
  });

  const renderItemIOS = ({item, index}) => {
    const imageKey = item.imageKey;
    const shouldLoad = visibleImages.has(imageKey);
    const hasFailed = hasError[imageKey] === true;

    // Don't use retryKey if already failed - keep key stable
    const currentRetryKey = hasFailed ? 'failed' : retryKey[imageKey] || 0;
    const fullUrl = IMAGE_URL + item?.imagePath;
    const isLoading = loadingImages.current.has(imageKey) && !hasFailed;

    return (
      <View key={`wrapper_${index}`} style={styles.imageContainer}>
        <TouchableOpacity
          disabled={hasFailed}
          style={styles.imageContainer}
          onPress={() => {
            if (!hasFailed) {
              navigation.navigate('FullImageScreen', {
                image: item?.imagePath,
              });
            }
          }}>
          <View style={{position: 'relative'}}>
            {shouldLoad ? (
              <FastImage
                key={`${imageKey}_${currentRetryKey}`}
                defaultSource={require('../assets/images/Image_placeholder.png')}
                source={
                  hasFailed
                    ? require('../assets/images/noimage.png')
                    : {
                        uri: fullUrl,
                        priority: FastImage.priority.normal,
                        cache: FastImage.cacheControl.immutable,
                      }
                }
                style={styles.image}
                resizeMode={hasFailed ? 'contain' : 'cover'}
                onLoad={() => {
                  if (!hasFailed) {
                    handleImageLoad(imageKey);
                  }
                }}
                onError={() => {
                  if (!hasFailed) {
                    console.warn(`❌ Image load error: ${imageKey}`);
                    handleImageError(imageKey);
                  }
                }}
              />
            ) : (
              <FastImage
                source={require('../assets/images/Image_placeholder.png')}
                style={styles.image}
                resizeMode="contain"
              />
            )}

            {/* Loading indicator */}
            {shouldLoad && isLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color={COLORS.LABELCOLOR} />
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderItemAndroid = ({item, index}) => {
    const imageKey = item?.imageKey || index;
    const fullUrl = IMAGE_URL + item?.imagePath;
    return (
      <View key={index}>
        <TouchableOpacity
          disabled={hasError[imageKey]}
          style={styles.imageContainer}
          onPress={() =>
            navigation.navigate('FullImageScreen', {
              image: item?.imagePath,
            })
          }>
          <FastImage
            defaultSource={require('../assets/images/Image_placeholder.png')}
            source={
              hasError[imageKey]
                ? require('../assets/images/noimage.png')
                : {
                    uri: fullUrl,
                    priority: FastImage.priority.high,
                    cache: FastImage.cacheControl.immutable,
                  }
            }
            style={styles.image}
            resizeMode="cover"
            onError={() => {
              setHasError(prev => ({...prev, [imageKey]: true}));
            }}
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={{flex: 1, backgroundColor: COLORS.BACKGROUNDCOLOR}}>
      <CustomHeader
        leftIcon={
          <FontAwesome6
            name="angle-left"
            iconStyle="solid"
            size={26}
            color={COLORS.LABELCOLOR}
          />
        }
        title={route?.params?.header || '-'}
        leftOnPress={() => navigation.goBack()}
      />

      <View style={[styles.container]}>
        {networkLoading || isRenderLoading ? (
          <Loader />
        ) : isConnected ? (
          <>
            <FlatList
              contentContainerStyle={{
                paddingBottom: 10,
                padding: Platform.OS == 'android' ? 10 : 0,
              }}
              numColumns={3}
              data={allImages}
              keyExtractor={(item, index) =>
                `${pageNumber}_${item.imageKey}_${index}`
              }
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={() => <NoDataFound />}
              renderItem={
                Platform.OS === 'android' ? renderItemAndroid : renderItemIOS
              }
              maxToRenderPerBatch={Platform.OS === 'android' ? 12 : 6}
              windowSize={Platform.OS === 'android' ? 10 : 5}
              initialNumToRender={Platform.OS === 'android' ? 12 : 6}
              removeClippedSubviews={true}
              updateCellsBatchingPeriod={200}
            />
            {(hasMore || pageNumber > 1) && rsvpConfig.length > 0 && (
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
                    onPress={loadPrevious}
                    disabled={isRenderLoading}>
                    <Text
                      style={{
                        fontSize: FONTS.FONTSIZE.SMALL,
                        color: isRenderLoading ? COLORS.LABELCOLOR : 'blue',
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
                    disabled={isRenderLoading}>
                    <Text
                      style={{
                        fontSize: FONTS.FONTSIZE.SMALL,
                        color: isRenderLoading ? COLORS.LABELCOLOR : 'blue',
                        textAlign: 'center',
                        fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                      }}>
                      Load More
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        ) : (
          <Offline />
        )}
      </View>
    </View>
  );
}
