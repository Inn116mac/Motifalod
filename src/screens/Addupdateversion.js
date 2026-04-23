import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import CustomHeader from '../components/root/CustomHeader';
import COLORS from '../theme/Color';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import FONTS from '../theme/Fonts';
import ButtonComponent from '../components/root/ButtonComponent';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import moment from 'moment';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import httpClient from '../connection/httpClient';
import {NOTIFY_MESSAGE} from '../constant/Module';
import NetInfo from '@react-native-community/netinfo';

const PLATFORMS = ['android', 'ios'];

const AddUpdateVersion = ({route}) => {
  const {data, isEdit = false} = route.params || {};
  const navigation = useNavigation();
  const [saveLoader, setSaveLoader] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    platform: data?.platform || '',
    latestVersion: data?.latestVersion || '',
    minVersion: data?.minVersion || '',
    forceUpdate: data?.forceUpdate ?? false,
    storeUrl: data?.storeUrl || '',
    appName: data?.appName || '',
    message: data?.message || '',
    updatedDate: data?.updatedDate
      ? moment(data.updatedDate, 'MMM D, YYYY').toDate()
      : new Date(),
  });

  const setField = (key, value) => {
    setForm(prev => ({...prev, [key]: value}));
    setErrors(prev => ({...prev, [key]: null}));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.platform) newErrors.platform = 'Platform is required.';
    if (!form.latestVersion?.trim())
      newErrors.latestVersion = 'Latest version is required.';
    if (!form.minVersion?.trim())
      newErrors.minVersion = 'Min version is required.';
    if (!form.storeUrl?.trim()) newErrors.storeUrl = 'Store URL is required.';
    if (!form.appName?.trim()) newErrors.appName = 'App name is required.';
    if (!form.message?.trim()) newErrors.message = 'Message is required.';
    if (!form.updatedDate) newErrors.updatedDate = 'Updated date is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildPayload = () => ({
    platform: form.platform,
    latestVersion: form.latestVersion.trim(),
    minVersion: form.minVersion.trim(),
    forceUpdate: form.forceUpdate,
    storeUrl: form.storeUrl.trim(),
    appName: form.appName.trim(),
    message: form.message.trim(),
    updatedDate: moment(form.updatedDate).format('MMM D, YYYY'),
  });

  const handleSave = () => {
    if (!validate()) return;

    const payload = buildPayload();

    NetInfo.fetch().then(state => {
      if (!state.isConnected) {
        NOTIFY_MESSAGE('Please check your internet connectivity');
        return;
      }
      setSaveLoader(true);
      httpClient
        .put('app/version', payload)
        .then(response => {
          if (response?.data?.status) {
            NOTIFY_MESSAGE(response.data.message || 'Saved successfully');
            navigation.goBack();
          } else {
            NOTIFY_MESSAGE(response?.data?.message || 'Save failed');
          }
        })
        .catch(() => NOTIFY_MESSAGE('Something Went Wrong'))
        .finally(() => setSaveLoader(false));
    });
  };

  const renderLabel = (label, errorKey) => (
    <View style={styles.labelRow}>
      <Text style={styles.label}>{label}</Text>
      <Text
        style={[
          styles.asterisk,
          errors[errorKey] && {color: COLORS.PRIMARYRED},
        ]}>
        {' *'}
      </Text>
    </View>
  );

  const renderError = key =>
    errors[key] ? <Text style={styles.errorText}>{errors[key]}</Text> : null;

  const renderInput = ({
    label,
    errorKey,
    placeholder,
    value,
    onChangeText,
    keyboardType = 'default',
    multiline = false,
    editable = true,
  }) => (
    <View style={styles.fieldWrapper}>
      {renderLabel(label, errorKey)}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.INPUTBORDER}
        keyboardType={keyboardType}
        multiline={multiline}
        editable={editable}
        style={[
          styles.input,
          multiline && {
            height: 100,
            textAlignVertical: 'top',
            paddingVertical: 4,
          },
          !editable && {backgroundColor: '#f3f4f6'},
          errors[errorKey] && {borderColor: COLORS.PRIMARYRED},
        ]}
      />
      {renderError(errorKey)}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{flex: 1, backgroundColor: COLORS.BACKGROUNDCOLOR}}
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
        title={isEdit ? 'Update Version' : 'Add Version'}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.fieldWrapper}>
          {renderLabel('Platform', 'platform')}
          <View style={styles.platformRow}>
            {PLATFORMS.map(p => {
              const isSelected = form.platform === p;
              const isDisabled = isEdit;
              return (
                <TouchableOpacity
                  key={p}
                  disabled={isDisabled}
                  onPress={() => setField('platform', p)}
                  activeOpacity={0.8}
                  style={[
                    styles.platformBox,
                    isSelected && styles.platformBoxSelected,
                    isDisabled && {opacity: 0.6},
                    errors.platform &&
                      !isSelected && {borderColor: COLORS.PRIMARYRED},
                  ]}>
                  <FontAwesome6
                    name={p === 'android' ? 'android' : 'apple'}
                    size={24}
                    color={
                      isSelected
                        ? COLORS.PRIMARYWHITE
                        : p === 'android'
                        ? '#3DDC84'
                        : '#555'
                    }
                    iconStyle="brand"
                  />
                  <Text
                    style={[
                      styles.platformLabel,
                      isSelected && {color: COLORS.PRIMARYWHITE},
                    ]}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {renderError('platform')}
        </View>

        {renderInput({
          label: 'App Name',
          errorKey: 'appName',
          placeholder: 'e.g. Inngenius Community',
          value: form.appName,
          onChangeText: v => setField('appName', v),
        })}

        {renderInput({
          label: 'Latest Version',
          errorKey: 'latestVersion',
          placeholder: 'e.g. 1.2',
          value: form.latestVersion,
          onChangeText: v => setField('latestVersion', v),
        })}

        {renderInput({
          label: 'Min Version',
          errorKey: 'minVersion',
          placeholder: 'e.g. 1.1',
          value: form.minVersion,
          onChangeText: v => setField('minVersion', v),
        })}

        {renderInput({
          label: 'Store URL',
          errorKey: 'storeUrl',
          placeholder:
            form.platform === 'ios'
              ? 'https://apps.apple.com/app/id...'
              : 'https://play.google.com/store/apps/...',
          value: form.storeUrl,
          onChangeText: v => setField('storeUrl', v),
          keyboardType: 'url',
          multiline: true,
        })}

        <View style={styles.fieldWrapper}>
          {renderLabel('Updated Date', 'updatedDate')}
          <TouchableOpacity
            onPress={() => setDatePickerVisible(true)}
            style={[
              styles.datePicker,
              errors.updatedDate && {borderColor: COLORS.PRIMARYRED},
            ]}>
            <Text style={styles.dateText}>
              {form.updatedDate
                ? moment(form.updatedDate).format('MMM D, YYYY')
                : 'Select Date'}
            </Text>
            <MaterialDesignIcons
              name="calendar-month-outline"
              size={22}
              color={COLORS.PLACEHOLDERCOLOR}
            />
          </TouchableOpacity>
          {renderError('updatedDate')}

          <DateTimePickerModal
            isVisible={datePickerVisible}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            date={form.updatedDate || new Date()}
            onConfirm={date => {
              setField('updatedDate', date);
              setDatePickerVisible(false);
            }}
            onCancel={() => setDatePickerVisible(false)}
          />
        </View>

        {renderInput({
          label: 'Release Message',
          errorKey: 'message',
          placeholder: 'e.g. Bug fixes and improvements',
          value: form.message,
          onChangeText: v => setField('message', v),
          multiline: true,
        })}

        <View style={styles.fieldWrapper}>
          <View style={styles.switchContainer}>
            <Switch
              value={form.forceUpdate}
              trackColor={{true: COLORS.PRIMARYGREEN, false: COLORS.grey500}}
              thumbColor={COLORS.PRIMARYWHITE}
              onValueChange={value => setField('forceUpdate', value)}
            />
            <Text style={styles.switchLabel}>Force Update</Text>
          </View>
        </View>

        <ButtonComponent
          disabled={saveLoader}
          title={saveLoader ? 'Please Wait...' : isEdit ? 'Update' : 'Submit'}
          onPress={handleSave}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AddUpdateVersion;

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 30,
    paddingTop: 6,
  },
  fieldWrapper: {
    marginTop: 14,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  label: {
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    color: COLORS.TITLECOLOR,
  },
  asterisk: {
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    color: COLORS.TITLECOLOR,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.INPUTBORDER,
    borderRadius: 8,
    height: 42,
    paddingHorizontal: 12,
    color: COLORS.PRIMARYBLACK,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    backgroundColor: COLORS.PRIMARYWHITE,
    paddingVertical: 0,
  },
  errorText: {
    color: COLORS.PRIMARYRED,
    fontSize: FONTS.FONTSIZE.MINI,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    marginTop: 3,
  },
  platformRow: {
    flexDirection: 'row',
    gap: 12,
  },
  platformBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: COLORS.INPUTBORDER,
    borderRadius: 10,
    paddingVertical: 12,
    backgroundColor: COLORS.PRIMARYWHITE,
  },
  platformBoxSelected: {
    backgroundColor: COLORS.LABELCOLOR,
    borderColor: COLORS.LABELCOLOR,
  },
  platformLabel: {
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.SMALL,
    color: COLORS.TITLECOLOR,
  },
  datePicker: {
    borderWidth: 1,
    borderColor: COLORS.INPUTBORDER,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.PRIMARYWHITE,
  },
  dateText: {
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    color: COLORS.PRIMARYBLACK,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchLabel: {
    fontSize: FONTS.FONTSIZE.SMALL,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    color: COLORS.TITLECOLOR,
  },
});
