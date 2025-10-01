import {
  View,
  Text,
  Image,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  useWindowDimensions,
  BackHandler,
  Alert,
} from 'react-native';
import React, {useCallback, useContext, useEffect, useState} from 'react';
import COLORS from '../theme/Color';
import FONTS from '../theme/Fonts';
import {getData} from '../utils/Storage';
import NetInfo from '@react-native-community/netinfo';
import {IMAGE_URL} from '../connection/Config';
import {NOTIFY_MESSAGE} from '../constant/Module';
import Loader from '../components/root/Loader';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import Offline from '../components/root/Offline';
import NoDataFound from '../components/root/NoDataFound';
import {useNetworkStatus} from '../connection/UseNetworkStatus';
import CustomHeader from '../components/root/CustomHeader';
import httpClient from '../connection/httpClient';
import {DrawerContext} from '../utils/DrawerContext';
import FastImage from 'react-native-fast-image';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const Dashboard = ({route}) => {
  const [userData, setUserData] = useState(null);
  const [userDataLoading, setUserDataLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [isReresh, setIsRefresh] = useState(false);
  const navigation = useNavigation();
  const [firstName, setFirstName] = useState('');
  const {width} = useWindowDimensions();
  const {isConnected, networkLoading} = useNetworkStatus();
  const [drawerItems, setDrawerItems] = useState([]);

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        Alert.alert('Exit App', 'Do you want to exit the app?', [
          {
            text: 'Cancel',
            onPress: () => null,
            style: 'cancel',
          },
          {text: 'YES', onPress: () => BackHandler.exitApp()},
        ]);
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction,
      );

      return () => backHandler.remove();
    }, []),
  );

  const getUser = async () => {
    const user = await getData('user');
    setUserData(user);
    setUserDataLoading(false);
  };
  useEffect(() => {
    getUser();
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      dashboardApiCall().finally(() => setLoading(false));
    }, []),
  );

  useEffect(() => {
    if (userData && !userDataLoading) {
      dashboardApiCall();
    }
  }, [userData, userDataLoading]);

  const dashboardApiCall = async () => {
    const state = await NetInfo.fetch();
    if (state.isConnected) {
      setLoading(true);
      try {
        const response = await httpClient.get('module/all');
        if (response.data.status) {
          const {result} = response.data;

          if (result && result?.length > 0) {
            const filteredData = result.filter(item => item.read == true);

            const storeItems = filteredData.filter(
              item =>
                item?.constantName == 'SCAN QR' ||
                item?.constantName == 'SELF CHECK-IN' ||
                item?.constantName == 'EVENT ADMIN',
            );
            setDrawerItems(storeItems);
            const newArray = filteredData.filter(
              item =>
                item?.constantName !== 'SCAN QR' &&
                item?.constantName !== 'SELF CHECK-IN' &&
                item?.constantName !== 'EVENT ADMIN',
            );
            if (newArray?.length > 0) {
              setData(newArray);
            } else {
              setData([]);
            }
          } else {
            setData([]);
          }
        } else {
          NOTIFY_MESSAGE(
            response?.data?.message
              ? response?.data?.message
              : 'Something Went Wrong',
          );
        }
      } catch (err) {
        NOTIFY_MESSAGE(err?.message ? err.message : 'Something Went Wrong');
      } finally {
        setLoading(false);
      }
    } else {
      NOTIFY_MESSAGE('Please check your internet connectivity');
    }
  };

  const handleRefresh = async () => {
    setIsRefresh(true);
    await dashboardApiCall();
    setIsRefresh(false);
  };

  useEffect(() => {
    if (userData && userData?.member) {
      const member = userData?.member?.content;
      const memberParse = JSON.parse(member);
      const firstName = memberParse?.firstName;
      setFirstName(firstName?.value);
    }
  }, [userData]);

  const renderItem = ({item, index}) => {
    return (
      <TouchableOpacity
        style={{
          margin: 4,
          borderWidth: 1,
          borderColor: COLORS.LABELCOLOR,
          width: width / 2.18,
          borderRadius: 10,
          padding: 4,
          paddingLeft: 8,
        }}
        onPress={() => {
          let data = {
            item: item,
            isTabView: item?.isForm,
          };

          const constantName = item?.constantName?.toUpperCase();

          if (data?.isTabView) {
            if (constantName === 'FAMILY MEMBER') {
              navigation.navigate('Registration1', {
                data: data,
              });
            } else if (constantName === 'IMAGE GALLERY') {
              navigation.navigate('ImageGallery', {data: data});
            } else if (constantName === 'VIDEO GALLERY') {
              navigation.navigate('VideoGallery', {data: data});
            } else {
              navigation.navigate('Form', {data: data});
            }
          } else {
            if (constantName === 'EVENT' || constantName === 'EVENT ') {
              navigation.navigate('EventScreen', {data: data});
            } else if (constantName === 'SCAN QR') {
              navigation.navigate('QRcode Scanner', {
                data: data,
              });
            } else if (
              constantName === 'EVENT ATTENDEES' ||
              constantName === 'EVENT ATTENDEE'
            ) {
              navigation.navigate('EventAttendee', {
                data: data,
              });
            } else if (constantName === 'EVENT ADMIN') {
              navigation.navigate('FormRecords', {
                data: data,
              });
            } else if (constantName === 'EVENT DASHBOARD') {
              navigation.navigate('EventDashboard', {
                data: data,
              });
            } else if (constantName === 'REPORTS') {
              navigation.navigate('ReportsList', {
                data: data,
              });
            } else if (constantName === 'FB LIVE STREAM') {
              // navigation.navigate('LiveStreamHost', {
              //   data: data,
              // });
              navigation.navigate('BroadcasterScreen', {
                data: data,
              });
            } else if (constantName === 'JOIN FB LIVE') {
              // navigation.navigate('LiveStreamView', {
              //   data: data,
              // });
              navigation.navigate('ViewerScreen', {
                data: data,
              });
            } else if (constantName === 'MEMBER SUMMARY') {
              navigation.navigate('MemberSummary', {
                data: data,
              });
            } else {
              navigation.navigate('View', {data: data});
            }
          }
        }}>
        <FastImage
          source={{
            uri: `${IMAGE_URL}${item?.icon}`,
            cache: FastImage.cacheControl.immutable,
            priority: FastImage.priority.normal,
          }}
          style={{
            height: 30,
            width: 30,
          }}
          resizeMode="contain"
        />
        <Text
          numberOfLines={2}
          style={{
            fontSize: FONTS.FONTSIZE.SEMI,
            fontFamily: FONTS.FONT_FAMILY.MEDIUM,
            color: COLORS.PLACEHOLDERCOLOR,
            paddingVertical: 0,
            includeFontPadding: false,
          }}>
          {item?.constantName == 'FAMILY MEMBER' ? 'Registration' : item?.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const {setDrawerData} = useContext(DrawerContext);

  const openDrawerWithData = () => {
    setDrawerData(drawerItems);
    navigation.openDrawer();
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.BACKGROUNDCOLOR,
      }}>
      {/* <CustomHeader
        leftOnPress={() => {
          openDrawerWithData();
        }}
        leftIcon={<Ionicons name="menu" color={COLORS.LABELCOLOR} size={32} />}
        title={`Welcome ${
          userData?.user?.firstName ? userData?.user?.firstName : firstName
        }!`}
        rightIcon={
          <MaterialCommunityIcons
            name="sort"
            color={COLORS.LABELCOLOR}
            size={28}
          />
        }
        rightOnPress={() => {
          navigation.navigate('ReorderList');
        }}
      /> */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <TouchableOpacity
            activeOpacity={0.35}
            onPress={() => {
              openDrawerWithData();
            }}>
            <Ionicons
              name="menu"
              color={COLORS.LABELCOLOR}
              size={32}
              style={{
                paddingRight: 8,
                paddingLeft: 10,
                paddingVertical: 10,
              }}
            />
          </TouchableOpacity>
          <Text
            numberOfLines={1}
            style={{
              fontSize: FONTS.FONTSIZE.LARGE,
              color: COLORS.LABELCOLOR,
              fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
              paddingHorizontal: 4,
              width: width - 130,
            }}>{`Welcome ${
            userData?.user?.firstName ? userData?.user?.firstName : firstName
          }!`}</Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            marginRight: 8,
          }}>
          {/* <TouchableOpacity
            activeOpacity={0.35}
            onPress={() => {
              navigation.navigate('NotificationScreen');
            }}>
            <FontAwesome name="bell-o" color={COLORS.LABELCOLOR} size={25} />
          </TouchableOpacity> */}
          <TouchableOpacity
            activeOpacity={0.35}
            onPress={() => {
              navigation.navigate('ReorderList');
            }}>
            <MaterialCommunityIcons
              name="sort"
              color={COLORS.LABELCOLOR}
              size={28}
            />
          </TouchableOpacity>
        </View>
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 10,
          gap: 10,
          justifyContent: 'center',
        }}>
        <Image
          resizeMode={'contain'}
          source={require('../assets/images/Logo.png')}
          style={{
            width: 60,
            height: 60,
          }}
        />
        <Text
          style={{
            textAlign: 'center',
            fontSize: FONTS.FONTSIZE.EXTRALARGE,
            fontFamily: FONTS.FONT_FAMILY.BOLD,
            color: COLORS.TITLECOLOR,
            includeFontPadding: false,
          }}>
          Moti Falod
        </Text>
      </View>

      {networkLoading || userDataLoading || loading ? (
        <Loader />
      ) : isConnected ? (
        data.length > 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <FlatList
              refreshControl={
                <RefreshControl
                  onRefresh={handleRefresh}
                  refreshing={isReresh}
                />
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: 10,
                flexGrow: 1,
              }}
              removeClippedSubviews={true}
              maxToRenderPerBatch={30}
              updateCellsBatchingPeriod={200}
              windowSize={40}
              initialNumToRender={10}
              numColumns={2}
              data={data}
              keyExtractor={(item, index) => String(index)}
              renderItem={renderItem}
            />
          </View>
        ) : (
          <NoDataFound />
        )
      ) : (
        <Offline />
      )}
    </View>
  );
};

export default Dashboard;
