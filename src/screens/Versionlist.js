import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useCallback, useEffect, useState} from 'react';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import Loader from '../components/root/Loader';
import COLORS from '../theme/Color';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import CustomHeader from '../components/root/CustomHeader';
import FONTS from '../theme/Fonts';
import httpClient from '../connection/httpClient';
import NoDataFound from '../components/root/NoDataFound';
import {Feather} from '@react-native-vector-icons/feather';
import {AntDesign} from '@react-native-vector-icons/ant-design';
import {useNetworkStatus} from '../connection/UseNetworkStatus';
import {NOTIFY_MESSAGE} from '../constant/Module';
import Offline from '../components/root/Offline';
import NetInfo from '@react-native-community/netinfo';

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const PLATFORM_ICON = {
  android: {icon: 'android', color: '#3DDC84'},
  ios: {icon: 'apple', color: '#555'},
};

const VersionList = ({route}) => {
  const navigation = useNavigation();
  const {isConnected, networkLoading} = useNetworkStatus();

  const [allData, setAllData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoading1, setIsLoading1] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const debouncedSearch = useDebounce(searchKeyword, 400);

  const fetchVersions = useCallback(() => {
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setIsLoading(true);
        httpClient
          .get('app/version/all')
          .then(response => {
            if (response?.data?.status) {
              setAllData(response.data.result || []);
            } else {
              NOTIFY_MESSAGE(response?.data?.message || 'Failed to load');
            }
          })
          .catch(() => NOTIFY_MESSAGE('Something Went Wrong'))
          .finally(() => {
            setIsLoading(false);
            setRefreshing(false);
          });
      } else {
        NOTIFY_MESSAGE('Please check your internet connectivity');
        setIsLoading(false);
      }
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchVersions();
      setOpenIndex(null);
    }, [fetchVersions]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    setSearchKeyword('');
    setOpenIndex(null);
    fetchVersions();
  };

  const handleDelete = item => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete the ${item.platform?.toUpperCase()} version record?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setIsLoading1(true);
            httpClient
              .delete(`app/version/${item.platform}`)
              .then(response => {
                if (response?.data?.status) {
                  NOTIFY_MESSAGE(
                    response.data.message || 'Deleted successfully',
                  );
                  setAllData(prev => prev.filter(d => d.id !== item.id));
                } else {
                  NOTIFY_MESSAGE(response?.data?.message || 'Delete failed');
                }
              })
              .catch(() => NOTIFY_MESSAGE('Something Went Wrong'))
              .finally(() => setIsLoading1(false));
          },
        },
      ],
      {cancelable: false},
    );
  };

  const handleEdit = item => {
    navigation.navigate('AddUpdateVersion', {data: item, isEdit: true});
  };

  const filteredData = allData.filter(item => {
    if (!debouncedSearch) return true;
    const kw = debouncedSearch.toLowerCase();
    return (
      item.platform?.toLowerCase().includes(kw) ||
      item.appName?.toLowerCase().includes(kw) ||
      item.latestVersion?.toLowerCase().includes(kw) ||
      item.minVersion?.toLowerCase().includes(kw)
    );
  });

  const renderMetricCard = (label, value, color = COLORS.PRIMARYBLACK) => (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, {color}]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
  const handleOpenUrl = url => {
    if (!url) return;
    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          NOTIFY_MESSAGE('Cannot open this URL');
        }
      })
      .catch(() => NOTIFY_MESSAGE('Something Went Wrong'));
  };

  const renderItem = ({item, index}) => {
    const isOpen = openIndex === index;
    const platformInfo = PLATFORM_ICON[item.platform?.toLowerCase()] || {};

    return (
      <View style={styles.card} key={item.id}>
        {/* Header Row */}
        <TouchableOpacity
          onPress={() => setOpenIndex(isOpen ? null : index)}
          activeOpacity={0.8}
          style={styles.cardHeader}>
          {/* Platform Icon + Name */}
          <View style={styles.cardLeft}>
            <View
              style={[
                styles.platformBadge,
                {
                  backgroundColor:
                    item.platform?.toLowerCase() === 'android'
                      ? '#3DDC8420'
                      : '#55555520',
                },
              ]}>
              <FontAwesome6
                name={platformInfo.icon || 'mobile'}
                size={18}
                color={platformInfo.color || COLORS.LABELCOLOR}
                iconStyle="brand"
              />
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.platformText}>
                {item.platform?.charAt(0).toUpperCase() +
                  item.platform?.slice(1)}
              </Text>
              <Text style={styles.appNameText}>{item.appName}</Text>
            </View>
          </View>

          {/* Version + Actions */}
          <View style={styles.cardRight}>
            <View style={styles.versionPill}>
              <Text style={styles.versionText}>v{item.latestVersion}</Text>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity
                disabled={isLoading1}
                onPress={() => handleEdit(item)}
                style={styles.actionBtn}>
                <Feather name="edit" size={16} color="#007bff" />
              </TouchableOpacity>
              <TouchableOpacity
                disabled={isLoading1}
                onPress={() => handleDelete(item)}
                style={styles.actionBtn}>
                <AntDesign name="delete" size={16} color="red" />
              </TouchableOpacity>
            </View>
            <AntDesign
              name={isOpen ? 'up' : 'down'}
              size={14}
              color={COLORS.LABELCOLOR}
              style={{marginLeft: 6}}
            />
          </View>
        </TouchableOpacity>

        {/* Expanded Details */}
        {isOpen && (
          <View style={styles.cardBody}>
            <View style={styles.divider} />
            <View style={styles.detailGrid}>
              {renderMetricCard(
                'Latest Version',
                item.latestVersion,
                '#16a34a',
              )}
              {renderMetricCard('Min Version', item.minVersion, '#d97706')}
              {renderMetricCard(
                'Force Update',
                item.forceUpdate ? 'Yes' : 'No',
                item.forceUpdate ? '#dc2626' : '#6b7280',
              )}
              {renderMetricCard(
                'Updated Date',
                item.updatedDate,
                COLORS.PRIMARYBLACK,
              )}
            </View>
            {item.message ? (
              <View style={styles.messageBox}>
                <Text style={styles.messageLabel}>Release Notes</Text>
                <Text style={styles.messageText}>{item.message}</Text>
              </View>
            ) : null}
            {!!item.storeUrl && (
              <View style={{marginTop: 10}}>
                <Text style={styles.storeLabel}>Store URL:</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleOpenUrl(item.storeUrl)}>
                  <Text style={styles.storeUrl}>{item.storeUrl}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{flex: 1, backgroundColor: COLORS.BACKGROUNDCOLOR}}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <CustomHeader
        leftOnPress={() => navigation.goBack()}
        leftIcon={
          <FontAwesome6
            name="angle-left"
            size={26}
            color={COLORS.LABELCOLOR}
            iconStyle="solid"
          />
        }
        title="App Version Settings"
      />

      {/* Search + Add */}
      <View style={styles.topBar}>
        <View style={styles.searchBox}>
          <TextInput
            placeholder="Search..."
            value={searchKeyword}
            onChangeText={setSearchKeyword}
            style={styles.searchInput}
            returnKeyType="search"
            placeholderTextColor={COLORS.grey500}
          />
          {searchKeyword.length > 0 && (
            <TouchableOpacity onPress={() => setSearchKeyword('')}>
              <AntDesign name="close-circle" size={20} color={COLORS.grey500} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('AddUpdateVersion', {isEdit: false})
          }
          style={styles.addBtn}
          activeOpacity={0.7}>
          <AntDesign name="plus" size={22} color={COLORS.PRIMARYWHITE} />
        </TouchableOpacity>
      </View>

      {isLoading || isLoading1 ? (
        <Loader />
      ) : isConnected ? (
        filteredData.length > 0 ? (
          <FlatList
            data={filteredData}
            renderItem={renderItem}
            keyExtractor={item => item.id?.toString()}
            contentContainerStyle={{
              paddingHorizontal: 12,
              paddingBottom: 24,
              paddingTop: 4,
            }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            initialNumToRender={10}
            maxToRenderPerBatch={20}
            windowSize={10}
            removeClippedSubviews={true}
          />
        ) : (
          <NoDataFound />
        )
      ) : (
        <Offline />
      )}
    </KeyboardAvoidingView>
  );
};

export default VersionList;

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    marginHorizontal: 12,
  },
  searchBox: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: COLORS.PRIMARYWHITE,
    paddingHorizontal: 12,
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ebedf0',
    height: 38,
  },
  searchInput: {
    flex: 1,
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    color: COLORS.PRIMARYBLACK,
    paddingVertical: 0,
  },
  addBtn: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: COLORS.LABELCOLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: COLORS.PRIMARYWHITE,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  platformBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  platformText: {
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.EXTRASMALL,
    color: '#111827',
  },
  appNameText: {
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.MINI,
    color: '#6b7280',
    marginTop: 1,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  versionPill: {
    backgroundColor: COLORS.LABELCOLOR + '18',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  versionText: {
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.MINI,
    color: COLORS.LABELCOLOR,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 4,
  },
  actionBtn: {
    padding: 4,
  },
  cardBody: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginBottom: 10,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricCard: {
    width: '47%',
    backgroundColor: COLORS.BACKGROUNDCOLOR,
    borderRadius: 8,
    padding: 10,
  },
  metricLabel: {
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.TOOSMALL,
    color: COLORS.PLACEHOLDERCOLOR,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  metricValue: {
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.SMALL,
  },
  messageBox: {
    marginTop: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.LABELCOLOR,
  },
  messageLabel: {
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.MINI,
    color: COLORS.TITLECOLOR,
    marginBottom: 4,
  },
  messageText: {
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.MINI,
    color: '#374151',
    lineHeight: 18,
  },
  storeUrl: {
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.MINI,
    color: '#3b82f6',
    marginTop: 2,
  },
});
