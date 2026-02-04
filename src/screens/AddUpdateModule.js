import {
  Text,
  StyleSheet,
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableOpacity,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  Switch,
} from 'react-native';
import React, {useCallback, useEffect, useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import COLORS from '../theme/Color';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import CustomHeader from '../components/root/CustomHeader';
import FONTS from '../theme/Fonts';
import httpClient from '../connection/httpClient';
import {NOTIFY_MESSAGE} from '../constant/Module';
import NetInfo from '@react-native-community/netinfo';
import ButtonComponent from '../components/root/ButtonComponent';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import FastImage from 'react-native-fast-image';
import ImagePicker from 'react-native-image-crop-picker';
import {FontAwesome} from '@react-native-vector-icons/fontawesome';
import {IMAGE_URL} from '../connection/Config';
import {Dropdown} from 'react-native-element-dropdown';

const AddUpdateModule = ({route}) => {
  const navigation = useNavigation();
  const {isEdit, editItem} = route?.params?.data || {};

  const styles = StyleSheet.create({
    dropdown: {
      height: 38,
      borderWidth: 1,
      borderRadius: 8,
      backgroundColor: COLORS.PRIMARYWHITE,
      paddingHorizontal: 10,
      justifyContent: 'center',
      borderColor: COLORS.INPUTBORDER,
    },
    placeholderStyle: {
      fontSize: FONTS.FONTSIZE.MINI,
      color: COLORS.grey500,
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
    },
    selectedTextStyle: {
      fontSize: FONTS.FONTSIZE.MINI,
      color: COLORS.PRIMARYBLACK,
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
    },
    itemContainer: {
      paddingVertical: 2,
      paddingHorizontal: 10,
    },
    itemText: {
      color: COLORS.PRIMARYBLACK,
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      fontSize: FONTS.FONTSIZE.SMALL,
    },
    dropdownError: {
      borderColor: COLORS.PRIMARYRED,
    },
    container: {
      flex: 1,
      backgroundColor: COLORS.BACKGROUNDCOLOR,
    },
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    inputContainer: {
      marginBottom: 8,
    },
    label: {
      fontSize: FONTS.FONTSIZE.SMALL,
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
      color: COLORS.TITLECOLOR,
      marginBottom: 6,
    },
    requiredStar: {
      color: COLORS.PRIMARYRED,
    },
    input: {
      backgroundColor: COLORS.PRIMARYWHITE,
      borderRadius: 8,
      height: 38,
      paddingVertical: 0,
      fontSize: FONTS.FONTSIZE.MINI,
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      color: COLORS.PRIMARYBLACK,
      borderWidth: 1,
      borderColor: COLORS.INPUTBORDER,
      paddingHorizontal: 8,
    },
    errorInput: {
      borderColor: COLORS.PRIMARYRED,
    },
    errorText: {
      color: COLORS.PRIMARYRED,
      fontSize: FONTS.FONTSIZE.SEMIMINI,
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      marginTop: 4,
    },
    textArea: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    uploadButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: COLORS.LABELCOLOR,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 10,
      marginBottom: 10,
      width: '50%',
    },
    uploadButtonText: {
      fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
      fontSize: FONTS.FONTSIZE.SMALL,
      color: COLORS.PRIMARYWHITE,
    },
    progressContainer: {
      marginTop: 10,
    },
    progressText: {
      fontSize: FONTS.FONTSIZE.SMALL,
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
      color: COLORS.TITLECOLOR,
      marginBottom: 5,
    },
    progressBar: {
      height: 8,
      backgroundColor: '#e0e0e0',
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: COLORS.LABELCOLOR,
      borderRadius: 4,
    },
    uploadCompleteContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 10,
    },
    uploadCompleteText: {
      fontSize: FONTS.FONTSIZE.SMALL,
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
      color: COLORS.LABELCOLOR,
    },
    receiptImageContainer: {
      marginTop: 10,
      alignSelf: 'flex-start',
      width: 100,
      height: 100,
      position: 'relative',
    },
    receiptImage: {
      width: 100,
      height: 100,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: COLORS.TABLEBORDER,
    },
    deleteImageButton: {
      position: 'absolute',
      top: -8,
      right: -8,
      backgroundColor: COLORS.PRIMARYWHITE,
      borderRadius: 16,
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.3,
      shadowRadius: 3.84,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      width: '100%',
      backgroundColor: COLORS.PRIMARYWHITE,
      borderRadius: 10,
    },
    buttonRow: {
      flexDirection: 'row',
    },
    roundButton: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#007bff',
      justifyContent: 'center',
      alignItems: 'center',
      margin: 10,
    },
    switchContainer: {
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: COLORS.PRIMARYWHITE,
      borderRadius: 10,
      paddingHorizontal: 4,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: COLORS.INPUTBORDER,
    },
  });
  const dropDownData = [
    {label: 'Detail Layout', value: '1'},
    {label: 'List Layout', value: '2'},
    {label: 'Single Collapse Layout', value: '3'},
    {label: 'Multi Collapse Layout', value: '4'},
    {label: 'Table Layout', value: '5'},
    {label: 'Profile Layout', value: '6'},
    {label: 'Order View Layout', value: '7'},
    {label: 'Table with Group', value: '8'},
  ];

  const [isLoading, setIsLoading] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [uploadedIconUrl, setUploadedIconUrl] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    layout: '',
    icon: '',
    mobileVisible: false,
    isForm: false,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit && editItem) {
      setFormData({
        moduleId: editItem.moduleId || 0,
        name: editItem.name || '',
        layout: editItem.layout || '',
        icon: editItem.icon || '',
        mobileVisible:
          editItem?.isMobileDashboard == '1' ||
          editItem?.isMobileDashboard == true ||
          editItem?.mobileVisible
            ? true
            : false,
        isForm: editItem.isForm || false,
      });
      setUploadedIconUrl(editItem.icon || '');
    }
  }, [isEdit, editItem]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required.';
    }
    if (!formData.layout) {
      newErrors.layout = 'Layout is required.';
    }
    if (!formData.icon.trim() && !uploadedIconUrl) {
      newErrors.icon = 'Icon is required.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    Keyboard.dismiss();
    if (!validateForm()) {
      return;
    }

    const apiCall = isEdit
      ? httpClient.put('module/name/update', formData)
      : httpClient.post('module/create', formData);

    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setIsLoading(true);
        apiCall
          .then(response => {
            if (response.data.status) {
              NOTIFY_MESSAGE(
                response.data.message ||
                  `Module ${isEdit ? 'updated' : 'added'} successfully`,
              );
              navigation.goBack();
            } else {
              NOTIFY_MESSAGE(response.data.message || 'Operation failed');
            }
          })
          .catch(error => {
            NOTIFY_MESSAGE(
              error?.response?.data?.message ||
                error?.message ||
                'Something went wrong.',
            );
          })
          .finally(() => setIsLoading(false));
      } else {
        NOTIFY_MESSAGE('No internet connection.');
      }
    });
  };

  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [preventModalOpen, setPreventModalOpen] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardOpen(true),
    );
    const hide = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardOpen(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const ImageSelectModal = ({visible, onClose, onSelect}) => {
    const handleSelectCamera = () => {
      ImagePicker.openCamera({
        height: 400,
        width: 300,
      })
        .then(response => {
          const fileSizeInMB = response?.size / (1024 * 1024);

          if (fileSizeInMB > 30) {
            Alert.alert(
              'Invalid File Size',
              'File size cannot be greater than 30MB. Please choose a smaller file.',
            );
          } else {
            onSelect(response);
            onClose();
          }
        })
        .catch(err => {
          if (err.code !== 'E_PICKER_CANCELLED') {
            NOTIFY_MESSAGE(err?.message || 'Something went wrong');
          }
        });
    };

    const handleSelectGallery = () => {
      ImagePicker.openPicker({
        mediaType: 'photo',
        multiple: false,
      })
        .then(response => {
          const fileSizeInMB = response?.size / (1024 * 1024);
          if (fileSizeInMB > 30) {
            Alert.alert(
              'Invalid File Size',
              'File size cannot be greater than 30MB.',
            );
          } else {
            onSelect(response);
            onClose();
          }
        })
        .catch(err => {
          if (err.code !== 'E_PICKER_CANCELLED') {
            NOTIFY_MESSAGE(err?.message || 'Something went wrong');
          }
        });
    };

    return (
      <Modal transparent visible={visible} animationType="slide">
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.roundButton}
                  onPress={handleSelectCamera}>
                  <FontAwesome name="camera" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.roundButton}
                  onPress={handleSelectGallery}>
                  <FontAwesome name="image" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.roundButton} onPress={onClose}>
                  <FontAwesome name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  const handleUploadPress = useCallback(() => {
    if (keyboardOpen && !preventModalOpen) {
      setPreventModalOpen(true);
      Keyboard.dismiss();

      const timeOut = setTimeout(() => {
        setImageModalVisible(true);
        setPreventModalOpen(false);
        clearTimeout(timeOut);
      }, 500);
      return;
    }
    setImageModalVisible(true);
  }, [keyboardOpen, preventModalOpen, formData]);

  const handleDeleteReceipt = () => {
    setUploadedIconUrl('');
    setUploadComplete(false);
    setFormData(prev => ({...prev, icon: ''}));
  };

  const handleFileUpload = async file => {
    const fileUri =
      Platform.OS == 'ios' ? file?.path?.replace('file://', '') : file?.path;
    const mimeType = file.mime;
    if (!mimeType) {
      Alert.alert('Error', 'File does not have a valid MIME type.');
      return;
    }
    const formDataUpload = new FormData();
    const fileObj = {
      uri: fileUri,
      name: fileUri.split('/').pop(),
      type: mimeType,
    };
    formDataUpload.append('file', fileObj);
    try {
      setIsUploading(true);
      const response = await httpClient.post(
        'file/single/upload?location=content',
        formDataUpload,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: progressEvent => {
            const total = progressEvent.total;
            const current = progressEvent.loaded;
            const percentage = Math.floor((current / total) * 100);
            setUploadProgress(percentage);
          },
        },
      );
      if (response.data.status) {
        let uploadedImageUrl = '';
        if (Array.isArray(response.data.result)) {
          uploadedImageUrl = response.data.result[0]?.imagePath || '';
        } else if (typeof response.data.result === 'object') {
          uploadedImageUrl = response.data.result?.imagePath || '';
        }

        setUploadedIconUrl(uploadedImageUrl);
        setFormData(prev => ({...prev, icon: uploadedImageUrl}));
        if (errors?.icon) {
          setErrors(prev => {
            const newErrors = {...prev};
            delete newErrors?.icon;
            return newErrors;
          });
        }
        setUploadComplete(true);
        NOTIFY_MESSAGE(response?.data?.message || 'Icon uploaded successfully');
        setTimeout(() => {
          setUploadComplete(false);
        }, 2000);
      } else {
        NOTIFY_MESSAGE(response?.data?.message || 'Upload failed');
      }
    } catch (err) {
      NOTIFY_MESSAGE(err?.message || 'Something went wrong');
    } finally {
      setUploadProgress(0);
      setIsUploading(false);
    }
  };
  const toggleSwitch = (field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
      <CustomHeader
        leftOnPress={() => navigation.goBack()}
        leftIcon={
          <FontAwesome6
            name="angle-left"
            size={26}
            color={COLORS.LABELCOLOR}
            iconStyle="solid"
          />
        }
        title={isEdit ? 'Edit Module' : 'Add Module'}
      />

      <>
        <ScrollView
          contentContainerStyle={[styles.scrollContainer]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Module Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Name{' '}
              <Text
                style={{
                  fontSize: FONTS.FONTSIZE.SMALL,
                  fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                  color: errors?.name ? COLORS.PRIMARYRED : COLORS.TITLECOLOR,
                }}>
                *
              </Text>
            </Text>
            <TextInput
              style={[styles.input, errors?.name && styles.errorInput]}
              placeholder="Module Name"
              placeholderTextColor={COLORS.grey500}
              value={formData?.name}
              onChangeText={value => {
                setFormData(prev => ({...prev, name: value}));
                if (errors?.name) {
                  setErrors(prev => {
                    const newErrors = {...prev};
                    delete newErrors?.name;
                    return newErrors;
                  });
                }
              }}
            />
            {errors?.name && (
              <Text style={styles.errorText}>{errors?.name}</Text>
            )}
          </View>

          {/* Layout */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Layout{' '}
              <Text
                style={{
                  fontSize: FONTS.FONTSIZE.SMALL,
                  fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                  color: errors?.layout ? COLORS.PRIMARYRED : COLORS.TITLECOLOR,
                }}>
                *
              </Text>
            </Text>
            <Dropdown
              onFocus={() => {
                Keyboard.dismiss();
              }}
              style={[styles.dropdown, errors?.layout && styles.dropdownError]}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              inputSearchStyle={{
                color: COLORS.PRIMARYBLACK,
                fontSize: FONTS.FONTSIZE.EXTRASMALL,
              }}
              data={
                dropDownData.length > 0
                  ? dropDownData
                  : [{label: 'No Data Available', value: null}]
              }
              labelField="label"
              valueField="value"
              value={formData?.layout}
              autoScroll={false}
              onChange={item => {
                setFormData(prev => ({...prev, layout: item?.value}));
                if (errors?.layout) {
                  setErrors(prev => {
                    const newErrors = {...prev};
                    delete newErrors?.layout;
                    return newErrors;
                  });
                }
              }}
              itemTextStyle={styles.itemText}
              placeholder="Select Layout"
              maxHeight={200}
              renderItem={item => (
                <View style={styles.itemContainer}>
                  <Text style={styles.itemText}>{item.label}</Text>
                </View>
              )}
            />
            {errors?.layout && (
              <Text style={styles.errorText}>{errors?.layout}</Text>
            )}
          </View>

          {/* Icon */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Icon{' '}
              <Text
                style={{
                  fontSize: FONTS.FONTSIZE.SMALL,
                  fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                  color: errors.icon ? COLORS.PRIMARYRED : COLORS.TITLECOLOR,
                }}>
                *
              </Text>
            </Text>
            <TouchableOpacity
              style={styles.uploadButton}
              disabled={isUploading}
              onPress={() => {
                handleUploadPress();
              }}>
              <MaterialDesignIcons
                name="upload"
                size={20}
                color={COLORS.PRIMARYWHITE}
              />
              <Text style={styles.uploadButtonText}>Upload Image</Text>
            </TouchableOpacity>
            {uploadProgress > 0 && isUploading && (
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>
                  Uploading: {uploadProgress}%
                </Text>
                <View style={styles.progressBar}>
                  <View
                    style={[styles.progressFill, {width: `${uploadProgress}%`}]}
                  />
                </View>
              </View>
            )}

            {uploadComplete && !isUploading && (
              <View style={styles.uploadCompleteContainer}>
                <MaterialDesignIcons
                  name="check-circle"
                  size={20}
                  color={COLORS.LABELCOLOR}
                />
                <Text style={styles.uploadCompleteText}>Upload complete!</Text>
              </View>
            )}

            {uploadedIconUrl && (
              <View style={styles.receiptImageContainer}>
                <TouchableOpacity
                  onPress={() => {
                    navigation.navigate('FullImageScreen', {
                      image: uploadedIconUrl,
                    });
                  }}>
                  <FastImage
                    source={{
                      uri: IMAGE_URL + uploadedIconUrl,
                      priority: FastImage.priority.normal,
                    }}
                    resizeMode="cover"
                    style={styles.receiptImage}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteImageButton}
                  onPress={handleDeleteReceipt}>
                  <MaterialDesignIcons
                    name="close-circle"
                    size={28}
                    color={COLORS.PRIMARYRED}
                  />
                </TouchableOpacity>
              </View>
            )}
            {errors.icon && <Text style={styles.errorText}>{errors.icon}</Text>}
          </View>

          {/* Mobile Visible Switch */}
          <View style={styles.switchContainer}>
            <Switch
              value={formData?.mobileVisible}
              trackColor={{true: COLORS.PRIMARYGREEN, false: COLORS.grey500}}
              thumbColor={COLORS.PRIMARYWHITE}
              onValueChange={value => toggleSwitch('mobileVisible', value)}
            />
            <Text
              style={{
                fontSize: FONTS.FONTSIZE.SMALL,
                fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                color: COLORS.TITLECOLOR,
                includeFontPadding: false,
              }}>
              Mobile Visible
            </Text>
          </View>

          {/* isForm Switch */}
          <View style={styles.switchContainer}>
            <Switch
              value={formData?.isForm}
              trackColor={{true: COLORS.PRIMARYGREEN, false: COLORS.grey500}}
              thumbColor={COLORS.PRIMARYWHITE}
              onValueChange={value => toggleSwitch('isForm', value)}
            />
            <Text
              style={{
                fontSize: FONTS.FONTSIZE.SMALL,
                fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                color: COLORS.TITLECOLOR,
                includeFontPadding: false,
              }}>
              Is Form
            </Text>
          </View>
        </ScrollView>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 20,
            margin: 10,
            paddingBottom: keyboardOpen && Platform.OS == 'android' ? 20 : 0,
          }}>
          <ButtonComponent
            title={isLoading ? 'Please Wait...' : isEdit ? 'Update' : 'Submit'}
            onPress={handleSubmit}
            disabled={isLoading || isUploading}
          />
        </View>

        <ImageSelectModal
          visible={imageModalVisible}
          onClose={() => setImageModalVisible(false)}
          onSelect={handleFileUpload}
        />
      </>
    </KeyboardAvoidingView>
  );
};

export default AddUpdateModule;
