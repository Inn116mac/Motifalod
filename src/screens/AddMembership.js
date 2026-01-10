import {
  Text,
  StyleSheet,
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
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

const AddMembership = ({route}) => {
  const navigation = useNavigation();
  const {item, isEdit, editItem, configurationId} = route?.params?.data || {};

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    id: 0,
    name: '',
    description: '',
    price: '',
    currency: '',
    userId: 0,
    configurationId: 0,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit && editItem) {
      const parsedContent =
        typeof editItem.content === 'string'
          ? JSON.parse(editItem.content)
          : editItem.content;

      setFormData({
        id: editItem.id || 0,
        name: parsedContent?.membership?.value ?? editItem.name ?? '',
        description:
          parsedContent?.description?.value ?? editItem.description ?? '',
        price: String(parsedContent?.price?.value ?? editItem.price ?? ''),
        currency: parsedContent?.currency?.value ?? editItem.currency ?? '',
        userId: 0,
        configurationId: 0,
      });
    }
  }, [isEdit, editItem, configurationId]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Membership Name is required.';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Relationship Name is required.';
    }

    if (!formData.currency.trim()) {
      newErrors.currency = 'Currency is required.';
    }

    if (!formData.price || formData.price.trim() === '') {
      newErrors.price = 'Price is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const payload = {
    id: formData.id,
    name: formData.name.trim(),
    description: formData.description.trim(),
    price: parseFloat(formData.price),
    currency: formData.currency.trim().toUpperCase(),
    userId: formData.userId,
    configurationId: formData.configurationId,
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setIsLoading(true);

        httpClient
          .post('member/manageMembership', payload)
          .then(response => {
            if (response.data.status) {
              NOTIFY_MESSAGE(
                response.data.message ||
                  `Membership ${isEdit ? 'updated' : 'added'} successfully`,
              );
              navigation.goBack();
            } else {
              NOTIFY_MESSAGE(response.data.message || 'Operation failed');
            }
          })
          .catch(error => {
            const errorMessage =
              error?.response?.data?.message ||
              error?.message ||
              'Something went wrong. Please try again.';
            NOTIFY_MESSAGE(errorMessage);
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        NOTIFY_MESSAGE('No internet connection. Please check your network.');
      }
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.BACKGROUNDCOLOR,
    },
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: 16,
      paddingTop: 20,
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
        title={isEdit ? 'Edit Membership' : 'Add Membership'}
      />

      <>
        <ScrollView
          contentContainerStyle={[styles.scrollContainer]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Membership Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Membership Name{' '}
              <Text
                style={{
                  fontSize: FONTS.FONTSIZE.SMALL,
                  fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                  color: errors?.description
                    ? COLORS.PRIMARYRED
                    : COLORS.TITLECOLOR,
                }}>
                *
              </Text>
            </Text>
            <TextInput
              style={[styles.input, errors?.description && styles.errorInput]}
              placeholder="Membership Name"
              placeholderTextColor={COLORS.grey500}
              value={formData?.description}
              onChangeText={value => handleInputChange('description', value)}
            />
            {errors?.description && (
              <Text style={styles.errorText}>{errors?.description}</Text>
            )}
          </View>

          {/* Description */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Relationship Name{' '}
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
              editable={!isEdit}
              style={[styles.input, errors?.name && styles.errorInput]}
              placeholder="Relationship Name"
              placeholderTextColor={COLORS.grey500}
              value={formData?.name}
              onChangeText={value => handleInputChange('name', value)}
            />
            {errors?.name && (
              <Text style={styles.errorText}>{errors?.name}</Text>
            )}
          </View>

          {/* Currency */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Currency{' '}
              <Text
                style={{
                  fontSize: FONTS.FONTSIZE.SMALL,
                  fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                  color: errors.currency
                    ? COLORS.PRIMARYRED
                    : COLORS.TITLECOLOR,
                }}>
                *
              </Text>
            </Text>
            <TextInput
              style={[styles.input, errors.currency && styles.errorInput]}
              placeholder="Currency"
              placeholderTextColor={COLORS.grey500}
              value={formData.currency}
              onChangeText={value =>
                handleInputChange('currency', value.toUpperCase())
              }
              autoCapitalize="characters"
            />
            {errors.currency && (
              <Text style={styles.errorText}>{errors.currency}</Text>
            )}
          </View>

          {/* Price */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Price{' '}
              <Text
                style={{
                  fontSize: FONTS.FONTSIZE.SMALL,
                  fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                  color: errors.price ? COLORS.PRIMARYRED : COLORS.TITLECOLOR,
                }}>
                *
              </Text>
            </Text>
            <TextInput
              style={[styles.input, errors.price && styles.errorInput]}
              placeholder="Price"
              placeholderTextColor={COLORS.grey500}
              value={formData.price}
              onChangeText={value => handleInputChange('price', value)}
              keyboardType="decimal-pad"
            />
            {errors.price && (
              <Text style={styles.errorText}>{errors.price}</Text>
            )}
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
          {/* <ButtonComponent
            title="Cancel"
            onPress={handleCancel}
            disabled={isLoading}
            width="45%"
            backgroundColor={COLORS.BACKGROUNDCOLOR}
            textColor={COLORS.LABELCOLOR}
          /> */}

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

export default AddMembership;
