import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import COLORS from '../theme/Color';
import FONTS from '../theme/Fonts';
import NetInfo from '@react-native-community/netinfo';
import {NOTIFY_MESSAGE} from '../constant/Module';
import Loader from '../components/root/Loader';
import Offline from '../components/root/Offline';
import CustomHeader from '../components/root/CustomHeader';
import {FontAwesome6} from "@react-native-vector-icons/fontawesome6";
import httpClient from '../connection/httpClient';
import {useNetworkStatus} from '../connection/UseNetworkStatus';
import NoDataFound from '../components/root/NoDataFound';

const MemberSummary = ({route}) => {
  const {item} = route?.params?.data;

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      borderRadius: 8,
      marginVertical: 8,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      gap: 6,
    },
    card: {
      width: '32%',
      paddingVertical: 16,
      borderWidth: 1,
      borderColor: COLORS.LABELCOLOR,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 10,
      shadowColor: COLORS.PRIMARYBLACK,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
      backgroundColor: COLORS.PRIMARYWHITE,
      marginTop: 4,
    },
    fullWidthCard: {
      width: '100%',
      borderWidth: 1,
      borderColor: COLORS.LABELCOLOR,
      borderRadius: 8,
      alignItems: 'center',
      backgroundColor: COLORS.PRIMARYWHITE,
      shadowColor: COLORS.PRIMARYBLACK,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
      marginVertical: 4,
    },
    topHalf: {
      paddingVertical: 4,
      alignItems: 'center',
      justifyContent: 'center',
    },
    divider: {
      height: 1,
      backgroundColor: COLORS.LABELCOLOR,
      width: '100%',
      alignSelf: 'center',
    },
    verticalDivider: {
      width: 1,
      backgroundColor: COLORS.LABELCOLOR,
      height: '100%',
    },
    bottomHalf: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'stretch',
    },
    rsvpColumn: {
      alignItems: 'center',
      flex: 1,
      paddingVertical: 4,
    },
    value: {
      fontSize: FONTS.FONTSIZE.SEMI,
      color: COLORS.TITLECOLOR,
      fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    },
    label: {
      fontSize: FONTS.FONTSIZE.SEMIMINI,
      color: COLORS.PRIMARYBLACK,
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      textAlign: 'center',
      marginTop: 4,
    },
  });

  const {isConnected, networkLoading} = useNetworkStatus();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [memberSummary, setMemberSummary] = useState([]);

  useEffect(() => {
    getMemberSummary();
  }, []);

  const getMemberSummary = () => {
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setLoading(true);
        httpClient
          .get('member/dashboard')
          .then(response => {
            if (response.data.status) {
              const newData = response?.data?.result;

              if (newData?.length > 0) {
                setMemberSummary(newData);
              } else {
                setMemberSummary([]);
              }
            } else {
              NOTIFY_MESSAGE(
                response?.data?.message
                  ? response?.data?.message
                  : 'Something Went Wrong',
              );
            }
          })
          .catch(err => {
            setLoading(false);
            NOTIFY_MESSAGE(err || err?.message ? 'Something Went Wrong' : null);
            navigation.navigate('Dashboard');
          })
          .finally(() => setLoading(false));
      } else {
        NOTIFY_MESSAGE('Please check your internet connectivity');
      }
    });
  };

  const navigateToNameList = (title, type) => {
    navigation.navigate('NameListScreen', {title, type});
  };

  const renderStatisticCard = (label, value, type) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        navigateToNameList(label, type);
      }}>
      <Text style={styles.value}>
        {(type == 'TotalMembershipAmount' ||
          type == 'TotalPaidMembershipAmount' ||
          type == 'TotalUnpaidMembershipAmount') &&
        value
          ? `$${value}` || 0
          : value
          ? value || 0
          : 0}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );

  const [isReresh, setIsRefresh] = useState(false);
  const handleRefresh = async () => {
    setIsRefresh(true);
    await getMemberSummary();
    setIsRefresh(false);
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.BACKGROUNDCOLOR,
      }}>
      <CustomHeader
        leftIcon={
          <FontAwesome6 iconStyle='solid' name="angle-left" size={26} color={COLORS.LABELCOLOR} />
        }
        title={item?.name}
        leftOnPress={() => navigation.goBack()}
      />
      {networkLoading || loading ? (
        <Loader />
      ) : isConnected ? (
        <View style={{flex: 1}}>
          {memberSummary.length > 0 ? (
            <FlatList
              refreshControl={
                <RefreshControl
                  onRefresh={handleRefresh}
                  refreshing={isReresh}
                />
              }
              data={memberSummary}
              initialNumToRender={10}
              maxToRenderPerBatch={20}
              windowSize={10}
              removeClippedSubviews={true}
              keyExtractor={(item, index) => index?.toString()}
              renderItem={({item}) => {
                return (
                  <View style={styles.container}>
                    <View style={styles.grid}>
                      {renderStatisticCard(
                        'Total Members',
                        item?.totalMembers,
                        'TotalMembers',
                      )}
                      {renderStatisticCard(
                        'Total SignUp Members',
                        item?.totalRegisterMember,
                        'TotalRegisterMember',
                      )}
                      {renderStatisticCard(
                        'Members Completed Registration form',
                        item?.totalMembershipFilledGuest,
                        'TotalMembershipFilledGuest',
                      )}

                      {renderStatisticCard(
                        'Members Pending Registration form',
                        item?.totalMembershipUnfilledGuest,
                        'TotalMembershipUnfilledGuest',
                      )}
                      {renderStatisticCard(
                        'Total Membership Amount',
                        item?.totalMembershipAmount,
                        'TotalMembershipAmount',
                      )}
                      {renderStatisticCard(
                        'Total Paid Amount',
                        item?.totalPaidMembershipAmount,
                        'TotalPaidMembershipAmount',
                      )}
                      {renderStatisticCard(
                        'Total UnPaid Amount',
                        item?.totalUnpaidMembershipAmount,
                        'TotalUnpaidMembershipAmount',
                      )}
                    </View>
                  </View>
                );
              }}
            />
          ) : (
            <NoDataFound />
          )}
        </View>
      ) : (
        <Offline />
      )}
    </View>
  );
};

export default MemberSummary;
