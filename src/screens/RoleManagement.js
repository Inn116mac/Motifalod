import {
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
  FlatList,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  RefreshControl,
  Alert,
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
import {AntDesign} from '@react-native-vector-icons/ant-design';
import {useNetworkStatus} from '../connection/UseNetworkStatus';
import {NOTIFY_MESSAGE} from '../constant/Module';
import Offline from '../components/root/Offline';
import {Feather} from '@react-native-vector-icons/feather';

const RoleManagement = ({route}) => {
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
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isLoading1, setIsLoading1] = useState(false);

  const {isConnected, networkLoading} = useNetworkStatus();

  const PAGE_SIZE = 20;

  // Initial data fetch on focus
  useFocusEffect(
    useCallback(() => {
      setPageNumber(1);
      setSearchKeyword('');
      getViewData();
      return () => {};
    }, []),
  );

  // Fetch data on page change only
  useEffect(() => {
    getViewData();
  }, [pageNumber]);

  // Handle search filtering locally
  useEffect(() => {
    filterLocalData();
  }, [searchKeyword, allUserData]);

  const filterLocalData = () => {
    if (!searchKeyword || searchKeyword.trim() === '') {
      setFilteredData(allUserData);
    } else {
      const keyword = searchKeyword.toLowerCase().trim();
      const filtered = allUserData.filter(item => {
        const roleName = item?.roleName?.toLowerCase() || '';
        return roleName.includes(keyword);
      });
      setFilteredData(filtered);
    }
  };

  const handleDelete = item1 => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this Role?',
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
              .delete(`role/delete/${item1.roleId}`)
              .then(response => {
                if (response.data.status === true) {
                  NOTIFY_MESSAGE(response.data.message);
                  setAllUserData(prevList =>
                    prevList.filter(item => item.roleId !== item1.roleId),
                  );
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
      `Are you sure you want to edit "${item1.roleName}" role?`,
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Edit canceled'),
          style: 'cancel',
        },
        {
          text: 'Edit',
          onPress: () => {
            let data = {
              item: item,
              editItem: item1,
              isEdit: true,
            };
            navigation.navigate('AddRole', {data});
          },
        },
      ],
      {cancelable: true}, // User can tap outside to cancel
    );
  };

  const getViewData = useCallback(() => {
    setIsLoading(true);
    let data = {
      pageNumber: pageNumber,
      pageSize: PAGE_SIZE,
      keyword: '',
      orderBy: 'FirstName',
      orderType: -1,
    };

    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        httpClient
          .post(`role/pagination`, data)
          .then(response => {
            if (response.data.status) {
              const newData = response?.data?.result?.data;
              const totalRecords = response.data.result.totalRecord || 0;
              const calculatedTotalPages = Math.ceil(totalRecords / PAGE_SIZE);

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
  }, [pageNumber, PAGE_SIZE, navigation]);

  const renderItem = ({item: item1, index}) => {
    const originalIndex = allUserData.findIndex(
      dataItem => dataItem?.roleId === item1?.roleId,
    );
    const number1 = (pageNumber - 1) * PAGE_SIZE + originalIndex + 1;
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
                  {item1?.roleName || '-'}
                </Text>
              </View>
            </View>

            {item1?.roleName !== 'Super Admin' && (
              <View
                style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
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
            )}
          </View>
        </View>
      </View>
    );
  };

  const loadMore = () => {
    if (hasMore && !searchKeyword) {
      setPageNumber(prevPage => prevPage + 1);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPageNumber(1);
    setSearchKeyword('');

    let data = {
      pageNumber: 1,
      pageSize: PAGE_SIZE,
      keyword: '',
      orderBy: 'FirstName',
      orderType: -1,
    };

    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        httpClient
          .post(`role/pagination`, data)
          .then(response => {
            if (response.data.status) {
              const newData = response?.data?.result?.data;
              const totalRecords = response.data.result.totalRecord || 0;
              const calculatedTotalPages = Math.ceil(totalRecords / PAGE_SIZE);

              if (newData?.length > 0) {
                setAllUserData(newData);
                setFilteredData(newData);
              } else {
                setAllUserData([]);
                setFilteredData([]);
              }

              const canLoadMore =
                1 < calculatedTotalPages && newData.length > 0;
              setHasMore(canLoadMore);
            } else {
              NOTIFY_MESSAGE(response.data.message);
            }
          })
          .catch(error => {
            NOTIFY_MESSAGE(
              error || error.message ? 'Something Went Wrong' : null,
            );
          })
          .finally(() => {
            setRefreshing(false);
          });
      } else {
        NOTIFY_MESSAGE('Please check your internet connectivity');
        setRefreshing(false);
      }
    });
  }, [PAGE_SIZE]);

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
            size={26}
            color={COLORS.LABELCOLOR}
            iconStyle="solid"
          />
        }
        title={item?.name || 'Role Management'}
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
              <TouchableOpacity onPress={() => setSearchKeyword('')}>
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
            navigation.navigate('AddRole', {data});
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
          {!searchKeyword && (
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
                    setPageNumber(prevPage => Math.max(prevPage - 1, 1));
                  }}>
                  <Text style={styles.paginationText}>Previous</Text>
                </TouchableOpacity>
              )}
              {hasMore && (
                <TouchableOpacity onPress={loadMore}>
                  <Text style={styles.paginationText}>Load More</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      ) : (
        <Offline />
      )}
    </KeyboardAvoidingView>
  );
};

export default RoleManagement;
