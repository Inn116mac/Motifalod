import React, {useState} from 'react';
import {View, StyleSheet, useWindowDimensions} from 'react-native';
import {WebView} from 'react-native-webview';
import {downloadFile} from '../utils/CustomDowenload';
import COLORS from '../theme/Color';
import ButtonComponent from '../components/root/ButtonComponent';
import CustomHeader from '../components/root/CustomHeader';
import {FontAwesome6} from "@react-native-vector-icons/fontawesome6";
import {useNavigation} from '@react-navigation/native';

const FileViewer = ({route}) => {
  const {fileUrl} = route.params;
  const {width, height} = useWindowDimensions();

  const navigation = useNavigation();
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const sourceUri = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(
    fileUrl,
  )}`;

  const handleDownload = async () => {
    const fileId = 'abc123';
    setDownloadLoading(true);
    await downloadFile(fileUrl, fileId, setDownloadProgress);
    setDownloadLoading(false);
  };

  // const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(
  //   fileUrl,
  // )}&embedded=true`;

  return (
    <View style={styles.container}>
      <CustomHeader
        leftIcon={
          <FontAwesome6 name="angle-left" iconStyle='solid' size={26} color={COLORS.LABELCOLOR} />
        }
        leftOnPress={() => navigation.goBack()}
      />
      <WebView
        source={{uri: sourceUri}}
        style={{
          flex: 1,
          width: width,
          height: height - 100,
        }}
        startInLoadingState={true}
        scalesPageToFit={true}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      />
      <View style={styles.buttonContainer}>
        <ButtonComponent
          disabled={downloadLoading}
          title={downloadLoading ? 'Downloading file...' : 'Download File'}
          onPress={handleDownload}
          paddingVertical={12}
          borderRadius={10}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUNDCOLOR,
  },
  buttonContainer: {
    padding: 15,
  },
});

export default FileViewer;
