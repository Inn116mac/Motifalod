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
import ButtonComponent from './ButtonComponent';
import {Entypo} from '@react-native-vector-icons/entypo';
import {Fontisto} from '@react-native-vector-icons/fontisto';
import {Ionicons} from '@react-native-vector-icons/ionicons';
import {FontAwesome} from '@react-native-vector-icons/fontawesome';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {capitalizeFirstLetter, NOTIFY_MESSAGE} from '../../constant/Module';
import NetInfo from '@react-native-community/netinfo';
import COLORS from '../../theme/Color';
import {useIsFocused, useNavigation} from '@react-navigation/native';
import ImagePicker from 'react-native-image-crop-picker';
import {getData, removeData, storeData} from '../../utils/Storage';
import moment from 'moment';
import Video from 'react-native-video';
import {Dropdown} from 'react-native-element-dropdown';
import {widthPercentageToDP} from 'react-native-responsive-screen';
import httpClient from '../../connection/httpClient';
import FastImage from 'react-native-fast-image';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import {IMAGE_URL} from '../../connection/Config';
import {
  AccessToken,
  GraphRequest,
  LoginManager,
  ShareDialog,
  GraphRequestManager,
} from 'react-native-fbsdk-next';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {Feather} from '@react-native-vector-icons/feather';

const APP_ID = '1173536437853030';
const APP_SECRET = '72e5b8d18e367ca47a066f5d8801e693';

const TOKEN_STORAGE_KEY = 'fb_user_access_token';
const USER_INFO_KEY = 'fb_userinfo';

