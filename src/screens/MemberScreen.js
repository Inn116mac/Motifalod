import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  useWindowDimensions,
  TouchableOpacity,
  BackHandler,
} from 'react-native';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import FONTS from '../theme/Fonts';
import {getData} from '../utils/Storage';
import COLORS from '../theme/Color';
import Loader from '../components/root/Loader';
import {
  formatPhoneToUS,
  isPhoneField,
  NOTIFY_MESSAGE,
} from '../constant/Module';
import {useNavigation} from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import Offline from '../components/root/Offline';
import CustomHeader from '../components/root/CustomHeader';
import {useNetworkStatus} from '../connection/UseNetworkStatus';
import NoDataFound from '../components/root/NoDataFound';
import {AntDesign} from '@react-native-vector-icons/ant-design';
import httpClient from '../connection/httpClient';

const MemberScreen = () => {
  const [loading, setLoading] = useState(true);
  const {width} = useWindowDimensions();

  const [members, setmembers] = useState([]);

  const [userData, setUserData] = useState(null);

  const navigation = useNavigation();

  const getUser = async () => {
    const user = await getData('user');
    setUserData(user);
  };

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (userData) {
      apiCall();
    }
  }, [userData]);

  const apiCall = () => {
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setLoading(true);
        httpClient
          .get(
            `mobile/module/configurations/get?modulename=FAMILY%20MEMBER&moduleConfurationId=${
              userData?.member?.configurationId
                ? userData?.member?.configurationId
                : 0
            }&isMobile=true`,
          )
          .then(response => {
            if (response.data.status) {
              const temp =
                response?.data?.result?.configuration?.length > 0
                  ? JSON.parse(response?.data?.result?.configuration)
                  : [];
              const personalInfoHeader = temp?.find(
                header => header.headerKey == 'personalInfo',
              );
              if (personalInfoHeader?.userValues) {
                setmembers(personalInfoHeader?.userValues);
              } else {
                setmembers([]);
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
          })
          .finally(() => setLoading(false));
      } else {
        NOTIFY_MESSAGE('Please check your internet connectivity');
      }
    });
  };

  const sortedMembers = members.sort((a, b) => {
    const aIsSelf = a?.relationship?.value?.toLowerCase() === 'self';
    const bIsSelf = b?.relationship?.value?.toLowerCase() === 'self';

    if (aIsSelf && !bIsSelf) return -1;
    if (!aIsSelf && bIsSelf) return 1;
    return 0;
  });

  const [openIndex, setOpenIndex] = useState(null);

  const renderMemberList = ({item, index}) => {
    const number = index + 1 < 10 ? `0${index + 1}` : `${index + 1}`;
    const handleToggle = index => {
      setOpenIndex(openIndex === index ? null : index);
    };
    return (
      <View
        style={{
          backgroundColor: COLORS.PRIMARYWHITE,
          flex: 1,
          overflow: 'hidden',
          borderRadius: 10,
          padding: 6,
          margin: 6,
        }}
        key={index}>
        <TouchableOpacity
          onPress={() => {
            handleToggle(index);
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              width: width / 1.6,
            }}>
            <View
              style={{
                backgroundColor: COLORS.LABELCOLOR,
                width: widthPercentageToDP('10%'),
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 10,
              }}>
              <Text style={[styles.pkgLbl, {color: COLORS.PRIMARYWHITE}]}>
                {number}
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                width: width / 1.3,
              }}>
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                  fontSize: FONTS.FONTSIZE.EXTRASMALL,
                  color: COLORS.PLACEHOLDERCOLOR,
                }}>
                {item?.firstName?.value == 'null'
                  ? '-'
                  : item?.firstName?.value}
              </Text>
            </View>
          </View>
          <View>
            {openIndex === index ? (
              <AntDesign name="up" size={20} color={COLORS.LABELCOLOR} />
            ) : (
              <AntDesign name="down" size={20} color={COLORS.LABELCOLOR} />
            )}
          </View>
        </TouchableOpacity>
        {openIndex === index && (
          <View
            style={{
              padding: 6,
            }}>
            {Object.entries(item).map(([fieldKey, fieldData]) => {
              if (fieldKey?.toLowerCase() === 'configurationid') {
                return null;
              }

              if (fieldData?.type == 'hidden') {
                return null;
              }

              const isPhone = isPhoneField(fieldData?.name);

              return (
                <View style={{flexDirection: 'row'}} key={fieldKey}>
                  <Text style={styles.titleText}>{fieldData.label} :</Text>
                  <Text style={styles.text}>
                    {isPhone && fieldData?.value
                      ? formatPhoneToUS(fieldData?.value)
                      : fieldData?.value
                      ? fieldData?.value
                      : '-'}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  const {isConnected, networkLoading} = useNetworkStatus();

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        navigation.navigate('Dashboard');
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
        leftOnPress={() => {
          navigation.navigate('Dashboard');
        }}
        leftIcon={
          <FontAwesome6
            name="angle-left"
            size={26}
            color={COLORS.LABELCOLOR}
            iconStyle="solid"
          />
        }
        title={'Members'}
      />

      <View style={{flex: 1, marginTop: heightPercentageToDP(1)}}>
        {networkLoading || loading ? (
          <Loader />
        ) : isConnected ? (
          <FlatList
            contentContainerStyle={{paddingBottom: 10, flexGrow: 1}}
            showsVerticalScrollIndicator={false}
            data={sortedMembers}
            removeClippedSubviews={true}
            maxToRenderPerBatch={30}
            updateCellsBatchingPeriod={200}
            windowSize={40}
            initialNumToRender={10}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderMemberList}
            ListEmptyComponent={() => {
              return <NoDataFound />;
            }}
          />
        ) : (
          <Offline />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  pkgLbl: {
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.SMALL,
    color: COLORS.PRIMARYBLACK,
    textAlign: 'left',
  },
  titleText: {
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.EXTRASMALL,
    color: COLORS.PRIMARYBLACK,
    width: '44%',
  },
  text: {
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.EXTRASMALL,
    color: COLORS.PRIMARYBLACK,
    width: '56%',
    textAlign: 'left',
  },
});

export default MemberScreen;
