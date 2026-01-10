import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import CustomHeader from '../components/root/CustomHeader';
import {useNavigation} from '@react-navigation/native';
import COLORS from '../theme/Color';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import FONTS from '../theme/Fonts';
import NoDataFound from '../components/root/NoDataFound';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import {
  formatPhoneToUS,
  isPhoneField,
  NOTIFY_MESSAGE,
} from '../constant/Module';
import NetInfo from '@react-native-community/netinfo';
import httpClient from '../connection/httpClient';
import {useNetworkStatus} from '../connection/UseNetworkStatus';
import Loader from '../components/root/Loader';
import Offline from '../components/root/Offline';
import {AntDesign} from '@react-native-vector-icons/ant-design';

const NameListScreen = ({route}) => {
  const {width, height} = useWindowDimensions();

  const {title, item1, type} = route.params;

  const navigation = useNavigation();

  const styles = StyleSheet.create({
    paginationText: {
      fontSize: FONTS.FONTSIZE.SMALL,
      color: 'blue',
      textAlign: 'center',
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    },
    container: {
      flex: 1,
      backgroundColor: COLORS.BACKGROUNDCOLOR,
    },
    pkgLbl: {
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      fontSize: FONTS.FONTSIZE.SMALL,
      color: COLORS.PRIMARYBLACK,
    },
    listContainer: {
      marginHorizontal: 10,
      borderRadius: 10,
    },
    nameItem: {
      paddingVertical: 10,
      borderBottomWidth: 0.8,
      borderBottomColor: COLORS.LIGHTGREY,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    nameText: {
      fontSize: FONTS.FONTSIZE.EXTRASMALL,
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
      color: COLORS.PLACEHOLDERCOLOR,
      width: '86%',
    },
    txtLabel: {
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      fontSize: FONTS.FONTSIZE.LARGE,
      color: COLORS.PRIMARYWHITE,
    },
    pkgLbl1: {
      fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
      fontSize: FONTS.FONTSIZE.EXTRASMALL,
      color: COLORS.PRIMARYBLACK,
      textAlign: 'right',
    },
    txtTitle: {
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
      fontSize: FONTS.FONTSIZE.EXTRASMALL,
      color: COLORS.TITLECOLOR,
      width: widthPercentageToDP('80%'),
      letterSpacing: 1,
    },
    subContainer: {
      backgroundColor: COLORS.PRIMARYWHITE,
      paddingHorizontal: widthPercentageToDP('4%'),
      paddingVertical: heightPercentageToDP('2%'),
      marginVertical: heightPercentageToDP('1%'),
      marginHorizontal: widthPercentageToDP('4%'),
      borderRadius: 10,
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
  });

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState([]);

  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (pageNumber) {
        await getList();
      }
    };
    fetchData();
  }, [pageNumber, item1]);

  const PAGE_SIZE = 20;

  const getList = () => {
    let data = {
      pageNumber: pageNumber,
      pageSize: PAGE_SIZE,
      keyword: type,
      eventId: item1 ? item1?.eventId : 0,
    };

    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setIsLoading(true);
        httpClient
          .post(`dashboard/drilldown`, data)
          .then(response => {
            if (response.data.status) {
              const totalRecords = response?.data?.totalRecord || 0;

              const calculatedTotalPages = Math.ceil(totalRecords / PAGE_SIZE);

              const newData = response?.data?.result;

              if (newData?.length > 0) {
                setData(newData);
              } else {
                setData([]);
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
    setOpenIndex(null);
    if (hasMore) {
      setPageNumber(prevPage => prevPage + 1);
    }
  };

  const [openIndex, setOpenIndex] = useState(null);

  const renderItem = ({item, index}) => {
    const number1 = (pageNumber - 1) * PAGE_SIZE + index + 1;
    const number = number1 <= 9 ? `0${number1}` : `${number1}`;

    const member = item['member'] || '-';
    const total = item['total'];

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
                if (key === 'member' || key === 'total') return null;

                let value = item[key];
                let isArray = false;

                if (typeof value === 'string' && value.trim().startsWith('[')) {
                  try {
                    const parsed = JSON.parse(value);
                    if (Array.isArray(parsed)) {
                      value = parsed;
                      isArray = true;
                    }
                  } catch (e) {
                    // Not a valid array, keep as string
                  }
                } else if (Array.isArray(value)) {
                  isArray = true;
                }

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
                      ]}>{`${key} :`}</Text>
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
                                    // ✅ Check if this nested key is a phone field
                                    const isNestedPhone = isPhoneField(k);

                                    // ✅ Format phone number if it's a phone field
                                    const displayValue =
                                      isNestedPhone && v
                                        ? formatPhoneToUS(v)
                                        : v || '-';

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

  const {isConnected, networkLoading} = useNetworkStatus();

  return (
    <View style={styles.container}>
      <CustomHeader
        leftIcon={
          <FontAwesome6
            name="angle-left"
            iconStyle="solid"
            size={26}
            color={COLORS.LABELCOLOR}
          />
        }
        title={title}
        leftOnPress={() => navigation.goBack()}
      />
      {networkLoading || isLoading ? (
        <Loader />
      ) : isConnected ? (
        <View style={{flex: 1}}>
          {data?.length > 0 ? (
            <View style={{flex: 1}}>
              <FlatList
                data={data}
                initialNumToRender={10}
                maxToRenderPerBatch={20}
                windowSize={10}
                removeClippedSubviews={true}
                keyExtractor={(item, index) => index?.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContainer}
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
              paddingVertical: heightPercentageToDP('0.5%'),
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
        </View>
      ) : (
        <Offline />
      )}
    </View>
  );
};

export default NameListScreen;
