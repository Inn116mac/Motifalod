import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  FlatList,
} from 'react-native';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
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
      width: width / 3 - 15,
      borderRadius: 10,
    },
    container: {
      flex: 1,
    },
  });

  const navigation = useNavigation();
  const PAGE_SIZE = 4;

  useEffect(() => {
    if (pageNumber) {
      getImageGallery();
    }
  }, [pageNumber, PAGE_SIZE]);

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
            const {status, message, result} = data;
            if (status && result?.data.length) {
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

  const {isConnected, networkLoading} = useNetworkStatus();

  const [hasError, setHasError] = useState({});

  const handleimgError = index => {
    setHasError(prevState => ({
      ...prevState,
      [index]: true,
    }));
  };

  const allImages = rsvpConfig.flatMap(item => {
    const imagePaths = Array.isArray(item.imagePath)
      ? item.imagePath
      : typeof item.imagePath === 'string' &&
        item.imagePath.trim().startsWith('[')
      ? JSON.parse(item.imagePath)
      : [item.imagePath];

    return imagePaths.map(imagePath => ({
      imagePath: imagePath,
      createdAt: item.createdAt,
    }));
  });

  const renderItem = ({item, index}) => {
    return (
      <View key={index}>
        <TouchableOpacity
          disabled={hasError[index]}
          key={index}
          style={styles.imageContainer}
          onPress={() =>
            navigation.navigate('FullImageScreen', {
              image: item?.imagePath,
            })
          }>
          <FastImage
            defaultSource={require('../assets/images/Image_placeholder.png')}
            source={
              hasError[index]
                ? require('../assets/images/noimage.png')
                : {
                    uri: IMAGE_URL + item?.imagePath,
                    cache: FastImage.cacheControl.immutable,
                    priority: FastImage.priority.normal,
                  }
            }
            style={styles.image}
            resizeMode={FastImage.resizeMode.cover}
            onError={() => handleimgError(index)}
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={{flex: 1, backgroundColor: COLORS.BACKGROUNDCOLOR}}>
      <CustomHeader
        leftIcon={
          <FontAwesome6 name="angle-left" size={26} color={COLORS.LABELCOLOR} />
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
                padding: 10,
                paddingBottom: 10,
              }}
              numColumns={3}
              data={allImages}
              keyExtractor={(item, index) => index?.toString()}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={() => <NoDataFound />}
              renderItem={renderItem}
              maxToRenderPerBatch={10}
              windowSize={10}
              initialNumToRender={10}
              removeClippedSubviews={true}
            />
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
          </>
        ) : (
          <Offline />
        )}
      </View>
    </View>
  );
}
