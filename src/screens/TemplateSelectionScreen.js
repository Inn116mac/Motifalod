import React from 'react';
import {View, StyleSheet, ScrollView, Image} from 'react-native';
import COLORS from '../theme/Color';
import CustomHeader from '../components/root/CustomHeader';
import {useNavigation} from '@react-navigation/native';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import ButtonComponent from '../components/root/ButtonComponent';
import {heightPercentageToDP} from 'react-native-responsive-screen';

const TemplateSelectionScreen = ({route}) => {
  const {evnentObj} = route.params;

  const navigation = useNavigation();

  const templates = [
    {
      id: 'template1',
      imageSource: require('../assets/images/Template1.png'), // Replace with your image path
    },
    // {
    //   id: 'template2',
    //   imageSource: require('../assets/images/Template2.png'), // Replace with your image path
    // },
    // {
    //   id: 'template3',
    //   imageSource: require('../assets/images/Template3.png'), // Replace with your image path
    // },
    // {
    //   id: 'template4',
    //   imageSource: require('../assets/images/Template4.png'), // Replace with your image path
    // },
    // {
    //   id: 'template5',
    //   imageSource: require('../assets/images/Template5.png'), // Replace with your image path
    // },
    // {
    //   id: 'template6',
    //   imageSource: require('../assets/templates/template6.png'), // Replace with your image path
    // },
  ];

  const handleTemplateSelection = templateId => {
    navigation.navigate('TemplatePreviewScreen', {
      templateId: templateId,
      eventData: evnentObj,
    });
  };

  return (
    <View style={styles.container}>
      <CustomHeader
        leftOnPress={() => {
          navigation.goBack();
        }}
        leftIcon={
          <FontAwesome6 name="angle-left" size={26} color={COLORS.LABELCOLOR} />
        }
        title={'Templates'}
      />
      <ScrollView
        style={{flexGrow: 1}}
        contentContainerStyle={styles.scrollViewContainer}>
        <View style={styles.templateGrid}>
          {templates.map(template => (
            <View key={template.id} style={styles.templateItem}>
              <Image
                source={template.imageSource}
                style={styles.templateImage}
                resizeMode="contain"
              />

              <ButtonComponent
                title={'Use this template'}
                onPress={() => handleTemplateSelection(template.id)}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUNDCOLOR,
  },
  scrollViewContainer: {
    margin: 10,
    paddingBottom: 10,
  },
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  templateItem: {
    width: '45%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  templateImage: {
    width: '100%',
    height: heightPercentageToDP(30),
  },
});

export default TemplateSelectionScreen;
