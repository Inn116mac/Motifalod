import {View} from 'react-native';
import React, {useEffect, useState} from 'react';
import COLORS from '../theme/Color';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import {useNavigation} from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import {NOTIFY_MESSAGE} from '../constant/Module';
import Loader from '../components/root/Loader';
import CustomTab from '../components/root/CustomTab';
import Offline from '../components/root/Offline';
import AdminEdit from '../components/root/AdminEdit';
import NoDataFound from '../components/root/NoDataFound';
import {useNetworkStatus} from '../connection/UseNetworkStatus';
import CustomHeader from '../components/root/CustomHeader';
import httpClient from '../connection/httpClient';

const FormScreen = ({route}) => {
  const {
    item,
    editItem,
    isEdit,
    isTabView,
    isRsvp,
    isImageGallery,
    isVideoGallery,
    configurationId,
    eventId,
    isFromEventAdmin,
  } = route.params.data;

  const navigation = useNavigation();

  const [moduleData, setModuleData] = useState([]);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(true);

  const {isConnected, networkLoading} = useNetworkStatus();

  const onChange = (eventId, memberId) => {
    if (eventId || memberId) {
      apiCall1(eventId, memberId);
    }
  };

  useEffect(() => {
    apiCall();
  }, [item?.constantName, isRsvp, isImageGallery, isVideoGallery, eventId]);

  const apiCall = () => {
    if (item?.constantName) {
      if (isTabView) {
        NetInfo.fetch().then(state => {
          if (state.isConnected) {
            setLoading(true);
            httpClient
              .get(
                `module/get?name=${item?.constantName}&isMobile=true&isTabView=false`,
              )
              .then(response => {
                const temp = JSON.parse(response?.data?.result?.configuration);
                const temp1 = response?.data?.result;
                if (response.data.status) {
                  if (temp.length && temp1 && temp1 !== '') {
                    setResponse(temp1);
                    setModuleData(temp);
                  } else {
                    setResponse(null);
                    setModuleData([]);
                  }
                } else {
                  NOTIFY_MESSAGE(response?.data?.message);
                }
              })
              .catch(err => {
                setLoading(false);
                NOTIFY_MESSAGE(
                  err || err?.message ? 'Something Went Wrong' : null,
                );
                navigation.goBack();
              })
              .finally(() => {
                setLoading(false);
              });
          } else {
            NOTIFY_MESSAGE('Please check your internet connectivity');
          }
        });
      }
    } else if (isRsvp) {
      NetInfo.fetch().then(state => {
        if (state.isConnected) {
          setLoading(true);
          httpClient
            .get(
              `module/get?name=RSVP&isMobile=true&isTabView=false&eventId=${
                eventId || 0
              }&memberId=0`,
            )
            .then(response => {
              setLoading(false);
              const temp = JSON.parse(response?.data?.result?.configuration);
              const temp1 = response?.data?.result;
              if (
                response.data.status &&
                response.data.result &&
                temp.length &&
                temp1
              ) {
                setResponse(temp1);
                setModuleData(temp);
              } else {
                setLoading(false);
                NOTIFY_MESSAGE(
                  response?.data?.message
                    ? response?.data?.message
                    : 'Something Went Wrong',
                );
              }
            })
            .catch(err => {
              setLoading(false);
              NOTIFY_MESSAGE(
                err || err?.message ? 'Something Went Wrong' : null,
              );

              navigation.goBack();
            })
            .finally(() => {
              setLoading(false);
            });
        } else {
          NOTIFY_MESSAGE('Please check your internet connectivity');
        }
      });
    } else if (isImageGallery || isVideoGallery) {
      NetInfo.fetch().then(state => {
        if (state.isConnected) {
          setLoading(true);
          httpClient
            .get(
              `module/get?name=${
                isImageGallery ? 'IMAGE%20GALLERY' : 'VIDEO%20GALLERY'
              }&isMobile=true&isTabView=false`,
            )
            .then(response => {
              setLoading(false);
              const temp = JSON.parse(response?.data?.result?.configuration);
              const temp1 = response?.data?.result;

              if (
                response.data.status &&
                response.data.result &&
                temp.length &&
                temp1
              ) {
                setResponse(temp1);
                setModuleData(temp);
              } else {
                setLoading(false);
                NOTIFY_MESSAGE(
                  response?.data.message
                    ? response?.data.message
                    : 'Something Went Wrong',
                );
              }
            })
            .catch(err => {
              setLoading(false);
              NOTIFY_MESSAGE(
                err || err?.message ? 'Something Went Wrong' : null,
              );
              navigation.goBack();
            });
        } else {
          NOTIFY_MESSAGE('Please check your internet connectivity');
        }
      });
    }
  };

  const apiCall1 = (eventId, memberId) => {
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setLoading(true);
        httpClient
          .get(
            `module/get?name=RSVP&isMobile=true&isTabView=false&eventId=${
              eventId ? eventId : 0
            }&memberId=${memberId ? memberId : 0}`,
          )
          .then(response => {
            const temp = JSON.parse(response?.data?.result?.configuration);
            const temp1 = response?.data?.result;
            if (response.data.status) {
              if (temp.length && temp1 && temp1 !== '') {
                setResponse(temp1);
                setModuleData(temp);
              } else {
                setResponse(null);
                setModuleData([]);
              }
            } else {
              NOTIFY_MESSAGE(response?.data?.message);
            }
          })
          .catch(err => {
            setLoading(false);
            NOTIFY_MESSAGE(err || err?.message ? 'Something Went Wrong' : null);
            navigation.goBack();
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
        NOTIFY_MESSAGE('Please check your internet connectivity');
      }
    });
  };

  return (
    <View style={{flex: 1, backgroundColor: COLORS.BACKGROUNDCOLOR}}>
      <CustomHeader
        leftOnPress={() => {
          navigation.goBack();
        }}
        leftIcon={
          <FontAwesome6 name="angle-left" size={26} color={COLORS.LABELCOLOR} />
        }
        title={isRsvp ? 'New Rsvp' : item?.name}
      />
      {networkLoading || loading ? (
        <Loader />
      ) : isConnected ? (
        <View
          style={{
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            overflow: 'hidden',
            flex: 1,
          }}>
          {isEdit ? (
            <View
              style={{
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                overflow: 'hidden',
                flex: 1,
              }}>
              {editItem ? (
                <AdminEdit
                  editItem={editItem}
                  isEdit={isEdit}
                  isImageGallery={item?.constantName == 'IMAGE GALLERY'}
                  isVideoGallery={item?.constantName == 'VIDEO GALLERY'}
                />
              ) : (
                <NoDataFound />
              )}
            </View>
          ) : moduleData.length > 0 && response ? (
            isTabView || isRsvp || isImageGallery || isVideoGallery ? (
              <CustomTab
                onChangeEvent={onChange}
                isEdit={isEdit}
                data={moduleData}
                response1={response}
                isRsvp={isRsvp ? isRsvp : false}
                item1={item}
                isImageGallery={
                  isImageGallery || item?.constantName == 'IMAGE GALLERY'
                    ? true
                    : false
                }
                isVideoGallery={
                  isVideoGallery || item?.constantName == 'VIDEO GALLERY'
                    ? true
                    : false
                }
                isSignupFromDashboard={response?.constantName === 'SIGN UP'}
                isFromEventAdmin={isFromEventAdmin}
              />
            ) : null
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

export default FormScreen;
