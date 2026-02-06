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
import {AntDesign} from '@react-native-vector-icons/ant-design';
import {useNetworkStatus} from '../connection/UseNetworkStatus';
import {capitalizeFirstLetter, NOTIFY_MESSAGE} from '../constant/Module';
import Offline from '../components/root/Offline';
import {FontAwesome} from '@react-native-vector-icons/fontawesome';
import {Ionicons} from '@react-native-vector-icons/ionicons';

const PaymentCredList = ({route}) => {
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
    paymentCard: {
      backgroundColor: COLORS.PRIMARYWHITE,
      borderRadius: 6,
      marginVertical: 8,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: COLORS.TABLEBORDER,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#c7c6cb',
    },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    headerContent: {
      flex: 1,
    },
    paymentTitle: {
      fontSize: FONTS.FONTSIZE.SMALL,
      fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
      color: COLORS.PRIMARYBLACK,
    },
    badgeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
    },
    badgeText: {
      fontSize: FONTS.FONTSIZE.MICRO,
      fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
      textTransform: 'uppercase',
      includeFontPadding: false,
    },
    activeBadge: {
      backgroundColor: '#d4edda',
    },
    inactiveBadge: {
      backgroundColor: '#f8d7da',
    },
    productionBadge: {
      backgroundColor: '#d1ecf1',
    },
    sandboxBadge: {
      backgroundColor: '#fff3cd',
    },
    activeText: {
      color: '#155724',
    },
    inactiveText: {
      color: '#721c24',
    },
    productionText: {
      color: '#0c5460',
    },
    sandboxText: {
      color: '#856404',
    },
    actionButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    actionText: {
      fontSize: FONTS.FONTSIZE.SMALL,
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
    },
    editButton: {
      color: '#007bff',
    },
    deleteButton: {
      color: '#dc3545',
    },
    cardDetails: {},
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: '#c7c6cb',
      paddingHorizontal: 10,
    },
    detailLabel: {
      fontSize: FONTS.FONTSIZE.SEMIMINI,
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
      color: COLORS.PRIMARYBLACK,
    },
    detailValue: {
      fontSize: FONTS.FONTSIZE.SEMIMINI,
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      color: COLORS.grey500,
      maxWidth: '75%',
      textAlign: 'right',
    },
    secretValue: {
      fontSize: FONTS.FONTSIZE.SEMIMINI,
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      color: COLORS.grey500,
      letterSpacing: 2,
    },
  });

  const [allUserData, setAllUserData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoading1, setIsLoading1] = useState(false);
  const {isConnected} = useNetworkStatus();

  const navigation = useNavigation();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [isRefresh, setIsRefresh] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = async () => {
    setIsRefresh(true);
    setSearchKeyword('');
    await getViewData();
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
        const name = item?.paymentType?.toLowerCase() || '';
        const clientId = item?.clientId?.toLowerCase() || '';
        const environment = item?.environment?.toLowerCase() || '';
        return (
          name.includes(keyword) ||
          clientId.includes(keyword) ||
          environment.includes(keyword)
        );
      });
      setFilteredData(filtered);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setRefreshTrigger(prev => prev + 1);
      return () => {};
    }, []),
  );

  useEffect(() => {
    if (refreshTrigger === 0) {
      return;
    }
    getViewData();
  }, [refreshTrigger]);

  const getViewData = useCallback(() => {
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setIsLoading(true);
        httpClient
          .get(`setting/thirdpartygateways/get/0`)
          .then(response => {
            if (response.data.status) {
              const newData = response.data.result;

              if (newData?.length > 0) {
                setAllUserData(newData);
                setFilteredData(newData);
              } else {
                setAllUserData([]);
                setFilteredData([]);
              }
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
  }, []);

  const handleDelete = item1 => {
    if (!item1?.id) {
      NOTIFY_MESSAGE('Invalid item');
      return;
    }
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${item1?.paymentType} gateway?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setIsLoading1(true);
            httpClient
              .delete(`setting/thirdpartygateways/delete/${item1.id}`)
              .then(response => {
                if (response.data.status === true) {
                  NOTIFY_MESSAGE(response.data.message);
                  setAllUserData(prevList =>
                    prevList.filter(item => item.id !== item1.id),
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
    if (!item1?.id) {
      NOTIFY_MESSAGE('Invalid item');
      return;
    }

    Alert.alert(
      'Confirm Edit',
      `Edit ${item1?.paymentType} gateway settings?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Edit',
          style: 'default',
          onPress: () => {
            let data = {
              isEdit: true,
              editItem: item1,
            };
            navigation.navigate('AddUpdatePaymentCred', {data});
          },
        },
      ],
      {cancelable: false},
    );
  };

  // Function to get payment icon and color
  const getPaymentIconConfig = paymentType => {
    const type = paymentType?.toUpperCase();
    switch (type) {
      case 'STRIPE':
        return {
          bgColor: '#635BFF',
          icon: <FontAwesome name={'cc-stripe'} size={28} color={'#FFFFFF'} />,
        };
      case 'PAYPAL':
        return {
          bgColor: '#00A4E4',
          icon: <FontAwesome name={'cc-paypal'} size={28} color={'#FFFFFF'} />,
        };
      case 'VENMO':
        return {
          bgColor: '#3D95CE',
          icon: <Ionicons name={'logo-venmo'} size={28} color={'#FFFFFF'} />,
        };
      default:
        return {
          icon: 'credit-card-outline',
          bgColor: COLORS.LABELCOLOR,
          iconColor: '#FFFFFF',
          icon: (
            <FontAwesome name={'credit-card'} size={28} color={'#FFFFFF'} />
          ),
        };
    }
  };

  // Function to mask sensitive data
  const maskSecretData = value => {
    if (!value) return '-';
    const lastFour = value.slice(-4);
    return '•'.repeat(20) + lastFour;
  };

  // Function to partially mask client ID
  const maskClientId = value => {
    if (!value) return '-';
    if (value.length <= 10) return value;
    const start = value.slice(0, 6);
    const end = value.slice(-6);
    return `${start}...${end}`;
  };

  const renderItem = ({item: item1, index}) => {
    const iconConfig = getPaymentIconConfig(item1?.paymentType);
    const isActive = item1?.isActive === true || item1?.isActive === 1;
    const environment = item1?.environment?.toLowerCase();
    const isProduction = environment === 'production';

    return (
      <View style={styles.paymentCard} key={index}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.iconContainer,
              {backgroundColor: iconConfig.bgColor},
            ]}>
            {iconConfig?.icon}
          </View>

          <View style={styles.headerContent}>
            <Text numberOfLines={2} style={styles.paymentTitle}>
              {item1?.paymentType
                ? capitalizeFirstLetter(item1.paymentType)
                : 'Payment Gateway'}
            </Text>
            <View style={styles.badgeContainer}>
              <View
                style={[
                  styles.badge,
                  isActive ? styles.activeBadge : styles.inactiveBadge,
                ]}>
                <Text
                  style={[
                    styles.badgeText,
                    isActive ? styles.activeText : styles.inactiveText,
                  ]}>
                  {isActive ? 'ACTIVE' : 'INACTIVE'}
                </Text>
              </View>
              <View
                style={[
                  styles.badge,
                  isProduction ? styles.productionBadge : styles.sandboxBadge,
                ]}>
                <Text
                  style={[
                    styles.badgeText,
                    isProduction ? styles.productionText : styles.sandboxText,
                  ]}>
                  {environment || 'SANDBOX'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity onPress={() => handleUpdate(item1)}>
              <Text style={[styles.actionText, styles.editButton]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item1)}>
              <Text style={[styles.actionText, styles.deleteButton]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Card Details */}
        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Client ID</Text>
            <Text style={styles.detailValue}>
              {maskClientId(item1?.clientId)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Secret ID</Text>
            <Text style={styles.secretValue}>
              {maskSecretData(item1?.secretId)}
            </Text>
          </View>

          {item1?.publicKey && (
            <View style={[styles.detailRow, {borderBottomWidth: 0}]}>
              <Text style={styles.detailLabel}>Public Key</Text>
              <Text style={styles.detailValue} numberOfLines={2}>
                {item1?.publicKey}
              </Text>
            </View>
          )}
        </View>
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
        title={item?.name || 'Payment Credentials'}
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
            navigation.navigate('AddUpdatePaymentCred', {data});
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
              keyExtractor={(item, index) =>
                item?.id?.toString() || index?.toString()
              }
              renderItem={renderItem}
              contentContainerStyle={styles.listContainer}
              refreshControl={
                <RefreshControl
                  onRefresh={handleRefresh}
                  refreshing={isRefresh}
                />
              }
            />
          ) : (
            <NoDataFound />
          )}
        </View>
      ) : (
        <Offline />
      )}
    </KeyboardAvoidingView>
  );
};

export default PaymentCredList;
