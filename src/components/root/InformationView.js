import React, {useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import {widthPercentageToDP} from 'react-native-responsive-screen';
import FONTS from '../../theme/Fonts';
import COLORS from '../../theme/Color';
import NoDataFound from './NoDataFound';
import {AntDesign} from "@react-native-vector-icons/ant-design";

export default function InformationView({data, pageNumber, PAGE_SIZE}) {
  const {width} = useWindowDimensions();
  const styles = StyleSheet.create({
    pkgLbl: {
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      fontSize: FONTS.FONTSIZE.SMALL,
      color: COLORS.PRIMARYBLACK,
      textAlign: 'left',
    },
    titleText: {
      fontFamily: FONTS.FONT_FAMILY.REGULAR,
      fontSize: FONTS.FONTSIZE.EXTRASMALL,
      color: COLORS.PRIMARYBLACK,
      width: '50%',
    },
    text: {
      fontFamily: FONTS.FONT_FAMILY.SEMI_BOLD,
      fontSize: FONTS.FONTSIZE.EXTRASMALL,
      color: COLORS.PRIMARYBLACK,
      width: '50%',
      textAlign: 'left',
    },
    textView: {
      flexDirection: 'row',
    },
  });

  const [openIndex, setOpenIndex] = useState({});
  const renderList = ({item, index}) => {
    const keys = JSON.parse(data[0]?.keys);

    // const number = index >= 0 && index <= 9 ? `0${index + 1}` : `${index + 1}`;
    const number1 = (pageNumber - 1) * PAGE_SIZE + index + 1;
    const number = number1 <= 9 ? `0${number1}` : `${number1}`;
    const parsedContent = JSON.parse(item?.content);

    if (parsedContent.type == 'header') {
      return null;
    }

    const eventEntry = parsedContent.name?.value || '';
    const handleToggle = index => {
      setOpenIndex(prevState => ({
        ...prevState,
        [index]: !prevState[index],
      }));
    };

    return (
      <View
        style={{
          backgroundColor: COLORS.PRIMARYWHITE,
          flex: 1,
          overflow: 'hidden',
          borderRadius: 10,
          padding: 6,
          margin: 6,
        }}
        key={index}>
        <TouchableOpacity
          onPress={() => {
            handleToggle(index);
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              width: width / 1.4,
            }}>
            <View
              style={{
                backgroundColor: COLORS.LABELCOLOR,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 10,
                maxWidth: '30%',
                padding: 6,
              }}>
              <Text style={[styles.pkgLbl, {color: COLORS.PRIMARYWHITE}]}>
                {number}
              </Text>
            </View>
            <View style={{}}>
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                  fontSize: FONTS.FONTSIZE.EXTRASMALL,
                  color: COLORS.PLACEHOLDERCOLOR,
                }}>
                {eventEntry == 'null' ? '-' : eventEntry}
              </Text>
            </View>
          </View>
          <View>
            {openIndex[index] ? (
              <AntDesign name="up" size={20} color={COLORS.LABELCOLOR} />
            ) : (
              <AntDesign name="down" size={20} color={COLORS.LABELCOLOR} />
            )}
          </View>
        </TouchableOpacity>
        {openIndex[index] && (
          <View
            key={index.toString()}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 4,
            }}>
            <View>
              {keys.map(key => {
                const data = parsedContent[key];
                if (data?.type == 'header') return null;

                return (
                  data && (
                    <View style={styles.textView} key={key}>
                      <Text style={styles.titleText}>{`${data.label} :`}</Text>
                      <Text style={styles.text}>
                        {data.value ? data.value : '-'}
                      </Text>
                    </View>
                  )
                );
              })}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={{flex: 1}}>
      {data?.length > 0 ? (
        <>
          <FlatList
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{paddingBottom: 10}}
            data={data}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderList}
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
