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
  Dimensions,
  KeyboardAvoidingView,
  Keyboard,
  Image,
} from 'react-native';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {AntDesign} from '@react-native-vector-icons/ant-design';
import {Fontisto} from '@react-native-vector-icons/fontisto';
import {Feather} from '@react-native-vector-icons/feather';
import {Ionicons} from '@react-native-vector-icons/ionicons';
import {FontAwesome} from '@react-native-vector-icons/fontawesome';
import NetInfo from '@react-native-community/netinfo';
import {getData} from '../utils/Storage';
import {IMAGE_URL} from '../connection/Config';
import ImagePicker from 'react-native-image-crop-picker';
import {
  capitalizeFirstLetter,
  formatPhoneToUS,
  isPhoneField,
  NOTIFY_MESSAGE,
  unformatPhone,
} from '../constant/Module';
import COLORS from '../theme/Color';
import Loader from '../components/root/Loader';
import {useIsFocused, useNavigation} from '@react-navigation/native';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import FONTS from '../theme/Fonts';
import ButtonComponent from '../components/root/ButtonComponent';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import moment from 'moment';
import Offline from '../components/root/Offline';
import {Dropdown} from 'react-native-element-dropdown';
import {useNetworkStatus} from '../connection/UseNetworkStatus';
import CustomHeader from '../components/root/CustomHeader';
import httpClient from '../connection/httpClient';
import {getFileType} from '../utils/fileType';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const Registration1 = ({route}) => {
  const {item, isFromEventAdmin} = route.params.data;

  const {width} = useWindowDimensions();
  const isFocused = useIsFocused();

  const styles = StyleSheet.create({
    dropdown: {
      height: 38,
      borderWidth: 1,
      borderRadius: 10,
      backgroundColor: COLORS.PRIMARYWHITE,
      paddingHorizontal: 10,
      justifyContent: 'center',
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
    itemContainer: {
      paddingVertical: 2,
      paddingHorizontal: 10,
    },
    itemText: {
      color: COLORS.PRIMARYBLACK,
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      fontSize: FONTS.FONTSIZE.EXTRASMALL,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    pkgLblofNumber: {
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      fontSize: FONTS.FONTSIZE.SMALL,
      textAlign: 'center',
    },
    pkgLbl: {
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      fontSize: FONTS.FONTSIZE.EXTRASMALL,
      color: COLORS.PRIMARYBLACK,
      textAlign: 'left',
      width: '48%',
    },
    pkgLbl1: {
      fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
      fontSize: FONTS.FONTSIZE.EXTRASMALL,
      color: COLORS.PRIMARYBLACK,
      textAlign: 'left',
      width: '52%',
    },
    modalContent: {
      width: width,
      backgroundColor: COLORS.PRIMARYWHITE,
      borderRadius: 10,
    },
    buttonRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    image: {
      width: 100,
      height: 100,
      borderRadius: 10,
      marginRight: 10,
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
    tabContainer: {
      flexDirection: 'row',
      marginBottom: 10,
    },
    itemAction: {
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: heightPercentageToDP('2%'),
    },
  });

  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [moduleData, setModuleData] = useState([]);

  const [memberShipDetails, setMemberShipDetails] = useState([]);
  const [memberShipLoading, setMemberShipLoading] = useState(true);

  const [response, setResponse] = useState(null);
  const [formData, setFormData] = useState([]);
  const [errors, setErrors] = useState({});
  const [errors1, setErrors1] = useState({});

  const [modalVisible, setModalVisible] = useState({});

  const [activeTab, setActiveTab] = useState(0);
  const [userData, setuserData] = useState([]);

  const [datePickerVisible, setDatePickerVisible] = useState({});
  const [timePickerVisible, setTimePickerVisible] = useState({});

  const [selectedTime, setSelectedTime] = useState({});
  const [selectedDate, setSelectedDate] = useState({});

  const [uploadProgress, setUploadProgress] = useState({});

  const [activeButton, setActiveButton] = useState(false);
  const [userData1, setUserData1] = useState(null);

  const [userValues, setUserValues] = useState([]);
  const [moduleDate1, setModuleData1] = useState(null);

  const [openIndex, setOpenIndex] = useState(null);
  const [isAddPerson, setIsAddPerson] = useState(false);
  const [currentLengths, setCurrentLengths] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [savePayLoading, setSavePayLoading] = useState(false);
  const [editedUserIndex, setEditedUserIndex] = useState(null);
  const originalMemberValues = useRef([]);
  const isSelectingRef = useRef(false);
  const isFetchingRef = useRef(false);
  const hasInitializedOriginal = useRef(false);
  const [relationshipOptions, setRelationshipOptions] = useState([]);

  const {isConnected, networkLoading} = useNetworkStatus();

  const ImageSelectModal = ({visible, onClose, onSelect, item}) => {
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
                  onPress: () => {
                    setModalVisible(prev => ({
                      ...prev,
                      [item?.key]: true,
                    }));
                  },
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
        mediaType: 'photo',
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
                    onPress: () => {
                      setModalVisible(prev => ({
                        ...prev,
                        [item?.key]: true,
                      }));
                    },
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

  const onDateChange = (headerKey, key, date, isRequired, label) => {
    let errorMessage;
    let isValid = true;

    if (date) {
      setDatePickerVisible(prev => ({
        ...prev,
        [key]: false,
      }));

      const formattedDate = moment(date).format('MM/DD/YYYY');

      setFormData(prevFormData =>
        prevFormData.map(section => {
          if (section.headerKey === headerKey) {
            if (section.isMultiple) {
              return {
                ...section,
                userData: section.userData.map(item => ({
                  ...item,
                  [key]: {
                    ...item[key],
                    value: formattedDate,
                  },
                })),
              };
            } else {
              return {
                ...section,
                headerConfig: section?.headerConfig.map(item => {
                  const itemKey = Object.keys(item)[0];
                  if (itemKey === key) {
                    return {
                      [itemKey]: {
                        ...item[itemKey],
                        value: formattedDate,
                      },
                    };
                  }
                  return item;
                }),
              };
            }
          }
          return section;
        }),
      );

      setSelectedDate(prev => ({
        ...prev,
        [key]: date,
      }));

      if (!formattedDate || formattedDate.trim() === '') {
        isValid = false;
        errorMessage = `${label} is required.`;
      }
    } else {
      isValid = false;
      if (isRequired) {
        errorMessage = `${label} is required.`;
      }
    }

    if (moduleData[activeTab]?.headerKey === 'personalInfo') {
      if (isRequired && errorMessage) {
        setErrors1(prevErrors => ({
          ...prevErrors,
          [key]: errorMessage,
        }));
      } else {
        const updatedErrors = {...errors1};
        delete updatedErrors[key];
        setErrors1(updatedErrors);
      }
    } else {
      if (isRequired && errorMessage) {
        setErrors(prevErrors => ({
          ...prevErrors,
          [key]: errorMessage,
        }));
      } else {
        const updatedErrors = {...errors};
        delete updatedErrors[key];
        setErrors(updatedErrors);
      }
    }
  };

  const onTimeChange = (headerKey, key, time, isRequired, label) => {
    let errorMessage;
    let isValid = true;

    if (time) {
      setTimePickerVisible(prev => ({
        ...prev,
        [key]: false,
      }));

      const formattedTime = moment(time).format('hh:mm A');

      setFormData(prevFormData =>
        prevFormData.map(section => {
          if (section.headerKey === headerKey) {
            if (section.isMultiple) {
              return {
                ...section,
                userData: section.userData.map(item => ({
                  ...item,
                  [key]: {
                    ...item[key],
                    value: formattedTime,
                  },
                })),
              };
            } else {
              return {
                ...section,
                headerConfig: section?.headerConfig.map(item => {
                  const itemKey = Object.keys(item)[0];
                  if (itemKey === key) {
                    return {
                      [itemKey]: {
                        ...item[itemKey],
                        value: formattedTime,
                      },
                    };
                  }
                  return item;
                }),
              };
            }
          }
          return section;
        }),
      );

      setSelectedTime(prev => ({
        ...prev,
        [key]: time,
      }));

      if (!formattedTime || formattedTime.trim() === '') {
        isValid = false;
        errorMessage = `${label} is required.`;
      }
    } else {
      isValid = false;
      if (isRequired) {
        errorMessage = `${label} is required.`;
      }
    }

    if (moduleData[activeTab]?.headerKey === 'personalInfo') {
      if (isRequired && errorMessage) {
        setErrors1(prevErrors => ({
          ...prevErrors,
          [key]: errorMessage,
        }));
      } else {
        const updatedErrors = {...errors1};
        delete updatedErrors[key];
        setErrors1(updatedErrors);
      }
    } else {
      if (isRequired && errorMessage) {
        setErrors(prevErrors => ({
          ...prevErrors,
          [key]: errorMessage,
        }));
      } else {
        const updatedErrors = {...errors};
        delete updatedErrors[key];
        setErrors(updatedErrors);
      }
    }
  };

  const getUser = async () => {
    const user = await getData('user');
    setUserData1(user);
  };

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (userValues?.length > 0 && moduleDate1.length > 0) {
      let selfMembershipAmount = null;

      const userWithMembership = userValues.find(
        user =>
          user?.membership?.value && user?.membership?.value.trim() !== '',
      );

      const userWithMembershipAmount = userValues.find(
        user =>
          user?.membershipamount?.value &&
          user?.membershipamount?.value.trim() !== '',
      );

      if (userWithMembership) {
        selfMembershipAmount = userWithMembership?.membershipamount?.value;
      } else {
        selfMembershipAmount =
          userWithMembershipAmount?.membershipamount?.value;
      }

      const initializedData = moduleDate1.map(header => {
        if (header.isMultiple) {
          const relationshipItem = header?.headerConfig?.find(
            headerItem => headerItem?.name == 'relationship',
          );

          setRelationshipOptions(relationshipItem?.values || []);

          return {...header, headerConfig: userValues};
        }

        const headerConfigInitialized = Object.values(header?.headerConfig).map(
          item => {
            let initialValue;

            if (item?.name === 'totalmembershipamount') {
              const hasMeaningfulValue =
                item?.value &&
                item.value !== null &&
                item.value !== undefined &&
                item.value.trim() !== '' &&
                item.value !== '0' &&
                item.value !== '0.00' &&
                parseFloat(item.value) !== 0;

              initialValue = hasMeaningfulValue
                ? item?.value || 0
                : selfMembershipAmount || 0;
            } else if (
              item.type === 'text' ||
              item.type === 'password' ||
              item.type === 'textarea' ||
              item.type === 'number'
            ) {
              initialValue = item?.value;
            } else if (item.type === 'radio-group') {
              const selectedOption = item?.values?.find(
                option => option.selected,
              );

              initialValue = item?.value
                ? item?.value
                : selectedOption
                ? selectedOption.value
                : null;
            } else if (item.type === 'file') {
              initialValue = item?.value;
            } else if (item.type === 'select') {
              const selectedOption = item?.values?.find(
                option => option.selected,
              );
              initialValue = item?.value
                ? item?.value
                : selectedOption
                ? selectedOption.value
                : null;
            } else if (item.type === 'calendar') {
              initialValue = item?.value;
            } else if (item.type === 'checkbox') {
              initialValue = item?.value;
            } else if (item.type === 'dynamic-counter') {
              initialValue = item?.value;
            }

            if (
              (item.className === 'form-control mobile-hide memberid' ||
                item.className === 'mobile-hide' ||
                item.className === 'form-control mobile-hide') &&
              item.type === 'select'
            ) {
              initialValue = userData1
                ? userData1?.member?.configurationId
                : null;
            }

            return {
              [item.key]: {
                ...item,
                value: initialValue,
              },
            };
          },
        );

        return {
          ...header,
          headerConfig: headerConfigInitialized,
        };
      });

      setFormData(initializedData);
    } else {
      const initializedData = moduleData.map(header => {
        if (header.isMultiple) {
          return {...header, headerConfig: []};
        }

        const headerConfigInitialized = Object.values(
          header?.headerConfig || [],
        ).map(item => {
          let initialValue;

          if (
            item.type === 'text' ||
            item.type === 'password' ||
            item.type === 'textarea' ||
            item.type === 'number'
          ) {
            initialValue = null;
          } else if (item.type === 'radio-group') {
            const selectedOption = item?.values?.find(
              option => option.selected,
            );

            initialValue = selectedOption ? selectedOption.value : null;
          } else if (item.type === 'file') {
            initialValue = null;
          } else if (item.type === 'select') {
            if (
              item.type === 'select' &&
              item.name === 'member' &&
              !hasInitializedOriginal.current
            ) {
              originalMemberValues.current = item.values;
              hasInitializedOriginal.current = true;
            }
            const selectedOption = item?.values?.find(
              option => option.selected,
            );
            initialValue = selectedOption ? selectedOption.value : null;
          } else if (item.type === 'calendar') {
            const today = moment(new Date()).format('MM/DD/YYYY');
            initialValue = today;
          } else if (item.type === 'checkbox') {
            const selectedOptions = item.values
              .filter(option => option.selected)
              .map(option => option.value);
            initialValue = selectedOptions.length > 0 ? selectedOptions : [];
          } else if (item.type === 'dynamic-counter') {
            initialValue = 0;
          }

          if (
            (item.className === 'form-control mobile-hide memberid' ||
              item.className === 'mobile-hide' ||
              item.className === 'form-control mobile-hide') &&
            item.type === 'select'
          ) {
            initialValue = userData1
              ? userData1?.member?.configurationId
              : null;
          }

          return {
            [item.key]: {
              ...item,
              value: initialValue,
            },
          };
        });

        return {
          ...header,
          headerConfig: headerConfigInitialized,
        };
      });

      setFormData(initializedData);
    }
  }, [moduleData, userData1, moduleDate1, userValues]);

  const shouldRefreshAfterPayment = useRef(false);

  useEffect(() => {
    if (userData1 && isFocused) {
      if (shouldRefreshAfterPayment.current) {
        getRegForm();
        getMemberShipDetails();
        shouldRefreshAfterPayment.current = false;
      } else {
        if (!moduleData || moduleData.length === 0) {
          getRegForm();
          getMemberShipDetails();
        }
      }
    }
  }, [userData1, isFocused]);

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

  const getRegForm = () => {
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setLoading(true);
        httpClient
          .get(
            `mobile/module/configurations/get?modulename=FAMILY%20MEMBER&moduleConfurationId=${
              userData1?.member ? userData1?.member?.configurationId : 0
            }&isMobile=true`,
          )
          .then(response => {
            const temp = JSON.parse(response?.data?.result?.configuration);

            const temp1 = response?.data?.result;
            if (
              response.data.status &&
              response.data.result &&
              temp?.length &&
              temp1
            ) {
              const filteredTemp =
                userData1.role === 'member'
                  ? temp.filter(header => header.headerKey !== 'memberDetails')
                  : temp;

              setResponse(temp1);
              setModuleData(filteredTemp);

              const personalInfoHeader = filteredTemp.find(
                header => header.headerKey === 'personalInfo',
              );

              if (personalInfoHeader) {
                setModuleData1(filteredTemp);
                setUserValues(personalInfoHeader?.userValues);

                const combinedObject = personalInfoHeader.headerConfig?.reduce(
                  (acc, item) => {
                    acc[item.key] = item;
                    return acc;
                  },
                  {},
                );
                setuserData([combinedObject]);
              }
            } else {
              NOTIFY_MESSAGE(response.data.message);
            }
          })
          .catch(err => {
            setLoading(false);
            NOTIFY_MESSAGE(err || err?.message ? 'Something Went Wrong' : null);
            navigation.navigate('Dashboard');
          })
          .finally(() => setLoading(false));
      } else {
        NOTIFY_MESSAGE('Please check your internet connectivity');
      }
    });
  };

  const extractKeys = dataArray => {
    const keys = [];
    keys.push('member', 'role', 'profilePicture');

    dataArray.forEach(item => {
      keys.push(item?.headerKey);

      if (item?.headerConfig && Array.isArray(item?.headerConfig)) {
        item?.headerConfig.forEach(config => {
          keys.push(config.key);
        });
      }
    });

    return keys;
  };

  const result = extractKeys(moduleData);

  const submitHandller = async (navigateToPayment = false) => {
    const newErrors = {};

    formData.forEach(section => {
      if (!section.isMultiple) {
        section?.headerConfig.forEach(item => {
          const fieldKey = Object.keys(item)[0];
          const fieldConfig = item[fieldKey];
          const label = fieldConfig.label || fieldKey;

          if (fieldConfig.required) {
            const value = fieldConfig.value;

            if (!value || (typeof value === 'string' && value.trim() === '')) {
              newErrors[fieldKey] = `${label} is required.`;
            } else if (fieldKey === 'emailAddress' || fieldKey === 'email') {
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(value)) {
                newErrors[fieldKey] = `${label} must be valid.`;
              }
            } else if (fieldKey === 'contact' || fieldKey === 'phoneNumber') {
              if (value.length !== 10 || !/^\d+$/.test(value)) {
                newErrors[fieldKey] = `${label} must be valid.`;
              }
            }
          }
        });
      }
    });

    setErrors(prev => {
      return {...prev, ...newErrors};
    });

    if (Object.keys(newErrors).length > 0 || Object.keys(errors).length > 0) {
      Alert.alert(
        'Validation Error',
        'Please correct the highlighted fields before proceeding.',
      );
      return;
    }

    const apiPayload = {
      moduleId: response?.moduleId,
      contentType: response?.constantName,
      keys: JSON.stringify(result),
      content: JSON.stringify(formData),
    };

    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        navigateToPayment ? setSavePayLoading(true) : setSaveLoading(true);
        httpClient
          .post(`module/configuration/create?isMobile=true`, apiPayload)
          .then(response => {
            navigateToPayment
              ? setSavePayLoading(false)
              : setSaveLoading(false);
            if (response.data.status) {
              NOTIFY_MESSAGE(response?.data?.message);
              if (isFromEventAdmin) {
                navigation.goBack();
              } else if (navigateToPayment) {
                shouldRefreshAfterPayment.current = true;
                navigation.navigate('PaymentInfoScreen', {
                  formData: formData,
                  userData: userData1?.member?.configurationId,
                  previousScreen: 'RegistrationScreen',
                });
              } else {
                navigation.navigate('Main');
              }
            } else {
              NOTIFY_MESSAGE(
                response?.data?.message
                  ? response?.data?.message
                  : 'something went wrong.',
              );
            }
          })
          .catch(err => {
            navigateToPayment
              ? setSavePayLoading(false)
              : setSaveLoading(false);
            NOTIFY_MESSAGE(err ? 'something went wrong.' : null);
          })
          .finally(() => {
            navigateToPayment
              ? setSavePayLoading(false)
              : setSaveLoading(false);
          });
      } else {
        NOTIFY_MESSAGE('Please check your internet connectivity');
      }
    });
  };

  const handleInputChange = (headerKey, key, value, isRequired, label) => {
    setFormData(prevData =>
      prevData.map(section => {
        if (section.headerKey === headerKey) {
          if (section.isMultiple) {
            setuserData(prevUser =>
              prevUser.map(item => {
                return {
                  ...item,
                  [key]: {
                    ...item[key],
                    value,
                  },
                };
              }),
            );
          } else {
            return {
              ...section,
              headerConfig: section?.headerConfig.map(item => {
                const itemKey = Object.keys(item)[0];
                return itemKey === key
                  ? {[itemKey]: {...item[itemKey], value}}
                  : item;
              }),
            };
          }
        }
        return section;
      }),
    );

    let isValid = value && value.trim() !== '';
    let errorMessage;

    if (!isValid && isRequired) {
      errorMessage = `${label} is required.`;
    }

    if (moduleData[activeTab]?.headerKey === 'personalInfo') {
      if (isRequired && errorMessage) {
        setErrors1(prevErrors => ({
          ...prevErrors,
          [key]: errorMessage,
        }));
      } else {
        const updatedErrors = {...errors1};
        delete updatedErrors[key];
        setErrors1(updatedErrors);
      }
    } else {
      if (isRequired && errorMessage) {
        setErrors(prevErrors => ({
          ...prevErrors,
          [key]: errorMessage,
        }));
      } else {
        const updatedErrors = {...errors};
        delete updatedErrors[key];
        setErrors(updatedErrors);
      }
    }
  };

  const handleCheckboxSelect = (headerKey, key, value) => {
    setFormData(prevData =>
      prevData.map(section => {
        if (section.headerKey === headerKey) {
          if (section.isMultiple) {
            setuserData(prevUser =>
              prevUser.map(item => {
                const currentSelections = item[key]?.value || [];
                const updatedSelections = currentSelections.includes(value)
                  ? currentSelections.filter(item => item !== value)
                  : [...currentSelections, value];

                return {
                  ...item,
                  [key]: {
                    ...item[key],
                    value: updatedSelections,
                  },
                };
              }),
            );
          } else {
            return {
              ...section,
              headerConfig: section?.headerConfig.map(item => {
                const itemKey = Object.keys(item)[0];
                return itemKey === key
                  ? {[itemKey]: {...item[itemKey], value}}
                  : item;
              }),
            };
          }
        }
        return section;
      }),
    );

    const errorState = value && value.trim() !== '' ? false : true;
    if (moduleData[activeTab]?.headerKey === 'personalInfo') {
      setErrors1(prevErrors => ({
        ...prevErrors,
        [key]: errorState,
      }));
    } else {
      setErrors(prevErrors => ({
        ...prevErrors,
        [key]: errorState,
      }));
    }
  };

  const handleSelectDropdown = (
    headerKey,
    key,
    value,
    totalMembershipAmount,
    name,
    isRequired,
    label,
  ) => {
    setFormData(prevData => {
      let updatedData = prevData.map(section => {
        let updatedSection = {...section};

        if (name === 'member') {
          if (section.headerKey === 'personalInfo') {
            updatedSection = {
              ...section,
              headerConfig: [],
            };
          }

          if (section.headerKey === 'memberDetails') {
            updatedSection = {
              ...section,
              headerConfig: section.headerConfig.map(item => {
                const itemKey = Object.keys(item)[0];
                if (itemKey === 'member') {
                  return {
                    [itemKey]: {
                      ...item[itemKey],
                      value: value,
                    },
                  };
                }
                return item;
              }),
            };
          }

          if (section.headerKey === 'paymentInformation') {
            updatedSection = {
              ...section,
              headerConfig: section.headerConfig.map(item => {
                const itemKey = Object.keys(item)[0];
                if (itemKey === 'totalmembershipamount') {
                  const amount =
                    totalMembershipAmount !== null
                      ? String(totalMembershipAmount)
                      : '0';
                  return {
                    [itemKey]: {
                      ...item[itemKey],
                      value: amount,
                    },
                  };
                }
                return item;
              }),
            };
          }
        } else if (section.headerKey === headerKey) {
          if (section.isMultiple) {
            setuserData(prevUser =>
              prevUser.map(item => {
                if (name === 'relationship') {
                  const selectedMembership = memberShipDetails.find(
                    item => item?.name?.toLowerCase() === value?.toLowerCase(),
                  );
                  const membershipAmount = selectedMembership
                    ? selectedMembership.price
                    : 0;

                  return {
                    ...item,
                    [key]: {
                      ...item[key],
                      value,
                    },
                    membershipamount: {
                      ...item.membershipamount,
                      value: String(membershipAmount),
                    },
                  };
                } else {
                  return {
                    ...item,
                    [key]: {
                      ...item[key],
                      value,
                    },
                  };
                }
              }),
            );
          } else {
            updatedSection = {
              ...section,
              headerConfig: section.headerConfig.map(item => {
                const itemKey = Object.keys(item)[0];
                if (itemKey === key) {
                  return {
                    [itemKey]: {
                      ...item[itemKey],
                      value: value,
                    },
                  };
                }
                return item;
              }),
            };
          }
        }

        return updatedSection;
      });

      return updatedData;
    });

    let isValid = value && value !== null;
    let errorMessage;

    if (!isValid && isRequired) {
      errorMessage = `${label} is required.`;
    }

    if (moduleData[activeTab]?.headerKey === 'personalInfo') {
      if (isRequired && errorMessage) {
        setErrors1(prevErrors => ({
          ...prevErrors,
          [key]: errorMessage,
        }));
      } else {
        const updatedErrors = {...errors1};
        delete updatedErrors[key];
        setErrors1(updatedErrors);
      }
    } else {
      if (isRequired && errorMessage) {
        setErrors(prevErrors => ({
          ...prevErrors,
          [key]: errorMessage,
        }));
      } else {
        const updatedErrors = {...errors};
        delete updatedErrors[key];
        setErrors(updatedErrors);
      }
    }
  };

  const handleNumberChange = (
    headerKey,
    key,
    value,
    name,
    length,
    isRequired,
    label,
  ) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    const isPhone = isPhoneField(name);

    setFormData(prevData =>
      prevData.map(section => {
        if (section.headerKey === headerKey) {
          if (section.isMultiple) {
            setuserData(prevUser =>
              prevUser.map(item => ({
                ...item,
                [key]: {
                  ...item[key],
                  value: numericValue, // ✅ Store unformatted
                },
              })),
            );
            return section; // ✅ Add this return
          } else {
            return {
              ...section,
              headerConfig: section?.headerConfig.map(item => {
                const itemKey = Object.keys(item)[0];
                if (itemKey === key) {
                  return {
                    [itemKey]: {
                      ...item[itemKey],
                      value: numericValue, // ✅ Store unformatted
                    },
                  };
                }
                return item;
              }),
            };
          }
        }
        return section;
      }),
    );

    // ✅ Fixed validation logic
    let isValid = true;
    let errorMessage = null;

    if (!numericValue.trim() && isRequired) {
      isValid = false;
      errorMessage = `${label} is required.`;
    } else if (
      numericValue &&
      numericValue === '0'.repeat(numericValue.length)
    ) {
      isValid = false;
      errorMessage = `${label} cannot be all zeros.`;
    } else if (isPhone) {
      if (numericValue.length !== 10) {
        isValid = false;
        errorMessage = `${label} must be 10 digits.`;
      }
    } else {
      // ✅ Apply length check to ALL non-phone fields (not just age)
      if (numericValue.length > length) {
        isValid = false;
        errorMessage = `${label} must not exceed ${length} digits.`;
      }
    }

    if (moduleData[activeTab]?.headerKey === 'personalInfo') {
      if (!isValid && errorMessage) {
        setErrors1(prevErrors => ({
          ...prevErrors,
          [key]: errorMessage,
        }));
      } else {
        const updatedErrors = {...errors1};
        delete updatedErrors[key];
        setErrors1(updatedErrors);
      }
    } else {
      if (!isValid && errorMessage) {
        setErrors(prevErrors => ({
          ...prevErrors,
          [key]: errorMessage,
        }));
      } else {
        const updatedErrors = {...errors};
        delete updatedErrors[key];
        setErrors(updatedErrors);
      }
    }
  };

  const handleEmail = (headerKey, key, value, isRequired, name, label) => {
    setFormData(prevData =>
      prevData.map(section => {
        if (section.headerKey === headerKey) {
          if (section.isMultiple) {
            setuserData(prevUser =>
              prevUser.map(item => ({
                ...item,
                [key]: {
                  ...item[key],
                  value,
                },
              })),
            );
            return section; // ✅ Add this return
          } else {
            return {
              ...section,
              headerConfig: section?.headerConfig.map(item => {
                const itemKey = Object.keys(item)[0];
                if (itemKey === key) {
                  return {
                    [itemKey]: {
                      ...item[itemKey],
                      value,
                    },
                  };
                }
                return item;
              }),
            };
          }
        }
        return section;
      }),
    );

    // ✅ Fixed validation logic
    let isValid = true;
    let errorMessage = null;

    if (name === 'emailAddress' || name === 'email') {
      const trimmedValue = value?.trim();
      if (!trimmedValue) {
        if (isRequired) {
          errorMessage = `${label} is required.`;
          isValid = false;
        }
      } else {
        // Email format check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedValue)) {
          errorMessage = `${label} must be valid.`;
          isValid = false;
        }
      }
    } else {
      // Non-email fields
      const trimmedValue = value?.trim();
      if (!trimmedValue && isRequired) {
        errorMessage = `${label} is required.`;
        isValid = false;
      }
    }

    if (moduleData[activeTab]?.headerKey === 'personalInfo') {
      if (!isValid && errorMessage) {
        setErrors1(prevErrors => ({
          ...prevErrors,
          [key]: errorMessage,
        }));
      } else {
        const updatedErrors = {...errors1};
        delete updatedErrors[key];
        setErrors1(updatedErrors);
      }
    } else {
      if (!isValid && errorMessage) {
        setErrors(prevErrors => ({
          ...prevErrors,
          [key]: errorMessage,
        }));
      } else {
        const updatedErrors = {...errors};
        delete updatedErrors[key];
        setErrors(updatedErrors);
      }
    }
  };

  const handlePassword = (headerKey, key, value, isRequired, label) => {
    setFormData(prevData =>
      prevData.map(section => {
        if (section.headerKey === headerKey) {
          if (section.isMultiple) {
            setuserData(prevUser =>
              prevUser.map(item => ({
                ...item,
                [key]: {
                  ...item[key],
                  value,
                },
              })),
            );
          } else {
            return {
              ...section,
              headerConfig: section?.headerConfig.map(item => {
                const itemKey = Object.keys(item)[0];
                if (itemKey === key) {
                  return {
                    [itemKey]: {
                      ...item[itemKey],
                      value,
                    },
                  };
                }
                return item;
              }),
            };
          }
        }
        return section;
      }),
    );

    let isValid = value && value.trim() !== '';
    let errorMessage;

    if (!isValid && isRequired) {
      errorMessage = `${label} is required.`;
    }

    if (moduleData[activeTab]?.headerKey === 'personalInfo') {
      if (isRequired && errorMessage) {
        setErrors1(prevErrors => ({
          ...prevErrors,
          [key]: errorMessage,
        }));
      } else {
        const updatedErrors = {...errors1};
        delete updatedErrors[key];
        setErrors1(updatedErrors);
      }
    } else {
      if (isRequired && errorMessage) {
        setErrors(prevErrors => ({
          ...prevErrors,
          [key]: errorMessage,
        }));
      } else {
        const updatedErrors = {...errors};
        delete updatedErrors[key];
        setErrors(updatedErrors);
      }
    }
  };

  const handleTextArea = (headerKey, key, value, isRequired, label) => {
    setFormData(prevData =>
      prevData.map(section => {
        if (section.headerKey === headerKey) {
          if (section.isMultiple) {
            setuserData(prevUser =>
              prevUser.map(item => ({
                ...item,
                [key]: {
                  ...item[key],
                  value,
                },
              })),
            );
            return section; // ✅ Add this line
          } else {
            return {
              ...section,
              headerConfig: section?.headerConfig.map(item => {
                const itemKey = Object.keys(item)[0];
                if (itemKey === key) {
                  return {
                    [itemKey]: {
                      ...item[itemKey],
                      value,
                    },
                  };
                }
                return item;
              }),
            };
          }
        }
        return section;
      }),
    );

    let isValid = value && value.trim() !== '';
    let errorMessage;

    if (!isValid && isRequired) {
      errorMessage = `${label} is required.`;
    }

    if (moduleData[activeTab]?.headerKey === 'personalInfo') {
      if (isRequired && errorMessage) {
        setErrors1(prevErrors => ({
          ...prevErrors,
          [key]: errorMessage,
        }));
      } else {
        const updatedErrors = {...errors1};
        delete updatedErrors[key];
        setErrors1(updatedErrors);
      }
    } else {
      if (isRequired && errorMessage) {
        setErrors(prevErrors => ({
          ...prevErrors,
          [key]: errorMessage,
        }));
      } else {
        const updatedErrors = {...errors};
        delete updatedErrors[key];
        setErrors(updatedErrors);
      }
    }
  };

  const handleRadioSelect = (headerKey, key, value, isRequired, label) => {
    setFormData(prevData =>
      prevData.map(section => {
        if (section.headerKey === headerKey) {
          // ✅ Handle isMultiple case (like handleTextArea)
          if (section.isMultiple) {
            setuserData(prevUser =>
              prevUser.map(item => ({
                ...item,
                [key]: {
                  ...item[key],
                  value,
                },
              })),
            );
            return section; // ✅ Return section unchanged for isMultiple
          } else {
            // Handle single form case
            return {
              ...section,
              headerConfig: section?.headerConfig.map(item => {
                const itemKey = Object.keys(item)[0];
                if (itemKey === key) {
                  return {
                    [itemKey]: {
                      ...item[itemKey],
                      value,
                    },
                  };
                }
                return item;
              }),
            };
          }
        }
        return section;
      }),
    );

    // Validation logic
    let isValid = value !== undefined && value !== null && value !== '';
    let errorMessage;

    if (!isValid && isRequired) {
      errorMessage = `${label} is required.`;
    }

    // Error handling
    if (moduleData[activeTab]?.headerKey === 'personalInfo') {
      if (isRequired && errorMessage) {
        setErrors1(prevErrors => ({
          ...prevErrors,
          [key]: errorMessage,
        }));
      } else {
        const updatedErrors = {...errors1};
        delete updatedErrors[key];
        setErrors1(updatedErrors);
      }
    } else {
      if (isRequired && errorMessage) {
        setErrors(prevErrors => ({
          ...prevErrors,
          [key]: errorMessage,
        }));
      } else {
        const updatedErrors = {...errors};
        delete updatedErrors[key];
        setErrors(updatedErrors);
      }
    }
  };

  const handleFileChange = async (
    key,
    files,
    isRequired,
    label,
    isMultiple,
  ) => {
    const validFiles = Array.isArray(files) ? files : [files];
    const isValidFiles = validFiles.length > 0;

    if (isRequired && !isValidFiles) {
      const errorMessage = `${label} is required.`;
      if (moduleData[activeTab]?.headerKey === 'personalInfo') {
        setErrors1(prevErrors => ({
          ...prevErrors,
          [key]: errorMessage,
        }));
      } else {
        setErrors(prevErrors => ({
          ...prevErrors,
          [key]: errorMessage,
        }));
      }
      Alert.alert(errorMessage);
      return;
    } else {
      if (moduleData[activeTab]?.headerKey === 'personalInfo') {
        setErrors1(prevErrors => {
          const updatedErrors = {...prevErrors};
          delete updatedErrors[key];
          return updatedErrors;
        });
      } else {
        setErrors(prevErrors => {
          const updatedErrors = {...prevErrors};
          delete updatedErrors[key];
          return updatedErrors;
        });
      }
    }

    const formData = new FormData();

    for (const file of validFiles) {
      const fileUri =
        Platform.OS === 'ios' ? file?.path?.replace('file://', '') : file?.path;
      const mimeType = file?.mime;

      if (!fileUri || !mimeType) {
        const errorMsg = `${label} does not have a valid file or MIME type.`;
        if (moduleData[activeTab]?.headerKey === 'personalInfo') {
          setErrors1(prevErrors => ({
            ...prevErrors,
            [key]: errorMsg,
          }));
        } else {
          setErrors(prevErrors => ({
            ...prevErrors,
            [key]: errorMsg,
          }));
        }
        Alert.alert('File not supported');
        return;
      }

      formData.append('file', {
        uri: fileUri,
        name: fileUri.split('/').pop(),
        type: mimeType,
      });
    }

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
        } else if (
          response.data.result &&
          typeof response.data.result === 'object' &&
          response.data.result.imagePath
        ) {
          uploadedImageUrls = [response.data.result.imagePath];
        }

        setFormData(prevFormData =>
          prevFormData.map(section => ({
            ...section,
            headerConfig: section.headerConfig.map(item => {
              const itemKey = Object.keys(item)[0];
              if (itemKey === key) {
                let existingValue = [];
                try {
                  existingValue = item[itemKey].value
                    ? JSON.parse(item[itemKey].value)
                    : [];
                  if (!Array.isArray(existingValue)) {
                    existingValue = [existingValue];
                  }
                } catch {
                  existingValue = [item[itemKey].value];
                }

                const updatedValue = isMultiple
                  ? [...existingValue, ...uploadedImageUrls]
                  : [uploadedImageUrls[0]];

                return {
                  [itemKey]: {
                    ...item[itemKey],
                    value: JSON.stringify(updatedValue),
                  },
                };
              }
              return item;
            }),
          })),
        );
      } else {
        NOTIFY_MESSAGE(response?.data?.message || 'Upload failed');
      }
    } catch (err) {
      NOTIFY_MESSAGE(err?.message || 'Something Went Wrong');
    } finally {
      setUploadProgress(prev => ({
        ...prev,
        [key]: 0,
      }));
      setActiveButton(false);
    }
  };

  const validateUserData = () => {
    let isValid = true;
    const newErrors = {};

    const fields = userData[0];

    Object.keys(fields).forEach(fieldKey => {
      const field = fields[fieldKey];
      const fieldValue = field?.value;
      const label = field?.label;

      if (field?.required) {
        if (!fieldValue || fieldValue?.trim() === '') {
          isValid = false;
          newErrors[fieldKey] = `${label} is required.`;
        } else {
          switch (fieldKey) {
            case 'emailAddress':
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(fieldValue)) {
                isValid = false;
                newErrors[fieldKey] = `${label} must be valid.`;
              } else {
                delete newErrors[fieldKey];
              }
              break;

            case 'contact':
              if (
                fieldValue.length !== 10 ||
                !/^\d+$/.test(fieldValue) ||
                /^0+$/.test(fieldValue)
              ) {
                isValid = false;
                newErrors[
                  fieldKey
                ] = `${label} must be valid and not all zeros.`;
              } else {
                delete newErrors[fieldKey];
              }
              break;

            case 'age':
              const ageValue = fieldValue.trim();
              const ageLength = ageValue.length;
              const isValidAgeNumber = /^\d+$/.test(ageValue);
              const isLengthValid = ageLength > 0 && ageLength <= 3;
              const isNotAllZeros = !/^0+$/.test(ageValue);
              if (!isValidAgeNumber || !isLengthValid || !isNotAllZeros) {
                isValid = false;
                newErrors[fieldKey] = 'Invalid age. Age cannot be all zeros.';
              } else {
                delete newErrors[fieldKey];
              }
              break;

            default:
              delete newErrors[fieldKey];
          }
        }
      }
    });

    setErrors1(newErrors);
    return isValid;
  };
  const addUser = () => {
    const isValid = validateUserData();

    if (!isValid) {
      return;
    }

    if (editedUserIndex !== null) {
      const oldMembershipAmount = parseFloat(
        (
          formData[activeTab].headerConfig[editedUserIndex]?.membershipamount
            ?.value ?? ''
        ).replace(/[^0-9.-]+/g, '') || '0',
      );

      const updatedFormData = formData.map(section => {
        if (section.isMultiple) {
          return {
            ...section,
            headerConfig: section.headerConfig.map((config, index) => {
              if (index === editedUserIndex) {
                return {
                  ...config,
                  ...Object.keys(userData[0]).reduce((acc, key) => {
                    acc[key] = {
                      ...config[key],
                      value: userData[0][key]?.value,
                    };
                    return acc;
                  }, {}),
                };
              }
              return config;
            }),
          };
        }
        return section;
      });

      setFormData(updatedFormData);

      const newMembershipAmount = parseFloat(
        (
          updatedFormData[activeTab].headerConfig[editedUserIndex]
            ?.membershipamount?.value ?? ''
        ).replace(/[^0-9.-]+/g, '') || '0',
      );

      updateTotalMembershipAmount(
        updatedFormData,
        editedUserIndex,
        oldMembershipAmount,
        newMembershipAmount,
      );

      setuserData(prevUser =>
        prevUser.map(user =>
          Object.keys(user).reduce((acc, key) => {
            acc[key] = {...user[key], value: null};
            return acc;
          }, {}),
        ),
      );
      setIsAddPerson(!isAddPerson);
      setEditedUserIndex(null);
    } else {
      const updatedFormData = formData.map(section => {
        if (section.isMultiple) {
          return {
            ...section,
            headerConfig: [
              ...userData.map(userField => ({
                ...userField,
                value: userField.value,
              })),
              ...section?.headerConfig,
            ],
          };
        }
        return section;
      });

      setFormData(updatedFormData);

      const newMembershipAmount = parseFloat(
        (userData[0]?.membershipamount?.value ?? '').replace(
          /[^0-9.-]+/g,
          '',
        ) || '0',
      );

      updateTotalMembershipAmount(
        updatedFormData,
        null,
        0,
        newMembershipAmount,
      );

      setuserData(prevUser =>
        prevUser.map(user =>
          Object.keys(user).reduce((acc, key) => {
            acc[key] = {...user[key], value: null};
            return acc;
          }, {}),
        ),
      );

      if (formData[activeTab]?.headerConfig?.length === 0) {
        return;
      } else {
        setIsAddPerson(!isAddPerson);
      }
    }
  };

  const updateTotalMembershipAmount = (
    currentFormData = formData,
    editedUserIndex = null,
    oldMembershipAmount = 0,
    newMembershipAmount = 0,
  ) => {
    if (editedUserIndex !== null) {
      const membershipAmountDifference =
        newMembershipAmount - oldMembershipAmount;

      setFormData(prevData =>
        prevData.map(section => {
          if (section.headerKey === 'paymentInformation') {
            return {
              ...section,
              headerConfig: section.headerConfig.map(config => {
                if (config.totalmembershipamount) {
                  const currentTotal =
                    parseFloat(config.totalmembershipamount.value) || 0;
                  const updatedTotal =
                    currentTotal + membershipAmountDifference;

                  return {
                    totalmembershipamount: {
                      ...config.totalmembershipamount,
                      value: updatedTotal.toFixed(2),
                    },
                  };
                }
                return config;
              }),
            };
          }
          return section;
        }),
      );
    } else {
      if (userData1.role == 'member') {
        const personalInfoSection = currentFormData.find(
          section => section.headerKey === 'personalInfo',
        );

        if (
          !personalInfoSection ||
          !Array.isArray(personalInfoSection.headerConfig)
        ) {
          return;
        }
        const totalMembershipAmount = personalInfoSection.headerConfig.reduce(
          (sum, config) => {
            const membershipField = config.membershipamount;

            if (membershipField && membershipField.value) {
              const value = parseFloat(
                membershipField?.value?.replace(/[^0-9.-]+/g, ''),
              );
              return sum + (isNaN(value) ? 0 : value);
            }
            return sum;
          },
          0,
        );

        setFormData(prevData =>
          prevData.map(section => {
            if (section.headerKey === 'paymentInformation') {
              return {
                ...section,
                headerConfig: section.headerConfig.map(config => {
                  if (config.totalmembershipamount) {
                    return {
                      totalmembershipamount: {
                        ...config.totalmembershipamount,
                        value: totalMembershipAmount.toFixed(2),
                      },
                    };
                  }
                  return config;
                }),
              };
            }
            return section;
          }),
        );
      } else {
        setFormData(prevData =>
          prevData.map(section => {
            if (section.headerKey === 'paymentInformation') {
              return {
                ...section,
                headerConfig: section.headerConfig.map(config => {
                  if (config.totalmembershipamount) {
                    const currentTotal =
                      parseFloat(config.totalmembershipamount.value) || 0;
                    const updatedTotal = currentTotal + newMembershipAmount;

                    return {
                      totalmembershipamount: {
                        ...config.totalmembershipamount,
                        value: updatedTotal.toFixed(2),
                      },
                    };
                  }
                  return config;
                }),
              };
            }
            return section;
          }),
        );
      }
    }
  };

  const handleDelete = (index, configurationid) => {
    Alert.alert('Alert', 'Are you sure you want to delete?', [
      {
        text: 'Cancel',
        onPress: () => {},
        style: 'cancel',
      },
      {
        text: 'OK',
        onPress: () => {
          setFormData(prevData => {
            let deletedMembershipValue = 0;
            const updatedFormData = prevData.map(section => {
              if (section.isMultiple) {
                const newHeaderConfig = [...section.headerConfig];

                if (index > -1 && index < newHeaderConfig.length) {
                  const deletedItem = newHeaderConfig[index];
                  deletedMembershipValue = parseFloat(
                    deletedItem?.membershipamount?.value?.replace(
                      /[^0-9.-]+/g,
                      '',
                    ) || '0',
                  );
                  newHeaderConfig.splice(index, 1);
                  return {...section, headerConfig: newHeaderConfig};
                }
              }
              return section;
            });

            const updatedPaymentInfo = updatedFormData.map(section => {
              if (section.headerKey === 'paymentInformation') {
                const updatedHeaderConfig = section.headerConfig.map(config => {
                  if (config.totalmembershipamount) {
                    const currentValue = parseFloat(
                      config.totalmembershipamount?.value || '0',
                    );
                    const newValue = Math.max(
                      0,
                      currentValue - deletedMembershipValue,
                    ).toFixed(2);
                    return {
                      totalmembershipamount: {
                        ...config.totalmembershipamount,
                        value: newValue,
                      },
                    };
                  }
                  return config;
                });
                return {...section, headerConfig: updatedHeaderConfig};
              }
              return section;
            });

            return updatedPaymentInfo;
          });
          if (configurationid) {
            httpClient
              .delete(`module/configuration/delete/${configurationid}`)
              .then(response => {
                if (response.data.status === true) {
                  NOTIFY_MESSAGE(response.data.message);
                } else {
                  NOTIFY_MESSAGE(response?.data?.message);
                }
              })
              .catch(error => {
                const errorMessage =
                  error?.response?.data?.message ||
                  error?.message ||
                  'Something Went Wrong';
                NOTIFY_MESSAGE(errorMessage);
              })
              .finally(() => {});
          }
        },
      },
    ]);
  };

  const sortedTimes = formData[activeTab]?.headerConfig?.sort((a, b) => {
    const aIsPrimary =
      a?.membership?.value &&
      a?.membership?.value !== null &&
      a?.membership?.value !== undefined &&
      a?.membership?.value !== '';

    const bIsPrimary =
      b?.membership?.value &&
      b?.membership?.value !== null &&
      b?.membership?.value !== undefined &&
      b?.membership?.value !== '';

    if (aIsPrimary && !bIsPrimary) return -1;
    if (!aIsPrimary && bIsPrimary) return 1;

    // If both are primary or both are family members, maintain order
    return 0;
  });

  const isFolded = width >= 600;

  const renderTime = ({item, index}) => {
    const number = index + 1 < 10 ? `0${index + 1}` : `${index + 1}`;

    const handleToggle = index => {
      setOpenIndex(openIndex === index ? null : index);
    };

    const hasIsApproved = item.hasOwnProperty('isApproved');

    const isApprovedValue = item?.isApproved?.value;

    const isApproved =
      hasIsApproved &&
      isApprovedValue &&
      (isApprovedValue.toString()?.toLowerCase() === 'yes' ||
        isApprovedValue.toString()?.toLowerCase() === 'true' ||
        isApprovedValue === true);

    return (
      <View
        style={{
          backgroundColor: COLORS.PRIMARYWHITE,
          flex: 1,
          overflow: 'hidden',
          borderRadius: 10,
          padding: 6,
          marginVertical: 6,
        }}
        key={index}>
        <TouchableOpacity
          onPress={() => {
            handleToggle(index);
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              width: width / 1.6,
            }}>
            <View
              style={{
                backgroundColor: COLORS.LABELCOLOR,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 10,
                width: widthPercentageToDP('8%'),
              }}>
              <Text
                style={[styles.pkgLblofNumber, {color: COLORS.PRIMARYWHITE}]}>
                {number}
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                width: isFolded ? width / 1.2 : width / 1.3,
              }}>
              <Text
                numberOfLines={2}
                style={{
                  fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                  fontSize: FONTS.FONTSIZE.EXTRASMALL,
                  color: COLORS.PLACEHOLDERCOLOR,
                  width: '55%',
                }}>
                {item.firstName?.value} {item.middleName?.value}{' '}
                {item.lastName?.value}
              </Text>
              {item?.relationship?.value && (
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                    fontSize: FONTS.FONTSIZE.EXTRASMALL,
                    color: COLORS.PLACEHOLDERCOLOR,
                    width: '45%',
                    textAlign: 'right',
                    paddingRight: 6,
                  }}>
                  {item?.relationship?.value}
                </Text>
              )}
            </View>
          </View>
          <View>
            {openIndex === index ? (
              <AntDesign name="up" size={20} color={COLORS.LABELCOLOR} />
            ) : (
              <AntDesign name="down" size={20} color={COLORS.LABELCOLOR} />
            )}
          </View>
        </TouchableOpacity>
        {openIndex === index && (
          <View
            key={index.toString()}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              backgroundColor: COLORS.PRIMARYWHITE,
              borderRadius: 10,
              paddingVertical: 10,
              paddingHorizontal: 4,
            }}>
            <View style={{flex: 1}}>
              {Object.entries(item).map(([fieldKey, fieldData]) => {
                if (fieldKey === 'value') {
                  return null;
                }

                if (
                  typeof fieldData !== 'object' ||
                  !fieldData ||
                  !fieldData.key
                ) {
                  return null;
                }

                if (fieldKey?.toLowerCase() === 'configurationid') {
                  return null;
                }

                if (fieldData?.type == 'hidden') {
                  return null;
                }

                return (
                  <View style={{flexDirection: 'row'}} key={fieldKey}>
                    <Text style={styles.pkgLbl}>
                      {`${fieldData?.label} :`}{' '}
                    </Text>
                    <Text style={styles.pkgLbl1}>
                      {isPhoneField(fieldData?.name) && fieldData?.value
                        ? formatPhoneToUS(fieldData?.value)
                        : fieldData?.value
                        ? fieldData?.value
                        : '-'}
                    </Text>
                  </View>
                );
              })}
              {/* {item?.relationship && !isApproved && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignSelf: 'flex-end',
                    gap: 20,
                    marginRight: 4,
                  }}>
                  <TouchableOpacity
                    onPress={() => handleEdit(index)}
                    style={[styles.itemAction]}>
                    <Feather
                      name={'edit-2'}
                      color={COLORS.PRIMARYBLACK}
                      size={22}
                    />
                  </TouchableOpacity>
                  {(!item?.membership?.value ||
                    item?.membership?.value === null ||
                    item?.membership?.value === undefined ||
                    item?.membership?.value === '') && (
                    <TouchableOpacity
                      onPress={() =>
                        handleDelete(index, item?.configurationid?.value)
                      }
                      style={styles.itemAction}>
                      <AntDesign
                        name={'delete'}
                        color={COLORS.PRIMARYBLACK}
                        size={22}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              )} */}
              {item?.relationship && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignSelf: 'flex-end',
                    gap: 20,
                    marginRight: 4,
                  }}>
                  {!hasIsApproved || !isApproved ? (
                    <>
                      <TouchableOpacity
                        onPress={() => handleEdit(index)}
                        style={[styles.itemAction]}>
                        <Feather
                          name={'edit-2'}
                          color={COLORS.PRIMARYBLACK}
                          size={22}
                        />
                      </TouchableOpacity>

                      {/* Show delete icon only if membership value is empty/null/undefined */}
                      {(!item?.membership?.value ||
                        item?.membership?.value === null ||
                        item?.membership?.value === undefined ||
                        item?.membership?.value === '') && (
                        <TouchableOpacity
                          onPress={() =>
                            handleDelete(index, item?.configurationid?.value)
                          }
                          style={styles.itemAction}>
                          <AntDesign
                            name={'delete'}
                            color={COLORS.PRIMARYBLACK}
                            size={22}
                          />
                        </TouchableOpacity>
                      )}
                    </>
                  ) : null}
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  const handleEdit = index => {
    const userToEdit = formData[activeTab].headerConfig[index];
    setEditedUserIndex(index);
    setuserData([userToEdit]);
    setIsAddPerson(!isAddPerson);
  };

  const validateFieldsInGroup = (group, formData) => {
    const errors = {};

    group?.headerConfig.forEach(field => {
      const fieldKey = Object.keys(field)[0];
      const fieldConfig = field[fieldKey];
      const label = fieldConfig.label || fieldKey;
      const value = formData
        .find(section => section.headerKey === group.headerKey)
        ?.headerConfig.find(item => item[fieldKey])?.[fieldKey]?.value;

      if (fieldConfig.required) {
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          errors[fieldKey] = `${label} is required.`;
        } else if (fieldKey === 'emailAddress' || fieldKey === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors[fieldKey] = 'Invalid email address.';
          }
        } else if (fieldKey === 'contact' || fieldKey === 'phoneNumber') {
          if (value.length !== 10 || !/^\d+$/.test(value)) {
            errors[fieldKey] = 'Invalid phone number.';
          }
        }
      }
    });

    return errors;
  };

  const validateCurrentTab = () => {
    const activeTabGroup = formData[activeTab];
    const newErrors = validateFieldsInGroup(activeTabGroup, formData);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRelationships = () => {
    // Get all family members from personalInfo tab
    const personalInfoIndex = moduleData.findIndex(
      tab => tab.headerKey === 'personalInfo',
    );

    if (personalInfoIndex === -1) {
      return {isValid: true};
    }

    const familyMembers = formData[personalInfoIndex]?.headerConfig || [];

    if (familyMembers.length === 0) {
      return {isValid: true};
    }

    // Extract all relationships
    const relationships = familyMembers
      .map(member => member?.relationship?.value?.trim()?.toLowerCase())
      .filter(Boolean);

    // Check for conflicts
    const hasFather = relationships.includes('father');
    const hasMother = relationships.includes('mother');
    const hasFatherInLaw = relationships.includes('father-in-law');
    const hasMotherInLaw = relationships.includes('mother-in-law');

    // Invalid combinations
    if (
      (hasFather && hasFatherInLaw) || // father + father-in-law
      (hasMother && hasMotherInLaw) || // mother + mother-in-law
      (hasFather && hasMotherInLaw) || // father + mother-in-law (cross)
      (hasMother && hasFatherInLaw) // mother + father-in-law (cross)
    ) {
      return {
        isValid: false,
        message:
          'You cannot include parents and in-laws together. Please choose either parents or in-laws, not both.',
      };
    }

    return {isValid: true};
  };

  const handlePrivious = () => {
    if (activeTab === 0) {
      Alert.alert('Info', 'You are already on the first tab.');
      return;
    }

    if (!validateCurrentTab()) {
      Alert.alert(
        'Validation Error',
        'Please fill all required fields correctly.',
      );
      return;
    }

    setActiveTab(activeTab - 1);
  };

  const handleTabClick = index => {
    if (index < activeTab) {
      setActiveTab(index);
      return;
    }

    if (index > activeTab + 1) {
      // Check if all tabs between current and target are already filled
      let allPreviousTabsValid = true;

      for (let i = activeTab; i < index; i++) {
        const tabGroup = formData[i];

        // Special check for personalInfo tab
        if (moduleData[i]?.headerKey === 'personalInfo') {
          const tabConfigLength = formData[i]?.headerConfig?.length;
          if (tabConfigLength === 0) {
            allPreviousTabsValid = false;
            break;
          }

          // Validate relationships
          const relationshipValidation = validateRelationships();
          if (!relationshipValidation.isValid) {
            alert(relationshipValidation.message);
            return;
          }
        }

        // Validate the tab
        const tabErrors = validateFieldsInGroup(tabGroup, formData);
        if (Object.keys(tabErrors).length > 0) {
          allPreviousTabsValid = false;
          break;
        }
      }

      if (!allPreviousTabsValid) {
        Alert.alert(
          'Info',
          'Please complete all previous tabs before jumping ahead.',
        );
        return;
      }

      // All previous tabs are valid, allow jump
      setActiveTab(index);
      return;
    }

    if (moduleData[activeTab]?.headerKey === 'personalInfo') {
      const firstTabConfigLength = formData[activeTab]?.headerConfig?.length;

      if (firstTabConfigLength == 0) {
        return Alert.alert(
          'Info',
          'Please add at least one family member to register.',
        );
      }

      // Validate relationships before moving forward
      const relationshipValidation = validateRelationships();
      if (!relationshipValidation.isValid) {
        alert(relationshipValidation.message);
        return;
      }

      if (firstTabConfigLength > 0 && !validateCurrentTab()) {
        Alert.alert(
          'Error',
          'Please fill all required fields before switching tabs.',
        );
        return;
      }
    } else {
      if (!validateCurrentTab()) {
        Alert.alert(
          'Error',
          'Please fill all required fields before switching tabs.',
        );
        return;
      }
    }

    setActiveTab(index);
  };

  const handleNext = () => {
    const group = formData[activeTab];

    if (!group?.headerConfig?.length) {
      alert('Please fill all required fields before proceeding.');
      return;
    }

    const errors = validateFieldsInGroup(group, formData);
    setErrors(errors);

    if (Object.keys(errors).length > 0) {
      alert('Please correct the highlighted fields before proceeding.');
      return;
    }

    // Validate relationships if on personalInfo tab
    if (moduleData[activeTab]?.headerKey === 'personalInfo') {
      const relationshipValidation = validateRelationships();
      if (!relationshipValidation.isValid) {
        alert(relationshipValidation.message);
        return;
      }
    }

    if (activeTab < moduleData.length - 1) {
      setActiveTab(prevIndex => prevIndex + 1);
    } else {
      Alert.alert('Info', 'You are on the last tab!');
    }
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
            backgroundColor: '#6200ee',
            borderRadius: 5,
          }}
        />
      </View>
    );
  };

  const handlePriview = () => {
    navigation.navigate('RegistrationPreview', {
      formData: formData,
      item: item,
    });
  };

  const handlePay = () => {
    shouldRefreshAfterPayment.current = true;
    navigation.navigate('PaymentInfoScreen', {
      formData: formData,
      userData: userData1?.member?.configurationId,
      previousScreen: 'RegistrationScreen',
    });
  };

  const handleCancel = () => {
    setuserData(prevUserData =>
      prevUserData.map(user => {
        return Object.keys(user).reduce((acc, key) => {
          acc[key] = {
            ...user[key],
            value: null,
          };
          return acc;
        }, {});
      }),
    );
    setEditedUserIndex(null);
    setErrors({});
    setErrors1({});
    setIsAddPerson(false);
  };

  const handleDeleteImage = (key, uri, headerKey) => {
    setFormData(prevData =>
      prevData.map(section => {
        if (section.headerKey === headerKey) {
          if (section.isMultiple) {
            setuserData(prevUser =>
              prevUser.map(item => {
                const updatedValue = item[key]?.value
                  ? JSON.parse(item[key].value)
                  : [];
                const filteredValue = updatedValue.filter(
                  imageUri => imageUri !== uri,
                );
                return {
                  ...item,
                  [key]: {
                    ...item[key],
                    value: JSON.stringify(filteredValue),
                  },
                };
              }),
            );
          } else {
            return {
              ...section,
              headerConfig: section.headerConfig.map(item => {
                const itemKey = Object.keys(item)[0];

                if (itemKey === key) {
                  const updatedValue = item[itemKey].value
                    ? JSON.parse(item[itemKey].value)
                    : [];
                  const filteredValue = updatedValue.filter(
                    imageUri => imageUri !== uri,
                  );
                  return {
                    [itemKey]: {
                      ...item[itemKey],
                      value: JSON.stringify(filteredValue),
                    },
                  };
                }
                return item;
              }),
            };
          }
        }
        return section;
      }),
    );
  };

  const fetchData = useCallback(async searchQuery => {
    try {
      isFetchingRef.current = true;
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

          originalMemberValues.current = uniqueValues;

          setModuleData(prevFields => {
            const updated = prevFields.map(field => {
              if (field.headerKey === 'memberDetails') {
                return {
                  ...field,
                  headerConfig: field.headerConfig.map(config => {
                    if (config.type === 'select' && config.name === 'member') {
                      return {
                        ...config,
                        values: uniqueValues,
                      };
                    }
                    return config;
                  }),
                };
              }
              return field;
            });

            return updated;
          });
        } else {
          setModuleData(prevFields =>
            prevFields.map(field => {
              if (field.headerKey === 'memberDetails') {
                return {
                  ...field,
                  headerConfig: field.headerConfig.map(config => {
                    if (config.type === 'select' && config.name === 'member') {
                      return {
                        ...config,
                        values: originalMemberValues.current,
                      };
                    }
                    return config;
                  }),
                };
              }
              return field;
            }),
          );
        }
      } else {
        NOTIFY_MESSAGE(response?.data?.message || 'Something Went Wrong');
      }
    } catch (error) {
      console.error('Dropdown search API error:', error);
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  const handleSearchChange = async (text, name) => {
    if (isSelectingRef.current || isFetchingRef.current) {
      return;
    }

    if (!text || text.trim() === '') {
      setModuleData(prevFields =>
        prevFields.map(field => {
          if (field.headerKey === 'memberDetails') {
            return {
              ...field,
              headerConfig: field.headerConfig.map(config => {
                if (config.type === 'select' && config.name === 'member') {
                  return {
                    ...config,
                    values: originalMemberValues.current,
                  };
                }
                return config;
              }),
            };
          }
          return field;
        }),
      );
      return;
    }
    await fetchData(text);
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

  const getFilteredRelationshipOptions = (currentItemIndex = null) => {
    const personalInfoIndex = moduleData.findIndex(
      tab => tab.headerKey === 'personalInfo',
    );

    if (personalInfoIndex === -1) {
      return [];
    }

    const familyMembers = formData[personalInfoIndex]?.headerConfig || [];

    // Get all selected relationships except the current item being edited
    const selectedRelationships = familyMembers
      .map((member, index) => {
        // Skip the current item being edited
        if (currentItemIndex !== null && index === currentItemIndex) {
          return null;
        }
        return member?.relationship?.value?.trim()?.toLowerCase();
      })
      .filter(Boolean);

    const hasFather = selectedRelationships.includes('father');
    const hasMother = selectedRelationships.includes('mother');
    const hasFatherInLaw = selectedRelationships.includes('father-in-law');
    const hasMotherInLaw = selectedRelationships.includes('mother-in-law');
    const hasHusband = selectedRelationships.includes('husband');
    const hasWife = selectedRelationships.includes('wife');

    // Determine which options to disable
    const disabledOptions = [];

    if (hasFather || hasMother) {
      // If parent exists, disable in-laws
      disabledOptions.push('father-in-law', 'mother-in-law');
    }

    if (hasFatherInLaw || hasMotherInLaw) {
      // If in-law exists, disable parents
      disabledOptions.push('father', 'mother');
    }

    // NEW: Disable unique relationships once selected
    if (hasFather) {
      disabledOptions.push('father');
    }

    if (hasMother) {
      disabledOptions.push('mother');
    }

    if (hasFatherInLaw) {
      disabledOptions.push('father-in-law');
    }

    if (hasMotherInLaw) {
      disabledOptions.push('mother-in-law');
    }

    if (hasHusband) {
      disabledOptions.push('husband');
    }

    if (hasWife) {
      disabledOptions.push('wife');
    }

    // Remove duplicates from disabled options
    return [...new Set(disabledOptions)];
  };

  // Add this function before your return statement
  const checkConfigurationIds = () => {
    const personalInfoSection = formData.find(
      section => section.headerKey === 'personalInfo',
    );

    if (!personalInfoSection || !personalInfoSection.headerConfig) {
      return true;
    }

    const hasInvalidConfig = personalInfoSection.headerConfig.some(member => {
      const configId = member?.configurationid?.value;
      return (
        configId === 0 ||
        configId === '0' ||
        configId === null ||
        configId === undefined ||
        configId === ''
      );
    });

    return hasInvalidConfig;
  };

  const getPaymentButtonState = () => {
    const personalInfoSection = formData.find(
      section => section.headerKey === 'personalInfo',
    );
    const paymentSection = formData.find(
      section => section.headerKey === 'paymentInformation',
    );

    if (
      !personalInfoSection ||
      !personalInfoSection.headerConfig ||
      !paymentSection
    ) {
      return {disabled: true, label: 'Pay Now', showMessage: false};
    }

    // ---- Check payment type ----
    const paymentTypeItem = paymentSection.headerConfig.find(
      item => item.paymentType,
    );
    const paymentTypeConfig = paymentTypeItem?.paymentType;
    const availableValues = paymentTypeConfig?.values || [];

    const isSupportedPayment = availableValues.some(
      opt =>
        opt?.value?.toLowerCase() === 'paypal' ||
        opt?.value?.toLowerCase() === 'venmo',
    );

    if (!isSupportedPayment) {
      return null;
    }

    // ---- Helper functions ----
    const hasIsApprovedKey = member =>
      !!member && Object.prototype.hasOwnProperty.call(member, 'isApproved');

    const isMemberApproved = member => {
      if (!hasIsApprovedKey(member)) return false;
      const approvedValue = member?.isApproved?.value;
      if (!approvedValue) return false;
      const approvedStr = approvedValue.toString()?.toLowerCase().trim();
      return (
        approvedStr === 'yes' ||
        approvedStr === 'true' ||
        approvedValue === true
      );
    };

    const isMemberPaid = member => {
      const paidValue = member?.isPaid?.value;
      if (
        !paidValue ||
        paidValue === '' ||
        paidValue === null ||
        paidValue === undefined
      ) {
        return false;
      }
      const paidStr = paidValue.toString()?.toLowerCase().trim();
      return paidStr === 'yes' || paidStr === 'true';
    };

    // ---- Check if approval workflow exists ----
    const noIsApprovedOnAnyMember = !personalInfoSection.headerConfig.some(
      member => hasIsApprovedKey(member),
    );

    // ---- Scenario 1: NO isApproved key (no approval workflow) ----
    if (noIsApprovedOnAnyMember) {
      const hasNewMember = personalInfoSection.headerConfig.some(
        member => parseInt(member?.configurationid?.value || '0', 10) === 0,
      );

      const unpaidTotalAmount = personalInfoSection.headerConfig.reduce(
        (sum, member) => {
          const amount = parseFloat(member?.membershipamount?.value || '0');
          const paidValue = member?.isPaid?.value;
          const isPaid =
            paidValue && paidValue.toString()?.toLowerCase().trim() === 'yes';

          // Only add if NOT paid
          return !isPaid && amount > 0 ? sum + amount : sum;
        },
        0,
      );

      if (unpaidTotalAmount === 0) {
        return null; // Hide button - nothing to pay
      }

      if (hasNewMember) {
        // New member exists + amount > 0 → Save and Pay
        return {
          disabled: false,
          label: 'Save and Pay',
          showMessage: false,
          requiresSave: true,
        };
      } else {
        // Only existing members + amount > 0 → Pay Now
        return {
          disabled: false,
          label: 'Pay Now',
          showMessage: false,
          requiresSave: false,
        };
      }
    }

    // ---- Scenario 2: isApproved key EXISTS (approval workflow active) ----
    const hasNewMember = personalInfoSection.headerConfig.some(
      member => parseInt(member?.configurationid?.value || '0', 10) === 0,
    );

    const hasApprovedUnpaid = personalInfoSection.headerConfig.some(
      member => isMemberApproved(member) && !isMemberPaid(member),
    );

    const totalAmount = personalInfoSection.headerConfig.reduce(
      (sum, member) => {
        const amount = parseFloat(member?.membershipamount?.value || '0');
        const approved = isMemberApproved(member);
        const paid = isMemberPaid(member);
        if (approved && !paid && amount > 0) return sum + amount;
        return sum;
      },
      0,
    );

    // New member + approved unpaid existing members → Save and Pay
    if (hasNewMember && hasApprovedUnpaid && totalAmount > 0) {
      return {
        disabled: false,
        label: 'Save and Pay',
        showMessage: false,
        requiresSave: true,
      };
    }

    if (totalAmount === 0) {
      return null;
    }

    // Only approved unpaid existing members → Pay Now
    const hasExistingApprovedUnpaid = personalInfoSection.headerConfig.some(
      member => {
        const configId = parseInt(member?.configurationid?.value || '0', 10);
        return (
          configId > 0 && isMemberApproved(member) && !isMemberPaid(member)
        );
      },
    );

    if (hasExistingApprovedUnpaid) {
      return {
        disabled: false,
        label: 'Pay Now',
        showMessage: false,
        requiresSave: false,
      };
    }

    return {disabled: true, label: 'Pay Now', showMessage: true};
  };

  const insets = useSafeAreaInsets();
  const {height: screenHeight} = Dimensions.get('window');

  const [inputY, setInputY] = useState(0);
  const inputRef = useRef(null);

  // Measure input position relative to SCREEN (not ScrollView)
  const measureInput = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.measureInWindow((x, y, width, height) => {
        setInputY(y);
      });
    }
  }, []);

  const isNearBottom = useCallback(() => {
    const gestureArea =
      Platform.OS === 'android' ? Math.max(insets.bottom, 40) : 0;
    const dropdownHeight = 200;
    const safePadding = 20;
    const spaceNeeded = dropdownHeight + gestureArea + safePadding;

    // Calculate space from BOTTOM of input to bottom of screen
    const inputHeight = 60; // Approximate input height
    const spaceBelowInput = screenHeight - (inputY + inputHeight);

    // Use TOP if there's not enough space below
    const result = spaceBelowInput < spaceNeeded;

    return result;
  }, [inputY, screenHeight, insets.bottom]);

  const dropdownPosition = useMemo(() => {
    return isNearBottom() ? 'top' : 'auto';
  }, [inputY, screenHeight, insets.bottom]);

  return (
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? undefined : 'height'}>
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.BACKGROUNDCOLOR,
        }}>
        <CustomHeader
          leftOnPress={() => {
            if (isFromEventAdmin) {
              navigation.goBack();
            } else {
              navigation.navigate('Dashboard');
            }
          }}
          leftIcon={
            <FontAwesome6
              name="angle-left"
              size={26}
              color={COLORS.LABELCOLOR}
              iconStyle="solid"
            />
          }
          title={'Registration'}
        />
        {networkLoading || loading || memberShipLoading ? (
          <Loader />
        ) : isConnected ? (
          <View style={{flex: 1}}>
            <View
              style={{
                overflow: 'hidden',
                flex: 1,
              }}>
              <View>
                <ScrollView
                  horizontal
                  contentContainerStyle={{flexGrow: 1}}
                  showsHorizontalScrollIndicator={false}>
                  <View style={styles.tabContainer}>
                    {moduleData?.map((section, index) => (
                      <TouchableOpacity
                        key={index}
                        style={{
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderBottomWidth: activeTab === index ? 2 : 0,
                          borderBottomColor: COLORS.TITLECOLOR,
                          borderBottomLeftRadius: 30,
                          borderBottomRightRadius: 30,
                          paddingHorizontal: 10,
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
                          {section?.headerLabel}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={{alignItems: 'flex-end', marginRight: 16}}>
                {moduleData[activeTab]?.headerKey === 'personalInfo' &&
                  !isAddPerson &&
                  relationshipOptions.length > 0 &&
                  formData[activeTab]?.headerConfig?.length !== 0 && (
                    <TouchableOpacity
                      onPress={() => {
                        setEditedUserIndex(null);
                        setIsAddPerson(!isAddPerson);
                      }}
                      style={{
                        // height: 40,
                        // width: 40,
                        borderRadius: 20,
                        backgroundColor: COLORS.LABELCOLOR,
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: 6,
                      }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                        }}>
                        <AntDesign
                          name="plus"
                          size={18}
                          color={COLORS.PRIMARYWHITE}
                        />
                        <Text
                          style={{
                            color: COLORS.PRIMARYWHITE,
                            includeFontPadding: false,
                            fontSize: FONTS.FONTSIZE.SEMIMINI,
                            fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                          }}>
                          Add Member
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
              </View>

              <ScrollView
                contentContainerStyle={{
                  paddingBottom:
                    keyboardOpen && Platform.OS == 'android' ? 34 : 0,
                  flexGrow: 1,
                }}
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustKeyboardInsets={true}
                showsVerticalScrollIndicator={false}>
                {formData[activeTab]?.headerConfig?.length > 0 &&
                  moduleData[activeTab]?.headerKey === 'personalInfo' &&
                  !isAddPerson && (
                    <FlatList
                      contentContainerStyle={{
                        paddingBottom: 30,
                      }}
                      style={{margin: 10, marginTop: 0}}
                      data={sortedTimes}
                      keyExtractor={(item, index) => index.toString()}
                      renderItem={renderTime}
                      scrollEnabled={false}
                      removeClippedSubviews={true}
                      maxToRenderPerBatch={30}
                      updateCellsBatchingPeriod={200}
                      windowSize={40}
                      initialNumToRender={10}
                    />
                  )}

                <View
                  style={{
                    flex: 1,
                    marginHorizontal:
                      (moduleData[activeTab]?.headerKey === 'personalInfo' &&
                        isAddPerson) ||
                      formData[activeTab]?.headerConfig?.length == 0
                        ? 10
                        : 0,
                    borderRadius: 10,
                    overflow: 'hidden',
                    padding: 10,
                    backgroundColor:
                      (moduleData[activeTab]?.headerKey === 'personalInfo' &&
                        isAddPerson) ||
                      formData[activeTab]?.headerConfig?.length == 0
                        ? COLORS.PRIMARYWHITE
                        : null,
                    margin:
                      moduleData[activeTab]?.headerKey === 'personalInfo' &&
                      isAddPerson
                        ? 10
                        : 0,
                    borderRadius:
                      (moduleData[activeTab]?.headerKey === 'personalInfo' &&
                        isAddPerson) ||
                      formData[activeTab]?.headerConfig?.length == 0
                        ? 10
                        : 0,
                  }}>
                  {moduleData[activeTab]?.headerConfig?.map((item, index) => {
                    const shouldComponent =
                      (moduleData[activeTab]?.headerKey === 'personalInfo' &&
                        isAddPerson) ||
                      moduleData[activeTab]?.headerKey !== 'personalInfo';
                    const iEmptyUser =
                      formData[activeTab]?.headerConfig?.length == 0;
                    const itemType =
                      item?.subtype !== null
                        ? item.subtype
                        : item?.type
                        ? item?.type
                        : 'text';

                    const hasMembershipValue = userData[0]?.membership?.value;

                    const hasIsApprovedKey = item.name == 'isApproved';

                    const hasEmailField =
                      moduleData[activeTab]?.headerKey === 'personalInfo' &&
                      item?.name == 'emailAddress' &&
                      moduleData[activeTab].isMultiple;

                    const hasPhoneField =
                      moduleData[activeTab]?.headerKey === 'personalInfo' &&
                      item?.name == 'contact' &&
                      moduleData[activeTab].isMultiple;

                    const isEmailDisable = hasMembershipValue && hasEmailField;
                    const isPhoneDisable = hasMembershipValue && hasPhoneField;

                    if (
                      moduleData[activeTab]?.headerKey === 'personalInfo' &&
                      item?.name == 'relationship' &&
                      moduleData[activeTab].isMultiple &&
                      hasMembershipValue
                    ) {
                      return null;
                    }

                    if (hasIsApprovedKey) {
                      return null;
                    }
                    if (item?.className == 'row Disabled') {
                      return null;
                    }
                    switch (itemType) {
                      case 'text':
                        if (shouldComponent || iEmptyUser) {
                          return (
                            <View
                              key={item?.key}
                              style={{marginBottom: 8, gap: 4}}>
                              <View
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                }}>
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
                                      color:
                                        errors[item?.key] || errors1[item?.key]
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
                                  borderWidth: 1,
                                  height: 38,
                                  paddingVertical: 0,
                                  borderRadius: 10,
                                  paddingHorizontal: 8,
                                  borderColor:
                                    errors[item?.key] || errors1[item?.key]
                                      ? COLORS.PRIMARYRED
                                      : COLORS.INPUTBORDER,
                                  fontSize: FONTS.FONTSIZE.MINI,
                                  fontFamily: FONTS.FONT_FAMILY.REGULAR,
                                  color: COLORS.PRIMARYBLACK,
                                }}
                                value={
                                  moduleData[activeTab].isMultiple
                                    ? userData[0]?.[item.key]?.value || null
                                    : formData[activeTab]?.headerConfig?.find(
                                        field => field?.[item?.key],
                                      )?.[item?.key]?.value || null
                                }
                                maxLength={
                                  item?.maxLength == 0 ? 250 : item?.maxLength
                                }
                                placeholder={`${item.label}`}
                                placeholderTextColor={COLORS.PLACEHOLDERCOLOR}
                                onChangeText={value => {
                                  setCurrentLengths(prev => ({
                                    ...prev,
                                    [item?.key]: value.length,
                                  }));
                                  handleInputChange(
                                    formData[activeTab].headerKey,
                                    item.key,
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
                                const currentLength =
                                  currentLengths[item?.key] || 0;
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
                              {errors1[item?.key] && (
                                <Text
                                  style={{
                                    color: COLORS.PRIMARYRED,
                                    fontSize: FONTS.FONTSIZE.SMALL,
                                    fontFamily: FONTS.FONT_FAMILY.REGULAR,
                                    marginTop: 4,
                                  }}>
                                  {errors1[item?.key]}
                                </Text>
                              )}
                            </View>
                          );
                        }
                        break;

                      case 'radio-group':
                        if (item.className === 'row hidden') {
                          return null;
                        }
                        const selectedValue = moduleData[activeTab]?.isMultiple
                          ? userData[0]?.[item.key]?.value || null
                          : formData[activeTab]?.headerConfig?.find(
                              field => field?.[item?.key],
                            )?.[item?.key]?.value || null;

                        if (shouldComponent || iEmptyUser) {
                          return (
                            <View
                              key={item?.key}
                              style={{
                                marginBottom: 8,
                                gap: 4,
                              }}>
                              <View
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                }}>
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
                                      color:
                                        errors[item?.key] || errors1[item?.key]
                                          ? COLORS.PRIMARYRED
                                          : COLORS.TITLECOLOR,
                                    }}>
                                    *
                                  </Text>
                                )}
                              </View>
                              <View
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  gap: 10,
                                }}>
                                {item?.values?.map((radioItem, index) => (
                                  <TouchableOpacity
                                    key={index}
                                    style={{
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      gap: 4,
                                    }}
                                    onPress={() =>
                                      handleRadioSelect(
                                        formData[activeTab].headerKey,
                                        item?.key,
                                        radioItem.value,
                                        item?.required,
                                        item?.label,
                                      )
                                    }>
                                    {selectedValue === radioItem.value ? (
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
                                        color: COLORS.PRIMARYBLACK,
                                        top: 2,
                                      }}>
                                      {radioItem.label}
                                    </Text>
                                  </TouchableOpacity>
                                ))}
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
                              {errors1[item?.key] && (
                                <Text
                                  style={{
                                    color: COLORS.PRIMARYRED,
                                    fontSize: FONTS.FONTSIZE.SMALL,
                                    fontFamily: FONTS.FONT_FAMILY.REGULAR,
                                    marginTop: 4,
                                  }}>
                                  {errors1[item?.key]}
                                </Text>
                              )}
                            </View>
                          );
                        }
                        break;

                      case 'select':
                        if (shouldComponent || iEmptyUser) {
                          const disabledRelationships =
                            moduleData[activeTab]?.headerKey ===
                              'personalInfo' && item?.name === 'relationship'
                              ? getFilteredRelationshipOptions(editedUserIndex)
                              : [];

                          // Filter out disabled relationships from dropdown data
                          const filteredData =
                            moduleData[activeTab]?.headerKey ===
                              'personalInfo' &&
                            item?.name === 'relationship' &&
                            item?.values?.length > 0
                              ? item.values.filter(
                                  option =>
                                    !disabledRelationships.includes(
                                      option.value?.toLowerCase(),
                                    ),
                                )
                              : item?.values?.length > 0
                              ? item.values
                              : [
                                  {
                                    label: 'No Data Available',
                                    value: null,
                                  },
                                ];

                          return (
                            <View
                              key={item?.key}
                              style={{
                                marginBottom: 8,
                                gap: 4,
                                overflow: 'hidden',
                              }}>
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
                                      color:
                                        errors[item?.key] || errors1[item?.key]
                                          ? COLORS.PRIMARYRED
                                          : COLORS.TITLECOLOR,
                                    }}>
                                    *
                                  </Text>
                                )}
                              </Text>
                              <View
                                ref={inputRef}
                                onLayout={() => {
                                  setTimeout(measureInput, 100);
                                }}>
                                <Dropdown
                                  dropdownPosition={
                                    Platform.OS == 'android'
                                      ? dropdownPosition
                                      : 'auto'
                                  }
                                  onFocus={() => {
                                    Keyboard.dismiss();
                                    measureInput();
                                  }}
                                  autoScroll={false}
                                  data={
                                    filteredData?.length > 0
                                      ? filteredData
                                      : [
                                          {
                                            label: 'No Data Available',
                                            value: null,
                                          },
                                        ]
                                  }
                                  inputSearchStyle={{
                                    color: COLORS.PRIMARYBLACK,
                                    fontSize: FONTS.FONTSIZE.EXTRASMALL,
                                  }}
                                  search
                                  searchPlaceholder="Search..."
                                  labelField="label"
                                  valueField="value"
                                  value={
                                    moduleData[activeTab].isMultiple
                                      ? userData[0]?.[item.key]?.value || null
                                      : formData[activeTab]?.headerConfig?.find(
                                          field => field?.[item?.key],
                                        )?.[item?.key]?.value || null
                                  }
                                  onChange={item1 => {
                                    isSelectingRef.current = true;
                                    handleSelectDropdown(
                                      formData[activeTab].headerKey,
                                      item.key,
                                      item1?.value,
                                      item1?.totalMembershipAmount,
                                      item?.name,
                                      item?.required,
                                      item?.label,
                                    );
                                    setTimeout(() => {
                                      isSelectingRef.current = false;
                                    }, 100);
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
                                      <Text style={styles.itemText}>
                                        {item.label}
                                      </Text>
                                    </View>
                                  )}
                                  style={[
                                    styles.dropdown,
                                    {
                                      borderColor:
                                        errors[item?.key] || errors1[item?.key]
                                          ? COLORS.PRIMARYRED
                                          : COLORS.INPUTBORDER,
                                    },
                                  ]}
                                  maxHeight={200}
                                />
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
                              {errors1[item?.key] && (
                                <Text
                                  style={{
                                    color: COLORS.PRIMARYRED,
                                    fontSize: FONTS.FONTSIZE.SMALL,
                                    fontFamily: FONTS.FONT_FAMILY.REGULAR,
                                    marginTop: 4,
                                  }}>
                                  {errors1[item?.key]}
                                </Text>
                              )}
                            </View>
                          );
                        }
                        break;

                      case 'file':
                        const isDisabled = item.className
                          ?.toLowerCase()
                          ?.includes('form-control disabled');

                        if (shouldComponent) {
                          return (
                            <View
                              key={item?.key}
                              style={{gap: 4, marginBottom: 8}}>
                              <View
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                }}>
                                <Text
                                  style={{
                                    fontSize: FONTS.FONTSIZE.SMALL,
                                    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                                    color: COLORS.TITLECOLOR,
                                  }}>
                                  {capitalizeFirstLetter(item?.label)}{' '}
                                  {item?.required && !isDisabled && (
                                    <Text
                                      style={{
                                        color:
                                          errors[item?.key] ||
                                          errors1[item?.key]
                                            ? COLORS.PRIMARYRED
                                            : COLORS.TITLECOLOR,
                                      }}>
                                      *
                                    </Text>
                                  )}
                                </Text>
                              </View>

                              {isDisabled ? (
                                (() => {
                                  let rawValue = moduleData[activeTab]
                                    .isMultiple
                                    ? userData[0]?.[item.key]?.value
                                    : formData[activeTab]?.headerConfig?.find(
                                        field => field?.[item?.key],
                                      )?.[item?.key]?.value;

                                  let mediaUris = [];
                                  if (rawValue) {
                                    try {
                                      const parsedValue = JSON.parse(rawValue);
                                      const rawArray = Array.isArray(
                                        parsedValue,
                                      )
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

                                  if (mediaUris.length === 0) {
                                    return (
                                      <Text
                                        style={{
                                          fontSize: FONTS.FONTSIZE.SEMIMINI,
                                          fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                                          color: COLORS.PLACEHOLDERCOLOR,
                                        }}>
                                        No files to display
                                      </Text>
                                    );
                                  }

                                  return (
                                    <View style={{gap: 4}}>
                                      {mediaUris.map((uri, index) => {
                                        const fileType = getFileType(uri);
                                        return (
                                          <View
                                            key={`${item.key}-${uri}-${index}`}
                                            style={{margin: 5}}>
                                            {fileType === 'image' ? (
                                              <TouchableOpacity
                                                onPress={() => {
                                                  navigation.navigate(
                                                    'FullImageScreen',
                                                    {
                                                      image: uri,
                                                    },
                                                  );
                                                }}>
                                                <Text
                                                  style={{
                                                    fontSize:
                                                      FONTS.FONTSIZE.SEMIMINI,
                                                    fontFamily:
                                                      FONTS.FONT_FAMILY.MEDIUM,
                                                    color:
                                                      COLORS.PLACEHOLDERCOLOR,
                                                    textDecorationLine:
                                                      'underline',
                                                  }}>
                                                  {index + 1}. {uri}
                                                </Text>
                                              </TouchableOpacity>
                                            ) : (
                                              <Text
                                                style={{
                                                  fontSize:
                                                    FONTS.FONTSIZE.SEMIMINI,
                                                  fontFamily:
                                                    FONTS.FONT_FAMILY.MEDIUM,
                                                  color:
                                                    COLORS.PLACEHOLDERCOLOR,
                                                }}>
                                                {index + 1}. {uri}
                                              </Text>
                                            )}
                                          </View>
                                        );
                                      })}
                                    </View>
                                  );
                                })()
                              ) : (
                                <>
                                  <ButtonComponent
                                    disabled={uploadProgress[item?.key] > 0}
                                    title={'Upload Image'}
                                    width={'50%'}
                                    onPress={() => {
                                      setModalVisible(prev => ({
                                        ...prev,
                                        [item?.key]: true,
                                      }));
                                    }}
                                  />

                                  {(() => {
                                    let rawValue = moduleData[activeTab]
                                      .isMultiple
                                      ? userData[0]?.[item.key]?.value
                                      : formData[activeTab]?.headerConfig?.find(
                                          field => field?.[item?.key],
                                        )?.[item?.key]?.value;

                                    let mediaUris = [];
                                    if (rawValue) {
                                      try {
                                        const parsedValue =
                                          JSON.parse(rawValue);
                                        const rawArray = Array.isArray(
                                          parsedValue,
                                        )
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

                                    if (mediaUris.length > 0) {
                                      return (
                                        <View
                                          style={{
                                            marginTop: 12,
                                          }}>
                                          <ScrollView
                                            horizontal
                                            showsHorizontalScrollIndicator={
                                              false
                                            }
                                            contentContainerStyle={{
                                              gap: 12,
                                              paddingHorizontal: 8,
                                            }}>
                                            {mediaUris.map((uri, index) => (
                                              <View
                                                key={`${item.key}-${uri}-${index}`}
                                                style={{
                                                  width: 100,
                                                  height: 100,
                                                  borderRadius: 8,
                                                  overflow: 'hidden',
                                                  position: 'relative',
                                                }}>
                                                <Image
                                                  source={{
                                                    uri: uri
                                                      ? IMAGE_URL + uri
                                                      : null,
                                                  }}
                                                  style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    resizeMode: 'cover',
                                                  }}
                                                />
                                                <TouchableOpacity
                                                  onPress={() => {
                                                    handleDeleteImage(
                                                      item?.key,
                                                      uri,
                                                      formData[activeTab]
                                                        .headerKey,
                                                    );
                                                  }}
                                                  style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    right: 0,
                                                    width: 24,
                                                    height: 24,
                                                    borderRadius: 12,
                                                    backgroundColor:
                                                      'rgba(255,0,0,0.8)',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    zIndex: 10,
                                                  }}>
                                                  <Text
                                                    style={{
                                                      color: 'white',
                                                      fontSize: 18,
                                                      fontWeight: 'bold',
                                                      textAlign: 'center',
                                                      lineHeight: 20,
                                                    }}>
                                                    ×
                                                  </Text>
                                                </TouchableOpacity>
                                              </View>
                                            ))}
                                          </ScrollView>
                                        </View>
                                      );
                                    }
                                    return null;
                                  })()}

                                  {uploadProgress[item?.key] > 0 && (
                                    <View style={{marginTop: 10}}>
                                      <Text
                                        style={{
                                          color: COLORS.TITLECOLOR,
                                          fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                                          fontSize: FONTS.FONTSIZE.MEDIUM,
                                        }}>
                                        Uploading: {uploadProgress[item?.key]}%
                                      </Text>
                                      <ProgressBar
                                        progress={uploadProgress[item?.key]}
                                      />
                                    </View>
                                  )}
                                </>
                              )}

                              {modalVisible[item?.key] && (
                                <ImageSelectModal
                                  visible={modalVisible[item?.key]}
                                  onClose={() => {
                                    setModalVisible(prev => ({
                                      ...prev,
                                      [item?.key]: false,
                                    }));
                                  }}
                                  onSelect={media =>
                                    handleFileChange(
                                      item?.key,
                                      media,
                                      item?.required,
                                      item?.label,
                                      item?.multiple,
                                    )
                                  }
                                  item={item}
                                />
                              )}

                              {(errors[item?.key] || errors1[item?.key]) &&
                                !isDisabled && (
                                  <Text
                                    style={{
                                      color: COLORS.PRIMARYRED,
                                      fontSize: FONTS.FONTSIZE.SMALL,
                                      fontFamily: FONTS.FONT_FAMILY.REGULAR,
                                      marginTop: 4,
                                    }}>
                                    {errors[item?.key] || errors1[item?.key]}
                                  </Text>
                                )}
                            </View>
                          );
                        }
                        break;

                      case 'date':
                        if (shouldComponent || iEmptyUser) {
                          return (
                            <View
                              key={item?.key}
                              style={{marginBottom: 8, gap: 4}}>
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
                                      color:
                                        errors[item?.key] || errors1[item?.key]
                                          ? COLORS.PRIMARYRED
                                          : COLORS.LABELCOLOR,
                                    }}>
                                    *
                                  </Text>
                                )}
                              </Text>

                              <TouchableOpacity
                                style={{
                                  height: 38,
                                  paddingVertical: 0,
                                  borderRadius: 10,
                                  borderWidth: 1,
                                  justifyContent: 'center',
                                  paddingHorizontal: 8,
                                  borderColor: COLORS.INPUTBORDER,
                                  backgroundColor: COLORS.PRIMARYWHITE,
                                }}
                                onPress={() => {
                                  setDatePickerVisible(prev => ({
                                    ...prev,
                                    [item?.key]: true,
                                  }));
                                }}>
                                <Text
                                  style={{
                                    color: COLORS.PRIMARYBLACK,
                                    fontSize: FONTS.FONTSIZE.SMALL,
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
                                  is24Hour={false}
                                  isVisible={datePickerVisible[item?.key]}
                                  mode="date"
                                  display="inline"
                                  onConfirm={date =>
                                    onDateChange(
                                      formData[activeTab].headerKey,
                                      item.key,
                                      date,
                                      item?.required,
                                      item?.label,
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
                              {errors1[item?.key] && (
                                <Text
                                  style={{
                                    color: COLORS.PRIMARYRED,
                                    fontSize: FONTS.FONTSIZE.SMALL,
                                    fontFamily: FONTS.FONT_FAMILY.REGULAR,
                                    marginTop: 4,
                                  }}>
                                  {errors1[item?.key]}
                                </Text>
                              )}
                            </View>
                          );
                        }
                        break;

                      case 'time':
                        if (shouldComponent || iEmptyUser) {
                          return (
                            <View
                              key={item?.key}
                              style={{marginBottom: 8, gap: 4}}>
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
                                  justifyContent: 'center',
                                  paddingHorizontal: 8,
                                  borderColor: errors[item?.key]
                                    ? COLORS.PRIMARYRED
                                    : COLORS.INPUTBORDER,
                                  backgroundColor: COLORS.PRIMARYWHITE,
                                }}
                                onPress={() => {
                                  setTimePickerVisible(prev => ({
                                    ...prev,
                                    [item?.key]: true,
                                  }));
                                }}>
                                <Text
                                  style={{
                                    color: COLORS.PRIMARYBLACK,
                                    fontSize: FONTS.FONTSIZE.SMALL,
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
                              {timePickerVisible[item?.key] && (
                                <DateTimePickerModal
                                  is24Hour={false}
                                  isVisible={timePickerVisible[item?.key]}
                                  mode="time"
                                  display="inline"
                                  onConfirm={time =>
                                    onTimeChange(
                                      formData[activeTab].headerKey,
                                      item.key,
                                      time,
                                      item?.required,
                                      item?.label,
                                    )
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
                              {errors1[item?.key] && (
                                <Text
                                  style={{
                                    color: COLORS.PRIMARYRED,
                                    fontSize: FONTS.FONTSIZE.SMALL,
                                    fontFamily: FONTS.FONT_FAMILY.REGULAR,
                                    marginTop: 4,
                                  }}>
                                  {errors1[item?.key]}
                                </Text>
                              )}
                            </View>
                          );
                        }
                        break;

                      case 'checkbox':
                        if (shouldComponent || iEmptyUser) {
                          return (
                            <View
                              key={item?.key}
                              style={{marginBottom: 8, gap: 4}}>
                              <View
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                }}>
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
                                      color:
                                        errors[item?.key] || errors1[item?.key]
                                          ? COLORS.PRIMARYRED
                                          : COLORS.TITLECOLOR,
                                    }}>
                                    *
                                  </Text>
                                ) : null}
                              </View>
                              {item?.values.map((checkboxItem, index) => (
                                <View
                                  key={index}
                                  style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 8,
                                  }}>
                                  <TouchableOpacity
                                    onPress={() =>
                                      handleCheckboxSelect(
                                        formData[activeTab].headerKey,
                                        item?.key,
                                        checkboxItem.value,
                                      )
                                    }>
                                    {formData[item?.key]?.includes(
                                      checkboxItem.value,
                                    ) ? (
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
                                  </TouchableOpacity>
                                  <Text
                                    style={{
                                      fontSize: FONTS.FONTSIZE.SMALL,
                                      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                                      color: COLORS.TITLECOLOR,
                                    }}>
                                    {checkboxItem.label}
                                  </Text>
                                </View>
                              ))}
                              {errors[item?.key] ||
                                (errors1[item?.key] && (
                                  <Text
                                    style={{
                                      color: COLORS.PRIMARYRED,
                                      fontSize: FONTS.FONTSIZE.SMALL,
                                      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                                    }}>
                                    Please select at least one option.
                                  </Text>
                                ))}
                            </View>
                          );
                        }
                        break;

                      case 'password':
                        if (shouldComponent || iEmptyUser) {
                          return (
                            <View
                              key={item?.key}
                              style={{marginBottom: 8, gap: 4}}>
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
                                      color:
                                        errors[item?.key] || errors1[item?.key]
                                          ? COLORS.PRIMARYRED
                                          : COLORS.PRIMARYBLACK,
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
                                  borderColor:
                                    errors[item?.key] || errors1[item?.key]
                                      ? COLORS.PRIMARYRED
                                      : COLORS.INPUTBORDER,
                                  borderRadius: 10,
                                  justifyContent: 'space-between',
                                  paddingHorizontal: 10,
                                }}>
                                <TextInput
                                  style={{
                                    height: 38,
                                    paddingVertical: 0,
                                    borderRadius: 10,
                                    borderColor: COLORS.INPUTBORDER,
                                    fontSize: FONTS.FONTSIZE.MINI,
                                    fontFamily: FONTS.FONT_FAMILY.REGULAR,
                                    color: COLORS.PRIMARYBLACK,
                                    backgroundColor: COLORS.PRIMARYWHITE,
                                  }}
                                  secureTextEntry={!passwordVisible}
                                  placeholder={`${item?.label}`}
                                  placeholderTextColor={COLORS.PLACEHOLDERCOLOR}
                                  maxLength={
                                    item?.maxLength == 0 ? 250 : item?.maxLength
                                  }
                                  value={
                                    moduleData[activeTab].isMultiple
                                      ? userData[0]?.[item.key]?.value || null
                                      : formData[activeTab]?.headerConfig?.find(
                                          field => field?.[item?.key],
                                        )?.[item?.key]?.value || null
                                  }
                                  onChangeText={value => {
                                    setCurrentLengths(prev => ({
                                      ...prev,
                                      [item?.key]: value.length,
                                    }));
                                    handlePassword(
                                      formData[activeTab].headerKey,
                                      item?.key,
                                      value,
                                      item?.required,
                                      item?.label,
                                    );
                                  }}
                                />
                                <TouchableOpacity
                                  onPress={() =>
                                    setPasswordVisible(!passwordVisible)
                                  }>
                                  <Ionicons
                                    name={passwordVisible ? 'eye-off' : 'eye'}
                                    size={24}
                                    color={COLORS.TITLECOLOR}
                                  />
                                </TouchableOpacity>
                              </View>
                              {(() => {
                                const max =
                                  item?.maxLength === 0 ? 250 : item?.maxLength;
                                const currentLength =
                                  currentLengths[item?.key] || 0;
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
                              {errors1[item?.key] && (
                                <Text
                                  style={{
                                    color: COLORS.PRIMARYRED,
                                    fontSize: FONTS.FONTSIZE.SMALL,
                                    fontFamily: FONTS.FONT_FAMILY.REGULAR,
                                    marginTop: 4,
                                  }}>
                                  {errors1[item?.key]}
                                </Text>
                              )}
                            </View>
                          );
                        }
                        break;

                      case 'textarea':
                        if (shouldComponent || iEmptyUser) {
                          return (
                            <View
                              key={item?.key}
                              style={{marginBottom: 8, gap: 4}}>
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
                                      color:
                                        errors[item?.key] || errors1[item?.key]
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
                                  borderColor:
                                    errors[item?.key] || errors1[item?.key]
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
                                value={
                                  moduleData[activeTab].isMultiple
                                    ? userData[0]?.[item.key]?.value || null
                                    : formData[activeTab]?.headerConfig?.find(
                                        field => field?.[item?.key],
                                      )?.[item?.key]?.value || null
                                }
                                onChangeText={value => {
                                  setCurrentLengths(prev => ({
                                    ...prev,
                                    [item?.key]: value.length,
                                  }));
                                  handleTextArea(
                                    formData[activeTab].headerKey,
                                    item?.key,
                                    value,
                                    item?.required,
                                    item?.label,
                                  );
                                }}
                              />
                              {(() => {
                                const max =
                                  item?.maxLength === 0
                                    ? 1000
                                    : item?.maxLength;
                                const currentLength =
                                  currentLengths[item?.key] || 0;
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
                              {errors1[item?.key] && (
                                <Text
                                  style={{
                                    color: COLORS.PRIMARYRED,
                                    fontSize: FONTS.FONTSIZE.SMALL,
                                    fontFamily: FONTS.FONT_FAMILY.REGULAR,
                                    marginTop: 4,
                                  }}>
                                  {errors1[item?.key]}
                                </Text>
                              )}
                            </View>
                          );
                        }
                        break;

                      case 'number':
                        if (shouldComponent || iEmptyUser) {
                          const currentValue = moduleData[activeTab].isMultiple
                            ? userData[0]?.[item.key]?.value || ''
                            : formData[activeTab]?.headerConfig?.find(
                                field => field?.[item?.key],
                              )?.[item?.key]?.value || '';

                          // Check if this is for membership amounts in a multiple entry section
                          if (item?.name == 'membershipamount') {
                            return (
                              <View
                                key={item?.key}
                                style={{marginBottom: 8, gap: 4}}>
                                <Text
                                  style={{
                                    fontSize: FONTS.FONTSIZE.MEDIUM,
                                    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
                                    color: COLORS.LABELCOLOR,
                                  }}>
                                  {item?.name == 'membershipamount'
                                    ? 'Membership Amount'
                                    : 'Total Membership Amount'}
                                  : $
                                  {moduleData[activeTab].isMultiple
                                    ? userData[0]?.[item.key]?.value || 0
                                    : formData[activeTab]?.headerConfig?.find(
                                        field => field?.[item?.key],
                                      )?.[item?.key]?.value || 0}
                                </Text>
                              </View>
                            );
                          }

                          // if (item?.name == 'totalmembershipamount') {
                          //   const personalInfoSection = formData.find(
                          //     section =>
                          //       section.headerKey === 'personalInfo' &&
                          //       section.isMultiple === true,
                          //   );

                          //   const allFamilyMembers =
                          //     personalInfoSection?.headerConfig || [];

                          //   const hasIsApprovedKey = allFamilyMembers.some(
                          //     member => member?.hasOwnProperty('isApproved'),
                          //   );

                          //   const familyMembers = hasIsApprovedKey
                          //     ? allFamilyMembers.filter(member => {
                          //         // Check if isApproved exists and is 'yes'
                          //         const hasIsApproved =
                          //           member?.isApproved?.value !== undefined;
                          //         if (hasIsApproved) {
                          //           const isApproved =
                          //             member?.isApproved?.value?.toLowerCase() ===
                          //             'yes';
                          //           const isNotPaid =
                          //             member?.isPaid?.value?.toLowerCase() !==
                          //             'yes';
                          //           return isApproved && isNotPaid;
                          //         }
                          //         // If isApproved doesn't exist, just check isNotPaid
                          //         return (
                          //           member?.isPaid?.value?.toLowerCase() !==
                          //           'yes'
                          //         );
                          //       })
                          //     : allFamilyMembers.filter(member => {
                          //         // When no isApproved keys exist, filter only unpaid members
                          //         return (
                          //           member?.isPaid?.value?.toLowerCase() !==
                          //           'yes'
                          //         );
                          //       });

                          //   // ✅ Calculate total only for approved members
                          //   const totalAmount = familyMembers.reduce(
                          //     (sum, member) => {
                          //       const amount = parseFloat(
                          //         member?.membershipamount?.value || 0,
                          //       );
                          //       return sum + amount;
                          //     },
                          //     0,
                          //   );

                          //   return (
                          //     <View key={item?.key} style={{marginBottom: 16}}>
                          //       <View
                          //         style={{
                          //           flexDirection: 'row',
                          //           justifyContent: 'space-between',
                          //           alignItems: 'center',
                          //           paddingBottom: 5,
                          //         }}>
                          //         <Text
                          //           style={{
                          //             fontSize: FONTS.FONTSIZE.EXTRASMALL,
                          //             fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
                          //             color: COLORS.LABELCOLOR,
                          //           }}>
                          //           Total Membership Amount
                          //         </Text>
                          //         <Text
                          //           style={{
                          //             fontSize: FONTS.FONTSIZE.EXTRASMALL,
                          //             fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
                          //             color: COLORS.LABELCOLOR,
                          //           }}>
                          //           $
                          //           {moduleData[activeTab].isMultiple
                          //             ? userData[0]?.[item.key]?.value || 0
                          //             : formData[activeTab]?.headerConfig?.find(
                          //                 field => field?.[item?.key],
                          //               )?.[item?.key]?.value || 0}
                          //         </Text>
                          //       </View>
                          //       <View
                          //         style={{
                          //           backgroundColor: COLORS.PRIMARYWHITE,
                          //           borderRadius: 8,
                          //           padding: 8,
                          //           borderWidth: 1,
                          //           borderColor: COLORS.TABLEBORDER,
                          //         }}>
                          //         {/* ✅ Show message if no approved members */}
                          //         {familyMembers.length > 0 && (
                          //           <>
                          //             <View
                          //               style={{
                          //                 flexDirection: 'row',
                          //                 alignItems: 'center',
                          //                 gap: 8,
                          //               }}>
                          //               <View
                          //                 style={{
                          //                   width: 32,
                          //                   height: 32,
                          //                   borderRadius: 16,
                          //                   backgroundColor: '#E8F4FD',
                          //                   alignItems: 'center',
                          //                   justifyContent: 'center',
                          //                 }}>
                          //                 <Ionicons
                          //                   name="people-outline"
                          //                   size={20}
                          //                   color="#007AFF"
                          //                 />
                          //               </View>
                          //               <Text
                          //                 style={{
                          //                   fontSize: FONTS.FONTSIZE.SMALL,
                          //                   fontFamily:
                          //                     FONTS.FONT_FAMILY.SEMI_BOLD,
                          //                   color: COLORS.PRIMARYBLACK,
                          //                 }}>
                          //                 Family Members
                          //               </Text>
                          //             </View>

                          //             <>
                          //               {familyMembers.map((member, index) => {
                          //                 const firstName =
                          //                   member?.firstName?.value || '';
                          //                 const lastName =
                          //                   member?.lastName?.value || '';
                          //                 const relationship =
                          //                   member?.relationship?.value || '';
                          //                 const amount =
                          //                   member?.membershipamount?.value ||
                          //                   '0';

                          //                 return (
                          //                   <View key={index}>
                          //                     <View
                          //                       style={{
                          //                         flexDirection: 'row',
                          //                         justifyContent:
                          //                           'space-between',
                          //                         alignItems: 'center',
                          //                         paddingVertical: 6,
                          //                       }}>
                          //                       <View style={{flex: 1}}>
                          //                         <Text
                          //                           style={{
                          //                             fontSize:
                          //                               FONTS.FONTSIZE.SEMIMINI,
                          //                             fontFamily:
                          //                               FONTS.FONT_FAMILY
                          //                                 .MEDIUM,
                          //                             color:
                          //                               COLORS.PRIMARYBLACK,
                          //                           }}>
                          //                           {firstName} {lastName}
                          //                         </Text>
                          //                         <Text
                          //                           style={{
                          //                             fontSize:
                          //                               FONTS.FONTSIZE.MINI,
                          //                             fontFamily:
                          //                               FONTS.FONT_FAMILY
                          //                                 .REGULAR,
                          //                             color: COLORS.TITLECOLOR,
                          //                           }}>
                          //                           {relationship}
                          //                         </Text>
                          //                       </View>
                          //                       <Text
                          //                         style={{
                          //                           fontSize:
                          //                             FONTS.FONTSIZE.SEMIMINI,
                          //                           fontFamily:
                          //                             FONTS.FONT_FAMILY.MEDIUM,
                          //                           color: COLORS.LABELCOLOR,
                          //                         }}>
                          //                         $
                          //                         {parseFloat(amount).toFixed(
                          //                           0,
                          //                         )}
                          //                       </Text>
                          //                     </View>
                          //                     {index <
                          //                       familyMembers.length - 1 && (
                          //                       <View
                          //                         style={{
                          //                           height: 0.5,
                          //                           backgroundColor:
                          //                             COLORS.TABLEBORDER,
                          //                         }}
                          //                       />
                          //                     )}
                          //                   </View>
                          //                 );
                          //               })}

                          //               <View
                          //                 style={{
                          //                   height: 0.5,
                          //                   backgroundColor: COLORS.TABLEBORDER,
                          //                 }}
                          //               />
                          //             </>
                          //           </>
                          //         )}
                          //         <View
                          //           style={{
                          //             flexDirection: 'row',
                          //             justifyContent: 'space-between',
                          //             alignItems: 'center',
                          //             paddingTop: 6,
                          //           }}>
                          //           <Text
                          //             style={{
                          //               fontSize: FONTS.FONTSIZE.SEMIMINI,
                          //               fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
                          //               color: COLORS.PRIMARYBLACK,
                          //             }}>
                          //             Total Payable Amount
                          //           </Text>
                          //           <Text
                          //             style={{
                          //               fontSize: FONTS.FONTSIZE.SMALL,
                          //               fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
                          //               color: COLORS.LABELCOLOR,
                          //             }}>
                          //             ${totalAmount.toFixed(0)}
                          //           </Text>
                          //         </View>
                          //       </View>
                          //     </View>
                          //   );
                          // }

                          if (item?.name == 'totalmembershipamount') {
                            const personalInfoSection = formData.find(
                              section =>
                                section.headerKey === 'personalInfo' &&
                                section.isMultiple === true,
                            );

                            const allFamilyMembers =
                              personalInfoSection?.headerConfig || [];

                            const hasIsApprovedKey = allFamilyMembers.some(
                              member => member?.hasOwnProperty('isApproved'),
                            );

                            // ✅ FILTER 1: Approved & Not Paid (for total calculation)
                            const approvedNotPaidMembers = hasIsApprovedKey
                              ? allFamilyMembers.filter(member => {
                                  const hasIsApproved =
                                    member?.isApproved?.value !== undefined;
                                  if (hasIsApproved) {
                                    const isApproved =
                                      member?.isApproved?.value?.toLowerCase() ===
                                      'yes';
                                    const isNotPaid =
                                      member?.isPaid?.value?.toLowerCase() !==
                                      'yes';
                                    return isApproved && isNotPaid;
                                  }
                                  return (
                                    member?.isPaid?.value?.toLowerCase() !==
                                    'yes'
                                  );
                                })
                              : allFamilyMembers.filter(member => {
                                  return (
                                    member?.isPaid?.value?.toLowerCase() !==
                                    'yes'
                                  );
                                });

                            // ✅ NEW: FILTER 2: Not Approved Members (show with special label)
                            const notApprovedMembers = hasIsApprovedKey
                              ? allFamilyMembers.filter(member => {
                                  const isNotApproved =
                                    member?.isApproved?.value?.toLowerCase() !==
                                    'yes';
                                  return isNotApproved;
                                })
                              : [];

                            // ✅ Total calculation (only approved unpaid)
                            const totalAmount = approvedNotPaidMembers.reduce(
                              (sum, member) => {
                                const amount = parseFloat(
                                  member?.membershipamount?.value || 0,
                                );
                                return sum + amount;
                              },
                              0,
                            );

                            // ✅ COMBINED: All members to display
                            const allMembersToShow = [
                              ...approvedNotPaidMembers, // Approved & unpaid first
                              ...notApprovedMembers, // Not approved last
                            ];

                            return (
                              <View key={item?.key} style={{marginBottom: 16}}>
                                <View
                                  style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    paddingBottom: 5,
                                  }}>
                                  <Text
                                    style={{
                                      fontSize: FONTS.FONTSIZE.EXTRASMALL,
                                      fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
                                      color: COLORS.LABELCOLOR,
                                    }}>
                                    Total Membership Amount
                                  </Text>
                                  <Text
                                    style={{
                                      fontSize: FONTS.FONTSIZE.EXTRASMALL,
                                      fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
                                      color: COLORS.LABELCOLOR,
                                    }}>
                                    ${totalAmount.toFixed(0)}
                                  </Text>
                                </View>

                                <View
                                  style={{
                                    backgroundColor: COLORS.PRIMARYWHITE,
                                    borderRadius: 8,
                                    padding: 8,
                                    borderWidth: 1,
                                    borderColor: COLORS.TABLEBORDER,
                                  }}>
                                  {allMembersToShow.length > 0 && (
                                    <>
                                      {/* ✅ Family Members Header */}
                                      <View
                                        style={{
                                          flexDirection: 'row',
                                          alignItems: 'center',
                                          gap: 8,
                                          marginBottom: 8,
                                        }}>
                                        <View
                                          style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: 16,
                                            backgroundColor: '#E8F4FD',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                          }}>
                                          <Ionicons
                                            name="people-outline"
                                            size={20}
                                            color="#007AFF"
                                          />
                                        </View>
                                        <Text
                                          style={{
                                            fontSize: FONTS.FONTSIZE.SMALL,
                                            fontFamily:
                                              FONTS.FONT_FAMILY.SEMI_BOLD,
                                            color: COLORS.PRIMARYBLACK,
                                          }}>
                                          Family Members
                                        </Text>
                                      </View>

                                      {/* ✅ Render ALL Members */}
                                      {allMembersToShow.map((member, index) => {
                                        const firstName =
                                          member?.firstName?.value || '';
                                        const lastName =
                                          member?.lastName?.value || '';
                                        const relationship =
                                          member?.relationship?.value || '';
                                        const amount =
                                          member?.membershipamount?.value ||
                                          '0';

                                        // ✅ Check if Not Approved
                                        const isNotApproved =
                                          hasIsApprovedKey &&
                                          member?.isApproved?.value?.toLowerCase() !==
                                            'yes';

                                        return (
                                          <View key={index}>
                                            <View
                                              style={{
                                                flexDirection: 'row',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                paddingVertical: 6,
                                              }}>
                                              <View
                                                style={{
                                                  flex: 1,
                                                }}>
                                                <Text
                                                  numberOfLines={1}
                                                  style={{
                                                    fontSize:
                                                      FONTS.FONTSIZE.SEMIMINI,
                                                    fontFamily:
                                                      FONTS.FONT_FAMILY.MEDIUM,
                                                    color: COLORS.PRIMARYBLACK,
                                                  }}>
                                                  {firstName} {lastName}
                                                </Text>

                                                <View
                                                  style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                  }}>
                                                  <Text
                                                    numberOfLines={1}
                                                    style={{
                                                      fontSize:
                                                        FONTS.FONTSIZE.MINI,
                                                      fontFamily:
                                                        FONTS.FONT_FAMILY
                                                          .REGULAR,
                                                      color: COLORS.TITLECOLOR,
                                                      maxWidth: '65%',
                                                    }}>
                                                    {relationship}
                                                  </Text>
                                                  {isNotApproved && (
                                                    <View
                                                      style={{
                                                        backgroundColor:
                                                          '#FEE2E2',
                                                        paddingHorizontal: 6,
                                                        paddingVertical: 2,
                                                        borderRadius: 4,
                                                      }}>
                                                      <Text
                                                        style={{
                                                          fontSize:
                                                            FONTS.FONTSIZE
                                                              .MINI - 2.5,
                                                          fontFamily:
                                                            FONTS.FONT_FAMILY
                                                              .MEDIUM,
                                                          color: '#EF4444',
                                                        }}>
                                                        Not Approved
                                                      </Text>
                                                    </View>
                                                  )}
                                                </View>
                                              </View>
                                              <Text
                                                style={{
                                                  fontSize:
                                                    FONTS.FONTSIZE.SEMIMINI,
                                                  fontFamily:
                                                    FONTS.FONT_FAMILY.MEDIUM,
                                                  color: COLORS.LABELCOLOR,
                                                  marginLeft: 4,
                                                }}>
                                                ${parseFloat(amount).toFixed(0)}
                                              </Text>
                                            </View>

                                            {index <
                                              allMembersToShow.length - 1 && (
                                              <View
                                                style={{
                                                  height: 0.5,
                                                  backgroundColor:
                                                    COLORS.TABLEBORDER,
                                                }}
                                              />
                                            )}
                                          </View>
                                        );
                                      })}
                                    </>
                                  )}

                                  {/* ✅ Total Payable (only approved unpaid) */}
                                  {allMembersToShow.length > 0 && (
                                    <View
                                      style={{
                                        height: 1,
                                        backgroundColor: COLORS.TABLEBORDER,
                                        marginVertical: 6,
                                      }}
                                    />
                                  )}
                                  <View
                                    style={{
                                      flexDirection: 'row',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      paddingVertical: 8,
                                    }}>
                                    <Text
                                      style={{
                                        fontSize: FONTS.FONTSIZE.SEMIMINI,
                                        fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
                                        color: COLORS.PRIMARYBLACK,
                                      }}>
                                      Total Payable Amount
                                    </Text>
                                    <Text
                                      style={{
                                        fontSize: FONTS.FONTSIZE.SMALL,
                                        fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
                                        color: COLORS.PRIMARYBLACK,
                                      }}>
                                      ${totalAmount.toFixed(0)}
                                    </Text>
                                  </View>
                                </View>
                              </View>
                            );
                          }

                          return (
                            <View
                              key={item?.key}
                              style={{marginBottom: 8, gap: 4}}>
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
                                      color:
                                        errors[item?.key] || errors1[item?.key]
                                          ? COLORS.PRIMARYRED
                                          : COLORS.TITLECOLOR,
                                    }}>
                                    *
                                  </Text>
                                )}
                              </Text>
                              <TextInput
                                editable={
                                  item?.className == 'form-control disabled'
                                    ? false
                                    : true
                                }
                                style={{
                                  borderColor:
                                    errors[item?.key] || errors1[item?.key]
                                      ? COLORS.PRIMARYRED
                                      : COLORS.INPUTBORDER,
                                  color: COLORS.PRIMARYBLACK,
                                  fontSize: FONTS.FONTSIZE.MINI,
                                  fontFamily: FONTS.FONT_FAMILY.REGULAR,
                                  borderWidth: 1,
                                  height: 38,
                                  paddingVertical: 0,
                                  borderRadius: 10,
                                  paddingHorizontal: 8,
                                  backgroundColor: COLORS.PRIMARYWHITE,
                                }}
                                placeholderTextColor={COLORS.PLACEHOLDERCOLOR}
                                maxLength={
                                  isPhoneField(item?.name)
                                    ? 14
                                    : item?.maxLength == 0
                                    ? 250
                                    : item?.maxLength
                                }
                                keyboardType="number-pad"
                                placeholder={`${item.label}`}
                                value={
                                  isPhoneField(item?.name)
                                    ? formatPhoneToUS(currentValue)
                                    : currentValue
                                }
                                onChangeText={value => {
                                  const numericValue = isPhoneField(item?.name)
                                    ? unformatPhone(value)
                                    : value;
                                  setCurrentLengths(prev => ({
                                    ...prev,
                                    [item?.key]: numericValue?.length,
                                  }));
                                  handleNumberChange(
                                    formData[activeTab].headerKey,
                                    item.key,
                                    numericValue,
                                    item?.name,
                                    item?.maxLength,
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
                              {errors1[item?.key] && (
                                <Text
                                  style={{
                                    color: COLORS.PRIMARYRED,
                                    fontSize: FONTS.FONTSIZE.SMALL,
                                    fontFamily: FONTS.FONT_FAMILY.REGULAR,
                                    marginTop: 4,
                                  }}>
                                  {errors1[item?.key]}
                                </Text>
                              )}
                            </View>
                          );
                        }
                        break;
                      case 'tel':
                        if (shouldComponent || iEmptyUser) {
                          const currentValue = moduleData[activeTab].isMultiple
                            ? userData[0]?.[item.key]?.value || ''
                            : formData[activeTab]?.headerConfig?.find(
                                field => field?.[item?.key],
                              )?.[item?.key]?.value || '';
                          return (
                            <View
                              key={item?.key}
                              style={{marginBottom: 8, gap: 4}}>
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
                                      color:
                                        errors[item?.key] || errors1[item?.key]
                                          ? COLORS.PRIMARYRED
                                          : COLORS.TITLECOLOR,
                                    }}>
                                    *
                                  </Text>
                                )}
                              </Text>
                              <TextInput
                                editable={!isPhoneDisable}
                                style={{
                                  borderColor:
                                    errors[item?.key] || errors1[item?.key]
                                      ? COLORS.PRIMARYRED
                                      : COLORS.INPUTBORDER,
                                  color: COLORS.PRIMARYBLACK,
                                  fontSize: FONTS.FONTSIZE.MINI,
                                  fontFamily: FONTS.FONT_FAMILY.REGULAR,
                                  borderWidth: 1,
                                  height: 38,
                                  paddingVertical: 0,
                                  borderRadius: 10,
                                  paddingHorizontal: 8,
                                  backgroundColor: isPhoneDisable
                                    ? COLORS.TABLEROWCOLOR
                                    : COLORS.PRIMARYWHITE,
                                }}
                                placeholderTextColor={COLORS.PLACEHOLDERCOLOR}
                                maxLength={
                                  isPhoneField(item?.name)
                                    ? 14
                                    : item?.maxLength == 0
                                    ? 250
                                    : item?.maxLength
                                }
                                keyboardType="number-pad"
                                placeholder={`${item.label}`}
                                value={
                                  isPhoneField(item?.name)
                                    ? formatPhoneToUS(currentValue)
                                    : currentValue
                                }
                                onChangeText={value => {
                                  const numericValue = isPhoneField(item?.name)
                                    ? unformatPhone(value)
                                    : value;
                                  setCurrentLengths(prev => ({
                                    ...prev,
                                    [item?.key]: numericValue?.length,
                                  }));
                                  handleNumberChange(
                                    formData[activeTab].headerKey,
                                    item.key,
                                    numericValue,
                                    item?.name,
                                    item?.maxLength,
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
                              {errors1[item?.key] && (
                                <Text
                                  style={{
                                    color: COLORS.PRIMARYRED,
                                    fontSize: FONTS.FONTSIZE.SMALL,
                                    fontFamily: FONTS.FONT_FAMILY.REGULAR,
                                    marginTop: 4,
                                  }}>
                                  {errors1[item?.key]}
                                </Text>
                              )}
                            </View>
                          );
                        }
                        break;

                      case 'email':
                        if (shouldComponent || iEmptyUser) {
                          return (
                            <View
                              key={item?.key}
                              style={{marginBottom: 8, gap: 4}}>
                              <View
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                }}>
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
                                      color:
                                        errors[item?.key] || errors1[item?.key]
                                          ? COLORS.PRIMARYRED
                                          : COLORS.TITLECOLOR,
                                    }}>
                                    *
                                  </Text>
                                ) : null}
                              </View>
                              <TextInput
                                editable={!isEmailDisable}
                                style={{
                                  borderWidth: 1,
                                  height: 38,

                                  paddingVertical: 0,
                                  borderRadius: 10,
                                  paddingHorizontal: 8,
                                  borderColor:
                                    errors[item?.key] || errors1[item?.key]
                                      ? COLORS.PRIMARYRED
                                      : COLORS.INPUTBORDER,
                                  fontSize: FONTS.FONTSIZE.MINI,
                                  fontFamily: FONTS.FONT_FAMILY.REGULAR,
                                  color: COLORS.PRIMARYBLACK,
                                  backgroundColor: isEmailDisable
                                    ? COLORS.TABLEROWCOLOR
                                    : COLORS.PRIMARYWHITE,
                                }}
                                value={
                                  moduleData[activeTab].isMultiple
                                    ? userData[0]?.[item.key]?.value || null
                                    : formData[activeTab]?.headerConfig?.find(
                                        field => field?.[item?.key],
                                      )?.[item?.key]?.value || null
                                }
                                placeholderTextColor={COLORS.PLACEHOLDERCOLOR}
                                maxLength={
                                  item?.maxLength == 0 ? 250 : item?.maxLength
                                }
                                placeholder={`${item.label}`}
                                onChangeText={value => {
                                  setCurrentLengths(prev => ({
                                    ...prev,
                                    [item?.key]: value.length,
                                  }));
                                  handleEmail(
                                    formData[activeTab].headerKey,
                                    item?.key,
                                    value,
                                    item?.required,
                                    item?.name,
                                    item?.label,
                                  );
                                }}
                                keyboardType="email-address"
                              />
                              {(() => {
                                const max =
                                  item?.maxLength === 0 ? 250 : item?.maxLength;
                                const currentLength =
                                  currentLengths[item?.key] || 0;
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
                              {errors1[item?.key] && (
                                <Text
                                  style={{
                                    color: COLORS.PRIMARYRED,
                                    fontSize: FONTS.FONTSIZE.SMALL,
                                    fontFamily: FONTS.FONT_FAMILY.REGULAR,
                                    marginTop: 4,
                                  }}>
                                  {errors1[item?.key]}
                                </Text>
                              )}
                            </View>
                          );
                        }
                        break;

                      default:
                        return null;
                    }
                  })}
                  {(moduleData[activeTab]?.headerKey === 'personalInfo' &&
                    isAddPerson) ||
                  formData[activeTab]?.headerConfig?.length == 0 ? (
                    <View
                      style={{
                        flexDirection: 'row',
                        gap: 20,
                        alignSelf: 'center',
                      }}>
                      {editedUserIndex !== null ? (
                        <>
                          <ButtonComponent
                            title="Cancel"
                            onPress={() => {
                              handleCancel();
                            }}
                            width={'45%'}
                            backgroundColor={'transparent'}
                            textColor={COLORS.LABELCOLOR}
                          />
                          <ButtonComponent
                            title={'Save'}
                            onPress={addUser}
                            width={'45%'}
                            disabled={saveLoading}
                          />
                        </>
                      ) : formData[activeTab]?.headerConfig?.length == 0 ? (
                        <ButtonComponent
                          title={'Add'}
                          onPress={() => {
                            addUser();
                          }}
                          width={'45%'}
                          disabled={saveLoading}
                        />
                      ) : (
                        <>
                          <ButtonComponent
                            title="Cancel"
                            onPress={() => {
                              handleCancel();
                            }}
                            width={'45%'}
                            backgroundColor={'transparent'}
                            textColor={COLORS.LABELCOLOR}
                          />
                          <ButtonComponent
                            title={'Add'}
                            onPress={addUser}
                            width={'45%'}
                            disabled={saveLoading}
                          />
                        </>
                      )}
                    </View>
                  ) : null}
                </View>
                {activeTab === moduleData.length - 1 && (
                  <View style={{alignItems: 'center', marginHorizontal: 10}}>
                    {(() => {
                      const buttonState = getPaymentButtonState();

                      if (!buttonState) {
                        return null;
                      }
                      return (
                        <>
                          <TouchableOpacity
                            activeOpacity={0.35}
                            onPress={() => {
                              if (buttonState.requiresSave) {
                                submitHandller(true);
                              } else {
                                handlePay();
                              }
                            }}
                            disabled={buttonState.disabled || savePayLoading}
                            style={{
                              backgroundColor: buttonState.disabled
                                ? COLORS.INPUTBORDER
                                : COLORS.TITLECOLOR,
                              paddingVertical: 8,
                              borderRadius: 10,
                              width: '96%',
                              alignItems: 'center',
                              opacity: buttonState.disabled ? 0.5 : 1,
                            }}>
                            <Text
                              style={{
                                fontSize: FONTS.FONTSIZE.EXTRASMALL,
                                fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                                textAlign: 'center',
                                color: COLORS.PRIMARYWHITE,
                              }}>
                              {savePayLoading ? 'Saving...' : buttonState.label}
                            </Text>
                          </TouchableOpacity>

                          {/* Show message when button is disabled */}
                          {buttonState.showMessage && (
                            <Text
                              style={{
                                fontSize: FONTS.FONTSIZE.SEMIMINI,
                                fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                                color: COLORS.PLACEHOLDERCOLOR,
                              }}>
                              After Approval you will be able to pay.
                            </Text>
                          )}
                        </>
                      );
                    })()}
                  </View>
                )}

                <View style={{alignItems: 'center', marginHorizontal: 10}}>
                  {moduleData[activeTab]?.headerKey === 'personalInfo' &&
                  isAddPerson ? null : (
                    <>
                      {activeTab >= 1 &&
                      activeTab < moduleData.length - 1 &&
                      formData[activeTab]?.headerConfig?.length > 0 ? (
                        <View
                          style={{
                            flexDirection: 'row',
                            gap: 10,
                            alignItems: 'center',
                          }}>
                          <ButtonComponent
                            title="Previous"
                            onPress={handlePrivious}
                            width={'47%'}
                          />
                          <ButtonComponent
                            title="Next"
                            onPress={handleNext}
                            width={'47%'}
                          />
                        </View>
                      ) : activeTab === moduleData.length - 1 ? (
                        <View
                          style={{
                            flexDirection: 'row',
                            gap: 10,
                            alignItems: 'center',
                          }}>
                          <ButtonComponent
                            title="Preview"
                            onPress={handlePriview}
                            width={'47%'}
                            backgroundColor={'transparent'}
                            textColor={COLORS.LABELCOLOR}
                          />
                          <ButtonComponent
                            title={
                              saveLoading ? 'Saving...' : 'Save Registration'
                            }
                            onPress={() => submitHandller(false)}
                            width={'47%'}
                            disabled={saveLoading || activeButton}
                          />
                        </View>
                      ) : null}
                    </>
                  )}
                </View>
              </ScrollView>
            </View>

            {(moduleData[activeTab]?.headerKey === 'personalInfo' &&
              !moduleData.some(item => item.headerKey == 'memberDetails') &&
              !isAddPerson &&
              formData[activeTab]?.headerConfig?.length !== 0) ||
            moduleData[activeTab]?.headerKey === 'memberDetails' ? (
              <TouchableOpacity
                disabled={
                  formData[activeTab]?.headerConfig?.length > 0 ? false : true
                }
                onPress={handleNext}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  backgroundColor:
                    formData[activeTab]?.headerConfig?.length > 0
                      ? COLORS.LABELCOLOR
                      : COLORS.INACTIVEBUTTON,
                  borderRadius: 10,
                  paddingVertical: 8,
                  marginVertical: 10,
                  width: '90%',
                  alignSelf: 'center',
                  borderWidth: 1,
                  borderColor:
                    formData[activeTab]?.headerConfig?.length > 0
                      ? COLORS.LABELCOLOR
                      : COLORS.grey500,
                }}>
                <Text
                  style={{
                    color: COLORS.PRIMARYWHITE,
                    fontSize: FONTS.FONTSIZE.EXTRASMALL,
                    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                    textAlign: 'center',
                  }}>
                  Next
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <Offline />
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default Registration1;
