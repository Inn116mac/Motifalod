import {View, Text, StyleSheet, TouchableOpacity, FlatList} from 'react-native';
import React, {useState} from 'react';
import COLORS from '../../theme/Color';
import {useNavigation} from '@react-navigation/native';
import FONTS from '../../theme/Fonts';
import {heightPercentageToDP} from 'react-native-responsive-screen';
import moment from 'moment';
import NoDataFound from './NoDataFound';
import {IMAGE_URL} from '../../connection/Config';
import FastImage from 'react-native-fast-image';

export default function SadDemises({data}) {
  const navigation = useNavigation();

  const styles = StyleSheet.create({
    listContainer: {
      padding: heightPercentageToDP('1.5%'),
    },
    lstCont: {
      marginBottom: 10,
      borderRadius: 15,
      backgroundColor: COLORS.PRIMARYWHITE,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: '#e8eaed',
    },
    txtTitle: {
      fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
      fontSize: FONTS.FONTSIZE.MEDIUM,
      color: '#5b738b',
    },
    txtAddress: {
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
      fontSize: FONTS.FONTSIZE.SEMIMINI,
      color: '#8e939d',
      includeFontPadding: false,
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
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const renderDemises = ({item, index}) => {
    const parsedItem = JSON.parse(item?.content);

    const name = parsedItem?.fullname?.value || '-';
    const age = parsedItem?.age?.value || '-';
    const location = parsedItem?.funeralLocation?.value || '-';

    const demiseDate = parsedItem.dateDemise?.value || '';
    const formattedDemiseDate = formatDate(demiseDate);

    const funeralDate = parsedItem.funeralDate?.value || '';
    const formattedFuneralDate = formatDate(funeralDate);

    const funeralTime = parsedItem.funeralTime?.value || '';

    const salutation = parsedItem.salutation?.value || '';
    let value = parsedItem?.personImage?.value;
    let imageArray;

    if (!value) {
      imageArray = [];
    } else {
      try {
        const parsed = JSON.parse(value);

        imageArray = Array.isArray(parsed) ? parsed : [parsed];
      } catch (error) {
        imageArray = [value];
      }
    }

    const image = imageArray.length > 0 ? imageArray[0] : null;

    return (
      <TouchableOpacity
        key={index?.toString()}
        activeOpacity={0.8}
        style={styles.lstCont}
        onPress={() => {
          navigation.navigate('DemisesDetails', {
            demisesObj: parsedItem,
          });
        }}>
        <View style={{flexDirection: 'column', padding: 10}}>
          <View
            style={{
              width: '100%',
              height: 200,
              borderRadius: 8,
              backgroundColor: '#ddd',
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <FastImage
              defaultSource={require('../../assets/images/Image_placeholder.png')}
              source={
                imageError
                  ? require('../../assets/images/noimage.png')
                  : {
                      uri: IMAGE_URL + image,
                      cache: FastImage.cacheControl.immutable,
                      priority: FastImage.priority.normal,
                    }
              }
              style={{width: '100%', height: '100%', transform: [{scale: 1.4}]}}
              resizeMode={'contain'}
              onError={handleImageError}
            />
          </View>
          <View style={{flex: 1}}>
            <Text
              numberOfLines={2}
              style={[
                styles.txtTitle,
                {marginTop: 6, marginBottom: 2, includeFontPadding: false},
              ]}>
              {name}
            </Text>
            <View style={{gap: 2}}>
              <Text style={styles.txtAddress}>
                Age:{' '}
                <Text
                  style={{
                    color: '#747679',
                  }}>
                  {age}
                </Text>
              </Text>
              <Text numberOfLines={2} style={styles.txtAddress}>
                Location:{' '}
                <Text
                  style={{
                    color: '#747679',
                  }}>
                  {location}
                </Text>
              </Text>
              <Text style={styles.txtAddress}>
                Demise Date:{' '}
                <Text
                  style={{
                    color: '#747679',
                  }}>
                  {moment(formattedDemiseDate).format('MMMM DD, YYYY')}
                </Text>
              </Text>
              <Text style={styles.txtAddress}>
                Funeral Date:{' '}
                <Text
                  style={{
                    color: '#383a3e',
                    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
                  }}>
                  {moment(formattedFuneralDate).format('MMMM DD, YYYY')}
                </Text>
              </Text>
              <Text style={styles.txtAddress}>
                Funeral Time:{' '}
                <Text
                  style={{
                    color: '#383a3e',
                    fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
                  }}>
                  {funeralTime}
                </Text>
              </Text>
              <Text
                style={[
                  styles.txtAddress,
                  {color: '#3e4044', fontSize: FONTS.FONTSIZE.SMALL},
                ]}>
                {salutation}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{flex: 1}}>
      {data?.length > 0 ? (
        <>
          <FlatList
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            data={data}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderDemises}
            removeClippedSubviews={true}
            maxToRenderPerBatch={30}
            updateCellsBatchingPeriod={200}
            windowSize={40}
            initialNumToRender={10}
          />
        </>
      ) : (
        <NoDataFound />
      )}
    </View>
  );
}
