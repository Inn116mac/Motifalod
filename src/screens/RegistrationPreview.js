import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {getData} from '../utils/Storage';
import {IMAGE_URL} from '../connection/Config';
import {NOTIFY_MESSAGE} from '../constant/Module';
import COLORS from '../theme/Color';
import Loader from '../components/root/Loader';
import {useNavigation} from '@react-navigation/native';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import FONTS from '../theme/Fonts';
import Offline from '../components/root/Offline';
import CustomHeader from '../components/root/CustomHeader';
import httpClient from '../connection/httpClient';
import {useNetworkStatus} from '../connection/UseNetworkStatus';
import FastImage from 'react-native-fast-image';

const RegistrationPreview = ({route}) => {
  const {formData, item} = route?.params;

  const [loading, setLoading] = useState(true);
  const [qrImgUrl, setQrImgUrl] = useState('');
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
      getQrCode();
    }
  }, [userData]);

  const userId =
    formData
      ?.find(key => key?.headerKey === 'memberDetails')
      ?.headerConfig?.find(item => Object.keys(item)[0] === 'member')?.member
      ?.value ?? 0;

  const getQrCode = () => {
    httpClient
      .get(
        `GetQRCode?Qrcodeid=${
          userData?.member?.configurationId
            ? userData?.member?.configurationId
            : userId
        }`,
      )
      .then(response => {
        if (response.data.status && response?.data?.result) {
          setQrImgUrl(response?.data?.result);
        } else {
          NOTIFY_MESSAGE(response?.data?.message);
        }
      })
      .catch(err => {
        NOTIFY_MESSAGE(err || err?.message ? 'Something Went Wrong' : null);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const {isConnected, networkLoading} = useNetworkStatus();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.BACKGROUNDCOLOR,
      }}>
      <CustomHeader
        leftOnPress={() => {
          navigation.goBack();
        }}
        leftIcon={
          <FontAwesome6 name="angle-left" size={26} color={COLORS.LABELCOLOR} />
        }
        title={'Registration Preview'}
      />
      {networkLoading || loading ? (
        <Loader />
      ) : isConnected ? (
        <ScrollView style={styles.container}>
          <View
            style={[
              styles.tabContianer,
              {justifyContent: 'center', alignItems: 'center'},
            ]}>
            <View justifyContent={'center'} alignItems={'center'}>
              <Image
                style={{height: 100, width: 100}}
                source={{uri: IMAGE_URL + qrImgUrl}}
                resizeMode="contain"
              />
            </View>
          </View>
          {formData.map((data, index) => {
            let finalData =
              data.isMultiple && data.headerConfig.length > 0
                ? data.headerConfig
                : data?.headerConfig;

            return (
              <View key={index} style={[styles.tabContianer, {marginTop: 0}]}>
                <Text style={[styles.boldLbl, {marginBottom: 2}]}>
                  {data?.headerLabel}
                </Text>
                <View style={styles.lstCont}>
                  {data?.isMultiple && finalData
                    ? finalData?.map((data, index) => {
                        return (
                          <View key={index} style={styles.listItem}>
                            {Object.keys(data).map((key, keyIndex) => {
                              const item = data[key];

                              if (
                                item !== undefined &&
                                key !== 'configurationid' &&
                                key !== 'value'
                              ) {
                                if (
                                  key?.toLowerCase() === 'configurationid' ||
                                  (data?.relationship &&
                                    data?.relationship?.value?.toLowerCase() ===
                                      'self' &&
                                    key?.toLowerCase() === 'age')
                                ) {
                                  return null;
                                }

                                if (
                                  !item?.label ||
                                  item?.value === null ||
                                  item?.value === undefined
                                ) {
                                  return null;
                                }
                                return (
                                  <View key={keyIndex} style={styles.lstrow}>
                                    <Text style={styles.txtlstLbl}>
                                      {item?.label
                                        ? item?.label + ' : '
                                        : key + ' : '}
                                    </Text>
                                    <Text style={styles.txtlstvalue}>
                                      {item?.value ? item?.value : '-'}
                                    </Text>
                                  </View>
                                );
                              }
                              return null;
                            })}
                          </View>
                        );
                      })
                    : data?.headerConfig
                    ? data?.headerConfig?.map((headerItem, index) => {
                        const key = Object.keys(headerItem)[0];
                        const item = headerItem[key];
                        let mediaUris = [];

                        try {
                          const parsedValue = JSON.parse(item.value);
                          mediaUris = Array.isArray(parsedValue)
                            ? parsedValue
                            : [parsedValue];
                        } catch (error) {
                          mediaUris = item.value ? [item.value] : [];
                        }

                        return item.value && item.type === 'file' ? (
                          <View key={index} style={styles.lstImgrow}>
                            <Text style={styles.txtlstLbl}>
                              {item?.label} :
                            </Text>
                            <ScrollView
                              contentContainerStyle={{gap: 10}}
                              horizontal
                              showsHorizontalScrollIndicator={false}>
                              {mediaUris.map((uri, uriIndex) => (
                                <TouchableOpacity
                                  key={uriIndex}
                                  onPress={() => {
                                    navigation.navigate('FullImageScreen', {
                                      image: uri,
                                    });
                                  }}>
                                  <FastImage
                                    style={{
                                      height: 100,
                                      width: 100,
                                      borderRadius: 10,
                                      marginRight: 5,
                                    }}
                                    source={{
                                      uri: IMAGE_URL + uri,
                                      cache: FastImage.cacheControl.immutable,
                                      priority: FastImage.priority.normal,
                                    }}
                                  />
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>
                        ) : (
                          <View key={index} style={styles.lstrow}>
                            <Text style={styles.txtlstLbl}>
                              {item?.label + ' : '}
                            </Text>
                            <Text style={styles.txtlstvalue}>
                              {item?.value ? item?.value : '-'}
                            </Text>
                          </View>
                        );
                      })
                    : null}
                </View>
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <Offline />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listItem: {
    padding: 5,
    marginBottom: 15,
    borderRadius: 10,
  },
  tabContianer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: COLORS.PRIMARYWHITE,
    borderRadius: 15,
    margin: 15,
  },
  txtlstLbl: {
    width: '50%',
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.EXTRASMALL,
    color: COLORS.PLACEHOLDERCOLOR,
  },
  txtlstvalue: {
    width: '50%',
    marginLeft: 10,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.SMALL,
    color: COLORS.PRIMARYBLACK,
  },
  lstrow: {
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  lstImgrow: {
    paddingVertical: 2,
    flex: 1,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  lstCont: {
    marginTop: 8,
    marginBottom: 8,
  },
  boldLbl: {
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    fontSize: FONTS.FONTSIZE.MEDIUM,
    color: COLORS.TITLECOLOR,
  },
});

export default RegistrationPreview;
