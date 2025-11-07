import {View, Text, Image, TouchableOpacity} from 'react-native';
import React, {useEffect, useState} from 'react';
import COLORS from '../theme/Color';
import FONTS from '../theme/Fonts';
import NetInfo from '@react-native-community/netinfo';
import {IMAGE_URL} from '../connection/Config';
import {NOTIFY_MESSAGE} from '../constant/Module';
import Loader from '../components/root/Loader';
import {useNavigation} from '@react-navigation/native';
import Offline from '../components/root/Offline';
import NoDataFound from '../components/root/NoDataFound';
import {useNetworkStatus} from '../connection/UseNetworkStatus';
import CustomHeader from '../components/root/CustomHeader';
import httpClient from '../connection/httpClient';
import DraggableFlatList from 'react-native-draggable-flatlist';
import {FontAwesome6} from "@react-native-vector-icons/fontawesome6";

const ReorderList = ({}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const navigation = useNavigation();
  const {isConnected, networkLoading} = useNetworkStatus();

  useEffect(() => {
    dashboardApiCall();
  }, []);

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
            const newArray = filteredData.filter(
              item =>
                item?.constantName !== 'SCAN QR' &&
                item?.constantName !== 'SELF CHECK-IN' &&
                item?.constantName !== 'EVENT ADMIN',
            );
            if (newArray?.length > 0) {
              const processedData = newArray.map(item => ({
                ...item,
                key: item?.moduleId?.toString(),
              }));
              setData(processedData);
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

  const renderItem = ({item, drag, isActive}) => {
    return (
      <TouchableOpacity
        onLongPress={drag}
        disabled={isActive}
        style={{
          margin: 4,
          borderWidth: 1,
          borderColor: COLORS.LABELCOLOR,
          borderRadius: 10,
          padding: 8,
          paddingLeft: 8,
          backgroundColor: isActive ? '#eee' : 'white',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
        onPress={() => {}}>
        <Image
          source={{
            uri: `${IMAGE_URL}${item?.icon}`,
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
            fontSize: FONTS.FONTSIZE.EXTRASMALL,
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

  const handleOrder = async payload => {
    const state = await NetInfo.fetch();
    if (state.isConnected) {
      try {
        const response = await httpClient.post('module/order', payload);
        if (response.data.status) {
          NOTIFY_MESSAGE(response?.data?.message);
        } else {
          NOTIFY_MESSAGE(
            response?.data?.message
              ? response?.data?.message
              : 'Something Went Wrong',
          );
        }
      } catch (err) {
        NOTIFY_MESSAGE(err?.message ? err.message : 'Something Went Wrong');
      }
    } else {
      NOTIFY_MESSAGE('Please check your internet connectivity');
    }
  };

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
          <FontAwesome6 name="angle-left" iconStyle='solid' size={26} color={COLORS.LABELCOLOR} />
        }
        title={'Update Order'}
      />

      {networkLoading || loading ? (
        <Loader />
      ) : isConnected ? (
        data.length > 0 ? (
          <View
            style={{
              flex: 1,
            }}>
            <DraggableFlatList
              contentContainerStyle={{
                marginHorizontal: 10,
                paddingBottom: 10,
              }}
              activationDistance={10}
              data={data}
              renderItem={renderItem}
              keyExtractor={item => item?.key}
              onDragEnd={async ({data: newData}) => {
                const oldOrder = data.map(item => item.key);
                const newOrder = newData.map(item => item.key);

                const isOrderChanged =
                  oldOrder.length !== newOrder.length ||
                  oldOrder.some((key, index) => key !== newOrder[index]);

                if (isOrderChanged) {
                  setData(newData);
                  const payload = newData.map((item, index) => ({
                    moduleId: item.moduleId,
                    index,
                  }));

                  await handleOrder(payload);
                }
              }}
              numColumns={1}
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

export default ReorderList;
