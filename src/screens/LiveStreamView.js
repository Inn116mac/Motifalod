import React, {useEffect, useState} from 'react';
import {View, StyleSheet, Text, Linking, Platform} from 'react-native';
import Loader from '../components/root/Loader';
import COLORS from '../theme/Color';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import CustomHeader from '../components/root/CustomHeader';
import {useNavigation} from '@react-navigation/native';
import FONTS from '../theme/Fonts';
import NetInfo from '@react-native-community/netinfo';
import {NOTIFY_MESSAGE} from '../constant/Module';
import httpClient from '../connection/httpClient';
import WebView from 'react-native-webview';
import InAppBrowser from 'react-native-inappbrowser-reborn';

const LiveStreamView = ({route}) => {
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const {item} = route.params.data;
  const [liveVideo, setLiveVideo] = useState(null);

  const [loading1, setLoading1] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  const PAGE_NAME = 'InnGenius';

  useEffect(() => {
    getPages();
  }, []);

  useEffect(() => {
    if (liveVideo && Platform.OS === 'ios' && !hasOpened) {
      const url = extractEmbedUrl(liveVideo.embed_html);
      if (url) {
        setHasOpened(true);
        openInAppBrowser(url);
      }
    }
  }, [liveVideo]);

  const getPages = () => {
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setLoading(true);
        httpClient
          .get(`livestream/get?name=${PAGE_NAME}`)
          .then(async response => {
            if (response.data.status) {
              const newData = response?.data?.result;

              if (newData?.length > 0) {
                const firstItem = newData[0];
                await fetchLiveVideos(firstItem.id, firstItem.access_token);
              } else {
                NOTIFY_MESSAGE('No page found!');
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
            navigation.navigate('Dashboard');
          })
          .finally(() => setLoading(false));
      } else {
        NOTIFY_MESSAGE('Please check your internet connectivity');
      }
    });
  };

  const fetchLiveVideos = async (pageId, accessToken) => {
    setLoading1(true);
    try {
      const response = await fetch(
        `https://graph.facebook.com/v22.0/${pageId}/live_videos?access_token=${accessToken}`,
      );
      const json = await response.json();

      if (json.data && json.data.length > 0) {
        const live = json.data.find(video => video.status === 'LIVE');

        // const vods = json.data.filter(video => video.status === 'VOD');

        setLiveVideo(live || null);
        // setVodVideos(vods);
      } else {
        setLiveVideo(null);
        // setVodVideos([]);
      }
    } catch (error) {
      // console.warn('Error fetching live videos:', error);
      NOTIFY_MESSAGE(err || err?.message ? 'Something Went Wrong' : null);
      // navigation.navigate('Dashboard');
    } finally {
      setLoading1(false);
    }
  };

  const extractEmbedUrl = embedHtml => {
    const regex = /src="([^"]+)"/;
    const match = embedHtml.match(regex);
    return match ? match[1] : null;
  };

  const openInAppBrowser = async url => {
    try {
      if (await InAppBrowser.isAvailable()) {
        await InAppBrowser.open(url, {
          dismissButtonStyle: 'close',
          preferredBarTintColor: COLORS.BACKGROUNDCOLOR,
          preferredControlTintColor: COLORS.PRIMARYBLACK,
          readerMode: false,
          animated: true,
          modalPresentationStyle: 'fullScreen',
          modalTransitionStyle: 'coverVertical',
          modalEnabled: true,
          enableBarCollapsing: true,
        }).then(() => {
          navigation.navigate('Dashboard');
        });
      } else {
        Linking.openURL(url);
      }
    } catch (error) {
      NOTIFY_MESSAGE('Could not open the live video.');
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

      {loading || loading1 ? (
        <Loader />
      ) : liveVideo ? (
        Platform.OS === 'android' ? (
          <WebView
            limitsNavigationsToAppBoundDomains={true}
            originWhitelist={['*']}
            source={{
              uri: extractEmbedUrl(liveVideo.embed_html),
            }}
            style={{flex: 1, backgroundColor: COLORS.TABLEBORDER}}
            allowsInlineMediaPlayback={false}
            mediaPlaybackRequiresUserAction={false}
            mediaPlaybackAllowsAirPlay={true}
            allowsAirPlayForMediaPlayback={true} // iOS only
            allowsFullscreenVideo={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowsBackForwardNavigationGestures={true}
            startInLoadingState={true}
          />
        ) : (
          // <TouchableOpacity
          //   style={{
          //     backgroundColor: COLORS.LABELCOLOR,
          //     padding: 10,
          //     borderRadius: 5,
          //     margin: 10,
          //     alignItems: 'center',
          //     justifyContent: 'center',
          //   }}
          //   onPress={() => {
          //     const url = extractEmbedUrl(liveVideo.embed_html);
          //     Linking.openURL(url);
          //   }}>
          //   <Text
          //     style={{
          //       color: COLORS.PRIMARYWHITE,
          //       fontSize: FONTS.FONTSIZE.MEDIUM,
          //       fontFamily: FONTS.FONT_FAMILY.MEDIUM,
          //     }}>
          //     Click To Join Live
          //   </Text>
          // </TouchableOpacity>
          <View
            style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <Text
              style={{
                color: COLORS.PLACEHOLDERCOLOR,
                fontSize: FONTS.FONTSIZE.MEDIUM,
                fontFamily: FONTS.FONT_FAMILY.MEDIUM,
              }}>
              Live video is opening...
            </Text>
          </View>
        )
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
              fontFamily: FONTS.FONT_FAMILY.BOLD,
              color: COLORS.PLACEHOLDERCOLOR,
            }}>
            No Live Video available!
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUNDCOLOR,
  },
});

export default LiveStreamView;
