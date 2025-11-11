import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Platform,
  TextInput,
  ScrollView,
  Modal,
  Alert,
  StyleSheet,
  TouchableWithoutFeedback,
  useWindowDimensions,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import React, {useState, useEffect, useRef, useCallback} from 'react';
import FONTS from '../../theme/Fonts';
import {Fontisto} from '@react-native-vector-icons/fontisto';
import {Entypo} from '@react-native-vector-icons/entypo';
import {Ionicons} from '@react-native-vector-icons/ionicons';
import {FontAwesome} from '@react-native-vector-icons/fontawesome';
import {capitalizeFirstLetter, NOTIFY_MESSAGE} from '../../constant/Module';
import NetInfo from '@react-native-community/netinfo';
import COLORS from '../../theme/Color';
import {useIsFocused, useNavigation} from '@react-navigation/native';
import ImagePicker from 'react-native-image-crop-picker';
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

const AdminEdit = ({editItem, isVideoGallery, isImageGallery}) => {
  const {width} = useWindowDimensions();

  const styles = StyleSheet.create({
    dropdown: {
      height: 38,
      borderWidth: 1,
      borderRadius: 10,
      backgroundColor: COLORS.PRIMARYWHITE,
      paddingHorizontal: 10,
      justifyContent: 'center',
    },
    itemContainer: {
      paddingVertical: 2,
      paddingHorizontal: 10,
    },
    itemText: {
      color: COLORS.PRIMARYBLACK,
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      fontSize: FONTS.FONTSIZE.MEDIUM,
    },
    placeholderStyle: {
      fontSize: FONTS.FONTSIZE.MINI,
      color: COLORS.PLACEHOLDERCOLOR,
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
    },
    selectedTextStyle: {
      fontSize: FONTS.FONTSIZE.MINI,
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
      backgroundColor: '#4369c3',
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
      fontSize: FONTS.FONTSIZE.MEDIUM,
    },
  });

  const navigation = useNavigation();
  const [formData, setFormData] = useState({});
  const [datePickerVisible, setDatePickerVisible] = useState({});
  const [passwordVisible, setPasswordVisible] = useState({});
  const [errors, setErrors] = useState({});
  const [modalVisible, setModalVisible] = useState({});

  const [selectedDate, setSelectedDate] = useState({});
  const [selectedTime, setSelectedTime] = useState({});

  const [timePickerVisible, setTimePickerVisible] = useState({});
  const [activeButton, setActiveButton] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadComplete, setUploadComplete] = useState(false);
  const [isComplete, setIsCopmlete] = useState(false);

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
            (parsedContent[key].name === 'member' ||
              parsedContent[key].name === 'eventCoordinator')
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

  const togglePasswordVisibility = key => {
    setPasswordVisible(prevState => ({
      ...prevState,
      [key]: !prevState[key],
    }));
  };

  const ImageSelectModal = ({
    visible,
    onClose,
    isVideoGallery,
    isImageGallery,
    onSelect,
    item,
  }) => {
    const handleSelectCamera = () => {
      ImagePicker.openCamera({
        width: 300,
        height: 400,
      })
        .then(response => {
          const totalSize = response?.size;

          const fileSizeInMB = totalSize / (1024 * 1024);

          if (fileSizeInMB > 30) {
            Alert.alert(
              'Invalid File Size',
              'File size cannot be greater than 30MB. Please choose a smaller file.',
              [
                {
                  text: 'OK',
                  onPress: () =>
                    setModalVisible(prev => ({
                      ...prev,
                      [item?.name]: true,
                    })),
                },
              ],
            );
          } else {
            onSelect(response);
            onClose();
          }
        })
        .catch(err => {
          if (err.code === 'E_PICKER_CANCELLED') {
          } else {
            NOTIFY_MESSAGE(err?.message || err ? 'Something Went Wrong' : null);
          }
        });
    };

    const handleSelectGallery = () => {
      ImagePicker.openPicker({
        mediaType: isVideoGallery ? 'video' : 'photo',
        multiple: item?.multiple == 'true' || item?.multiple ? true : false,
      })
        .then(response => {
          const files = Array.isArray(response) ? response : [response];

          const validFiles = files.filter(file => {
            const totalSize = file?.size;
            const fileSizeInMB = totalSize / (1024 * 1024);
            if (fileSizeInMB > 30) {
              Alert.alert(
                'Invalid File Size',
                'File size cannot be greater than 30MB. Please choose a smaller file.',
                [
                  {
                    text: 'OK',
                    onPress: () =>
                      setModalVisible(prev => ({
                        ...prev,
                        [item?.name]: true,
                      })),
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
        })
        .catch(err => {
          if (err.code === 'E_PICKER_CANCELLED') {
          } else {
            NOTIFY_MESSAGE(err?.message || err ? 'Something Went Wrong' : null);
          }
        });
    };

    return (
      <Modal transparent={true} visible={visible} animationType="slide">
        <TouchableWithoutFeedback onPress={onClose}>
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

  const handleNumberChange = (key, value, isRequired, name, label) => {
    const numericValue = value.replace(/[^0-9]/g, '');

    setFormData(prevState => ({
      ...prevState,
      [key]: {
        ...prevState[key],
        value: numericValue,
      },
    }));

    const isValueEmpty = numericValue.trim() === '';
    let isLengthInvalid = false;
    let isAllZeros = /^0+$/.test(numericValue);
    if (
      name === 'contact' ||
      name === 'phoneNumber' ||
      name === 'coordinateNumber' ||
      name === 'contactnumber' ||
      name === 'eventcoordinatornumber'
    ) {
      isLengthInvalid = numericValue.length !== 10;
    } else if (name === 'age') {
      isLengthInvalid = numericValue.length < 1 || numericValue.length > 3;
    } else if (name === 'zIP') {
      isLengthInvalid = numericValue.length !== 5;
    }

    setErrors(prevErrors => {
      const updatedErrors = {...prevErrors};

      if (isRequired) {
        if (isValueEmpty) {
          updatedErrors[key] = `${label} is required.`;
        } else if (isLengthInvalid) {
          if (
            name === 'contact' ||
            name === 'phoneNumber' ||
            name === 'coordinateNumber' ||
            name === 'contactnumber' ||
            name === 'eventcoordinatornumber'
          ) {
            updatedErrors[key] = `${label} must be 10 digits.`;
          } else if (name === 'age') {
            updatedErrors[key] = `${label} must be between 1 and 3 digits.`;
          } else if (name === 'zIP') {
            updatedErrors[key] = `${label} must be exactly 5 digits.`;
          }
        } else if (
          isAllZeros &&
          (name === 'contact' ||
            name === 'phoneNumber' ||
            name === 'coordinateNumber' ||
            name === 'contactnumber' ||
            name === 'eventcoordinatornumber' ||
            name === 'age')
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
              (name === 'contact' ||
                name === 'phoneNumber' ||
                name === 'coordinateNumber' ||
                name === 'contactnumber' ||
                name === 'eventcoordinatornumber' ||
                name === 'age')))
        ) {
          if (
            name === 'contact' ||
            name === 'phoneNumber' ||
            name === 'coordinateNumber' ||
            name === 'contactnumber' ||
            name === 'eventcoordinatornumber'
          ) {
            if (isLengthInvalid) {
              updatedErrors[key] = `${label} must be 10 digits.`;
            } else {
              updatedErrors[key] = `${label} cannot be all zeros.`;
            }
          } else if (name === 'age') {
            if (isLengthInvalid) {
              updatedErrors[key] = `${label} must be between 1 and 3 digits.`;
            } else {
              updatedErrors[key] = `${label} cannot be all zeros.`;
            }
          } else if (name === 'zIP') {
            updatedErrors[key] = `${label} must be exactly 5 digits.`;
          }
        } else {
          delete updatedErrors[key];
        }
      }

      return updatedErrors;
    });
  };

  const handleCounterChange = (key, value, isRequired, name, label) => {
    const currentValue = Number(formData[key]?.value) || 0;
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
        name === 'numberofGuests' ||
        name === 'numberofParticipants' ||
        name === 'numberofKids'
      ) {
        isLengthInvalid = newValue < 1;
      } else if (name === 'howManyMinutes') {
        isLengthInvalid = newValue < 1 || newValue > 60;
      }

      const hasError = newValue === 0 || isLengthInvalid;

      setErrors(prevErrors => {
        if (hasError) {
          if (newValue === 0) {
            return {...prevErrors, [key]: `${label} is required.`};
          } else {
            if (
              name === 'numberofGuests' ||
              name === 'numberofParticipants' ||
              name === 'numberofKids'
            ) {
              return {...prevErrors, [key]: `${label} must be at least 1.`};
            } else if (name === 'howManyMinutes') {
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
        type == 'datetime'
          ? moment(date).format('MM/DD/YYYY h:mm A')
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

    if (isRequired && !date) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [key]: `${label} is required.`,
      }));
    }
  };

  const onTimeChange = (key, time, label, isRequired) => {
    if (time) {
      const formattedTime = moment(time).format('HH:mm A');
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

    if (isRequired && !time) {
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

    let isValid = false;

    if (Array.isArray(value)) {
      isValid = value.length > 0;
    } else if (typeof value === 'string') {
      isValid = value.trim() !== '';
    }

    if (isRequired) {
      if (!isValid) {
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

  const handlePassword = (key, value, label, isRequired) => {
    setFormData(prevFormData => ({
      ...prevFormData,
      [key]: {
        ...prevFormData[key],
        value,
      },
    }));

    const isEmpty = !value || value?.trim() === '';

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
    if (key === 'relationship') {
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
    // const unsupportedFormats = ['HEIC', 'heic', 'image/heic'];
    // const validFiles = Array.isArray(files)
    //   ? files.filter(file => {
    //       const fileExtension = file?.path?.split('.')?.pop()?.toLowerCase();
    //       if (
    //         unsupportedFormats.includes(fileExtension) ||
    //         file?.mime === 'image/heic'
    //       ) {
    //         setErrors(prevErrors => ({
    //           ...prevErrors,
    //           [key]: `${label} does not support HEIC files.`,
    //         }));
    //         Alert.alert('File not supported');
    //         return false;
    //       }
    //       return true;
    //     })
    //   : [files];
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
      const fileUri =
        Platform.OS === 'ios' ? file?.path?.replace('file://', '') : file?.path;
      const mimeType = file.mime;

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
      setActiveButton(false);
    }
  };

  const isSubmitting = useRef(false);

  const submitHandller = async () => {
    if (isSubmitting.current || isComplete) return;

    const parsedContent = JSON.parse(editItem?.content);
    const requiredFields = Object.entries(parsedContent).filter(
      ([key, item]) => item.required,
    );
    const newErrors = {};

    requiredFields.forEach(([key, item]) => {
      const value = formData[key]?.value;
      if (
        !value ||
        value == 'null' ||
        value == '[]' ||
        value?.length == 0 ||
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
          (item.name === 'contact' ||
            item.name === 'phoneNumber' ||
            item.name === 'coordinateNumber' ||
            item.name === 'eventcoordinatornumber' ||
            item.name === 'contactnumber') &&
          numericValue.length !== 10
        ) {
          newErrors[key] = `${item.label} must be 10 digits.`;
        } else if (item.name === 'zIP' && numericValue.length !== 5) {
          newErrors[key] = `${item.label} must be exactly 5 digits.`;
        } else if (
          (item.name === 'contact' ||
            item.name === 'phoneNumber' ||
            item.name === 'coordinateNumber' ||
            item.name === 'eventcoordinatornumber' ||
            item.name === 'contactnumber' ||
            item.name === 'age') &&
          isAllZeros
        ) {
          newErrors[key] = `${item.label} cannot be all zeros.`;
        }
      }
    });

    setErrors(prev => ({...prev, ...newErrors}));
    setErrors(prev => {
      Object.keys(newErrors).forEach(key => {
        if (!newErrors[key]) delete prev[key];
      });
      return prev;
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
    setIsCopmlete(true);

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
              setIsCopmlete(false);
              NOTIFY_MESSAGE(
                err?.message ? err?.message : 'Something went wrong',
              );
            })
            .finally(() => {
              isSubmitting.current = false;
              setIsCopmlete(false);
            });
        }
      } else {
        isSubmitting.current = false;
        setIsCopmlete(false);
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
      onLocationSelect: selectedLocation => {},
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
      // console.error('Dropdown search API error:', error);
    }
  }, []);

  const handleSearchChange = async (text, name) => {
    if ((name === 'member' || name === 'eventCoordinator') && text === '') {
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
    } else if ((name === 'member' || name === 'eventCoordinator') && text) {
      fetchData(text);
    }
  };

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
                          height: 38,
                          paddingVertical: 0,
                          borderRadius: 10,
                          paddingHorizontal: 8,
                          borderColor: errors[key]
                            ? COLORS.PRIMARYRED
                            : COLORS.INPUTBORDER,
                          fontSize: FONTS.FONTSIZE.MINI,
                          fontFamily: FONTS.FONT_FAMILY.REGULAR,
                        }}
                        value={item?.value || ''}
                        maxLength={item?.maxLength == 0 ? 250 : item?.maxLength}
                        placeholder={`Enter ${item.label}`}
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
                    <View key={key} style={{marginBottom: 14, gap: 4}}>
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
                          alignItems: 'center',
                          borderWidth: 1,
                          height: 38,
                          paddingVertical: 0,
                          borderRadius: 10,
                          paddingHorizontal: 8,
                          borderColor: errors[key]
                            ? COLORS.PRIMARYRED
                            : COLORS.INPUTBORDER,
                          justifyContent: 'space-between',
                          backgroundColor: COLORS.PRIMARYWHITE,
                        }}>
                        <TextInput
                          numberOfLines={1}
                          editable={false}
                          style={{
                            color: COLORS.PLACEHOLDERCOLOR,
                            fontSize: FONTS.FONTSIZE.MINI,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
                            width: '85%',
                            paddingVertical: 0,
                          }}
                          value={item?.value || ' '}
                          maxLength={
                            item?.maxLength == 0 ? 250 : item?.maxLength
                          }
                          placeholder={`Enter ${item.label}`}
                          placeholderTextColor={COLORS.PLACEHOLDERCOLOR}
                          onChangeText={value =>
                            handleInputChange(item?.name, value)
                          }
                          keyboardType="default"
                        />
                        <TouchableOpacity
                          onPress={() => {
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
                      <Dropdown
                        onChangeText={txt => {
                          handleSearchChange(txt, item?.name);
                        }}
                        search={
                          (editItem?.contentType === 'RSVP' &&
                            item?.name === 'member') ||
                          (editItem?.contentType == 'FAMILY MEMBER' &&
                            item?.name === 'member')
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
                          styles.dropdown,
                          {
                            borderColor: errors[item?.key]
                              ? COLORS.PRIMARYRED
                              : COLORS.INPUTBORDER,
                          },
                        ]}
                        maxHeight={200}
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
                          onPress={() => {
                            Keyboard.dismiss();
                            setModalVisible(prev => ({
                              ...prev,
                              [item?.name]: true,
                            }));
                          }}
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
                              let imageUris = [];

                              try {
                                const parsedValue = JSON.parse(
                                  formData[item?.name]?.value,
                                );

                                imageUris = Array.isArray(parsedValue)
                                  ? parsedValue
                                  : [parsedValue];
                              } catch (error) {
                                imageUris = [formData[item?.name]?.value];
                              }

                              return imageUris.map((uri, index) => (
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
                                        defaultSource={require('../../assets/images/Image_placeholder.png')}
                                        source={{
                                          uri: uri ? IMAGE_URL + uri : null,
                                          cache:
                                            FastImage.cacheControl.immutable,
                                          priority: FastImage.priority.normal,
                                        }}
                                        resizeMode="cover"
                                        style={styles.image}
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
                          height: 38,
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
                            fontSize: FONTS.FONTSIZE.MINI,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
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
                          height: 38,
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
                            fontSize: FONTS.FONTSIZE.MINI,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
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
                            onPress={() =>
                              handleCheckboxSelect(
                                key,
                                checkboxItem.value,
                                item?.required,
                                item?.label,
                              )
                            }>
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
                          height: 38,
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
                            fontSize: FONTS.FONTSIZE.MINI,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
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

                // case 'password':
                //   return (
                //     <View key={key} style={{marginBottom: 8, gap: 4}}>
                //       <Text
                //         style={{
                //           fontSize: FONTS.FONTSIZE.SMALL,
                //           fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                //           color: COLORS.TITLECOLOR,
                //         }}>
                //         {item?.label}{' '}
                //         {item?.required && (
                //           <Text
                //             style={{
                //               color: errors[key]
                //                 ? COLORS.PRIMARYRED
                //                 : COLORS.TITLECOLOR,
                //             }}>
                //             *
                //           </Text>
                //         )}
                //       </Text>
                //       <View
                //         style={{
                //           flexDirection: 'row',
                //           alignItems: 'center',
                //           borderWidth: 1,
                //           borderColor: errors[key]
                //             ? COLORS.PRIMARYRED
                //             : COLORS.INPUTBORDER,
                //           borderRadius: 10,
                //           justifyContent: 'space-between',
                //           paddingHorizontal: 10,
                //           backgroundColor: COLORS.PRIMARYWHITE,
                //         }}>
                //         <TextInput
                //           editable={editItem ? false : true}
                //           style={{
                //             height: 38,
                //             color: COLORS.PLACEHOLDERCOLOR,
                //             borderRadius: 10,
                //             borderColor: COLORS.INPUTBORDER,
                //             fontSize: FONTS.FONTSIZE.MINI,
                //             fontFamily: FONTS.FONT_FAMILY.REGULAR,
                //             width: '93%',
                //             paddingVertical: 0,
                //           }}
                //           maxLength={
                //             item?.maxLength == 0 ? 250 : item?.maxLength
                //           }
                //           secureTextEntry={!passwordVisible[key]}
                //           placeholder={`Enter ${item?.label}`}
                //           placeholderTextColor={COLORS.PLACEHOLDERCOLOR}
                //           value={item?.value || ' '}
                //           onChangeText={value =>
                //             handlePassword(
                //               item?.name,
                //               value,
                //               item?.label,
                //               item?.required,
                //             )
                //           }
                //         />
                //         <TouchableOpacity
                //           onPress={() => togglePasswordVisibility(key)}>
                //           <Ionicons
                //             name={passwordVisible[key] ? 'eye-off' : 'eye'}
                //             size={24}
                //             color={COLORS.TITLECOLOR}
                //           />
                //         </TouchableOpacity>
                //       </View>
                //       {errors[item?.name] && (
                //         <Text
                //           style={{
                //             color: COLORS.PRIMARYRED,
                //             fontSize: FONTS.FONTSIZE.SMALL,
                //             fontFamily: FONTS.FONT_FAMILY.REGULAR,
                //             marginTop: 4,
                //           }}>
                //           {errors[item?.name]}
                //         </Text>
                //       )}
                //     </View>
                //   );

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
                          fontSize: FONTS.FONTSIZE.MINI,
                          fontFamily: FONTS.FONT_FAMILY.REGULAR,
                          color: COLORS.PLACEHOLDERCOLOR,
                        }}
                        multiline
                        numberOfLines={4}
                        maxLength={item?.maxLength == 0 ? 250 : item?.maxLength}
                        placeholder={`Enter ${item.label}`}
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
                  return item?.name == 'numberofGuests' ||
                    item?.name == 'numberofParticipants' ||
                    item?.name == 'howManyMinutes' ||
                    item?.name == 'numberofKids' ? (
                    <>
                      <View
                        key={item?.key}
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
                                color: errors[item?.key]
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
                              // paddingVertical: 4,
                            }}>
                            <Text
                              style={{
                                fontSize: FONTS.FONTSIZE.MEDIUM,
                                color: COLORS.TITLECOLOR,
                                fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                              }}>
                              {item?.value || 0}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() =>
                              handleCounterChange(
                                item?.name,
                                1,
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
                              name={'plus'}
                              size={20}
                              color={COLORS.PRIMARYWHITE}
                            />
                          </TouchableOpacity>
                        </View>
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
                    </>
                  ) : item?.name == 'membershipamount' ||
                    item?.name == 'totalmembershipamount' ? (
                    <View key={item?.key} style={{marginBottom: 8, gap: 4}}>
                      <Text
                        style={{
                          fontSize: FONTS.FONTSIZE.MEDIUM,
                          fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
                          color: COLORS.LABELCOLOR,
                        }}>
                        {item?.name == 'membershipamount'
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
                          height: 38,
                          color: COLORS.PLACEHOLDERCOLOR,
                          fontSize: FONTS.FONTSIZE.MINI,
                          fontFamily: FONTS.FONT_FAMILY.REGULAR,
                          backgroundColor: COLORS.PRIMARYWHITE,
                          paddingVertical: 0,
                        }}
                        maxLength={item?.maxLength == 0 ? 250 : item?.maxLength}
                        placeholderTextColor={COLORS.PLACEHOLDERCOLOR}
                        keyboardType="numeric"
                        placeholder={`Enter ${item.label}`}
                        value={item?.value?.toString()}
                        onChangeText={text =>
                          handleNumberChange(
                            item?.name,
                            text,
                            item?.required,
                            item?.name,
                            item?.label,
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
                          height: 38,
                          paddingVertical: 0,
                          borderRadius: 10,
                          paddingHorizontal: 8,
                          color: COLORS.PRIMARYBLACK,
                          fontSize: FONTS.FONTSIZE.MINI,
                          fontFamily: FONTS.FONT_FAMILY.REGULAR,
                          backgroundColor: COLORS.PRIMARYWHITE,
                          paddingVertical: 0,
                        }}
                        placeholderTextColor={COLORS.PLACEHOLDERCOLOR}
                        keyboardType="number-pad"
                        placeholder={`${item.label}`}
                        value={item?.value}
                        maxLength={item?.maxLength == 0 ? 250 : item?.maxLength}
                        onChangeText={text =>
                          handleNumberChange(
                            item?.name,
                            text,
                            item?.required,
                            item?.name,
                            item?.label,
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
                          height: 38,
                          color: COLORS.PRIMARYBLACK,
                          borderRadius: 10,
                          paddingHorizontal: 8,
                          borderColor: errors[key]
                            ? COLORS.PRIMARYRED
                            : COLORS.INPUTBORDER,
                          fontSize: FONTS.FONTSIZE.MINI,
                          fontFamily: FONTS.FONT_FAMILY.REGULAR,
                          backgroundColor: COLORS.PRIMARYWHITE,
                          paddingVertical: 0,
                        }}
                        value={item?.value || ''}
                        placeholderTextColor={COLORS.PLACEHOLDERCOLOR}
                        maxLength={item?.maxLength || 256}
                        placeholder={`Enter ${item.label}`}
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
                title={isComplete ? 'Please Wait...' : 'Submit'}
                onPress={submitHandller}
                width={'45%'}
                disabled={activeButton || isSubmitting?.current || isComplete}
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
