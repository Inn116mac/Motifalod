import {PermissionsAndroid, Alert, Platform} from 'react-native';
import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';

export const checkStoragePermission = async () => {
  if (Platform.OS === 'android') {
    if (Platform.Version < 29) {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      );

      if (granted) return true;

      const status = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      );

      if (status === PermissionsAndroid.RESULTS.GRANTED) return true;

      throw new Error('Storage permission not granted');
    }
  }
  return true;
};

const downloadFileWithNoTimeout = async options => {
  return RNFS.downloadFile(options).promise;
};

export const getFilenameFromUrl = url => {
  if (!url) return null;

  const normalizedUrl = url.replace(/\\/g, '/');

  const trimmedUrl = normalizedUrl.replace(/\/+$/, '');

  const parts = trimmedUrl.split('/');

  const filename = parts.pop();

  return filename || null;
};

export const generateUniqueFilename = async filePath => {
  let newFilePath = filePath;
  let counter = 1;

  while (await RNFS.exists(newFilePath)) {
    const fileName = newFilePath.split('/').pop();

    const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    const fileExt = fileName.split('.').pop();

    const baseName = fileNameWithoutExt.replace(/\(\d+\)$/, '');

    const newFileName = `${baseName}(${counter}).${fileExt}`;

    newFilePath = newFilePath.replace(fileName, newFileName);

    counter++;
  }

  return newFilePath;
};

export const downloadFile = async (url, fileId, setDownloadProgress) => {
  if (!url) {
    Alert.alert('Invalid URL', 'No URL provided for download.');
    return;
  }

  try {
    const hasPermission = await checkStoragePermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission denied',
        'Cannot download file without storage permission.',
      );
      return;
    }

    let fileName = getFilenameFromUrl(url);

    const downloadDir =
      Platform.OS === 'ios'
        ? RNFS.DocumentDirectoryPath
        : RNFS.DownloadDirectoryPath;

    const downloadDest = `${downloadDir}/${fileName}`;

    const dirExists = await RNFS.exists(downloadDir);
    if (!dirExists) {
      await RNFS.mkdir(downloadDir);
    }

    const uniqueFileDest = await generateUniqueFilename(downloadDest);

    await startDownload(url, uniqueFileDest, fileId, setDownloadProgress);
  } catch (error) {
    Alert.alert('Download Error', error.message || 'Something went wrong.');
  }
};

const startDownload = async (
  url,
  downloadDest,
  fileId,
  setDownloadProgress,
) => {
  const options = {
    fromUrl: url,
    toFile: downloadDest,
    background: true,
    begin: () => {
      setDownloadProgress(prev => ({
        ...prev,
        [fileId]: 0,
      }));
    },
    progress: res => {
      if (res.contentLength > 0) {
        const progressValue = res.bytesWritten / res.contentLength;
        setDownloadProgress(prev => ({
          ...prev,
          [fileId]: progressValue,
        }));
      }
    },
    progressDivider: 1,
  };

  try {
    const result = await downloadFileWithNoTimeout(options);

    if (result.statusCode === 200) {
      // const fileName = downloadDest.split('/').pop();
      // showDownloadNotification(downloadDest, fileName);
      // if (Platform.OS === 'ios') {
      //   await Share.open({url: 'file://' + downloadDest});
      // } else {
      // Alert.alert('Success', `File downloaded successfully.`);
      Alert.alert(
        'Success',
        'File downloaded successfully. Do you want to open it?',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Open',
            onPress: () => {
              FileViewer.open(downloadDest).catch(error => {
                Alert.alert('Error', 'Cannot open the file.');
              });
            },
          },
        ],
      );
    } else {
      Alert.alert('Failed', `Failed to download file.`);
    }
  } catch (error) {
    Alert.alert('Error', `An error occurred during download.`);
  } finally {
    setDownloadProgress(prev => ({
      ...prev,
      [fileId]: 0,
    }));
  }
};
