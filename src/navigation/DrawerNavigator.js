import React, {useContext, useEffect, useState} from 'react';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import {
  View,
  Text,
  Dimensions,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import Dashboard from '../screens/Dashboard';
import MemberScreen from '../screens/MemberScreen';
import COLORS from '../theme/Color';
import {Ionicons} from '@react-native-vector-icons/ionicons';
import {getData, removeData} from '../utils/Storage';
import NetInfo from '@react-native-community/netinfo';
import {IMAGE_URL} from '../connection/Config';
import {NOTIFY_MESSAGE} from '../constant/Module';
import FONTS from '../theme/Fonts';
import httpClient from '../connection/httpClient';
import {CommonActions} from '@react-navigation/native';
import {DrawerContext} from '../utils/DrawerContext';
import {MaterialIcons} from '@react-native-vector-icons/material-icons';

const windowHeight = Dimensions.get('window').height;
const windowWidth = Dimensions.get('window').width;

const Drawer = createDrawerNavigator();

const CustomDrawerContent = props => {
  const {navigation, userData, drawerData} = props;

  const [qrImageUri, setQrImageUri] = useState(null);
  const [qrImageModalVisible, setQrImageModalVisible] = useState(false);
  const [firstName, setFirstName] = useState('');

  const handleImagePress = () => {
    setQrImageModalVisible(true);
  };

  const scanQrData = drawerData.find(item => item.constantName === 'SCAN QR');
  const isEventAdmin = drawerData?.find(
    item => item?.constantName == 'EVENT ADMIN',
  );

  useEffect(() => {
    if (userData && userData?.role === 'member') {
      getQrCode();
    }
  }, [userData]);

  const getQrCode = () => {
    httpClient
      .get(`GetQRCode?Qrcodeid=${userData?.member?.configurationId || 0}`)
      .then(response => {
        if (response.data.status && response?.data?.result) {
          setQrImageUri(response?.data?.result);
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
  };

  const handleLogout = navigation => {
    Alert.alert(
      'Logout',
      'Do you want to logout?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Logout Cancelled'),
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: () => {
            removeData('user');
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{name: 'Login'}],
              }),
            );
          },
        },
      ],
      {cancelable: false},
    );
  };

  const handleDeleteAccount = navigation => {
    Alert.alert(
      'Delete Account',
      'Are You sure you want to Delete Account?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Logout Cancelled'),
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: () => {
            NetInfo.fetch().then(state => {
              if (state.isConnected) {
                httpClient
                  .delete(
                    `module/configuration/delete/${userData?.member?.configurationId}`,
                  )
                  .then(response => {
                    if (response.data.status) {
                      removeData('user');
                      navigation.dispatch(
                        CommonActions.reset({
                          index: 0,
                          routes: [{name: 'Login'}],
                        }),
                      );
                      NOTIFY_MESSAGE(response.data.message);
                    } else {
                      NOTIFY_MESSAGE(response.data.message);
                    }
                  })
                  .catch(err => {
                    NOTIFY_MESSAGE(err);
                  });
              } else {
                NOTIFY_MESSAGE('Please check your internet connectivity');
              }
            });
          },
        },
      ],
      {cancelable: false},
    );
  };

  useEffect(() => {
    if (userData && userData?.member) {
      const member = userData?.member?.content;
      const memberParse = JSON.parse(member);
      const firstName = memberParse?.firstName;
      setFirstName(firstName?.value);
    }
  }, [userData]);

  return (
    <View style={{flex: 1}}>
      <DrawerContentScrollView {...props} contentContainerStyle={{flexGrow: 1}}>
        <View
          style={{
            backgroundColor: COLORS.BACKGROUNDCOLOR,
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 10,
            marginBottom: 10,
          }}>
          <Image
            source={require('../assets/images/avatar.png')}
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              borderColor: COLORS.PRIMARYWHITE,
              borderWidth: 3,
              marginBottom: 14,
              backgroundColor: COLORS.PRIMARYWHITE,
            }}
          />
          <Text
            style={{
              color: COLORS.PLACEHOLDERCOLOR,
              fontSize: FONTS.FONTSIZE.MEDIUM,
              fontFamily: FONTS.FONT_FAMILY.MEDIUM,
            }}>
            Welcome,{' '}
            {userData?.user?.firstName ? userData?.user?.firstName : firstName}!
          </Text>

          {qrImageUri && (
            <TouchableOpacity onPress={handleImagePress}>
              <Image
                source={{uri: `${IMAGE_URL}${qrImageUri}`}}
                style={{
                  width: 110,
                  height: 110,
                  marginBottom: 2,
                  resizeMode: 'contain',
                  marginTop: 10,
                }}
              />
            </TouchableOpacity>
          )}
        </View>

        <DrawerItemList {...props} />
        <View style={{paddingBottom: 10}}>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 10,
              marginLeft: 10,
            }}
            onPress={() => {
              navigation.closeDrawer();
            }}>
            <Ionicons name="home-outline" color={COLORS.TITLECOLOR} size={24} />
            <Text
              style={{
                marginLeft: 30,
                fontSize: FONTS.FONTSIZE.MEDIUM,
                fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                color: COLORS.PLACEHOLDERCOLOR,
              }}>
              Dashboard
            </Text>
          </TouchableOpacity>

          {userData?.role == 'member' && (
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 10,
                marginLeft: 10,
              }}
              onPress={() => {
                navigation.navigate('MemberScreen');
              }}>
              <Ionicons
                name="people-outline"
                color={COLORS.TITLECOLOR}
                size={24}
              />
              <Text
                style={{
                  marginLeft: 30,
                  fontSize: FONTS.FONTSIZE.MEDIUM,
                  fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                  color: COLORS.PLACEHOLDERCOLOR,
                }}>
                Members
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 10,
              marginLeft: 10,
            }}
            onPress={() => {
              navigation.navigate('RSVPScreen');
            }}>
            <Ionicons
              name="calendar-outline"
              color={COLORS.TITLECOLOR}
              size={24}
            />
            <Text
              style={{
                marginLeft: 30,
                fontSize: FONTS.FONTSIZE.MEDIUM,
                fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                color: COLORS.PLACEHOLDERCOLOR,
              }}>
              RSVP
            </Text>
          </TouchableOpacity>

          {isEventAdmin && isEventAdmin.read && (
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 10,
                marginLeft: 10,
              }}
              onPress={() => {
                let data = {
                  item: isEventAdmin,
                  isTabView: isEventAdmin?.isForm,
                };
                navigation.navigate('FormRecords', {
                  data: data,
                });
              }}>
              <MaterialIcons
                name="admin-panel-settings"
                color={COLORS.TITLECOLOR}
                size={24}
              />
              <Text
                style={{
                  marginLeft: 30,
                  fontSize: FONTS.FONTSIZE.MEDIUM,
                  fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                  color: COLORS.PLACEHOLDERCOLOR,
                }}>
                EVENT ADMIN
              </Text>
            </TouchableOpacity>
          )}

          {userData?.role === 'member' && (
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 10,
                marginLeft: 10,
              }}
              onPress={() => {
                navigation.navigate('QrCodeScanScreen', {
                  isSelfCheckIn: true,
                });
              }}>
              <Ionicons
                name="qr-code-outline"
                color={COLORS.TITLECOLOR}
                size={24}
              />
              <Text
                style={{
                  marginLeft: 30,
                  fontSize: FONTS.FONTSIZE.MEDIUM,
                  fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                  color: COLORS.PLACEHOLDERCOLOR,
                }}>
                Self Check-In
              </Text>
            </TouchableOpacity>
          )}

          {(scanQrData?.constantName == 'SCAN QR' ||
            userData?.role !== 'member') && (
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 10,
                marginLeft: 10,
              }}
              onPress={() => {
                navigation.navigate('QrCodeScanScreen', {
                  isSelfCheckIn: false,
                });
              }}>
              <Ionicons
                name="qr-code-outline"
                color={COLORS.TITLECOLOR}
                size={24}
              />
              <Text
                style={{
                  marginLeft: 30,
                  fontSize: FONTS.FONTSIZE.MEDIUM,
                  fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                  color: COLORS.PLACEHOLDERCOLOR,
                }}>
                Scan Qr
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </DrawerContentScrollView>
      <View style={{paddingBottom: 10}}>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 10,
            marginLeft: 10,
          }}
          onPress={() => handleLogout(navigation)}>
          <Ionicons
            name="log-out-outline"
            color={COLORS.TITLECOLOR}
            size={24}
          />
          <Text
            style={{
              marginLeft: 30,
              fontSize: FONTS.FONTSIZE.MEDIUM,
              fontFamily: FONTS.FONT_FAMILY.MEDIUM,
              color: COLORS.PLACEHOLDERCOLOR,
            }}>
            Logout
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 10,
            marginLeft: 10,
          }}
          onPress={() => handleDeleteAccount(navigation)}>
          <Ionicons name="trash-outline" color={COLORS.TITLECOLOR} size={24} />
          <Text
            style={{
              marginLeft: 28,
              fontSize: FONTS.FONTSIZE.MEDIUM,
              fontFamily: FONTS.FONT_FAMILY.MEDIUM,
              color: COLORS.PLACEHOLDERCOLOR,
            }}>
            Delete Account
          </Text>
        </TouchableOpacity>
      </View>
      <Modal
        animationType="fade"
        visible={qrImageModalVisible}
        transparent={true}
        onRequestClose={() => setQrImageModalVisible(false)}>
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setQrImageModalVisible(false)}>
            <Ionicons name="close-circle-outline" color={'#fff'} size={36} />
          </TouchableOpacity>
          <Image
            source={{uri: `${IMAGE_URL}${qrImageUri}`}}
            style={styles.fullscreenImage}
          />
        </View>
      </Modal>
    </View>
  );
};

