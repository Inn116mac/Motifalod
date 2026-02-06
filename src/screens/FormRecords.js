import {
  BackHandler,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {
  DrawerActions,
  useIsFocused,
  useNavigation,
} from '@react-navigation/native';
import COLORS from '../theme/Color';
import FONTS from '../theme/Fonts';
import NetInfo from '@react-native-community/netinfo';
import {getData} from '../utils/Storage';
import {NOTIFY_MESSAGE} from '../constant/Module';
import Loader from '../components/root/Loader';
import Offline from '../components/root/Offline';
import CustomHeader from '../components/root/CustomHeader';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {AntDesign} from '@react-native-vector-icons/ant-design';
import httpClient from '../connection/httpClient';
import {useNetworkStatus} from '../connection/UseNetworkStatus';
import NoDataFound from '../components/root/NoDataFound';
import {IMAGE_URL} from '../connection/Config';

const FormRecords = ({route}) => {
  const styles = StyleSheet.create({
    itemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.PRIMARYWHITE,
      borderRadius: 15,
      marginHorizontal: 10,
      marginVertical: 6,
      paddingVertical: 10,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: '#e5e7eb',
    },
    itemTexts: {
      flex: 1,
      justifyContent: 'center',
    },
    mainText: {
      fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
      fontSize: FONTS.FONTSIZE.EXTRASMALL,
      color: '#111827',
    },
    descText: {
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      fontSize: FONTS.FONTSIZE.SEMIMINI,
      color: '#6b7280',
    },
    arrowBox: {
      marginLeft: 10,
    },
  });
  const {item} = route?.params?.data;
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [isReresh, setIsRefresh] = useState(false);
  const {isConnected, networkLoading} = useNetworkStatus();
  const isFocused = useIsFocused();

  const getUser = async () => {
    const user = await getData('user');
    setUserData(user);
  };

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    dashboardApiCall();
  }, [userData, isFocused]);

  const dashboardApiCall = () => {
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setLoading(true);
        httpClient
          .get(`module/all`)
          .then(response => {
            if (response.data.status) {
              if (response.data.result.length > 0) {
                const filteredData = response.data.result.filter(
                  item => item.read == true,
                );
                const newArray = filteredData.filter(
                  item =>
                    item?.constantName !== 'SCAN QR' &&
                    item?.constantName !== 'SELF CHECK-IN' &&
                    item?.constantName !== 'EVENT ADMIN' &&
                    item?.constantName !== 'EVENT ATTENDEES' &&
                    item?.constantName !== 'EVENT ATTENDEE' &&
                    item?.constantName !== 'REPORTS' &&
                    item?.constantName !== 'MEMBER SUMMARY' &&
                    item?.constantName !== 'EVENT DASHBOARD' &&
                    item?.constantName !== 'FB LIVE STREAM' &&
                    item?.constantName !== 'JOIN FB LIVE',
                );

                setData(newArray);
              } else {
                setData([]);
              }
            } else {
              NOTIFY_MESSAGE(response?.data?.message);
            }
          })
          .catch(err => {
            setLoading(false);
            NOTIFY_MESSAGE(err || err?.message ? 'Something Went Wrong' : null);
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
        NOTIFY_MESSAGE('Please check your internet connectivity');
      }
    });
  };

  const onRefreshAction = async () => {
    setIsRefresh(true);
    await dashboardApiCall();
    setIsRefresh(false);
  };

  const renderItem = ({item, index}) => {
    return (
      <TouchableOpacity
        key={index}
        style={styles.itemContainer}
        activeOpacity={0.8}
        onPress={() => {
          let data = {item, isTabView: false, isTable: true};
          if (item?.constantName === 'MEMBERSHIP MANAGEMENT') {
            navigation.navigate('MembershipPrice', (item = {data}));
          } else if (item?.constantName == 'ROLE MANAGEMENT') {
            navigation.navigate('RoleManagement', (item = {data}));
          } else if (item?.constantName === 'NOTIFICATION MANAGEMENT') {
            navigation.navigate('NotificationManagement', (item = {data}));
          } else if (item?.constantName === 'REMINDER MANAGEMENT') {
            navigation.navigate('ReminderList', (item = {data}));
          } else if (item?.constantName == 'FAMILY MEMBER') {
            navigation.navigate('FamilyMemberList', (item = {data}));
          } else if (item?.constantName == 'TRANSACTIONS') {
            navigation.navigate('Transactions', (item = {data}));
          } else if (item?.constantName == 'MODULE MANAGEMENT') {
            navigation.navigate('ModuleList', (item = {data}));
          } else if (item?.constantName == 'APP SETTINGS') {
            navigation.navigate('AppSettings', (item = {data}));
          } else if (item?.constantName == 'PAYMENT CREDENTIALS') {
            navigation.navigate('PaymentCredList', (item = {data}));
          } else {
            navigation.navigate('TableScreen', (item = {data}));
          }
        }}>
        <View
          style={[
            {
              borderRadius: 12,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 10,
            },
          ]}>
          <Image
            source={{
              uri: `${IMAGE_URL}${item?.icon}`,
            }}
            style={{
              height: 38,
              width: 38,
            }}
            resizeMode="contain"
          />
        </View>
        <View style={styles.itemTexts}>
          <Text style={[styles.mainText]}>{item?.name}</Text>
          {item?.description && (
            <Text style={styles.descText}>{item?.description}</Text>
          )}
        </View>
        <View style={styles.arrowBox}>
          <AntDesign name="right" size={18} color="#FB8C00" />
        </View>
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (navigation.isFocused()) {
          navigation.dispatch(DrawerActions.closeDrawer());
          navigation.goBack();
          return true;
        }
        return false;
      },
    );

    return () => backHandler.remove();
  }, [navigation]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.BACKGROUNDCOLOR,
      }}>
      <CustomHeader
        leftIcon={
          <FontAwesome6
            name="angle-left"
            size={26}
            color={COLORS.LABELCOLOR}
            iconStyle="solid"
          />
        }
        title={item?.name}
        leftOnPress={() => navigation.navigate('Dashboard')}
      />
      {networkLoading || loading ? (
        <Loader />
      ) : isConnected ? (
        data.length > 0 ? (
          <FlatList
            refreshControl={
              <RefreshControl
                onRefresh={onRefreshAction}
                refreshing={isReresh}
              />
            }
            data={data}
            renderItem={renderItem}
            keyExtractor={(item, index) => index?.toString()}
            contentContainerStyle={{paddingBottom: 20}}
            removeClippedSubviews={true}
            maxToRenderPerBatch={30}
            updateCellsBatchingPeriod={200}
            windowSize={40}
            initialNumToRender={10}
          />
        ) : (
          <NoDataFound />
        )
      ) : (
        <Offline />
      )}
    </View>
  );
};

export default FormRecords;
