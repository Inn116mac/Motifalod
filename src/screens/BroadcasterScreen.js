import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Text,
  Keyboard,
  AppState,
  BackHandler,
} from 'react-native';
import {mediaDevices, RTCView} from 'react-native-webrtc';
import io from 'socket.io-client';
import * as mediasoupClient from 'mediasoup-client';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomHeader from '../components/root/CustomHeader';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import COLORS from '../theme/Color';
import {useNetworkStatus} from '../connection/UseNetworkStatus';
import Loader from '../components/root/Loader';
import Offline from '../components/root/Offline';
import FONTS from '../theme/Fonts';

const SERVER_URL = 'http://65.49.60.248:3000';


export default function BroadcasterScreen({route}) {
  const {item} = route.params.data;
  const {isConnected, networkLoading} = useNetworkStatus();
  const [stream, setStream] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  function randomRoomId() {
    return 'event-' + Math.random().toString(36).slice(2, 10);
  }

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        if (isStreaming) {
          stopAll();
        }
      }
    });

    return () => {
      subscription?.remove?.();
    };
  }, [isStreaming]);

  useEffect(() => {
    const onBackPress = () => {
      if (isStreaming) {
        endVideo();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress,
    );

    return () => backHandler.remove();
  }, [isStreaming]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', e => {
      if (!isStreaming) return;

      e.preventDefault();
      endVideo();
    });

    return unsubscribe;
  }, [navigation, isStreaming]);

  const navigation = useNavigation();

  const socketRef = useRef(null);
  const deviceRef = useRef(null);
  const sendTransportRef = useRef(null);
  const producersRef = useRef([]);
  const videoTrackRef = useRef(null);
  const audioTrackRef = useRef(null);

  const getMediaStream = async (isFront = true) => {
    const facingMode = isFront ? 'user' : 'environment';
    return await mediaDevices.getUserMedia({
      audio: true,
      video: {facingMode},
    });
  };

  const startStreaming = async () => {
    Keyboard.dismiss();
    if (!title.trim()) {
      Alert.alert('Required', 'Please Enter a stream title.');
      return;
    }
    if (isStarting || isStreaming) return;
    setIsStarting(true);
    setIsPaused(false);

    let newRoomId = roomId;
    if (!newRoomId) {
      newRoomId = randomRoomId();
      setRoomId(newRoomId);
    }

    const sock = io(SERVER_URL);
    socketRef.current = sock;

    let localStream;
    try {
      localStream = await getMediaStream(isFrontCamera);
    } catch (err) {
      setIsStarting(false);
      Alert.alert('Media Error', 'Failed to get camera/mic permissions.');
      return;
    }
    setStream(localStream);
    setName('');
    setTitle('');

    videoTrackRef.current = localStream.getVideoTracks()[0];
    audioTrackRef.current = localStream.getAudioTracks()[0];

    // Use the unique roomId here!
    sock.emit(
      'joinRoom',
      newRoomId,
      {name, title, appName: 'motifalod'},
      async ({rtpCapabilities}) => {
        const dev = new mediasoupClient.Device();
        await dev.load({routerRtpCapabilities: rtpCapabilities});
        deviceRef.current = dev;

        sock.emit('createWebRtcTransport', async transportOptions => {
          const transport = dev.createSendTransport(transportOptions);
          sendTransportRef.current = transport;

          transport.on('connect', ({dtlsParameters}, callback, errback) => {
            sock.emit('connectTransport', {dtlsParameters}, err => {
              if (err) errback(err);
              else callback();
            });
          });

          transport.on(
            'produce',
            ({kind, rtpParameters}, callback, errback) => {
              sock.emit('produce', {kind, rtpParameters}, ({id, error}) => {
                if (error) errback(error);
                else callback({id});
              });
            },
          );

          try {
            let videoProducer = null;
            let audioProducer = null;
            if (videoTrackRef.current) {
              videoProducer = await transport.produce({
                track: videoTrackRef.current,
              });
            }
            if (audioTrackRef.current) {
              audioProducer = await transport.produce({
                track: audioTrackRef.current,
              });
            }
            producersRef.current = [videoProducer, audioProducer];
            setIsStreaming(true);
            setIsStarting(false);

            // socketRef.current.emit('notifyNewStream', {
            //   name,
            //   title,
            // });
          } catch (err) {
            setIsStarting(false);
            console.error('Error producing tracks:', err);
          }
        });
      },
    );

    sock.once('connect_error', error => {
      console.error('Connection failed:', error);
      setIsStarting(false);
      stopAll();
      Alert.alert(
        'Connection Failed',
        'Cannot connect to streaming server. Please check if the server is running and try again.',
      );
    });

    sock.once('error', error => {
      setIsStarting(false);
      stopAll();
      console.error('Socket error:', error);
      Alert.alert(
        'Server Error',
        'An error occurred with the streaming server connection.',
      );
    });

    sock.on('disconnect', () => {
      stopAll();
    });
  };

  const pauseStreaming = async () => {
    if (producersRef.current[0]) await producersRef.current[0].pause();
    if (producersRef.current[1]) await producersRef.current[1].pause();
    if (socketRef.current) socketRef.current.emit('broadcastPause');
    setIsPaused(true);
  };

  const resumeStreaming = async () => {
    if (producersRef.current[0]) await producersRef.current[0].resume();
    if (producersRef.current[1]) await producersRef.current[1].resume();
    if (socketRef.current) socketRef.current.emit('broadcastResume');
    setIsPaused(false);
  };

  const endVideo = async () => {
    Alert.alert(
      'End Live Stream?',
      'Are you sure you want to stop your live stream?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'End Stream',
          style: 'destructive',
          onPress: async () => {
            await stopAll();
          },
        },
      ],
    );
  };

  const switchCamera = async () => {
    if (!stream) return;
    const videoTrack = videoTrackRef.current;
    if (videoTrack && typeof videoTrack._switchCamera === 'function') {
      videoTrack._switchCamera();
      setIsFrontCamera(prev => !prev);
    } else {
      const newIsFront = !isFrontCamera;
      const newStream = await getMediaStream(newIsFront);
      setStream(newStream);
      setIsFrontCamera(newIsFront);

      if (isStreaming && producersRef.current[0]) {
        const newVideoTrack = newStream.getVideoTracks()[0];
        await producersRef.current[0].replaceTrack({track: newVideoTrack});
        videoTrackRef.current = newVideoTrack;
      }
    }
  };

  const toggleAudio = async () => {
    if (producersRef.current[1]) {
      if (isAudioMuted) {
        await producersRef.current[1].resume();
        setIsAudioMuted(false);
      } else {
        await producersRef.current[1].pause();
        setIsAudioMuted(true);
      }
    }
  };

  const stopAll = async () => {
    try {
      // 1. Notify viewers the stream has ended, WAIT for server ACK
      if (socketRef.current) {
        await new Promise(resolve => {
          socketRef.current.emit('broadcastEnded', () => {
            resolve();
          });
        });
      }

      // 2. Now safe to disconnect and cleanup
      if (producersRef.current && Array.isArray(producersRef.current)) {
        producersRef.current.forEach(producer => {
          if (producer && producer.close) {
            try {
              producer.close();
            } catch (e) {}
          }
        });
        producersRef.current = [];
      }
      if (sendTransportRef.current) {
        try {
          sendTransportRef.current.close();
        } catch (e) {}
        sendTransportRef.current = null;
      }
      // 4. Remove all socket event listeners and disconnect
      if (socketRef.current) {
        socketRef.current.off('connect_error');
        socketRef.current.off('error');
        socketRef.current.off('disconnect');
        try {
          socketRef.current.disconnect();
        } catch (e) {}
        socketRef.current = null;
      }
      if (stream) {
        try {
          stream.getTracks().forEach(track => track.stop && track.stop());
        } catch (e) {}
        setStream(null);
      }
      setIsStreaming(false);
      setIsStarting(false);
      setIsPaused(false);
      setIsAudioMuted(false);
    } catch (err) {
      console.error('Error in stopAll:', err);
    }
  };

  useEffect(() => {
    return () => {
      stopAll();
    };
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.BACKGROUNDCOLOR,
      }}>
      <CustomHeader
        leftOnPress={() => {
          if (isStreaming) {
            endVideo();
          } else {
            navigation.goBack();
          }
        }}
        leftIcon={
          <FontAwesome6 name="angle-left" size={26} color={COLORS.LABELCOLOR} />
        }
        title={item?.name || 'Live Stream'}
      />
      {networkLoading ? (
        <Loader />
      ) : isConnected ? (
        !isStreaming ? (
          <View style={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholder="Stream Title"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
              placeholderTextColor={COLORS.grey500}
            />
            <TextInput
              style={styles.input}
              placeholder="Your Name"
              value={name}
              onChangeText={setName}
              maxLength={100}
              placeholderTextColor={COLORS.grey500}
            />

            <TouchableOpacity
              disabled={isStarting}
              style={styles.continueButton}
              onPress={startStreaming}>
              <Text style={styles.continueButtonText}>
                {isStarting ? 'Please Wait...' : 'Go Live'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{flex: 1}}>
            <RTCView
              streamURL={stream?.toURL()}
              mirror={isFrontCamera}
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              objectFit="cover"
            />
            <View style={styles.iconBar}>
              <TouchableOpacity
                onPress={isPaused ? resumeStreaming : pauseStreaming}
                style={styles.iconButton}>
                <Icon
                  name={isPaused ? 'play-pause' : 'pause-circle-outline'}
                  size={34}
                  color="#fff"
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={toggleAudio}
                style={styles.iconButton}
                disabled={!stream}>
                <Icon
                  name={isAudioMuted ? 'microphone-off' : 'microphone'}
                  size={34}
                  color={isAudioMuted ? '#f00' : '#fff'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={switchCamera}
                style={styles.iconButton}
                disabled={!stream}>
                <Icon name="camera-flip" size={34} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => endVideo()}
                style={styles.iconButton}
                disabled={!stream}>
                <Icon name="stop-circle-outline" size={34} color="#f00" />
              </TouchableOpacity>
            </View>
          </View>
        )
      ) : (
        <Offline />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    borderRadius: 10,
    padding: 16,
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
  iconBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(20,20,20,0.85)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 100,
  },
  iconButton: {
    padding: 10,
  },
});
