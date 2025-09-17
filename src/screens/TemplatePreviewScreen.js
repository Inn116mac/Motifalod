import React from 'react';
import {View, StyleSheet, Text} from 'react-native';
import Template1 from '../components/root/Templates/Template1';
import COLORS from '../theme/Color';
import CustomHeader from '../components/root/CustomHeader';
import {useNavigation} from '@react-navigation/native';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

const TemplatePreviewScreen = ({route}) => {
  const {templateId, eventData} = route.params;
  const navigation = useNavigation();

  const getTemplateContent = (templateId, eventData) => {
    switch (templateId) {
      case 'template1':
        return <Template1 data={eventData} />;
      // case 'template2':
      //   return (
      //     <View style={styles.templateContainer}>
      //       <Image
      //         source={require('../assets/templates/template2_large.png')} // Replace with your large template image path
      //         style={styles.templateImage}
      //         resizeMode="contain"
      //       />
      //       {/* Add dynamic data here */}
      //       <Text>janet</Text>
      //       <Text>{eventData.date}</Text>
      //       <Text>{eventData.location}</Text>
      //     </View>
      //   );
      // case 'template3':
      //   return (
      //     <View style={styles.templateContainer}>
      //       <Image
      //         source={require('../assets/templates/template3_large.png')} // Replace with your large template image path
      //         style={styles.templateImage}
      //         resizeMode="contain"
      //       />
      //       {/* Add dynamic data here */}
      //       <Text>Mayank</Text>
      //       <Text>{eventData.date}</Text>
      //       <Text>{eventData.location}</Text>
      //     </View>
      //   );
      // case 'template4':
      //   return (
      //     <View style={styles.templateContainer}>
      //       <Image
      //         source={require('../assets/templates/template4_large.png')} // Replace with your large template image path
      //         style={styles.templateImage}
      //         resizeMode="contain"
      //       />
      //       {/* Add dynamic data here */}
      //       <Text>Robert</Text>
      //       <Text>{eventData.date}</Text>
      //       <Text>{eventData.location}</Text>
      //     </View>
      //   );
      // case 'template5':
      //   return (
      //     <View style={styles.templateContainer}>
      //       <Image
      //         source={require('../assets/templates/template5_large.png')} // Replace with your large template image path
      //         style={styles.templateImage}
      //         resizeMode="contain"
      //       />
      //       {/* Add dynamic data here */}
      //       <Text>Annie</Text>
      //       <Text>{eventData.date}</Text>
      //       <Text>{eventData.location}</Text>
      //     </View>
      //   );

      default:
        return <Text>Template not found</Text>;
    }
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
      />
      <View
        style={{
          flex: 1,
          padding: 20,
        }}>
        {getTemplateContent(templateId, eventData)}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUNDCOLOR,
  },
});

export default TemplatePreviewScreen;
