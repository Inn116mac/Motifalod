import React, {useEffect, useRef, useState} from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform, // ✅ ADD THIS
} from 'react-native';
import {RTCView} from 'react-native-webrtc';
import * as mediasoupClient from 'mediasoup-client';
import io from 'socket.io-client';
import InCallManager from 'react-native-incall-manager'; // ✅ ADD THIS
import CustomHeader from '../components/root/CustomHeader';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import COLORS from '../theme/Color';
import FONTS from '../theme/Fonts';
import {useNavigation} from '@react-navigation/native';
import {NOTIFY_MESSAGE} from '../constant/Module';
import Video from 'react-native-video';
import KeepAwake from 'react-native-keep-awake';

const SERVER_URL = 'http://applivestream.inngenius.com:3000';
// const SERVER_URL = 'http://192.168.1.107:8080';
// const SERVER_URL = 'http://10.108.200.211:8080';

export default function FullScreenVideoScreen({route}) {
  const {roomId, title, item, videoUrl, isRecording} = route.params;

  const fullVideoUrl =
    videoUrl && !videoUrl.startsWith('http') ? SERVER_URL + videoUrl : videoUrl;

  const [stream, setStream] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const navigation = useNavigation();
  const [ended, setEnded] = useState(false);

  const socketRef = useRef(null);
  const deviceRef = useRef(null);
  const recvTransportRef = useRef(null);
  const consumersRef = useRef([]);

  // ✅ ADD AUDIO SESSION MANAGEMENT
  useEffect(() => {
    if (Platform.OS === 'ios' && !isRecording) {
      // Start audio session for video viewing (not recording)
      InCallManager.start({media: 'video', auto: false, ringback: ''});
      InCallManager.setForceSpeakerphoneOn(true);
      console.log('✅ iOS Audio Session started - Speaker enabled');

      return () => {
        InCallManager.stop();
        console.log('🛑 iOS Audio Session stopped');
      };
    }
  }, [isRecording]);

  // Clean up on unmount or room switch
  const cleanup = () => {
    if (consumersRef.current.length) {
      consumersRef.current.forEach(c => {
        try {
          c.close();
        } catch (e) {}
      });
      consumersRef.current = [];
    }
    if (recvTransportRef.current) {
      try {
        recvTransportRef.current.close();
      } catch (e) {}
      recvTransportRef.current = null;
    }
    if (socketRef.current) {
      try {
        socketRef.current.disconnect();
      } catch (e) {}
      socketRef.current = null;
    }
    setStream(null);
  };

  useEffect(() => {
    if (isRecording) return;
    cleanup();

    const socket = io(SERVER_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('joinRoom', roomId, {}, async ({rtpCapabilities}) => {
        try {
          const device = new mediasoupClient.Device();
          await device.load({routerRtpCapabilities: rtpCapabilities});
          deviceRef.current = device;
        } catch (err) {
          NOTIFY_MESSAGE(err.message || 'Error loading device');
          return;
        }

        socket.emit('createWebRtcTransport', async transportOptions => {
          const recvTransport =
            deviceRef.current.createRecvTransport(transportOptions);
          recvTransportRef.current = recvTransport;

          recvTransport.on('connect', ({dtlsParameters}, callback, errback) => {
            socket.emit('connectTransport', {dtlsParameters}, err => {
              if (err) errback(err);
              else callback();
            });
          });

          socket.emit(
            'consume',
            {rtpCapabilities: deviceRef.current.rtpCapabilities},
            async consumerParamsList => {
              if (consumerParamsList.error) {
                NOTIFY_MESSAGE(consumerParamsList.error);
                setStream(null);
                return;
              }
              let videoStream = new MediaStream();
              let gotVideo = false;

              for (const params of consumerParamsList) {
                const consumer = await recvTransport.consume(params);
                consumersRef.current.push(consumer);

                if (params.kind === 'video') {
                  videoStream.addTrack(consumer.track);
                  gotVideo = true;
                  setIsPaused(params.paused);
                }
                if (params.kind === 'audio') {
                  videoStream.addTrack(consumer.track);
                }
              }

              if (gotVideo) {
                setStream(videoStream);
                // ✅ ENSURE SPEAKER IS ON AFTER STREAM STARTS
                if (Platform.OS === 'ios') {
                  setTimeout(() => {
                    InCallManager.setForceSpeakerphoneOn(true);
                  }, 500);
                }
              } else {
                NOTIFY_MESSAGE('No video stream found');
              }
              socket.emit('resume');
            },
          );
        });
      });
    });

    socket.on('producerPaused', () => setIsPaused(true));
    socket.on('producerResumed', () => setIsPaused(false));
    socket.on('producerEnded', () => {
      setStream(null);
      setEnded(true);

      setTimeout(() => {
        navigation.navigate('ViewerScreen', {data: {item}});
      }, 1500);
    });

    socket.on('disconnect', () => {
      cleanup();
    });

    return () => {
      cleanup();
    };
  }, [roomId]);

  useEffect(() => {
    if (stream) {
      KeepAwake.activate();
    } else {
      KeepAwake.deactivate();
    }

    return () => {
      KeepAwake.deactivate();
    };
  }, [stream]);

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader
        leftOnPress={() => navigation.goBack()}
        leftIcon={
          <FontAwesome6
            iconStyle="solid"
            name="angle-left"
            size={26}
            color={COLORS.LABELCOLOR}
          />
        }
        title={title ? title : ''}
      />
      {isRecording ? (
        <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.65)'}}>
          <Video
            source={{uri: fullVideoUrl}}
            style={{flex: 1}}
            controls={true}
            resizeMode="cover"
            onError={e =>
              console.log('Video playback error:', JSON.stringify(e))
            }
          />
        </View>
      ) : !stream ? (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.TITLECOLOR} size="large" />
          <Text
            style={{
              fontSize: FONTS.FONTSIZE.MEDIUM,
              fontFamily: FONTS.FONT_FAMILY.MEDIUM,
              color: COLORS.TITLECOLOR,
            }}>
            {ended ? 'Live stream has ended' : 'Connecting to live video...'}
          </Text>
        </View>
      ) : (
        <View style={{flex: 1}}>
          <RTCView
            streamURL={stream.toURL()}
            style={styles.fullScreenVideo}
            objectFit="cover"
          />
          {isPaused && (
            <View style={styles.pausedOverlay}>
              <Text style={styles.pausedText}>PAUSED</Text>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUNDCOLOR,
  },
  fullScreenVideo: {flex: 1},
  pausedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  pausedText: {
    fontSize: FONTS.FONTSIZE.MEDIUM,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    color: COLORS.PRIMARYWHITE,
  },
  centered: {flex: 1, alignItems: 'center', justifyContent: 'center'},
});
