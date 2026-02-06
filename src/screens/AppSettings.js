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
import Loader from '../components/root/Loader';

const AppSettings = () => {
  const navigation = useNavigation();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.BACKGROUNDCOLOR,
    },
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: 14,
    },
    sectionHeader: {
      fontSize: FONTS.FONTSIZE.EXTRASMALL,
      fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
      color: COLORS.TITLECOLOR,
      marginBottom: 10,
      paddingBottom: 6,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.INPUTBORDER,
      backgroundColor: COLORS.grey200,
      paddingHorizontal: 10,
      paddingTop: 8,
    },
    inputContainer: {
      marginBottom: 10,
    },
    rowInputContainer: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 10,
    },
    halfWidth: {
      flex: 1,
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
      textAlignVertical: 'top',
      paddingTop: 10,
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
    iconImageContainer: {
      marginTop: 10,
      alignSelf: 'flex-start',
      width: 100,
      height: 100,
      position: 'relative',
    },
    iconImage: {
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
    smtpClientCard: {
      backgroundColor: COLORS.PRIMARYWHITE,
      borderRadius: 10,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: COLORS.INPUTBORDER,
    },
    smtpClientHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    smtpClientTitle: {
      fontSize: FONTS.FONTSIZE.SMALL,
      fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
      color: COLORS.TITLECOLOR,
    },
    addAccountButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: COLORS.PRIMARYWHITE,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 10,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: COLORS.LABELCOLOR,
      borderStyle: 'dashed',
    },
    addAccountButtonText: {
      fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
      fontSize: FONTS.FONTSIZE.SMALL,
      color: COLORS.LABELCOLOR,
    },
    inputWithIcon: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.PRIMARYWHITE,
      borderRadius: 8,
      height: 38,
      borderWidth: 1,
      borderColor: COLORS.INPUTBORDER,
      paddingRight: 8,
    },
    inputWithIconField: {
      flex: 1,
      paddingVertical: 0,
      fontSize: FONTS.FONTSIZE.MINI,
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      color: COLORS.PRIMARYBLACK,
      paddingHorizontal: 8,
    },
    eyeIcon: {
      padding: 4,
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [uploadedIconUrl, setUploadedIconUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);

  const [showPassword, setShowPassword] = useState({
    MailPassword: false,
    SmsAuthToken: false,
    PushNotificationServerKey: false,
    SMTPPassword: {}, // For multiple SMTP passwords
  });

  // Form data state
  const [formData, setFormData] = useState({
    SettingId: null,
    // Mail Settings
    MailHost: '',
    MailPort: '',
    MailUser: '',
    MailPassword: '',
    MailFrom: '',
    // SMS Settings
    SmsAccountSid: '',
    SmsAuthToken: '',
    SmsFrom: '',
    // Push Notification
    PushNotificationServerKey: '',
    // App Settings
    AppName: '',
    AppSortName: '',
    AppIcon: '',
    ThemeColor: '',
    TextColor: '',
    BgColor: '',
    HeaderHtml: '',
    FooterHtml: '',
    Greetings: '',
    // Contact Information
    Website: '',
    Address: '',
    AppStoreLink: '',
    PlayStoreLink: '',
    CommunityPhone: '',
    CommunityEmail: '',
    // SMTP Clients Array
    SMTPClients: [],
  });

  //   console.log(formData);

  const [errors, setErrors] = useState({});
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

  // Fetch settings on component mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setIsFetchingData(true);
        httpClient
          .get('setting/get')
          .then(response => {
            if (response.data.status) {
              const result = response.data.result;

              // Map API response to form data
              setFormData({
                SettingId: result.settingId,
                MailHost: result.mailHost || '',
                MailPort: result.mailPort || '',
                MailUser: result.mailUser || '',
                MailPassword: result.mailPassword || '',
                MailFrom: result.mailFrom || '',
                SmsAccountSid: result.smsAccountSid || '',
                SmsAuthToken: result.smsAuthToken || '',
                SmsFrom: result.smsFrom || '',
                PushNotificationServerKey:
                  result.pushNotificationServerKey || '',
                AppName: result.appName || '',
                AppSortName: result.appSortName || '',
                AppIcon: result.appIcon || '',
                ThemeColor: result.themeColor || '',
                TextColor: result.textColor || '',
                BgColor: result.bgColor || '',
                HeaderHtml: result.headerHtml || '',
                FooterHtml: result.footerHtml || '',
                Greetings: result.greetings || '',
                Website: result.website || '',
                Address: result.address || '',
                AppStoreLink: result.appStoreLink || '',
                PlayStoreLink: result.playStoreLink || '',
                CommunityPhone: result.communityPhone || '',
                CommunityEmail: result.communityEmail || '',
                SMTPClients: result.smtpClients || [],
              });

              if (result?.appIcon) {
                setUploadedIconUrl(result.appIcon);
              }
            } else {
              NOTIFY_MESSAGE(
                response.data.message || 'Failed to fetch settings',
              );
            }
          })
          .catch(error => {
            NOTIFY_MESSAGE(
              error?.response?.data?.message ||
                error?.message ||
                'Failed to fetch settings.',
            );
          })
          .finally(() => setIsFetchingData(false));
      } else {
        NOTIFY_MESSAGE('No internet connection.');
        setIsFetchingData(false);
      }
    });
  };

  const validateEmail = email => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhoneNumber = phone => {
    if (!phone?.trim()) return false;

    // Extract digits (keep +1 prefix if present)
    const digits = phone.replace(/[^\d+]/g, '');

    // Block empty or all zeros
    if (!digits || /^0+$/.test(digits.replace('+', ''))) return false;

    // Accept international formats:
    const length = digits.replace('+', '').length;
    return length === 10 || (length >= 11 && length <= 15);
  };

  const validateForm = () => {
    const newErrors = {};
    const errorMessages = []; // Collect for alert

    // Mail Host validation
    if (!formData.MailHost?.trim()) {
      newErrors.MailHost = 'Mail Host is required.';
      errorMessages.push('Mail Host');
    }

    // Mail Port validation
    if (!formData.MailPort?.trim()) {
      newErrors.MailPort = 'Mail Port is required.';
      errorMessages.push('Mail Port');
    } else if (isNaN(formData.MailPort)) {
      newErrors.MailPort = 'Mail Port must be a number.';
      errorMessages.push('Mail Port');
    }

    // Mail User email validation
    if (formData.MailUser?.trim() && !validateEmail(formData.MailUser)) {
      newErrors.MailUser = 'Please enter a valid email address.';
      errorMessages.push('Mail User');
    }

    // Mail From email validation
    if (formData.MailFrom?.trim() && !validateEmail(formData.MailFrom)) {
      newErrors.MailFrom = 'Please enter a valid email address.';
      errorMessages.push('Mail From');
    }

    // Community Email validation
    if (
      formData.CommunityEmail?.trim() &&
      !validateEmail(formData.CommunityEmail)
    ) {
      newErrors.CommunityEmail = 'Please enter a valid email address.';
      errorMessages.push('Community Email');
    }

    // Phone number validation
    if (
      formData.CommunityPhone?.trim() &&
      !validatePhoneNumber(formData.CommunityPhone)
    ) {
      newErrors.CommunityPhone = 'Please enter a valid phone number.';
      errorMessages.push('Community Phone');
    }

    // SMS From validation
    if (formData.SmsFrom?.trim() && !validatePhoneNumber(formData.SmsFrom)) {
      newErrors.SmsFrom = 'Please enter a valid phone number.';
      errorMessages.push('SMS From');
    }

    // App Name validation
    if (!formData.AppName?.trim()) {
      newErrors.AppName = 'App Name is required.';
      errorMessages.push('App Name');
    }

    // SMTP Clients validation
    formData.SMTPClients?.forEach((client, index) => {
      if (client.smtpMail && !validateEmail(client.smtpMail)) {
        newErrors[`SMTPMail_${index}`] = 'Please enter a valid email address.';
        errorMessages.push(`SMTP Client ${index + 1} Email`);
      }
      if (client.smtpPort && isNaN(client.smtpPort)) {
        newErrors[`SMTPPort_${index}`] = 'Port must be a number.';
        errorMessages.push(`SMTP Client ${index + 1} Port`);
      }
    });

    setErrors(newErrors);

    // Show single alert with all errors [web:12]
    if (Object.keys(newErrors).length > 0) {
      Alert.alert(
        'Validation Errors',
        `Please fix the following errors:\n• ${errorMessages.join('\n• ')}`,
        [{text: 'OK'}],
      );
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    Keyboard.dismiss();
    if (!validateForm()) {
      return;
    }

    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setIsLoading(true);
        httpClient
          .put('setting/update', formData)
          .then(response => {
            if (response.data.status) {
              NOTIFY_MESSAGE(
                response.data.message || 'Settings updated successfully',
              );
              navigation.goBack();
            } else {
              NOTIFY_MESSAGE(response.data.message || 'Update failed');
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

  const ImageSelectModal = ({visible, onClose, onSelect}) => {
    const handleSelectCamera = () => {
      ImagePicker.openCamera({
        height: 400,
        width: 400,
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
  }, [keyboardOpen, preventModalOpen]);

  const handleDeleteIcon = () => {
    setUploadedIconUrl('');
    setUploadComplete(false);
    setFormData(prev => ({...prev, AppIcon: ''}));
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
        setFormData(prev => ({...prev, AppIcon: uploadedImageUrl}));
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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // SMTP Clients handlers
  const addSMTPClient = () => {
    setFormData(prev => ({
      ...prev,
      SMTPClients: [
        ...prev.SMTPClients,
        {
          id: 0,
          smtpMail: '',
          smtpHost: '',
          smtpPort: '',
          smtpPassword: '',
          smtpEncryption: 'TLS',
        },
      ],
    }));
  };

  const removeSMTPClient = index => {
    setFormData(prev => ({
      ...prev,
      SMTPClients: prev.SMTPClients.filter((_, i) => i !== index),
    }));
  };

  const updateSMTPClient = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      SMTPClients: prev.SMTPClients.map((client, i) =>
        i === index ? {...client, [field]: value} : client,
      ),
    }));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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
        title="App Settings"
      />
      {isFetchingData ? (
        <Loader />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={[styles.scrollContainer]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {/* MAIL SETTING */}
            <Text style={styles.sectionHeader}>MAIL SETTING</Text>

            <View style={styles.rowInputContainer}>
              <View style={styles.halfWidth}>
                <Text style={styles.label}>
                  Mail Host <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors?.MailHost && styles.errorInput]}
                  placeholder="smtp.gmail.com"
                  placeholderTextColor={COLORS.grey500}
                  value={formData?.MailHost}
                  onChangeText={value => handleInputChange('MailHost', value)}
                />
                {errors?.MailHost && (
                  <Text style={styles.errorText}>{errors?.MailHost}</Text>
                )}
              </View>

              <View style={styles.halfWidth}>
                <Text style={styles.label}>
                  Mail Port <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors?.MailPort && styles.errorInput]}
                  placeholder="587"
                  placeholderTextColor={COLORS.grey500}
                  value={formData?.MailPort}
                  keyboardType="numeric"
                  onChangeText={value => {
                    const digitsOnly = value.replace(/[^0-9]/g, '');

                    handleInputChange('MailPort', digitsOnly);
                  }}
                />
                {errors?.MailPort && (
                  <Text style={styles.errorText}>{errors?.MailPort}</Text>
                )}
              </View>
            </View>

            <View style={styles.rowInputContainer}>
              <View style={styles.halfWidth}>
                <Text style={styles.label}>Mail User</Text>
                <TextInput
                  style={[styles.input, errors?.MailUser && styles.errorInput]}
                  placeholder="user@gmail.com"
                  placeholderTextColor={COLORS.grey500}
                  value={formData?.MailUser}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onChangeText={value => {
                    handleInputChange('MailUser', value);
                    // Real-time validation
                    if (value.trim() && !validateEmail(value)) {
                      setErrors(prev => ({
                        ...prev,
                        MailUser: 'Invalid email format',
                      }));
                    } else {
                      setErrors(prev => {
                        const newErrors = {...prev};
                        delete newErrors.MailUser;
                        return newErrors;
                      });
                    }
                  }}
                />
                {errors?.MailUser && (
                  <Text style={styles.errorText}>{errors?.MailUser}</Text>
                )}
              </View>

              <View style={styles.halfWidth}>
                <Text style={styles.label}>Mail Password</Text>
                <View
                  style={[
                    styles.inputWithIcon,
                    errors?.MailPassword && styles.errorInput,
                  ]}>
                  <TextInput
                    style={styles.inputWithIconField}
                    placeholder="App password"
                    placeholderTextColor={COLORS.grey500}
                    value={formData?.MailPassword}
                    secureTextEntry={!showPassword.MailPassword}
                    onChangeText={value =>
                      handleInputChange('MailPassword', value)
                    }
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() =>
                      setShowPassword(prev => ({
                        ...prev,
                        MailPassword: !prev.MailPassword,
                      }))
                    }>
                    <FontAwesome
                      name={showPassword.MailPassword ? 'eye' : 'eye-slash'}
                      size={18}
                      color={COLORS.grey500}
                    />
                  </TouchableOpacity>
                </View>
                {errors?.MailPassword && (
                  <Text style={styles.errorText}>{errors?.MailPassword}</Text>
                )}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mail From</Text>
              <TextInput
                style={[styles.input, errors?.MailFrom && styles.errorInput]}
                placeholder="triadsocialcommitte@gmail.com"
                placeholderTextColor={COLORS.grey500}
                value={formData?.MailFrom}
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={value => {
                  handleInputChange('MailFrom', value);
                  // Real-time validation
                  if (value.trim() && !validateEmail(value)) {
                    setErrors(prev => ({
                      ...prev,
                      MailFrom: 'Invalid email format',
                    }));
                  } else {
                    setErrors(prev => {
                      const newErrors = {...prev};
                      delete newErrors.MailFrom;
                      return newErrors;
                    });
                  }
                }}
              />
              {errors?.MailFrom && (
                <Text style={styles.errorText}>{errors?.MailFrom}</Text>
              )}
            </View>

            {/* BULK EMAIL GMAIL ACCOUNTS */}
            <Text style={styles.sectionHeader}>BULK EMAIL GMAIL ACCOUNTS</Text>

            {formData.SMTPClients.map((client, index) => (
              <View key={index} style={styles.smtpClientCard}>
                <View style={styles.smtpClientHeader}>
                  <Text style={styles.smtpClientTitle}>
                    Gmail Account {index + 1}
                  </Text>
                  <TouchableOpacity
                    style={{}}
                    onPress={() => removeSMTPClient(index)}>
                    <MaterialDesignIcons
                      name="close-circle"
                      size={24}
                      color={COLORS.PRIMARYRED}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={[
                      styles.input,
                      errors?.[`SMTPMail_${index}`] && styles.errorInput,
                    ]}
                    placeholder="gmail@example.com"
                    placeholderTextColor={COLORS.grey500}
                    value={client.smtpMail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onChangeText={value => {
                      updateSMTPClient(index, 'smtpMail', value);
                      // Real-time validation
                      if (value.trim() && !validateEmail(value)) {
                        setErrors(prev => ({
                          ...prev,
                          [`SMTPMail_${index}`]: 'Invalid email format',
                        }));
                      } else {
                        setErrors(prev => {
                          const newErrors = {...prev};
                          delete newErrors[`SMTPMail_${index}`];
                          return newErrors;
                        });
                      }
                    }}
                  />
                  {errors?.[`SMTPMail_${index}`] && (
                    <Text style={styles.errorText}>
                      {errors?.[`SMTPMail_${index}`]}
                    </Text>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>SMTP Host</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="smtp.gmail.com"
                    placeholderTextColor={COLORS.grey500}
                    value={client.smtpHost}
                    onChangeText={value =>
                      updateSMTPClient(index, 'smtpHost', value)
                    }
                  />
                </View>

                <View style={styles.rowInputContainer}>
                  <View style={styles.halfWidth}>
                    <Text style={styles.label}>SMTP Port</Text>
                    <TextInput
                      style={[
                        styles.input,
                        errors?.[`SMTPPort_${index}`] && styles.errorInput,
                      ]}
                      placeholder="587"
                      placeholderTextColor={COLORS.grey500}
                      value={client.smtpPort?.toString()}
                      keyboardType="numeric"
                      onChangeText={value => {
                        const digitsOnly = value.replace(/[^0-9]/g, '');
                        updateSMTPClient(
                          index,
                          'smtpPort',
                          digitsOnly ? Number(digitsOnly) : '',
                        );
                        // Real-time validation
                        if (digitsOnly.trim() && isNaN(Number(digitsOnly))) {
                          setErrors(prev => ({
                            ...prev,
                            [`SMTPPort_${index}`]:
                              'Must be a valid port number',
                          }));
                        } else {
                          setErrors(prev => {
                            const newErrors = {...prev};
                            delete newErrors[`SMTPPort_${index}`];
                            return newErrors;
                          });
                        }
                      }}
                    />
                    {errors?.[`SMTPPort_${index}`] && (
                      <Text style={styles.errorText}>
                        {errors?.[`SMTPPort_${index}`]}
                      </Text>
                    )}
                  </View>

                  <View style={styles.halfWidth}>
                    <Text style={styles.label}>Encryption</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="TLS/SSL"
                      placeholderTextColor={COLORS.grey500}
                      value={client.smtpEncryption}
                      onChangeText={value =>
                        updateSMTPClient(index, 'smtpEncryption', value)
                      }
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>App Password</Text>
                  <View style={styles.inputWithIcon}>
                    <TextInput
                      style={styles.inputWithIconField}
                      placeholder="App password"
                      placeholderTextColor={COLORS.grey500}
                      value={client.smtpPassword}
                      secureTextEntry={!showPassword.SMTPPassword?.[index]}
                      onChangeText={value =>
                        updateSMTPClient(index, 'smtpPassword', value)
                      }
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() =>
                        setShowPassword(prev => ({
                          ...prev,
                          SMTPPassword: {
                            ...prev.SMTPPassword,
                            [index]: !prev.SMTPPassword?.[index],
                          },
                        }))
                      }>
                      <FontAwesome
                        name={
                          showPassword.SMTPPassword?.[index]
                            ? 'eye'
                            : 'eye-slash'
                        }
                        size={18}
                        color={COLORS.grey500}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addAccountButton}
              onPress={addSMTPClient}>
              <MaterialDesignIcons
                name="plus-circle-outline"
                size={20}
                color={COLORS.LABELCOLOR}
              />
              <Text style={styles.addAccountButtonText}>Add Gmail Account</Text>
            </TouchableOpacity>

            {/* SMS SETTING */}
            <Text style={styles.sectionHeader}>SMS SETTING</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>SMS Account SID</Text>
              <TextInput
                style={[styles.input, styles.textArea, {height: 100}]}
                placeholder="Enter SMS Account SID"
                placeholderTextColor={COLORS.grey500}
                value={formData?.SmsAccountSid}
                multiline
                numberOfLines={4}
                onChangeText={value =>
                  handleInputChange('SmsAccountSid', value)
                }
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>SMS Auth Token</Text>
              <TextInput
                style={[styles.input, styles.textArea, {height: 100}]}
                placeholder="Enter SMS Auth Token"
                placeholderTextColor={COLORS.grey500}
                value={formData?.SmsAuthToken}
                multiline
                numberOfLines={4}
                onChangeText={value => handleInputChange('SmsAuthToken', value)}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>SMS From</Text>
              <TextInput
                style={[styles.input, errors?.SmsFrom && styles.errorInput]}
                placeholder="+1 (xxx) xxx-xxxx"
                placeholderTextColor={COLORS.grey500}
                value={formData?.SmsFrom}
                keyboardType="phone-pad"
                maxLength={17}
                onChangeText={value => {
                  const cleanValue = value.replace(/[^\d+\s()-]/g, '');
                  handleInputChange('SmsFrom', cleanValue);
                  if (cleanValue.trim() && !validatePhoneNumber(cleanValue)) {
                    setErrors(prev => ({
                      ...prev,
                      SmsFrom: 'Enter valid phone number',
                    }));
                  } else {
                    setErrors(prev => {
                      const newErrors = {...prev};
                      delete newErrors.SmsFrom;
                      return newErrors;
                    });
                  }
                }}
              />
              {errors?.SmsFrom && (
                <Text style={styles.errorText}>{errors?.SmsFrom}</Text>
              )}
            </View>

            {/* PUSH NOTIFICATION SETTING */}
            <Text style={styles.sectionHeader}>PUSH NOTIFICATION SETTING</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Server Key</Text>
              <TextInput
                style={[styles.input, styles.textArea, {height: 100}]}
                placeholder="Enter Firebase Server Key"
                placeholderTextColor={COLORS.grey500}
                value={formData?.PushNotificationServerKey}
                multiline
                numberOfLines={4}
                onChangeText={value =>
                  handleInputChange('PushNotificationServerKey', value)
                }
              />
            </View>

            {/* APP SETTING */}
            <Text style={styles.sectionHeader}>APP SETTING</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                App Name <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors?.AppName && styles.errorInput]}
                placeholder="InnGenius Community"
                placeholderTextColor={COLORS.grey500}
                value={formData?.AppName}
                onChangeText={value => handleInputChange('AppName', value)}
              />
              {errors?.AppName && (
                <Text style={styles.errorText}>{errors?.AppName}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>App Short Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Community"
                placeholderTextColor={COLORS.grey500}
                value={formData?.AppSortName}
                onChangeText={value => handleInputChange('AppSortName', value)}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>App Icon</Text>
              <TouchableOpacity
                style={styles.uploadButton}
                disabled={isUploading}
                onPress={handleUploadPress}>
                <MaterialDesignIcons
                  name="upload"
                  size={20}
                  color={COLORS.PRIMARYWHITE}
                />
                <Text style={styles.uploadButtonText}>Choose Icon</Text>
              </TouchableOpacity>

              {uploadProgress > 0 && isUploading && (
                <View style={styles.progressContainer}>
                  <Text style={styles.progressText}>
                    Uploading: {uploadProgress}%
                  </Text>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {width: `${uploadProgress}%`},
                      ]}
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
                  <Text style={styles.uploadCompleteText}>
                    Upload complete!
                  </Text>
                </View>
              )}

              {uploadedIconUrl && (
                <View style={styles.iconImageContainer}>
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
                      style={styles.iconImage}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteImageButton}
                    onPress={handleDeleteIcon}>
                    <MaterialDesignIcons
                      name="close-circle"
                      size={28}
                      color={COLORS.PRIMARYRED}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Header HTML</Text>
              <TextInput
                style={[styles.input, styles.textArea, {height: 100}]}
                placeholder="Header HTML"
                placeholderTextColor={COLORS.grey500}
                value={formData?.HeaderHtml}
                multiline
                numberOfLines={4}
                onChangeText={value => handleInputChange('HeaderHtml', value)}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Footer HTML</Text>
              <TextInput
                style={[styles.input, styles.textArea, {height: 100}]}
                placeholder="Footer HTML"
                placeholderTextColor={COLORS.grey500}
                value={formData?.FooterHtml}
                multiline
                numberOfLines={4}
                onChangeText={value => handleInputChange('FooterHtml', value)}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Greetings Message</Text>
              <TextInput
                style={[styles.input, styles.textArea, {height: 100}]}
                placeholder="Welcome message for app users"
                placeholderTextColor={COLORS.grey500}
                value={formData?.Greetings}
                multiline
                numberOfLines={4}
                onChangeText={value => handleInputChange('Greetings', value)}
              />
            </View>

            {/* APP STORE LINKS */}
            <Text style={styles.sectionHeader}>APP STORE LINKS</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Play Store URL</Text>
              <TextInput
                style={[styles.input, styles.textArea, {height: 100}]}
                placeholder="https://play.google.com/store/apps/details?id="
                placeholderTextColor={COLORS.grey500}
                value={formData?.PlayStoreLink}
                multiline
                numberOfLines={4}
                onChangeText={value =>
                  handleInputChange('PlayStoreLink', value)
                }
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>App Store URL</Text>
              <TextInput
                style={[styles.input, styles.textArea, {height: 100}]}
                placeholder="https://apps.apple.com/app/"
                placeholderTextColor={COLORS.grey500}
                value={formData?.AppStoreLink}
                multiline
                numberOfLines={4}
                onChangeText={value => handleInputChange('AppStoreLink', value)}
              />
            </View>

            {/* CONTACT INFORMATION */}
            <Text style={styles.sectionHeader}>CONTACT INFORMATION</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={[styles.input, styles.textArea, {height: 100}]}
                placeholder="Enter complete address"
                placeholderTextColor={COLORS.grey500}
                value={formData?.Address}
                multiline
                numberOfLines={4}
                onChangeText={value => handleInputChange('Address', value)}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={[
                  styles.input,
                  errors?.CommunityPhone && styles.errorInput,
                ]}
                placeholder="+1 (xxx) xxx-xxxx"
                placeholderTextColor={COLORS.grey500}
                value={formData?.CommunityPhone}
                keyboardType="phone-pad"
                maxLength={17}
                onChangeText={value => {
                  const cleanValue = value.replace(/[^\d+\s()-]/g, '');
                  handleInputChange('CommunityPhone', cleanValue);
                  if (cleanValue.trim() && !validatePhoneNumber(cleanValue)) {
                    setErrors(prev => ({
                      ...prev,
                      CommunityPhone: 'Enter valid phone number',
                    }));
                  } else {
                    setErrors(prev => {
                      const newErrors = {...prev};
                      delete newErrors.CommunityPhone;
                      return newErrors;
                    });
                  }
                }}
              />
              {errors?.CommunityPhone && (
                <Text style={styles.errorText}>{errors?.CommunityPhone}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  errors?.CommunityEmail && styles.errorInput,
                ]}
                placeholder="contact@example.com"
                placeholderTextColor={COLORS.grey500}
                value={formData?.CommunityEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={value => {
                  handleInputChange('CommunityEmail', value);
                  // Real-time validation
                  if (value.trim() && !validateEmail(value)) {
                    setErrors(prev => ({
                      ...prev,
                      CommunityEmail: 'Invalid email format',
                    }));
                  } else {
                    setErrors(prev => {
                      const newErrors = {...prev};
                      delete newErrors.CommunityEmail;
                      return newErrors;
                    });
                  }
                }}
              />
              {errors?.CommunityEmail && (
                <Text style={styles.errorText}>{errors?.CommunityEmail}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Website</Text>
              <TextInput
                style={styles.input}
                placeholder="https://example.com"
                placeholderTextColor={COLORS.grey500}
                value={formData?.Website}
                onChangeText={value => handleInputChange('Website', value)}
              />
            </View>

            {/* Bottom spacing */}
            <View style={{height: 20}} />
          </ScrollView>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 20,
              margin: 10,
              paddingBottom: keyboardOpen ? 30 : 0,
            }}>
            <ButtonComponent
              title={isLoading ? 'Saving...' : 'Save All Settings'}
              onPress={handleSubmit}
              disabled={isLoading || isUploading}
            />
          </View>
        </>
      )}

      <ImageSelectModal
        visible={imageModalVisible}
        onClose={() => setImageModalVisible(false)}
        onSelect={handleFileUpload}
      />
    </KeyboardAvoidingView>
  );
};

export default AppSettings;
