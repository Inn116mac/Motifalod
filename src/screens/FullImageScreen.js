import {
  View,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import React, {useState} from 'react';
import COLORS from '../theme/Color';
import {heightPercentageToDP} from 'react-native-responsive-screen';
import {IMAGE_URL} from '../connection/Config';
import {FontAwesome6} from "@react-native-vector-icons/fontawesome6";
import {useNavigation} from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import Offline from '../components/root/Offline';
import {useNetworkStatus} from '../connection/UseNetworkStatus';
import CustomHeader from '../components/root/CustomHeader';
import {downloadFile} from '../utils/CustomDowenload';
import ButtonComponent from '../components/root/ButtonComponent';
const FullImageScreen = ({route}) => {
  const {eventName} = route?.params;
  const navigation = useNavigation();

  const [downloadProgress, setDownloadProgress] = useState({});

  const {isConnected, networkLoading} = useNetworkStatus();

  const imageUri = `${IMAGE_URL}${route?.params?.image}`;

  const handleDownload = (url, fileId) => {
    downloadFile(url, fileId, setDownloadProgress);
  };

  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(true);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.BACKGROUNDCOLOR,
      }}>
      <CustomHeader
        leftIcon={
          <FontAwesome6 name="angle-left" iconStyle='solid' size={26} color={COLORS.LABELCOLOR} />
        }
        leftOnPress={() => navigation.goBack()}
        title={eventName ? eventName : null}
      />

      {isConnected ? (
        <>
          {loading && (
            <ActivityIndicator
              size="large"
              color={COLORS.TITLECOLOR}
              style={styles.loadingIndicator}
            />
          )}
          <View style={styles.container}>
            <FastImage
              onLoadEnd={() => setLoading(false)}
              onError={() => {
                setHasError(true);
                setLoading(false);
              }}
              source={
                hasError
                  ? require('../assets/images/noimage.png')
                  : {uri: IMAGE_URL + route?.params?.image}
              }
              resizeMode="contain"
              style={styles.image}
            />
          </View>
          {route?.params?.image === null || hasError ? null : (
            <View style={{alignItems: 'center'}}>
              <ButtonComponent
                width={'50%'}
                title={
                  downloadProgress[imageUri] > 0
                    ? `Downloading: ${Math.round(
                        downloadProgress[imageUri] * 100,
                      )}%`
                    : 'Download'
                }
                disabled={downloadProgress[imageUri] > 0}
                onPress={() => handleDownload(imageUri, imageUri)}
              />
            </View>
          )}
        </>
      ) : (
        <Offline />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    height: '100%',
    width: '100%',
    borderRadius: 12,
  },
  container: {
    flex: 1,
    padding: heightPercentageToDP(2),
    overflow: 'hidden',
  },
  loadingIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{translateX: -25}, {translateY: -25}],
  },
});

export default FullImageScreen;
