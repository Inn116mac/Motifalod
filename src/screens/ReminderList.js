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
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import {Feather} from '@react-native-vector-icons/feather';
import {AntDesign} from '@react-native-vector-icons/ant-design';
import {useNetworkStatus} from '../connection/UseNetworkStatus';
import {NOTIFY_MESSAGE} from '../constant/Module';
import Offline from '../components/root/Offline';

const ReminderList = ({route}) => {
  const {item} = route?.params?.data;

  //styles
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
    paginationText: {
      fontSize: FONTS.FONTSIZE.SMALL,
      color: 'blue',
      textAlign: 'center',
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    },
  });

  const [allUserData, setAllUserData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoading1, setIsLoading1] = useState(false);
  const {isConnected, networkLoading} = useNetworkStatus();
  const PAGE_SIZE = 20;

  useEffect(() => {
    if (refreshTrigger == 0 && pageNumber == 1) {
      return;
    }
    getViewData();
  }, [pageNumber, refreshTrigger, getViewData]);

  useFocusEffect(
    useCallback(() => {
      setRefreshTrigger(prev => prev + 1);
      return () => {};
    }, []),
  );

  // get remider lists
  const getViewData = useCallback(() => {
    let data = {
      pageNumber: pageNumber,
      pageSize: PAGE_SIZE,
    };

    NetInfo.fetch().then(state => {
      setIsLoading(true);
      if (state.isConnected) {
        httpClient
          .post(`reminder/pagination`, data)
          .then(response => {
            if (response.data.status) {
              const newData = response?.data?.result?.data;

              const totalCount = response.data.result.totalRecord || 0;

              const calculatedTotalPages = Math.ceil(totalCount / PAGE_SIZE);

              if (newData?.length > 0) {
                setAllUserData(newData);
                setFilteredData(newData);
              } else {
                setAllUserData([]);
                setFilteredData([]);
              }
              setTotalPages(calculatedTotalPages);
              setTotalRecords(totalCount);
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
            setRefreshing(false);
          });
      } else {
        NOTIFY_MESSAGE('Please check your internet connectivity');
      }
    });
  }, [pageNumber, PAGE_SIZE, navigation]);

  useEffect(() => {
    filterLocalData();
  }, [searchKeyword, allUserData]);

  // filter searching data
  const filterLocalData = () => {
    if (!searchKeyword || searchKeyword.trim() === '') {
      setFilteredData(allUserData);
    } else {
      const keyword = searchKeyword.toLowerCase().trim();
      const filtered = allUserData.filter(item => {
        const moduleName = item?.moduleName?.toLowerCase() || '';
        return moduleName.includes(keyword);
      });
      setFilteredData(filtered);
    }
  };

  // delete record
  const handleDelete = item1 => {
    if (!item1?.reminderId) {
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
              .delete(`reminder/delete/${item1.reminderId}`)
              .then(response => {
                if (response.data.status === true) {
                  NOTIFY_MESSAGE(response.data.message);
                  setAllUserData(prevList => {
                    const indexToDelete = prevList.findIndex(
                      item => item.reminderId === item1.reminderId,
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

  // update record
  const handleUpdate = item1 => {
    Alert.alert(
      'Confirm Edit',
      'Are you sure you want to edit this Record?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Edit canceled'),
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('AddUpdateReminder', {
              data: item1,
              isEdit: true,
            });
          },
        },
      ],
      {cancelable: false},
    );
  };

  //display data
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
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
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
                  {item1?.moduleName}
                </Text>
                {item1?.dataName && (
                  <Text
                    numberOfLines={1}
                    style={{
                      fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
                      fontSize: FONTS.FONTSIZE.SEMIMINI,
                      color: COLORS.PLACEHOLDERCOLOR,
                    }}>
                    {item1?.dataName}
                  </Text>
                )}
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
                    fontSize: FONTS.FONTSIZE.SEMIMINI,
                    color: COLORS.PLACEHOLDERCOLOR,
                  }}>
                  {item1?.reminderBefore} {item1?.reminderType} Before
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
            </View>
          </View>
        </View>
      </View>
    );
  };

  //refresh data
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setSearchKeyword('');
    if (pageNumber !== 1) {
      setPageNumber(1);
    } else {
      getViewData();
    }
  }, [PAGE_SIZE, pageNumber, getViewData]);

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
        title={item?.name}
      />
      <View style={styles.headerContainer}>
        <View style={{flex: 1}}>
          <View
            style={{
              borderRadius: 20,
              backgroundColor: COLORS.PRIMARYWHITE,
              paddingHorizontal: 10,
              marginRight: 10,
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#ebedf0',
              height: 40,
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
            };
            {
              navigation.navigate('AddUpdateReminder', {data, isEdit: false});
            }
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
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            />
          ) : (
            <NoDataFound />
          )}
          {totalPages > 1 && !searchKeyword && (
            <View
              style={{
                paddingVertical: heightPercentageToDP('1%'),
                paddingHorizontal: widthPercentageToDP('4%'),
                backgroundColor: COLORS.PRIMARYWHITE,
              }}>
              <Text
                style={{
                  textAlign: 'center',
                  fontSize: FONTS.FONTSIZE.MINI,
                  fontFamily: FONTS.FONT_FAMILY.REGULAR,
                  color: COLORS.PLACEHOLDERCOLOR,
                  marginBottom: 8,
                }}>
                Page {pageNumber} of {totalPages} • {totalRecords} records
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                  gap: 6,
                }}>
                <TouchableOpacity
                  disabled={pageNumber === 1}
                  onPress={() => setPageNumber(p => Math.max(p - 1, 1))}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor:
                      pageNumber === 1 ? COLORS.LIGHTGREY : COLORS.LABELCOLOR,
                  }}>
                  <AntDesign name="left" size={14} color={COLORS.PRIMARYWHITE} />
                </TouchableOpacity>
                {Array.from({length: totalPages}, (_, i) => i + 1)
                  .filter(p => {
                    if (totalPages <= 5) return true;
                    return (
                      p === 1 ||
                      p === totalPages ||
                      Math.abs(p - pageNumber) <= 1
                    );
                  })
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    p === '...' ? (
                      <Text
                        key={`ellipsis-${idx}`}
                        style={{
                          fontSize: FONTS.FONTSIZE.SMALL,
                          color: COLORS.PLACEHOLDERCOLOR,
                          paddingHorizontal: 2,
                        }}>
                        ...
                      </Text>
                    ) : (
                      <TouchableOpacity
                        key={p}
                        onPress={() => setPageNumber(p)}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 17,
                          justifyContent: 'center',
                          alignItems: 'center',
                          backgroundColor:
                            p === pageNumber
                              ? COLORS.LABELCOLOR
                              : COLORS.PRIMARYWHITE,
                          borderWidth: 1,
                          borderColor: COLORS.LABELCOLOR,
                        }}>
                        <Text
                          style={{
                            fontSize: FONTS.FONTSIZE.MINI,
                            fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                            color:
                              p === pageNumber
                                ? COLORS.PRIMARYWHITE
                                : COLORS.LABELCOLOR,
                          }}>
                          {p}
                        </Text>
                      </TouchableOpacity>
                    ),
                  )}
                <TouchableOpacity
                  disabled={pageNumber === totalPages}
                  onPress={() => setPageNumber(p => Math.min(p + 1, totalPages))}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor:
                      pageNumber === totalPages
                        ? COLORS.LIGHTGREY
                        : COLORS.LABELCOLOR,
                  }}>
                  <AntDesign
                    name="right"
                    size={14}
                    color={COLORS.PRIMARYWHITE}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      ) : (
        <Offline />
      )}
    </KeyboardAvoidingView>
  );
};

export default ReminderList;
