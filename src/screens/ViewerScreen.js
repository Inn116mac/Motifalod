import {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Dimensions,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import CustomHeader from '../components/root/CustomHeader';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import COLORS from '../theme/Color';
import FONTS from '../theme/Fonts';
import Loader from '../components/root/Loader';

const SERVER_URL = 'http://65.49.60.248:3000';

// Helper: render for both live and recorded
function VideoList({title, data, onPressItem, isLive}) {
  if (!data.length) return null;
  return (
    <>
      <Text style={styles.sectionTitle}>{title}</Text>
      <FlatList
        data={data}
        keyExtractor={(item, idx) => (isLive ? item.roomId : item.file)}
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
                      item.broadcaster?.name
                        ? item.broadcaster?.name
                        : 'Unknown'
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
              <Text style={{fontSize: 22, color: '#fff'}}>{'>'}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </>
  );
}

export default function ViewerScreen({route}) {
  const {height} = Dimensions.get('window');
  const {item = {}} = route.params?.data || {};
  const [liveEvents, setLiveEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const intervalRef = useRef(null);

  const fetchEvents = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    try {
      const res = await fetch(
        `${SERVER_URL}/api/live-events?appName=${encodeURIComponent(
          'motifalod',
        )}`,
        {
          signal: controller.signal,
        },
      );
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      const data = await res.json();
      setLiveEvents(data);
    } catch (err) {
      console.log('Fetch error:', err.message);
      setLiveEvents([]); // fallback when server is off
    } finally {
      clearTimeout(timeoutId);
      setLoading(false); // always stop loader
    }
  };

  useEffect(() => {
    fetchEvents();
    intervalRef.current = setInterval(fetchEvents, 3000); // poll both every 3s
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
  const handlePressItem = (item, isLive) => {
    if (isLive) {
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
        videoUrl: item.url,
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
          <FontAwesome6 name="angle-left" size={26} color={COLORS.LABELCOLOR} />
        }
        title={item?.name}
      />
      {loading ? (
        <Loader />
      ) : (
        <ScrollView style={{flex: 1}}>
          <VideoList
            title="Live Now"
            data={liveEvents}
            onPressItem={handlePressItem}
            isLive={true}
          />
          {/* <VideoList
            title="Past Recordings"
            data={recordedEvents}
            onPressItem={handlePressItem}
            isLive={false}
          /> */}
          {liveEvents.length === 0 && (
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
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUNDCOLOR,
  },
  sectionTitle: {
    color: COLORS.PRIMARYBLACK,
    fontSize: FONTS.FONTSIZE.MEDIUM,
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    marginLeft: 8,
  },
  viewerCountLabel: {
    color: '#fff',
    fontSize: FONTS.FONTSIZE.EXTRAMINI,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    marginTop: 2,
  },
  text: {
    color: COLORS.PRIMARYBLACK,
    fontSize: FONTS.FONTSIZE.MEDIUM,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    textAlign: 'center',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    backgroundColor: '#111',
  },
  info: {flex: 1},
  title: {
    color: '#fff',
    fontSize: FONTS.FONTSIZE.MEDIUM,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
  },
  subtitle: {
    color: '#aaa',
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
  },
  chevron: {marginLeft: 5},
  status: {marginRight: 8},
  statusBadge: {
    color: '#fff',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: FONTS.FONTSIZE.EXTRAMINI,
  },
});
