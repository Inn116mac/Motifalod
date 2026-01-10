import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import CustomHeader from '../components/root/CustomHeader';
import COLORS from '../theme/Color';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {FontAwesome} from '@react-native-vector-icons/fontawesome';
import {useNavigation} from '@react-navigation/native';
import FONTS from '../theme/Fonts';
import NetInfo from '@react-native-community/netinfo';
import httpClient from '../connection/httpClient';
import {NOTIFY_MESSAGE} from '../constant/Module';
import Loader from '../components/root/Loader';
import {Dropdown} from 'react-native-element-dropdown';
import ButtonComponent from '../components/root/ButtonComponent';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import moment from 'moment';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

const AddUpdateReminder = ({route}) => {
  const {data, isEdit = false} = route.params || {};
  const navigation = useNavigation();
  const {width} = useWindowDimensions();
  const scrollViewRef = useRef(null);
  const eventInfoRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveLoader, setSaveLoader] = useState(false);
  const [allUserData, setAllUserData] = useState([]);
  const [moduleData, setModuleData] = useState([]);
  const [errors, setErrors] = useState({});
  const [eventInfoData, setEventInfoData] = useState([]);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [recurDatePickerVisible, setRecurDatePickerVisible] = useState(false);
  const [infoLoader, setInfoLoader] = useState(false);

  const onDateChange = date => {
    setForm(prev => ({...prev, eventDate: date}));
    setErrors(prev => ({...prev, eventDate: null}));
    setDatePickerVisible(false);
  };
  const selectedRoleIds = useMemo(() => {
    return data?.roles ? data.roles.split(',').map(Number).filter(Boolean) : [];
  }, [data?.roles]);

  const ACTIONS = [
    {key: 'isEmail', label: 'Email'},
    {key: 'isSMS', label: 'SMS'},
    {key: 'isNotification', label: 'Notification'},
    {key: 'isRecur', label: 'isRecur'},
  ];

  const [actions, setActions] = useState({
    isEmail: data?.isEmail || false,
    isSMS: data?.isSMS || false,
    isNotification: data?.isNotification || false,
  });

  useEffect(() => {
    if (isEdit && data) {
      setActions({
        isEmail: data.isEmail || false,
        isSMS: data.isSMS || false,
        isNotification: data.isNotification || false,
        isRecur: data.isRecur || false,
      });
    }
  }, [isEdit, data]);

  const [form, setForm] = useState({
    configurationId: data?.configurationId || 0,
    isEmail: data?.isEmail || false,
    isSMS: data?.isSMS || false,
    isNotification: data?.isNotification || false,
    emailSubject: data?.emailSubject || '',
    emailBody: data?.emailBody || '',
    smsText: data?.smsText || '',
    notificationText: data?.notificationText || '',
    isRecur: data?.isRecur || false,
    roles: data?.roles || '',
    moduleId: data?.moduleId || null,
    rsvp: 0,
    reminderType: data?.reminderType || null,
    reminderBefore: data?.reminderBefore || 0,
    eventDate: data?.eventDate || new Date(),
    eventDate: data?.eventDate ? new Date(data.eventDate) : new Date(),
    recurReminderStartDate: data?.recurReminderStartDate
      ? new Date(data.recurReminderStartDate)
      : null,
  });
  const onRecurDateChange = date => {
    setForm(prev => ({...prev, recurReminderStartDate: date}));
    setErrors(prev => ({...prev, recurReminderStartDate: null}));
    setRecurDatePickerVisible(false);
  };

  const REMINDER_TYPE_OPTIONS = [
    {label: 'Hour', value: 'HOUR'},
    {label: 'Day', value: 'DAY'},
    {label: 'Week', value: 'WEEK'},
  ];

  useEffect(() => {
    if (isEdit && data?.eventDate) {
      setForm(prev => ({
        ...prev,
        eventDate: new Date(data.eventDate),
      }));
    }
  }, [isEdit, data?.eventDate]);

  const toggleAction = key => {
    const newValue = !actions[key];
    setActions(prev => ({...prev, [key]: newValue}));

    setForm(prev => {
      const updatedForm = {...prev, [key]: newValue};

      if (key === 'isRecur' && !newValue) {
        updatedForm.recurReminderStartDate = null;
      }

      return updatedForm;
    });
  };

  const IconCheckbox = ({label, checked, onPress}) => {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={{flexDirection: 'row', alignItems: 'center', width: '28%'}}>
        {checked ? (
          <FontAwesome6
            name={'square-check'}
            size={20}
            color={COLORS.LABELCOLOR}
            style={{marginTop: 2}}
            iconStyle="solid"
          />
        ) : (
          <FontAwesome
            name={'square-o'}
            size={23}
            color={'#d1d6df'}
            style={{marginTop: 2}}
          />
        )}
        <Text
          style={{
            marginLeft: 6,
            fontFamily: FONTS.FONT_FAMILY.MEDIUM,
            fontSize: FONTS.FONTSIZE.SEMIMINI,
            color: COLORS.TITLECOLOR,
          }}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };
  const renderRequiredLabel = (label, errorKey) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'baseline',
        marginTop: label == 'Email Body' && 6,
      }}>
      <Text style={styles.requiredLabel}>{label}</Text>
      <Text
        style={[
          styles.requiredAsterisk,
          errors[errorKey] && {color: COLORS.PRIMARYRED},
        ]}>
        {' *'}
      </Text>
    </View>
  );

  // validation
  const validateForm = () => {
    const newErrors = {};

    if (!form.moduleId) {
      newErrors.moduleId = 'Module is required.';
    }

    if (!form.configurationId || form.configurationId === 0) {
      newErrors.configurationId = 'Event Info is required.';
    }

    if (!form.emailSubject || form.emailSubject.trim() === '') {
      newErrors.emailSubject = 'Email Subject is required.';
    }
    if (!form.emailBody || form.emailBody.trim() === '') {
      newErrors.emailBody = 'Email Body is required.';
    }
    if (!form.smsText || form.smsText.trim() === '') {
      newErrors.smsText = 'SMS Text is required.';
    }
    if (!form.notificationText || form.notificationText.trim() === '') {
      newErrors.notificationText = 'Notification Text is required.';
    }
    if (!form.eventDate) {
      newErrors.eventDate = 'Event Date is required.';
    }
    if (!form.reminderBefore || form.reminderBefore === 0) {
      newErrors.reminderBefore = 'Reminder Before is required.';
    }
    if (!form.reminderType || form.reminderType === '') {
      newErrors.reminderType = 'Reminder Type is required.';
    }
    if (form.isRecur && !form.recurReminderStartDate) {
      newErrors.recurReminderStartDate = 'Recurring Start Date is required.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.keys(newErrors)[0];

      if (firstError === 'configurationId' && eventInfoRef.current) {
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: 100,
            animated: true,
          });
        }, 100);
      }
    }

    return Object.keys(newErrors).length === 0;
  };

  //get role data
  const getViewData = useCallback(() => {
    setIsLoading(true);
    let data = {
      pageNumber: 1,
      pageSize: 100,
      keyword: '',
      orderBy: 'FirstName',
      orderType: -1,
    };

    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        httpClient
          .post(`role/pagination`, data)
          .then(response => {
            if (response.data.status) {
              const newData = response?.data?.result?.data;
              if (newData?.length > 0) {
                setAllUserData(newData);
              } else {
                setAllUserData([]);
              }
              const mapped = newData.map(r => ({
                ...r,
                permissions: r.permissions ? JSON.parse(r.permissions) : [],
                checked: selectedRoleIds.includes(r.roleId),
              }));
              setAllUserData(mapped);

              const initial = {};
              mapped.forEach(role => {
                initial[role.roleId] = role.permissions;
              });
            } else {
              NOTIFY_MESSAGE(response.data.message);
            }
          })
          .catch(error => {
            setIsLoading(false);
            NOTIFY_MESSAGE(
              error || error.message ? 'Something Went Wrong' : null,
            );
            navigation.goBack();
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        NOTIFY_MESSAGE('Please check your internet connectivity');
      }
    });
  }, [navigation, selectedRoleIds]);

  // get event info data
  const getEventInfoData = useCallback(constantName => {
    if (!constantName) return;

    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setInfoLoader(true);
        httpClient
          .get(`module/configuration/dropdown?contentType=${constantName}`)
          .then(response => {
            if (response.data.status) {
              const result = response.data.result;
              if (result?.length > 0) {
                const transformed = result.map(item => ({
                  label: item.name,
                  value: item.id,
                  constantName: item.constantName,
                }));
                setEventInfoData(transformed);
              } else {
                setEventInfoData([]);
              }
            } else {
              setEventInfoData([]);
              NOTIFY_MESSAGE(
                response?.data?.message || 'Failed to fetch event info',
              );
            }
          })
          .catch(error => {
            setEventInfoData([]);
            setInfoLoader(false);
            NOTIFY_MESSAGE('Error fetching event info');
          })
          .finally(() => {
            setInfoLoader(false);
          });
      } else {
        NOTIFY_MESSAGE('Please check your internet connectivity');
      }
    });
  }, []);

  useEffect(() => {
    getModules();
    getViewData();
    if (data?.moduleName) {
      getEventInfoData(data.moduleName);
    } else {
      getViewData();
    }
  }, [isEdit, data?.moduleId, data.moduleName]);

  const transformModuleData = modules =>
    modules.map(item => ({
      label: item.name,
      value: item.moduleId,
      name: item.constantName,
    }));

  // get all module name
  const getModules = () => {
    setLoading(true);
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        httpClient
          .get('module/all')
          .then(response => {
            if (response.data.status) {
              const result = response.data.result;
              if (result.length > 0) {
                const transformed = transformModuleData(result);
                setModuleData(transformed);
              }
            } else {
              NOTIFY_MESSAGE(response?.data?.message);
            }
          })
          .catch(err => {
            NOTIFY_MESSAGE('Something Went Wrong');
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
        NOTIFY_MESSAGE('Please check your internet connectivity');
        setLoading(false);
      }
    });
  };

  // display data
  const renderItem = ({item}) => {
    return (
      <TouchableOpacity
        onPress={() => toggleRole(item.roleId)}
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          width: '50%',
          paddingBottom: 5,
        }}>
        {item.checked ? (
          <FontAwesome6
            name={'square-check'}
            size={20}
            color={COLORS.LABELCOLOR}
            style={{marginTop: 2}}
            iconStyle="solid"
          />
        ) : (
          <FontAwesome
            name={'square-o'}
            size={23}
            color={'#d1d6df'}
            style={{marginTop: 2}}
          />
        )}
        <Text
          style={{
            marginLeft: 6,
            fontFamily: FONTS.FONT_FAMILY.MEDIUM,
            fontSize: FONTS.FONTSIZE.SEMIMINI,
            color: COLORS.TITLECOLOR,
            width: width / 3,
          }}>
          {item.roleName}
        </Text>
      </TouchableOpacity>
    );
  };

  // check role
  const toggleRole = roleId => {
    setAllUserData(prev =>
      prev.map(r => (r.roleId === roleId ? {...r, checked: !r.checked} : r)),
    );

    const updated = allUserData.map(r =>
      r.roleId === roleId ? {...r, checked: !r.checked} : r,
    );

    const roleIds = updated.filter(r => r.checked).map(r => r.roleId);
    const rolesString = roleIds.length > 0 ? roleIds.join(',') : '';

    setForm(prev => ({...prev, roles: rolesString}));
  };

  // create reminder
  const callCreateApi = payload => {
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setSaveLoader(true);
        httpClient
          .post('reminder/create', payload)
          .then(res => {
            if (res.data.status) {
              NOTIFY_MESSAGE(res.data.message);
              navigation.goBack();
            } else {
              NOTIFY_MESSAGE(res.data.message || 'Create failed');
            }
          })
          .catch(error => {
            setSaveLoader(false);
            NOTIFY_MESSAGE('Something Went Wrong');
          })
          .finally(() => {
            setSaveLoader(false);
          });
      } else {
        NOTIFY_MESSAGE('Please check your internet connectivity');
      }
    });
  };

  //updtae reminder
  const callUpdateApi = payload => {
    const ReminderId = data?.reminderId;
    const updatedPayload = {
      ...payload,
      reminderId: ReminderId,
    };

    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setSaveLoader(true);
        httpClient
          .put('reminder/update', updatedPayload)
          .then(res => {
            if (res.data.status) {
              NOTIFY_MESSAGE(res.data.message);
              navigation.goBack();
            } else {
              NOTIFY_MESSAGE(res.data.message || 'Update failed');
            }
          })
          .catch(error => {
            setSaveLoader(false);
            NOTIFY_MESSAGE('Something Went Wrong');
          })
          .finally(() => {
            setSaveLoader(false);
          });
      } else {
        NOTIFY_MESSAGE('Please check your internet connectivity');
      }
    });
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    if (isEdit) {
      callUpdateApi(form);
    } else {
      callCreateApi(form);
    }
  };

  const renderError = errorKey => {
    if (errors[errorKey]) {
      return (
        <Text
          style={{
            color: COLORS.PRIMARYRED,
            fontSize: FONTS.FONTSIZE.SEMIMINI,
            fontFamily: FONTS.FONT_FAMILY.REGULAR,
            marginTop: 4,
          }}>
          {errors[errorKey]}
        </Text>
      );
    }
    return null;
  };

  //remove html
  const stripHtmlTags = str => {
    if (!str || str === '') return '';

    let cleaned = str.toString();

    cleaned = cleaned
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    cleaned = cleaned.replace(/(<([^>]+)>)/gi, '');

    cleaned = cleaned.replace(/\\n/g, '\n');

    return cleaned.trim();
  };

  return (
    <KeyboardAvoidingView
      style={{flex: 1, backgroundColor: COLORS.BACKGROUNDCOLOR}}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
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
        title={isEdit ? 'Update Reminder' : 'Add Reminder'}
      />
      {isLoading || loading ? (
        <Loader />
      ) : (
        <>
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={{paddingBottom: 20, paddingHorizontal: 10}}
            showsVerticalScrollIndicator={false}>
            <View
              style={[
                styles.commonBox,
                {
                  padding: 6,
                },
              ]}>
              <Text
                style={{
                  fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
                  fontSize: FONTS.FONTSIZE.SMALL,
                  color: COLORS.TITLECOLOR,
                  padding: 4,
                }}>
                {isEdit
                  ? renderRequiredLabel('Module Name', 'moduleId')
                  : renderRequiredLabel('Select Module', 'moduleId')}
              </Text>

              {isEdit ? (
                <TextInput
                  value={data?.moduleName}
                  editable={false}
                  selectTextOnFocus={false}
                  style={styles.readonlyInput}
                />
              ) : (
                <>
                  <Dropdown
                    style={[
                      styles.dropdown,
                      {
                        borderColor: errors.moduleId
                          ? COLORS.PRIMARYRED
                          : COLORS.INPUTBORDER,
                      },
                    ]}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    inputSearchStyle={{
                      color: COLORS.PRIMARYBLACK,
                      fontSize: FONTS.FONTSIZE.EXTRASMALL,
                    }}
                    data={
                      moduleData.length > 0
                        ? moduleData
                        : [{label: 'No Data Available', value: null}]
                    }
                    search
                    searchPlaceholder="Search"
                    labelField="label"
                    valueField="value"
                    value={form.moduleId}
                    onChange={item => {
                      const newModuleId = item.value;
                      const constantName = item.name;

                      setForm(prev => ({
                        ...prev,
                        moduleId: newModuleId,
                        configurationId: 0,
                      }));
                      setErrors([]);
                      setEventInfoData([]);

                      if (constantName) {
                        getEventInfoData(constantName);
                      }
                    }}
                    itemTextStyle={{color: COLORS.PRIMARYBLACK}}
                    placeholder="Select Module"
                    maxHeight={200}
                    renderItem={item => (
                      <View style={styles.itemContainer}>
                        <Text style={styles.itemText}>{item.label}</Text>
                      </View>
                    )}
                  />
                  {renderError('moduleId')}
                </>
              )}
              <View
                style={{marginTop: 6}}
                ref={eventInfoRef}
                onLayout={event => {
                  // Store the Y position when layout is measured
                  if (eventInfoRef.current) {
                    eventInfoRef.current.measure(
                      (x, y, width, height, pageX, pageY) => {
                        eventInfoRef.current.yPosition = pageY;
                      },
                    );
                  }
                }}>
                {renderRequiredLabel('Event Info', 'configurationId')}
                {isEdit ? (
                  <TextInput
                    value={
                      eventInfoData.find(
                        item => item.value === data?.configurationId,
                      )?.label || null
                    }
                    editable={false}
                    selectTextOnFocus={false}
                    multiline
                    style={{
                      borderWidth: 1,
                      borderColor: COLORS.TABLEBORDER,
                      borderRadius: 6,
                      paddingHorizontal: 10,
                      color: COLORS.PRIMARYBLACK,
                      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                      fontSize: FONTS.FONTSIZE.SEMIMINI,
                      backgroundColor: '#f3f4f6',
                    }}
                  />
                ) : (
                  <>
                    <Dropdown
                      style={[
                        styles.dropdown,
                        {
                          borderColor: errors.configurationId
                            ? COLORS.PRIMARYRED
                            : COLORS.INPUTBORDER,
                        },
                      ]}
                      placeholderStyle={styles.placeholderStyle}
                      selectedTextStyle={styles.selectedTextStyle}
                      inputSearchStyle={{
                        color: COLORS.PRIMARYBLACK,
                        fontSize: FONTS.FONTSIZE.EXTRASMALL,
                      }}
                      data={
                        infoLoader
                          ? [{label: 'Loading...', value: null}]
                          : eventInfoData.length > 0
                          ? eventInfoData
                          : [{label: 'No Data Available', value: null}]
                      }
                      search={!infoLoader}
                      disable={infoLoader}
                      searchPlaceholder="Search"
                      labelField="label"
                      valueField="value"
                      value={form.configurationId}
                      onChange={item => {
                        setForm(prev => ({
                          ...prev,
                          configurationId: item.value,
                          configurationName: item.label,
                        }));
                        setErrors(prev => ({...prev, configurationId: null}));
                      }}
                      itemTextStyle={{color: COLORS.PRIMARYBLACK}}
                      placeholder={
                        infoLoader ? 'Loading...' : 'Select Event Info'
                      }
                      maxHeight={200}
                      renderItem={item => (
                        <View style={styles.itemContainer}>
                          <Text style={styles.itemText}>{item.label}</Text>
                        </View>
                      )}
                    />
                    {renderError('configurationId')}
                  </>
                )}
              </View>
              <View style={{marginTop: 6}} />
              {renderRequiredLabel('Event Date', 'eventDate')}
              <TouchableOpacity
                onPress={() => setDatePickerVisible(true)}
                style={[
                  styles.datePickerInput,
                  {
                    borderColor: errors.eventDate
                      ? COLORS.PRIMARYRED
                      : COLORS.INPUTBORDER,
                  },
                ]}>
                <Text
                  style={{
                    fontSize: FONTS.FONTSIZE.MINI,
                    color: COLORS.PRIMARYBLACK,
                    fontFamily: FONTS.FONT_FAMILY.REGULAR,
                  }}>
                  {form.eventDate
                    ? moment(form.eventDate).format('DD/MM/YYYY')
                    : moment(new Date()).format('DD/MM/YYYY')}
                </Text>
                <MaterialDesignIcons
                  name="calendar-month-outline"
                  size={25}
                  color={COLORS.PLACEHOLDERCOLOR}
                />
              </TouchableOpacity>
              {renderError('eventDate')}

              <DateTimePickerModal
                isVisible={datePickerVisible}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onConfirm={onDateChange}
                onCancel={() => setDatePickerVisible(false)}
                date={form.eventDate || new Date()}
              />
              {actions.isRecur && (
                <>
                  <View style={{marginTop: 6}} />
                  {renderRequiredLabel(
                    'Recurring Start Date',
                    'recurReminderStartDate',
                  )}
                  <TouchableOpacity
                    onPress={() => setRecurDatePickerVisible(true)}
                    style={[
                      styles.datePickerInput,
                      {
                        borderColor: errors.recurReminderStartDate
                          ? COLORS.PRIMARYRED
                          : COLORS.INPUTBORDER,
                      },
                    ]}>
                    <Text
                      style={{
                        fontSize: FONTS.FONTSIZE.MINI,
                        color: COLORS.PRIMARYBLACK,
                        fontFamily: FONTS.FONT_FAMILY.REGULAR,
                      }}>
                      {form.recurReminderStartDate
                        ? moment(form.recurReminderStartDate).format(
                            'DD/MM/YYYY',
                          )
                        : 'Recurring Start Date'}
                    </Text>
                    <MaterialDesignIcons
                      name="calendar-month-outline"
                      size={25}
                      color={COLORS.PLACEHOLDERCOLOR}
                    />
                  </TouchableOpacity>
                  {renderError('recurReminderStartDate')}

                  <DateTimePickerModal
                    isVisible={recurDatePickerVisible}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    onConfirm={onRecurDateChange}
                    onCancel={() => setRecurDatePickerVisible(false)}
                    date={form.recurReminderStartDate || new Date()}
                  />
                </>
              )}
            </View>

            {/* Actions */}
            <View style={styles.commonBox}>
              <Text style={styles.commonTitle}>Actions</Text>
              <View style={styles.bottomBorder} />
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: 10,
                  padding: 8,
                }}>
                {ACTIONS.map(item => (
                  <IconCheckbox
                    key={item.key}
                    label={item.label}
                    checked={actions[item.key]}
                    onPress={() => toggleAction(item.key)}
                  />
                ))}
              </View>
            </View>
            {/* Roles Selection */}
            {allUserData?.length > 0 && (
              <View
                style={[
                  styles.commonBox,
                  {
                    padding: 8,
                  },
                ]}>
                <FlatList
                  data={allUserData}
                  initialNumToRender={10}
                  maxToRenderPerBatch={20}
                  windowSize={10}
                  removeClippedSubviews={true}
                  keyExtractor={(item, index) => index?.toString()}
                  renderItem={renderItem}
                  numColumns={2}
                />
              </View>
            )}
            {/* Email */}
            <View style={styles.commonBox}>
              <Text style={styles.commonTitle}>Email</Text>
              <View style={styles.bottomBorder} />
              <View style={{padding: 10}}>
                {renderRequiredLabel('Email Subject', 'emailSubject')}

                <TextInput
                  value={stripHtmlTags(form.emailSubject)}
                  onChangeText={text => {
                    setForm(prev => ({...prev, emailSubject: text}));
                    setErrors(prev => ({...prev, emailSubject: null}));
                  }}
                  editable={!isEdit}
                  multiline
                  style={[
                    styles.commonInput,
                    {
                      backgroundColor: isEdit ? '#f3f4f6' : COLORS.PRIMARYWHITE,
                      borderColor: errors.emailSubject
                        ? COLORS.PRIMARYRED
                        : COLORS.INPUTBORDER,
                    },
                  ]}
                  placeholder="Email Subject"
                  placeholderTextColor={COLORS.INPUTBORDER}
                />

                {renderError('emailSubject')}
                {renderRequiredLabel('Email Body', 'emailBody')}

                <TextInput
                  value={stripHtmlTags(form.emailBody)}
                  onChangeText={text => {
                    setForm(prev => ({...prev, emailBody: text}));
                    setErrors(prev => ({...prev, emailBody: null}));
                  }}
                  editable={!isEdit}
                  multiline
                  style={[
                    styles.commonInput,
                    {
                      minHeight: 120,
                      textAlignVertical: 'top',
                      backgroundColor: isEdit ? '#f3f4f6' : COLORS.PRIMARYWHITE,
                      borderColor: errors.emailBody
                        ? COLORS.PRIMARYRED
                        : COLORS.INPUTBORDER,
                    },
                  ]}
                  placeholder="Email Body"
                  placeholderTextColor={COLORS.INPUTBORDER}
                />
                {renderError('emailBody')}
              </View>
            </View>

            {/* SMS */}
            <View style={styles.commonBox}>
              <Text style={styles.commonTitle}>SMS</Text>
              <View style={styles.bottomBorder} />
              <View style={{padding: 10}}>
                {renderRequiredLabel('SMS Body', 'smsText')}
                <TextInput
                  value={stripHtmlTags(form.smsText)}
                  onChangeText={text => {
                    setForm(prev => ({...prev, smsText: text}));
                    setErrors(prev => ({...prev, smsText: null}));
                  }}
                  editable={!isEdit}
                  multiline
                  style={[
                    styles.commonInput,
                    {
                      backgroundColor: isEdit ? '#f3f4f6' : COLORS.PRIMARYWHITE,
                      borderColor: errors.smsText
                        ? COLORS.PRIMARYRED
                        : COLORS.INPUTBORDER,
                    },
                  ]}
                  placeholder="SMS Body"
                  placeholderTextColor={COLORS.INPUTBORDER}
                />

                {renderError('smsText')}
              </View>
            </View>

            {/* Notification */}
            <View style={styles.commonBox}>
              <Text style={styles.commonTitle}>Notification</Text>
              <View style={styles.bottomBorder} />
              <View style={{padding: 10}}>
                {renderRequiredLabel('Notification Body', 'notificationText')}

                <TextInput
                  value={stripHtmlTags(form.notificationText)}
                  onChangeText={text => {
                    setForm(prev => ({...prev, notificationText: text}));
                    setErrors(prev => ({...prev, notificationText: null}));
                  }}
                  editable={!isEdit}
                  multiline
                  style={[
                    styles.commonInput,
                    {
                      backgroundColor: isEdit ? '#f3f4f6' : COLORS.PRIMARYWHITE,
                      borderColor: errors.notificationText
                        ? COLORS.PRIMARYRED
                        : COLORS.INPUTBORDER,
                    },
                  ]}
                  placeholder="Notification Body"
                  placeholderTextColor={COLORS.INPUTBORDER}
                />

                {renderError('notificationText')}
              </View>
            </View>

            <View style={{marginTop: 6}} />
            {renderRequiredLabel('Reminder Before', 'reminderBefore')}
            <TextInput
              value={form.reminderBefore ? form.reminderBefore.toString() : ''}
              onChangeText={text => {
                const numericValue = text.replace(/[^0-9]/g, '');
                setForm(prev => ({
                  ...prev,
                  reminderBefore: numericValue ? parseInt(numericValue, 10) : 0,
                }));
                setErrors(prev => ({...prev, reminderBefore: null}));
              }}
              keyboardType="numeric"
              style={[
                {
                  borderColor: errors.reminderBefore
                    ? COLORS.PRIMARYRED
                    : COLORS.INPUTBORDER,
                  borderWidth: 1,
                  borderRadius: 6,
                  height: 40,
                  color: COLORS.PRIMARYBLACK,
                  fontFamily: FONTS.FONT_FAMILY.REGULAR,
                  fontSize: FONTS.FONTSIZE.SEMIMINI,
                  paddingHorizontal: 10,
                  backgroundColor: 'white',
                  paddingVertical: 0,
                },
              ]}
              placeholder="Reminder Before"
              placeholderTextColor={COLORS.INPUTBORDER}
            />

            {renderError('reminderBefore')}

            <View style={{marginTop: 6}} />
            {renderRequiredLabel('Reminder Type', 'reminderType')}
            <Dropdown
              style={[
                styles.dropdown,
                {
                  borderColor: errors.reminderType
                    ? COLORS.PRIMARYRED
                    : COLORS.INPUTBORDER,
                },
              ]}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              data={REMINDER_TYPE_OPTIONS}
              labelField="label"
              valueField="value"
              value={form.reminderType}
              onChange={item => {
                setForm(prev => ({...prev, reminderType: item.value}));
                setErrors(prev => ({...prev, reminderType: null}));
              }}
              itemTextStyle={{color: COLORS.PRIMARYBLACK}}
              placeholder="Select Reminder Type"
              placeholderTextColor={COLORS.INPUTBORDER}
              renderItem={item => (
                <View style={styles.itemContainer}>
                  <Text style={styles.itemText}>{item.label}</Text>
                </View>
              )}
            />
            {renderError('reminderType')}

            <ButtonComponent
              disabled={saveLoader}
              title={
                saveLoader ? 'Please Wait..' : isEdit ? 'Update' : 'Submit'
              }
              onPress={handleSave}
            />
          </ScrollView>
        </>
      )}
    </KeyboardAvoidingView>
  );
};

export default AddUpdateReminder;

const styles = StyleSheet.create({
  commonTitle: {
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.SMALL,
    color: COLORS.PRIMARYBLACK,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  bottomBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.TABLEBORDER,
  },
  commonBox: {
    borderWidth: 1,
    borderRadius: 6,
    borderColor: COLORS.TABLEBORDER,
    backgroundColor: 'white',
    marginTop: 10,
  },
  commonInput: {
    borderWidth: 1,
    borderRadius: 6,
    minHeight: 60,
    textAlignVertical: 'top',
    color: COLORS.PRIMARYBLACK,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    padding: 5,
  },
  readonlyInput: {
    borderWidth: 1,
    borderColor: COLORS.TABLEBORDER,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: COLORS.PRIMARYBLACK,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    backgroundColor: '#f3f4f6',
  },
  dropdown: {
    height: 38,
    borderWidth: 1,
    borderRadius: 6,
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
  requiredAsterisk: {
    color: COLORS.TITLECOLOR,
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
  },
  requiredLabel: {
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    color: COLORS.TITLECOLOR,
  },
  datePickerInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    BACKGROUNDCOLOR: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    height: 40,
  },
});