const DrawerNavigator = () => {
  const [userData, setUserData] = useState(null);
  const {drawerData} = useContext(DrawerContext);

  useEffect(() => {
    const fetchUserRole = async () => {
      const user = await getData('user');
      setUserData(user);
    };
    fetchUserRole();
  }, []);

  return (
    <Drawer.Navigator
      drawerContent={props => (
        <CustomDrawerContent
          {...props}
          userData={userData}
          drawerData={drawerData}
        />
      )}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: COLORS.BACKGROUNDCOLOR,
          width: 270,
        },
        drawerActiveTintColor: COLORS.TITLECOLOR,
        drawerInactiveTintColor: COLORS.PLACEHOLDERCOLOR,
        drawerActiveBackgroundColor: 'transparent',
        drawerInactiveBackgroundColor: 'transparent',
        drawerLabelStyle: {
          fontSize: FONTS.FONTSIZE.MEDIUM,
          fontFamily: FONTS.FONT_FAMILY.MEDIUM,
        },
      }}>
      <Drawer.Screen
        name="Dashboard"
        component={Dashboard}
        options={{
          drawerIcon: ({color, size}) => (
            <Ionicons
              name="home-outline"
              color={COLORS.TITLECOLOR}
              size={size}
            />
          ),
          drawerItemStyle: {
            display: 'none',
          },
        }}
      />

      {userData?.role == 'member' && (
        <Drawer.Screen
          name="Members"
          component={MemberScreen}
          options={{
            drawerIcon: ({color, size}) => (
              <Ionicons
                name="people-outline"
                color={COLORS.TITLECOLOR}
                size={size}
              />
            ),
            drawerItemStyle: {
              display: 'none',
            },
          }}
        />
      )}
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: Platform.OS == 'ios' ? 60 : 40,
    right: 20,
    zIndex: 1,
  },
  fullscreenImage: {
    width: windowWidth * 0.9,
    height: windowHeight * 0.7,
    resizeMode: 'contain',
  },
});

export default DrawerNavigator;
