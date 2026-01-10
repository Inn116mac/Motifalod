import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import CustomHeader from '../components/root/CustomHeader';
import {FontAwesome6} from "@react-native-vector-icons/fontawesome6";
import {Entypo} from "@react-native-vector-icons/entypo";
import COLORS from '../theme/Color';
import FONTS from '../theme/Fonts';
import Loader from '../components/root/Loader';

const SERVER_URL = 'http://applivestream.inngenius.com:3000';
// const SERVER_URL = 'http://192.168.1.107:8080';
// const SERVER_URL = 'http://10.108.200.211:8080';

function VideoList({data, onPressItem, isLive}) {
  // if (!data.length)
  //   return (
  //     <View style={styles.emptyView}>
  //       <Text style={styles.text}>
  //         No {isLive ? 'live' : 'recorded'} videos to display.
  //       </Text>
  //     </View>
  //   );

  return (
    <FlatList
      data={data}
      keyExtractor={(item, idx) =>
        isLive ? item.roomId : item.fileName || idx
      }
      renderItem={({item}) => (
        <TouchableOpacity
          style={styles.listItem}
          onPress={() => onPressItem(item, isLive)}>
          <View style={styles.info}>
            <Text style={styles.title}>
              {isLive
                ? item.broadcaster?.title || 'Untitled Event'
                : item.title}
            </Text>
            <Text style={styles.subtitle}>
              {isLive
                ? `By ${
                    item.broadcaster?.name ? item.broadcaster?.name : 'Unknown'
                  }`
                : item.date}
            </Text>
            {/* {isLive && (
              <Text style={styles.viewerCountLabel}>
                👀 {item.viewerCount}{' '}
                {item.viewerCount === 1 ? 'person' : 'people'} joining
              </Text>
            )} */}
          </View>
          {isLive && (
            <View style={styles.status}>
              <Text
                style={[
                  styles.statusBadge,
                  {backgroundColor: item.isPaused ? '#888' : 'red'},
                ]}>
                {item.isPaused ? 'Paused' : 'LIVE'}
              </Text>
            </View>
          )}
          <View style={styles.chevron}>
            <Entypo
              name="chevron-right"
              size={22}
              color={COLORS.PLACEHOLDERCOLOR}
            />
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

export default function ViewerScreen({route}) {
  const {height} = Dimensions.get('window');
  const {item = {}} = route.params?.data || {};
  const [liveEvents, setLiveEvents] = useState([]);
  const [recordedEvents, setRecordedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const intervalRef = useRef(null);
  const [activeTab, setActiveTab] = useState('live');

  const fetchLiveEvents = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(
        `${SERVER_URL}/api/live-events?appName=${encodeURIComponent(
          'motifalod',
        )}`,
        {signal: controller.signal},
      );
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setLiveEvents(data);
    } catch (err) {
      // console.log('Fetch liveEvents error:', err.message);
      setLiveEvents([]);
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const fetchRecordings = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(
        `${SERVER_URL}/api/recordings?appName=${encodeURIComponent(
          'motifalod',
        )}`,
        {signal: controller.signal},
      );

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();

      setRecordedEvents(data);
    } catch (err) {
      // console.log('Fetch recordings error:', err.message);
      setRecordedEvents([]);
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchLiveEvents(), fetchRecordings()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    intervalRef.current = setInterval(() => {
      fetchLiveEvents();
      fetchRecordings();
    }, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const checkServerCapacity = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/server-capacity`);
      const data = await response.json();


      if (data.status === 'FULL' || data.utilizationPercent >= 95) {
        Alert.alert('Server at Capacity', 'Please try again later.');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking server capacity:', error);
      // In case of error, allow stream to continue
      return true;
    }
  };

  const handlePressItem = async (item, isLive) => {
    if (isLive) {
      const canJoin = await checkServerCapacity();
      if (!canJoin) return;
      navigation.navigate('FullScreenVideo', {
        roomId: item.roomId,
        title: item.broadcaster?.title,
        name: item.broadcaster?.name,
        item,
        isRecording: false, // Mark live event
        videoUrl: undefined, // Not needed, but explicit
      });
    } else {
      navigation.navigate('FullScreenVideo', {
        videoUrl: `${SERVER_URL}/recordings/motifalod/${item.fileName}`,
        title: item.title,
        date: item.date,
        item,
        isRecording: true, // Mark recording
        roomId: undefined, // Not needed, but explicit
      });
    }
  };

  return (
    <View style={styles.container}>
      <CustomHeader
        leftOnPress={() => navigation.goBack()}
        leftIcon={
          <FontAwesome6 name="angle-left" iconStyle='solid' size={26} color={COLORS.LABELCOLOR} />
        }
        title={item?.name}
      />

      {loading ? (
        <Loader />
      ) : (
        <>
          {/* Static Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'live' && styles.activeTab]}
              onPress={() => setActiveTab('live')}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'live' && styles.activeTabText,
                ]}>
                Live Now
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabItem,
                activeTab === 'recorded' && styles.activeTab,
              ]}
              onPress={() => setActiveTab('recorded')}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'recorded' && styles.activeTabText,
                ]}>
                Past Recordings
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {activeTab === 'live' ? (
            <VideoList
              data={liveEvents}
              onPressItem={handlePressItem}
              isLive={true}
            />
          ) : (
            <VideoList
              data={recordedEvents?.filter(
                item => item.fileName && item.fileName.endsWith('.mp4'),
              )}
              onPressItem={handlePressItem}
              isLive={false}
            />
          )}

          {activeTab === 'live' && liveEvents.length === 0 && (
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: height * 0.8,
              }}>
              <Text style={styles.text}>No live video right now.</Text>
            </View>
          )}
          {activeTab === 'recorded' && recordedEvents.length === 0 && (
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: height * 0.8,
              }}>
              <Text style={styles.text}>No Past Recordings.</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUNDCOLOR,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomColor: COLORS.TITLECOLOR,
    borderBottomWidth: 2,
    borderRadius: 20,
  },
  tabText: {
    color: COLORS.INACTIVETAB,
    fontSize: FONTS.FONTSIZE.EXTRASMALL,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
  },
  activeTabText: {
    color: COLORS.TITLECOLOR,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#ffff',
    marginHorizontal: 10,
    borderWidth: 1,
    marginTop: 10,
    borderRadius: 8,
    borderColor: COLORS.TABLEBORDER,
  },
  info: {
    flex: 1,
  },
  title: {
    color: '#000',
    fontSize: FONTS.FONTSIZE.MEDIUM,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
  },
  subtitle: {
    color: '#000',
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
  },
  viewerCountLabel: {
    color: '#ffff',
    fontSize: FONTS.FONTSIZE.EXTRAMINI,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    marginTop: 2,
    backgroundColor: COLORS.TITLECOLOR,
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    borderRadius: 5,
    paddingVertical: 2,
  },
  chevron: {marginLeft: 5},
  status: {marginRight: 8},
  statusBadge: {
    color: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    fontSize: FONTS.FONTSIZE.EXTRAMINI,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    includeFontPadding: false,
  },
  text: {
    color: COLORS.PRIMARYBLACK,
    fontSize: FONTS.FONTSIZE.MEDIUM,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    textAlign: 'center',
    marginTop: 20,
  },
  emptyView: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
});
