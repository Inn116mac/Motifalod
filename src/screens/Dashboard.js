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
  Platform,
  Linking,
} from 'react-native';
import React, {useCallback, useContext, useEffect, useRef, useState} from 'react';
import COLORS from '../theme/Color';
import FONTS from '../theme/Fonts';
import {getData} from '../utils/Storage';
import NetInfo from '@react-native-community/netinfo';
import {IMAGE_URL} from '../connection/Config';
import {NOTIFY_MESSAGE} from '../constant/Module';
import Loader from '../components/root/Loader';
import {Ionicons} from '@react-native-vector-icons/ionicons';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import Offline from '../components/root/Offline';
import NoDataFound from '../components/root/NoDataFound';
import {useNetworkStatus} from '../connection/UseNetworkStatus';
import httpClient from '../connection/httpClient';
import {DrawerContext} from '../utils/DrawerContext';
import FastImage from 'react-native-fast-image';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import RNExitApp from 'react-native-exit-app';
import Carousel from 'react-native-reanimated-carousel';

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

  const [hasRsvpPermission, setHasRsvpPermission] = useState(false);
  const [hasEventDashboardPermission, setHasEventDashboardPermission] =
    useState(false);
  const [hasScanQrPermission, setHasScanQrPermission] = useState(false);
  const [activeSponsorIndex, setActiveSponsorIndex] = useState(0);
  const [sponsors, setSponsors] = useState([]);
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        Alert.alert('Exit App', 'Do you want to exit the app?', [
          {
            text: 'Cancel',
            onPress: () => null,
            style: 'cancel',
          },
          {
            text: 'YES',
            onPress: () => {
              RNExitApp.exitApp();
            },
          },
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
                item?.constantName?.toUpperCase() == 'SCAN QR' ||
                item?.constantName?.toUpperCase() == 'SELF CHECK-IN' ||
                item?.constantName?.toUpperCase() == 'EVENT ADMIN',
            );
            setDrawerItems(storeItems);
            // ADD THESE
            const rsvpPerm = filteredData.some(
              item => item?.constantName?.toUpperCase() === 'RSVP',
            );
            const eventDashPerm = filteredData.some(
              item => item?.constantName?.toUpperCase() === 'EVENT DASHBOARD',
            );
            const scanQrPerm = filteredData.some(
              item => item?.constantName?.toUpperCase() === 'SCAN QR',
            );
            setHasRsvpPermission(rsvpPerm);
            setHasEventDashboardPermission(eventDashPerm);
            setHasScanQrPermission(scanQrPerm);

            const sponsorModule = filteredData.find(
              item => item?.constantName?.toUpperCase() === 'SPONSORS',
            );

            if (sponsorModule?.moduleId) {
              fetchSponsors(sponsorModule);
            }

            const newArray = filteredData.filter(
              item =>
                item?.constantName?.toUpperCase() !== 'SCAN QR' &&
                item?.constantName?.toUpperCase() !== 'SELF CHECK-IN' &&
                item?.constantName?.toUpperCase() !== 'EVENT ADMIN' &&
                item?.constantName?.toUpperCase() !== 'ROLE MANAGEMENT' &&
                item?.constantName?.toUpperCase() !== 'MEMBERSHIP MANAGEMENT' &&
                item?.constantName?.toUpperCase() !==
                  'NOTIFICATION MANAGEMENT' &&
                item?.constantName?.toUpperCase() !== 'REMINDER MANAGEMENT' &&
                item?.constantName?.toUpperCase() !== 'TRANSACTIONS' &&
                item?.constantName?.toUpperCase() !== 'MODULE MANAGEMENT' &&
                item?.constantName?.toUpperCase() !== 'APP SETTINGS' &&
                item?.constantName?.toUpperCase() !== 'PAYMENT CREDENTIALS' &&
                item?.constantName?.toUpperCase() !== 'APP VERSION SETTING' &&
                item?.constantName?.toUpperCase() !== 'CONTACT US' &&
                item?.constantName?.toUpperCase() !== 'HOME SLIDER',
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
      const member = userData.member.content;
      let memberParse;
      try {
        memberParse = JSON.parse(member);
        const firstName = memberParse?.firstName;
        setFirstName(firstName?.value);
      } catch (error) {
        console.error('Failed to parse userData member content:', error);
      }
    }
  }, [userData]);

  const fetchSponsors = async sponsorModule => {
    if (!sponsorModule?.moduleId) return;
    const state = await NetInfo.fetch();
    if (!state.isConnected) return;
    try {
      const payload = {
        pageNumber: 1,
        pageSize: 100,
        keyword: '',
        orderBy: 'order',
        orderType: -1,
        type: sponsorModule?.constantName,
        eventId: 0,
      };
      const response = await httpClient.post(
        'module/mobile/configuration/pagination',
        payload,
      );
      if (response.data.status && response.data.result?.data?.length > 0) {
        const raw = response.data.result.data;
        const parsed = raw.map(record => {
          let content = {};
          try {
            content = JSON.parse(record.content);
          } catch {}

          const businessName = content?.businessName?.value || '';
          const tier = content?.grandSponsors?.value || '';
          const description = content?.shortBusinessDescription?.value || null;
          const website = content?.websiteLink?.value || null;

          // picture value is a JSON string array e.g. "[\"content/xyz.png\"]"
          let logoPath = null;
          try {
            const picRaw = content?.picture?.value;
            if (picRaw && picRaw !== '[]') {
              const picArr = JSON.parse(picRaw);
              if (picArr?.length > 0) {
                logoPath = picArr[0];
              }
            }
          } catch {}

          return {
            id: record.configurationId,
            name: businessName,
            description: description || null,
            tier,
            logo: logoPath,
            website,
            initials: businessName
              .split(' ')
              .map(w => w[0])
              .join('')
              .toUpperCase()
              .slice(0, 3),
          };
        });
        if (isMounted.current) setSponsors(parsed);
      } else {
        if (isMounted.current) setSponsors([]);
      }
    } catch (err) {
      console.log('Sponsors fetch error:', err);
    }
  };

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
            if (constantName?.trim() === 'EVENT') {
              navigation.navigate('EventScreen', {
                data: data,
                hasRsvpPermission,
                hasEventDashboardPermission,
                hasScanQrPermission,
              });
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
              navigation.navigate('BroadcasterScreen', {
                data: data,
              });
            } else if (constantName === 'JOIN FB LIVE') {
              navigation.navigate('ViewerScreen', {
                data: data,
              });
            } else if (constantName === 'MEMBER SUMMARY') {
              navigation.navigate('MemberSummary', {
                data: data,
              });
            } else if (constantName === 'POLL') {
              navigation.navigate('PollList', {
                data: data,
              });
            } else if (constantName === 'GALLERY') {
              navigation.navigate('Gallery', {
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

  const TIER_CONFIG = {
    'Grand Sponsor': {
      emoji: '💎',
      cardTopBorder: '#E8F4FF',
      badgeBg: '#f4a6201b',
      badgeBorder: '#F4A820',
      badgeText: '#8B6914',
    },
    'Platinum Sponsor': {
      emoji: '🥇',
      cardTopBorder: '#9c5fcb',
      badgeBg: '#F0F0F0',
      badgeBorder: '#C0C0C0',
      badgeText: '#4A4A4A',
    },
    'Gold Sponsor': {
      emoji: '🏅',
      cardTopBorder: '#FFF8DC',
      badgeBg: '#FFF8DC',
      badgeBorder: '#F0C040',
      badgeText: '#8B6914',
    },
    'Silver Sponsor': {
      emoji: '🥈',
      cardTopBorder: '#E8F4FF',
      badgeBg: '#E8F4FF',
      badgeBorder: '#c0c0c0',
      badgeText: '#555555',
    },
    'Community Partner': {
      emoji: '🤝',
      cardTopBorder: '#43a047',
      badgeBg: '#f0f8f0',
      badgeBorder: '#a8d5a8',
      badgeText: '#2e7d32',
    },
  };

  const DEFAULT_TIER = {
    cardTopBorder: '#eb9e2c',
    badgeBg: COLORS.NEWBG,
    badgeBorder: '#d4a96a',
    badgeText: COLORS.LABELCOLOR,
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.BACKGROUNDCOLOR,
      }}>
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
            <MaterialDesignIcons
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
                paddingBottom: 20,
                flexGrow: 1,
              }}
              ListFooterComponent={
                sponsors.length > 0 && (
                  <View style={{paddingBottom: 10}}>
                    <Text
                      style={{
                        fontSize: FONTS.FONTSIZE.EXTRASMALL,
                        fontFamily: FONTS.FONT_FAMILY.BOLD,
                        color: COLORS.PLACEHOLDERCOLOR,
                        margin: 10,
                      }}>
                      Our Sponsors
                    </Text>

                    <Carousel
                      width={width / 1.05}
                      height={140}
                      loop
                      autoPlay
                      autoPlayInterval={3000}
                      scrollAnimationDuration={600}
                      style={{marginHorizontal: 6}}
                      panGestureHandlerProps={{activeOffsetX: [-10, 10]}}
                      onSnapToItem={index => setActiveSponsorIndex(index)}
                      data={sponsors}
                      renderItem={({item}) => {
                        const handlePress = () => {
                          if (item.website) {
                            const url = item.website.startsWith('http')
                              ? item.website
                              : `https://${item.website}`;
                            Linking.openURL(url).catch(() =>
                              NOTIFY_MESSAGE('Could not open URL'),
                            );
                          }
                        };

                        const tierStyle =
                          TIER_CONFIG[item.tier] ?? DEFAULT_TIER;
                        return (
                          <TouchableOpacity
                            onPress={handlePress}
                            disabled={!item.website}
                            style={{flex: 1}}>
                            <View
                              style={{
                                flex: 1,
                                backgroundColor: COLORS.PRIMARYWHITE,
                                borderRadius: 12,
                                padding: 14,
                                borderLeftWidth: 1.5,
                                borderColor: '#e0b23f',
                                borderTopWidth: 4,
                                borderRightWidth: 1.5,
                                borderBottomWidth: 1.5,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 12,
                                marginHorizontal: 3,
                              }}>
                              {item.logo ? (
                                <View
                                  style={{
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    overflow: 'hidden',
                                  }}>
                                  <Image
                                    source={{uri: `${IMAGE_URL}${item.logo}`}}
                                    style={{width: 100, height: 100}}
                                    resizeMode="contain"
                                  />
                                </View>
                              ) : (
                                <View
                                  style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: 10,
                                    backgroundColor: tierStyle.badgeBg,
                                    borderWidth: 1,
                                    borderColor: tierStyle.badgeBorder,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    overflow: 'hidden',
                                  }}>
                                  <Text
                                    style={{
                                      fontSize: FONTS.FONTSIZE.SMALL,
                                      fontFamily: FONTS.FONT_FAMILY.BOLD,
                                      color: tierStyle.badgeText,
                                      includeFontPadding: false,
                                    }}>
                                    {item.initials}
                                  </Text>
                                </View>
                              )}

                              <View style={{flex: 1, gap: 8}}>
                                <Text
                                  numberOfLines={2}
                                  style={{
                                    fontSize: FONTS.FONTSIZE.SMALL,
                                    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
                                    color: COLORS.TITLECOLOR,
                                  }}>
                                  {item.name}
                                </Text>
                                {!!item.description && (
                                  <Text
                                    numberOfLines={1}
                                    style={{
                                      fontSize: FONTS.FONTSIZE.EXTRAMINI,
                                      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                                      color: COLORS.LABELCOLOR,
                                    }}>
                                    {item.description}
                                  </Text>
                                )}

                                <View
                                  style={{
                                    alignSelf: 'flex-start',
                                    backgroundColor: tierStyle.badgeBg,
                                    borderRadius: 20,
                                    paddingHorizontal: 10,
                                    paddingVertical: 6,
                                    borderWidth: 1,
                                    borderColor: tierStyle.badgeBorder,
                                  }}>
                                  <Text
                                    numberOfLines={1}
                                    style={{
                                      fontSize: FONTS.FONTSIZE.MINI,
                                      fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
                                      color: tierStyle.badgeText,
                                      includeFontPadding: false,
                                    }}>
                                    {tierStyle.emoji
                                      ? `${tierStyle.emoji} `
                                      : ''}
                                    {item.tier}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      }}
                    />
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 6,
                        marginTop: 8,
                      }}>
                      {sponsors.map((_, i) => (
                        <View
                          key={i}
                          style={{
                            width: i === activeSponsorIndex ? 16 : 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor:
                              i === activeSponsorIndex ? '#814517' : '#e0c498',
                          }}
                        />
                      ))}
                    </View>
                  </View>
                )
              }
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
