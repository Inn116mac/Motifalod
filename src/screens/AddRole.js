import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import COLORS from '../theme/Color';
import FONTS from '../theme/Fonts';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {MaterialIcons} from '@react-native-vector-icons/material-icons';
import {useNavigation} from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import {NOTIFY_MESSAGE} from '../constant/Module';
import Loader from '../components/root/Loader';
import Offline from '../components/root/Offline';
import NoDataFound from '../components/root/NoDataFound';
import {useNetworkStatus} from '../connection/UseNetworkStatus';
import CustomHeader from '../components/root/CustomHeader';
import httpClient from '../connection/httpClient';

const AddRole = ({route}) => {
  const {editItem, isEdit, item} = route.params.data;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.BACKGROUNDCOLOR,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 10,
      gap: 10,
      marginBottom: 10,
    },
    input: {
      flex: 1,
      backgroundColor: COLORS.PRIMARYWHITE,
      borderRadius: 6,
      paddingHorizontal: 10,
      paddingVertical: 0,
      fontSize: FONTS.FONTSIZE.SEMIMINI,
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      color: COLORS.PRIMARYBLACK,
      borderWidth: 1,
      borderColor: '#e5e7eb',
      height: 38,
    },
    submitButton: {
      backgroundColor: COLORS.LABELCOLOR,
      paddingHorizontal: 25,
      paddingVertical: 4,
      borderRadius: 4,
      justifyContent: 'center',
      alignItems: 'center',
    },
    submitText: {
      color: COLORS.PRIMARYWHITE,
      fontSize: FONTS.FONTSIZE.SMALL,
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    },
    tableContainer: {
      marginHorizontal: 10,
      backgroundColor: COLORS.PRIMARYWHITE,
      borderRadius: 10,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: '#e5e7eb',
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: '#f9fafb',
      borderBottomWidth: 1,
      borderBottomColor: '#e5e7eb',
      paddingVertical: 8,
      alignItems: 'center',
    },
    headerText: {
      fontSize: FONTS.FONTSIZE.SMALL,
      fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
      color: '#374151',
      includeFontPadding: false,
    },
    selectColumn: {
      width: 50,
      alignItems: 'center',
    },
    moduleColumn: {
      flex: 2,
    },
    permissionColumn: {
      flex: 1,
      alignItems: 'center',
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#f3f4f6',
      alignItems: 'center',
    },
    moduleText: {
      fontSize: FONTS.FONTSIZE.SEMIMINI,
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
      color: '#1f2937',
    },
    checkboxContainer: {
      padding: 4,
    },
  });

  const navigation = useNavigation();

  const [moduleData, setModuleData] = useState([]);
  const [roleName, setRoleName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [permissions, setPermissions] = useState({});

  const {isConnected, networkLoading} = useNetworkStatus();

  useEffect(() => {
    if (isEdit && editItem) {
      setRoleName(editItem.roleName);
    }
    getModules();
  }, []);

  const getModules = () => {
    setLoading(true);
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        httpClient
          //   .get('module/all')
          .get('module/allForAdmin')
          .then(response => {
            if (response.data.status) {
              if (response.data.result.length > 0) {
                setModuleData(response.data.result);
                initializePermissions(response.data.result);
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

  const initializePermissions = modules => {
    const initialPermissions = {};

    modules.forEach(module => {
      initialPermissions[module.constantName] = {
        read: false,
        write: false,
        selected: false,
        name: module.name,
        url: `app/configuration/${module.constantName}`,
      };
    });

    if (isEdit && editItem && editItem.permissions) {
      try {
        const existingPerms = JSON.parse(editItem?.permissions);
        existingPerms.forEach(perm => {
          if (initialPermissions[perm.constant]) {
            initialPermissions[perm.constant] = {
              ...initialPermissions[perm.constant],
              read: perm.read,
              write: perm.write,
              // ✅ FIX: Module is selected ONLY if BOTH read AND write are true
              selected: perm.read && perm.write, // Changed from || to &&
            };
          }
        });
      } catch (error) {
        console.log('Error parsing existing permissions:', error);
      }
    }

    setPermissions(initialPermissions);
  };

  // Updated: Sync module selection when read/write changes
  const handlePermissionChange = (moduleName, type) => {
    setPermissions(prev => {
      const currentModule = prev[moduleName];
      const newValue = !currentModule?.[type];

      // Determine if module should be selected
      // Module is selected if BOTH read AND write are true
      const otherType = type === 'read' ? 'write' : 'read';
      const isSelected = newValue && currentModule?.[otherType];

      return {
        ...prev,
        [moduleName]: {
          ...currentModule,
          [type]: newValue,
          selected: isSelected, // Auto-uncheck if either is unchecked
        },
      };
    });
  };

  // Handle individual module selection
  const handleModuleSelect = moduleName => {
    setPermissions(prev => {
      const currentModule = prev[moduleName];
      const newSelectedState = !currentModule?.selected;

      return {
        ...prev,
        [moduleName]: {
          ...currentModule,
          selected: newSelectedState,
          // Toggle both read and write together
          read: newSelectedState,
          write: newSelectedState,
        },
      };
    });
  };

  // Handle select all modules
  const handleSelectAllModules = () => {
    const allSelected = Object.values(permissions).every(
      perm => perm.selected === true,
    );
    const newSelectedState = !allSelected;

    const updatedPermissions = {};

    moduleData.forEach(module => {
      updatedPermissions[module.constantName] = {
        ...permissions[module.constantName],
        selected: newSelectedState,
        read: newSelectedState,
        write: newSelectedState,
      };
    });

    setPermissions(updatedPermissions);
  };

  // Check if all modules are selected
  const isAllModulesSelected = () => {
    return (
      moduleData.length > 0 &&
      Object.values(permissions).every(perm => perm.selected === true)
    );
  };

  const handleSubmit = () => {
    if (!roleName.trim()) {
      NOTIFY_MESSAGE('Please enter role name');
      return;
    }

    const permissionsArray = Object.keys(permissions)
      .filter(key => permissions[key]?.read || permissions[key]?.write)
      .map(key => ({
        name: permissions[key].name,
        constant: key,
        write: permissions[key].write || false,
        read: permissions[key].read || false,
        url: permissions[key].url,
      }));

    const payload = {
      roleName: roleName.trim(),
      permissions: JSON.stringify(permissionsArray),
      ...(isEdit && {roleId: editItem.roleId}),
    };

    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setIsSaving(true);
        const apiCall = isEdit
          ? httpClient.put(`role/update`, payload)
          : httpClient.post('role/create', payload);

        apiCall
          .then(response => {
            if (response.data.status) {
              NOTIFY_MESSAGE(response.data.message);
              navigation.goBack();
            } else {
              NOTIFY_MESSAGE(response?.data?.message);
            }
          })
          .catch(error => {
            NOTIFY_MESSAGE('Something Went Wrong');
          })
          .finally(() => {
            setIsSaving(false);
          });
      } else {
        NOTIFY_MESSAGE('Please check your internet connectivity');
      }
    });
  };

  return (
    <View style={styles.container}>
      <CustomHeader
        leftOnPress={() => {
          navigation.goBack();
        }}
        leftIcon={
          <FontAwesome6
            name="angle-left"
            size={26}
            color={COLORS.LABELCOLOR}
            iconStyle="solid"
          />
        }
        title={isEdit ? 'Edit Role' : 'Add Role'}
      />
      {networkLoading || loading ? (
        <Loader />
      ) : isConnected ? (
        <View style={{flex: 1}}>
          {/* Role Name Input and Submit Button */}
          <View style={{marginTop: 4}}>
            <Text
              style={{
                fontSize: FONTS.FONTSIZE.SMALL,
                fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                color: COLORS.PRIMARYBLACK,
                marginHorizontal: 10,
              }}>
              Role Name
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Role Name"
                placeholderTextColor={COLORS.grey500}
                value={roleName}
                onChangeText={setRoleName}
              />

              <TouchableOpacity
                disabled={isSaving}
                style={styles.submitButton}
                onPress={handleSubmit}
                activeOpacity={0.8}>
                <Text style={styles.submitText}>
                  {isSaving ? 'Saving...' : 'Submit'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Permissions Table with Sticky Header */}
          {moduleData.length > 0 ? (
            <View style={[styles.tableContainer, {flex: 1}]}>
              {/* Fixed Table Header */}
              <View style={styles.tableHeader}>
                <View style={styles.selectColumn}>
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={handleSelectAllModules}
                    activeOpacity={0.7}>
                    <MaterialIcons
                      name={
                        isAllModulesSelected()
                          ? 'check-box'
                          : 'check-box-outline-blank'
                      }
                      size={24}
                      color={
                        isAllModulesSelected() ? COLORS.LABELCOLOR : 'grey'
                      }
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.moduleColumn}>
                  <Text style={styles.headerText}>Module Title</Text>
                </View>
                <View style={styles.permissionColumn}>
                  <Text style={styles.headerText}>R.A</Text>
                </View>
                <View style={styles.permissionColumn}>
                  <Text style={styles.headerText}>W.A</Text>
                </View>
              </View>

              {/* Scrollable Table Rows */}
              <ScrollView
                style={{flex: 1}}
                contentContainerStyle={{paddingBottom: 10}}>
                {moduleData.map((module, index) => (
                  <View key={index} style={styles.tableRow}>
                    {/* Module Select Checkbox */}
                    <View style={styles.selectColumn}>
                      <TouchableOpacity
                        style={styles.checkboxContainer}
                        onPress={() => handleModuleSelect(module.constantName)}
                        activeOpacity={0.7}>
                        <MaterialIcons
                          name={
                            permissions[module.constantName]?.selected
                              ? 'check-box'
                              : 'check-box-outline-blank'
                          }
                          size={24}
                          color={
                            permissions[module.constantName]?.selected
                              ? COLORS.LABELCOLOR
                              : 'grey'
                          }
                        />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.moduleColumn}>
                      <Text style={styles.moduleText}>
                        {module.name || module.constantName}
                      </Text>
                    </View>

                    {/* Read Access Checkbox */}
                    <View style={styles.permissionColumn}>
                      <TouchableOpacity
                        style={styles.checkboxContainer}
                        onPress={() =>
                          handlePermissionChange(module.constantName, 'read')
                        }
                        activeOpacity={0.7}>
                        <MaterialIcons
                          name={
                            permissions[module.constantName]?.read
                              ? 'check-box'
                              : 'check-box-outline-blank'
                          }
                          size={24}
                          color={
                            permissions[module.constantName]?.read
                              ? COLORS.LABELCOLOR
                              : 'grey'
                          }
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Write Access Checkbox */}
                    <View style={styles.permissionColumn}>
                      <TouchableOpacity
                        style={styles.checkboxContainer}
                        onPress={() =>
                          handlePermissionChange(module.constantName, 'write')
                        }
                        activeOpacity={0.7}>
                        <MaterialIcons
                          name={
                            permissions[module.constantName]?.write
                              ? 'check-box'
                              : 'check-box-outline-blank'
                          }
                          size={24}
                          color={
                            permissions[module.constantName]?.write
                              ? COLORS.LABELCOLOR
                              : 'grey'
                          }
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : (
            <NoDataFound />
          )}
        </View>
      ) : (
        <Offline />
      )}
    </View>
  );
};

export default AddRole;
