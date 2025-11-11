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
} from 'react-native';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {AntDesign} from '@react-native-vector-icons/ant-design';
import {Fontisto} from '@react-native-vector-icons/fontisto';
import {Feather} from '@react-native-vector-icons/feather';
import {Ionicons} from '@react-native-vector-icons/ionicons';
import {FontAwesome} from '@react-native-vector-icons/fontawesome';
import NetInfo from '@react-native-community/netinfo';
import {getData} from '../utils/Storage';
import {IMAGE_URL} from '../connection/Config';
import ImagePicker from 'react-native-image-crop-picker';
import {capitalizeFirstLetter, NOTIFY_MESSAGE} from '../constant/Module';
import COLORS from '../theme/Color';
import Loader from '../components/root/Loader';
import {useNavigation} from '@react-navigation/native';
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
import FastImage from 'react-native-fast-image';
import {getFileType} from '../utils/fileType';
import {Entypo} from '@react-native-vector-icons/entypo';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

const Registration1 = ({route}) => {
  const {item, isFromEventAdmin} = route.params.data;

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
    button: {
      padding: 8,
      borderRadius: 5,
      backgroundColor: COLORS.TITLECOLOR,
      marginVertical: 6,
      width: '100%',
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
      backgroundColor: '#4369c3',
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
  const [editedUserIndex, setEditedUserIndex] = useState(null);
  const originalMemberValues = useRef([]);
  const hasInitializedOriginal = useRef(false);

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
      const initializedData = moduleDate1.map(header => {
        if (header.isMultiple) {
          return {...header, headerConfig: userValues};
        }

        const headerConfigInitialized = Object.values(header?.headerConfig).map(
          item => {
            let initialValue;

            if (
              item.type === 'text' ||
              item.type === 'password' ||
              item.type === 'textarea' ||
              item.type === 'number'
            ) {
              initialValue = item?.value;
            } else if (item.type == 'radio-group') {
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

  useEffect(() => {
    if (userData1) {
      getRegForm();
      getMemberShipDetails();
    }
  }, [userData1]);

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

  const submitHandller = async () => {
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
        setSaveLoading(true);
        httpClient
          .post(`module/configuration/create?isMobile=true`, apiPayload)
          .then(response => {
            setSaveLoading(false);
            if (response.data.status) {
              NOTIFY_MESSAGE(response?.data?.message);
              if (isFromEventAdmin) {
                navigation.goBack();
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
            setSaveLoading(false);
            NOTIFY_MESSAGE(err ? 'something went wrong.' : null);
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

    setFormData(prevData =>
      prevData.map(section => {
        if (section.headerKey === headerKey) {
          if (section.isMultiple) {
            setuserData(prevUser =>
              prevUser.map(item => ({
                ...item,
                [key]: {
                  ...item[key],
                  value: numericValue,
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
                      value: numericValue,
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
    let isValid = true;
    let errorMessage;

    if (numericValue.trim() === '' && isRequired) {
      isValid = false;
      errorMessage = `${label} is required.`;
    } else if (numericValue === '0'.repeat(numericValue.length)) {
      isValid = false;
      errorMessage = `${label} cannot be all zeros.`;
    } else if (name === 'contact' || name === 'phoneNumber') {
      if (numericValue.length !== length) {
        isValid = false;
        errorMessage = `${label} must be ${length} digits.`;
      }
    } else if (name === 'age') {
      if (numericValue?.length > length) {
        isValid = false;
        errorMessage = `${label} must not exceed ${length} digits.`;
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

    let isValid = false;
    let errorMessage;

    if (name === 'emailAddress' || name === 'email') {
      if (
        value &&
        value.trim() !== '' &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ) {
        isValid = true;
      } else if (!value) {
        errorMessage = `${label} is required.`;
      } else {
        errorMessage = `${label} must be valid.`;
      }
    } else {
      if (value && value.trim() !== '') {
        isValid = true;
      } else if (!value && isRequired) {
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
    setFormData(prevFormData =>
      prevFormData.map(section => {
        if (section.headerKey === headerKey) {
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
        return section;
      }),
    );

    let isValid = value !== undefined;
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

  const handleFileChange = async (
    key,
    files,
    label,
    isRequired,
    isMultiple,
  ) => {
    // const unsupportedFormats = ['heic', 'image/heic'];

    // const fileArray = Array.isArray(files) ? files : [files];

    const validFiles = Array.isArray(files) ? files : [files];

    // const validFiles = fileArray.filter(file => {
    //   const fileExtension = file?.path?.split('.').pop()?.toLowerCase();
    //   if (
    //     unsupportedFormats.includes(fileExtension) ||
    //     unsupportedFormats.includes(file?.mime?.toLowerCase())
    //   ) {
    //     if (moduleData[activeTab]?.headerKey === 'personalInfo') {
    //       setErrors1(prevErrors => ({
    //         ...prevErrors,
    //         [key]: `${label} does not support HEIC files.`,
    //       }));
    //     } else {
    //       setErrors(prevErrors => ({
    //         ...prevErrors,
    //         [key]: `${label} does not support HEIC files.`,
    //       }));
    //     }
    //     Alert.alert('File not supported');
    //     return false;
    //   }
    //   return true;
    // });

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
        formData[activeTab].headerConfig[
          editedUserIndex
        ].membershipamount.value.replace(/[^0-9.-]+/g, '') || '0',
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
        updatedFormData[activeTab].headerConfig[
          editedUserIndex
        ].membershipamount.value.replace(/[^0-9.-]+/g, '') || '0',
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
        userData[0].membershipamount.value.replace(/[^0-9.-]+/g, '') || '0',
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
                membershipField.value.replace(/[^0-9.-]+/g, ''),
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
    const aIsSelf = a?.relationship?.value?.toLowerCase() === 'self';
    const bIsSelf = b?.relationship?.value?.toLowerCase() === 'self';

    if (aIsSelf && !bIsSelf) return -1;
    if (!aIsSelf && bIsSelf) return 1;
    return 0;
  });

  const renderTime = ({item, index}) => {
    const number = index >= 0 && index <= 9 ? `0${index + 1}` : `${index + 1}`;
    const handleToggle = index => {
      setOpenIndex(openIndex === index ? null : index);
    };

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
                width: width / 1.3,
              }}>
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                  fontSize: FONTS.FONTSIZE.EXTRASMALL,
                  color: COLORS.PLACEHOLDERCOLOR,
                  width: '60%',
                }}>
                {item.firstName?.value} {item.middleName?.value}{' '}
                {item.lastName?.value}
              </Text>
              {item.relationship?.value && (
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                    fontSize: FONTS.FONTSIZE.EXTRASMALL,
                    color: COLORS.PLACEHOLDERCOLOR,
                    width: '40%',
                    textAlign: 'right',
                    paddingRight: 6,
                  }}>
                  {item.relationship?.value}
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

                if (
                  (!fieldData?.label ||
                    fieldData?.value === null ||
                    fieldData?.value === undefined ||
                    fieldData?.value === '') &&
                  (item?.relationship?.value?.toLowerCase() === 'self' ||
                    item?.relationship?.value?.toLowerCase() ===
                      'single parent' ||
                    item?.relationship?.value?.toLowerCase() === 'additional')
                ) {
                  return null;
                }

                return (
                  <View style={{flexDirection: 'row'}} key={fieldKey}>
                    <Text style={styles.pkgLbl}>
                      {`${fieldData?.label} :`}{' '}
                    </Text>
                    <Text style={styles.pkgLbl1}>
                      {fieldData?.value ? fieldData?.value : '-'}
                    </Text>
                  </View>
                );
              })}
              {!(
                item?.relationship &&
                (item?.relationship?.value?.toLowerCase() === 'self' ||
                  item?.relationship?.value?.toLowerCase() ===
                    'single parent' ||
                  item?.relationship?.value?.toLowerCase() === 'additional')
              ) && (
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
    if (moduleData[activeTab]?.headerKey === 'personalInfo') {
      const firstTabConfigLength = formData[activeTab]?.headerConfig?.length;

      if (
        firstTabConfigLength > 0 &&
        firstTabConfigLength === 1 &&
        userData1?.role == 'member'
      ) {
        Alert.alert(
          'Info',
          'Please add at least one family member to register.',
        );
        return;
      } else if (firstTabConfigLength == 0) {
        return Alert.alert(
          'Info',
          'Please add at least one family member to register.',
        );
      }

      if (firstTabConfigLength > 0 && !validateCurrentTab()) {
        alert('Please fill all required fields before switching tabs.');
        return;
      }
    } else {
      if (!validateCurrentTab()) {
        alert('Please fill all required fields before switching tabs.');
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

    if (group?.headerConfig?.length === 1 && userData1?.role == 'member') {
      Alert.alert('Info', 'Please add at least one family member to register.');
      return;
    }

    const errors = validateFieldsInGroup(group, formData);
    setErrors(errors);

    if (Object.keys(errors).length > 0) {
      alert('Please correct the highlighted fields before proceeding.');
      return;
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
      const response = await httpClient.get(
        `module/configuration/dropdown/search?contentType=SIGN%20UP&keyword=${searchQuery}`,
      );

      if (response.data.status) {
        if (response.data.result.length > 0) {
          const checkboxValues = response.data.result.map(i => ({
            label: i.name,
            value: i.id,
          }));

          setModuleData(prevFields =>
            prevFields.map(field => {
              if (field.headerKey === 'memberDetails') {
                return {
                  ...field,
                  headerConfig: field.headerConfig.map(config => {
                    if (config.type == 'select' && config.name === 'member') {
                      return {
                        ...config,
                        values: checkboxValues,
                      };
                    }
                    return config;
                  }),
                };
              }
              return field;
            }),
          );
        } else {
          setModuleData(prevFields =>
            prevFields.map(field => {
              if (field.headerKey === 'memberDetails') {
                return {
                  ...field,
                  headerConfig: field.headerConfig.map(config => {
                    if (config.type == 'select' && config.name === 'member') {
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
    if (name == 'member' && text == '') {
      setModuleData(prevFields =>
        prevFields.map(field => {
          if (field.headerKey === 'memberDetails') {
            return {
              ...field,
              headerConfig: field.headerConfig.map(config => {
                if (config.type == 'select' && config.name === 'member') {
                  return {...config, values: originalMemberValues.current};
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

    const localMatches = originalMemberValues.current.filter(item =>
      item.label.toLowerCase().includes(text.toLowerCase()),
    );

    if (localMatches.length > 0) {
      setModuleData(prevFields =>
        prevFields.map(field => {
          if (field.headerKey == 'memberDetails') {
            return {
              ...field,
              headerConfig: field.headerConfig.map(config => {
                if (config.type == 'select' && config.name == 'member') {
                  return {
                    ...config,
                    values: localMatches,
                  };
                }
                return config;
              }),
            };
          }
          return field;
        }),
      );
    } else {
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
              iconStyle="solid"
              name="angle-left"
              size={26}
              color={COLORS.LABELCOLOR}
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
                  formData[activeTab]?.headerConfig?.length !== 0 && (
                    <TouchableOpacity
                      onPress={() => {
                        setEditedUserIndex(null);
                        setIsAddPerson(!isAddPerson);
                      }}
                      style={{
                        height: 40,
                        width: 40,
                        borderRadius: 20,
                        backgroundColor: COLORS.LABELCOLOR,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                      <AntDesign
                        name="plus"
                        size={26}
                        color={COLORS.PRIMARYWHITE}
                      />
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
                        paddingBottom: 20,
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
                    marginHorizontal: 14,
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
                        const selectedValue = formData
                          .find(
                            header => header.headerKey === 'paymentInformation',
                          )
                          ?.headerConfig.find(
                            config => Object.keys(config)[0] === item.key,
                          )?.[item.key]?.value;
                        // if (
                        //   item.className ===
                        //     'form-control mobile-hide memberid' ||
                        //   item.className === 'mobile-hide' ||
                        //   item.className === 'form-control mobile-hide'
                        // ) {
                        //   return null;
                        // }
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
                        // if (
                        //   item.className ===
                        //     'form-control mobile-hide memberid' ||
                        //   item.className === 'mobile-hide' ||
                        //   item.className === 'form-control mobile-hide'
                        // ) {
                        //   return null;
                        // }
                        if (shouldComponent || iEmptyUser) {
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
                              <Dropdown
                                autoScroll={false}
                                data={
                                  item?.values?.length > 0
                                    ? item.values
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
                                  handleSelectDropdown(
                                    formData[activeTab].headerKey,
                                    item.key,
                                    item1?.value,
                                    item1?.totalMembershipAmount,
                                    item?.name,
                                    item?.required,
                                    item?.label,
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
                        const paymentInfo = formData.find(
                          section => section.headerKey === 'paymentInformation',
                        );
                        const receiptField = paymentInfo?.headerConfig.find(
                          field => field?.receipt,
                        );

                        const receiptImagePath = receiptField?.receipt?.value;
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
                                  {item?.required && (
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

                              <View
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  gap: 4,
                                }}>
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
                              </View>

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

                              {(moduleData[activeTab].isMultiple
                                ? userData[0]?.[item.key]?.value || null
                                : formData[activeTab]?.headerConfig?.find(
                                    field => field?.[item?.key],
                                  )?.[item?.key]?.value ||
                                  null ||
                                  receiptImagePath) && (
                                <View
                                  style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    paddingHorizontal: 8,
                                  }}>
                                  <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}>
                                    {(() => {
                                      let rawValue = moduleData[activeTab]
                                        .isMultiple
                                        ? userData[0]?.[item.key]?.value || null
                                        : formData[
                                            activeTab
                                          ]?.headerConfig?.find(
                                            field => field?.[item?.key],
                                          )?.[item?.key]?.value ||
                                          null ||
                                          receiptImagePath;

                                      let mediaUris = [];

                                      try {
                                        const parsedValue =
                                          JSON.parse(rawValue);
                                        mediaUris = Array.isArray(parsedValue)
                                          ? parsedValue
                                          : [parsedValue];
                                      } catch (error) {
                                        mediaUris = rawValue ? [rawValue] : [];
                                      }

                                      return mediaUris.map((uri, index) => {
                                        const fullUri = uri
                                          ? `${IMAGE_URL}${uri}`
                                          : null;
                                        const fileType = getFileType(uri);

                                        return (
                                          <View key={index} style={{margin: 5}}>
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
                                                <FastImage
                                                  source={{
                                                    uri: fullUri,
                                                    cache:
                                                      FastImage.cacheControl
                                                        .immutable,
                                                    priority:
                                                      FastImage.priority.normal,
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
                                                    handleDeleteImage(
                                                      item?.key,
                                                      uri,
                                                      formData[activeTab]
                                                        .headerKey,
                                                    )
                                                  }>
                                                  <Entypo
                                                    name="circle-with-minus"
                                                    size={26}
                                                    color={COLORS.PRIMARYRED}
                                                  />
                                                </TouchableOpacity>
                                              </TouchableOpacity>
                                            ) : null}
                                          </View>
                                        );
                                      });
                                    })()}
                                  </ScrollView>
                                </View>
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
                          return item?.name == 'membershipamount' ||
                            item?.name == 'totalmembershipamount' ? (
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
                          ) : (
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
                                  item?.maxLength == 0 ? 250 : item?.maxLength
                                }
                                keyboardType="number-pad"
                                placeholder={`${item.label}`}
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
                                  handleNumberChange(
                                    formData[activeTab].headerKey,
                                    item.key,
                                    value,
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
                                  item?.maxLength == 0 ? 250 : item?.maxLength
                                }
                                keyboardType="number-pad"
                                placeholder={`${item.label}`}
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
                                  handleNumberChange(
                                    formData[activeTab].headerKey,
                                    item.key,
                                    value,
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
                                  backgroundColor: COLORS.PRIMARYWHITE,
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
                <View
                  style={{
                    alignItems: 'center',
                    marginHorizontal: 20,
                  }}>
                  {moduleData[activeTab]?.headerKey === 'personalInfo' &&
                  isAddPerson ? null : (
                    <>
                      {activeTab >= 1 &&
                      activeTab < moduleData.length - 1 &&
                      formData[activeTab]?.headerConfig?.length > 0 ? (
                        <View
                          style={{
                            flexDirection: 'row',
                            gap: 20,
                            alignItems: 'center',
                          }}>
                          <ButtonComponent
                            title="Previous"
                            onPress={handlePrivious}
                            width={'45%'}
                          />
                          <ButtonComponent
                            title="Next"
                            onPress={handleNext}
                            width={'45%'}
                          />
                        </View>
                      ) : activeTab === moduleData.length - 1 ? (
                        <View
                          style={{
                            flexDirection: 'row',
                            gap: 20,
                            alignItems: 'center',
                          }}>
                          <ButtonComponent
                            title="Preview"
                            onPress={handlePriview}
                            width={'45%'}
                            backgroundColor={'transparent'}
                            textColor={COLORS.LABELCOLOR}
                          />
                          <ButtonComponent
                            title={
                              saveLoading ? 'Saving...' : 'Save Registration'
                            }
                            onPress={submitHandller}
                            width={'45%'}
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
