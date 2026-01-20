import {
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
  Alert,
  FlatList,
  useWindowDimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import React, {useCallback, useEffect, useRef, useState} from 'react';
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
import {
  capitalizeFirstLetter,
  formatPhoneToUS,
  isPhoneField,
  NOTIFY_MESSAGE,
} from '../constant/Module';
import {getFileType} from '../utils/fileType';
import Offline from '../components/root/Offline';
import moment from 'moment';

const FamilyMemberList = ({route}) => {
  const {item} = route?.params?.data;

  const {width} = useWindowDimensions();

  const styles = StyleSheet.create({
    disapprovedBadge: {
      backgroundColor: '#FEE2E2', // Light red background
    },

    disapprovedText: {
      color: '#EF4444', // Red text
    },
    approvedState: {
      backgroundColor: '#E5E7EB',
    },
    disapprovedState: {
      backgroundColor: '#E5E7EB',
    },
    approveIconButtonActive: {
      backgroundColor: '#246403',
    },
    disapproveIconButton: {
      backgroundColor: '#EF4444',
    },
    approveIconButton: {
      width: 22,
      height: 22,
      borderRadius: 11,
      justifyContent: 'center',
      alignItems: 'center',
    },
    memberActionsColumn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginLeft: 10,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    infoLabel: {
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      fontSize: FONTS.FONTSIZE.MICRO,
      color: COLORS.grey500,
    },
    memberInfoSection: {
      flex: 1,
      gap: 6,
    },
    infoValue: {
      fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
      fontSize: FONTS.FONTSIZE.MICRO,
      color: COLORS.PRIMARYBLACK,
    },

    relationValue: {
      fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
      fontSize: FONTS.FONTSIZE.MICRO,
      color: COLORS.TITLECOLOR,
    },
    memberMainRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: 8,
    },
    titleText: {
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      fontSize: FONTS.FONTSIZE.MINI,
      color: COLORS.PRIMARYBLACK,
      width: '48%',
      marginRight: 4,
      lineHeight: Platform.OS == 'ios' ? FONTS.FONTSIZE.MINI * 1.2 : null,
    },
    text: {
      width: '50%',
      textAlign: 'left',
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
      fontSize: FONTS.FONTSIZE.MINI,
      color: COLORS.PRIMARYBLACK,
    },
    paidBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: '#f0fdf4',
      borderRadius: 6,
      borderWidth: 1,
      borderColor: COLORS.LABELCOLOR,
    },
    paidText: {
      fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
      fontSize: FONTS.FONTSIZE.MICRO,
      color: COLORS.LABELCOLOR,
    },
    paidStatusBadge: {
      backgroundColor: '#f0fdf4',
      borderColor: COLORS.LABELCOLOR,
    },
    paidStatusText: {
      color: '#246403',
      fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
      fontSize: FONTS.FONTSIZE.MINI,
      includeFontPadding: false,
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
      flexGrow: 1,
      paddingBottom: 10,
    },
    cardContainer: {
      backgroundColor: COLORS.PRIMARYWHITE,
      borderRadius: 10,
      marginVertical: 8,
      overflow: 'hidden',
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 12,
    },

    numberBadge: {
      backgroundColor: COLORS.LABELCOLOR,
      maxWidth: '30%',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 10,
      padding: 6,
    },

    numberText: {
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      fontSize: FONTS.FONTSIZE.SMALL,
      color: COLORS.PRIMARYWHITE,
    },
    memberInfo: {
      flex: 1,
    },
    memberName: {
      fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
      fontSize: FONTS.FONTSIZE.SEMIMINI,
      color: COLORS.PLACEHOLDERCOLOR,
    },
    selfLabel: {
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      fontSize: FONTS.FONTSIZE.MINI,
      color: COLORS.grey500,
    },
    iconButton: {
      padding: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    familySection: {
      padding: 8,
    },
    familySectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    familyMembersLabel: {
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
      fontSize: FONTS.FONTSIZE.EXTRAMINI,
      color: COLORS.PRIMARYBLACK,
    },
    memberCountText: {
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      fontSize: FONTS.FONTSIZE.EXTRAMINI,
      color: COLORS.grey500,
    },
    approveAllButton: {
      backgroundColor: '#246403',
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    approveAllText: {
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
      fontSize: FONTS.FONTSIZE.MICRO,
      color: COLORS.PRIMARYWHITE,
    },
    memberCard: {
      backgroundColor: COLORS.PRIMARYWHITE,
      borderRadius: 10,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: '#e5e7eb',
      overflow: 'hidden',
    },
    memberNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    memberNameText: {
      fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
      fontSize: FONTS.FONTSIZE.MINI,
      color: COLORS.PRIMARYBLACK,
      flex: 1,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 6,
      gap: 4,
    },
    pendingBadge: {
      backgroundColor: '#d55b0929',
    },
    approvedBadge: {
      backgroundColor: '#D1FAE5',
    },
    badgeText: {
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
      fontSize: FONTS.FONTSIZE.MICRO,
      includeFontPadding: false,
    },
    pendingText: {
      color: '#d55909',
    },
    approvedText: {
      color: '#246403',
    },
    feeValue: {
      fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
      fontSize: FONTS.FONTSIZE.MICRO,
      color: COLORS.LABELCOLOR,
    },
    paginationText: {
      fontSize: FONTS.FONTSIZE.SMALL,
      color: 'blue',
      textAlign: 'center',
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    },
    expandedDetailsContainer: {
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: '#e5e7eb',
      backgroundColor: '#f9fafb',
      padding: 8,
    },
  });

  const [allUserData, setAllUserData] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const [pageNumber, setPageNumber] = useState(1);

  const [hasMore, setHasMore] = useState(true);
  const [openIndex, setOpenIndex] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [debouncedSearchKeyword, setDebouncedSearchKeyword] = useState('');

  const [formFields, setFormFields] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const searchTimeoutRef = useRef(null);
  const PAGE_SIZE = 20;

  useEffect(() => {
    getViewData();
  }, [pageNumber, debouncedSearchKeyword, refreshTrigger]);

  useFocusEffect(
    useCallback(() => {
      setRefreshTrigger(prev => prev + 1);
      setOpenIndex(null);
      setExpandedFamilyMember(null);
      return () => {};
    }, []),
  );

  const isMemberApproved = member =>
    member?.isApproved?.toLowerCase() == 'yes' || member?.isApproved === true;

  const getViewData = useCallback(() => {
    setIsLoading(true);

    NetInfo.fetch().then(state => {
      if (!state.isConnected) {
        setIsLoading(false);
        NOTIFY_MESSAGE('Please check your internet connectivity');
        return;
      }

      httpClient
        .get(
          `module/get/FamilymemberList?pageNumber=${pageNumber}&pageSize=${PAGE_SIZE}&searchKey=${debouncedSearchKeyword}`,
        )
        .then(response => {
          if (!response.data.status) {
            NOTIFY_MESSAGE(response.data.message || 'No data found');
            setAllUserData([]);
            setFormFields([]);
            setHasMore(false);
            return;
          }

          const newData = response?.data?.result?.familyMembers || [];
          const totalRecords = response?.data?.result?.totalRecord || 0;
          const totalPages = Math.ceil(totalRecords / PAGE_SIZE);

          setFormFields(response?.data?.result?.form || []);
          // ✅ REPLACE data for current page only (no merging)
          setAllUserData(newData);

          // ✅ Calculate if more pages exist
          setHasMore(pageNumber < totalPages);
        })
        .catch(error => {
          const errorMessage =
            error?.response?.data?.message ||
            error?.message ||
            'Something Went Wrong';
          NOTIFY_MESSAGE(errorMessage);
          setAllUserData([]);
          setFormFields([]);
          setHasMore(false);
        })
        .finally(() => {
          setIsLoading(false);
          setRefreshing(false);
        });
    });
  }, [pageNumber, debouncedSearchKeyword, PAGE_SIZE, navigation]);

  const [loadingItemId, setLoadingItemId] = useState(null);
  const [deletingItemId, setDeletingItemId] = useState(null);
  const [expandedFamilyMember, setExpandedFamilyMember] = useState(null);
  const {isConnected, networkLoading} = useNetworkStatus();

  const toggleFamilyMember = (parentId, memberId) => {
    const key = `${parentId}-${memberId}`;
    // If clicking the same member, close it. Otherwise, open the new one
    setExpandedFamilyMember(prev => (prev === key ? null : key));
  };

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

  const handleDelete = (item1, parentItem = null) => {
    if (!item1?.configurationId) {
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
            setDeletingItemId(item1.configurationId);
            httpClient
              .delete(`module/configuration/delete/${item1.configurationId}`)
              .then(response => {
                if (response.data.status === true) {
                  NOTIFY_MESSAGE(response.data.message);

                  // ✅ CORRECT: Update nested family members
                  if (parentItem) {
                    // Deleting a nested family member
                    setAllUserData(prevList =>
                      prevList.map(parent =>
                        parent.configurationId === parentItem.configurationId
                          ? {
                              ...parent,
                              familyMembers: parent.familyMembers.filter(
                                fm =>
                                  fm.configurationId !== item1.configurationId,
                              ),
                              // ✅ Update totalMember count
                              totalMember: parent.familyMembers.filter(
                                fm =>
                                  fm.configurationId !== item1.configurationId,
                              ).length,
                            }
                          : parent,
                      ),
                    );
                  } else {
                    // Deleting a parent item
                    setAllUserData(prevList =>
                      prevList.filter(
                        item => item.configurationId !== item1.configurationId,
                      ),
                    );
                  }
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
                setDeletingItemId(null);
              });
          },
        },
      ],
      {cancelable: false},
    );
  };

  const handleUpdate = item1 => {
    if (!item1?.configurationId) {
      NOTIFY_MESSAGE('Invalid configuration ID');
      return;
    }

    Alert.alert(
      'Confirm Edit',
      'Are you sure you want to Edit this Record?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: async () => {
            try {
              // ✅ Set loading state for this specific item
              setLoadingItemId(item1.configurationId);

              // Check network
              const netInfo = await NetInfo.fetch();
              if (!netInfo.isConnected) {
                NOTIFY_MESSAGE('Please check your internet connectivity');
                return;
              }

              // Fetch configuration data
              const response = await httpClient.get(
                `module/configuration/get/${item1.configurationId}`,
              );

              if (response.data.status) {
                const configurationData = response.data.result?.configuration;

                if (!configurationData) {
                  throw new Error('Configuration data not found');
                }

                // Parse content safely
                let parsedContent = {};
                try {
                  parsedContent = JSON.parse(configurationData.content || '{}');
                } catch (parseError) {
                  console.error('Error parsing content:', parseError);
                  parsedContent = {};
                }

                const memberValue = parsedContent?.member?.value || null;
                const memberId = parsedContent?.member?.values?.find(
                  item => item.label === memberValue,
                );

                let data = {
                  item: item,
                  isTabView: true,
                  isEdit: true,
                  editItem: configurationData,
                  configurationId: memberId?.value || null,
                };

                setTimeout(() => {
                  navigation.navigate('Form', {data});
                }, 100);
              } else {
                NOTIFY_MESSAGE(
                  response.data.message || 'Failed to fetch record details',
                );
              }
            } catch (error) {
              let errorMessage = 'Failed to load record details';

              if (error.response) {
                errorMessage = error.response.data?.message || errorMessage;
              } else if (error.request) {
                errorMessage = 'Network error. Please try again.';
              } else {
                errorMessage = error.message || errorMessage;
              }

              NOTIFY_MESSAGE(errorMessage);
            } finally {
              // ✅ Clear loading state
              setLoadingItemId(null);
            }
          },
        },
      ],
      {cancelable: false},
    );
  };

  const getFieldInfo = fieldName => {
    return (
      formFields.find(field => field.name === fieldName) || {
        label: fieldName,
        type: 'text',
      }
    );
  };

  const toggleMemberApprove = (parent, member, action) => {
    const newIsApproved = action === 'approve' ? 'Yes' : 'No';
    const actionText = action === 'approve' ? 'Approve' : 'Disapprove';
    const memberName = member.firstName || 'this member';

    Alert.alert(
      `Confirm ${actionText}`,
      `Are you sure you want to ${actionText.toLowerCase()} ${memberName}?`,
      [
        {
          text: 'Cancel',
          onPress: () => console.log(`${actionText} cancelled`),
          style: 'cancel',
        },
        {
          text: actionText,
          onPress: () => {
            const body = JSON.stringify({
              familyMemberIds: String(member.configurationId),
              isApproved: newIsApproved,
            });

            httpClient
              .put('member/familyMember/verify', body)
              .then(res => {
                if (res.data.status) {
                  NOTIFY_MESSAGE(res.data.message || 'Updated');

                  setAllUserData(prev =>
                    prev.map(p =>
                      p.configurationId === parent.configurationId
                        ? {
                            ...p,
                            familyMembers: p.familyMembers.map(fm =>
                              fm.configurationId === member.configurationId
                                ? {...fm, isApproved: newIsApproved}
                                : fm,
                            ),
                          }
                        : p,
                    ),
                  );
                } else {
                  NOTIFY_MESSAGE(res.data.message || 'Failed to update');
                }
              })
              .catch(err => {
                NOTIFY_MESSAGE(err?.message || 'Something Went Wrong');
              })
              .finally(() => {});
          },
        },
      ],
    );
  };

  const toggleApproveAll = parent => {
    const allApproved = parent.familyMembers.every(isMemberApproved);
    const target = allApproved ? 'No' : 'Yes';
    const actionText = allApproved ? 'Disapprove' : 'Approve';

    // ✅ Count only non-approved members
    const unapprovedMembers = parent.familyMembers.filter(
      m => !isMemberApproved(m),
    );
    const memberCount = unapprovedMembers.length;

    Alert.alert(
      `Confirm ${actionText} All`,
      `Are you sure you want to ${actionText.toLowerCase()} ${memberCount} family members?`,
      [
        {
          text: 'Cancel',
          onPress: () => console.log(`${actionText} All cancelled`),
          style: 'cancel',
        },
        {
          text: `${actionText} All`,
          onPress: () => {
            // Get IDs of only unapproved members
            const ids = unapprovedMembers
              .map(m => String(m.configurationId))
              .filter(Boolean)
              .join(',');

            const body = JSON.stringify({
              familyMemberIds: ids,
              isApproved: target,
            });

            httpClient
              .put('member/familyMember/verify', body)
              .then(res => {
                if (res.data.status) {
                  NOTIFY_MESSAGE(res.data.message || 'Updated');

                  setAllUserData(prev =>
                    prev.map(p =>
                      p.configurationId === parent.configurationId
                        ? {
                            ...p,
                            familyMembers: p.familyMembers.map(fm => ({
                              ...fm,
                              isApproved: target,
                            })),
                          }
                        : p,
                    ),
                  );
                } else {
                  NOTIFY_MESSAGE(res.data.message || 'Failed to update');
                }
              })
              .catch(err => {
                NOTIFY_MESSAGE(err?.message || 'Something Went Wrong');
              })
              .finally(() => {});
          },
        },
      ],
    );
  };

  const renderItem = ({item: item1, index}) => {
    const number1 = (pageNumber - 1) * PAGE_SIZE + index + 1;
    const number = number1 <= 9 ? `0${number1}` : `${number1}`;

    const handleToggle = idx => {
      if (openIndex === idx) {
        setExpandedFamilyMember(null);
      }
      setOpenIndex(openIndex === idx ? null : idx);
    };

    const hasApprovalField =
      item1?.familyMembers &&
      item1.familyMembers.some(m => m.hasOwnProperty('isApproved'));

    const allApproved =
      hasApprovalField &&
      item1.familyMembers.length > 0 &&
      item1.familyMembers.every(isMemberApproved);

    const showApproveAllButton = hasApprovalField && !allApproved;

    // Helper function to check if member is paid
    const isMemberPaid = member => {
      if (!member?.isPaid) return false;
      return member.isPaid.toLowerCase() === 'yes';
    };

    // Calculate total unpaid amount
    const calculateUnpaidAmount = () => {
      if (!item1?.familyMembers) return 0;
      return item1.familyMembers.reduce((total, member) => {
        if (!isMemberPaid(member)) {
          const amount = parseFloat(member.membershipamount) || 0;
          return total + amount;
        }
        return total;
      }, 0);
    };

    // Check if all members are paid
    const allMembersPaid =
      item1?.familyMembers &&
      item1.familyMembers.length > 0 &&
      item1.familyMembers.every(isMemberPaid);

    const unpaidAmount = calculateUnpaidAmount();
    const showPaymentButton = unpaidAmount > 0 && !allMembersPaid;

    return (
      <View style={styles.cardContainer}>
        {/* Card Header */}
        <TouchableOpacity
          onPress={() => handleToggle(index)}
          style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            {/* Number Badge */}
            <View style={styles.numberBadge}>
              <Text style={styles.numberText}>{number}</Text>
            </View>

            {/* Member Info */}
            <View style={styles.memberInfo}>
              <Text numberOfLines={2} style={styles.memberName}>
                {item1?.member || '-'}
              </Text>
              <Text style={styles.selfLabel}>
                {item1?.familyMembers?.[0]?.membership
                  ? `(${item1?.familyMembers?.[0]?.membership})`
                  : ''}
                {showPaymentButton && ` $${unpaidAmount.toFixed(0)}`}
              </Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}>
            {/* Show payment button only if there are unpaid members */}
            {showPaymentButton && (
              <TouchableOpacity
                style={styles.approveAllButton}
                // onPress={() => {
                //   // Check if all members are approved before navigating to payment
                //   const allMembersApproved =
                //     item1?.familyMembers &&
                //     item1.familyMembers.length > 0 &&
                //     item1.familyMembers.every(member => {
                //       // Check if member has isApproved property
                //       const hasIsApprovedKey =
                //         member.hasOwnProperty('isApproved');

                //       if (hasIsApprovedKey) {
                //         // If isApproved exists, check if it's valid and approved
                //         const isApprovedValueEmpty =
                //           !member.isApproved ||
                //           member.isApproved === null ||
                //           member.isApproved === undefined ||
                //           member.isApproved === '';

                //         return (
                //           !isApprovedValueEmpty && isMemberApproved(member)
                //         );
                //       }

                //       return true;
                //     });

                //   if (!allMembersApproved) {
                //     Alert.alert(
                //       'Approval Required',
                //       'Please approve all family members before completing payment.',
                //       [{text: 'OK'}],
                //     );

                //     return;
                //   }

                //   // All members approved, proceed to payment
                //   navigation.navigate('PaymentInfoFromAdmin', {
                //     item: item1,
                //     memberConfiguration: item1?.configurationId,
                //   });
                // }}
                onPress={() => {
                  // Check if at least one member is approved
                  const hasAtLeastOneApproved =
                    item1?.familyMembers &&
                    item1.familyMembers.length > 0 &&
                    item1.familyMembers.some(member => {
                      // Skip members without isApproved key
                      if (!member.hasOwnProperty('isApproved')) return true;

                      // Check if isApproved is truthy and not empty
                      const isApprovedValueEmpty =
                        !member.isApproved ||
                        member.isApproved === null ||
                        member.isApproved === undefined ||
                        member.isApproved === '';

                      return !isApprovedValueEmpty && isMemberApproved(member);
                    });

                  if (!hasAtLeastOneApproved) {
                    Alert.alert(
                      'Approval Required',
                      'Please approve at least one family member before completing payment.',
                      [{text: 'OK'}],
                    );
                    return;
                  }

                  navigation.navigate('PaymentInfoFromAdmin', {
                    item: item1,
                    memberConfiguration: item1?.configurationId,
                  });
                }}>
                <Text
                  style={{
                    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                    fontSize: FONTS.FONTSIZE.MICRO,
                    color: COLORS.PRIMARYWHITE,
                    paddingHorizontal: 2,
                  }}>
                  Complete Payment
                </Text>
              </TouchableOpacity>
            )}

            <AntDesign
              name={openIndex === index ? 'up' : 'down'}
              size={16}
              color={COLORS.LABELCOLOR}
            />
          </View>
        </TouchableOpacity>

        {/* Family Members Section - Only show when expanded */}
        {openIndex == index && (
          <View style={styles.familySection}>
            {/* Section Header */}
            <View style={styles.familySectionHeader}>
              <Text style={styles.familyMembersLabel}>FAMILY MEMBERS</Text>
              <View
                style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                <Text style={styles.memberCountText}>
                  {item1?.familyMembers?.length || 0} members
                </Text>
                {showApproveAllButton && (
                  <TouchableOpacity
                    style={styles.approveAllButton}
                    onPress={() => toggleApproveAll(item1)}>
                    <View style={styles.approveIconButton}>
                      <MaterialDesignIcons
                        name="check-circle"
                        size={18}
                        color={COLORS.PRIMARYWHITE}
                      />
                    </View>
                    <Text style={styles.approveAllText}>Approve All</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Family Members List */}
            {item1?.familyMembers && item1.familyMembers.length > 0 && (
              <View>
                {item1.familyMembers.map((familyMember, fmIndex) => {
                  const isLoadingEditItem =
                    loadingItemId === familyMember.configurationId;
                  const isLoadingDeleteItem =
                    deletingItemId === familyMember.configurationId;
                  // ✅ Check if isApproved key exists
                  const hasIsApprovedKey =
                    familyMember.hasOwnProperty('isApproved');

                  // ✅ Check if value is null/undefined/empty
                  const isApprovedValueEmpty =
                    !familyMember.isApproved ||
                    familyMember.isApproved === null ||
                    familyMember.isApproved === undefined ||
                    familyMember.isApproved === '';

                  // ✅ Check if member is approved (has value and is Yes/true)
                  const memberApproved =
                    hasIsApprovedKey &&
                    !isApprovedValueEmpty &&
                    isMemberApproved(familyMember);

                  // ✅ Check if member is disapproved (has value and is No/false)
                  const memberDisapproved =
                    hasIsApprovedKey &&
                    !isApprovedValueEmpty &&
                    !isMemberApproved(familyMember);

                  const memberKey = `${item1.configurationId}-${familyMember.configurationId}`;
                  const isMemberExpanded = expandedFamilyMember === memberKey;
                  const isActionInProgress =
                    loadingItemId !== null || deletingItemId !== null;

                  const memberPaid = isMemberPaid(familyMember);

                  return (
                    <TouchableOpacity
                      activeOpacity={1}
                      onPress={() =>
                        toggleFamilyMember(
                          item1.configurationId,
                          familyMember.configurationId,
                        )
                      }
                      key={fmIndex}
                      style={styles.memberCard}>
                      <View style={styles.memberMainRow}>
                        <View style={styles.memberInfoSection}>
                          <View style={styles.memberNameRow}>
                            <FontAwesome6
                              name="user"
                              size={16}
                              color={COLORS.grey500}
                              style={{
                                marginTop: -4,
                              }}
                              iconStyle="solid"
                            />
                            <Text
                              style={styles.memberNameText}
                              numberOfLines={1}>
                              {familyMember.firstName || '-'}
                            </Text>
                          </View>

                          <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Age : </Text>
                            <Text style={styles.infoValue}>
                              {familyMember.age || '-'}
                            </Text>

                            <Text style={[styles.infoLabel, {marginLeft: 15}]}>
                              Relation :{' '}
                            </Text>
                            <Text
                              numberOfLines={2}
                              style={styles.relationValue}>
                              {familyMember.relationship || '-'}
                            </Text>
                          </View>

                          <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Amount($) : </Text>
                            <Text style={styles.feeValue}>
                              {familyMember.membershipamount
                                ? `${familyMember.membershipamount}`
                                : '-'}
                            </Text>

                            {hasApprovalField && (
                              <View
                                style={[
                                  styles.statusBadge,
                                  memberApproved
                                    ? styles.approvedBadge
                                    : memberDisapproved
                                    ? styles.disapprovedBadge
                                    : styles.pendingBadge,
                                  {marginLeft: 10},
                                ]}>
                                <MaterialDesignIcons
                                  name={
                                    memberApproved
                                      ? 'check-circle'
                                      : memberDisapproved
                                      ? 'close-circle'
                                      : 'clock-outline'
                                  }
                                  size={14}
                                  color={
                                    memberApproved
                                      ? '#246403'
                                      : memberDisapproved
                                      ? '#EF4444'
                                      : '#d55909'
                                  }
                                />
                                <Text
                                  style={[
                                    styles.badgeText,
                                    memberApproved
                                      ? styles.approvedText
                                      : memberDisapproved
                                      ? styles.disapprovedText
                                      : styles.pendingText,
                                  ]}>
                                  {memberApproved
                                    ? 'Approved'
                                    : memberDisapproved
                                    ? 'Not-Approved'
                                    : 'Pending'}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>

                        <View style={styles.memberActionsColumn}>
                          {isLoadingEditItem ? (
                            <View style={styles.iconButton}>
                              <ActivityIndicator size="small" color="#007bff" />
                            </View>
                          ) : (
                            <TouchableOpacity
                              style={styles.iconButton}
                              onPress={() => handleUpdate(familyMember)}
                              disabled={isActionInProgress}>
                              <Feather
                                name="edit"
                                size={18}
                                color={isActionInProgress ? '#ccc' : '#007bff'}
                              />
                            </TouchableOpacity>
                          )}

                          {isLoadingDeleteItem ? (
                            <View style={styles.iconButton}>
                              <ActivityIndicator size="small" color="#EF4444" />
                            </View>
                          ) : (
                            <TouchableOpacity
                              style={styles.iconButton}
                              disabled={isActionInProgress}
                              onPress={() => handleDelete(familyMember, item1)}>
                              <AntDesign
                                name="delete"
                                size={18}
                                color={isActionInProgress ? '#ccc' : '#EF4444'}
                              />
                            </TouchableOpacity>
                          )}

                          {hasApprovalField && (
                            <>
                              <TouchableOpacity
                                style={[
                                  styles.approveIconButton,
                                  styles.approveIconButtonActive,
                                  (memberApproved || isActionInProgress) &&
                                    styles.approvedState,
                                ]}
                                onPress={() => {
                                  if (
                                    isApprovedValueEmpty ||
                                    memberDisapproved
                                  ) {
                                    toggleMemberApprove(
                                      item1,
                                      familyMember,
                                      'approve',
                                    );
                                  }
                                }}
                                disabled={memberApproved || isActionInProgress}
                                activeOpacity={
                                  memberApproved || isActionInProgress ? 1 : 0.7
                                }>
                                <MaterialDesignIcons
                                  name="check-circle"
                                  size={18}
                                  color={COLORS.PRIMARYWHITE}
                                />
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={[
                                  styles.approveIconButton,
                                  styles.disapproveIconButton,
                                  (memberDisapproved || isActionInProgress) &&
                                    styles.disapprovedState,
                                ]}
                                onPress={() => {
                                  if (isApprovedValueEmpty || memberApproved) {
                                    toggleMemberApprove(
                                      item1,
                                      familyMember,
                                      'disapprove',
                                    );
                                  }
                                }}
                                disabled={
                                  memberDisapproved || isActionInProgress
                                }
                                activeOpacity={
                                  memberDisapproved || isActionInProgress
                                    ? 1
                                    : 0.7
                                }>
                                <MaterialDesignIcons
                                  name="close-circle"
                                  size={18}
                                  color={COLORS.PRIMARYWHITE}
                                />
                              </TouchableOpacity>
                            </>
                          )}

                          <View style={styles.iconButton}>
                            <AntDesign
                              name={isMemberExpanded ? 'up' : 'down'}
                              size={16}
                              color={COLORS.LABELCOLOR}
                            />
                          </View>
                        </View>

                        {memberPaid && (
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 4,
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 4,
                              backgroundColor: '#e8f5e9',
                              position: 'absolute',
                              bottom: 8,
                              right: 10,
                            }}>
                            <MaterialDesignIcons
                              name="check-circle"
                              size={14}
                              color={'#246403'}
                            />
                            <Text style={styles.paidStatusText}>Paid</Text>
                          </View>
                        )}
                      </View>

                      {/* ✅ Expanded Details Section */}
                      {isMemberExpanded && (
                        <View style={styles.expandedDetailsContainer}>
                          <View style={{gap: 4}}>
                            {Object.entries(familyMember).map(
                              ([key, rawValue]) => {
                                const fieldInfo = getFieldInfo(key);
                                if (
                                  ['configurationId', 'member'].includes(key) ||
                                  [
                                    'button',
                                    'hidden',
                                    'header',
                                    'autocomplete',
                                    'section',
                                    'password',
                                  ].includes(fieldInfo?.type) ||
                                  fieldInfo?.subtype === 'password'
                                ) {
                                  return null;
                                }

                                let value = rawValue;
                                let isArray = false;
                                let parsedArray = [];
                                let isObject = false;

                                if (typeof value === 'string') {
                                  try {
                                    const parsed = JSON.parse(value);
                                    if (Array.isArray(parsed)) {
                                      isArray = true;
                                      parsedArray = parsed.filter(
                                        item =>
                                          item !== null &&
                                          item !== undefined &&
                                          item !== '',
                                      );
                                    } else if (
                                      typeof parsed === 'object' &&
                                      parsed !== null
                                    ) {
                                      isObject = true;
                                      value = parsed;
                                    }
                                  } catch {}
                                } else if (Array.isArray(value)) {
                                  isArray = true;
                                  parsedArray = value.filter(
                                    item =>
                                      item !== null &&
                                      item !== undefined &&
                                      item !== '',
                                  );
                                } else if (
                                  typeof value === 'object' &&
                                  value !== null &&
                                  !Array.isArray(value)
                                ) {
                                  isObject = true;
                                }

                                const isPhone = isPhoneField(key);

                                return (
                                  <View
                                    key={key}
                                    style={{
                                      flexDirection: isArray ? 'column' : 'row',
                                      marginBottom: 4,
                                      alignItems: isArray
                                        ? 'flex-start'
                                        : 'center',
                                    }}>
                                    <Text style={[styles.titleText]}>
                                      {capitalizeFirstLetter(
                                        fieldInfo.label || key,
                                      )}{' '}
                                      :
                                    </Text>
                                    {isArray ? (
                                      <View
                                        style={{marginTop: 2, width: '99%'}}>
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
                                                  fontFamily:
                                                    FONTS.FONT_FAMILY.SEMI_BOLD,
                                                  fontSize: FONTS.FONTSIZE.MINI,
                                                  color: COLORS.PRIMARYBLACK,
                                                  marginRight: 4,
                                                }}>
                                                {arrIdx + 1}.
                                              </Text>
                                              {fieldInfo.type === 'file' ? (
                                                <TouchableOpacity
                                                  onPress={() => {
                                                    if (
                                                      getFileType(arrItem) ===
                                                      'image'
                                                    ) {
                                                      navigation.navigate(
                                                        'FullImageScreen',
                                                        {image: arrItem},
                                                      );
                                                    } else if (
                                                      getFileType(arrItem) ===
                                                      'video'
                                                    ) {
                                                      navigation.navigate(
                                                        'VideoGalleryVideoScreen',
                                                        {videoData: arrItem},
                                                      );
                                                    }
                                                  }}>
                                                  <Text
                                                    style={{
                                                      fontFamily:
                                                        FONTS.FONT_FAMILY
                                                          .MEDIUM,
                                                      fontSize:
                                                        FONTS.FONTSIZE.MINI,
                                                      color: COLORS.TITLECOLOR,
                                                    }}>
                                                    {arrItem
                                                      ? typeof arrItem ===
                                                        'string'
                                                        ? arrItem.split(
                                                            '/',
                                                          )[1] || arrItem
                                                        : arrItem
                                                      : ''}
                                                  </Text>
                                                </TouchableOpacity>
                                              ) : typeof arrItem === 'object' &&
                                                arrItem !== null ? (
                                                <View
                                                  style={{
                                                    flexDirection: 'row',
                                                    flexWrap: 'wrap',
                                                  }}>
                                                  {Object.entries(arrItem).map(
                                                    ([k, v], i) => (
                                                      <Text
                                                        key={i}
                                                        style={styles.text}>
                                                        {k}: {v}{' '}
                                                      </Text>
                                                    ),
                                                  )}
                                                </View>
                                              ) : (
                                                <Text
                                                  style={{
                                                    fontFamily:
                                                      FONTS.FONT_FAMILY
                                                        .SEMI_BOLD,
                                                    fontSize:
                                                      FONTS.FONTSIZE.MINI,
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
                                      <View
                                        style={{
                                          flexDirection: 'column',
                                          marginLeft: 8,
                                        }}>
                                        {Object.entries(value).map(
                                          ([k, v], i) => (
                                            <Text key={i} style={styles.text}>
                                              {k}: {v}
                                            </Text>
                                          ),
                                        )}
                                      </View>
                                    ) : (
                                      <Text
                                        onPress={() => {
                                          if (fieldInfo.type === 'file') {
                                            if (
                                              getFileType(value) === 'image'
                                            ) {
                                              navigation.navigate(
                                                'FullImageScreen',
                                                {
                                                  image: value,
                                                },
                                              );
                                            } else if (
                                              getFileType(value) === 'video'
                                            ) {
                                              navigation.navigate(
                                                'VideoGalleryVideoScreen',
                                                {videoData: value},
                                              );
                                            }
                                          }
                                        }}
                                        style={{
                                          fontFamily:
                                            FONTS.FONT_FAMILY.SEMI_BOLD,
                                          fontSize: FONTS.FONTSIZE.MINI,
                                          color:
                                            fieldInfo.type === 'file'
                                              ? COLORS.TITLECOLOR
                                              : COLORS.PRIMARYBLACK,
                                          width: '50%',
                                          textAlign: 'left',
                                        }}>
                                        {value !== null &&
                                        value !== undefined &&
                                        value !== ''
                                          ? fieldInfo.type === 'date'
                                            ? moment(formatDate(value)).format(
                                                'DD MMMM YYYY',
                                              )
                                            : fieldInfo.type === 'time'
                                            ? formattedTime(value)
                                            : isPhone
                                            ? formatPhoneToUS(value)
                                            : value
                                          : '-'}
                                      </Text>
                                    )}
                                  </View>
                                );
                              },
                            )}
                          </View>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const goPrevious = () => {
    if (pageNumber > 1) {
      setPageNumber(prev => prev - 1);
    }
  };

  const loadMore = () => {
    if (hasMore && !isLoading) {
      setPageNumber(prev => prev + 1);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setOpenIndex(null);
    setSearchKeyword('');
    setDebouncedSearchKeyword('');
    setPageNumber(1);
    setAllUserData([]);
    getViewData();
  }, []);

  const onChangeSearch = useCallback(text => {
    setSearchKeyword(text); // Update UI immediately

    // Clear the previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout - API call happens after 500ms of no typing
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchKeyword(text);
      setPageNumber(1); // Reset to first page
    }, 500); // 500ms delay
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

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
              height: 38,
            }}>
            <TextInput
              placeholder="Search..."
              value={searchKeyword}
              onChangeText={onChangeSearch}
              style={[styles.searchInput, {flex: 1}]}
              returnKeyType="search"
              placeholderTextColor={COLORS.grey500}
            />
            {searchKeyword.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchKeyword('');
                  setDebouncedSearchKeyword('');
                }}
                style={{}}>
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
      {isLoading ? (
        <Loader />
      ) : isConnected ? (
        <View style={{flex: 1}}>
          {allUserData?.length > 0 ? (
            <FlatList
              keyboardShouldPersistTaps="handled"
              data={allUserData}
              initialNumToRender={10}
              maxToRenderPerBatch={20}
              windowSize={10}
              removeClippedSubviews={true}
              keyExtractor={item =>
                item.configurationId?.toString() || Math.random().toString()
              }
              renderItem={renderItem}
              contentContainerStyle={styles.listContainer}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
              <TouchableOpacity onPress={goPrevious} style={{}}>
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

export default FamilyMemberList;
