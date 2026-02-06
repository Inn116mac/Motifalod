import {
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Alert,
  RefreshControl,
} from 'react-native';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import Loader from '../components/root/Loader';
import COLORS from '../theme/Color';
import CustomHeader from '../components/root/CustomHeader';
import FONTS from '../theme/Fonts';
import NoDataFound from '../components/root/NoDataFound';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {Feather} from '@react-native-vector-icons/feather';
import {AntDesign} from '@react-native-vector-icons/ant-design';
import {Ionicons} from '@react-native-vector-icons/ionicons';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useNetworkStatus} from '../connection/UseNetworkStatus';
import Offline from '../components/root/Offline';
import moment from 'moment';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import NetInfo from '@react-native-community/netinfo';
import httpClient from '../connection/httpClient';
import {NOTIFY_MESSAGE} from '../constant/Module';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import {Dropdown} from 'react-native-element-dropdown';

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};
const Transactions = ({route}) => {
  const {item} = route?.params?.data;

  const styles = StyleSheet.create({
    dropdown: {
      height: 34,
      borderWidth: 1,
      borderRadius: 12,
      backgroundColor: COLORS.PRIMARYWHITE,
      paddingHorizontal: 10,
      justifyContent: 'center',
      borderColor: COLORS.INPUTBORDER,
    },
    placeholderStyle: {
      fontSize: FONTS.FONTSIZE.MINI,
      color: COLORS.PLACEHOLDERCOLOR,
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
    },
    selectedTextStyle: {
      fontSize: FONTS.FONTSIZE.MINI,
      color: COLORS.PRIMARYBLACK,
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
    },
    itemContainer: {
      paddingVertical: 2,
      paddingHorizontal: 10,
    },
    itemText: {
      color: COLORS.PRIMARYBLACK,
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      fontSize: FONTS.FONTSIZE.SMALL,
    },
    paginationText: {
      fontSize: FONTS.FONTSIZE.SMALL,
      color: 'blue',
      textAlign: 'center',
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    },
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
    listContainer: {
      marginHorizontal: 10,
      borderRadius: 10,
      flexGrow: 1,
      paddingBottom: 20,
      marginVertical: 10,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#333',
    },
    filterBtn: {
      flexDirection: 'row',
      gap: 6,
      alignItems: 'center',
    },
    filterText: {
      fontSize: FONTS.FONTSIZE.MINI,
      color: COLORS.PRIMARYBLACK,
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
      includeFontPadding: false,
    },
    resultsText: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    resultsCount: {
      fontSize: 14,
      color: '#666',
    },
    clearFiltersText: {
      fontSize: 14,
      color: '#2196F3',
      fontWeight: '500',
    },
    transactionCard: {
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 10,
      marginBottom: 10,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    orderId: {
      fontSize: FONTS.FONTSIZE.MINI,
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
      color: COLORS.grey500,
      maxWidth: '60%',
    },
    amountContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    currency: {
      fontSize: 18,
      fontWeight: '300',
      color: '#333',
    },
    amount: {
      fontSize: FONTS.FONTSIZE.SEMI,
      color: COLORS.PRIMARYBLACK,
      fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
      includeFontPadding: false,
      maxWidth: '40%',
    },
    currencySmall: {
      fontSize: 18,
      fontWeight: '300',
      color: '#333',
    },
    cardBody: {
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    memberName: {
      fontSize: FONTS.FONTSIZE.SMALL,
      fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
      color: COLORS.PRIMARYBLACK,
    },
    dateTime: {
      fontSize: FONTS.FONTSIZE.MICRO,
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      color: '#666666c0',
    },
    statusContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 20,
    },
    statusText: {
      fontSize: FONTS.FONTSIZE.EXTRAMINI,
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      includeFontPadding: false,
    },
    detailsBtn: {
      backgroundColor: '#f0f6ff',
      paddingVertical: 8,
      borderRadius: 20,
      alignItems: 'center',
    },
    detailsText: {
      color: '#2762ea',
      fontSize: FONTS.FONTSIZE.MINI,
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
      includeFontPadding: false,
      textAlign: 'center',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    detailsModal: {
      backgroundColor: 'white',
      borderRadius: 20,
      padding: 24,
      margin: 20,
      maxHeight: '80%',
      width: '90%',
    },

    modalTitle: {
      fontSize: FONTS.FONTSIZE.SMALL,
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
      color: COLORS.PRIMARYBLACK,
    },
    paymentSuccess: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#4CAF50',
      textAlign: 'center',
      marginBottom: 16,
    },
    orderDetail: {
      fontSize: 18,
      fontWeight: '600',
      color: '#333',
      textAlign: 'center',
      marginBottom: 24,
    },
    amountSection: {
      alignItems: 'center',
      marginBottom: 32,
    },
    amountLabel: {
      fontSize: 16,
      color: '#666',
      marginBottom: 8,
    },
    amountRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    amountBig: {
      fontSize: 36,
      fontWeight: 'bold',
      color: '#333',
      marginRight: 8,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 16,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#F0F0F0',
    },
    label: {
      fontSize: 16,
      color: '#666',
      flex: 1,
    },
    value: {
      fontSize: 16,
      fontWeight: '600',
      color: '#333',
      flex: 1,
      textAlign: 'right',
    },
    downloadBtn: {
      backgroundColor: '#4CAF50',
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 16,
    },
    downloadText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    closeBtn: {
      backgroundColor: '#F0F0F0',
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    closeText: {
      color: '#666',
      fontSize: 16,
      fontWeight: '600',
    },
    filterGroup: {
      marginBottom: 10,
      width: '48%',
    },
    filterLabel: {
      fontSize: FONTS.FONTSIZE.SEMIMINI,
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
      color: '#333',
    },
    textInput: {
      borderWidth: 1,
      paddingVertical: 4,
      borderRadius: 10,
      paddingHorizontal: 8,
      justifyContent: 'center',
      borderColor: COLORS.INPUTBORDER,
      backgroundColor: COLORS.PRIMARYWHITE,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    dateText: {
      color: COLORS.PLACEHOLDERCOLOR,
      fontSize: FONTS.FONTSIZE.EXTRAMINI,
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      includeFontPadding: false,
    },
    filterButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 20,
    },
    clearBtn: {
      flex: 1,
      backgroundColor: '#F0F0F0',
      padding: 8,
      borderRadius: 12,
      alignItems: 'center',
    },
    clearBtnText: {
      color: COLORS.PLACEHOLDERCOLOR,
      fontSize: FONTS.FONTSIZE.MINI,
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
      includeFontPadding: false,
    },
    applyBtn: {
      flex: 1,
      backgroundColor: '#2196F3',
      padding: 8,
      borderRadius: 12,
      alignItems: 'center',
    },
    applyBtnText: {
      color: 'white',
      fontSize: FONTS.FONTSIZE.MINI,
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
      includeFontPadding: false,
    },
  });

  const dropDownData = [
    {
      label: 'PayPal',
      value: 'PayPal',
    },
    {
      label: 'Venmo',
      value: 'Venmo',
    },
  ];

  const PAGE_SIZE = 20;

  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showFilterExpanded, setShowFilterExpanded] = useState(false);
  const [filterActive, setFilterActive] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState({
    startDate: false,
    endDate: false,
  });
  const [selectedDate, setSelectedDate] = useState({
    startDate: null,
    endDate: null,
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [data, setData] = useState([]);
  const [selectedDropdown, setSelectedDropdown] = useState(null);

  const {isConnected} = useNetworkStatus();

  const debouncedSearchKeyword = useDebounce(searchKeyword, 500);

  const prevFiltersRef = useRef({
    searchKeyword: debouncedSearchKeyword,
    startDate: selectedDate.startDate,
    endDate: selectedDate.endDate,
    paymentType: selectedDropdown?.value,
  });

  const requestIdRef = useRef(0);

  useEffect(() => {
    const fetchData = async () => {
      // Check if ANY filter changed
      const filtersChanged =
        prevFiltersRef.current.searchKeyword !== debouncedSearchKeyword ||
        prevFiltersRef.current.startDate !== selectedDate.startDate ||
        prevFiltersRef.current.endDate !== selectedDate.endDate ||
        prevFiltersRef.current.paymentType !== selectedDropdown?.value;

      // If filters changed AND we're not on page 1, reset to page 1
      if (filtersChanged && pageNumber !== 1) {
        console.log('Filters changed, resetting to page 1');
        prevFiltersRef.current = {
          searchKeyword: debouncedSearchKeyword,
          startDate: selectedDate.startDate,
          endDate: selectedDate.endDate,
          paymentType: selectedDropdown?.value,
        };
        setPageNumber(1);
        return;
      }

      // Update ref for next comparison
      prevFiltersRef.current = {
        searchKeyword: debouncedSearchKeyword,
        startDate: selectedDate.startDate,
        endDate: selectedDate.endDate,
        paymentType: selectedDropdown?.value,
      };

      // ✅ Increment request ID for this new request
      requestIdRef.current += 1;
      const currentRequestId = requestIdRef.current;

      const payload = {
        searchKeyword: debouncedSearchKeyword || '',
        startDate: selectedDate.startDate
          ? moment(selectedDate.startDate).format('YYYY-MM-DD')
          : '',
        endDate: selectedDate.endDate
          ? moment(selectedDate.endDate).format('YYYY-MM-DD')
          : '',
        page: pageNumber,
        pageSize: PAGE_SIZE,
        paymentType: selectedDropdown?.value || null,
      };

      const state = await NetInfo.fetch();
      if (!state.isConnected) {
        NOTIFY_MESSAGE('Please check your internet connectivity');
        return;
      }

      setIsLoading(true);

      try {
        const response = await httpClient.post(
          'payment/searchtransaction',
          payload,
        );

        // ✅ Check if this response is still relevant (not superseded by a newer request)
        if (currentRequestId !== requestIdRef.current) {
          console.log(
            'Ignoring stale response. Current:',
            currentRequestId,
            'Latest:',
            requestIdRef.current,
          );
          return;
        }

        if (response?.data?.status) {
          const totalRecords = response?.data?.result?.total_count || 0;
          const calculatedTotalPages = Math.ceil(totalRecords / PAGE_SIZE);
          const newData = response?.data?.result?.transactions || [];

          setData(newData);
          setHasMore(pageNumber < calculatedTotalPages && newData.length > 0);
        } else {
          NOTIFY_MESSAGE(response?.data?.message || 'Something Went Wrong.');
          setData([]);
        }
      } catch (error) {
        // ✅ Check if this error is still relevant
        if (currentRequestId !== requestIdRef.current) {
          console.log('Ignoring error from stale request');
          return;
        }

        console.error('API Error:', error);
        setData([]);
        NOTIFY_MESSAGE('Something Went Wrong.');
      } finally {
        // ✅ Only clear loading if this is still the latest request
        if (currentRequestId === requestIdRef.current) {
          setIsLoading(false);
          setRefreshing(false);
        }
      }
    };

    fetchData();
  }, [
    pageNumber,
    debouncedSearchKeyword,
    selectedDate.startDate,
    selectedDate.endDate,
    selectedDropdown?.value,
    refreshTrigger,
  ]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPageNumber(1);
    setData([]);
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const loadMore = () => {
    if (hasMore) {
      setPageNumber(prev => prev + 1);
    }
  };

  const clearFilters = () => {
    setDatePickerVisible({startDate: false, endDate: false});
    setSelectedDate({startDate: null, endDate: null});
    setSelectedDropdown(null);
    setFilterActive(false);
    setShowFilterExpanded(false);
    setSearchKeyword('');
    setPageNumber(1);
  };

  const getStatusColor = status => {
    let lowerStatus = status?.toLowerCase();
    switch (lowerStatus) {
      case 'completed':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'failed':
      case 'declined':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getIcons = status => {
    let lowerStatus = status?.toLowerCase();
    switch (lowerStatus) {
      case 'completed':
        return 'check-circle';
      case 'pending':
        return 'clock-outline';
      case 'failed':
      case 'declined':
        return 'close-circle';
      default:
        return 'clock-outline';
    }
  };

  const getStatusText = status => {
    let lowerStatus = status?.toLowerCase();
    switch (lowerStatus) {
      case 'completed':
        return 'Success';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      case 'declined':
        return 'Declined';
      default:
        return 'Processing...';
    }
  };

  const renderTransaction = ({item}) => {
    return (
      <View style={[styles.transactionCard]}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>Order #{item?.order_id}</Text>
          <Text style={styles.amount}>{item?.amount}</Text>
        </View>
        <View style={styles.cardBody}>
          <View style={{flex: 1}}>
            <Text numberOfLines={2} style={styles.memberName}>
              {item?.member_name}
            </Text>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text style={styles.dateTime}>{item?.transaction_date}</Text>
              <View
                style={{
                  height: 4,
                  width: 4,
                  borderRadius: 2,
                  backgroundColor: '#666666c0',
                  marginHorizontal: 4,
                }}
              />
              <Text style={styles.dateTime}>{item?.transaction_time}</Text>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              {backgroundColor: getStatusColor(item?.status) + '20'},
            ]}>
            <MaterialDesignIcons
              name={getIcons(item?.status)}
              size={18}
              color={getStatusColor(item?.status)}
              style={{
                marginRight: 6,
              }}
            />
            <Text
              style={[
                styles.statusText,
                {color: getStatusColor(item?.status)},
              ]}>
              {getStatusText(item?.status)}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.detailsBtn}
          onPress={() => {
            navigation.navigate('TransactionDetails', {
              item: item,
            });
          }}>
          <View
            style={{
              alignItems: 'center',
              flexDirection: 'row',
              gap: 8,
            }}>
            <Feather name="eye" size={18} color="#2762ea" />
            <Text style={styles.detailsText}>View Details</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const onDateChange = (date, key) => {
    if (date) {
      const newDate = date;
      let isValid = true;

      // VALIDATION - Set flag only, don't return yet
      if (key === 'endDate' && selectedDate.startDate) {
        if (newDate <= selectedDate.startDate) {
          Alert.alert(
            'Invalid Date Range',
            'End date cannot be earlier than start date.',
            [{text: 'OK'}],
          );
          isValid = false;
        }
      }

      if (key === 'startDate' && selectedDate.endDate) {
        if (newDate >= selectedDate.endDate) {
          Alert.alert(
            'Invalid Date Range',
            'Start date cannot be after end date.',
            [{text: 'OK'}],
          );
          isValid = false;
        }
      }

      // ALWAYS close picker first
      setDatePickerVisible(prev => ({
        ...prev,
        [key]: false, // ✅ This NOW executes every time
      }));

      // Only update date if valid
      if (isValid) {
        setSelectedDate(prev => ({
          ...prev,
          [key]: date,
        }));
        setFilterActive(true);
      }
    }
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
        title={item?.name}
      />
      <View style={styles.headerContainer}>
        <View style={{flex: 1}}>
          <View
            style={{
              borderRadius: 20,
              backgroundColor: COLORS.PRIMARYWHITE,
              paddingHorizontal: 10,
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#ebedf0',
              height: 38,
            }}>
            <TextInput
              placeholder="Search order ID or member..."
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
      </View>
      <View
        style={{
          alignSelf: showFilterExpanded ? null : 'flex-start',
          backgroundColor: COLORS.PRIMARYWHITE,
          paddingHorizontal: 10,
          paddingVertical: 10,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: '#ebedf0',
          marginHorizontal: 10,
          gap: 6,
        }}>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => {
            setShowFilterExpanded(!showFilterExpanded);
          }}>
          <Feather name="filter" size={20} color="#666" />
          <Text style={styles.filterText}>
            {filterActive
              ? 'Filters Active'
              : 'Filter by Date and Payment Type'}
          </Text>
        </TouchableOpacity>
        {showFilterExpanded && (
          <View style={{}}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginVertical: 4,
              }}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity
                style={{}}
                onPress={() => {
                  setShowFilterExpanded(!showFilterExpanded);
                }}>
                <Ionicons name="close" size={20} color={COLORS.grey500} />
              </TouchableOpacity>
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Start Date</Text>
                <TouchableOpacity
                  style={styles.textInput}
                  onPress={() => {
                    Keyboard.dismiss();
                    setDatePickerVisible(prev => ({
                      ...prev,
                      startDate: true,
                    }));
                  }}>
                  <Text style={styles.dateText}>
                    {selectedDate.startDate
                      ? moment(selectedDate.startDate).format('MM/DD/YYYY')
                      : 'MM/DD/YYYY'}
                  </Text>
                  <MaterialDesignIcons
                    name="calendar-month-outline"
                    size={20}
                    color={COLORS.PLACEHOLDERCOLOR}
                  />
                </TouchableOpacity>

                {datePickerVisible.startDate && (
                  <DateTimePickerModal
                    is24Hour={false}
                    isVisible={datePickerVisible.startDate}
                    mode="date"
                    display="inline"
                    onConfirm={date => onDateChange(date, 'startDate')}
                    onCancel={() =>
                      setDatePickerVisible(prev => ({
                        ...prev,
                        startDate: false,
                      }))
                    }
                    date={selectedDate.startDate || new Date()}
                  />
                )}
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>End Date</Text>
                <TouchableOpacity
                  style={styles.textInput}
                  onPress={() => {
                    Keyboard.dismiss();
                    setDatePickerVisible(prev => ({
                      ...prev,
                      endDate: true,
                    }));
                  }}>
                  <Text style={styles.dateText}>
                    {selectedDate.endDate
                      ? moment(selectedDate.endDate).format('MM/DD/YYYY')
                      : 'MM/DD/YYYY'}
                  </Text>
                  <MaterialDesignIcons
                    name="calendar-month-outline"
                    size={20}
                    color={COLORS.PLACEHOLDERCOLOR}
                  />
                </TouchableOpacity>

                {datePickerVisible.endDate && (
                  <DateTimePickerModal
                    is24Hour={false}
                    isVisible={datePickerVisible.endDate}
                    mode="date"
                    display="inline"
                    onConfirm={date => onDateChange(date, 'endDate')}
                    onCancel={() =>
                      setDatePickerVisible(prev => ({
                        ...prev,
                        endDate: false,
                      }))
                    }
                    date={selectedDate.endDate || new Date()}
                  />
                )}
              </View>
            </View>
            <View
              style={{
                marginBottom: 10,
              }}>
              <Text style={styles.filterLabel}>Payment Type</Text>
              <Dropdown
                style={[styles.dropdown]}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                inputSearchStyle={{
                  color: COLORS.PRIMARYBLACK,
                  fontSize: FONTS.FONTSIZE.EXTRASMALL,
                }}
                data={
                  dropDownData.length > 0
                    ? dropDownData
                    : [{label: 'No Data Available', value: null}]
                }
                labelField="label"
                valueField="value"
                value={selectedDropdown}
                onChange={item => {
                  setSelectedDropdown(item);
                  setFilterActive(true);
                }}
                itemTextStyle={{color: COLORS.PRIMARYBLACK}}
                placeholder="Select Type"
                maxHeight={200}
                renderItem={item => (
                  <View style={styles.itemContainer}>
                    <Text style={styles.itemText}>{item.label}</Text>
                  </View>
                )}
              />
            </View>

            <View style={styles.filterButtons}>
              <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
                <Text style={styles.clearBtnText}>Clear All Filters</Text>
              </TouchableOpacity>
              {/* <TouchableOpacity style={styles.applyBtn} onPress={applyFilter}>
                <Text style={styles.applyBtnText}>Apply Filters</Text>
              </TouchableOpacity> */}
            </View>
          </View>
        )}
      </View>
      {isLoading ? (
        <Loader />
      ) : isConnected ? (
        <View style={{flex: 1}}>
          {data?.length > 0 ? (
            <FlatList
              data={data}
              initialNumToRender={10}
              maxToRenderPerBatch={20}
              windowSize={10}
              removeClippedSubviews={true}
              // keyExtractor={(item, index) => item?.id?.toString() || index?.toString()}
              keyExtractor={(item, index) => {
                // ✅ PRIORITY 1: Use transaction_id (most unique)
                if (item?.transaction_id) {
                  return `txn-${item.transaction_id}`;
                }
                // ✅ PRIORITY 2: Use order_id
                if (item?.order_id) {
                  return `order-${item.order_id}`;
                }
                // ✅ PRIORITY 3: Combine id + pageNumber (pagination-safe)
                return `item-${item?.id || index}-${pageNumber}`;
              }}
              renderItem={renderTransaction}
              contentContainerStyle={styles.listContainer}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            />
          ) : (
            <NoDataFound />
          )}
        </View>
      ) : (
        <Offline />
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
            disabled={isLoading}
            onPress={() => {
              setPageNumber(prevPage => Math.max(prevPage - 1, 1));
            }}
            style={{}}>
            <Text style={styles.paginationText}>Previous</Text>
          </TouchableOpacity>
        )}
        {hasMore && (
          <TouchableOpacity disabled={isLoading} onPress={loadMore} style={{}}>
            <Text style={styles.paginationText}>Load More</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default Transactions;
