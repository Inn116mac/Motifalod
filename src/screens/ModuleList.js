import {
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
  Alert,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
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
import {Feather} from '@react-native-vector-icons/feather';
import {AntDesign} from '@react-native-vector-icons/ant-design';
import {useNetworkStatus} from '../connection/UseNetworkStatus';
import {capitalizeFirstLetter, NOTIFY_MESSAGE} from '../constant/Module';
import Offline from '../components/root/Offline';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import FastImage from 'react-native-fast-image';
import {IMAGE_URL} from '../connection/Config';

const ModuleList = ({route}) => {
  const {item} = route?.params?.data;

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
    paginationText: {
      fontSize: FONTS.FONTSIZE.SMALL,
      color: 'blue',
      textAlign: 'center',
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    },
  });

  const [allUserData, setAllUserData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const navigation = useNavigation();
  const PAGE_SIZE = 20;

  const [openIndex, setOpenIndex] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isReresh, setIsRefresh] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const loadMore = () => {
    setOpenIndex(null);
    if (hasMore) {
      setPageNumber(prevPage => prevPage + 1);
    }
  };

  const handleRefresh = async () => {
    setIsRefresh(true);
    setSearchKeyword('');
    if (pageNumber !== 1) {
      setPageNumber(1);
    } else {
      await getViewData();
    }
    setIsRefresh(false);
  };

  useEffect(() => {
    filterLocalData();
  }, [searchKeyword, allUserData]);

  const filterLocalData = () => {
    if (!searchKeyword || searchKeyword.trim() === '') {
      setFilteredData(allUserData);
    } else {
      const keyword = searchKeyword.toLowerCase().trim();
      const filtered = allUserData.filter(item => {
        const name = item?.name?.toLowerCase() || '';
        return name.includes(keyword);
      });
      setFilteredData(filtered);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setRefreshTrigger(prev => prev + 1);
      setOpenIndex(null);
      return () => {};
    }, []),
  );

  useEffect(() => {
    if (refreshTrigger === 0 && pageNumber === 1) {
      return;
    }
    getViewData();
  }, [pageNumber, refreshTrigger]);

  const getViewData = useCallback(() => {
    const payload = {
      pageNumber: pageNumber,
      pageSize: PAGE_SIZE,
      keyword: '',
      orderBy: 'order',
      orderType: -1,
    };

    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setIsLoading(true);
        httpClient
          .post(`module/pagination`, payload)
          .then(response => {
            if (response.data.status) {
              const totalRecords = response.data?.result?.totalRecord;
              const calculatedTotalPages = Math.ceil(totalRecords / PAGE_SIZE);

              const newData = response.data.result?.data;

              if (newData?.length > 0) {
                setAllUserData(newData);
                setFilteredData(newData);
              } else {
                setAllUserData([]);
                setFilteredData([]);
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
  }, [item, PAGE_SIZE, navigation, pageNumber]);

  const [isLoading1, setIsLoading1] = useState(false);
  const {isConnected, networkLoading} = useNetworkStatus();

  const handleDelete = item1 => {
    if (!item1?.moduleId) {
      NOTIFY_MESSAGE('Invalid item');
      return;
    }
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
              .delete(`module/delete/${item1.moduleId}`)
              .then(response => {
                if (response.data.status === true) {
                  NOTIFY_MESSAGE(response.data.message);
                  setAllUserData(prevList => {
                    const indexToDelete = prevList.findIndex(
                      item => item.moduleId === item1.moduleId,
                    );

                    if (indexToDelete !== -1) {
                      const newList = [...prevList];
                      newList.splice(indexToDelete, 1);
                      return newList;
                    } else {
                      return prevList;
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
                setIsLoading1(false);
              });
          },
        },
      ],
      {cancelable: false},
    );
  };

  const handleUpdate = item1 => {
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
              isEdit: true,
              editItem: item1,
            };
            setSearchKeyword('');
            navigation.navigate('AddUpdateModule', {data});
          },
        },
      ],
      {cancelable: false},
    );
  };

  const handleToggle = idx => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  const formatBooleanValue = value => {
    if (value === 1 || value === '1') return 'true';
    if (value === 0 || value === '0') return 'false';
    return String(value || '-');
  };

  const renderItem = ({item: item1, index}) => {
    const number1 = (pageNumber - 1) * PAGE_SIZE + index + 1;
    const number = number1 <= 9 ? `0${number1}` : `${number1}`;
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
                  {item1?.name ? item1?.name : '-'}
                </Text>
              </View>
            </View>

            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  gap: 14,
                  paddingHorizontal: 2,
                }}>
                <TouchableOpacity onPress={() => handleUpdate(item1)}>
                  <Feather name="edit" size={18} color={'#007bff'} />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleDelete(item1)}>
                  <AntDesign name="delete" size={18} color={'red'} />
                </TouchableOpacity>
              </View>
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
              paddingBottom: 8,
            }}>
            <View
              style={{
                padding: 10,
                borderRadius: 8,
                gap: 4,
              }}>
              {Object.entries(item1)
                .filter(
                  ([key]) =>
                    ![
                      'moduleId',
                      'write',
                      'read',
                      'configuration',
                      'default',
                      'createdAt',
                      'updatedAt',
                    ].includes(key),
                )
                .map(([key, value]) => {
                  const isImageField = key === 'imageUrl' || key === 'icon';
                  const isBooleanField =
                    key === 'isMobileDashboard' || key === 'deleteStatus';
                  const displayValue = isBooleanField
                    ? formatBooleanValue(value)
                    : value !== null && value !== undefined && value !== ''
                    ? String(value)
                    : '-';

                  return (
                    <View
                      key={key}
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}>
                      <Text style={styles.titleText}>
                        {capitalizeFirstLetter(key)}:
                      </Text>
                      <View style={{width: '50%', textAlign: 'left'}}>
                        {isImageField && value ? (
                          <TouchableOpacity
                            onPress={() =>
                              navigation.navigate('FullImageScreen', {
                                image: value,
                              })
                            }>
                            <FastImage
                              source={{uri: IMAGE_URL + value}}
                              style={{height: 30, width: 30}}
                              resizeMode="contain"
                            />
                          </TouchableOpacity>
                        ) : (
                          <Text
                            style={{
                              fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
                              fontSize: FONTS.FONTSIZE.MINI,
                              color: COLORS.PRIMARYBLACK,
                            }}>
                            {displayValue}
                          </Text>
                        )}
                      </View>
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
    <KeyboardAvoidingView
      style={{flex: 1, backgroundColor: COLORS.BACKGROUNDCOLOR}}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <CustomHeader
        leftOnPress={() => {
          navigation.goBack();
        }}
        leftIcon={
          <FontAwesome6
            name="angle-left"
            size={26}
            color={COLORS.LABELCOLOR}
            iconStyle="solid"
          />
        }
        title={item?.name || 'Membership Management'}
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
        <TouchableOpacity
          onPress={() => {
            let data = {
              item: item,
              isTabView: true,
              isFromEventAdmin: true,
            };

            navigation.navigate('AddUpdateModule', {data});
          }}
          style={styles.plusButton}
          activeOpacity={0.7}>
          <AntDesign name="plus" size={22} color={COLORS.PRIMARYWHITE} />
        </TouchableOpacity>
      </View>
      {isLoading || isLoading1 ? (
        <Loader />
      ) : isConnected ? (
        <View style={{flex: 1}}>
          {filteredData?.length > 0 ? (
            <FlatList
              data={filteredData}
              initialNumToRender={10}
              maxToRenderPerBatch={20}
              windowSize={10}
              removeClippedSubviews={true}
              keyExtractor={(item, index) => index?.toString()}
              renderItem={renderItem}
              contentContainerStyle={styles.listContainer}
              refreshControl={
                <RefreshControl
                  onRefresh={handleRefresh}
                  refreshing={isReresh}
                />
              }
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

export default ModuleList;
