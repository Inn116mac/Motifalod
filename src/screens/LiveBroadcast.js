import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  BackHandler,
  Platform,
  PermissionsAndroid,
  AppState,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import CustomHeader from '../components/root/CustomHeader';
import {useNavigation} from '@react-navigation/native';
import COLORS from '../theme/Color';
import FONTS from '../theme/Fonts';
import {NodePublisher} from 'react-native-nodemediaclient';
import Loader from '../components/root/Loader';
import {ApiVideoLiveStreamView} from '@api.video/react-native-livestream';

const LiveBroadcast = ({route}) => {
  const {pageId, pageAccessToken, pageName} = route.params;
  const navigation = useNavigation();

  const [liveVideoId, setLiveVideoId] = useState(null);
  // console.log(liveVideoId);

  const [streamUrl, setStreamUrl] = useState(null);
  // console.log(streamUrl);

  const [isCreating, setIsCreating] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamingEnded, setStreamingEnded] = useState(false);

  const [inputTitle, setInputTitle] = useState('');
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [permissionsChecked, setPermissionsChecked] = useState(false);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const camera = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
        );
        const audio = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        );
        return (
          camera === PermissionsAndroid.RESULTS.GRANTED &&
          audio === PermissionsAndroid.RESULTS.GRANTED
        );
      } catch (err) {
        // console.warn(err);
        return false;
      }
    }
    // iOS: permissions handled by Info.plist and system dialog
    return true;
  };

  useEffect(() => {
    let isMounted = true;

    const checkPermissions = async () => {
      const granted = await requestPermissions();
      if (isMounted) {
        setPermissionsGranted(granted);
        setPermissionsChecked(true);
        if (!granted) {
          Alert.alert(
            'Permissions required',
            'Camera and microphone permissions are required to go live.',
          );
        }
      }
    };
    checkPermissions();

    return () => {
      isMounted = false;
    };
  }, []);

  const np = useRef(null);
  const ref = useRef(null);
  // console.log(np.current);

  const [frontCamera, setFrontCamera] = useState(true);
  const [torchEnable, setTorchEnable] = useState(false);
  const [mute, setMute] = useState(false);

  const [cameraType, setCameraType] = useState('front');

  const [streamKey, setStreamKey] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  // console.log('key : ', streamKey);
  // console.log('url : ', serverUrl);

  useEffect(() => {
    if (
      Platform.OS == 'ios' &&
      streamUrl &&
      ref.current &&
      !isCreating &&
      streamKey &&
      serverUrl
    ) {
      ref.current.startStreaming(streamKey, serverUrl);
      setStreaming(true);
    }
  }, [streamUrl, isCreating, streamKey, serverUrl]);

  useEffect(() => {
    if (Platform.OS == 'android' && streamUrl && np.current && !isCreating) {
      np.current.start();
      setStreaming(true);
    }
  }, [streamUrl, isCreating]);

  // Create Facebook Live video and get RTMP stream URL
  const createLiveVideo = async title => {
    setIsCreating(true);
    try {
      const response = await fetch(
        `https://graph.facebook.com/v22.0/${pageId}/live_videos?access_token=${pageAccessToken}`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            status: 'LIVE_NOW',
            title: title,
            description: '',
            // published: publishLive,
          }),
        },
      );
      const result = await response.json();

      if (result.error) {
        Alert.alert('Error creating live video', result.error.message);
        setIsCreating(false);
        return;
      }

      if (!result.id || !result.stream_url) {
        Alert.alert('Error', 'Failed to create live video. Please try again.');
        setIsCreating(false);
        return;
      }

      setLiveVideoId(result.id);
      setStreamUrl(result.stream_url);
      const streamUrlRaw = result.stream_url;
      const splitIndex = streamUrlRaw.indexOf('/rtmp/') + '/rtmp/'.length;
      setServerUrl(streamUrlRaw.substring(0, splitIndex));
      setStreamKey(streamUrlRaw.substring(splitIndex));
    } catch (error) {
      Alert.alert('error', error.message);
    } finally {
      setIsCreating(false);
    }
  };

  // End live session (cannot start again)
  const endLiveSession = async () => {
    if (!liveVideoId) {
      Alert.alert('No live video to end');
      return;
    }

    try {
      if (np.current) {
        np.current.stopPreview();
      }
      if (ref.current) {
        ref.current.stopStreaming();
      }
      setStreaming(false);
      setStreamingEnded(true);
      const response = await fetch(
        `https://graph.facebook.com/${liveVideoId}?access_token=${pageAccessToken}`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({end_live_video: true}),
        },
      );
      const result = await response.json();
      if (result.error) {
        Alert.alert('Error ending live video!');
        setStreamingEnded(false);
        return;
      }
      // Alert.alert('Live broadcast ended');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message);
      setStreamingEnded(false);
    }
  };

  // Show modal for title/desc input before creating live video
  const handleContinue = () => {
    if (!inputTitle.trim()) {
      Alert.alert(
        'Title required',
        'Please enter a title for your live video.',
      );
      return;
    }

    createLiveVideo(inputTitle);
  };

  // Handle back button (hardware and header)
  useEffect(() => {
    const handleBackAction = () => {
      if (streaming) {
        Alert.alert(
          'Exit Live Stream',
          'Are you sure you want to exit? This will end your live video.',
          [
            {text: 'Cancel', style: 'cancel'},
            {
              text: 'OK',
              onPress: () => endLiveSession(),
            },
          ],
        );
        return true; // prevent default back
      }
      return false; // allow default back
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackAction,
    );

    return () => backHandler.remove();
  }, [streaming, endLiveSession]);

  // Custom header back button handling
  const handleHeaderBack = () => {
    if (streaming) {
      Alert.alert(
        'Exit Live Stream',
        'Are you sure you want to exit? This will end your live video.',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'OK',
            onPress: () => endLiveSession(),
          },
        ],
      );
    } else {
      navigation.goBack();
    }
  };

  useEffect(() => {
    const handleAppStateChange = async nextAppState => {
      if (nextAppState === 'inactive' && streaming) {
        await endLiveSession();
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
    };
  }, [streaming, endLiveSession]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', e => {
      if (streaming) {
        e.preventDefault();
        Alert.alert(
          'Exit Live Stream',
          'Are you sure you want to exit? This will end your live video.',
          [
            {text: 'Cancel', style: 'cancel', onPress: () => {}},
            {
              text: 'OK',
              onPress: () => {
                unsubscribe();
                endLiveSession();
              },
            },
          ],
        );
      }
    });

    return unsubscribe;
  }, [navigation, streaming, endLiveSession]);

  return (
    <View style={styles.container}>
      <CustomHeader
        leftOnPress={handleHeaderBack}
        leftIcon={
          <FontAwesome6 name="angle-left" size={26} color={COLORS.LABELCOLOR} />
        }
        title={pageName}
      />

      <View style={{flex: 1}}>
        {!streamUrl && !isCreating && permissionsGranted && (
          <View style={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholder="Enter live video title"
              value={inputTitle}
              onChangeText={setInputTitle}
              maxLength={100}
              placeholderTextColor={COLORS.grey500}
            />
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}>
              <Text style={styles.continueButtonText}>Go Live</Text>
            </TouchableOpacity>
          </View>
        )}

        {isCreating && !streamUrl && (
          <View
            style={{alignItems: 'center', justifyContent: 'center', flex: 1}}>
            <ActivityIndicator size="large" color={COLORS.TITLECOLOR} />
            <Text
              style={{
                textAlign: 'center',
                color: COLORS.PRIMARYBLACK,
                fontSize: FONTS.FONTSIZE.SEMIMINI,
                fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                marginTop: 12,
              }}>
              Preparing live stream...
            </Text>
          </View>
        )}

        {permissionsChecked || isCreating ? (
          permissionsGranted && !isCreating && streamUrl ? (
            <View style={{flex: 1}}>
              <View
                style={{
                  flex: 1,
                  margin: 10,
                  // borderRadius: 10,
                  overflow: 'hidden',
                }}>
                <View
                  style={{
                    flex: 1,
                    marginBottom: 68,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: COLORS.LIGHTGREY,
                    overflow: 'hidden',
                  }}>
                  {Platform.OS === 'android' ? (
                    <NodePublisher
                      ref={np}
                      style={{
                        flex: 1,
                        overflow: 'hidden',
                      }}
                      url={streamUrl}
                      audioParam={{
                        codecid: NodePublisher.NMC_CODEC_ID_AAC,
                        profile: NodePublisher.NMC_PROFILE_AUTO,
                        samplerate: 48000,
                        channels: 1,
                        bitrate: 64 * 1000,
                      }}
                      videoParam={{
                        codecid: NodePublisher.NMC_CODEC_ID_H264,
                        profile: NodePublisher.NMC_PROFILE_AUTO,
                        width: 720,
                        height: 1280,
                        fps: 30,
                        bitrate: 2000 * 1000,
                      }}
                      frontCamera={frontCamera}
                      HWAccelEnable={true}
                      denoiseEnable={true}
                      torchEnable={torchEnable}
                      keyFrameInterval={2}
                      volume={mute ? 0.0 : 1.0}
                      videoOrientation={
                        NodePublisher.VIDEO_ORIENTATION_PORTRAIT
                      }
                      onEvent={(code, msg) => {}}
                    />
                  ) : (
                    <ApiVideoLiveStreamView
                      style={{
                        flex: 1,
                        backgroundColor: 'black',
                        alignSelf: 'stretch',
                      }}
                      isMuted={mute}
                      ref={ref}
                      camera={cameraType}
                      // torch={isTorchOn}
                      // enablePinchedZoom={true}
                      video={{
                        fps: 30,
                        resolution: '720p', // Alternatively, you can specify the resolution in pixels: { width: 1280, height: 720 }
                        bitrate: 2 * 1024 * 1024, // # 2 Mbps
                        gopDuration: 1, // 1 second
                      }}
                      audio={{
                        bitrate: 128000,
                        sampleRate: 44100,
                        isStereo: true,
                      }}
                      onConnectionSuccess={() => {
                        // console.log(
                        //   'ApiVideoLiveStreamView: Connection Success',
                        // );
                      }}
                      onConnectionFailed={e => {
                        // console.log(
                        //   'ApiVideoLiveStreamView: Connection Failed',
                        //   e,
                        // );
                      }}
                      onDisconnect={() => {
                        // console.log('ApiVideoLiveStreamView: Disconnected');
                      }}
                    />
                  )}
                </View>
              </View>

              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  flexDirection: 'row',
                  justifyContent: 'space-evenly',
                  alignItems: 'center',
                  // paddingHorizontal: 20,
                  // backgroundColor: 'rgba(0,0,0,0.2)',
                  backgroundColor: COLORS.PRIMARYBLACK,
                  paddingVertical: 6,
                  borderTopLeftRadius: 40,
                  borderTopRightRadius: 40,
                  // height: 60,
                }}>
                {!streaming ? (
                  <TouchableOpacity
                    onPress={() => {
                      if (np.current && Platform.OS == 'android') {
                        np.current.start();
                        np.current.startPreview();
                        setStreaming(true);
                      }
                      if (ref.current && Platform.OS == 'ios') {
                        ref.current.startStreaming(streamKey, serverUrl);
                        setStreaming(true);
                      }
                    }}
                    style={{alignItems: 'center'}}>
                    <MaterialIcons
                      name="play-circle-outline"
                      size={36}
                      color={COLORS.PRIMARYWHITE}
                    />
                    <Text
                      style={{
                        color: COLORS.PRIMARYWHITE,
                        fontSize: FONTS.FONTSIZE.MINI,
                        fontFamily: FONTS.FONT_FAMILY.REGULAR,
                      }}>
                      Start
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      if (np.current && Platform.OS == 'android') {
                        np.current.stopPreview();
                        setStreaming(false);
                      }
                      if (ref.current && Platform.OS == 'ios') {
                        ref.current.stopStreaming();
                        setStreaming(false);
                      }
                    }}
                    style={{alignItems: 'center'}}>
                    <MaterialIcons
                      name="stop-circle"
                      size={36}
                      color={COLORS.PRIMARYWHITE}
                    />
                    <Text
                      style={{
                        color: COLORS.PRIMARYWHITE,
                        fontSize: FONTS.FONTSIZE.MINI,
                        fontFamily: FONTS.FONT_FAMILY.REGULAR,
                      }}>
                      Stop
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={() => {
                    if (Platform.OS == 'android') {
                      setFrontCamera(prev => !prev);
                    }
                    if (Platform.OS == 'ios') {
                      setCameraType(prev =>
                        prev === 'front' ? 'back' : 'front',
                      );
                    }
                  }}
                  style={{alignItems: 'center'}}>
                  <MaterialIcons
                    name="flip-camera-android"
                    size={32}
                    color={COLORS.PRIMARYWHITE}
                  />
                  <Text
                    style={{
                      color: COLORS.PRIMARYWHITE,
                      fontSize: FONTS.FONTSIZE.MINI,
                      fontFamily: FONTS.FONT_FAMILY.REGULAR,
                    }}>
                    Camera
                  </Text>
                </TouchableOpacity>

                {Platform.OS == 'android' && (
                  <TouchableOpacity
                    onPress={() => {
                      setTorchEnable(prev => !prev);
                    }}
                    style={{alignItems: 'center'}}>
                    <MaterialIcons
                      name={torchEnable ? 'flash-on' : 'flash-off'}
                      size={32}
                      color={COLORS.PRIMARYWHITE}
                    />
                    <Text
                      style={{
                        color: COLORS.PRIMARYWHITE,
                        fontSize: FONTS.FONTSIZE.MINI,
                        fontFamily: FONTS.FONT_FAMILY.REGULAR,
                      }}>
                      Torch
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={() => {
                    setMute(prev => !prev);
                  }}
                  style={{alignItems: 'center'}}>
                  <MaterialIcons
                    name={mute ? 'mic-off' : 'mic'}
                    size={32}
                    color={COLORS.PRIMARYWHITE}
                  />
                  <Text
                    style={{
                      color: COLORS.PRIMARYWHITE,
                      fontSize: FONTS.FONTSIZE.MINI,
                      fontFamily: FONTS.FONT_FAMILY.REGULAR,
                    }}>
                    {mute ? 'Unmute' : 'Mute'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={streamingEnded}
                  onPress={() => {
                    Alert.alert(
                      'End Live Stream',
                      'Are you sure you want to end your live video?',
                      [
                        {text: 'Cancel', style: 'cancel'},
                        {text: 'OK', onPress: () => endLiveSession()},
                      ],
                    );
                  }}
                  style={{alignItems: 'center'}}>
                  <MaterialIcons
                    name="cancel"
                    size={32}
                    color={COLORS.PRIMARYWHITE}
                  />
                  <Text
                    style={{
                      color: COLORS.PRIMARYWHITE,
                      fontSize: FONTS.FONTSIZE.MINI,
                      fontFamily: FONTS.FONT_FAMILY.REGULAR,
                    }}>
                    End
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : !permissionsGranted ? (
            <View
              style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
              <Text
                style={{
                  fontSize: FONTS.FONTSIZE.MEDIUM,
                  textAlign: 'center',
                  fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                  color: COLORS.TITLECOLOR,
                }}>
                Camera and microphone permissions are required to start a live
                stream.
              </Text>
            </View>
          ) : null
        ) : (
          <Loader />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.BACKGROUNDCOLOR},
  title: {
    fontSize: FONTS.FONTSIZE.MEDIUM,
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    color: COLORS.TITLECOLOR,
  },
  modalContent: {
    borderRadius: 10,
    padding: 16,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.INPUTBORDER,
    borderRadius: 6,
    marginBottom: 12,
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    backgroundColor: COLORS.PRIMARYWHITE,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: COLORS.PRIMARYBLACK,
  },
  continueButton: {
    backgroundColor: COLORS.LABELCOLOR,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 30,
    marginTop: 10,
  },
  continueButtonText: {
    color: COLORS.PRIMARYWHITE,
    fontSize: FONTS.FONTSIZE.EXTRASMALL,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    textAlign: 'center',
  },
});

export default LiveBroadcast;
