import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
  TextInput,
  ScrollView,
  Modal,
  Alert,
  StyleSheet,
  TouchableWithoutFeedback,
  useWindowDimensions,
  KeyboardAvoidingView,
  Keyboard,
  Dimensions,
} from 'react-native';
import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import FONTS from '../../theme/Fonts';
import {Fontisto} from '@react-native-vector-icons/fontisto';
import {Entypo} from '@react-native-vector-icons/entypo';
import {FontAwesome} from '@react-native-vector-icons/fontawesome';
import {capitalizeFirstLetter, NOTIFY_MESSAGE} from '../../constant/Module';
import NetInfo from '@react-native-community/netinfo';
import COLORS from '../../theme/Color';
import {useIsFocused, useNavigation} from '@react-navigation/native';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import moment from 'moment';
import Video from 'react-native-video';
import ButtonComponent from './ButtonComponent';
import Loader from './Loader';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import httpClient from '../../connection/httpClient';
import NoDataFound from './NoDataFound';
import {Dropdown} from 'react-native-element-dropdown';
import {IMAGE_URL} from '../../connection/Config';
import {getFileType} from '../../utils/fileType';
import FastImage from 'react-native-fast-image';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import {
  formatPhoneToUS,
  unformatPhone,
  isPhoneField,
  isNameField,
  validateNameValue,
} from '../../constant/Module';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const AdminEdit = ({editItem, isVideoGallery, isImageGallery}) => {
  const {width} = useWindowDimensions();
  const styles = StyleSheet.create({
    dropdown: {
      height: 44,
      borderWidth: 1,
      borderRadius: 10,
      backgroundColor: COLORS.PRIMARYWHITE,
      paddingHorizontal: 10,
      justifyContent: 'center',
    },
    placeholderStyle: {
      fontSize: FONTS.FONTSIZE.SMALL,
      color: COLORS.PLACEHOLDERCOLOR,
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
    },
    selectedTextStyle: {
      fontSize: FONTS.FONTSIZE.SMALL,
      color: COLORS.PRIMARYBLACK,
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      width: width,
      backgroundColor: COLORS.PRIMARYWHITE,
      borderRadius: 10,
    },
    buttonRow: {
      flexDirection: 'row',
    },
    modalTitle: {
      fontSize: 18,
      marginBottom: 8,
    },
    button: {
      padding: 10,
      borderRadius: 5,
      backgroundColor: COLORS.TITLECOLOR,
      marginVertical: 5,
      width: '100%',
      alignItems: 'center',
    },
    buttonText: {
      color: COLORS.PRIMARYWHITE,
    },
    select_Button: {
      padding: 10,
      borderRadius: 5,
      backgroundColor: COLORS.TITLECOLOR,
      marginVertical: 5,
      width: '100%',
      alignItems: 'center',
    },
    image: {
      width: 100,
      height: 100,
      borderRadius: 10,
    },
    video: {
      width: 100,
      height: 100,
      borderRadius: 10,
      overflow: 'hidden',
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
    itemContainer: {
      paddingVertical: 2,
      paddingHorizontal: 10,
    },
    itemText: {
      color: COLORS.PRIMARYBLACK,
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      fontSize: FONTS.FONTSIZE.EXTRASMALL,
    },
  });
  const navigation = useNavigation();
  const [formData, setFormData] = useState({});
  const [datePickerVisible, setDatePickerVisible] = useState({});
  const [errors, setErrors] = useState({});
  const [modalVisible, setModalVisible] = useState({});
  const [selectedDate, setSelectedDate] = useState({});
  const [selectedTime, setSelectedTime] = useState({});
  const [timePickerVisible, setTimePickerVisible] = useState({});
  const [activeButton, setActiveButton] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadComplete, setUploadComplete] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [memberShipDetails, setMemberShipDetails] = useState([]);
  const [memberShipLoading, setMemberShipLoading] = useState(true);
  const originalMemberValues = useRef([]);

  useEffect(() => {
    getMemberShipDetails();
  }, []);

  useEffect(() => {
    if (!editItem?.content) return;
    const parsedContent = JSON.parse(editItem.content);

    if (typeof parsedContent === 'object' && parsedContent !== null) {
      Object.keys(parsedContent).forEach(key => {
        if (
          (parsedContent[key].type === 'select' ||
            parsedContent[key].type === 'section') &&
          parsedContent[key]?.values?.length > 0
        ) {
          if (
            parsedContent[key].type === 'select' &&
            (parsedContent[key].name?.toLowerCase() === 'member' ||
              parsedContent[key].name?.toLowerCase() === 'eventcoordinator')
          ) {
            originalMemberValues.current = parsedContent[key].values;
          }
        }
      });

      Object.keys(parsedContent).forEach(key => {
        const fieldConfig = parsedContent[key];

        if (
          fieldConfig.type === 'select' &&
          fieldConfig.value !== null &&
          fieldConfig?.values?.length
        ) {
          const selectedOption = fieldConfig?.values?.find(
            option => option.label === fieldConfig.value,
          );

          if (selectedOption) {
            fieldConfig.value = selectedOption.value;
          } else {
            fieldConfig.value = null;
          }
        } else if (
          fieldConfig.type === 'checkbox-group' &&
          fieldConfig.value !== null &&
          fieldConfig?.values?.length > 0
        ) {
          const selectedLabels = fieldConfig.value
            .split(',')
            .map(l => l.trim());
          const selectedOptions = fieldConfig.values.filter(option =>
            selectedLabels.includes(option.label?.trim()),
          );

          if (selectedOptions.length > 0) {
            fieldConfig.value = selectedOptions
              .map(option => option.value.toString())
              .join(',');
          } else {
            fieldConfig.value = '';
          }
        }
      });

      setFormData(parsedContent);
    }
  }, [editItem]);

  const getMemberShipDetails = () => {
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setMemberShipLoading(true);
        httpClient
          .get(`member/membershipprice`)
          .then(response => {
            if (response.data.status) {
              if (response?.data?.result?.length > 0) {
                setMemberShipDetails(response.data.result);
              } else {
                setMemberShipDetails([]);
              }
            } else {
              NOTIFY_MESSAGE(response.data.message);
            }
          })
          .catch(err => {
            setMemberShipLoading(false);
            NOTIFY_MESSAGE(err || err?.message ? 'Something Went Wrong' : null);
          })
          .finally(() => setMemberShipLoading(false));
      } else {
        NOTIFY_MESSAGE('Please check your internet connectivity');
      }
    });
  };

  const ImageSelectModal = ({
    visible,
    onClose,
    isVideoGallery,
    isImageGallery,
    onSelect,
    item,
  }) => {
    const handleSelectCamera = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs access to your camera to take photos.',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          NOTIFY_MESSAGE('Camera permission denied');
          return;
        }
      }
      launchCamera(
        {mediaType: 'photo', quality: 0.85, saveToPhotos: false},
        response => {
          if (response.didCancel) return;
          if (response.errorCode) {
            NOTIFY_MESSAGE('Something Went Wrong');
            return;
          }
          const file = response.assets?.[0];
          if (!file) return;
          const fileSizeInMB = (file.fileSize || 0) / (1024 * 1024);
          if (fileSizeInMB > 500) {
            Alert.alert(
              'Invalid File Size',
              'File size cannot be greater than 500MB. Please choose a smaller file.',
              [
                {
                  text: 'OK',
                  onPress: () =>
                    setModalVisible(prev => ({...prev, [item?.name]: true})),
                },
              ],
            );
          } else {
            onSelect(file);
            onClose();
          }
        },
      );
    };

    const handleSelectGallery = () => {
      const isMultipleAllowed = item?.multiple === 'true' || item?.multiple;
      launchImageLibrary(
        {
          mediaType: isVideoGallery ? 'video' : 'photo',
          selectionLimit: isMultipleAllowed ? 0 : 1,
          quality: 0.85,
        },
        response => {
          if (response.didCancel) return;
          if (response.errorCode) {
            NOTIFY_MESSAGE('Something Went Wrong');
            return;
          }
          const assets = response.assets || [];
          const validFiles = assets.filter(file => {
            const rawSize =
              (file.fileSize || 0) > Number.MAX_SAFE_INTEGER
                ? 0
                : file.fileSize || 0;
            const fileSizeInMB = rawSize / (1024 * 1024);
            if (fileSizeInMB > 500) {
              Alert.alert(
                'Invalid File Size',
                'File size cannot be greater than 500MB. Please choose a smaller file.',
                [
                  {
                    text: 'OK',
                    onPress: () =>
                      setModalVisible(prev => ({...prev, [item?.name]: true})),
                  },
                ],
              );
              return false;
            }
            return true;
          });
          if (validFiles.length > 0) {
            onSelect(validFiles);
            onClose();
          }
        },
      );
    };

    return (
      <Modal transparent={true} visible={visible} animationType="slide">
        <TouchableWithoutFeedback onPress={activeButton ? undefined : onClose}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.buttonRow}>
                {isImageGallery ? (
                  <TouchableOpacity
                    style={styles.roundButton}
                    onPress={handleSelectCamera}>
                    <FontAwesome name="camera" size={24} color="#fff" />
                  </TouchableOpacity>
                ) : isVideoGallery ? null : (
                  <TouchableOpacity
                    style={styles.roundButton}
                    onPress={handleSelectCamera}>
                    <FontAwesome name="camera" size={24} color="#fff" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.roundButton}
                  onPress={handleSelectGallery}>
                  <FontAwesome name="image" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roundButton, activeButton && {opacity: 0.4}]}
                  disabled={activeButton}
                  onPress={onClose}>
                  <FontAwesome name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  const handleNumberChange = (
    key,
    value,
    isRequired,
    name,
    label,
    className,
  ) => {
    const allowDecimal = className?.toLowerCase().includes('decimal');
    const nameLower = name?.toLowerCase();

    let numericValue;

    if (allowDecimal) {
      numericValue = value.replace(/[^0-9.]/g, '');
      const parts = numericValue.split('.');
      if (parts.length > 2) {
        numericValue = parts[0] + '.' + parts.slice(1).join('');
      }
      if (parts.length === 2 && parts[1].length > 2) {
        numericValue = parts[0] + '.' + parts[1].substring(0, 2);
      }
    } else {
      numericValue = value.replace(/[^0-9]/g, '');
    }

    const isPhone = isPhoneField(name);

    setFormData(prevState => ({
      ...prevState,
      [key]: {
        ...prevState[key],
        value: numericValue,
      },
    }));

    const isValueEmpty = numericValue.trim() === '';
    let isLengthInvalid = false;
    let isAllZeros = allowDecimal
      ? /^0+(\.0+)?$/.test(numericValue)
      : /^0+$/.test(numericValue);

    if (isPhone || className?.includes('phone')) {
      isLengthInvalid = numericValue.replace('.', '').length !== 10;
    } else if (
      nameLower === 'age' ||
      className?.toLowerCase()?.includes('age')
    ) {
      const ageDigits = numericValue.replace('.', '').length;
      isLengthInvalid = ageDigits < 1 || ageDigits > 3;
    } else if (
      nameLower === 'zip' ||
      className?.toLowerCase()?.includes('zip')
    ) {
      isLengthInvalid = numericValue.replace('.', '').length !== 5;
    }

    setErrors(prevErrors => {
      const updatedErrors = {...prevErrors};

      if (isRequired) {
        if (isValueEmpty) {
          updatedErrors[key] = `${label} is required.`;
        } else if (isLengthInvalid) {
          if (isPhone || className?.includes('phone')) {
            updatedErrors[key] = `${label} must be 10 digits.`;
          } else if (
            nameLower === 'age' ||
            className?.toLowerCase()?.includes('age')
          ) {
            updatedErrors[key] = `${label} must be between 1 and 3 digits.`;
          } else if (
            nameLower === 'zip' ||
            className?.toLowerCase()?.includes('zip')
          ) {
            updatedErrors[key] = `${label} must be exactly 5 digits.`;
          }
        } else if (
          isAllZeros &&
          (isPhone ||
            className?.toLowerCase()?.includes('phone') ||
            nameLower === 'age' ||
            className?.toLowerCase()?.includes('age'))
        ) {
          updatedErrors[key] = `${label} cannot be all zeros.`;
        } else {
          delete updatedErrors[key];
        }
      } else {
        if (
          !isValueEmpty &&
          (isLengthInvalid ||
            (isAllZeros &&
              (isPhone ||
                className?.toLowerCase()?.includes('phone') ||
                nameLower === 'age' ||
                className?.toLowerCase()?.includes('age'))))
        ) {
          if (isPhone || className?.toLowerCase()?.includes('phone')) {
            if (isLengthInvalid) {
              updatedErrors[key] = `${label} must be 10 digits.`;
            } else {
              updatedErrors[key] = `${label} cannot be all zeros.`;
            }
          } else if (
            nameLower === 'age' ||
            className?.toLowerCase()?.includes('age')
          ) {
            if (isLengthInvalid) {
              updatedErrors[key] = `${label} must be between 1 and 3 digits.`;
            } else {
              updatedErrors[key] = `${label} cannot be all zeros.`;
            }
          } else if (
            nameLower === 'zip' ||
            className?.toLowerCase()?.includes('zip')
          ) {
            updatedErrors[key] = `${label} must be exactly 5 digits.`;
          }
        } else {
          delete updatedErrors[key];
        }
      }

      return updatedErrors;
    });
  };

  const handleCounterChange = (
    key,
    value,
    isRequired,
    name,
    label,
    maxValue,
  ) => {
    const nameLower = name?.toLowerCase();
    const currentValue = Number(formData[key]?.value) || 0;
    if (value > 0 && maxValue > 0 && currentValue >= maxValue) {
      return;
    }
    const newValue = Math.max(0, currentValue + value);

    setFormData(prevFormData => ({
      ...prevFormData,
      [key]: {
        ...prevFormData[key],
        value: newValue,
      },
    }));

    if (isRequired) {
      let isLengthInvalid = false;

      if (
        nameLower === 'numberofguests' ||
        nameLower === 'numberofparticipants' ||
        nameLower === 'numberofkids'
      ) {
        isLengthInvalid = newValue < 1;
      } else if (nameLower === 'howmanyminutes') {
        isLengthInvalid = newValue < 1 || newValue > 60;
      }

      const hasError = newValue === 0 || isLengthInvalid;

      setErrors(prevErrors => {
        if (hasError) {
          if (newValue === 0) {
            return {...prevErrors, [key]: `${label} is required.`};
          } else {
            if (
              nameLower === 'numberofguests' ||
              nameLower === 'numberofparticipants' ||
              nameLower === 'numberofkids'
            ) {
              return {...prevErrors, [key]: `${label} must be at least 1.`};
            } else if (nameLower === 'howmanyminutes') {
              return {
                ...prevErrors,
                [key]: `${label} must be between 1 and 60 minutes.`,
              };
            }
          }
        } else {
          const updatedErrors = {...prevErrors};
          delete updatedErrors[key];
          return updatedErrors;
        }
      });
    }
  };

  const handleCheckboxSelect = (key, value, isRequired, label) => {
    setFormData(prevFormData => {
      const currentValue = prevFormData[key]?.value || '';
      const currentSelections = currentValue
        ? currentValue.split(',').filter(Boolean)
        : [];

      const stringValue = String(value);

      let updatedSelections;
      if (currentSelections.includes(stringValue)) {
        updatedSelections = currentSelections.filter(
          item => item !== stringValue,
        );
      } else {
        updatedSelections = [...currentSelections, stringValue];
      }

      const updatedValue = updatedSelections.join(',');

      if (isRequired) {
        setErrors(prevErrors => {
          if (updatedSelections.length === 0) {
            return {
              ...prevErrors,
              [key]: `${label} is required.`,
            };
          } else {
            const updatedErrors = {...prevErrors};
            delete updatedErrors[key];
            return updatedErrors;
          }
        });
      }

      return {
        ...prevFormData,
        [key]: {
          ...prevFormData[key],
          value: updatedValue,
        },
      };
    });
  };

  const onDateChange = (key, date, label, isRequired, type) => {
    if (date) {
      setSelectedDate(prev => ({
        ...prev,
        [key]: date,
      }));
      const formattedDate =
        type === 'datetime'
          ? moment(date).format('MM/DD/YYYY hh:mm A')
          : moment(date).format('MM/DD/YYYY');

      setFormData(prevState => ({
        ...prevState,
        [key]: {
          ...prevState[key],
          value: formattedDate,
        },
      }));
      setDatePickerVisible(prev => ({
        ...prev,
        [key]: false,
      }));

      if (isRequired) {
        setErrors(prevErrors => {
          const updatedErrors = {...prevErrors};
          delete updatedErrors[key];
          return updatedErrors;
        });
      }
    } else {
      setErrors(prevErrors => ({
        ...prevErrors,
        [key]: `${label} is required.`,
      }));
    }
  };

  const onTimeChange = (key, time, label, isRequired) => {
    if (time) {
      const formattedTime = moment(time).format('hh:mm A');
      setSelectedTime(prev => ({
        ...prev,
        [key]: time,
      }));

      setFormData(prevState => ({
        ...prevState,
        [key]: {
          ...prevState[key],
          value: formattedTime,
        },
      }));
      setTimePickerVisible(prev => ({
        ...prev,
        [key]: false,
      }));

      if (isRequired) {
        setErrors(prevErrors => {
          const updatedErrors = {...prevErrors};
          delete updatedErrors[key];
          return updatedErrors;
        });
      }
    } else {
      setErrors(prevErrors => ({
        ...prevErrors,
        [key]: `${label} is required.`,
      }));
    }
  };

  const handleInputChange = (key, value, isRequired, label) => {
    setFormData(prevData => ({
      ...prevData,
      [key]: {
        ...prevData[key],
        value,
      },
    }));

    const trimmed = typeof value === 'string' ? value.trim() : '';
    const hasValue = Array.isArray(value) ? value.length > 0 : trimmed !== '';

    setErrors(prevErrors => {
      const updatedErrors = {...prevErrors};

      if (isRequired && !hasValue) {
        updatedErrors[key] = `${label} is required.`;
      } else if (hasValue && isNameField(key)) {
        const nameError = validateNameValue(trimmed, label);
        if (nameError) {
          updatedErrors[key] = nameError;
        } else {
          delete updatedErrors[key];
        }
      } else {
        delete updatedErrors[key];
      }

      return updatedErrors;
    });
  };

  const handleEmail = (key, value, isRequired, label) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    setFormData(prevData => ({
      ...prevData,
      [key]: {
        ...prevData[key],
        value,
      },
    }));

    const isValidEmail = emailRegex.test(value);
    const isValueEmpty = !value.trim();

    setErrors(prevErrors => {
      const updatedErrors = {...prevErrors};

      if (isRequired) {
        if (isValueEmpty) {
          updatedErrors[key] = `${label} is required.`;
        } else if (!isValidEmail) {
          updatedErrors[key] = `${label} is invalid.`;
        } else {
          delete updatedErrors[key];
        }
      } else {
        if (!isValueEmpty && !isValidEmail) {
          updatedErrors[key] = `${label} is invalid.`;
        } else {
          delete updatedErrors[key];
        }
      }

      return updatedErrors;
    });
  };

  const handleTextArea = (key, value, label, isRequired) => {
    setFormData(prevFormData => ({
      ...prevFormData,
      [key]: {
        ...prevFormData[key],
        value,
      },
    }));

    const isEmpty = !value || value.trim() === '';

    if (isRequired) {
      if (isEmpty) {
        setErrors(prevErrors => ({
          ...prevErrors,
          [key]: `${label} is required.`,
        }));
      } else {
        setErrors(prevErrors => {
          const updatedErrors = {...prevErrors};
          delete updatedErrors[key];
          return updatedErrors;
        });
      }
    }
  };

  const handleRadioSelect = (key, value, label, isRequired) => {
    setFormData(prevState => ({
      ...prevState,
      [key]: {
        ...prevState[key],
        value,
      },
    }));

    const isEmpty = !value || value.trim() === '';

    if (isRequired) {
      if (isEmpty) {
        setErrors(prevErrors => ({
          ...prevErrors,
          [key]: `${label} is required.`,
        }));
      } else {
        setErrors(prevErrors => {
          const updatedErrors = {...prevErrors};
          delete updatedErrors[key];
          return updatedErrors;
        });
      }
    }
  };

  const handleSelectDropdown = (key, value, label, isRequired) => {
    if (key?.toLowerCase() === 'relationship') {
      const selectedMembership = memberShipDetails.find(
        item => item?.name?.toLowerCase() === value?.toLowerCase(),
      );

      const newMembershipAmount = selectedMembership
        ? String(selectedMembership?.price)
        : '0';

      const currentMembershipAmount = String(
        parseFloat(formData?.membershipamount?.value) || 0,
      );

      const prevTotalStr = formData?.totalmembershipamount?.value ?? '0';
      const prevTotal = parseFloat(prevTotalStr) || 0;

      const updateValue =
        parseFloat(newMembershipAmount) - parseFloat(currentMembershipAmount);

      const totalValue = String(prevTotal + updateValue);

      setFormData(prevState => {
        const updatedState = {
          ...prevState,
          [key]: {
            ...prevState[key],
            value,
          },
        };

        if (prevState.membershipamount) {
          updatedState.membershipamount = {
            ...prevState.membershipamount,
            value: newMembershipAmount,
          };
        }

        if (prevState.totalmembershipamount) {
          updatedState.totalmembershipamount = {
            ...prevState.totalmembershipamount,
            value: totalValue,
          };
        }

        return updatedState;
      });
    } else {
      setFormData(prevState => {
        const updatedState = {
          ...prevState,
          [key]: {
            ...prevState[key],
            value,
          },
        };
        return updatedState;
      });
    }
    if (isRequired) {
      if (!value || value === '') {
        setErrors(prevErrors => ({
          ...prevErrors,
          [key]: `${label} is required.`,
        }));
      } else {
        setErrors(prevErrors => {
          const updatedErrors = {...prevErrors};
          delete updatedErrors[key];
          return updatedErrors;
        });
      }
    }
  };

  const handleFileChange = async (
    key,
    files,
    label,
    isRequired,
    isMultiple,
  ) => {
    const validFiles = Array.isArray(files) ? files : [files];
    const isValidFiles = validFiles.length > 0;

    if (isRequired && !isValidFiles) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [key]: `${label} is required.`,
      }));
      Alert.alert('File not supported');
      return;
    } else {
      setErrors(prevErrors => {
        const updatedErrors = {...prevErrors};
        delete updatedErrors[key];
        return updatedErrors;
      });
    }

    const formData = new FormData();
    validFiles.forEach(file => {
      const rawUri = file?.uri || file?.path || '';
      const fileUri =
        Platform.OS === 'ios' ? rawUri.replace('file://', '') : rawUri;
      const mimeType = file?.type || file?.mime;

      if (!mimeType) {
        setErrors(prevErrors => ({
          ...prevErrors,
          [key]: `${label} does not have a valid MIME type.`,
        }));
        Alert.alert('File not supported');
        return;
      }

      const fileObj = {
        uri: fileUri,
        name: fileUri?.split('/')?.pop(),
        type: mimeType,
      };
      formData.append('file', fileObj);
    });

    try {
      isUploadingRef.current = true;
      setActiveButton(true);
      const response = await httpClient.post(
        'file/single/upload?location=content',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: progressEvent => {
            const total = progressEvent.total;
            const current = progressEvent.loaded;
            const percentage = Math.floor((current / total) * 100);
            setUploadProgress(prev => ({
              ...prev,
              [key]: percentage,
            }));
          },
        },
      );

      if (response.data.status) {
        let uploadedImageUrls = [];

        if (Array.isArray(response.data.result)) {
          uploadedImageUrls = response.data.result.map(item => item.imagePath);
        } else if (typeof response.data.result === 'object') {
          if (response.data.result.imagePath) {
            uploadedImageUrls = [response.data.result.imagePath];
          }
        }

        setFormData(prevState => {
          let existingValue = [];

          if (
            prevState[key]?.value &&
            prevState[key]?.value !== 'null' &&
            prevState[key]?.value !== ''
          ) {
            try {
              existingValue = JSON.parse(prevState[key].value);
              if (!Array.isArray(existingValue)) {
                existingValue = [existingValue];
              }
            } catch (error) {
              existingValue = [prevState[key].value];
            }
          }

          const updatedValue = isMultiple
            ? [...existingValue, ...uploadedImageUrls]
            : [uploadedImageUrls[0]];

          return {
            ...prevState,
            [key]: {
              ...prevState[key],
              value: JSON.stringify(updatedValue),
            },
          };
        });

        setUploadComplete(true);
      } else {
        NOTIFY_MESSAGE(response?.data?.message);
        setUploadComplete(false);
      }
    } catch (err) {
      NOTIFY_MESSAGE(err?.message || 'Something Went Wrong');
      setUploadComplete(false);
    } finally {
      setUploadProgress(prev => ({
        ...prev,
        [key]: 0,
      }));
      isUploadingRef.current = false;
      setActiveButton(false);
    }
  };

  const isSubmitting = useRef(false);
  const isUploadingRef = useRef(false);

  const isAnyUploading =
    isUploadingRef.current ||
    activeButton ||
    Object.values(uploadProgress).some(p => p > 0);

  const submitHandller = async () => {
    if (isSubmitting.current || isComplete || isUploadingRef.current) return;

    const parsedContent = JSON.parse(editItem?.content);
    const requiredFields = Object.entries(parsedContent).filter(
      ([key, item]) => item.required,
    );
    const newErrors = {};

    requiredFields.forEach(([key, item]) => {
      const nameLower = item.name?.toLowerCase();
      const value = formData[key]?.value;
      if (
        !value ||
        value === 'null' ||
        value === '[]' ||
        value?.length === 0 ||
        (typeof value === 'string' && value.trim() === '')
      ) {
        newErrors[key] = `${item.label} is required.`;
      } else if (item.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          newErrors[key] = `${item.label} is invalid.`;
        }
      } else if (item.type === 'number' || item.type === 'tel') {
        const numericValue = value.replace(/[^0-9]/g, '');
        const isAllZeros = /^0+$/.test(numericValue);
        if (
          (nameLower === 'contact' ||
            nameLower === 'phonenumber' ||
            nameLower === 'coordinatenumber' ||
            nameLower === 'eventcoordinatornumber' ||
            nameLower === 'contactnumber') &&
          numericValue.length !== 10
        ) {
          newErrors[key] = `${item.label} must be 10 digits.`;
        } else if (nameLower === 'zip' && numericValue.length !== 5) {
          newErrors[key] = `${item.label} must be exactly 5 digits.`;
        } else if (
          (nameLower === 'contact' ||
            nameLower === 'phonenumber' ||
            nameLower === 'coordinatenumber' ||
            nameLower === 'eventcoordinatornumber' ||
            nameLower === 'contactnumber' ||
            nameLower === 'age') &&
          isAllZeros
        ) {
          newErrors[key] = `${item.label} cannot be all zeros.`;
        }
      }
    });

    setErrors(prev => {
      const merged = {...prev, ...newErrors};
      Object.keys(newErrors).forEach(key => {
        if (!newErrors[key]) delete merged[key];
      });
      return merged;
    });

    if (Object.keys(newErrors).length > 0 || Object.keys(errors).length > 0) {
      const errorMessages = Object.values(newErrors).filter(error => error);
      const errorMessages1 = Object.values(errors).filter(error => error);
      const errorMessage =
        errorMessages.join('\n') || errorMessages1.join('\n');

      if (errorMessage) {
        alert(`Please correct the following errors:\n\n${errorMessage}`);
      }
      return;
    }

    isSubmitting.current = true;
    setIsComplete(true);

    const content = {};

    Object.entries(formData).forEach(([key, item]) => {
      content[key] = {
        label: item.label,
        subtype: item.subtype,
        type: item.type,
        value: item?.value || null,
      };
    });

    const apiPayload = {
      configurationId: editItem?.configurationId,
      keys: editItem.keys,
      content: JSON.stringify(content),
    };

    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        if (apiPayload) {
          httpClient
            .put(`module/configuration/update?isMobile=true`, apiPayload)
            .then(response => {
              if (response.data.status && response.data.result) {
                NOTIFY_MESSAGE(response?.data?.message);
                navigation.goBack();
              } else {
                NOTIFY_MESSAGE(response.data.message);
              }
            })
            .catch(err => {
              isSubmitting.current = false;
              setIsComplete(false);
              NOTIFY_MESSAGE(
                err?.message ? err?.message : 'Something went wrong',
              );
            })
            .finally(() => {
              isSubmitting.current = false;
              setIsComplete(false);
            });
        }
      } else {
        isSubmitting.current = false;
        setIsComplete(false);
        NOTIFY_MESSAGE('Please check your internet connectivity');
      }
    });
  };

  const ProgressBar = ({progress}) => {
    return (
      <View
        style={{
          height: 10,
          width: '100%',
          backgroundColor: '#e0e0df',
          borderRadius: 5,
          overflow: 'hidden',
          marginTop: 10,
        }}>
        <View
          style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: COLORS.TITLECOLOR,
            borderRadius: 5,
          }}
        />
      </View>
    );
  };

  const isFocused = useIsFocused();

  useEffect(() => {
    let timeoutId;

    if (uploadComplete) {
      timeoutId = setTimeout(() => {
        setUploadComplete(false);
      }, 3000);
    }

    return () => clearTimeout(timeoutId);
  }, [uploadComplete, isFocused]);

  const handleTextInputPress = (key, item) => {
    navigation.navigate('MapScreen', {
      currentLocation: item?.value,
      onLabelSelect: location => {
        handleInputChange(item?.name, location, item?.required, item?.label);
      },
    });
  };

  const handleDeleteImage = (key, uri) => {
    setFormData(prevFormData => {
      const existingValue = prevFormData[key]?.value
        ? JSON.parse(prevFormData[key].value)
        : [];

      const updatedValue = existingValue.filter(imageUri => imageUri !== uri);

      return {
        ...prevFormData,
        [key]: {
          ...prevFormData[key],
          value: JSON.stringify(updatedValue),
        },
      };
    });
  };

  const fetchData = useCallback(async searchQuery => {
    try {
      const response = await httpClient.get(
        `module/configuration/dropdown/search?contentType=SIGN%20UP&keyword=${searchQuery}`,
      );

      if (response.data.status) {
        if (response.data.result.length > 0) {
          const newCheckboxValues = response.data.result.map(i => ({
            label: i.name,
            value: i.id,
          }));

          const combinedValues = [
            ...originalMemberValues.current,
            ...newCheckboxValues,
          ];
          const uniqueValues = Array.from(
            new Map(combinedValues.map(item => [item.value, item])).values(),
          );

          originalMemberValues.current = uniqueValues;

          setFormData(prevFields => {
            const updatedFields = {...prevFields};

            if (prevFields.member) {
              updatedFields.member = {
                ...prevFields.member,
                values: uniqueValues,
              };
            }
            if (prevFields.eventCoordinator) {
              updatedFields.eventCoordinator = {
                ...prevFields.eventCoordinator,
                values: uniqueValues,
              };
            }

            return updatedFields;
          });
        } else {
          setFormData(prevFields => {
            const updatedFields = {...prevFields};

            if (prevFields.member) {
              updatedFields.member = {
                ...prevFields.member,
                values: originalMemberValues.current,
              };
            }
            if (prevFields.eventCoordinator) {
              updatedFields.eventCoordinator = {
                ...prevFields.eventCoordinator,
                values: originalMemberValues.current,
              };
            }

            return updatedFields;
          });
        }
      } else {
        NOTIFY_MESSAGE(
          response?.data?.message
            ? response?.data?.message
            : 'Something Went Wrong',
        );
      }
    } catch (error) {
      console.error('Dropdown search API error:', error);
    }
  }, []);

  const handleSearchChange = async (text, name) => {
    const nameLower = name?.toLowerCase();
    if (
      (nameLower === 'member' || nameLower === 'eventcoordinator') &&
      text === ''
    ) {
      setFormData(prevFields => {
        const updatedFields = {...prevFields};

        if (prevFields.member) {
          updatedFields.member = {
            ...prevFields.member,
            values: originalMemberValues.current,
          };
        }
        if (prevFields.eventCoordinator) {
          updatedFields.eventCoordinator = {
            ...prevFields.eventCoordinator,
            values: originalMemberValues.current,
          };
        }

        return updatedFields;
      });
    } else if (
      (nameLower === 'member' || nameLower === 'eventcoordinator') &&
      text
    ) {
      fetchData(text);
    }
  };

  const [preventModalOpen, setPreventModalOpen] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
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

  const parseDateString = dateString => {
    const m = moment(dateString, 'MM/DD/YYYY', true);
    if (m.isValid()) {
      return m.toDate();
    }
    return new Date();
  };

  const parseTimeString = timeString => {
    const m = moment(timeString, ['h:mm A', 'HH:mm'], true);
    if (m.isValid()) {
      return m.toDate();
    }
    return new Date();
  };

  const parseDateTimeString = dateTimeString => {
    const m = moment(dateTimeString, 'MM/DD/YYYY h:mm A', true);
    if (m.isValid()) {
      return m.toDate();
    }
    return new Date();
  };

  const handleUploadPress = useCallback(
    item => {
      if (keyboardOpen && !preventModalOpen) {
        setPreventModalOpen(true);
        Keyboard.dismiss();

        const timeOut = setTimeout(() => {
          setModalVisible(prev => ({
            ...prev,
            [item?.name]: true,
          }));
          setPreventModalOpen(false);
          clearTimeout(timeOut);
        }, 500);
        return;
      }
      setModalVisible(prev => ({
        ...prev,
        [item?.name]: true,
      }));
    },
    [keyboardOpen, preventModalOpen, formData],
  );

  const insets = useSafeAreaInsets();
  const {height: screenHeight} = Dimensions.get('window');
  const [inputPositions, setInputPositions] = useState({});

  // Measure input position relative to SCREEN viewport
  const measureInput = useCallback(
    key => {
      const inputRef = inputPositions[key]?.ref;
      if (inputRef?.current) {
        inputRef.current.measureInWindow((x, y, width, height) => {
          setInputPositions(prev => ({
            ...prev,
            [key]: {
              ...prev[key],
              y,
              height,
            },
          }));
        });
      }
    },
    [inputPositions],
  );

  // Calculate if dropdown should appear on top
  const shouldShowOnTop = useCallback(
    key => {
      const position = inputPositions[key];
      if (!position?.y) return false;

      const gestureArea =
        Platform.OS === 'android' ? Math.max(insets.bottom, 40) : 0;
      const dropdownHeight = 200;
      const safePadding = 20;
      const spaceNeeded = dropdownHeight + gestureArea + safePadding;

      const inputHeight = position.height || 60;
      // const spaceBelowInput = screenHeight - (position.y + inputHeight);
      const spaceBelowInput =
        screenHeight - (position.y + inputHeight) - insets.bottom;

      return spaceBelowInput < spaceNeeded;
    },
    [inputPositions, screenHeight, insets.bottom],
  );

  const getInputRef = useCallback(
    key => {
      // Create ref if missing (synchronous)
      if (!inputPositions[key]?.ref) {
        const newRef = React.createRef();
        setInputPositions(prev => ({
          ...prev,
          [key]: {ref: newRef, y: 0, height: 0},
        }));
        return newRef; // Return immediately
      }
      return inputPositions[key].ref;
    },
    [inputPositions],
  );

  useEffect(() => {
    return () => {
      setInputPositions(prev => ({})); // Functional update
    };
  }, []);

  return (
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View
        style={{
          paddingHorizontal: 15,
          marginTop: 10,
          flex: 1,
        }}>
        {memberShipLoading ? (
          <Loader />
        ) : Object.keys(formData).length > 0 ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom:
                keyboardOpen && Platform.OS == 'android'
                  ? 84
                  : keyboardOpen && Platform.OS == 'ios'
                  ? 100
                  : 0,
            }}>
            {Object.entries(formData).map(([key, item], index) => {
              if (!item || key == 'configurationid' || key == 'value') {
                return null;
              }

              switch (
                item?.subtype !== null
                  ? item.subtype
                  : item?.type
                  ? item?.type
                  : 'text'
              ) {
                case 'text':
                  return (
                    <View key={key} style={{marginBottom: 8, gap: 4}}>
                      <View
                        style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Text
                          style={{
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                            color: COLORS.TITLECOLOR,
                          }}>
                          {item?.label}{' '}
                        </Text>
                        {item?.required ? (
                          <Text
                            style={{
                              fontSize: FONTS.FONTSIZE.SMALL,
                              fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                              color: errors[key]
                                ? COLORS.PRIMARYRED
                                : COLORS.TITLECOLOR,
                            }}>
                            *
                          </Text>
                        ) : null}
                      </View>
                      <TextInput
                        style={{
                          backgroundColor: COLORS.PRIMARYWHITE,
                          color: COLORS.PLACEHOLDERCOLOR,
                          borderWidth: 1,
                          height: 44,
                          paddingVertical: 0,
                          borderRadius: 10,
                          paddingHorizontal: 8,
                          borderColor: errors[key]
                            ? COLORS.PRIMARYRED
                            : COLORS.INPUTBORDER,
                          fontSize: FONTS.FONTSIZE.SMALL,
                          fontFamily: FONTS.FONT_FAMILY.REGULAR,
                          includeFontPadding: false,
                        }}
                        value={item?.value || ''}
                        maxLength={
                          (item?.maxLength ?? item?.maxlength ?? 0) === 0
                            ? 250
                            : item?.maxLength ?? item?.maxlength
                        }
                        placeholder={`${item.label}`}
                        placeholderTextColor={COLORS.PLACEHOLDERCOLOR}
                        onChangeText={value =>
                          handleInputChange(
                            item?.name,
                            value,
                            item?.required,
                            item?.label,
                          )
                        }
                        keyboardType="default"
                      />
                      {errors[item?.name] && (
                        <Text
                          style={{
                            color: COLORS.PRIMARYRED,
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
                            marginTop: 4,
                          }}>
                          {errors[item?.name]}
                        </Text>
                      )}
                    </View>
                  );

                case 'map':
                  return (
                    <View key={key} style={{marginBottom: 8, gap: 4}}>
                      <View
                        style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Text
                          style={{
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                            color: COLORS.TITLECOLOR,
                          }}>
                          {item?.label}{' '}
                        </Text>
                        {item?.required ? (
                          <Text
                            style={{
                              fontSize: FONTS.FONTSIZE.SMALL,
                              fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                              color: errors[key]
                                ? COLORS.PRIMARYRED
                                : COLORS.TITLECOLOR,
                            }}>
                            *
                          </Text>
                        ) : null}
                      </View>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'flex-start',
                          borderWidth: 1,
                          height: 100,
                          paddingVertical: 4,
                          borderRadius: 10,
                          paddingHorizontal: 8,
                          borderColor: errors[key]
                            ? COLORS.PRIMARYRED
                            : COLORS.INPUTBORDER,
                          justifyContent: 'space-between',
                          backgroundColor: COLORS.PRIMARYWHITE,
                        }}>
                        <TextInput
                          multiline
                          numberOfLines={4}
                          style={{
                            color: COLORS.PRIMARYBLACK,
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
                            flex: 1,
                            paddingVertical: 4,
                            textAlignVertical: 'top',
                          }}
                          value={item?.value || ''}
                          maxLength={
                            (item?.maxLength ?? item?.maxlength ?? 0) === 0
                              ? 250
                              : item?.maxLength ?? item?.maxlength
                          }
                          placeholder={`${item.label}`}
                          placeholderTextColor={COLORS.PLACEHOLDERCOLOR}
                          onChangeText={value =>
                            handleInputChange(
                              item?.name,
                              value,
                              item?.required,
                              item?.label,
                            )
                          }
                          keyboardType="default"
                        />
                        <TouchableOpacity
                          onPress={() => {
                            Keyboard.dismiss();
                            handleTextInputPress(item?.name, item);
                          }}>
                          <Text
                            style={{
                              fontSize: FONTS.FONTSIZE.SMALL,
                              fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                              color: COLORS.TITLECOLOR,
                              textDecorationLine: 'underline',
                            }}>
                            Open
                          </Text>
                        </TouchableOpacity>
                      </View>
                      {errors[item?.name] && (
                        <Text
                          style={{
                            color: COLORS.PRIMARYRED,
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
                            marginTop: 4,
                          }}>
                          {errors[item?.name]}
                        </Text>
                      )}
                    </View>
                  );

                case 'radio-group':
                  return (
                    <View
                      key={key}
                      style={{
                        marginBottom: 8,
                        gap: 4,
                      }}>
                      <View
                        style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Text
                          style={{
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                            color: COLORS.TITLECOLOR,
                          }}>
                          {item?.label}
                        </Text>
                        {item?.required && (
                          <Text
                            style={{
                              fontSize: FONTS.FONTSIZE.SMALL,
                              fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                              color: errors[key]
                                ? COLORS.PRIMARYRED
                                : COLORS.TITLECOLOR,
                            }}>
                            *
                          </Text>
                        )}
                      </View>
                      {item?.values?.length > 0 && (
                        <FlatList
                          data={item?.values || ' '}
                          showsHorizontalScrollIndicator={false}
                          keyExtractor={(radioItem, index) => `${key}-${index}`}
                          horizontal
                          contentContainerStyle={{gap: 10}}
                          ListEmptyComponent={<NoDataFound />}
                          renderItem={({item: radioItem, index}) => (
                            <TouchableOpacity
                              key={index}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                              }}
                              onPress={() =>
                                handleRadioSelect(
                                  item?.name,
                                  radioItem.value,
                                  item?.label,
                                  item?.required,
                                )
                              }>
                              {item?.value === radioItem.value ? (
                                <Fontisto
                                  name="radio-btn-active"
                                  size={18}
                                  color={COLORS.TITLECOLOR}
                                />
                              ) : (
                                <Fontisto
                                  name="radio-btn-passive"
                                  size={18}
                                  color={COLORS.TITLECOLOR}
                                />
                              )}
                              <Text
                                style={{
                                  fontSize: FONTS.FONTSIZE.SMALL,
                                  fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                                  color: COLORS.TITLECOLOR,
                                }}>
                                {radioItem.label}
                              </Text>
                            </TouchableOpacity>
                          )}
                        />
                      )}
                      {errors[item?.name] && (
                        <Text
                          style={{
                            color: COLORS.PRIMARYRED,
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
                            marginTop: 4,
                          }}>
                          {errors[item?.name]}
                        </Text>
                      )}
                    </View>
                  );

                case 'select':
                  const hasMembershipValue =
                    formData?.membership?.value &&
                    formData?.membership?.value !== null &&
                    formData?.membership?.value !== undefined &&
                    formData?.membership?.value !== '';

                  const isRelationshipField =
                    item?.name?.toLowerCase() === 'relationship';
                  const shouldDisableRelationship =
                    isRelationshipField && hasMembershipValue;

                  // if (shouldDisableRelationship) {
                  //   return null;
                  // }

                  return (
                    <View
                      key={key}
                      style={{marginBottom: 8, gap: 4, position: 'relative'}}>
                      <Text
                        style={{
                          fontSize: FONTS.FONTSIZE.SMALL,
                          fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                          color: COLORS.TITLECOLOR,
                        }}>
                        {item?.label}{' '}
                        {item?.required && (
                          <Text
                            style={{
                              color: errors[key]
                                ? COLORS.PRIMARYRED
                                : COLORS.TITLECOLOR,
                            }}>
                            *
                          </Text>
                        )}
                      </Text>
                      <View
                        ref={getInputRef(item?.name)}
                        onLayout={() => {
                          setTimeout(() => measureInput(item?.name), 100);
                        }}>
                        <Dropdown
                          dropdownPosition={
                            Platform.OS === 'android'
                              ? shouldShowOnTop(item?.name)
                                ? 'top'
                                : 'auto'
                              : 'auto'
                          }
                          onFocus={() => {
                            Keyboard.dismiss();
                            // Re-measure on focus to get accurate position after scroll
                            setTimeout(() => measureInput(item?.name), 50);
                          }}
                          disable={shouldDisableRelationship}
                          onChangeText={txt => {
                            handleSearchChange(txt, item?.name);
                          }}
                          search={
                            (editItem?.contentType?.toLowerCase() === 'rsvp' &&
                              item?.name?.toLowerCase() === 'member') ||
                            (editItem?.contentType?.toLowerCase() ==
                              'family member' &&
                              item?.name?.toLowerCase() === 'member')
                              ? false
                              : true
                          }
                          searchPlaceholder="Search..."
                          autoScroll={false}
                          data={
                            item?.values?.length > 0
                              ? item?.values
                              : [{label: 'No Data Available', value: null}]
                          }
                          inputSearchStyle={{
                            color: COLORS.PRIMARYBLACK,
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
                            paddingVertical: 0,
                            includeFontPadding: false,
                          }}
                          labelField="label"
                          valueField="value"
                          value={item?.value}
                          onChange={item1 => {
                            handleSelectDropdown(
                              item?.name,
                              item1.value,
                              item?.label,
                              item?.required,
                            );
                          }}
                          itemTextStyle={{color: COLORS.PRIMARYBLACK}}
                          placeholder={`Select ${capitalizeFirstLetter(
                            item?.label,
                          )}`}
                          placeholderStyle={styles.placeholderStyle}
                          selectedTextStyle={styles.selectedTextStyle}
                          renderItem={item => (
                            <View style={styles.itemContainer}>
                              <Text style={styles.itemText}>{item.label}</Text>
                            </View>
                          )}
                          style={[
                            {
                              borderColor: errors[item?.name]
                                ? COLORS.PRIMARYRED
                                : COLORS.INPUTBORDER,
                              height: 44,
                              borderWidth: 1,
                              borderRadius: 10,
                              backgroundColor: shouldDisableRelationship
                                ? '#8080801a'
                                : COLORS.PRIMARYWHITE,
                              paddingHorizontal: 10,
                              justifyContent: 'center',
                            },
                          ]}
                          maxHeight={200}
                        />
                      </View>
                      {errors[item?.name] && (
                        <Text
                          style={{
                            color: COLORS.PRIMARYRED,
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
                            marginTop: 4,
                          }}>
                          {errors[item?.name]}
                        </Text>
                      )}
                    </View>
                  );

                case 'file':
                  return (
                    <View key={key} style={{marginBottom: 8, gap: 4}}>
                      <View
                        style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Text
                          style={{
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                            color: COLORS.TITLECOLOR,
                          }}>
                          {item?.label}{' '}
                          {item?.required && (
                            <Text
                              style={{
                                color: errors[key]
                                  ? COLORS.PRIMARYRED
                                  : COLORS.TITLECOLOR,
                              }}>
                              *
                            </Text>
                          )}
                        </Text>
                      </View>

                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                        }}>
                        <ButtonComponent
                          disabled={
                            activeButton || uploadProgress[item?.name] > 0
                          }
                          title={
                            isVideoGallery ? 'Upload Video' : 'Upload Image'
                          }
                          width={'50%'}
                          onPress={() => handleUploadPress(item)}
                        />
                      </View>

                      {uploadProgress[item?.name] > 0 && !uploadComplete && (
                        <View style={{marginTop: 10}}>
                          <Text
                            style={{
                              color: COLORS.TITLECOLOR,
                              fontSize: FONTS.FONTSIZE.SMALL,
                              fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                            }}>
                            Uploading: {uploadProgress[item?.name]}%
                          </Text>
                          <ProgressBar progress={uploadProgress[item?.name]} />
                        </View>
                      )}

                      {formData[item?.name]?.value && (
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}>
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}>
                            {(() => {
                              let rawValue = formData[item?.name]?.value;

                              let mediaUris = [];
                              if (rawValue) {
                                try {
                                  const parsedValue = JSON.parse(rawValue);
                                  const rawArray = Array.isArray(parsedValue)
                                    ? parsedValue
                                    : [parsedValue];
                                  mediaUris = rawArray.filter(
                                    uri =>
                                      uri &&
                                      typeof uri === 'string' &&
                                      uri.trim() !== '',
                                  );
                                } catch (error) {
                                  if (
                                    typeof rawValue === 'string' &&
                                    rawValue.trim() !== ''
                                  ) {
                                    mediaUris = [rawValue];
                                  }
                                }
                              }

                              return mediaUris.map((uri, index) => (
                                <View key={index} style={{margin: 5}}>
                                  {getFileType(uri) === 'video' ? (
                                    <View>
                                      {Platform.OS == 'ios' && (
                                        <Video
                                          poster={{
                                            source: require('../../assets/images/Video_placeholder.png'),
                                            resizeMode: 'cover',
                                          }}
                                          source={{
                                            uri: uri ? IMAGE_URL + uri : null,
                                          }}
                                          style={styles.video}
                                          controls={false}
                                          resizeMode="cover"
                                          paused={true}
                                          muted={true}
                                        />
                                      )}
                                      {Platform.OS == 'android' && (
                                        <FastImage
                                          source={{
                                            uri: uri ? IMAGE_URL + uri : null,
                                          }}
                                          style={styles.video}
                                          resizeMode={
                                            FastImage.resizeMode.cover
                                          }
                                          defaultSource={require('../../assets/images/Video_placeholder.png')}
                                        />
                                      )}
                                      <TouchableOpacity
                                        style={{
                                          position: 'absolute',
                                          top: 0,
                                          right: -4,
                                          backgroundColor: 'white',
                                          borderRadius: 15,
                                        }}
                                        onPress={() =>
                                          handleDeleteImage(item?.name, uri)
                                        }>
                                        <Entypo
                                          name="circle-with-minus"
                                          size={26}
                                          color={COLORS.PRIMARYRED}
                                        />
                                      </TouchableOpacity>
                                    </View>
                                  ) : getFileType(uri) === 'image' ? (
                                    <View>
                                      <FastImage
                                        source={{
                                          uri: uri ? IMAGE_URL + uri : null,
                                        }}
                                        style={styles.image}
                                        defaultSource={require('../../assets/images/Image_placeholder.png')}
                                        resizeMode={FastImage.resizeMode.cover}
                                      />
                                      <TouchableOpacity
                                        style={{
                                          position: 'absolute',
                                          top: 0,
                                          right: -4,
                                          backgroundColor: 'white',
                                          borderRadius: 15,
                                        }}
                                        onPress={() =>
                                          handleDeleteImage(item?.name, uri)
                                        }>
                                        <Entypo
                                          name="circle-with-minus"
                                          size={26}
                                          color={COLORS.PRIMARYRED}
                                        />
                                      </TouchableOpacity>
                                    </View>
                                  ) : null}
                                </View>
                              ));
                            })()}
                          </ScrollView>
                        </View>
                      )}
                      {modalVisible[item?.name] && (
                        <ImageSelectModal
                          visible={modalVisible[item?.name]}
                          onClose={() =>
                            setModalVisible(prev => ({
                              ...prev,
                              [item?.name]: false,
                            }))
                          }
                          isVideoGallery={isVideoGallery}
                          isImageGallery={isImageGallery}
                          onSelect={media =>
                            handleFileChange(
                              item?.name,
                              media,
                              item?.label,
                              item?.required,
                              item?.multiple,
                            )
                          }
                          item={item}
                        />
                      )}
                      {errors[item?.name] && (
                        <Text
                          style={{
                            color: COLORS.PRIMARYRED,
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
                            marginTop: 4,
                          }}>
                          {errors[item?.name]}
                        </Text>
                      )}
                    </View>
                  );

                case 'date':
                  return (
                    <View key={key} style={{marginBottom: 8, gap: 4}}>
                      <Text
                        style={{
                          fontSize: FONTS.FONTSIZE.SMALL,
                          color: COLORS.TITLECOLOR,
                          fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                        }}>
                        {item?.label}
                        {item?.required && (
                          <Text
                            style={{
                              color: errors[key]
                                ? COLORS.PRIMARYRED
                                : COLORS.TITLECOLOR,
                            }}>
                            *
                          </Text>
                        )}
                      </Text>

                      <TouchableOpacity
                        style={{
                          borderWidth: 1,
                          height: 44,
                          borderRadius: 10,
                          justifyContent: 'center',
                          paddingHorizontal: 8,
                          borderColor: errors[key]
                            ? COLORS.PRIMARYRED
                            : COLORS.INPUTBORDER,
                          backgroundColor: COLORS.PRIMARYWHITE,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                        onPress={() => {
                          Keyboard.dismiss();
                          setDatePickerVisible(prev => ({
                            ...prev,
                            [item?.name]: true,
                          }));
                        }}>
                        <Text
                          style={{
                            color: item?.value
                              ? COLORS.PLACEHOLDERCOLOR
                              : COLORS.grey500,
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
                            includeFontPadding: false,
                          }}>
                          {item?.value || 'Select Date'}
                        </Text>
                        <MaterialDesignIcons
                          name="calendar-month-outline"
                          size={25}
                          color={COLORS.PLACEHOLDERCOLOR}
                        />
                      </TouchableOpacity>

                      {datePickerVisible[item?.name] && (
                        <DateTimePickerModal
                          is24Hour={false}
                          isVisible={datePickerVisible[item?.name]}
                          mode="date"
                          display="inline"
                          onConfirm={date =>
                            onDateChange(
                              item?.name,
                              date,
                              item?.label,
                              item?.required,
                              item?.type,
                            )
                          }
                          onCancel={() =>
                            setDatePickerVisible(prev => ({
                              ...prev,
                              [item?.name]: false,
                            }))
                          }
                          date={
                            item?.value
                              ? parseDateString(item.value)
                              : selectedDate[item?.name] || new Date()
                          }
                        />
                      )}
                      {errors[item?.name] && (
                        <Text
                          style={{
                            color: COLORS.PRIMARYRED,
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
                            marginTop: 4,
                          }}>
                          {errors[item?.name]}
                        </Text>
                      )}
                    </View>
                  );

                case 'datetime':
                  return (
                    <View key={key} style={{marginBottom: 8, gap: 4}}>
                      <Text
                        style={{
                          fontSize: FONTS.FONTSIZE.SMALL,
                          color: COLORS.TITLECOLOR,
                          fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                        }}>
                        {item?.label}
                        {item?.required && (
                          <Text
                            style={{
                              color: errors[key]
                                ? COLORS.PRIMARYRED
                                : COLORS.TITLECOLOR,
                            }}>
                            *
                          </Text>
                        )}
                      </Text>

                      <TouchableOpacity
                        style={{
                          borderWidth: 1,
                          height: 44,
                          borderRadius: 10,
                          justifyContent: 'center',
                          paddingHorizontal: 8,
                          borderColor: errors[key]
                            ? COLORS.PRIMARYRED
                            : COLORS.INPUTBORDER,
                          backgroundColor: COLORS.PRIMARYWHITE,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                        onPress={() => {
                          Keyboard.dismiss();
                          setDatePickerVisible(prev => ({
                            ...prev,
                            [item?.name]: true,
                          }));
                        }}>
                        <Text
                          style={{
                            color: item?.value
                              ? COLORS.PLACEHOLDERCOLOR
                              : COLORS.grey500,
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
                            includeFontPadding: false,
                          }}>
                          {item?.value || 'Select Date-Time'}
                        </Text>
                        <MaterialDesignIcons
                          name="calendar-month-outline"
                          size={25}
                          color={COLORS.PLACEHOLDERCOLOR}
                        />
                      </TouchableOpacity>

                      {datePickerVisible[item?.name] && (
                        <DateTimePickerModal
                          is24Hour={false}
                          isVisible={datePickerVisible[item?.name]}
                          mode="datetime"
                          display="inline"
                          onConfirm={date =>
                            onDateChange(
                              item?.name,
                              date,
                              item?.label,
                              item?.required,
                              item?.type,
                            )
                          }
                          onCancel={() =>
                            setDatePickerVisible(prev => ({
                              ...prev,
                              [item?.name]: false,
                            }))
                          }
                          date={
                            item?.value
                              ? parseDateTimeString(item?.value)
                              : selectedDate[item?.name] || new Date()
                          }
                        />
                      )}
                      {errors[item?.name] && (
                        <Text
                          style={{
                            color: COLORS.PRIMARYRED,
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
                            marginTop: 4,
                          }}>
                          {errors[item?.name]}
                        </Text>
                      )}
                    </View>
                  );

                case 'checkbox-group':
                  return (
                    <View key={key} style={{marginBottom: 8, gap: 4}}>
                      <View
                        style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Text
                          style={{
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                            color: COLORS.TITLECOLOR,
                          }}>
                          {item?.label}{' '}
                        </Text>
                        {item?.required ? (
                          <Text
                            style={{
                              fontSize: FONTS.FONTSIZE.SMALL,
                              fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                              color: errors[key]
                                ? COLORS.PRIMARYRED
                                : COLORS.TITLECOLOR,
                            }}>
                            *
                          </Text>
                        ) : null}
                      </View>
                      {item?.values?.length > 0 &&
                        item?.values?.map((checkboxItem, index) => (
                          <TouchableOpacity
                            key={index}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 8,
                            }}
                            onPress={() => {
                              Keyboard.dismiss();
                              handleCheckboxSelect(
                                key,
                                checkboxItem.value,
                                item?.required,
                                item?.label,
                              );
                            }}>
                            {item?.value
                              ?.split(',')
                              .includes(String(checkboxItem.value)) ? (
                              <Fontisto
                                name="checkbox-active"
                                size={16}
                                color={COLORS.TITLECOLOR}
                              />
                            ) : (
                              <Fontisto
                                name="checkbox-passive"
                                size={16}
                                color={COLORS.TITLECOLOR}
                              />
                            )}
                            <Text
                              style={{
                                fontSize: FONTS.FONTSIZE.SMALL,
                                fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                                color: COLORS.TITLECOLOR,
                              }}>
                              {checkboxItem.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      {errors[item?.name] && (
                        <Text
                          style={{
                            color: COLORS.PRIMARYRED,
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
                            marginTop: 4,
                          }}>
                          {errors[item?.name]}
                        </Text>
                      )}
                    </View>
                  );

                case 'time':
                  return (
                    <View key={key} style={{marginBottom: 8, gap: 4}}>
                      <Text
                        style={{
                          fontSize: FONTS.FONTSIZE.SMALL,
                          color: COLORS.TITLECOLOR,
                          fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                        }}>
                        {item?.label}
                        {item?.required && (
                          <Text
                            style={{
                              color: errors[key]
                                ? COLORS.PRIMARYRED
                                : COLORS.TITLECOLOR,
                            }}>
                            *
                          </Text>
                        )}
                      </Text>

                      <TouchableOpacity
                        style={{
                          borderWidth: 1,
                          height: 44,
                          borderRadius: 10,
                          justifyContent: 'center',
                          paddingHorizontal: 8,
                          borderColor: errors[key]
                            ? COLORS.PRIMARYRED
                            : COLORS.INPUTBORDER,
                          backgroundColor: COLORS.PRIMARYWHITE,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                        onPress={() => {
                          Keyboard.dismiss();
                          setTimePickerVisible(prev => ({
                            ...prev,
                            [item?.name]: true,
                          }));
                        }}>
                        <Text
                          style={{
                            color: item?.value
                              ? COLORS.PLACEHOLDERCOLOR
                              : COLORS.grey500,
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
                            includeFontPadding: false,
                          }}>
                          {item?.value || 'Select Time'}
                        </Text>
                        <MaterialDesignIcons
                          name="calendar-month-outline"
                          size={25}
                          color={COLORS.PLACEHOLDERCOLOR}
                        />
                      </TouchableOpacity>

                      {timePickerVisible[item?.name] && (
                        <DateTimePickerModal
                          is24Hour={false}
                          isVisible={timePickerVisible[item?.name]}
                          mode="time"
                          display={Platform.OS == 'ios' ? 'spinner' : 'inline'}
                          onConfirm={time =>
                            onTimeChange(
                              item?.name,
                              time,
                              item?.label,
                              item?.required,
                            )
                          }
                          onCancel={() =>
                            setTimePickerVisible(prev => ({
                              ...prev,
                              [item?.name]: false,
                            }))
                          }
                          date={
                            item?.value
                              ? parseTimeString(item?.value)
                              : selectedTime[item?.name] || new Date()
                          }
                        />
                      )}
                      {errors[item?.name] && (
                        <Text
                          style={{
                            color: COLORS.PRIMARYRED,
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
                            marginTop: 4,
                          }}>
                          {errors[item?.name]}
                        </Text>
                      )}
                    </View>
                  );

                case 'textarea':
                  return (
                    <View key={key} style={{marginBottom: 8, gap: 4}}>
                      <Text
                        style={{
                          fontSize: FONTS.FONTSIZE.SMALL,
                          fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                          color: COLORS.TITLECOLOR,
                        }}>
                        {item?.label}{' '}
                        {item?.required && (
                          <Text
                            style={{
                              color: errors[key]
                                ? COLORS.PRIMARYRED
                                : COLORS.TITLECOLOR,
                            }}>
                            *
                          </Text>
                        )}
                      </Text>
                      <TextInput
                        style={{
                          backgroundColor: COLORS.PRIMARYWHITE,
                          borderWidth: 1,
                          borderColor: errors[key]
                            ? COLORS.PRIMARYRED
                            : COLORS.INPUTBORDER,
                          borderRadius: 10,
                          padding: 10,
                          height: 100,
                          textAlignVertical: 'top',
                          fontSize: FONTS.FONTSIZE.SMALL,
                          fontFamily: FONTS.FONT_FAMILY.REGULAR,
                          color: COLORS.PLACEHOLDERCOLOR,
                        }}
                        multiline
                        numberOfLines={4}
                        maxLength={
                          (item?.maxLength ?? item?.maxlength ?? 0) === 0
                            ? 250
                            : item?.maxLength ?? item?.maxlength
                        }
                        placeholder={`${item.label}`}
                        placeholderTextColor={COLORS.PLACEHOLDERCOLOR}
                        value={item?.value}
                        onChangeText={value =>
                          handleTextArea(
                            item?.name,
                            value,
                            item?.label,
                            item?.required,
                          )
                        }
                      />
                      {errors[item?.name] && (
                        <Text
                          style={{
                            color: COLORS.PRIMARYRED,
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
                            marginTop: 4,
                          }}>
                          {errors[item?.name]}
                        </Text>
                      )}
                    </View>
                  );

                case 'number':
                  return item?.name?.toLowerCase() == 'numberofguests' ||
                    item?.name?.toLowerCase() == 'numberofparticipants' ||
                    item?.name?.toLowerCase() == 'howmanyminutes' ||
                    item?.name?.toLowerCase() == 'numberofkids' ? (
                    <>
                      <View
                        key={item?.name}
                        style={{
                          marginBottom: 8,
                          gap: 4,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}>
                        <Text
                          style={{
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                            color: COLORS.TITLECOLOR,
                            width: width / 2,
                          }}>
                          {capitalizeFirstLetter(item?.label)}{' '}
                          {item?.required && (
                            <Text
                              style={{
                                color: errors[item?.name]
                                  ? COLORS.PRIMARYRED
                                  : COLORS.TITLECOLOR,
                              }}>
                              *
                            </Text>
                          )}{' '}
                        </Text>

                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10,
                          }}>
                          <TouchableOpacity
                            onPress={() =>
                              handleCounterChange(
                                item?.name,
                                -1,
                                item?.required,
                                item?.name,
                                item?.label,
                              )
                            }
                            style={{
                              backgroundColor: COLORS.TITLECOLOR,
                              alignItems: 'center',
                              padding: 6,
                              borderRadius: 10,
                              borderWidth: 1,
                              borderColor: COLORS.TITLECOLOR,
                            }}>
                            <Entypo
                              name={'minus'}
                              size={20}
                              color={COLORS.PRIMARYWHITE}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            disabled
                            style={{
                              alignItems: 'center',
                              borderRadius: 10,
                              borderWidth: 1,
                              borderColor: COLORS.INPUTBORDER,
                              width: 32,
                            }}>
                            <Text
                              style={{
                                fontSize: FONTS.FONTSIZE.SMALL,
                                color: COLORS.TITLECOLOR,
                                fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                              }}>
                              {item?.value || 0}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            disabled={
                              (item?.maxLength ?? item?.maxlength ?? 0) > 0 &&
                              (Number(item?.value) ?? 0) >=
                                (item?.maxLength ?? item?.maxlength)
                            }
                            onPress={() =>
                              handleCounterChange(
                                item?.name,
                                1,
                                item?.required,
                                item?.name,
                                item?.label,
                                item?.maxLength ?? item?.maxlength ?? 0,
                              )
                            }
                            style={{
                              backgroundColor: COLORS.TITLECOLOR,
                              alignItems: 'center',
                              padding: 6,
                              borderRadius: 10,
                              borderWidth: 1,
                              borderColor: COLORS.TITLECOLOR,
                              opacity:
                                (item?.maxLength ?? item?.maxlength ?? 0) > 0 &&
                                (Number(item?.value) ?? 0) >=
                                  (item?.maxLength ?? item?.maxlength)
                                  ? 0.4
                                  : 1,
                            }}>
                            <Entypo
                              name={'plus'}
                              size={20}
                              color={COLORS.PRIMARYWHITE}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                      {(item?.maxLength ?? item?.maxlength ?? 0) > 0 &&
                        (Number(item?.value) ?? 0) >=
                          (item?.maxLength ?? item?.maxlength) && (
                          <Text
                            style={{
                              color: COLORS.PRIMARYRED,
                              fontSize: FONTS.FONTSIZE.SEMIMINI,
                              fontFamily: FONTS.FONT_FAMILY.REGULAR,
                              marginTop: 2,
                            }}>
                            Maximum {item?.maxLength ?? item?.maxlength}{' '}
                            allowed.
                          </Text>
                        )}
                      {errors[item?.name] && (
                        <Text
                          style={{
                            color: COLORS.PRIMARYRED,
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
                            marginTop: 4,
                          }}>
                          {errors[item?.name]}
                        </Text>
                      )}
                    </>
                  ) : item?.name?.toLowerCase() == 'membershipamount' ||
                    item?.name?.toLowerCase() == 'totalmembershipamount' ? (
                    <View key={item?.name} style={{marginBottom: 8, gap: 4}}>
                      <Text
                        style={{
                          fontSize: FONTS.FONTSIZE.MEDIUM,
                          fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
                          color: COLORS.LABELCOLOR,
                        }}>
                        {item?.name?.toLowerCase() == 'membershipamount'
                          ? 'Membership Amount'
                          : 'Total Membership Amount'}
                        : ${formData[item?.name]?.value || 0}
                      </Text>
                    </View>
                  ) : (
                    <View key={key} style={{marginBottom: 8, gap: 4}}>
                      <Text
                        style={{
                          fontSize: FONTS.FONTSIZE.SMALL,
                          fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                          color: COLORS.TITLECOLOR,
                        }}>
                        {item?.label}
                        {item?.required && (
                          <Text
                            style={{
                              color: errors[key]
                                ? COLORS.PRIMARYRED
                                : COLORS.TITLECOLOR,
                            }}>
                            *
                          </Text>
                        )}
                      </Text>
                      <TextInput
                        style={{
                          borderWidth: 1,
                          borderColor: errors[key]
                            ? COLORS.PRIMARYRED
                            : COLORS.INPUTBORDER,
                          borderRadius: 10,
                          padding: 10,
                          height: 44,
                          color: COLORS.PLACEHOLDERCOLOR,
                          fontSize: FONTS.FONTSIZE.SMALL,
                          fontFamily: FONTS.FONT_FAMILY.REGULAR,
                          backgroundColor: COLORS.PRIMARYWHITE,
                          paddingVertical: 0,
                          includeFontPadding: false,
                        }}
                        value={
                          isPhoneField(item?.name)
                            ? formatPhoneToUS(item?.value || '')
                            : item?.value
                        }
                        maxLength={
                          isPhoneField(item?.name)
                            ? 14
                            : (item?.maxLength ?? item?.maxlength ?? 0) === 0
                            ? 250
                            : item?.maxLength ?? item?.maxlength
                        }
                        placeholderTextColor={COLORS.PLACEHOLDERCOLOR}
                        keyboardType="numeric"
                        placeholder={`${item.label}`}
                        onChangeText={text => {
                          const numericValue = isPhoneField(item?.name)
                            ? unformatPhone(text)
                            : text;
                          handleNumberChange(
                            item?.name,
                            numericValue,
                            item?.required,
                            item?.name,
                            item?.label,
                            item?.className,
                          );
                        }}
                      />
                      {errors[item?.name] && (
                        <Text
                          style={{
                            color: COLORS.PRIMARYRED,
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
                            marginTop: 4,
                          }}>
                          {errors[item?.name]}
                        </Text>
                      )}
                    </View>
                  );

                case 'tel':
                  return (
                    <View key={key} style={{marginBottom: 8, gap: 4}}>
                      <Text
                        style={{
                          fontSize: FONTS.FONTSIZE.SMALL,
                          fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                          color: COLORS.TITLECOLOR,
                        }}>
                        {capitalizeFirstLetter(item?.label)}{' '}
                        {item?.required && (
                          <Text
                            style={{
                              color: errors[key]
                                ? COLORS.PRIMARYRED
                                : COLORS.TITLECOLOR,
                            }}>
                            *
                          </Text>
                        )}
                      </Text>
                      <TextInput
                        style={{
                          borderWidth: 1,
                          borderColor: errors[key]
                            ? COLORS.PRIMARYRED
                            : COLORS.INPUTBORDER,
                          height: 44,
                          paddingVertical: 0,
                          borderRadius: 10,
                          paddingHorizontal: 8,
                          color: COLORS.PRIMARYBLACK,
                          fontSize: FONTS.FONTSIZE.SMALL,
                          fontFamily: FONTS.FONT_FAMILY.REGULAR,
                          backgroundColor: COLORS.PRIMARYWHITE,
                          includeFontPadding: false,
                        }}
                        placeholderTextColor={COLORS.PLACEHOLDERCOLOR}
                        keyboardType="numeric"
                        placeholder={`${item.label}`}
                        value={
                          isPhoneField(item?.name)
                            ? formatPhoneToUS(item?.value || '')
                            : item?.value
                        }
                        maxLength={
                          isPhoneField(item?.name)
                            ? 14
                            : (item?.maxLength ?? item?.maxlength ?? 0) === 0
                            ? 250
                            : item?.maxLength ?? item?.maxlength
                        }
                        onChangeText={text => {
                          const numericValue = isPhoneField(item?.name)
                            ? unformatPhone(text)
                            : text;

                          handleNumberChange(
                            item?.name,
                            numericValue,
                            item?.required,
                            item?.name,
                            item?.label,
                            item?.className,
                          );
                        }}
                      />
                      {errors[item?.name] && (
                        <Text
                          style={{
                            color: COLORS.PRIMARYRED,
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
                            marginTop: 4,
                          }}>
                          {errors[item?.name]}
                        </Text>
                      )}
                    </View>
                  );

                case 'email':
                  return (
                    <View key={key} style={{marginBottom: 8, gap: 4}}>
                      <View
                        style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Text
                          style={{
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                            color: COLORS.TITLECOLOR,
                          }}>
                          {item?.label}{' '}
                        </Text>
                        {item?.required ? (
                          <Text
                            style={{
                              fontSize: FONTS.FONTSIZE.SMALL,
                              fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                              color: errors[key]
                                ? COLORS.PRIMARYRED
                                : COLORS.TITLECOLOR,
                            }}>
                            *
                          </Text>
                        ) : null}
                      </View>
                      <TextInput
                        style={{
                          borderWidth: 1,
                          height: 44,
                          color: COLORS.PRIMARYBLACK,
                          borderRadius: 10,
                          paddingHorizontal: 8,
                          borderColor: errors[key]
                            ? COLORS.PRIMARYRED
                            : COLORS.INPUTBORDER,
                          fontSize: FONTS.FONTSIZE.SMALL,
                          fontFamily: FONTS.FONT_FAMILY.REGULAR,
                          backgroundColor: COLORS.PRIMARYWHITE,
                          paddingVertical: 0,
                          includeFontPadding: false,
                        }}
                        value={item?.value || ''}
                        placeholderTextColor={COLORS.PLACEHOLDERCOLOR}
                        maxLength={
                          (item?.maxLength ?? item?.maxlength ?? 0) === 0
                            ? 256
                            : item?.maxLength ?? item?.maxlength
                        }
                        placeholder={`${item.label}`}
                        onChangeText={value =>
                          handleEmail(
                            item?.name,
                            value,
                            item?.required,
                            item?.label,
                          )
                        }
                        keyboardType="email-address"
                      />
                      {errors[item?.name] && (
                        <Text
                          style={{
                            color: COLORS.PRIMARYRED,
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
                            marginTop: 4,
                          }}>
                          {errors[item?.name]}
                        </Text>
                      )}
                    </View>
                  );

                default:
                  return null;
              }
            })}
            <View style={{alignItems: 'center'}}>
              <ButtonComponent
                title={
                  isAnyUploading
                    ? 'Uploading...'
                    : isComplete
                    ? 'Please Wait...'
                    : 'Submit'
                }
                onPress={submitHandller}
                width={'45%'}
                disabled={isAnyUploading || isSubmitting?.current || isComplete}
              />
            </View>
          </ScrollView>
        ) : (
          <NoDataFound />
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default AdminEdit;
