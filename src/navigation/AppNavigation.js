import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import SplashScreen from '../screens/root/SplashScreen';
import LoginScreen from '../screens/root/LoginScreen';
import SignUpScreen from '../screens/root/SignUpScreen';
import DrawerNavigator from './DrawerNavigator';
import FormScreen from '../screens/FormScreen';
import ForgotPass from '../screens/root/ForgotPass';
import EventScreen from '../screens/EventScreen';
import EventDetails from '../screens/EventDetails';
import EventAttendee from '../screens/EventAttendee';
import ImageGallery from '../screens/ImageGallery';
import VideoGallery from '../screens/VideoGallery';
import RegistrationPreviewAfterQrCode from '../screens/RegistrationPreviewAfterQrCode';
import Registration1 from '../screens/Registration1';
import ImageVIewAllGallery from '../screens/ImageViewAllGallery';
import FullImageScreen from '../screens/FullImageScreen';
import VideoViewAllGallery from '../screens/VideoViewAllGallery';
import VideoGalleryVideoScreen from '../screens/VideoGalleryVideoScreen';
import HotelDetails from '../screens/HotelDetails';
import MapScreen from '../screens/MapScreen';
import ViewScreen from '../screens/ViewScreen';
import VerifyScreen from '../screens/root/VerifyScreen';
import NewPassword from '../screens/root/NewPassword';
import RegistrationPreview from '../screens/RegistrationPreview';
import FormRecords from '../screens/FormRecords';
import TableScreen from '../screens/TableScreen';
import {Platform, StatusBar} from 'react-native';
import COLORS from '../theme/Color';
import NewsDetails from '../screens/NewsDetails';
import EntertainmentDetails from '../screens/EntertainmentDetails';
import MoreDetails from '../screens/MoreDetails';
import {navigationRef} from '../utils/NavigationService';
import QrCodeScanScreen from '../screens/QrCodeScanScreen';
import EventDashboard from '../screens/EventDashboard';
import TemplateSelectionScreen from '../screens/TemplateSelectionScreen';
import TemplatePreviewScreen from '../screens/TemplatePreviewScreen';
import NameListScreen from '../screens/NameListScreen';
import RSVPScreen from '../screens/RSVPScreen';
import ReportsList from '../screens/ReportsList';
import ReportsData from '../screens/ReportsData';
import MemberSummary from '../screens/MemberSummary';
import ReorderList from '../screens/ReorderList';
import MemberScreen from '../screens/MemberScreen';
import FileViewer from '../screens/FileViewer';
import LiveStreamHost from '../screens/LiveStreamHost';
import LiveBroadcast from '../screens/LiveBroadcast';
import LiveStreamView from '../screens/LiveStreamView';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import DemisesDetails from '../screens/DemisesDetails';
import BroadcasterScreen from '../screens/BroadcasterScreen';
import ViewerScreen from '../screens/ViewerScreen';
import FullScreenVideoScreen from '../screens/FullScreenVideoScreen';
import NotificationScreen from '../screens/root/NotificationScreen';

const Stack = createStackNavigator();

function AppNavigation() {
  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor:
            Platform.OS === 'ios'
              ? COLORS.BACKGROUNDCOLOR
              : COLORS.BACKGROUNDCOLOR,
        }}>
        <StatusBar
          barStyle={'dark-content'}
          backgroundColor={COLORS.BACKGROUNDCOLOR}
        />
        <NavigationContainer ref={navigationRef}>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
            }}>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignUpScreen} />
            <Stack.Screen name="ForgotPass" component={ForgotPass} />
            <Stack.Screen name="Verify" component={VerifyScreen} />
            <Stack.Screen name="NewPassword" component={NewPassword} />
            <Stack.Screen name="Main" component={DrawerNavigator} />
            <Stack.Screen name="LiveStreamHost" component={LiveStreamHost} />
            <Stack.Screen name="LiveBroadcast" component={LiveBroadcast} />
            <Stack.Screen name="LiveStreamView" component={LiveStreamView} />
            <Stack.Screen name="ReorderList" component={ReorderList} />
            <Stack.Screen name="FormRecords" component={FormRecords} />
            <Stack.Screen name="TableScreen" component={TableScreen} />
            <Stack.Screen name="Form" component={FormScreen} />
            <Stack.Screen name="View" component={ViewScreen} />
            <Stack.Screen name="EventScreen" component={EventScreen} />
            <Stack.Screen name="EventDetails" component={EventDetails} />
            <Stack.Screen
              name="TemplateSelectionScreen"
              component={TemplateSelectionScreen}
            />
            <Stack.Screen
              name="TemplatePreviewScreen"
              component={TemplatePreviewScreen}
            />
            <Stack.Screen name="EventAttendee" component={EventAttendee} />
            <Stack.Screen name="ImageGallery" component={ImageGallery} />
            <Stack.Screen
              name="ImageVIewAllGallery"
              component={ImageVIewAllGallery}
            />
            <Stack.Screen name="FullImageScreen" component={FullImageScreen} />
            <Stack.Screen name="VideoGallery" component={VideoGallery} />
            <Stack.Screen
              name="VideoViewAllGallery"
              component={VideoViewAllGallery}
            />
            <Stack.Screen
              name="VideoGalleryVideoScreen"
              component={VideoGalleryVideoScreen}
            />
            <Stack.Screen name="Registration1" component={Registration1} />
            <Stack.Screen name="RSVPScreen" component={RSVPScreen} />
            <Stack.Screen name="MemberScreen" component={MemberScreen} />
            <Stack.Screen
              name="QrCodeScanScreen"
              component={QrCodeScanScreen}
            />
            <Stack.Screen name="EventDashboard" component={EventDashboard} />
            <Stack.Screen name="NameListScreen" component={NameListScreen} />
            <Stack.Screen
              name="RegistrationPreview"
              component={RegistrationPreview}
            />
            <Stack.Screen
              name="RegistrationPreviewAfterQrCode"
              component={RegistrationPreviewAfterQrCode}
            />
            <Stack.Screen name="HotelDetails" component={HotelDetails} />
            <Stack.Screen name="MapScreen" component={MapScreen} />
            <Stack.Screen name="NewsDetails" component={NewsDetails} />
            <Stack.Screen name="MoreDetails" component={MoreDetails} />
            <Stack.Screen
              name="EntertainmentDetails"
              component={EntertainmentDetails}
            />
            <Stack.Screen name="ReportsList" component={ReportsList} />
            <Stack.Screen name="ReportsData" component={ReportsData} />
            <Stack.Screen name="MemberSummary" component={MemberSummary} />
            <Stack.Screen name="FileViewer" component={FileViewer} />
            <Stack.Screen
              name="BroadcasterScreen"
              component={BroadcasterScreen}
            />
            <Stack.Screen name="ViewerScreen" component={ViewerScreen} />
            <Stack.Screen
              name="FullScreenVideo"
              component={FullScreenVideoScreen}
            />
            <Stack.Screen name="DemisesDetails" component={DemisesDetails} />
            <Stack.Screen name="NotificationScreen" component={NotificationScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default AppNavigation;
