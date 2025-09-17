import React, {useEffect, useRef, useState} from 'react';
import {View, ActivityIndicator} from 'react-native';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import Video from 'react-native-video';
import {heightPercentageToDP} from 'react-native-responsive-screen';
import COLORS from '../theme/Color';
import {useNavigation} from '@react-navigation/native';
import {IMAGE_URL} from '../connection/Config';
import Offline from '../components/root/Offline';
import CustomHeader from '../components/root/CustomHeader';
import {useNetworkStatus} from '../connection/UseNetworkStatus';

const VideoGalleryVideoScreen = ({route}) => {
  const navigation = useNavigation();
  const player = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isBuffering, setIsBuffering] = useState(false);

  useEffect(() => {
    return () => {
      if (player.current) {
        player.current.seek(0);
        player.current.pause();
      }
    };
  }, []);

  const {isConnected} = useNetworkStatus();

  const showLoader = isLoading || isBuffering;

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
          <FontAwesome6 name="angle-left" size={26} color={COLORS.LABELCOLOR} />
        }
      />

      {isConnected ? (
        <View
          style={{
            flex: 1,
            padding: heightPercentageToDP(2),
          }}>
          <Video
            source={{uri: IMAGE_URL + route?.params?.videoData}}
            controls={true}
            resizeMode="cover"
            ref={player}
            onLoad={() => {
              setIsLoading(false);
            }}
            onBuffer={buffer => {
              setIsBuffering(buffer.isBuffering);
            }}
            playInBackground={false}
            playWhenInactive={false}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
            }}
          />
          {showLoader && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <ActivityIndicator size="large" color={COLORS.TITLECOLOR} />
            </View>
          )}
        </View>
      ) : (
        <Offline />
      )}
    </View>
  );
};

export default VideoGalleryVideoScreen;
