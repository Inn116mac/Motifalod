import {View, Text, StyleSheet, TouchableOpacity, FlatList} from 'react-native';
import React from 'react';
import COLORS from '../../theme/Color';
import {useNavigation} from '@react-navigation/native';
import FONTS from '../../theme/Fonts';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import moment from 'moment';
import NoDataFound from './NoDataFound';

export default function Entertainment({data}) {
  const navigation = useNavigation();

  const styles = StyleSheet.create({
    listContainer: {
      padding: heightPercentageToDP('1%'),
    },
    lstCont: {
      marginBottom: 10,
      borderRadius: 15,
      backgroundColor: COLORS.PRIMARYWHITE,
      overflow: 'hidden',
    },
    txtTitle: {
      fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
      fontSize: FONTS.FONTSIZE.SMALL,
      color: COLORS.TITLECOLOR,
      letterSpacing: 1,
    },
    txtAddress: {
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
      fontSize: FONTS.FONTSIZE.MINI,
      color: COLORS.PLACEHOLDERCOLOR,
      letterSpacing: 1,
      paddingRight: 4,
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

  const renderEntertainment = ({item, index}) => {
    const parsedItem = JSON.parse(item?.content);

    const location = parsedItem.location?.value || '';
    const dateItem = parsedItem.date?.value || '';
    const title = parsedItem.title?.value || '';

    const formattedDate = formatDate(dateItem);

    return (
      <TouchableOpacity
        key={index?.toString()}
        activeOpacity={0.8}
        style={styles.lstCont}
        onPress={() => {
          navigation.navigate('EntertainmentDetails', {
            entertainmentObj: item,
          });
        }}>
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: 10,
          }}>
          <View
            style={{
              backgroundColor: COLORS.TITLECOLOR,
              alignContent: 'center',
              borderBottomLeftRadius: 10,
              borderBottomRightRadius: 10,
              width: widthPercentageToDP('16%'),
              alignItems: 'center',
              justifyContent: 'center',
              bottom: 10,
              padding: 10,
            }}>
            <Text
              numberOfLines={2}
              style={{
                letterSpacing: 1,
                color: COLORS.PRIMARYWHITE,
                width: widthPercentageToDP('11%'),
                textAlign: 'center',
                fontSize: FONTS.FONTSIZE.SEMI,
                fontFamily: FONTS.FONT_FAMILY.BOLD,
              }}>
              {moment(formattedDate).format('DD')}
            </Text>
            <Text
              numberOfLines={2}
              style={{
                fontSize: FONTS.FONTSIZE.SEMIMINI,
                fontFamily: FONTS.FONT_FAMILY.REGULAR,
                color: COLORS.PRIMARYWHITE,
                letterSpacing: 1,
                width: widthPercentageToDP('11%'),
                textAlign: 'center',
              }}>
              {moment(formattedDate).format('MMM')}
            </Text>
            <Text
              numberOfLines={2}
              style={{
                fontSize: FONTS.FONTSIZE.SEMIMINI,
                fontFamily: FONTS.FONT_FAMILY.LIGHT,
                color: COLORS.PRIMARYWHITE,
                letterSpacing: 1,
                width: widthPercentageToDP('11%'),
                textAlign: 'center',
              }}>
              {moment(formattedDate).format('ddd')}
            </Text>
          </View>

          <View style={{marginLeft: 10, paddingVertical: 4, flex: 1}}>
            <Text numberOfLines={2} style={styles.txtTitle}>
              {title}
            </Text>
            <Text numberOfLines={2} style={styles.txtAddress}>
              {location}
            </Text>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              <Text style={[styles.txtAddress]}>
                {moment(formattedDate).format('DD MMMM YYYY , dddd')}
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
            contentContainerStyle={styles.listContainer}
            data={data}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderEntertainment}
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
