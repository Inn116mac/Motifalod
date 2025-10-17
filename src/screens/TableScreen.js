import {
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
  Alert,
  FlatList,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import React, {useCallback, useEffect, useState} from 'react';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import Loader from '../components/root/Loader';
import COLORS from '../theme/Color';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import NetInfo from '@react-native-community/netinfo';
import CustomHeader from '../components/root/CustomHeader';
import FONTS from '../theme/Fonts';
import httpClient from '../connection/httpClient';
import NoDataFound from '../components/root/NoDataFound';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import {Feather} from '@react-native-vector-icons/feather';
import {AntDesign} from '@react-native-vector-icons/ant-design';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useNetworkStatus} from '../connection/UseNetworkStatus';
import {Entypo} from '@react-native-vector-icons/entypo';
import {capitalizeFirstLetter, NOTIFY_MESSAGE} from '../constant/Module';
import {getFileType} from '../utils/fileType';
import Offline from '../components/root/Offline';
import moment from 'moment';

const TableScreen = ({route}) => {
  const {item, isDashboard} = route?.params?.data;
  const styles = StyleSheet.create({
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 10,
      marginHorizontal: 10,
    },
    searchInput: {
      fontSize: FONTS.FONTSIZE.SEMIMINI,
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      color: COLORS.PRIMARYBLACK,
      paddingVertical: 0,
    },
    plusButton: {
      height: 40,
      width: 40,
      borderRadius: 20,
      backgroundColor: COLORS.LABELCOLOR,
      justifyContent: 'center',
      alignItems: 'center',
    },
    listContainer: {
      marginHorizontal: 10,
      borderRadius: 10,
      flexGrow: 1,
      paddingBottom: 10,
    },
    pkgLbl: {
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      fontSize: FONTS.FONTSIZE.SMALL,
      color: COLORS.PRIMARYBLACK,
    },
    titleText: {
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      fontSize: FONTS.FONTSIZE.MINI,
      color: COLORS.PRIMARYBLACK,
      width: '48%',
      marginRight: 4,
    },
    text: {
      width: '50%',
      textAlign: 'left',
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
      fontSize: FONTS.FONTSIZE.MINI,
      color: '#101827',
    },
    paginationText: {
      fontSize: FONTS.FONTSIZE.SMALL,
      color: 'blue',
      textAlign: 'center',
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    },
    loadMoreButton: {
      padding: 10,
      backgroundColor: COLORS.LABELCOLOR,
      alignItems: 'center',
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
    },
    loadMoreText: {
      color: COLORS.PRIMARYWHITE,
      fontSize: FONTS.FONTSIZE.MEDIUM,
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    },
    loadMoreButton: {
      padding: 10,
      backgroundColor: COLORS.LABELCOLOR,
      borderRadius: 5,
      alignItems: 'center',
    },
    loadMoreText: {
      color: COLORS.PRIMARYWHITE,
      fontSize: FONTS.FONTSIZE.MEDIUM,
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    },
    header: {
      backgroundColor: COLORS.TABLEROWCOLOR,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: COLORS.LIGHTGREY,
    },
    icon: {
      alignSelf: 'center',
      padding: 8,
    },
  });

  const [allUserData, setAllUserData] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  const navigation = useNavigation();

  const [pageNumber, setPageNumber] = useState(1);

  const [hasMore, setHasMore] = useState(true);
  const [openIndex, setOpenIndex] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    getViewData();
  }, [pageNumber, searchKeyword]);

  const PAGE_SIZE = 20;

  useFocusEffect(
    React.useCallback(() => {
      setPageNumber(1);
      setAllUserData([]);
      getViewData();
      setOpenIndex(null);
      return () => {};
    }, [getViewData]),
  );

  const getViewData = useCallback(() => {
    setIsLoading(true);
    let data = {
      pageNumber: pageNumber,
      pageSize: PAGE_SIZE,
      keyword: item?.constantName === 'FOOD TEAM' ? 'All' : '',
      orderBy: 'order',
      orderType: -1,
      type: item?.constantName,
      searchKeyword: searchKeyword,
    };

    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        httpClient
          .post(`module/mobile/configuration/pagination`, data)
          .then(response => {
            if (response.data.status) {
              const newData = response?.data?.result?.data;

              const totalRecords = response.data.result.totalRecord || 0;

              const calculatedTotalPages = Math.ceil(totalRecords / PAGE_SIZE);

              if (newData?.length > 0) {
                setAllUserData(newData);
              } else {
                setAllUserData([]);
              }
              const canLoadMore =
                pageNumber < calculatedTotalPages && newData.length > 0;
              setHasMore(canLoadMore);
            } else {
              NOTIFY_MESSAGE(response.data.message);
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
  }, [item, PAGE_SIZE, navigation, pageNumber, searchKeyword]);

  const [isLoading1, setIsLoading1] = useState(false);
  const {isConnected, networkLoading} = useNetworkStatus();

  const formatDate = dateString => {
    const originalFormats = [
      'MM/DD/YYYY HH:mm:ss',
      'MM/DD/YYYY h:mm:ss A',
      'MM/DD/YYYY h:mm:ss',
      'DD-MM-YYYY',
      'YYYY-MM-DDTHH:mm:ss[Z]',
      'MM/DD/YYYY',
      'DD/MM/YYYY',
      'MM-DD-YYYY',
    ];

    const isValidDate = originalFormats.some(format =>
      moment(dateString, format, true).isValid(),
    );

    if (isValidDate) {
      const date = moment(dateString, originalFormats, true).utc();
      return date.format('YYYY-MM-DDTHH:mm:ss[Z]');
    } else {
      const date = moment(dateString, originalFormats, true).utc();
      return date.format('YYYY-MM-DDTHH:mm:ss[Z]');
    }
  };

  const formattedTime = time => {
    const formatedtime = moment(time, 'HH:mm A').format('h:mm A');
    return formatedtime;
  };

  const handleDelete = item1 => {
    if (!item1?.configurationId) {
      NOTIFY_MESSAGE('Invalid item');
      return;
    }

    // Show confirmation dialog
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this Record?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Delete canceled'),
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: () => {
            setIsLoading1(true);
            httpClient
              .delete(`module/configuration/delete/${item1.configurationId}`)
              .then(response => {
                if (response.data.status === true) {
                  NOTIFY_MESSAGE(response.data.message);
                  // navigation.goBack();
                  // getViewData();
                  setAllUserData(prevList => {
                    const indexToDelete = prevList.findIndex(
                      item => item.configurationId === item1.configurationId,
                    );

                    if (indexToDelete !== -1) {
                      const newList = [...prevList]; // Create a copy
                      newList.splice(indexToDelete, 1); // Remove the item
                      return newList;
                    } else {
                      return prevList; // Item not found, return the original list
                    }
                  });
                } else {
                  NOTIFY_MESSAGE(response?.data?.message);
                }
              })
              .catch(error => {
                const errorMessage =
                  error?.response?.data?.message ||
                  error?.message ||
                  'Something Went Wrong';
                NOTIFY_MESSAGE(errorMessage);
              })
              .finally(() => {
                setIsLoading1(false); // Ensure loading state is reset
              });
          },
        },
      ],
      {cancelable: false}, // Prevent dismissing the alert by tapping outside
    );
  };

  const handleUpdate = item1 => {
    const parsedContent = JSON.parse(item1?.content);
    const memberValue = parsedContent?.member?.value || null;
    const memberId = parsedContent?.member?.values?.find(
      item => item.label === memberValue,
    );

    Alert.alert(
      'Confirm Edit',
      'Are you sure you want to Edit this Record?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Edit canceled'),
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: () => {
            let data = {
              item: item,
              isTabView: true,
              isEdit: true,
              editItem: item1,
              configurationId: memberId?.value,
            };
            setSearchKeyword('');
            navigation.navigate('Form', {data});
          },
        },
      ],
      {cancelable: false},
    );
  };

  const handleApprove = item1 => {
    Alert.alert(
      'Confirm Approval',
      `Are you sure you want to 'Approve' this User?`,
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Approval canceled'),
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: () => {
            const data = JSON.stringify({
              memberId: item1?.configurationId,
              isApproved: 'Yes',
            });
            setIsLoading1(true);
            httpClient
              .put('member/approvereject', data)
              .then(response => {
                if (response.data.status === true) {
                  NOTIFY_MESSAGE(response.data.message);
                  // getViewData();
                  setAllUserData(prevList =>
                    prevList.map(item =>
                      item.configurationId === item1.configurationId
                        ? {
                            ...item,
                            content: JSON.stringify({
                              ...JSON.parse(item.content), // Parse the content
                              isApproved: {
                                ...JSON.parse(item.content).isApproved, // Keep other isApproved properties
                                value: 'Yes', // Update the value
                              },
                            }),
                          }
                        : item,
                    ),
                  );
                } else {
                  NOTIFY_MESSAGE(response.data.message);
                }
              })
              .catch(error => {
                NOTIFY_MESSAGE(error?.message || 'Something Went Wrong');
              })
              .finally(() => {
                setIsLoading1(false);
              });
          },
        },
      ],
      {cancelable: false},
    );
  };

  const handleReject = item1 => {
    Alert.alert(
      'Confirm Rejection',
      `Are you sure you want to 'Not Approve' this User?`,
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Rejection canceled'),
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: () => {
            const data = JSON.stringify({
              memberId: item1?.configurationId,
              isApproved: 'No',
            });
            setIsLoading1(true);
            httpClient
              .put('member/approvereject', data)
              .then(response => {
                if (response.data.status === true) {
                  NOTIFY_MESSAGE(response.data.message);
                  setAllUserData(prevList =>
                    prevList.map(item =>
                      item.configurationId === item1.configurationId
                        ? {
                            ...item,
                            content: JSON.stringify({
                              ...JSON.parse(item.content),
                              isApproved: {
                                ...JSON.parse(item.content).isApproved,
                                value: 'No',
                              },
                            }),
                          }
                        : item,
                    ),
                  );
                } else {
                  NOTIFY_MESSAGE(response.data.message);
                }
              })
              .catch(error => {
                NOTIFY_MESSAGE(error?.message || 'Something Went Wrong');
              })
              .finally(() => {
                setIsLoading1(false);
              });
          },
        },
      ],
      {cancelable: false},
    );
  };

  function getValidValue(
    keys,
    content,
    skipTypes = ['header', 'hidden', 'button', 'autocomplete', 'section'],
  ) {
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const field = content[key];
      if (!field || skipTypes.includes(field.type)) continue;

      let value = field.value;
      if (typeof value === 'string') {
        try {
          const arr = JSON.parse(value);
          if (Array.isArray(arr)) value = arr;
        } catch {}
      }
      if (Array.isArray(value)) {
        return value.length > 0 ? value[0] : '-';
      }
      return value !== undefined && value !== null && value !== ''
        ? value
        : '-';
    }
    return '-';
  }

  function removeContentPrefix(value) {
    if (typeof value === 'string') {
      return value.replace(/^content\//, '');
    }
    return value;
  }

  const renderItem = ({item: item1, index}) => {
    const number1 = (pageNumber - 1) * PAGE_SIZE + index + 1;
    const number = number1 <= 9 ? `0${number1}` : `${number1}`;

    const content = JSON.parse(item1.content);

    const keys = JSON.parse(item1.keys);

    const firstValue = getValidValue(keys.slice(0, 2), content);

    let firstUsedKeyIndex = -1;
    for (let i = 0; i < 2; i++) {
      const field = content[keys[i]];
      if (
        field &&
        !['header', 'hidden', 'button', 'autocomplete', 'section'].includes(
          field.type,
        )
      ) {
        firstUsedKeyIndex = i;
        break;
      }
    }

    const secondValue = getValidValue(
      keys.slice(firstUsedKeyIndex + 1),
      content,
    );

    const handleToggle = idx => {
      setOpenIndex(openIndex === idx ? null : idx);
    };

    const isApproved = item1?.content
      ? JSON.parse(item1.content)?.isApproved?.value?.toLowerCase()
      : null;

    return (
      <View
        style={{
          backgroundColor: COLORS.PRIMARYWHITE,
          flex: 1,
          overflow: 'hidden',
          borderRadius: 10,
          marginVertical: 8,
        }}
        key={index}>
        <View
          style={{
            padding: 8,
          }}>
          <TouchableOpacity
            onPress={() => handleToggle(index)}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                flex: 1,
              }}>
              <View
                style={{
                  backgroundColor: COLORS.LABELCOLOR,
                  maxWidth: '30%',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: 10,
                  padding: 6,
                }}>
                <Text style={[styles.pkgLbl, {color: COLORS.PRIMARYWHITE}]}>
                  {number}
                </Text>
              </View>

              <View style={{flex: 1}}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
                    fontSize: FONTS.FONTSIZE.SEMIMINI,
                    color: COLORS.PLACEHOLDERCOLOR,
                  }}>
                  {firstValue ? removeContentPrefix(firstValue) : '-'}{' '}
                  {item?.constantName === 'SIGN UP' && secondValue
                    ? secondValue
                    : ''}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                    fontSize: FONTS.FONTSIZE.MINI,
                    color:
                      item?.constantName === 'SIGN UP' && isApproved == 'yes'
                        ? COLORS.PRIMARYGREEN
                        : item?.constantName === 'SIGN UP' && isApproved == 'no'
                        ? COLORS.PRIMARYRED
                        : COLORS.PLACEHOLDERCOLOR,
                  }}>
                  {item?.constantName !== 'SIGN UP' && secondValue
                    ? removeContentPrefix(secondValue)
                    : ''}
                  {item?.constantName === 'SIGN UP' && isApproved == 'yes'
                    ? 'Approved'
                    : item?.constantName === 'SIGN UP' && isApproved == 'no'
                    ? 'Not Approved'
                    : ''}
                </Text>
              </View>
            </View>

            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
              {!isDashboard && item?.write == true && (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    gap: 14,
                    paddingHorizontal: 2,
                  }}>
                  {item?.constantName === 'SIGN UP' && (
                    <>
                      {isApproved == 'no' && (
                        <TouchableOpacity
                          disabled={isLoading1}
                          activeOpacity={0.35}
                          onPress={() => handleApprove(item1)}>
                          <Entypo name="check" size={18} color={'green'} />
                        </TouchableOpacity>
                      )}

                      {isApproved == 'yes' && (
                        <TouchableOpacity
                          disabled={isLoading1}
                          activeOpacity={0.35}
                          onPress={() => handleReject(item1)}>
                          <MaterialDesignIcons
                            name="cancel"
                            size={18}
                            color={'red'}
                          />
                        </TouchableOpacity>
                      )}
                    </>
                  )}

                  <TouchableOpacity onPress={() => handleUpdate(item1)}>
                    <Feather name="edit" size={18} color={'#007bff'} />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => handleDelete(item1)}>
                    <AntDesign name="delete" size={18} color={'red'} />
                  </TouchableOpacity>
                </View>
              )}
              <AntDesign
                name={openIndex === index ? 'up' : 'down'}
                size={16}
                color={COLORS.LABELCOLOR}
              />
            </View>
          </TouchableOpacity>
        </View>

        {openIndex === index && (
          <View
            key={index.toString()}
            style={{
              paddingHorizontal: 8,
            }}>
            <View style={{gap: 4}}>
              {keys.map(key => {
                const field = content[key];
                if (
                  !field ||
                  [
                    'button',
                    'hidden',
                    'header',
                    'autocomplete',
                    'section',
                  ].includes(field?.type)
                ) {
                  return null;
                }

                let value = field.value;
                let isArray = false;
                let parsedArray = [];

                if (typeof value === 'string') {
                  try {
                    const possibleArray = JSON.parse(value);
                    if (Array.isArray(possibleArray)) {
                      isArray = true;
                      parsedArray = possibleArray;
                    }
                  } catch {}
                } else if (Array.isArray(value)) {
                  isArray = true;
                  parsedArray = value;
                }

                // If the value is an object (but not null/array), show its key-value pairs
                const isObject =
                  typeof value === 'object' &&
                  value !== null &&
                  !Array.isArray(value);

                return (
                  <View
                    style={{
                      flexDirection: isArray ? 'column' : 'row',
                      marginBottom: 4,
                      alignItems: isArray ? 'flex-start' : 'center',
                    }}
                    key={key}>
                    <Text style={[styles.titleText]}>
                      {capitalizeFirstLetter(field.label || key)} :
                    </Text>
                    {isArray ? (
                      <View style={{marginTop: 2, width: '99%'}}>
                        {parsedArray.length === 0 ? (
                          <Text style={styles.text}>-</Text>
                        ) : (
                          parsedArray.map((arrItem, arrIdx) => (
                            <View
                              key={arrIdx}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'flex-start',
                                marginBottom: 2,
                              }}>
                              <Text
                                style={{
                                  fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
                                  fontSize: FONTS.FONTSIZE.MINI,
                                  color: COLORS.PRIMARYBLACK,
                                  marginRight: 4,
                                }}>
                                {arrIdx + 1}.
                              </Text>
                              {typeof arrItem === 'object' &&
                              arrItem !== null ? (
                                <View
                                  style={{
                                    flexDirection: 'row',
                                    flexWrap: 'wrap',
                                  }}>
                                  {Object.entries(arrItem).map(([k, v], i) => (
                                    <Text key={i} style={styles.text}>
                                      {k} : {v}{' '}
                                    </Text>
                                  ))}
                                </View>
                              ) : field?.type == 'file' ? (
                                <TouchableOpacity
                                  onPress={() => {
                                    if (getFileType(arrItem) === 'image') {
                                      navigation.navigate('FullImageScreen', {
                                        image: arrItem,
                                      });
                                    } else if (
                                      getFileType(arrItem) === 'video'
                                    ) {
                                      navigation.navigate(
                                        'VideoGalleryVideoScreen',
                                        {
                                          videoData: arrItem,
                                        },
                                      );
                                    }
                                  }}>
                                  <Text
                                    style={{
                                      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                                      fontSize: FONTS.FONTSIZE.MINI,
                                      color: COLORS.TITLECOLOR,
                                    }}>
                                    {arrItem ? arrItem?.split('/')[1] : ''}
                                  </Text>
                                </TouchableOpacity>
                              ) : (
                                <Text
                                  style={{
                                    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
                                    fontSize: FONTS.FONTSIZE.MINI,
                                    color: COLORS.PRIMARYBLACK,
                                  }}>
                                  {arrItem}
                                </Text>
                              )}
                            </View>
                          ))
                        )}
                      </View>
                    ) : isObject ? (
                      <View style={{flexDirection: 'column', marginLeft: 8}}>
                        {Object.entries(value).map(([k, v], i) => (
                          <Text key={i} style={styles.text}>
                            {k}: {v}
                          </Text>
                        ))}
                      </View>
                    ) : (
                      <Text
                        onPress={() => {
                          if (field?.type == 'file') {
                            if (getFileType(value) === 'image') {
                              navigation.navigate('FullImageScreen', {
                                image: value,
                              });
                            } else if (getFileType(value) === 'video') {
                              navigation.navigate('VideoGalleryVideoScreen', {
                                videoData: value,
                              });
                            }
                          }
                        }}
                        style={{
                          fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
                          fontSize: FONTS.FONTSIZE.MINI,
                          color:
                            field?.type == 'file'
                              ? COLORS.TITLECOLOR
                              : COLORS.PRIMARYBLACK,
                          width: '50%',
                          textAlign: 'left',
                        }}>
                        {value !== null && value !== undefined && value !== ''
                          ? field.type == 'date'
                            ? moment(formatDate(value)).format('DD MMMM YYYY')
                            : field.type == 'time'
                            ? formattedTime(value)
                            : value
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

  const loadMore = () => {
    setOpenIndex(null);
    if (hasMore) {
      setPageNumber(prevPage => prevPage + 1);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{flex: 1, backgroundColor: COLORS.BACKGROUNDCOLOR}}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
      <CustomHeader
        leftOnPress={() => {
          navigation.goBack();
        }}
        leftIcon={
          <FontAwesome6
            name="angle-left"
            iconStyle="solid"
            size={26}
            color={COLORS.LABELCOLOR}
          />
        }
        title={item?.name}
      />
      <View style={styles.headerContainer}>
        <View style={{flex: 1}}>
          <View
            style={{
              flex: 1,
              borderRadius: 20,
              backgroundColor: COLORS.PRIMARYWHITE,
              paddingHorizontal: 10,
              marginRight: 10,
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#ebedf0',
            }}>
            <TextInput
              placeholder="Search..."
              value={searchKeyword}
              onChangeText={setSearchKeyword}
              style={[styles.searchInput, {flex: 1}]}
              returnKeyType="search"
              placeholderTextColor={COLORS.grey500}
            />
            {searchKeyword.length > 0 && (
              <TouchableOpacity onPress={() => setSearchKeyword('')} style={{}}>
                <AntDesign
                  name="close-circle"
                  size={20}
                  color={COLORS.grey500}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
        {item?.write && (
          <TouchableOpacity
            onPress={() => {
              let data = {
                item: item,
                isTabView: true,
                isFromEventAdmin: true,
              };
              if (item?.constantName === 'FAMILY MEMBER') {
                navigation.navigate('Registration1', {data});
              } else {
                navigation.navigate('Form', {data});
              }
            }}
            style={styles.plusButton}
            activeOpacity={0.7}>
            <AntDesign name="plus" size={22} color={COLORS.PRIMARYWHITE} />
          </TouchableOpacity>
        )}
      </View>
      {isLoading || isLoading1 ? (
        <Loader />
      ) : isConnected ? (
        <View style={{flex: 1}}>
          {allUserData?.length > 0 ? (
            <FlatList
              data={allUserData}
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
        </View>
      ) : (
        <Offline />
      )}
    </KeyboardAvoidingView>
  );
};

export default TableScreen;
