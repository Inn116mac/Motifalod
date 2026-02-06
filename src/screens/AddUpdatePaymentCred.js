import {
  Text,
  StyleSheet,
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  Switch,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import COLORS from '../theme/Color';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import CustomHeader from '../components/root/CustomHeader';
import FONTS from '../theme/Fonts';
import httpClient from '../connection/httpClient';
import {NOTIFY_MESSAGE} from '../constant/Module';
import NetInfo from '@react-native-community/netinfo';
import ButtonComponent from '../components/root/ButtonComponent';
import {Dropdown} from 'react-native-element-dropdown';

const AddUpdatePaymentCred = ({route}) => {
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
    {label: 'sandbox', value: 'sandbox'},
    {label: 'production', value: 'production'},
  ];

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientId: '',
    secretId: '',
    publicKey: '',
    environment: '',
    paymentType: '',
    isActive: true,
  });
  // console.log(formData);

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit && editItem) {
      setFormData({
        clientId: editItem.clientId || 0,
        secretId: editItem.secretId || '',
        publicKey: editItem.publicKey || '',
        environment: editItem.environment || '',
        paymentType: editItem?.paymentType || '',
        isActive:
          editItem?.isActive == '1' ||
          editItem?.isActive == true ||
          editItem?.isActive
            ? true
            : false,
      });
    }
  }, [isEdit, editItem]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.clientId) {
      newErrors.clientId = 'Client id is required.';
    }
    if (!formData.secretId) {
      newErrors.secretId = 'Secret id is required.';
    }
    if (!formData.publicKey) {
      newErrors.publicKey = 'publicKey is required.';
    }
    if (!formData.environment) {
      newErrors.environment = 'Environment is required.';
    }
    if (!formData.paymentType) {
      newErrors.paymentType = 'Payment Type is required.';
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
      ? httpClient.put(
          `setting/thirdpartygateways/update/${editItem?.id}`,
          formData,
        )
      : httpClient.post('setting/thirdpartygateways/create', formData);

    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setIsLoading(true);
        apiCall
          .then(response => {
            if (response.data.status) {
              NOTIFY_MESSAGE(
                response.data.message ||
                  `Data ${isEdit ? 'updated' : 'added'} successfully`,
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

  const toggleSwitch = (field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
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
        title={isEdit ? 'Edit Payment Credentials' : 'Add Payment Credentials'}
      />

      <>
        <ScrollView
          contentContainerStyle={[styles.scrollContainer]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* clientId */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Client Id{' '}
              <Text
                style={{
                  fontSize: FONTS.FONTSIZE.SMALL,
                  fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                  color: errors?.clientId
                    ? COLORS.PRIMARYRED
                    : COLORS.TITLECOLOR,
                }}>
                *
              </Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                errors?.clientId && styles.errorInput,
                {height: 100, textAlignVertical: 'top', paddingTop: 10},
              ]}
              placeholder="Client Id"
              placeholderTextColor={COLORS.grey500}
              value={formData?.clientId}
              multiline
              numberOfLines={4}
              onChangeText={value => {
                setFormData(prev => ({...prev, clientId: value}));
                if (errors?.clientId) {
                  setErrors(prev => {
                    const newErrors = {...prev};
                    delete newErrors?.clientId;
                    return newErrors;
                  });
                }
              }}
            />
            {errors?.clientId && (
              <Text style={styles.errorText}>{errors?.clientId}</Text>
            )}
          </View>

          {/* secretId */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Secret Id{' '}
              <Text
                style={{
                  fontSize: FONTS.FONTSIZE.SMALL,
                  fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                  color: errors?.secretId
                    ? COLORS.PRIMARYRED
                    : COLORS.TITLECOLOR,
                }}>
                *
              </Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                errors?.secretId && styles.errorInput,
                {height: 100, textAlignVertical: 'top', paddingTop: 10},
              ]}
              placeholder="Secret Id"
              placeholderTextColor={COLORS.grey500}
              value={formData?.secretId}
              multiline
              numberOfLines={4}
              onChangeText={value => {
                setFormData(prev => ({...prev, secretId: value}));
                if (errors?.secretId) {
                  setErrors(prev => {
                    const newErrors = {...prev};
                    delete newErrors?.secretId;
                    return newErrors;
                  });
                }
              }}
            />
            {errors?.secretId && (
              <Text style={styles.errorText}>{errors?.secretId}</Text>
            )}
          </View>

          {/* publicKey */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Public Key{' '}
              <Text
                style={{
                  fontSize: FONTS.FONTSIZE.SMALL,
                  fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                  color: errors?.publicKey
                    ? COLORS.PRIMARYRED
                    : COLORS.TITLECOLOR,
                }}>
                *
              </Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                errors?.publicKey && styles.errorInput,
                {height: 100, textAlignVertical: 'top', paddingTop: 10},
              ]}
              placeholder="Public Key"
              placeholderTextColor={COLORS.grey500}
              value={formData?.publicKey}
              multiline
              numberOfLines={4}
              onChangeText={value => {
                setFormData(prev => ({...prev, publicKey: value}));
                if (errors?.publicKey) {
                  setErrors(prev => {
                    const newErrors = {...prev};
                    delete newErrors?.publicKey;
                    return newErrors;
                  });
                }
              }}
            />
            {errors?.publicKey && (
              <Text style={styles.errorText}>{errors?.publicKey}</Text>
            )}
          </View>

          {/* paymentType */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Payment Type{' '}
              <Text
                style={{
                  fontSize: FONTS.FONTSIZE.SMALL,
                  fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                  color: errors?.paymentType
                    ? COLORS.PRIMARYRED
                    : COLORS.TITLECOLOR,
                }}>
                *
              </Text>
            </Text>
            <TextInput
              style={[styles.input, errors?.paymentType && styles.errorInput]}
              placeholder="Payment Type"
              placeholderTextColor={COLORS.grey500}
              value={formData?.paymentType}
              onChangeText={value => {
                setFormData(prev => ({...prev, paymentType: value}));
                if (errors?.paymentType) {
                  setErrors(prev => {
                    const newErrors = {...prev};
                    delete newErrors?.paymentType;
                    return newErrors;
                  });
                }
              }}
            />
            {errors?.paymentType && (
              <Text style={styles.errorText}>{errors?.paymentType}</Text>
            )}
          </View>

          {/* Environment */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Environment{' '}
              <Text
                style={{
                  fontSize: FONTS.FONTSIZE.SMALL,
                  fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                  color: errors?.environment
                    ? COLORS.PRIMARYRED
                    : COLORS.TITLECOLOR,
                }}>
                *
              </Text>
            </Text>
            <Dropdown
              onFocus={() => {
                Keyboard.dismiss();
              }}
              style={[
                styles.dropdown,
                errors?.environment && styles.dropdownError,
              ]}
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
              value={formData?.environment}
              autoScroll={false}
              onChange={item => {
                setFormData(prev => ({...prev, environment: item?.value}));
                if (errors?.environment) {
                  setErrors(prev => {
                    const newErrors = {...prev};
                    delete newErrors?.environment;
                    return newErrors;
                  });
                }
              }}
              itemTextStyle={styles.itemText}
              placeholder="Select Environment"
              maxHeight={200}
              renderItem={item => (
                <View style={styles.itemContainer}>
                  <Text style={styles.itemText}>{item.label}</Text>
                </View>
              )}
            />
            {errors?.environment && (
              <Text style={styles.errorText}>{errors?.environment}</Text>
            )}
          </View>

          {/* isActive Switch */}
          <View style={styles.switchContainer}>
            <Switch
              value={formData?.isActive}
              trackColor={{true: COLORS.PRIMARYGREEN, false: COLORS.grey500}}
              thumbColor={COLORS.PRIMARYWHITE}
              onValueChange={value => toggleSwitch('isActive', value)}
            />
            <Text
              style={{
                fontSize: FONTS.FONTSIZE.SMALL,
                fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                color: COLORS.TITLECOLOR,
                includeFontPadding: false,
              }}>
              Is Active
            </Text>
          </View>
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
            title={isLoading ? 'Please Wait...' : isEdit ? 'Update' : 'Submit'}
            onPress={handleSubmit}
            disabled={isLoading}
          />
        </View>
      </>
    </KeyboardAvoidingView>
  );
};

export default AddUpdatePaymentCred;
