import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {ScrollView} from 'react-native';
import COLORS from '../../theme/Color';
import FONTS from '../../theme/Fonts';
import {
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import {useNetworkStatus} from '../../connection/UseNetworkStatus';
import NoDataFound from './NoDataFound';
import Loader from './Loader';
import Offline from './Offline';
import {getFileType} from '../../utils/fileType';
import moment from 'moment';
import {Entypo} from "@react-native-vector-icons/entypo";
import { useNavigation } from '@react-navigation/native';

export default function CustomTable({
  data,
  isTabbing,
}) {
  const {isConnected, networkLoading} = useNetworkStatus();
  const {width} = useWindowDimensions();

  const navigation = useNavigation();

  const styles = StyleSheet.create({
    tabContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    tab: {
      paddingVertical: 4,
      marginHorizontal: 10,
      alignItems: 'center',
      width: width / 3.5,
    },
    activeTab: {
      borderBottomWidth: 2,
      borderColor: COLORS.TITLECOLOR,
    },
    tabText: {
      fontSize: FONTS.FONTSIZE.MEDIUM,
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
      color: COLORS.TITLECOLOR,
    },
    tableContainer: {
      borderRadius: 10,
      overflow: 'hidden',
      marginHorizontal: 10,
      marginVertical: 10,
      borderRadius: 5,
    },
    header: {
      backgroundColor: COLORS.TABLEROWCOLOR,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: COLORS.LIGHTGREY,
    },
    headerText: {
      fontSize: FONTS.FONTSIZE.SMALL,
      fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
      color: COLORS.TABLELABELTEXTCOLOR,
      flex: 1,
      paddingTop: 15,
      paddingVertical: 15,
      textAlign: 'center',
      alignSelf: 'stretch',
      borderRightWidth: 1,
      borderRightColor: COLORS.TABLEBORDER,
    },
  });

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

  const formattedTime = time => {
    const formatedtime = moment(time, 'HH:mm A').format('h:mm A');
    return formatedtime;
  };

  const [tableData, setTableData] = useState({headers: [], rows: []});
  const [passwordVisibility, setPasswordVisibility] = useState({});
  const [isLoading2, setIsLoading2] = useState(true);

  useEffect(() => {
    if (!data || data.length === 0) {
      setIsLoading2(true);
      setTableData({headers: [], rows: []});
      return;
    }
    const allKeys = new Set();
    const headerItems = [];
    const rowItems = [];

    data.forEach(userItem => {
      const keys = JSON.parse(userItem?.keys || '[]');
      const content = JSON.parse(userItem?.content || '{}');

      keys.forEach(key => {
        if (!allKeys.has(key)) {
          allKeys.add(key);
          const contentItem = content[key];

          if (
            contentItem &&
            contentItem.hasOwnProperty('value') &&
            !['button', 'hidden', 'header', 'autocomplete'].includes(
              contentItem?.type,
            ) &&
            !(isTabbing && contentItem?.name == 'teamName')
          ) {
            const label =
              contentItem?.label?.charAt(0)?.toUpperCase() +
                contentItem?.label?.slice(1) || '-';
            headerItems.push({key, label});
          }
        }
      });
      const rowData = {userItem};
      [...allKeys].forEach(key => {
        rowData[key] = content[key]?.value || '-';
      });
      rowItems.push(rowData);
    });
    setTableData({headers: headerItems, rows: rowItems});
    setIsLoading2(false);
  }, [data, isTabbing]);

  const renderTableHeader = () => {
    if (!tableData.headers || tableData.headers.length == 0) {
      return null;
    }
    return (
      <View style={styles.header}>
        {tableData.headers.map(({key, label}) => {
          return (
            <Text
              key={key}
              style={[
                styles.headerText,
                {
                  width: isTabbing ? width / 2.1 : widthPercentageToDP('40%'),
                },
              ]}>
              {label}
            </Text>
          );
        })}
      </View>
    );
  };

  const renderTableRows = () => {
    return tableData.rows.map((row, index) => {
      return (
        <View
          key={`row_${index}`}
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor:
              index % 2 === 0 ? COLORS.PRIMARYWHITE : COLORS.TABLEROWCOLOR,
            borderLeftWidth: 1,
            borderColor: COLORS.LIGHTGREY,
            borderRightWidth: 1,
            borderBottomWidth: 1,
          }}>
          {tableData.headers.map(({key}, keyIndex) => {
            const contentItem = row?.userItem?.content
              ? JSON.parse(row?.userItem?.content)[key]
              : null;

            let cellContent = null;
            if (contentItem?.type === 'date' && contentItem.value) {
              cellContent = (
                <Text
                  numberOfLines={1}
                  style={{
                    width: widthPercentageToDP('40%'),
                    fontSize: FONTS.FONTSIZE.EXTRASMALL,
                    fontFamily: FONTS.FONT_FAMILY.REGULAR,
                    color: COLORS.TABLEROW,
                    textAlign: 'center',
                  }}>
                  {moment(formatDate(contentItem.value)).format('DD MMMM YYYY')}
                </Text>
              );
            } else if (contentItem?.type === 'time' && contentItem.value) {
              cellContent = (
                <Text
                  numberOfLines={1}
                  style={{
                    width: widthPercentageToDP('40%'),
                    fontSize: FONTS.FONTSIZE.EXTRASMALL,
                    fontFamily: FONTS.FONT_FAMILY.REGULAR,
                    color: COLORS.TABLEROW,
                    textAlign: 'center',
                  }}>
                  {formattedTime(contentItem.value)}
                </Text>
              );
            } else if (contentItem?.subtype === 'password') {
              const valueToDisplay =
                contentItem?.value !== undefined &&
                contentItem?.value !== null &&
                contentItem?.value !== ''
                  ? contentItem.value
                  : '-';

              const togglePasswordVisibility = index => {
                setPasswordVisibility(prevState => ({
                  ...prevState,
                  [index]: !prevState[index],
                }));
              };

              cellContent = (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    width: widthPercentageToDP('35%'),
                    gap: 4,
                  }}>
                  <Text
                    numberOfLines={2}
                    style={{
                      fontSize: FONTS.FONTSIZE.EXTRASMALL,
                      fontFamily: FONTS.FONT_FAMILY.REGULAR,
                      color: COLORS.TABLEROW,
                      textAlign: 'center',
                      width: widthPercentageToDP('30%'),
                    }}>
                    {passwordVisibility[`${index}_${keyIndex}`]
                      ? valueToDisplay
                      : '•'.repeat(valueToDisplay?.length)}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      togglePasswordVisibility(`${index}_${keyIndex}`)
                    }>
                    <Entypo
                      name={
                        passwordVisibility[`${index}_${keyIndex}`]
                          ? 'eye-with-line'
                          : 'eye'
                      }
                      type="material-community"
                      size={20}
                      color={COLORS.TABLEROW}
                    />
                  </TouchableOpacity>
                </View>
              );
            } else if (contentItem?.type === 'file' && contentItem.value) {
              let fileUrls = [];

                            if (typeof contentItem.value === 'string') {
                try {
                                    const parsedValue = JSON.parse(contentItem.value);
                  if (Array.isArray(parsedValue)) {
                    fileUrls = parsedValue;
                  } else {
                    fileUrls = [parsedValue];                   }
                } catch (error) {
                                    fileUrls = [contentItem.value];
                }
              } else if (Array.isArray(contentItem.value)) {
                fileUrls = contentItem.value;               }

                            cellContent = (
                <TouchableOpacity
                  onPress={() => {}}
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                  }}>
                  {fileUrls.map((url, idx) => (
                    <Text
                      onPress={() => {
                        if (getFileType(url) === 'image') {
                          navigation.navigate('FullImageScreen', {
                            image: url,
                          });
                        } else if (getFileType(url) === 'video') {
                          navigation.navigate('VideoGalleryVideoScreen', {
                            videoData: url,
                          });
                        }
                      }}
                      key={idx}
                      numberOfLines={1}
                      style={{
                        width: widthPercentageToDP('40%'),
                        fontSize: FONTS.FONTSIZE.EXTRASMALL,
                        fontFamily: FONTS.FONT_FAMILY.REGULAR,
                        color: COLORS.TITLECOLOR,
                        textAlign: 'center',
                        margin: 4,
                      }}>
                      {url ? url?.split('/')[1] : ''}
                    </Text>
                  ))}
                </TouchableOpacity>
              );
            } else {
              const valueToDisplay =
                contentItem?.value !== undefined &&
                contentItem?.value !== null &&
                contentItem?.value !== ''
                  ? contentItem.value
                  : '-';

              cellContent = (
                <Text
                  numberOfLines={2}
                  style={{
                    width: widthPercentageToDP('40%'),
                    fontSize: FONTS.FONTSIZE.EXTRASMALL,
                    fontFamily: FONTS.FONT_FAMILY.REGULAR,
                    color: COLORS.TABLEROW,
                    textAlign: 'center',
                  }}>
                  {valueToDisplay}
                </Text>
              );
            }

            return (
              <View
                key={`cell_${key}_${index}`}
                style={{
                  width: isTabbing ? width / 2.1 : widthPercentageToDP('40%'),
                  color: COLORS.TABLEROW,
                  flex: 1,
                  overflow: 'hidden',
                  textAlign: 'center',
                  alignSelf: 'stretch',
                  padding: 5,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                {cellContent}
              </View>
            );
          })}
        </View>
      );
    });
  };

  const combinedLoading = networkLoading || isLoading2;

  return (
    <View style={{flex: 1}}>
      {combinedLoading ? (
        <Loader />
      ) : isConnected ? (
        <View style={{flex: 1}}>
          {data?.length > 0 ? (
            <View style={{flex: 1}}>
              {tableData.headers && tableData.headers.length > 0 ? (
                <ScrollView horizontal style={{marginTop: 10}}>
                  <View style={styles.tableContainer}>
                    {renderTableHeader()}
                    <ScrollView contentContainerStyle={{flexGrow: 1}}>
                      {renderTableRows()}
                    </ScrollView>
                  </View>
                </ScrollView>
              ) : (
                <NoDataFound />
              )}
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
}