export default function CustomTab({
  data,
  response1,
  isVideoGallery,
  isImageGallery,
  setModalVisible1,
  modalVisible1,
  isRsvp,
  item1,
  onChange,
  isSignupFromDashboard,
  isSignUp,
  isFromDashboard,
  onChangeEvent,
  isFromEventAdmin,
}) {
  const {width} = useWindowDimensions();

  const styles = StyleSheet.create({
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    checkbox: {
      width: 22,
      height: 22,
      borderWidth: 2,
      borderColor: COLORS.LABELCOLOR,
      borderRadius: 6,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
    checkboxChecked: {
      backgroundColor: '#F26904',
      borderColor: '#F26904',
    },
    label: {
      marginLeft: 8,
      color: COLORS.LABELCOLOR,
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
      fontSize: FONTS.FONTSIZE.SMALL,
    },
    dropdown: {
      height: 38,
      borderWidth: 1,
      borderRadius: 10,
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
      fontSize: FONTS.FONTSIZE.EXTRASMALL,
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
      marginBottom: 20,
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
  });

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

  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState(0);

  const [formData, setFormData] = useState({});

  const [datePickerVisible, setDatePickerVisible] = useState({});

  const [selectedDate, setSelectedDate] = useState({});
  const [passwordVisible, setPasswordVisible] = useState({});
  const [errors, setErrors] = useState({});

  const [modalVisible, setModalVisible] = useState({});

  const [imageUris, setImageUris] = useState({});

  const [timePickerVisible, setTimePickerVisible] = useState({});
  const [selectedTime, setSelectedTime] = useState({});
  const [userData, setUserData] = useState(null);

  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadComplete, setUploadComplete] = useState({});

  const [activeButton, setActiveButton] = useState(false);
  const [isComplete, setIsCopmlete] = useState(false);
  const [newData, setNewData] = useState([]);

  useEffect(() => {
    if (data?.length > 0) {
      setNewData(data);
    }
  }, [data]);

  const ImageSelectModal = ({
    visible,
    onClose,
    onSelect,
    isVideoGallery,
    isImageGallery,
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
                      [item?.key]: true,
                    })),
                },
              ],
            );
          } else {
            const existingFiles = imageUris[item?.key] || [];

            const updatedFiles = [...existingFiles, response.path];

            setImageUris(prev => ({...prev, [item?.key]: updatedFiles}));
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
        multiple:
          (item?.multiple == 'true' || item?.multiple) && isImageGallery
            ? true
            : false,
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
                        [item?.key]: true,
                      })),
                  },
                ],
              );
              return false;
            }
            return true;
          });

          if (validFiles.length > 0) {
            const existingFiles = imageUris[item?.key] || [];

            const updatedFiles = [
              ...existingFiles,
              ...validFiles.map(file => file.path),
            ];

            setImageUris(prev => ({...prev, [item?.key]: updatedFiles}));

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

  const getUser = async () => {
    const user = await getData('user');
    setUserData(user);
  };
  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (!modalVisible1) {
      setUploadProgress({});
      setUploadComplete({});
      setImageUris({});
    }
  }, [modalVisible1, setModalVisible1]);

  const groupFieldsByHeader = data => {
    const grouped = [];
    let currentGroup = {header: 'general', fields: []};
    let firstHeaderFound = false;
    let headerCount = 0;

    data?.forEach(item => {
      if (item.type === 'header') {
        headerCount++;
        if (firstHeaderFound) {
          grouped.push(currentGroup);
          currentGroup = {header: item.label, fields: []};
        } else {
          currentGroup.header = item.label;
          firstHeaderFound = true;
        }
      } else {
        currentGroup.fields.push(item);
      }
    });

    if (currentGroup.fields.length > 0) {
      grouped.push(currentGroup);
    }
    grouped.headerCount = headerCount;
    return grouped;
  };

  const originalMemberValues = useRef([]);

  const groupedFields = newData?.length > 0 ? groupFieldsByHeader(newData) : [];

  const totalHeader = groupedFields?.headerCount;

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    const initialFormData = {};
    data.forEach(item => {
      if (
        item.type === 'text' ||
        item.type === 'password' ||
        item.type === 'map'
      ) {
        initialFormData[item?.key] = item?.value ? item?.value : '';
      } else if (item.type === 'radio-group') {
        const selectedOption = item?.values?.find(option => option.selected);
        initialFormData[item?.key] = selectedOption ? selectedOption.value : '';
      } else if (item.type === 'select') {
        const selectedOption = item?.values?.find(option => option.selected);
        initialFormData[item?.key] = selectedOption
          ? selectedOption.value
          : isRsvp && item?.name == 'event'
          ? item1?.eventId
          : '';

        if (item?.name === 'event') {
          const eventId = selectedOption ? selectedOption.value : null;
          setSelectedEvent(eventId);
        }
        if (item?.name === 'member') {
          const memberId = selectedOption ? selectedOption.value : null;
          setSelectedMember(memberId);
        }
        if (item?.name === 'member' || item?.name === 'eventCoordinator') {
          originalMemberValues.current = item?.values || [];
        }
      } else if (item.type === 'date') {
        const today = item?.value
          ? item?.value
          : moment(new Date()).format('MM/DD/YYYY');
        initialFormData[item.key] = today;
      } else if (item.type === 'time') {
        const today = item?.value
          ? item?.value
          : moment(new Date()).format('h:mm A');
        initialFormData[item.key] = today;
      } else if (item.type === 'datetime') {
        const today = item?.value
          ? item?.value
          : moment(new Date()).format('MM/DD/YYYY h:mm A');
        initialFormData[item.key] = today;
      } else if (item.type === 'checkbox-group') {
        const selectedOptions = item.values
          ?.filter(option => option.selected)
          ?.map(option => option.value);
        initialFormData[item?.key] =
          selectedOptions?.length > 0 ? selectedOptions.join(',') : '';
      } else if (item.type === 'dynamic-counter') {
        initialFormData[item.key] = item?.value ? item?.value : 0;
      } else if (item.type === 'textarea') {
        initialFormData[item.key] = item?.value ? item?.value : '';
      } else if (item.type === 'password') {
        initialFormData[item.key] = '';
      } else if (item.type === 'number') {
        initialFormData[item.key] = item?.value ? item?.value : 0;
      } else if (item.type === 'file') {
        initialFormData[item.key] = [];
      } else if (item.type === 'hidden') {
        initialFormData[item.key] = item?.value;
      }
      if (
        (item.className === 'form-control mobile-hide memberid' ||
          item.className === 'mobile-hide' ||
          item.className === 'form-control mobile-hide') &&
        item.type === 'radio-group'
      ) {
        const selectedOption = item?.values?.find(option => option.selected);
        initialFormData[item.key] = selectedOption?.label;
      }
    });
    setFormData(initialFormData);
  }, [data, userData]);

  const handleNumberChange = (key, value, name, isRequired, label) => {
    const numericValue = value.replace(/[^0-9]/g, '');

    setFormData(prevData => ({...prevData, [key]: numericValue}));

    const isValueEmpty = numericValue.trim() === '';
    const isAllZeros = /^0+$/.test(numericValue);
    let isLengthInvalid = false;

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

  const handleCounterChange = (key, value, isRequired, label) => {
    setFormData(prevFormData => {
      const current = parseFloat(prevFormData[key]) || 0;
      const newValue = Math.max(0, current + value);

      if (isNaN(newValue)) {
        // console.error('Invalid value detected', {key, current, value});
        return prevFormData;
      }

      return {
        ...prevFormData,
        [key]: newValue,
      };
    });
  };

  const handleCheckboxSelect = (key, value, isRequired, label) => {
    setFormData(prevFormData => {
      const currentSelections = prevFormData[key]
        ? prevFormData[key].split(',').filter(Boolean)
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
        [key]: updatedValue,
      };
    });
  };

  const onDateChange = (date, label, key, type) => {
    if (date) {
      setSelectedDate(prev => ({
        ...prev,
        [key]: date,
      }));
      const formattedDate =
        type == 'datetime'
          ? moment(date).format('MM/DD/YYYY h:mm A')
          : moment(date).format('MM/DD/YYYY');

      setFormData(prevFormData => ({
        ...prevFormData,
        [key]: formattedDate,
      }));

      setErrors(prevErrors => {
        const updatedErrors = {...prevErrors};
        delete updatedErrors[key];
        return updatedErrors;
      });
      setDatePickerVisible(prev => ({
        ...prev,
        [key]: false,
      }));
    } else {
      setErrors(prevErrors => ({
        ...prevErrors,
        [key]: `${label} is required.`,
      }));
    }
  };

  const onTimeChange = (time, label, key) => {
    if (time) {
      const formattedTime = moment(time).format('HH:mm A');
      setSelectedTime(prev => ({
        ...prev,
        [key]: time,
      }));

      setFormData(prevFormData => ({
        ...prevFormData,
        [key]: formattedTime,
      }));

      setErrors(prevErrors => {
        const updatedErrors = {...prevErrors};
        delete updatedErrors[key];
        return updatedErrors;
      });
      setTimePickerVisible(prev => ({
        ...prev,
        [key]: false,
      }));
    } else {
      setErrors(prevErrors => ({
        ...prevErrors,
        [key]: `${label} is required.`,
      }));
    }
  };

  const handleInputChange = (key, value, isRequired, label) => {
    setFormData(prevFormData => ({
      ...prevFormData,
      [key]: value,
    }));

    let isValid = false;

    if (Array.isArray(value)) {
      isValid = value.length > 0;
    } else if (typeof value === 'string') {
      isValid = value.trim() !== '';
    }
    if (isRequired) {
      setErrors(prevErrors => {
        if (!isValid) {
          return {...prevErrors, [key]: `${label} is required.`};
        } else {
          const updatedErrors = {...prevErrors};
          delete updatedErrors[key];
          return updatedErrors;
        }
      });
    }
  };

  const handleEmail = (key, value, isRequired, label) => {
    setFormData(prevData => ({...prevData, [key]: value}));

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const isValidEmail = emailRegex.test(value);

    setErrors(prevErrors => {
      const updatedErrors = {...prevErrors};

      if (isRequired) {
        if (!value || value.trim() === '') {
          updatedErrors[key] = `${label} is required.`;
        } else if (!isValidEmail) {
          updatedErrors[key] = `${label} must be valid.`;
        } else {
          delete updatedErrors[key];
        }
      } else {
        if (value && !isValidEmail) {
          updatedErrors[key] = `${label} must be valid.`;
        } else {
          delete updatedErrors[key];
        }
      }

      return updatedErrors;
    });
  };

  const handleTextArea = (key, value, isRequired, label) => {
    setFormData(prevFormData => ({
      ...prevFormData,
      [key]: value,
    }));

    if (isRequired) {
      if (value && value.trim() !== '') {
        setErrors(prevErrors => {
          const updatedErrors = {...prevErrors};
          delete updatedErrors[key];
          return updatedErrors;
        });
      } else {
        setErrors(prevErrors => ({
          ...prevErrors,
          [key]: `${label} is required.`,
        }));
      }
    }
  };

  const handlePassword = (key, value, isRequired, label) => {
    setFormData(prevFormData => ({
      ...prevFormData,
      [key]: value,
    }));

    if (isRequired) {
      if (value && value.trim() !== '') {
        setErrors(prevErrors => {
          const updatedErrors = {...prevErrors};
          delete updatedErrors[key];
          return updatedErrors;
        });
      } else {
        setErrors(prevErrors => ({
          ...prevErrors,
          [key]: `${label} is required.`,
        }));
      }
    }
  };

  const handleRadioSelect = (key, value, isRequired, label) => {
    setFormData(prevFormData => ({
      ...prevFormData,
      [key]: value,
    }));

    if (isRequired) {
      if (!value) {
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

  const handleSelectDropdown = (
    key,
    value,
    isRequired,
    label,
    name,
    isRsvp,
  ) => {
    if (value && value !== null) {
      setFormData(prevFormData => ({
        ...prevFormData,
        [key]: value,
      }));
      if (name === 'event' && value && isRsvp) {
        setSelectedEvent(value);
      }

      if (name === 'member' && value && isRsvp) {
        setSelectedMember(value);
      }

      const shouldCallApi = (eventVal, memberVal) => {
        return eventVal !== selectedEvent || memberVal !== selectedMember;
      };

      if (
        (selectedEvent &&
          name == 'member' &&
          value &&
          isRsvp &&
          userData?.role !== 'member') ||
        (selectedEvent &&
          name == 'member' &&
          value &&
          isRsvp &&
          userData?.role == 'member' &&
          isFromEventAdmin)
      ) {
        // onChangeEvent(selectedEvent, value);
        if (shouldCallApi(selectedEvent, value)) {
          onChangeEvent(selectedEvent, value);
        }
      }

      if (
        selectedMember &&
        name == 'event' &&
        value &&
        isRsvp &&
        userData?.role !== 'member'
      ) {
        // onChangeEvent(value, selectedMember);
        if (shouldCallApi(value, selectedMember)) {
          onChangeEvent(value, selectedMember);
        }
      }

      if (name == 'event' && value && isRsvp && userData?.role == 'member') {
        // onChangeEvent(value, selectedMember);
        if (shouldCallApi(value, selectedMember)) {
          onChangeEvent(value, selectedMember);
        }
      }
    }

    if (isRequired) {
      if (!value || value === null) {
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
        name: fileUri.split('/').pop(),
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

        setFormData(prevFormData => {
          const existingUrls = prevFormData[key] || [];

          const newUrls =
            isMultiple && isMultiple == 'true'
              ? [...existingUrls, ...uploadedImageUrls]
              : [uploadedImageUrls[0]];

          return {
            ...prevFormData,
            [key]: newUrls,
          };
        });

        setUploadComplete(prev => ({
          ...prev,
          [key]: true,
        }));
        NOTIFY_MESSAGE(response?.data?.message);
      } else {
        NOTIFY_MESSAGE(response?.data?.message);
        setUploadComplete(prev => ({
          ...prev,
          [key]: false,
        }));
      }
    } catch (err) {
      NOTIFY_MESSAGE(err?.message || 'Something Went Wrong');
      setUploadComplete(prev => ({
        ...prev,
        [key]: false,
      }));
    } finally {
      setUploadProgress(prev => ({
        ...prev,
        [key]: 0,
      }));
      setActiveButton(false);
    }
  };

  const validateActiveTabFields = (activeTabGroup, formData) => {
    return validateFieldsInGroup(activeTabGroup, formData);
  };

  const validateFieldsInGroup = (group, formData) => {
    const errors = {};

    group.fields.forEach(field => {
      if (field.required) {
        const value = formData[field.key];

        if (
          !value ||
          (typeof value === 'string' && value.trim() === '') ||
          value?.length == 0
        ) {
          errors[field.key] = `${field.label} is required.`;
        }
      }
    });

    return errors;
  };

  const validateCurrentTab = () => {
    const activeTabGroup = groupedFields[activeTab];
    const newErrors = validateActiveTabFields(activeTabGroup, formData);

    setErrors(prev => ({...prev, ...newErrors}));

    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors,
    };
  };

  const handleNext = () => {
    if (Object.keys(errors).length > 0) {
      const errorMessages = Object.values(errors)
        .filter(msg => msg !== null)
        .join('\n');

      if (errorMessages) {
        Alert.alert(
          'Alert',
          `Please correct following errors:\n\n${errorMessages}`,
        );
        return;
      }
    }

    const {isValid, errors: newErrors} = validateCurrentTab();

    if (!isValid) {
      const errorMessages = Object.values(newErrors)
        .filter(msg => msg !== null)
        .join('\n');

      if (errorMessages) {
        Alert.alert(
          'Alert',
          `Please correct following errors:\n\n${errorMessages}`,
        );
        return;
      }
    }

    if (activeTab < groupedFields.length - 1) {
      setActiveTab(prev => prev + 1);
    } else {
      Alert.alert('Info', 'You are on the last tab!');
    }
  };

  const isSubmitting = useRef(false);

  const handleTabClick = index => {
    if (activeTab === index) return;

    if (Object.keys(errors).length > 0) {
      const errorMessages = Object.values(errors)
        .filter(msg => msg !== null)
        .join('\n');

      if (errorMessages) {
        Alert.alert(
          'Alert',
          `Please correct following errors:\n\n${errorMessages}`,
        );
        return;
      }
    }

    const {isValid, errors: newErrors} = validateCurrentTab();

    if (!isValid) {
      const errorMessages = Object.values(newErrors)
        .filter(msg => msg !== null)
        .join('\n');

      if (errorMessages) {
        Alert.alert(
          'Alert',
          `Please correct following errors:\n\n${errorMessages}`,
        );
        return;
      }
    }

    setActiveTab(index);
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
    const timeoutIds = {};

    Object.entries(uploadComplete).forEach(([key, completed]) => {
      if (completed) {
        timeoutIds[key] = setTimeout(() => {
          setUploadComplete(prev => ({
            ...prev,
            [key]: false,
          }));
        }, 3000);
      }
    });

    return () => {
      Object.values(timeoutIds).forEach(clearTimeout);
    };
  }, [uploadComplete, isFocused]);

  const [location, setLocation] = useState(null);

  const handleTextInputPress = (key, required, label) => {
    navigation.navigate('MapScreen', {
      currentLocation: formData[key],
      onLocationSelect: selectedLocation => {},
      onLabelSelect: location => {
        setLocation(location);
        handleInputChange(key, location, required, label);
      },
    });
  };

  const handlePrivious = () => {
    handleTabClick(activeTab - 1);
  };

  const formattedTime = time => {
    const formatedtime = moment(time, 'HH:mm A').format('h:mm A');
    return formatedtime;
  };

  const formatDate = dateString => {
    const originalFormats = [
      'MM/DD/YYYY HH:mm:ss',
      'MM/DD/YYYY h:mm:ss A',
      'MM/DD/YYYY h:mm:ss',
      'DD-MM-YYYY',
      'YYYY-MM-DDTHH:mm:ss[Z]',
      'MM/DD/YYYY',
      'DD/MM/YYYY',
      'MM-DD-YYYY',
    ];

    const isValidDate = originalFormats.some(format =>
      moment(dateString, format, true).isValid(),
    );

    if (isValidDate) {
      const date = moment(dateString, originalFormats, true).utc();
      return date.format('YYYY-MM-DDTHH:mm:ss[Z]');
    } else {
      const date = moment(dateString, originalFormats, true).utc();
      return date.format('YYYY-MM-DDTHH:mm:ss[Z]');
    }
  };

  const [currentLengths, setCurrentLengths] = useState({});
  const [colors, setColors] = useState([
    COLORS.PRIMARYGREEN,
    COLORS.PRIMARYRED,
    COLORS.PRIMARYORANGE,
  ]);

  // const handleDeleteImage = (key, uri) => {
  //   setFormData(prevFormData => ({
  //     ...prevFormData,
  //     [key]: prevFormData[key].filter(imageUri => imageUri !== uri),
  //   }));
  // };

  const handleDeleteImage = (key, index) => {
    setFormData(prevFormData => {
      const updatedArray = [...(prevFormData[key] || [])];
      updatedArray.splice(index, 1);
      return {
        ...prevFormData,
        [key]: updatedArray,
      };
    });

    setImageUris(prevImageUris => {
      const updatedArray = [...(prevImageUris[key] || [])];
      updatedArray.splice(index, 1);
      return {
        ...prevImageUris,
        [key]: updatedArray,
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
          const checkboxValues = response.data.result.map(i => ({
            label: i.name,
            value: i.id,
          }));
          const combinedValues = [
            ...originalMemberValues.current,
            ...checkboxValues,
          ];
          const uniqueValues = Array.from(
            new Map(combinedValues.map(item => [item.value, item])).values(),
          );

          setNewData(prevFields =>
            prevFields.map(field => {
              if (
                field.type === 'select' &&
                (field.name === 'member' || field.name === 'eventCoordinator')
              ) {
                return {...field, values: uniqueValues};
              }
              return field;
            }),
          );
        } else {
          setNewData(prevFields =>
            prevFields.map(field => {
              if (
                field.type === 'select' &&
                (field.name === 'member' || field.name === 'eventCoordinator')
              ) {
                return {...field, values: originalMemberValues.current};
              }
              return field;
            }),
          );
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
      setNewData(prevFields =>
        prevFields.map(field => {
          if (
            field.type === 'select' &&
            (field.name === 'member' || field.name === 'eventCoordinator')
          ) {
            return {...field, values: originalMemberValues.current};
          }
          return field;
        }),
      );
    } else if ((name === 'member' || name === 'eventCoordinator') && text) {
      fetchData(text);
    }
  };

  const [userToken, setUserToken] = useState(null);
  const [syncWithFacebook, setSyncWithFacebook] = useState(false);
  const [pages, setPages] = useState([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState(null);
  const [showNoPagesMessage, setShowNoPagesMessage] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  const fetchPages = async token => {
    setLoadingPages(true);
    try {
      const response = await fetch(
        `https://graph.facebook.com/me/accounts?access_token=${token}`,
      );
      const result = await response.json();
      if (result?.error) {
        if (result.error.code === 190) {
          Alert.alert(
            'Session expired',
            'Your Facebook session has expired. Please log in again.',
          );
          await logout();
          return;
        } else {
          Alert.alert(
            'Error fetching pages',
            result.error.message || 'Unknown error',
          );
          setPages([]);
          setSyncWithFacebook(false);
          setShowNoPagesMessage(false);
          return;
        }
      }

      if (result?.data?.length > 0) {
        setPages(result.data);
        setShowNoPagesMessage(false);
      } else {
        setPages([]);
        setSyncWithFacebook(false);
        setShowNoPagesMessage(true);
      }
    } catch (error) {
      Alert.alert('Error fetching pages', error.message || 'Unknown error');
      setPages([]);
      setSyncWithFacebook(false);
      setShowNoPagesMessage(false);
    } finally {
      setLoadingPages(false);
    }
  };

  const onToggleSync = async () => {
    if (!userToken) {
      const result = await LoginManager.logInWithPermissions([
        'public_profile',
        'email',
        'pages_show_list',
        'pages_manage_posts',
        // 'pages_read_engagement',
        // 'pages_manage_metadata',
        // 'business_management',

        // 'openid',
        // 'user_photos',
        // 'user_videos',
      ]);

      if (result.isCancelled) {
        Alert.alert('Login cancelled');
        return;
      }
      const data = await AccessToken.getCurrentAccessToken();
      if (data) {
        const token = data.accessToken.toString();
        await storeData(TOKEN_STORAGE_KEY, token); // Persist token
        setUserToken(token);
        fetchPages(token);
        setSyncWithFacebook(true);
        // getUserInfo(token);
      } else {
        Alert.alert('Failed to get access token');
      }
    } else {
      // setSyncWithFacebook(prev => !prev);
      setSyncWithFacebook(prevSync => {
        const newSync = !prevSync;

        if (!newSync) {
          setSelectedPageId(null);
        } else if (newSync && pages.length === 0) {
          fetchPages(userToken);
        }

        return newSync;
      });
    }
  };

  const getUserInfo = token => {
    const infoRequest = new GraphRequest(
      '/me',
      {
        accessToken: token,
        parameters: {
          fields: {
            string: 'id,name,email,picture.type(large)',
          },
        },
      },
      async (error, result) => {
        if (error) {
          Alert.alert(
            'Error fetching user info',
            'Your session may have expired. Please log in again.',
          );
          await logout();
        } else {
          setUserInfo(result);
          await storeData(USER_INFO_KEY, JSON.stringify(result));
        }
      },
    );
    new GraphRequestManager().addRequest(infoRequest).start();
  };

  const getUserInfoFromStorage = async () => {
    try {
      const jsonValue = await getData(USER_INFO_KEY);
      const jsonValue1 = jsonValue != null ? JSON.parse(jsonValue) : null;

      setUserInfo(jsonValue1);
    } catch (e) {
      setUserInfo(null);
    }
  };

  const checkTokenValidity = async token => {
    try {
      const appAccessToken = `${APP_ID}|${APP_SECRET}`;
      const url = `https://graph.facebook.com/debug_token?input_token=${token}&access_token=${appAccessToken}`;
      const res = await fetch(url);
      const json = await res.json();

      if (json.data && json.data.is_valid) {
        const currentTime = Math.floor(Date.now() / 1000);

        // If expires_at is 0, treat as non-expiring token
        if (json.data.expires_at === 0) {
          return true;
        }

        // Otherwise check expires_at timestamp
        if (json.data.expires_at && json.data.expires_at > currentTime) {
          return true;
        }

        // Optionally check data_access_expires_at if needed
        if (
          json.data.data_access_expires_at &&
          json.data.data_access_expires_at > currentTime
        ) {
          return true;
        }

        return false;
      }
      return false;
    } catch (error) {
      // console.error('Error checking token validity:', error);
      return false;
    }
  };

  useEffect(() => {
    (async () => {
      const token = await getData(TOKEN_STORAGE_KEY);
      if (token && (await checkTokenValidity(token))) {
        setUserToken(token);
        // getUserInfoFromStorage();
      } else {
        setUserToken(null);
      }
    })();
  }, []);

  const logout = async () => {
    await removeData(TOKEN_STORAGE_KEY);
    setUserToken(null);
    setPages([]);
    setUserInfo(null);
    setSyncWithFacebook(false);
  };

  const handleFBLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {},
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            LoginManager.logOut();
            await logout();
          },
        },
      ],
      {cancelable: true},
    );
  };

  const uploadMediaToFacebook = async ({
    accessToken, // user or page access token
    pageId = null, // null for profile upload, else page ID
    files, // string URI or array of URIs
    mediaType = 'photo', // 'photo' or 'video'
    caption = '', // for photos
    title = '', // for videos
    description = '', // for videos
  }) => {
    // Normalize files array
    const fileUris = Array.isArray(files) ? files : [files];

    const endpointBase = pageId
      ? `https://graph.facebook.com/${pageId}`
      : `https://graph.facebook.com/me`;

    const uploadSingle = async uri => {
      const endpoint =
        mediaType === 'photo'
          ? `${endpointBase}/photos`
          : `${endpointBase}/videos`;

      const formData = new FormData();

      if (mediaType === 'photo') {
        formData.append('caption', caption);
        formData.append('source', {
          uri,
          name: uri.split('/').pop() || 'photo.jpg',
          type: 'image/jpeg',
        });
      } else {
        formData.append('title', title);
        formData.append('description', description);
        formData.append('source', {
          uri,
          name: uri.split('/').pop() || 'video.mp4',
          type: 'video/mp4',
        });
      }

      formData.append('access_token', accessToken);

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const json = await response.json();

      if (json.error) {
        throw new Error(json.error.message);
      }

      return json;
    };

    // Upload files sequentially and collect results
    const results = [];
    for (const fileUri of fileUris) {
      const result = await uploadSingle(fileUri);
      results.push(result);
    }

    return results; // Array of upload results
  };

  const submitHandller = () => {
    if (isSubmitting.current || isComplete) return;

    const requiredFields = data.filter(item => item.required);

    const newErrors = {};

    requiredFields.forEach(item => {
      const value = formData[item?.key];

      if (
        !value ||
        (typeof value === 'string' && value.trim() === '') ||
        value?.length == 0
      ) {
        newErrors[item?.key] = `${item?.label} is required.`;
      } else {
        newErrors[item?.key] = null;
      }
    });

    const updatedErrors = {...errors};

    Object.keys(newErrors).forEach(key => {
      if (newErrors[key] === null) {
        if (updatedErrors[key] && updatedErrors[key] === newErrors[key]) {
          delete updatedErrors[key];
        }
      } else {
        updatedErrors[key] = newErrors[key];
      }
    });

    setErrors(updatedErrors);

    if (Object.values(updatedErrors).some(error => error !== null)) {
      const errorMessages = Object.entries(updatedErrors)
        .filter(([key, value]) => value !== null)
        .map(([key, value]) => value);

      const errorMessage = errorMessages.join('\n');
      alert(`Please correct the following errors:\n\n${errorMessage}`);
      return;
    }

    const fileItems = data.filter(item => item.type === 'file');
    // const allMediaUris = [];

    // fileItems.forEach(item => {
    //   const filesForKey = imageUris[item.key] || [];
    //   allMediaUris.push(...filesForKey);
    // });

    // if (allMediaUris.length === 0) {
    //   Alert.alert('No Media', 'Please add some media before sharing');
    //   return;
    // }

    if (
      syncWithFacebook &&
      (isImageGallery || isVideoGallery) &&
      fileItems.length > 0 &&
      !selectedPageId
    ) {
      alert('Please select a Facebook Page to upload media.');
      return;
    }

    isSubmitting.current = true;
    setIsCopmlete(true);
    const content = {};

    data.forEach(item => {
      content[item.name] = {
        label: item.label,
        subtype: item.subtype,
        type: item.type,
        value: formData[item.key] || null,
      };
    });

    const apiPayload = {
      moduleId: response1?.moduleId,
      keys: JSON.stringify(data.map(item => item.name)),
      content: JSON.stringify(content),
      contentType: response1?.constantName,
    };

    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        httpClient
          .post(`module/configuration/create?isMobile=true`, apiPayload)
          .then(async response => {
            if (response.data.status) {
              if (
                syncWithFacebook &&
                (isImageGallery || isVideoGallery) &&
                fileItems.length > 0
              ) {
                for (const item of fileItems) {
                  const filesForKey = imageUris[item.key] || [];
                  if (filesForKey.length > 0) {
                    try {
                      if (!selectedPageId) {
                        throw new Error(
                          'Facebook Page must be selected to upload media',
                        );
                      }
                      const tokenToUse = pages.find(
                        p => p.id === selectedPageId,
                      )?.access_token;

                      const results = await uploadMediaToFacebook({
                        accessToken: tokenToUse,
                        pageId: selectedPageId,
                        files: filesForKey,
                        mediaType: isVideoGallery ? 'video' : 'photo',
                        caption: '', //for image
                        title: '',
                        description: '', //for video
                      });
                    } catch (uploadErr) {
                      NOTIFY_MESSAGE('Failed to upload media to Facebook.');
                      console.error('Upload failed:', uploadErr);
                    }
                  }
                }
                NOTIFY_MESSAGE(response?.data?.message);
              } else {
                NOTIFY_MESSAGE(response?.data?.message);
              }
              // if (
              //   syncWithFacebook &&
              //   (isImageGallery || isVideoGallery) &&
              //   allMediaUris.length > 0
              // ) {
              //   await shareToPersonalProfile(allMediaUris);
              //   NOTIFY_MESSAGE(response?.data?.message);
              // } else {
              //   NOTIFY_MESSAGE(response?.data?.message);
              // }

              if (isFromEventAdmin) {
                navigation.goBack();
              } else if (
                response1?.constantName == 'SIGN UP' &&
                isSignupFromDashboard
              ) {
                navigation.navigate('Dashboard');
              } else if (response1?.constantName == 'SIGN UP') {
                navigation.navigate('Login');
              } else if (isImageGallery || isVideoGallery) {
                if (isFromDashboard) {
                  setModalVisible1(false);
                  onChange(true);
                } else {
                  navigation.navigate('Dashboard');
                }
              } else {
                navigation.navigate('Dashboard');
              }
            } else {
              NOTIFY_MESSAGE(
                response?.data?.message
                  ? response?.data?.message
                  : 'Something went wrong',
              );
            }
          })
          .catch(err => {
            isSubmitting.current = false;
            setIsCopmlete(false);
            NOTIFY_MESSAGE(err || err?.message ? 'Something went wrong' : null);
          })
          .finally(() => {
            isSubmitting.current = false;
            setIsCopmlete(false);
          });
      } else {
        isSubmitting.current = false;
        setIsCopmlete(false);
        NOTIFY_MESSAGE('Please check your internet connectivity');
      }
    });
  };

  return (
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? undefined : 'height'}>
      <View style={{flex: 1}}>
        <View>
          <ScrollView
            contentContainerStyle={{flexGrow: 1}}
            horizontal
            showsHorizontalScrollIndicator={false}>
            <View style={{flexDirection: 'row', marginBottom: 0}}>
              {groupedFields?.map((item, index) => {
                return (
                  totalHeader > 0 && (
                    <TouchableOpacity
                      activeOpacity={0.6}
                      key={index}
                      style={{
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderBottomWidth: activeTab === index ? 2 : 0,
                        borderBottomColor: COLORS.TITLECOLOR,
                        paddingHorizontal: 8,
                        borderBottomLeftRadius: 20,
                        borderBottomRightRadius: 20,
                      }}
                      onPress={() => handleTabClick(index)}>
                      <Text
                        style={{
                          fontSize: FONTS.FONTSIZE.SEMIMINI,
                          fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
                          color:
                            activeTab === index
                              ? COLORS.TITLECOLOR
                              : COLORS.INACTIVETAB,
                          textAlign: 'center',
                        }}>
                        {item?.header ? item?.header : 'general'}
                      </Text>
                    </TouchableOpacity>
                  )
                );
              })}
            </View>
          </ScrollView>
        </View>

        <View
          style={{
            flex: 1,
            marginHorizontal: 16,
            marginTop: 16,
            overflow: 'hidden',
            borderColor: COLORS.PRIMARYWHITE,
          }}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={true}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: keyboardOpen && Platform.OS == 'android' ? 84 : 0,
            }}>
            {groupedFields[activeTab]?.fields?.map((item, index) => {
              switch (
                item?.subtype !== null
                  ? item.subtype
                  : item?.type
                  ? item?.type
                  : 'text'
              ) {
                case 'text':
                  return (
                    <View key={item?.key} style={{marginBottom: 8, gap: 4}}>
                      <View
                        style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Text
                          style={{
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                            color: COLORS.TITLECOLOR,
                          }}>
                          {capitalizeFirstLetter(item?.label)}{' '}
                        </Text>
                        {item?.required ? (
                          <Text
                            style={{
                              fontSize: FONTS.FONTSIZE.SMALL,
                              fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                              color: errors[item?.key]
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
                          paddingVertical: 0,
                          borderRadius: 10,
                          paddingHorizontal: 8,
                          color: COLORS.PRIMARYBLACK,
                          borderColor: errors[item?.key]
                            ? COLORS.PRIMARYRED
                            : COLORS.INPUTBORDER,
                          fontSize: FONTS.FONTSIZE.MINI,
                          fontFamily: FONTS.FONT_FAMILY.REGULAR,
                          backgroundColor: COLORS.PRIMARYWHITE,
                        }}
                        value={formData[item?.key]}
                        maxLength={item?.maxLength == 0 ? 250 : item?.maxLength}
                        placeholder={`${item.label}`}
                        placeholderTextColor={COLORS.PLACEHOLDERCOLOR}
                        onChangeText={value => {
                          setCurrentLengths(prev => ({
                            ...prev,
                            [item?.key]: value.length,
                          }));

                          handleInputChange(
                            item?.key,
                            value,
                            item?.required,
                            item?.label,
                          );
                        }}
                        keyboardType="default"
                      />
                      {(() => {
                        const max =
                          item?.maxLength === 0 ? 250 : item?.maxLength;
                        const currentLength = currentLengths[item?.key] || 0;
                        return currentLength > max ? (
                          <Text
                            style={{
                              color: COLORS.PRIMARYRED,
                              fontSize: FONTS.FONTSIZE.SMALL,
                              fontFamily: FONTS.FONT_FAMILY.REGULAR,
                              textAlign: 'right',
                            }}>
                            Maximum length is {max} characters.
                          </Text>
                        ) : null;
                      })()}
                      {errors[item?.key] && (
                        <Text
                          style={{
                            color: COLORS.PRIMARYRED,
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
                            marginTop: 4,
                          }}>
                          {errors[item?.key]}
                        </Text>
                      )}
                    </View>
                  );

                case 'map':
                  return (
                    <View key={item?.key} style={{marginBottom: 8, gap: 4}}>
                      <View
                        style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Text
                          style={{
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                            color: COLORS.TITLECOLOR,
                          }}>
                          {capitalizeFirstLetter(item?.label)}{' '}
                        </Text>
                        {item?.required ? (
                          <Text
                            style={{
                              fontSize: FONTS.FONTSIZE.SMALL,
                              fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                              color: errors[item?.key]
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
                          borderColor: errors[item?.key]
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
                          value={formData[item?.key] || location}
                          maxLength={250}
                          placeholder={`${item.label}`}
                          placeholderTextColor={COLORS.PLACEHOLDERCOLOR}
                          onChangeText={value =>
                            handleInputChange(
                              item?.key,
                              value,
                              item?.required,
                              item?.label,
                            )
                          }
                          keyboardType="default"
                        />
                        <TouchableOpacity
                          onPress={() => {
                            handleTextInputPress(
                              item?.key,
                              item?.required,
                              item?.label,
                            );
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
                      {errors[item?.key] && (
                        <Text
                          style={{
                            color: COLORS.PRIMARYRED,
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
                            marginTop: 4,
                          }}>
                          {errors[item?.key]}
                        </Text>
                      )}
                    </View>
                  );

                case 'radio-group':
                  return item.className ===
                    'form-control mobile-hide memberid' ||
                    item.className === 'mobile-hide' ||
                    item.className === 'form-control mobile-hide' ? null : (
                    <View
                      key={item?.key}
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
                          {capitalizeFirstLetter(item?.label)}{' '}
                        </Text>
                        {item?.required && (
                          <Text
                            style={{
                              fontSize: FONTS.FONTSIZE.SMALL,
                              fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                              color: errors[item?.key]
                                ? COLORS.PRIMARYRED
                                : COLORS.TITLECOLOR,
                            }}>
                            *
                          </Text>
                        )}
                      </View>
                      <FlatList
                        data={item?.values}
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(radioItem, index) =>
                          `${item?.key}-${index}`
                        }
                        horizontal={true}
                        contentContainerStyle={{gap: 10}}
                        renderItem={({item: radioItem, index}) =>
                          isRsvp && item?.name == 'selectyourResponse' ? (
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                              }}>
                              <TouchableOpacity
                                activeOpacity={0.3}
                                style={{}}
                                onPress={() =>
                                  handleRadioSelect(
                                    item?.key,
                                    radioItem.value,
                                    item?.required,
                                    item?.label,
                                  )
                                }>
                                {formData[item?.key] === radioItem.value ? (
                                  <Text
                                    style={{
                                      fontSize: FONTS.FONTSIZE.SMALL,
                                      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                                      color: COLORS.PRIMARYWHITE,
                                      backgroundColor: COLORS.grey500,
                                      paddingVertical: 4,
                                      borderRadius: 6,
                                      width: widthPercentageToDP(22),
                                      textAlign: 'center',
                                    }}>
                                    {radioItem.label}
                                  </Text>
                                ) : (
                                  <Text
                                    style={{
                                      fontSize: FONTS.FONTSIZE.SMALL,
                                      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                                      color: COLORS.PRIMARYWHITE,
                                      backgroundColor:
                                        colors[index % colors.length],
                                      paddingVertical: 4,
                                      borderRadius: 6,
                                      width: widthPercentageToDP(22),
                                      textAlign: 'center',
                                    }}>
                                    {radioItem.label}
                                  </Text>
                                )}
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <TouchableOpacity
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                              }}
                              onPress={() =>
                                handleRadioSelect(
                                  item?.key,
                                  radioItem.value,
                                  item?.required,
                                  item?.label,
                                )
                              }>
                              {formData[item?.key] === radioItem.value ? (
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
                                  top: 2,
                                }}>
                                {radioItem.label}
                              </Text>
                            </TouchableOpacity>
                          )
                        }
                      />
                      {errors[item?.key] && (
                        <Text
                          style={{
                            color: COLORS.PRIMARYRED,
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
                            marginTop: 4,
                          }}>
                          {errors[item?.key]}
                        </Text>
                      )}
                      {isRsvp && item?.name == 'selectyourResponse' ? (
                        <View
                          style={{
                            borderBottomWidth: 1,
                            marginTop: 10,
                            borderBottomColor: COLORS.INPUTBORDER,
                          }}
                        />
                      ) : null}
                    </View>
                  );

                case 'select':
                  return (item.className ===
                    'form-control mobile-hide memberid' ||
                    item.className === 'mobile-hide' ||
                    item.className === 'form-control mobile-hide') &&
                    (((item?.name == 'member' ||
                      item?.name == 'eventCoordinator') &&
                      userData?.role == 'member' &&
                      !isFromEventAdmin) ||
                      isSignUp) ? null : isRsvp && item?.name === 'event' ? (
                    <View
                      style={{
                        marginBottom: 10,
                      }}>
                      {item1?.name && (
                        <Text
                          style={{
                            fontSize: FONTS.FONTSIZE.MEDIUMLARGE,
                            fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                            color: COLORS.TITLECOLOR,
                          }}>
                          {item1?.name ? item1?.name : null}
                        </Text>
                      )}
                      {item1?.location && (
                        <Text
                          style={{
                            fontSize: FONTS.FONTSIZE.SEMIMINI,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
                            color: COLORS.PLACEHOLDERCOLOR,
                          }}>
                          {item1?.location ? item1?.location : null}
                        </Text>
                      )}
                      {(item1?.date || item1?.time) && (
                        <Text
                          style={{
                            fontSize: FONTS.FONTSIZE.SEMIMINI,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
                            color: COLORS.PLACEHOLDERCOLOR,
                          }}>
                          {item1?.date || item1?.time
                            ? `${moment(formatDate(item1?.date)).format(
                                'DD MMMM YYYY',
                              )} @ ${formattedTime(item1.time)}`
                            : null}
                        </Text>
                      )}
                      <View
                        style={{
                          borderBottomWidth: 1,
                          marginTop: 10,
                          borderBottomColor: COLORS.INPUTBORDER,
                        }}
                      />
                    </View>
                  ) : (
                    <View
                      key={item?.key}
                      style={{marginBottom: 8, gap: 4, position: 'relative'}}>
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
                              color: errors[item?.key]
                                ? COLORS.PRIMARYRED
                                : COLORS.TITLECOLOR,
                            }}>
                            *
                          </Text>
                        )}
                      </Text>
                      <Dropdown
                        autoScroll={false}
                        data={
                          item?.values?.length > 0
                            ? item?.values
                            : [{label: 'No Data Available', value: null}]
                        }
                        inputSearchStyle={{
                          color: COLORS.PRIMARYBLACK,
                          fontSize: FONTS.FONTSIZE.EXTRASMALL,
                        }}
                        search
                        searchPlaceholder="Search..."
                        labelField="label"
                        valueField="value"
                        value={formData[item?.key]}
                        onChange={item1 => {
                          handleSelectDropdown(
                            item.key,
                            item1.value,
                            item.required,
                            item?.label,
                            item?.name,
                            response1?.constantName?.toLowerCase() === 'rsvp',
                          );
                        }}
                        onChangeText={txt => {
                          handleSearchChange(txt, item?.name);
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
                      {errors[item?.key] && (
                        <Text
                          style={{
                            color: COLORS.PRIMARYRED,
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
                            marginTop: 4,
                          }}>
                          {errors[item?.key]}
                        </Text>
                      )}
                    </View>
                  );

                case 'file':
                  return (item.className ===
                    'form-control mobile-hide memberid' ||
                    item.className === 'mobile-hide' ||
                    item.className === 'form-control mobile-hide') &&
                    userData?.role == 'member' ? null : (
                    <View key={item?.key} style={{marginBottom: 8, gap: 4}}>
                      <View
                        style={{flexDirection: 'row', alignItems: 'center'}}>
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
                                color: errors[item?.key]
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
                          disabled={activeButton}
                          title={
                            isVideoGallery ? 'Upload Video' : 'Upload Image'
                          }
                          width={'50%'}
                          onPress={() => {
                            Keyboard.dismiss();
                            if (formData[item?.key]?.length >= 6) {
                              Alert.alert(
                                `Maximum ${
                                  isImageGallery ? 'Images' : 'Videos'
                                } Reached`,
                                `You can only upload a maximum of 6 ${
                                  isImageGallery ? 'images' : 'videos'
                                }.`,
                                [{text: 'OK'}],
                              );
                              return;
                            }
                            setModalVisible(prev => ({
                              ...prev,
                              [item?.key]: true,
                            }));
                          }}
                        />
                        {uploadComplete[item?.key] && (
                          <Text
                            numberOfLines={2}
                            style={{
                              color: COLORS.PRIMARYBLACK,
                              fontSize: FONTS.FONTSIZE.MEDIUM,
                              fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                            }}>
                            Upload complete!
                          </Text>
                        )}
                      </View>
                      {uploadProgress[item?.key] > 0 &&
                        imageUris[item?.key] &&
                        formData[item?.key] &&
                        !uploadComplete[item?.key] && (
                          <View style={{marginTop: 10}}>
                            <Text
                              style={{
                                fontSize: FONTS.FONTSIZE.EXTRASMALL,
                                fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                                color: COLORS.TITLECOLOR,
                              }}>
                              Uploading: {uploadProgress[item?.key]}%
                            </Text>
                            <ProgressBar progress={uploadProgress[item?.key]} />
                          </View>
                        )}
                      {formData[item?.key] &&
                        formData[item?.key].length > 0 && (
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}>
                            <ScrollView
                              horizontal
                              showsHorizontalScrollIndicator={false}>
                              {formData[item?.key].map((uri, index) => (
                                <View key={index} style={{margin: 5}}>
                                  {isVideoGallery ? (
                                    <View style={{}}>
                                      {/* <Video
                                        source={{uri: IMAGE_URL + uri}}
                                        style={styles.video}
                                        controls={false}
                                        resizeMode="cover"
                                        repeat={false}
                                        paused={false}
                                        muted={true}
                                      /> */}
                                      <FastImage
                                        defaultSource={require('../../assets/images/Video_placeholder.png')}
                                        source={{
                                          uri: IMAGE_URL + uri,
                                          priority: FastImage.priority.normal,
                                        }}
                                        style={styles.video}
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
                                          handleDeleteImage(item?.key, index)
                                        }>
                                        <Entypo
                                          name="circle-with-minus"
                                          size={26}
                                          color={COLORS.PRIMARYRED}
                                        />
                                      </TouchableOpacity>
                                    </View>
                                  ) : (
                                    <View style={{}}>
                                      <FastImage
                                        source={{
                                          uri: IMAGE_URL + uri,
                                          cache:
                                            FastImage.cacheControl.immutable,
                                          priority: FastImage.priority.normal,
                                        }}
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
                                          handleDeleteImage(item?.key, index)
                                        }>
                                        <Entypo
                                          name="circle-with-minus"
                                          size={26}
                                          color={COLORS.PRIMARYRED}
                                        />
                                      </TouchableOpacity>
                                    </View>
                                  )}
                                </View>
                              ))}
                            </ScrollView>
                          </View>
                        )}
                      {modalVisible[item?.key] && (
                        <ImageSelectModal
                          visible={modalVisible[item?.key]}
                          onClose={() =>
                            setModalVisible(prev => ({
                              ...prev,
                              [item?.key]: false,
                            }))
                          }
                          isVideoGallery={isVideoGallery}
                          isImageGallery={isImageGallery}
                          onSelect={media =>
                            handleFileChange(
                              item?.key,
                              media,
                              item?.label,
                              item?.required,
                              item?.multiple,
                            )
                          }
                          item={item}
                        />
                      )}
                      {errors[item?.key] && (
                        <Text
                          style={{
                            color: COLORS.PRIMARYRED,
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
                            marginTop: 4,
                          }}>
                          {errors[item?.key]}
                        </Text>
                      )}
                    </View>
                  );

                case 'date':
                  return (
                    <View key={item?.key} style={{marginBottom: 8, gap: 4}}>
                      <Text
                        style={{
                          fontSize: FONTS.FONTSIZE.SMALL,
                          color: COLORS.TITLECOLOR,
                          fontFamily: FONTS.FONT_FAMILY.MEDIUM,
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
                        )}
                      </Text>

                      <TouchableOpacity
                        style={{
                          borderWidth: 1,
                          height: 38,
                          paddingVertical: 0,
                          borderRadius: 10,
                          paddingHorizontal: 8,
                          justifyContent: 'center',
                          borderColor: errors[item?.key]
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
                            [item?.key]: true,
                          }));
                        }}>
                        <Text
                          style={{
                            color: formData[item?.key]
                              ? COLORS.PRIMARYBLACK
                              : COLORS.PLACEHOLDERCOLOR,
                            fontSize: FONTS.FONTSIZE.MINI,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
                          }}>
                          {formData[item?.key] || 'Select Date'}
                        </Text>
                        <MaterialDesignIcons
                          name="calendar-month-outline"
                          size={25}
                          color={COLORS.PLACEHOLDERCOLOR}
                        />
                      </TouchableOpacity>

                      {datePickerVisible[item?.key] && (
                        <DateTimePickerModal
                          isVisible={datePickerVisible[item?.key]}
                          mode="date"
                          display="inline"
                          onConfirm={date =>
                            onDateChange(
                              date,
                              item?.label,
                              item?.key,
                              item?.type,
                            )
                          }
                          onCancel={() =>
                            setDatePickerVisible(prev => ({
                              ...prev,
                              [item?.key]: false,
                            }))
                          }
                          date={selectedDate[item?.key] || new Date()}
                        />
                      )}
                      {errors[item?.key] && (
                        <Text
                          style={{
                            color: COLORS.PRIMARYRED,
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
                            marginTop: 4,
                          }}>
                          {errors[item?.key]}
                        </Text>
                      )}
                    </View>
                  );

                case 'datetime':
                  return item.className ===
                    'form-control mobile-hide memberid' ||
                    item.className === 'mobile-hide' ||
                    item.className === 'form-control mobile-hide' ? null : (
                    <View key={item?.key} style={{marginBottom: 8, gap: 4}}>
                      <Text
                        style={{
                          fontSize: FONTS.FONTSIZE.SMALL,
                          color: COLORS.TITLECOLOR,
                          fontFamily: FONTS.FONT_FAMILY.MEDIUM,
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
                        )}
                      </Text>

                      <TouchableOpacity
                        style={{
                          borderWidth: 1,
                          height: 38,
                          paddingVertical: 0,
                          borderRadius: 10,
                          paddingHorizontal: 8,
                          justifyContent: 'center',
                          borderColor: errors[item?.key]
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
                            [item?.key]: true,
                          }));
                        }}>
                        <Text
                          style={{
                            color: formData[item?.key]
                              ? COLORS.PRIMARYBLACK
                              : COLORS.PLACEHOLDERCOLOR,
                            fontSize: FONTS.FONTSIZE.MINI,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
                          }}>
                          {formData[item?.key] || 'Select Date-Time'}
                        </Text>
                        <MaterialDesignIcons
                          name="calendar-month-outline"
                          size={25}
                          color={COLORS.PLACEHOLDERCOLOR}
                        />
                      </TouchableOpacity>

                      {datePickerVisible[item?.key] && (
                        <DateTimePickerModal
                          isVisible={datePickerVisible[item?.key]}
                          mode="datetime"
                          display="inline"
                          onConfirm={date =>
                            onDateChange(
                              date,
                              item?.label,
                              item?.key,
                              item?.type,
                            )
                          }
                          onCancel={() =>
                            setDatePickerVisible(prev => ({
                              ...prev,
                              [item?.key]: false,
                            }))
                          }
                          date={selectedDate[item?.key] || new Date()}
                        />
                      )}
                      {errors[item?.key] && (
                        <Text
                          style={{
                            color: COLORS.PRIMARYRED,
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
                            marginTop: 4,
                          }}>
                          {errors[item?.key]}
                        </Text>
                      )}
                    </View>
                  );

                case 'checkbox-group':
                  return (
                    <View key={item?.key} style={{marginBottom: 8, gap: 4}}>
                      <View
                        style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Text
                          style={{
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                            color: COLORS.TITLECOLOR,
                          }}>
                          {capitalizeFirstLetter(item?.label)}{' '}
                        </Text>
                        {item?.required ? (
                          <Text
                            style={{
                              fontSize: FONTS.FONTSIZE.SMALL,
                              fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                              color: errors[item?.key]
                                ? COLORS.PRIMARYRED
                                : COLORS.TITLECOLOR,
                            }}>
                            *
                          </Text>
                        ) : null}
                      </View>

                      {item?.values?.length > 0 ? (
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
                                item?.key,
                                checkboxItem.value,
                                item?.required,
                                item?.label,
                              )
                            }>
                            {formData[item?.key]
                              ?.split(',')
                              ?.includes(String(checkboxItem.value)) ? (
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
                        ))
                      ) : (
                        <Text
                          style={{
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
                            color: COLORS.PRIMARYRED,
                          }}>
                          Please Select Member to get Family Members list.
                        </Text>
                      )}
                      {errors[item.key] && (
                        <Text
                          style={{
                            color: COLORS.PRIMARYRED,
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
                            marginTop: 4,
                          }}>
                          {errors[item.key]}
                        </Text>
                      )}
                    </View>
                  );

                case 'time':
                  return (
                    <View key={item?.key} style={{marginBottom: 8, gap: 4}}>
                      <Text
                        style={{
                          fontSize: FONTS.FONTSIZE.SMALL,
                          color: COLORS.TITLECOLOR,
                          fontFamily: FONTS.FONT_FAMILY.MEDIUM,
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
                        )}
                      </Text>

                      <TouchableOpacity
                        style={{
                          borderWidth: 1,
                          height: 38,
                          paddingVertical: 0,
                          borderRadius: 10,
                          paddingHorizontal: 8,
                          justifyContent: 'center',
                          borderColor: errors[item?.key]
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
                            [item?.key]: true,
                          }));
                        }}>
                        <Text
                          style={{
                            color: formData[item?.key]
                              ? COLORS.PRIMARYBLACK
                              : COLORS.PLACEHOLDERCOLOR,
                            fontSize: FONTS.FONTSIZE.MINI,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
                          }}>
                          {formData[item?.key] || 'Select Time'}
                        </Text>
                        <MaterialDesignIcons
                          name="calendar-month-outline"
                          size={25}
                          color={COLORS.PLACEHOLDERCOLOR}
                        />
                      </TouchableOpacity>

                      {/* {timePickerVisible[item?.key] && Platform.OS === 'ios' && (
                      <Modal
                        transparent={true}
                        animationType="slide"
                        visible={timePickerVisible[item?.key]}
                        onRequestClose={() => {
                          setTimePickerVisible(prev => ({
                            ...prev,
                            [item?.key]: false,
                          }));
                        }}>
                        <View
                          style={{
                            flex: 1,
                            justifyContent: 'center',
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            alignItems: 'center',
                          }}>
                          <TouchableWithoutFeedback
                            onPress={() => {
                              setTimePickerVisible(prev => ({
                                ...prev,
                                [item?.key]: false,
                              }));
                            }}>
                            <View
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                              }}
                            />
                          </TouchableWithoutFeedback>
                          <View
                            style={{
                              backgroundColor: COLORS.PRIMARYWHITE,
                              padding: 18,
                              borderRadius: 10,
                              width: '80%',
                              maxHeight: '50%',
                              overflow: 'hidden',
                            }}>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: 20,
                              }}>
                              <Text
                                style={{
                                  color: COLORS.PRIMARYBLACK,
                                  textAlign: 'center',
                                  fontSize: FONTS.FONTSIZE.LARGE,
                                  fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
                                }}>
                                Select Time
                              </Text>
                              <TouchableOpacity
                                onPress={() => {
                                  setTimePickerVisible(prev => ({
                                    ...prev,
                                    [item?.key]: false,
                                  }));
                                }}>
                                <AntDesign name="closecircle" size={24} />
                              </TouchableOpacity>
                            </View>

                            <DateTimePicker
                              value={selectedTime[item?.key] || new Date()}
                              mode="time"
                              display="spinner"
                              textColor={COLORS.PRIMARYBLACK}
                              onChange={(event, time) =>
                                onTimeChange(
                                  event,
                                  time,
                                  item?.label,
                                  item?.key,
                                )
                              }
                            />
                          </View>
                        </View>
                      </Modal>
                    )} */}

                      {timePickerVisible[item?.key] && (
                        <DateTimePickerModal
                          isVisible={timePickerVisible[item?.key]}
                          mode="time"
                          display={Platform.OS == 'ios' ? 'spinner' : 'inline'}
                          onConfirm={time =>
                            onTimeChange(time, item?.label, item?.key)
                          }
                          onCancel={() =>
                            setTimePickerVisible(prev => ({
                              ...prev,
                              [item?.key]: false,
                            }))
                          }
                          date={selectedTime[item?.key] || new Date()}
                        />
                      )}
                      {errors[item?.key] && (
                        <Text
                          style={{
                            color: COLORS.PRIMARYRED,
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
                            marginTop: 4,
                          }}>
                          {errors[item?.key]}
                        </Text>
                      )}
                    </View>
                  );

                case 'password':
                  return (
                    <View key={item?.key} style={{marginBottom: 8, gap: 4}}>
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
                              color: errors[item?.key]
                                ? COLORS.PRIMARYRED
                                : COLORS.TITLECOLOR,
                            }}>
                            *
                          </Text>
                        )}
                      </Text>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          borderWidth: 1,
                          borderColor: errors[item?.key]
                            ? COLORS.PRIMARYRED
                            : COLORS.INPUTBORDER,
                          borderRadius: 10,
                          justifyContent: 'space-between',
                          paddingHorizontal: 6,
                          backgroundColor: COLORS.PRIMARYWHITE,
                        }}>
                        <TextInput
                          style={{
                            color: COLORS.PRIMARYBLACK,
                            borderRadius: 10,
                            borderColor: COLORS.INPUTBORDER,
                            fontSize: FONTS.FONTSIZE.MINI,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
                            paddingVertical: 0,
                            flex: 1,
                            height: 38,
                          }}
                          secureTextEntry={!passwordVisible[item?.key]}
                          placeholder={`${item?.label}`}
                          placeholderTextColor={COLORS.PLACEHOLDERCOLOR}
                          value={formData[item?.key]}
                          onChangeText={value => {
                            setCurrentLengths(prev => ({
                              ...prev,
                              [item?.key]: value.length,
                            }));
                            handlePassword(
                              item?.key,
                              value,
                              item?.required,
                              item?.label,
                            );
                          }}
                          maxLength={
                            item?.maxLength == 0 ? 250 : item?.maxLength
                          }
                        />
                        <TouchableOpacity
                          onPress={() =>
                            setPasswordVisible(prev => ({
                              ...prev,
                              [item?.key]: !prev[item?.key],
                            }))
                          }>
                          <Ionicons
                            name={
                              !passwordVisible[item?.key] ? 'eye-off' : 'eye'
                            }
                            size={24}
                            color={COLORS.TITLECOLOR}
                          />
                        </TouchableOpacity>
                      </View>
                      {(() => {
                        const max =
                          item?.maxLength === 0 ? 250 : item?.maxLength;
                        const currentLength = currentLengths[item?.key] || 0;
                        return currentLength > max ? (
                          <Text
                            style={{
                              color: COLORS.PRIMARYRED,
                              fontSize: FONTS.FONTSIZE.SMALL,
                              fontFamily: FONTS.FONT_FAMILY.REGULAR,
                              textAlign: 'right',
                            }}>
                            Maximum length is {max} characters.
                          </Text>
                        ) : null;
                      })()}
                      {errors[item?.key] && (
                        <Text
                          style={{
                            color: COLORS.PRIMARYRED,
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
                            marginTop: 4,
                          }}>
                          {errors[item?.key]}
                        </Text>
                      )}
                    </View>
                  );

                case 'textarea':
                  return (
                    <View key={item?.key} style={{marginBottom: 8, gap: 4}}>
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
                              color: errors[item?.key]
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
                          borderColor: errors[item?.key]
                            ? COLORS.PRIMARYRED
                            : COLORS.INPUTBORDER,
                          borderRadius: 10,
                          padding: 10,
                          height: 100,
                          textAlignVertical: 'top',
                          fontSize: FONTS.FONTSIZE.MINI,
                          fontFamily: FONTS.FONT_FAMILY.REGULAR,
                          color: COLORS.PRIMARYBLACK,
                          backgroundColor: COLORS.PRIMARYWHITE,
                        }}
                        multiline
                        numberOfLines={4}
                        maxLength={
                          item?.maxLength == 0 ? 1000 : item?.maxLength
                        }
                        placeholder={`${item.label}`}
                        placeholderTextColor={COLORS.PLACEHOLDERCOLOR}
                        value={formData[item?.key]}
                        onChangeText={value => {
                          setCurrentLengths(prev => ({
                            ...prev,
                            [item?.key]: value.length,
                          }));
                          handleTextArea(
                            item?.key,
                            value,
                            item?.required,
                            item?.label,
                          );
                        }}
                      />
                      {(() => {
                        const max =
                          item?.maxLength === 0 ? 1000 : item?.maxLength;
                        const currentLength = currentLengths[item?.key] || 0;
                        return currentLength > max ? (
                          <Text
                            style={{
                              color: COLORS.PRIMARYRED,
                              fontSize: FONTS.FONTSIZE.SMALL,
                              fontFamily: FONTS.FONT_FAMILY.REGULAR,
                              textAlign: 'right',
                            }}>
                            Maximum length is {max} characters.
                          </Text>
                        ) : null;
                      })()}
                      {errors[item?.key] && (
                        <Text
                          style={{
                            color: COLORS.PRIMARYRED,
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
                            marginTop: 4,
                          }}>
                          {errors[item?.key]}
                        </Text>
                      )}
                    </View>
                  );

                case 'number':
                  return (item.className ===
                    'form-control mobile-hide memberid' ||
                    item.className === 'mobile-hide' ||
                    item.className === 'form-control mobile-hide') &&
                    (isSignUp ||
                      userData?.role == 'member') ? null : item?.name ==
                      'numberofGuests' ||
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
                                item?.key,
                                -1,
                                item?.required,
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
                              {formData[item?.key] ?? 0}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() =>
                              handleCounterChange(
                                item?.key,
                                1,
                                item?.required,
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
                      {errors[item?.key] && (
                        <Text
                          style={{
                            color: COLORS.PRIMARYRED,
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
                            marginTop: 4,
                          }}>
                          {errors[item?.key]}
                        </Text>
                      )}
                    </>
                  ) : (
                    <View key={item?.key} style={{marginBottom: 8, gap: 4}}>
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
                              color: errors[item?.key]
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
                          borderColor: errors[item?.key]
                            ? COLORS.PRIMARYRED
                            : COLORS.INPUTBORDER,
                          borderRadius: 10,
                          padding: 10,
                          height: 38,
                          color: COLORS.PRIMARYBLACK,
                          fontSize: FONTS.FONTSIZE.MINI,
                          fontFamily: FONTS.FONT_FAMILY.REGULAR,
                          backgroundColor: COLORS.PRIMARYWHITE,
                          paddingVertical: 0,
                        }}
                        maxLength={item?.maxLength == 0 ? 250 : item?.maxLength}
                        placeholderTextColor={COLORS.PLACEHOLDERCOLOR}
                        keyboardType="number-pad"
                        placeholder={`${item.label}`}
                        value={formData[item?.key]}
                        onChangeText={value => {
                          setCurrentLengths(prev => ({
                            ...prev,
                            [item?.key]: value.length,
                          }));
                          handleNumberChange(
                            item?.key,
                            value,
                            item?.name,
                            item?.required,
                            item?.label,
                          );
                        }}
                      />
                      {errors[item?.key] && (
                        <Text
                          style={{
                            color: COLORS.PRIMARYRED,
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
                            marginTop: 4,
                          }}>
                          {errors[item?.key]}
                        </Text>
                      )}
                    </View>
                  );

                case 'tel':
                  return (
                    <View key={item?.key} style={{marginBottom: 8, gap: 4}}>
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
                              color: errors[item?.key]
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
                          borderColor: errors[item?.key]
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
                        value={formData[item?.key]}
                        maxLength={item?.maxLength == 0 ? 250 : item?.maxLength}
                        onChangeText={value => {
                          setCurrentLengths(prev => ({
                            ...prev,
                            [item?.key]: value.length,
                          }));
                          handleNumberChange(
                            item?.key,
                            value,
                            item?.name,
                            item?.required,
                            item?.label,
                          );
                        }}
                      />

                      {errors[item?.key] && (
                        <Text
                          style={{
                            color: COLORS.PRIMARYRED,
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
                            marginTop: 4,
                          }}>
                          {errors[item?.key]}
                        </Text>
                      )}
                    </View>
                  );

                case 'email':
                  return (
                    <View key={item?.key} style={{marginBottom: 8, gap: 4}}>
                      <View
                        style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Text
                          style={{
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                            color: COLORS.TITLECOLOR,
                          }}>
                          {capitalizeFirstLetter(item?.label)}{' '}
                        </Text>
                        {item?.required ? (
                          <Text
                            style={{
                              fontSize: FONTS.FONTSIZE.SMALL,
                              fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                              color: errors[item?.key]
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
                          paddingVertical: 0,
                          borderRadius: 10,
                          paddingHorizontal: 8,
                          color: COLORS.PRIMARYBLACK,
                          borderColor: errors[item?.key]
                            ? COLORS.PRIMARYRED
                            : COLORS.INPUTBORDER,
                          fontSize: FONTS.FONTSIZE.MINI,
                          fontFamily: FONTS.FONT_FAMILY.REGULAR,
                          backgroundColor: COLORS.PRIMARYWHITE,
                        }}
                        value={formData[item?.key]}
                        placeholderTextColor={COLORS.PLACEHOLDERCOLOR}
                        maxLength={
                          item?.maxLength === 0 ? 250 : item?.maxLength
                        }
                        placeholder={`${item.label}`}
                        onChangeText={value => {
                          setCurrentLengths(prev => ({
                            ...prev,
                            [item?.key]: value.length,
                          }));
                          handleEmail(
                            item?.key,
                            value,
                            item?.required,
                            item?.label,
                          );
                        }}
                        keyboardType="email-address"
                      />
                      {(() => {
                        const max =
                          item?.maxLength === 0 ? 250 : item?.maxLength;
                        const currentLength = currentLengths[item?.key] || 0;
                        return currentLength > max ? (
                          <Text
                            style={{
                              color: COLORS.PRIMARYRED,
                              fontSize: FONTS.FONTSIZE.SMALL,
                              fontFamily: FONTS.FONT_FAMILY.REGULAR,
                              textAlign: 'right',
                            }}>
                            Maximum length is {max} characters.
                          </Text>
                        ) : null;
                      })()}
                      {errors[item?.key] && (
                        <Text
                          style={{
                            color: COLORS.PRIMARYRED,
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.REGULAR,
                            marginTop: 4,
                          }}>
                          {errors[item?.key]}
                        </Text>
                      )}
                    </View>
                  );

                default:
                  return null;
              }
            })}

            {(isImageGallery || isVideoGallery) && (
              <>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginVertical: 4,
                  }}>
                  <TouchableOpacity
                    onPress={onToggleSync}
                    style={styles.checkboxContainer}>
                    <View
                      style={[
                        styles.checkbox,
                        syncWithFacebook && styles.checkboxChecked,
                      ]}
                      activeOpacity={0.7}>
                      {syncWithFacebook && (
                        <FontAwesome6
                          iconStyle="solid"
                          name="check"
                          size={16}
                          color={'#fff'}
                        />
                      )}
                    </View>
                    <Text style={styles.label}>Share with Facebook?</Text>
                  </TouchableOpacity>
                  {userToken && (
                    <TouchableOpacity
                      onPress={handleFBLogout}
                      style={{marginLeft: 12, padding: 4}}
                      activeOpacity={0.7}>
                      <Ionicons
                        name="log-out-outline"
                        size={22}
                        color="#F26904"
                      />
                    </TouchableOpacity>
                  )}
                </View>
                {/* {userInfo && (
                  <View
                    style={{
                      backgroundColor: '#1877F2',
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      justifyContent: 'space-between',
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderRadius: 10,
                    }}>
                    <Text
                      style={{
                        color: COLORS.PRIMARYWHITE,
                        fontSize: FONTS.FONTSIZE.SMALL,
                        fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                      }}>
                      {userInfo?.name || 'User'}
                    </Text>
                  </View>
                )} */}

                {/* {userInfo && syncWithFacebook && <ShareIconComponent />} */}

                {showNoPagesMessage && (
                  <View style={{marginTop: 0}}>
                    <Text
                      style={{
                        fontStyle: 'italic',
                        color: '#666',
                        fontSize: FONTS.FONTSIZE.SEMIMINI,
                      }}>
                      You need to have at least one Facebook Page to enable
                      syncing.
                    </Text>
                  </View>
                )}

                {syncWithFacebook && (
                  <>
                    {loadingPages ? (
                      <View style={{marginTop: 2}}>
                        <Text
                          style={{
                            fontStyle: 'italic',
                            color: '#666',
                            textAlign: 'center',
                            fontSize: FONTS.FONTSIZE.SEMIMINI,
                          }}>
                          Please Wait...
                        </Text>
                      </View>
                    ) : pages.length > 0 ? (
                      <View style={{marginTop: 2}}>
                        <Text
                          style={{
                            fontSize: FONTS.FONTSIZE.SEMIMINI,
                            fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
                            color: COLORS.PRIMARYBLACK,
                          }}>
                          Select Facebook Page:
                        </Text>
                        {pages.map(page => (
                          <TouchableOpacity
                            key={page.id}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              padding: 6,
                              backgroundColor:
                                selectedPageId === page.id
                                  ? COLORS.LABELCOLOR
                                  : '#d3d3d3b8',
                              marginVertical: 4,
                              borderRadius: 6,
                            }}
                            onPress={() => {
                              if (selectedPageId === page.id) {
                                setSelectedPageId(null);
                              } else {
                                setSelectedPageId(page.id);
                              }
                            }}
                            activeOpacity={0.7}>
                            <Feather
                              name={
                                selectedPageId === page.id
                                  ? 'check-square'
                                  : 'square'
                              }
                              size={20}
                              color={
                                selectedPageId === page.id ? '#fff' : '#444'
                              }
                            />
                            <Text
                              numberOfLines={2}
                              style={{
                                marginLeft: 6,
                                color:
                                  selectedPageId === page.id ? '#fff' : '#000',
                                fontSize: FONTS.FONTSIZE.MINI,
                                fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                              }}>
                              {page.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : null}
                  </>
                )}
              </>
            )}

            <View style={{alignItems: 'center', marginTop: 'auto'}}>
              {response1?.constantName == 'SIGN UP' &&
                !isSignupFromDashboard && (
                  <TouchableOpacity
                    style={{width: '100%'}}
                    onPress={() => {
                      navigation.navigate('Login');
                    }}>
                    <Text
                      style={{
                        fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                        fontSize: FONTS.FONTSIZE.SEMI,
                        textAlign: 'center',
                        color: COLORS.TITLECOLOR,
                      }}>
                      Already Have an account?
                      <Text
                        style={{
                          fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                          fontSize: FONTS.FONTSIZE.SEMI,
                          textAlign: 'center',
                          color: COLORS.TITLECOLOR,
                          textDecorationLine: 'underline',
                        }}>
                        Login
                      </Text>
                    </Text>
                  </TouchableOpacity>
                )}
              {activeTab < groupedFields.length - 1 ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                  }}>
                  {activeTab == 0 ? (
                    <ButtonComponent
                      title="Next"
                      onPress={handleNext}
                      disabled={activeButton}
                    />
                  ) : (
                    <>
                      <ButtonComponent
                        title="Previous"
                        onPress={handlePrivious}
                        width={'45%'}
                        disabled={activeButton}
                      />
                      <ButtonComponent
                        title="Next"
                        onPress={handleNext}
                        width={'45%'}
                        disabled={activeButton}
                      />
                    </>
                  )}
                </View>
              ) : (
                <ButtonComponent
                  title={
                    isComplete
                      ? 'Please Wait...'
                      : response1?.constantName == 'SIGN UP'
                      ? 'Sign Up'
                      : 'Submit'
                  }
                  onPress={submitHandller}
                  disabled={
                    isSubmitting.current ||
                    isComplete ||
                    ((isVideoGallery || isImageGallery) && activeButton)
                  }
                />
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
