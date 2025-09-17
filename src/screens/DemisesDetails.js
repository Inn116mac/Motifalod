import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {useNetworkStatus} from '../connection/UseNetworkStatus';
import CustomHeader from '../components/root/CustomHeader';
import COLORS from '../theme/Color';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import Offline from '../components/root/Offline';
import FONTS from '../theme/Fonts';
import {useNavigation} from '@react-navigation/native';
import {getFileType} from '../utils/fileType';
import {getImageUri} from '../constant/Module';
import FastImage from 'react-native-fast-image';
import moment from 'moment';
import {IMAGE_URL} from '../connection/Config';

const DemisesDetails = ({route}) => {
  const {demisesObj} = route.params;
  const navigation = useNavigation();
  const [urlValidity, setUrlValidity] = useState({});

  const sections = [];
  let currentSection = null;

  Object.keys(demisesObj).forEach(key => {
    const data = demisesObj[key];
    if (
      data.type &&
      (data.type === 'hidden' ||
        data.type === 'button' ||
        data.type === 'section' ||
        data.type === 'file')
    ) {
      return; // skip
    }

    if (data.type === 'header') {
      if (currentSection) sections.push(currentSection);
      currentSection = {
        title: data.label,
        items: [],
      };
    } else if (currentSection) {
      if (data.value !== null && data.value !== '') {
        currentSection.items.push(data);
      }
    }
  });
  if (currentSection) sections.push(currentSection);

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

  const {isConnected, networkLoading} = useNetworkStatus();

  const getFirstImageUri = value => {
    try {
      const arr = JSON.parse(value);
      if (Array.isArray(arr) && arr.length > 0) {
        return arr[0];
      }
    } catch (e) {
      // parsing error
    }
    return '';
  };

  return (
    <View style={{flex: 1, backgroundColor: COLORS.BACKGROUNDCOLOR}}>
      <CustomHeader
        leftOnPress={() => {
          navigation.goBack();
        }}
        leftIcon={
          <FontAwesome6 name="angle-left" size={26} color={COLORS.LABELCOLOR} />
        }
        title={'Demise Details'}
      />
      {isConnected ? (
        <ScrollView style={styles.container}>
          {sections.map((section, sIdx) => (
            <View style={styles.sectionBox} key={`section_${sIdx}`}>
              <Text numberOfLines={2} style={styles.sectionTitle}>
                {section.title}
              </Text>
              {section.items.map((infoItem, idx) => {
                if (!infoItem.value) return null;

                return (
                  <View key={idx} style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{infoItem?.label} : </Text>
                    {/* <Text style={styles.infoValue}>
                      {infoItem?.value || '-'}
                    </Text> */}
                    {infoItem.type === 'file' ? (
                      infoItem.value ? (
                        getFileType(
                          getImageUri(getFirstImageUri(infoItem.value)),
                        ) === 'image' ? (
                          <TouchableOpacity
                            onPress={() => {
                              let imageuri = getFirstImageUri(infoItem.value);

                              navigation.navigate('FullImageScreen', {
                                image: imageuri,
                              });
                            }}>
                            <FastImage
                              defaultSource={require('../assets/images/Image_placeholder.png')}
                              source={
                                urlValidity[getFirstImageUri(infoItem.value)]
                                  ? require('../assets/images/noimage.png')
                                  : {
                                      uri:
                                        IMAGE_URL +
                                        getImageUri(
                                          getFirstImageUri(infoItem.value),
                                        ),
                                      cache: FastImage.cacheControl.immutable,
                                      priority: FastImage.priority.normal,
                                    }
                              }
                              resizeMode={
                                urlValidity[getFirstImageUri(infoItem.value)]
                                  ? 'contain'
                                  : 'cover'
                              }
                              style={{
                                height: 80,
                                width: 170,
                                borderRadius: 5,
                              }}
                              onError={() => {
                                setUrlValidity(prev => ({
                                  ...prev,
                                  [getImageUri(
                                    getFirstImageUri(infoItem.value),
                                  )]: true,
                                }));
                              }}
                            />
                          </TouchableOpacity>
                        ) : null
                      ) : (
                        <Text style={styles.infoValue}>-</Text>
                      )
                    ) : infoItem.type === 'date' ? (
                      <Text style={styles.infoValue}>
                        {infoItem.value
                          ? moment(formatDate(infoItem.value)).format(
                              'DD MMMM YYYY',
                            )
                          : '-'}
                      </Text>
                    ) : infoItem.type === 'time' ? (
                      <Text style={styles.infoValue}>
                        {infoItem.value ? formattedTime(infoItem.value) : '-'}
                      </Text>
                    ) : (
                      <Text style={styles.infoValue}>
                        {infoItem.value ? infoItem.value : '-'}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </ScrollView>
      ) : (
        <Offline />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, padding: 10},
  sectionBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e8eaed',
  },
  sectionTitle: {
    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
    fontSize: FONTS.FONTSIZE.MEDIUM,
    color: '#222',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  infoLabel: {
    color: '#555',
    flex: 2,
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    fontSize: FONTS.FONTSIZE.SMALL,
  },
  infoValue: {
    flex: 3,
    color: '#222',
    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    fontSize: FONTS.FONTSIZE.SMALL,
  },
});

export default DemisesDetails;
