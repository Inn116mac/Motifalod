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
import React, {useCallback, useEffect, useMemo, useState} from 'react';
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

const AddUpdateNotification = ({route}) => {
  const {data, isEdit = false} = route.params || {};
  const navigation = useNavigation();
  const {width} = useWindowDimensions();

  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifyLoader, setNotifyLoader] = useState(false);
  const [saveLoader, setSaveLoader] = useState(false);
  const [allUserData, setAllUserData] = useState([]);
  const [moduleData, setModuleData] = useState([]);
  const [errors, setErrors] = useState({});
  const selectedRoleIds = useMemo(() => {
    return data?.roles ? data.roles.split(',').map(Number).filter(Boolean) : [];
  }, [data?.roles]);

  const ACTIONS = [
    {key: 'email', label: 'Email'},
    {key: 'sms', label: 'SMS'},
    {key: 'notifications', label: 'Notification'},
    {key: 'isAdd', label: 'Add'},
    {key: 'isEdit', label: 'Edit'},
    {key: 'isDelete', label: 'Delete'},
  ];

  const [actions, setActions] = useState({
    email: data?.email || false,
    sms: data?.sms || false,
    notifications: data?.notifications || false,
    isAdd: data?.isAdd || false,
    isEdit: data?.isEdit || false,
    isDelete: data?.isDelete || false,
  });

  const [form, setForm] = useState({
    notificationId: data?.notificationId || 0,
    email: data?.email || false,
    sms: data?.sms || false,
    notifications: data?.notifications || false,
    emailSubject: data?.emailSubject || '',
    emailBody: data?.emailBody || '',
    smsText: data?.smsText || '',
    notificationText: data?.notificationText || '',
    isAdd: data?.isAdd || false,
    isEdit: data?.isEdit || false,
    isDelete: data?.isDelete || false,
    roles: data?.roles || '',
    moduleId: data?.moduleId || null,
    moduleName: data?.moduleName || '',
  });

  const toggleAction = key => {
    const newValue = !actions[key];
    setActions(prev => ({...prev, [key]: newValue}));
    setForm(prev => ({...prev, [key]: newValue}));
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

  const validateForm = () => {
    const newErrors = {};

    if (!form.moduleId) {
      newErrors.moduleId = 'Module is required.';
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    callUpdateApi(form);
  };

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
                const currentlySelectedRoles = form.roles
                  ? form.roles.split(',').map(Number).filter(Boolean)
                  : [];

                const mapped = newData.map(r => ({
                  ...r,
                  permissions: r.permissions ? JSON.parse(r.permissions) : [],
                  checked:
                    currentlySelectedRoles.length > 0
                      ? currentlySelectedRoles.includes(r.roleId)
                      : selectedRoleIds.includes(r.roleId),
                }));

                setAllUserData(mapped);
              } else {
                setAllUserData([]);
              }
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
  }, [navigation, selectedRoleIds, form.roles]);

  const [isExistingNotification, setIsExistingNotification] = useState(false);

  const getNotificationData = useCallback((moduleId, selectedModuleName) => {
    setNotifyLoader(true);

    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        httpClient
          .get(`notification/getnotificaitonbyid/${moduleId}`)
          .then(response => {
            if (response.data.result) {
              const notificationData = response.data.result;

              setForm({
                notificationId: notificationData.notificationId || 0,
                email: notificationData.email || false,
                sms: notificationData.sms || false,
                notifications: notificationData.notifications || false,
                emailSubject: notificationData.emailSubject || '',
                emailBody: notificationData.emailBody || '',
                smsText: notificationData.smsText || '',
                notificationText: notificationData.notificationText || '',
                isAdd: notificationData.isAdd || false,
                isEdit: notificationData.isEdit || false,
                isDelete: notificationData.isDelete || false,
                roles: notificationData.roles || '',
                moduleId: moduleId,
                moduleName: selectedModuleName || '',
              });

              setActions({
                email: notificationData.email || false,
                sms: notificationData.sms || false,
                notifications: notificationData.notifications || false,
                isAdd: notificationData.isAdd || false,
                isEdit: notificationData.isEdit || false,
                isDelete: notificationData.isDelete || false,
              });

              if (notificationData.roles) {
                const roleIds = notificationData.roles
                  .split(',')
                  .map(Number)
                  .filter(Boolean);
                setAllUserData(prev =>
                  prev.map(role => ({
                    ...role,
                    checked: roleIds.includes(role.roleId),
                  })),
                );
              }

              setIsExistingNotification(true);
            } else {
              setIsExistingNotification(false);

              const clearForm = {
                notificationId: 0,
                email: false,
                sms: false,
                notifications: false,
                emailSubject: '',
                emailBody: '',
                smsText: '',
                notificationText: '',
                isAdd: false,
                isEdit: false,
                isDelete: false,
                roles: '',
                moduleId: moduleId,
                moduleName: selectedModuleName || '',
              };

              setForm(clearForm);
              setActions({
                email: false,
                sms: false,
                notifications: false,
                isAdd: false,
                isEdit: false,
                isDelete: false,
              });

              setAllUserData(prev =>
                prev.map(role => ({...role, checked: false})),
              );
            }
          })
          .catch(error => {
            setNotifyLoader(false);
            NOTIFY_MESSAGE(
              'API Error: ' + (error.message || 'Something went wrong'),
            );
          })
          .finally(() => {
            setNotifyLoader(false);
          });
      } else {
        NOTIFY_MESSAGE('Please check your internet connectivity');
        setNotifyLoader(false);
      }
    });
  }, []);

  useEffect(() => {
    getModules();
    getViewData();
    if (isEdit && data?.moduleId) {
      getNotificationData(data.moduleId, data.moduleName);
    } else {
      getViewData();
    }
  }, [isEdit, data?.moduleId, data.moduleName]);

  const transformModuleData = modules =>
    modules.map(item => ({
      label: item.name,
      value: item.moduleId,
    }));

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

  const callUpdateApi = payload => {
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setSaveLoader(true);
        httpClient
          .put('notification/update', payload)
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
        title={
          isEdit
            ? 'Update Notification'
            : isExistingNotification
            ? 'Update Notification'
            : 'Add Notification'
        }
      />

      {isLoading || loading || notifyLoader ? (
        <Loader />
      ) : (
        <>
          <ScrollView
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
                      const newModuleName = item.label || '';

                      setForm(prev => ({
                        ...prev,
                        moduleId: newModuleId,
                        moduleName: newModuleName,
                      }));
                      setErrors([]);
                      if (newModuleId) {
                        getNotificationData(newModuleId, newModuleName);
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
                  editable={!isEdit && !isExistingNotification}
                  multiline
                  style={[
                    styles.commonInput,
                    {
                      backgroundColor:
                        isEdit || isExistingNotification
                          ? '#f3f4f6'
                          : COLORS.PRIMARYWHITE,
                      borderColor: errors.emailSubject
                        ? COLORS.PRIMARYRED
                        : COLORS.TABLEBORDER,
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
                  editable={!isEdit && !isExistingNotification}
                  multiline
                  style={[
                    styles.commonInput,
                    {
                      minHeight: 120,
                      textAlignVertical: 'top',
                      backgroundColor:
                        isEdit || isExistingNotification
                          ? '#f3f4f6'
                          : COLORS.PRIMARYWHITE,
                      borderColor: errors.emailBody
                        ? COLORS.PRIMARYRED
                        : COLORS.TABLEBORDER,
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
                  editable={!isEdit && !isExistingNotification}
                  multiline
                  style={[
                    styles.commonInput,
                    {
                      backgroundColor:
                        isEdit || isExistingNotification
                          ? '#f3f4f6'
                          : COLORS.PRIMARYWHITE,
                      borderColor: errors.smsText
                        ? COLORS.PRIMARYRED
                        : COLORS.TABLEBORDER,
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
                  editable={!isEdit && !isExistingNotification}
                  multiline
                  style={[
                    styles.commonInput,
                    {
                      backgroundColor:
                        isEdit || isExistingNotification
                          ? '#f3f4f6'
                          : COLORS.PRIMARYWHITE,
                      borderColor: errors.notificationText
                        ? COLORS.PRIMARYRED
                        : COLORS.TABLEBORDER,
                    },
                  ]}
                  placeholder="Notification Body"
                  placeholderTextColor={COLORS.INPUTBORDER}
                />

                {renderError('notificationText')}
              </View>
            </View>
            <ButtonComponent
              disabled={saveLoader}
              title={
                saveLoader
                  ? 'Please Wait..'
                  : isEdit || isExistingNotification
                  ? 'Update'
                  : 'Submit'
              }
              onPress={handleSave}
            />
          </ScrollView>
        </>
      )}
    </KeyboardAvoidingView>
  );
};

export default AddUpdateNotification;

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
  commonText: {
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    fontSize: FONTS.FONTSIZE.SEMIMINI,
    color: COLORS.TITLECOLOR,
    marginBottom: 4,
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
});
