import {
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
  Alert,
  FlatList,
  useWindowDimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import React, {useCallback, useEffect, useState} from 'react';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import Loader from '../components/root/Loader';
import COLORS from '../theme/Color';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import NetInfo from '@react-native-community/netinfo';
import CustomHeader from '../components/root/CustomHeader';
import FONTS from '../theme/Fonts';
import httpClient from '../connection/httpClient';
import NoDataFound from '../components/root/NoDataFound';
import {Feather} from '@react-native-vector-icons/feather';
import {AntDesign} from '@react-native-vector-icons/ant-design';
import {useNetworkStatus} from '../connection/UseNetworkStatus';
import {capitalizeFirstLetter, NOTIFY_MESSAGE} from '../constant/Module';
import Offline from '../components/root/Offline';

const MembershipPrice = ({route}) => {
  const {item} = route?.params?.data;
  const {width} = useWindowDimensions();

  const styles = StyleSheet.create({
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 10,
      marginHorizontal: 10,
    },
    searchInput: {
      fontSize: FONTS.FONTSIZE.SEMIMINI,
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      color: COLORS.PRIMARYBLACK,
      paddingVertical: 0,
    },
    plusButton: {
      height: 40,
      width: 40,
      borderRadius: 20,
      backgroundColor: COLORS.LABELCOLOR,
      justifyContent: 'center',
      alignItems: 'center',
    },
    listContainer: {
      marginHorizontal: 10,
      borderRadius: 10,
      flexGrow: 1,
      paddingBottom: 10,
    },
    pkgLbl: {
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      fontSize: FONTS.FONTSIZE.SMALL,
      color: COLORS.PRIMARYBLACK,
    },
    titleText: {
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      fontSize: FONTS.FONTSIZE.MINI,
      color: COLORS.PRIMARYBLACK,
      width: '48%',
      marginRight: 4,
    },
  });

  const [allUserData, setAllUserData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const navigation = useNavigation();

  const [openIndex, setOpenIndex] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isReresh, setIsRefresh] = useState(false);

  useEffect(() => {
    getViewData();
  }, []);

  const handleRefresh = async () => {
    setIsRefresh(true);
    setSearchKeyword('');
    await getViewData();
    setIsRefresh(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      setAllUserData([]);
      setSearchKeyword('');
      getViewData();
      setOpenIndex(null);
      return () => {};
    }, [getViewData]),
  );

  useEffect(() => {
    filterLocalData();
  }, [searchKeyword, allUserData]);

  const filterLocalData = () => {
    if (!searchKeyword || searchKeyword.trim() === '') {
      setFilteredData(allUserData);
    } else {
      const keyword = searchKeyword.toLowerCase().trim();
      const filtered = allUserData.filter(item => {
        const name = item?.name?.toLowerCase() || '';
        return name.includes(keyword);
      });
      setFilteredData(filtered);
    }
  };

  const getViewData = useCallback(() => {
    setIsLoading(true);
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        httpClient
          .get(`member/membershipprice`)
          .then(response => {
            if (response.data.status) {
              const newData = response.data.result;
              if (newData?.length > 0) {
                setAllUserData(newData);
                setFilteredData(newData);
              } else {
                setAllUserData([]);
                setFilteredData([]);
              }
            } else {
              NOTIFY_MESSAGE(response.data.message);
            }
          })
          .catch(error => {
            setIsLoading(false);
            NOTIFY_MESSAGE(
              error || error.message ? 'Something Went Wrong' : null,
            );
            navigation.goBack();
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        NOTIFY_MESSAGE('Please check your internet connectivity');
      }
    });
  }, [item, navigation]);

  const [isLoading1, setIsLoading1] = useState(false);
  const {isConnected, networkLoading} = useNetworkStatus();

  const handleDelete = item1 => {
    if (!item1?.id) {
      NOTIFY_MESSAGE('Invalid item');
      return;
    }
    // Show confirmation dialog
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this Record?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Delete canceled'),
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: () => {
            setIsLoading1(true);
            httpClient
              .put(`member/membership/delete/${item1.id}`)
              .then(response => {
                if (response.data.status === true) {
                  NOTIFY_MESSAGE(response.data.message);
                  setAllUserData(prevList => {
                    const indexToDelete = prevList.findIndex(
                      item => item.id === item1.id,
                    );

                    if (indexToDelete !== -1) {
                      const newList = [...prevList]; // Create a copy
                      newList.splice(indexToDelete, 1); // Remove the item
                      return newList;
                    } else {
                      return prevList; // Item not found, return the original list
                    }
                  });
                } else {
                  NOTIFY_MESSAGE(response?.data?.message);
                }
              })
              .catch(error => {
                const errorMessage =
                  error?.response?.data?.message ||
                  error?.message ||
                  'Something Went Wrong';
                NOTIFY_MESSAGE(errorMessage);
              })
              .finally(() => {
                setIsLoading1(false); // Ensure loading state is reset
              });
          },
        },
      ],
      {cancelable: false}, // Prevent dismissing the alert by tapping outside
    );
  };

  const handleUpdate = item1 => {
    Alert.alert(
      'Confirm Edit',
      'Are you sure you want to Edit this Record?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Edit canceled'),
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: () => {
            let data = {
              item: item,
              isEdit: true,
              editItem: item1,
              configurationId: item1?.configurationId,
            };
            setSearchKeyword('');
            navigation.navigate('AddMembership', {data});
          },
        },
      ],
      {cancelable: false},
    );
  };

  const handleToggle = idx => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  const renderItem = ({item: item1, index}) => {
    const number = index + 1;
    const formattedNumber = number <= 9 ? `0${number}` : `${number}`;
    return (
      <View
        style={{
          backgroundColor: COLORS.PRIMARYWHITE,
          flex: 1,
          overflow: 'hidden',
          borderRadius: 10,
          marginVertical: 8,
        }}
        key={index}>
        <View
          style={{
            padding: 8,
          }}>
          <TouchableOpacity
            onPress={() => handleToggle(index)}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                flex: 1,
              }}>
              <View
                style={{
                  backgroundColor: COLORS.LABELCOLOR,
                  maxWidth: '30%',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: 10,
                  padding: 6,
                }}>
                <Text style={[styles.pkgLbl, {color: COLORS.PRIMARYWHITE}]}>
                  {formattedNumber}
                </Text>
              </View>

              <View style={{flex: 1}}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
                    fontSize: FONTS.FONTSIZE.SEMIMINI,
                    color: COLORS.PLACEHOLDERCOLOR,
                  }}>
                  {item1?.name ? item1?.name : '-'}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
                    fontSize: FONTS.FONTSIZE.SEMIMINI,
                    color: COLORS.PLACEHOLDERCOLOR,
                  }}>
                  {item1?.currency}
                  {item1?.price}
                </Text>
              </View>
            </View>

            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  gap: 14,
                  paddingHorizontal: 2,
                }}>
                <TouchableOpacity onPress={() => handleUpdate(item1)}>
                  <Feather name="edit" size={18} color={'#007bff'} />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleDelete(item1)}>
                  <AntDesign name="delete" size={18} color={'red'} />
                </TouchableOpacity>
              </View>
              <AntDesign
                name={openIndex === index ? 'up' : 'down'}
                size={16}
                color={COLORS.LABELCOLOR}
              />
            </View>
          </TouchableOpacity>
        </View>
        {openIndex === index && (
          <View
            key={index.toString()}
            style={{
              paddingHorizontal: 8,
              paddingBottom: 8,
            }}>
            <View
              style={{
                padding: 10,
                borderRadius: 8,
                gap: 8,
              }}>
              {Object.entries(item1)
                .filter(([key]) => key !== 'id')
                .map(([key, value]) => (
                  <View
                    key={key}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                    <Text style={styles.titleText}>
                      {capitalizeFirstLetter(key)}:
                    </Text>
                    <Text
                      style={{
                        fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
                        fontSize: FONTS.FONTSIZE.MINI,
                        color: COLORS.PRIMARYBLACK,
                        width: '50%',
                        textAlign: 'left',
                      }}>
                      {value !== null && value !== undefined && value !== ''
                        ? value
                        : '-'}
                    </Text>
                  </View>
                ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{flex: 1, backgroundColor: COLORS.BACKGROUNDCOLOR}}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
      <CustomHeader
        leftOnPress={() => {
          navigation.goBack();
        }}
        leftIcon={
          <FontAwesome6
            name="angle-left"
            size={26}
            color={COLORS.LABELCOLOR}
            iconStyle="solid"
          />
        }
        title={item?.name || 'Membership Management'}
      />

      <View style={styles.headerContainer}>
        <View style={{flex: 1}}>
          <View
            style={{
              flex: 1,
              borderRadius: 20,
              backgroundColor: COLORS.PRIMARYWHITE,
              paddingHorizontal: 10,
              marginRight: 10,
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#ebedf0',
            }}>
            <TextInput
              placeholder="Search..."
              value={searchKeyword}
              onChangeText={setSearchKeyword}
              style={[styles.searchInput, {flex: 1}]}
              returnKeyType="search"
              placeholderTextColor={COLORS.grey500}
            />
            {searchKeyword.length > 0 && (
              <TouchableOpacity onPress={() => setSearchKeyword('')} style={{}}>
                <AntDesign
                  name="close-circle"
                  size={20}
                  color={COLORS.grey500}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <TouchableOpacity
          onPress={() => {
            let data = {
              item: item,
              isTabView: true,
              isFromEventAdmin: true,
            };

            navigation.navigate('AddMembership', {data});
          }}
          style={styles.plusButton}
          activeOpacity={0.7}>
          <AntDesign name="plus" size={22} color={COLORS.PRIMARYWHITE} />
        </TouchableOpacity>
      </View>
      {isLoading || isLoading1 ? (
        <Loader />
      ) : isConnected ? (
        <View style={{flex: 1}}>
          {filteredData?.length > 0 ? (
            <FlatList
              data={filteredData}
              initialNumToRender={10}
              maxToRenderPerBatch={20}
              windowSize={10}
              removeClippedSubviews={true}
              keyExtractor={(item, index) => index?.toString()}
              renderItem={renderItem}
              contentContainerStyle={styles.listContainer}
              refreshControl={
                <RefreshControl
                  onRefresh={handleRefresh}
                  refreshing={isReresh}
                />
              }
            />
          ) : (
            <NoDataFound />
          )}
        </View>
      ) : (
        <Offline />
      )}
    </KeyboardAvoidingView>
  );
};

export default MembershipPrice;
