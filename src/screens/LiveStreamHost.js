import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
} from 'react-native';
import COLORS from '../theme/Color';
import CustomHeader from '../components/root/CustomHeader';
import {useNavigation} from '@react-navigation/native';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import {
  AccessToken,
  GraphRequest,
  GraphRequestManager,
  LoginManager,
} from 'react-native-fbsdk-next';
import {getData, removeData, storeData} from '../utils/Storage';
import FONTS from '../theme/Fonts';
import Loader from '../components/root/Loader';
import {useNetworkStatus} from '../connection/UseNetworkStatus';
import Offline from '../components/root/Offline';
import NetInfo from '@react-native-community/netinfo';
import {NOTIFY_MESSAGE} from '../constant/Module';
import httpClient from '../connection/httpClient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const APP_ID = '703532215950853';
const APP_SECRET = '3454f7f726836eee4a25b0b8b623f139';

const TOKEN_STORAGE_KEY = 'fb_user_access_token';
const USER_INFO_KEY = 'fb_userinfo';

const LiveStreamHost = ({route}) => {
  const navigation = useNavigation();
  const {item} = route.params.data;

  const [userToken, setUserToken] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  const [pages, setPages] = useState([]);

  const [loadingPages, setLoadingPages] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await getData(TOKEN_STORAGE_KEY);
        if (token) {
          const valid = await checkTokenValidity(token);

          if (valid) {
            setUserToken(token);
          } else {
            await removeData(TOKEN_STORAGE_KEY);
            setUserToken(null);
          }
        }
      } catch (e) {
        setUserToken(null);
      } finally {
        setCheckingToken(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (userToken) {
      getUserInfoFromStorage();
      fetchPages(userToken);
    } else {
      setPages([]);
    }
  }, [userToken]);

  const checkTokenValidity = async token => {
    try {
      const appAccessToken = `${APP_ID}|${APP_SECRET}`;
      const url = `https://graph.facebook.com/debug_token?input_token=${token}&access_token=${appAccessToken}`;
      const res = await fetch(url);
      const json = await res.json();

      if (json.data && json.data.is_valid) {
        const currentTime = Math.floor(Date.now() / 1000);

        // If expires_at is 0, treat as non-expiring token
        if (json.data.expires_at === 0) {
          return true;
        }

        // Otherwise check expires_at timestamp
        if (json.data.expires_at && json.data.expires_at > currentTime) {
          return true;
        }

        // Optionally check data_access_expires_at if needed
        if (
          json.data.data_access_expires_at &&
          json.data.data_access_expires_at > currentTime
        ) {
          return true;
        }

        return false;
      }
      return false;
    } catch (error) {
      // console.error('Error checking token validity:', error);
      return false;
    }
  };

  const AddPages = async pages => {
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        httpClient
          .post('livestream/manage', pages)
          .then(response => {
            if (response.data.status) {
              // NOTIFY_MESSAGE(response?.data?.message);
            } else {
              NOTIFY_MESSAGE(
                response?.data?.message
                  ? response?.data?.message
                  : 'Something Went Wrong',
              );
            }
          })
          .catch(err => {
            NOTIFY_MESSAGE(err || err?.message ? 'Something Went Wrong' : null);
          });
      } else {
        NOTIFY_MESSAGE('Please check your internet connectivity');
      }
    });
  };

  const fetchPages = async token => {
    setLoadingPages(true);
    try {
      const response = await fetch(
        `https://graph.facebook.com/me/accounts?access_token=${token}`,
      );
      const result = await response.json();
      if (result?.error) {
        // Handle token expiry or invalid token
        if (result.error.code === 190) {
          Alert.alert(
            'Session expired',
            'Your Facebook session has expired. Please log in again.',
          );
          await logout();
          return;
        } else {
          Alert.alert(
            'Error fetching pages',
            result.error.message || 'Unknown error',
          );
          setPages([]);
          return;
        }
      }
      if (result?.data?.length > 0) {
        setPages(result.data);
        const filteredPages = result.data.map(page => ({
          access_token: page.access_token,
          category: page.category,
          name: page.name,
          id: page.id,
        }));
        await AddPages(filteredPages);
      } else {
        setPages([]);
      }
    } catch (error) {
      Alert.alert('Error fetching pages', error.message || 'Unknown error');
      setPages([]);
    } finally {
      setLoadingPages(false);
    }
  };

  const onPagePress = page => {
    navigation.navigate('LiveBroadcast', {
      pageId: page.id,
      pageAccessToken: page.access_token,
      pageName: page.name,
    });
  };

  const renderPageItem = ({item}) => (
    <TouchableOpacity
      style={styles.pageItem}
      onPress={() => onPagePress(item)}
      activeOpacity={0.7}>
      <Text style={styles.pageName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const handleFBLogin = async () => {
    try {
      // LoginManager.setLoginBehavior('web_only');
      const result = await LoginManager.logInWithPermissions([
        'public_profile',
        'email',
        'pages_manage_posts',
        'pages_show_list',
        'publish_video',
        // 'pages_manage_live_video',
        // 'pages_manage_engagement',
        // 'pages_read_user_content',
        'business_management',
      ]);
      console.log('result : ', result);

      if (result.isCancelled) {
        // Alert.alert('Login cancelled');
      } else {
        const data = await AccessToken.getCurrentAccessToken();
        if (data) {
          const accessToken = data?.accessToken?.toString();
          await storeData(TOKEN_STORAGE_KEY, accessToken);
          setUserToken(accessToken);
          getUserInfo(accessToken);
        } else {
          Alert.alert('Failed to get access token');
        }
      }
    } catch (error) {
      Alert.alert('Login failed', error.message);
    }
  };

  const logout = async () => {
    await removeData(TOKEN_STORAGE_KEY);
    await removeData(USER_INFO_KEY);
    setUserToken(null);
    setUserInfo(null);
    setPages([]);
  };

  const getUserInfoFromStorage = async () => {
    try {
      const jsonValue = await getData(USER_INFO_KEY);
      const jsonValue1 = jsonValue != null ? JSON.parse(jsonValue) : null;
      setUserInfo(jsonValue1);
    } catch (e) {
      // console.log('Failed to load user info', e);
      setUserInfo(null);
    }
  };

  const getUserInfo = token => {
    const infoRequest = new GraphRequest(
      '/me',
      {
        accessToken: token,
        parameters: {
          fields: {
            string: 'id,name,email,picture.type(large)',
          },
        },
      },
      async (error, result) => {
        if (error) {
          Alert.alert(
            'Error fetching user info',
            'Your session may have expired. Please log in again.',
          );
          await logout();
        } else {
          setUserInfo(result);
          await storeData(USER_INFO_KEY, JSON.stringify(result));
        }
      },
    );
    new GraphRequestManager().addRequest(infoRequest).start();
  };

  const revokeFBPermissions = accessToken => {
    return new Promise((resolve, reject) => {
      const logoutRequest = new GraphRequest(
        '/me/permissions/',
        {
          accessToken,
          httpMethod: 'DELETE',
        },
        (error, result) => {
          if (error) {
            // console.log('Error revoking permissions:', error.toString());
            reject(error);
          } else {
            // console.log('Permissions revoked:', result);
            resolve(result);
          }
        },
      );
      new GraphRequestManager().addRequest(logoutRequest).start();
    });
  };

  const handleFBLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {},
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            // const data = await AccessToken.getCurrentAccessToken();
            // if (data) {
            //   // Revoke permissions via Graph API
            //   await revokeFBPermissions(data.accessToken.toString());
            // }

            LoginManager.logOut();
            await logout();
          },
        },
      ],
      {cancelable: true},
    );
  };

  const {isConnected, networkLoading} = useNetworkStatus();

  return (
    <View style={styles.container}>
      <CustomHeader
        leftOnPress={() => navigation.goBack()}
        leftIcon={
          <FontAwesome6 name="angle-left" size={26} color={COLORS.LABELCOLOR} />
        }
        title={item?.name || 'Live Stream Host'}
      />
      {networkLoading || checkingToken || loadingPages ? (
        <Loader />
      ) : isConnected ? (
        <View style={styles.content}>
          {!userToken ? (
            <View style={styles.loginContainer}>
              <TouchableOpacity
                style={{
                  backgroundColor: '#1877F2',
                  paddingVertical: 12,
                  paddingHorizontal: 30,
                  borderRadius: 6,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
                onPress={handleFBLogin}
                activeOpacity={0.8}>
                <FontAwesome6
                  name="facebook"
                  size={22}
                  color="#fff"
                  style={{marginRight: 8}}
                />
                <Text
                  style={{
                    color: '#fff',
                    fontSize: 16,
                    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                  }}>
                  Login with Facebook
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{flex: 1}}>
              {userInfo && (
                <View
                  style={{
                    backgroundColor: '#1877F2',
                    padding: 10,
                    justifyContent: 'space-between',
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderRadius: 10,
                  }}>
                  <Text
                    style={{
                      color: COLORS.PRIMARYWHITE,
                      fontSize: FONTS.FONTSIZE.MEDIUM,
                      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                    }}>
                    {userInfo?.name || 'User'}
                  </Text>
                  <TouchableOpacity onPress={handleFBLogout}>
                    <MaterialIcons
                      name="logout"
                      size={26}
                      color={COLORS.PRIMARYWHITE}
                    />
                  </TouchableOpacity>
                </View>
              )}

              {pages.length > 0 ? (
                <>
                  <Text
                    style={{
                      marginTop: 10,
                      fontSize: FONTS.FONTSIZE.MEDIUM,
                      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                      color: COLORS.TITLECOLOR,
                    }}>
                    Select Facebook Page :
                  </Text>
                  <FlatList
                    data={pages}
                    keyExtractor={item => item.id}
                    renderItem={renderPageItem}
                    contentContainerStyle={styles.listContainer}
                  />
                </>
              ) : (
                <View
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <Text
                    style={{
                      fontSize: FONTS.FONTSIZE.MEDIUM,
                      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                      color: COLORS.PLACEHOLDERCOLOR,
                    }}>
                    No Page Found.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      ) : (
        <Offline />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUNDCOLOR,
  },
  content: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  pageItem: {
    backgroundColor: COLORS.PRIMARYWHITE,
    padding: 10,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  pageName: {
    fontSize: FONTS.FONTSIZE.MEDIUM,
    color: COLORS.TITLECOLOR,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LiveStreamHost;
