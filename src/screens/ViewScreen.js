import {
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import COLORS from '../theme/Color';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import {useNavigation} from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import {NOTIFY_MESSAGE} from '../constant/Module';
import Loader from '../components/root/Loader';
import Hotels from '../components/root/Hotels';
import Entertainment from '../components/root/Entertainment';
import NewsView from '../components/root/NewsView';
import Offline from '../components/root/Offline';
import CustomHeader from '../components/root/CustomHeader';
import NoDataFound from '../components/root/NoDataFound';
import DonationView from '../components/root/DonationView';
import {useNetworkStatus} from '../connection/UseNetworkStatus';
import httpClient from '../connection/httpClient';
import DetailsLayout from '../components/root/Layout/DetailsLayout';
import ListLayout from '../components/root/Layout/ListLayout';
import SingleCollapse from '../components/root/Layout/SingleCollapse';
import OrderView from '../components/root/Layout/OrderView';
import CustomTable from '../components/root/CustomTable';
import ProfileLayout from '../components/root/Layout/ProfileLayout';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import FONTS from '../theme/Fonts';
import AntDesign from 'react-native-vector-icons/AntDesign';
import SadDemises from '../components/root/SadDemises';

const ViewScreen = ({route}) => {
  const {item} = route.params.data;
  const {width, height} = useWindowDimensions();

  const styles = StyleSheet.create({
    paginationText: {
      fontSize: FONTS.FONTSIZE.SMALL,
      color: 'blue',
      textAlign: 'center',
      fontFamily: FONTS.FONT_FAMILY.MEDIUM,
    },
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
      textAlign: 'center',
    },
    eventModalContainer: {
      flex: 1,
      alignItems: 'center',
      overflow: 'hidden',
      justifyContent: 'center',
      backgroundColor: 'rgba(128, 128, 128, 0.5)',
    },
    eventModalContent: {
      width: width / 1.2,
      maxHeight: height / 1.3,
      backgroundColor: COLORS.PRIMARYWHITE,
      borderRadius: 8,
    },
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    filterContainer: {
      backgroundColor: COLORS.LABELCOLOR,
      borderRadius: 20,
      alignSelf: 'flex-end',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 10,
      paddingVertical: 4,
      right: 10,
    },
  });

  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [data, setData] = useState([]);

  const {isConnected, networkLoading} = useNetworkStatus();

  const [eventData, setEventData] = useState([]);
  const [filterLoading, setFilterLoading] = useState(false);
  const [isEventDataModal, setIsEventDataModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [tabValues, setTabValues] = useState([]);
  const [selectedTab, setSelectedTab] = useState(null);

  function onEventFilter() {
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setFilterLoading(true);
        httpClient
          .get(
            `module/configuration/dropdown?contentType=EVENT&moduleName=${item?.constantName}`,
          )
          .then(response => {
            const {data} = response;
            const {status, message, result} = data;

            if (status || (status == true && result)) {
              setFilterLoading(false);
              const newEvent = {
                id: 0,
                name: 'All',
              };
              result.unshift(newEvent);
              setEventData(result);
            } else {
              NOTIFY_MESSAGE(message);
              setFilterLoading(false);
            }
          })
          .catch(err => {
            setFilterLoading(false);
            NOTIFY_MESSAGE(err ? 'Something Went Wrong.' : null);
            navigation.goBack();
          });
      } else {
        NOTIFY_MESSAGE('Please check your internet connectivity');
      }
    });
  }

  useEffect(() => {
    const cancel = getViewData();
    return () => cancel && cancel();
  }, [pageNumber, selectedEvent, selectedTab]);

  const PAGE_SIZE = 20;

  useEffect(() => {
    onEventFilter();
  }, []);

  useEffect(() => {
    setPageNumber(1);
    setData([]);
  }, [selectedEvent, selectedTab]);

  useEffect(() => {
    if (tabValues.length > 0 && !selectedTab) {
      setSelectedTab(tabValues[0]);
    }
  }, [tabValues, selectedTab]);

  const getViewData = useCallback(() => {
    let isCancelled = false;

    const data = {
      pageNumber: pageNumber,
      pageSize: PAGE_SIZE,
      keyword: selectedTab ? selectedTab?.value : '',
      orderBy: 'order',
      orderType: -1,
      type: item?.constantName,
      eventId: selectedEvent ? selectedEvent.id : 0,
    };

    NetInfo.fetch().then(state => {
      if (!state.isConnected) {
        NOTIFY_MESSAGE('Please check your internet connectivity');
        return;
      }

      setIsLoading(true);

      httpClient
        .post(`module/mobile/configuration/pagination`, data)
        .then(response => {
          if (isCancelled) return;

          if (response.data.status) {
            const totalRecords = response?.data?.result?.totalRecord || 0;
            const calculatedTotalPages = Math.ceil(totalRecords / PAGE_SIZE);
            const newData = response.data.result.data;

            if (item?.constantName === 'FOOD TEAM') {
              const firstItem = newData[0];
              if (firstItem) {
                try {
                  const jsonParsed = JSON.parse(firstItem.content);
                  const values = jsonParsed?.teamName?.values;
                  if (values?.length > 0) {
                    setTabValues(values);
                  } else {
                    setTabValues([]);
                  }
                } catch {
                  setTabValues([]);
                }
              } else {
                setTabValues([]);
              }
            }

            if (newData?.length > 0) {
              setData(newData);
            } else {
              setData([]);
            }
            const canLoadMore =
              pageNumber < calculatedTotalPages && newData.length > 0;
            setHasMore(canLoadMore);
          } else {
            NOTIFY_MESSAGE(response.data.message || 'Something Went Wrong');
          }
        })
        .catch(error => {
          if (!isCancelled) {
            NOTIFY_MESSAGE(error.message || 'Something Went Wrong');
            navigation.goBack();
          }
        })
        .finally(() => {
          if (!isCancelled) setIsLoading(false);
        });
    });

    return () => {
      isCancelled = true;
    };
  }, [pageNumber, selectedEvent, selectedTab, navigation, item]);

  const loadMore = () => {
    if (hasMore) {
      setPageNumber(prevPage => prevPage + 1);
    }
  };

  const scrollViewRef = useRef(null);
  const [tabLayouts, setTabLayouts] = useState({});

  const onTabLayout = (event, index) => {
    const layout = event.nativeEvent.layout;
    setTabLayouts(prev => ({...prev, [index]: layout}));
  };

  useEffect(() => {
    const index = tabValues.findIndex(tab => tab.value === selectedTab.value);
    if (index === -1) return;

    if (tabLayouts[index] && scrollViewRef.current) {
      const {x, width} = tabLayouts[index];
      scrollViewRef.current.scrollTo({
        x: Math.max(x - 20, 0),
        animated: true,
      });
    }
  }, [selectedTab, tabLayouts]);

  const renderTabs = () => {
    return (
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabContainer}>
        {tabValues.map((tab, index) => (
          <TouchableOpacity
            key={tab?.value || index}
            style={[
              styles.tab,
              selectedTab?.value === tab?.value && styles.activeTab,
            ]}
            onPress={() => setSelectedTab(tab)}
            onLayout={event => onTabLayout(event, index)}>
            <Text style={styles.tabText}>{tab?.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const localData = [
    {
      configurationId: 8456,
      moduleId: 53,
      keys: '["detailsOfDeceasedPerson","member","fullname","age","village","gender","city","state","dateDemise","dayofDemise","placeofDemise","personImage","specialcomments","survivedBy","spouse","fatherandmother","brotherandSisterinLaw","sonandDaughterinLaw","daughterandSoninLaw","grandChildren","greatGrandChildren","prayerInformation","prayerDate","prayerTime","prayerLocation","funeralInformation","funeralDate","funeralTime","funeralLocation","funeralLinkOptional","funerallimitedtoFamily","contactInformation","contactPersonName","phone","contactemail","submissionDetails","salutation","submittedby","relationtoDeceasedperson","submittedEmail"]',
      contentType: 'SAD DEMISES',
      content:
        '{"detailsOfDeceasedPerson": {"type":"header","subtype":"h1","label":"Details Of Deceased Person","name":"detailsOfDeceasedPerson","required":null,"className":null,"access":false,"maxlength":null,"minlength":null,"multiple":null,"values":null,"value":null}, "member": {"type":"select","subtype":null,"label":"Member","name":"member","required":true,"className":"form-control","access":true,"maxlength":null,"minlength":null,"multiple":false,"values":[{"value":8408,"label":"Jackson M Patel - jacksonpoll05@gmail.com","totalMembershipAmount":450.00,"selected":false},{"value":8409,"label":"Owner K Patel - slad3581@gmail.com","totalMembershipAmount":0.00,"selected":false},{"value":8410,"label":"Rony N Patel - Rony@gm.in","totalMembershipAmount":225.00,"selected":false}],"value":"Jackson M Patel - jacksonpoll05@gmail.com"}, "fullname": {"type":"text","subtype":"text","label":"Full Name","name":"fullname","required":true,"className":"form-control","access":false,"maxlength":250,"minlength":null,"multiple":null,"values":null,"value":"vaibhav"}, "age": {"type":"number","subtype":null,"label":"Age","name":"age","required":true,"className":"form-control","access":false,"maxlength":null,"minlength":null,"multiple":null,"values":null,"value":"22"}, "village": {"type":"text","subtype":"text","label":"Village","name":"village","required":true,"className":"form-control","access":false,"maxlength":250,"minlength":null,"multiple":null,"values":null,"value":"vghrech"}, "gender": {"type":"select","subtype":null,"label":"Gender","name":"gender","required":true,"className":"form-control","access":false,"maxlength":null,"minlength":null,"multiple":false,"values":[{"label":"--Select Gender--","value":"Gender","selected":true},{"label":"Male","value":"Male","selected":false},{"label":"Female","value":"Female","selected":false}],"value":"Male"}, "city": {"type":"text","subtype":"text","label":"City","name":"city","required":false,"className":"form-control","access":false,"maxlength":150,"minlength":null,"multiple":null,"values":null,"value":"bilimora"}, "state": {"type":"select","subtype":null,"label":"State","name":"state","required":true,"className":"form-control","access":false,"maxlength":null,"minlength":null,"multiple":false,"values":[{"label":"--Select State--","value":"0","selected":true},{"label":"NC","value":"NC","selected":false},{"label":"TX","value":"TX","selected":false}],"value":"NC"}, "dateDemise": {"type":"date","subtype":null,"label":"Date Of Demise","name":"dateDemise","required":true,"className":"form-control","access":false,"maxlength":null,"minlength":null,"multiple":null,"values":null,"value":"08\\/25\\/2025"}, "dayofDemise": {"type":"text","subtype":"text","label":"Day of Demise","name":"dayofDemise","required":true,"className":"form-control","access":false,"maxlength":100,"minlength":null,"multiple":null,"values":null,"value":"sunday"}, "placeofDemise": {"type":"text","subtype":"text","label":"Place of Demise","name":"placeofDemise","required":true,"className":"form-control","access":false,"maxlength":200,"minlength":null,"multiple":null,"values":null,"value":"nc"}, "personImage": {"type":"file","subtype":"file","label":"Person Image","name":"personImage","required":true,"className":"form-control","access":false,"maxlength":null,"minlength":null,"multiple":false,"values":null,"value":"[\\"content\\/content-250825040823610.jpg\\"]"}, "specialcomments": {"type":"textarea","subtype":"textarea","label":"Special Comments","name":"specialcomments","required":true,"className":"form-control","access":false,"maxlength":1000,"minlength":null,"multiple":null,"values":null,"value":"please come to the time."}, "survivedBy": {"type":"header","subtype":"h1","label":"Survived By","name":"survivedBy","required":null,"className":null,"access":false,"maxlength":null,"minlength":null,"multiple":null,"values":null,"value":null}, "spouse": {"type":"textarea","subtype":"textarea","label":"spouse","name":"spouse","required":false,"className":"form-control","access":false,"maxlength":1000,"minlength":null,"multiple":null,"values":null,"value":"spouse"}, "fatherandmother": {"type":"textarea","subtype":"textarea","label":"Father and Mother","name":"fatherandmother","required":true,"className":"form-control","access":false,"maxlength":1000,"minlength":null,"multiple":null,"values":null,"value":"father and mother"}, "brotherandSisterinLaw": {"type":"textarea","subtype":"textarea","label":"Brother and Sister-in-Law","name":"brotherandSisterinLaw","required":false,"className":"form-control","access":false,"maxlength":1000,"minlength":null,"multiple":null,"values":null,"value":"brother and sister-in-law"}, "sonandDaughterinLaw": {"type":"textarea","subtype":"textarea","label":"Son and Daughter-in-Law","name":"sonandDaughterinLaw","required":false,"className":"form-control","access":false,"maxlength":1000,"minlength":null,"multiple":null,"values":null,"value":"son and daughter-in-law"}, "daughterandSoninLaw": {"type":"textarea","subtype":"textarea","label":"Daughter and Son-in-law","name":"daughterandSoninLaw","required":false,"className":"form-control","access":false,"maxlength":1000,"minlength":null,"multiple":null,"values":null,"value":"daughter and son-in-law"}, "grandChildren": {"type":"textarea","subtype":"textarea","label":"Grand Children","name":"grandChildren","required":false,"className":"form-control","access":false,"maxlength":1000,"minlength":null,"multiple":null,"values":null,"value":"grand children"}, "greatGrandChildren": {"type":"textarea","subtype":"textarea","label":"Great Grand Children","name":"greatGrandChildren","required":false,"className":"form-control","access":false,"maxlength":1000,"minlength":null,"multiple":null,"values":null,"value":"great grand children"}, "prayerInformation": {"type":"header","subtype":"h1","label":"Prayer Information","name":"prayerInformation","required":null,"className":null,"access":false,"maxlength":null,"minlength":null,"multiple":null,"values":null,"value":null}, "prayerDate": {"type":"date","subtype":null,"label":"Prayer Date","name":"prayerDate","required":true,"className":"form-control","access":false,"maxlength":null,"minlength":null,"multiple":null,"values":null,"value":"08\\/25\\/2025"}, "prayerTime": {"type":"time","subtype":null,"label":"Prayer Time","name":"prayerTime","required":true,"className":null,"access":false,"maxlength":null,"minlength":null,"multiple":null,"values":null,"value":"4:39 PM"}, "prayerLocation": {"type":"text","subtype":"text","label":"Prayer Location","name":"prayerLocation","required":true,"className":"form-control","access":false,"maxlength":1000,"minlength":null,"multiple":null,"values":null,"value":"nc"}, "funeralInformation": {"type":"header","subtype":"h1","label":"Funeral Information","name":"funeralInformation","required":null,"className":null,"access":false,"maxlength":null,"minlength":null,"multiple":null,"values":null,"value":null}, "funeralDate": {"type":"date","subtype":null,"label":"Funeral Date","name":"funeralDate","required":true,"className":"form-control","access":false,"maxlength":null,"minlength":null,"multiple":null,"values":null,"value":"08\\/25\\/2025"}, "funeralTime": {"type":"time","subtype":null,"label":"Funeral Time","name":"funeralTime","required":true,"className":null,"access":false,"maxlength":null,"minlength":null,"multiple":null,"values":null,"value":"4:39 PM"}, "funeralLocation": {"type":"text","subtype":"text","label":"Funeral Location","name":"funeralLocation","required":false,"className":"form-control","access":false,"maxlength":1000,"minlength":null,"multiple":null,"values":null,"value":"north colia"}, "funeralLinkOptional": {"type":"text","subtype":"text","label":"funeral Link (Optional)","name":"funeralLinkOptional","required":false,"className":"form-control","access":false,"maxlength":1000,"minlength":null,"multiple":null,"values":null,"value":null}, "funerallimitedtoFamily": {"type":"checkbox-group","subtype":null,"label":"Funeral Limited to Family","name":"funerallimitedtoFamily","required":false,"className":null,"access":false,"maxlength":null,"minlength":null,"multiple":null,"values":[{"label":"true","value":"true","selected":false}],"value":null}, "contactInformation": {"type":"header","subtype":"h1","label":"Contact Information","name":"contactInformation","required":null,"className":null,"access":false,"maxlength":null,"minlength":null,"multiple":null,"values":null,"value":null}, "contactPersonName": {"type":"text","subtype":"text","label":"Contact Person Name","name":"contactPersonName","required":false,"className":"form-control","access":false,"maxlength":100,"minlength":null,"multiple":null,"values":null,"value":"keshav"}, "phone": {"type":"text","subtype":"tel","label":"Phone","name":"phone","required":true,"className":"form-control","access":false,"maxlength":11,"minlength":null,"multiple":null,"values":null,"value":"55665566666"}, "contactemail": {"type":"text","subtype":"email","label":"Contact Person Email","name":"contactemail","required":true,"className":"form-control","access":false,"maxlength":null,"minlength":null,"multiple":null,"values":null,"value":"ffff@GMAIL.COM"}, "submissionDetails": {"type":"header","subtype":"h1","label":"Submission Details","name":"submissionDetails","required":null,"className":null,"access":false,"maxlength":null,"minlength":null,"multiple":null,"values":null,"value":null}, "salutation": {"type":"select","subtype":null,"label":"Salutation","name":"salutation","required":true,"className":"form-control","access":false,"maxlength":null,"minlength":null,"multiple":false,"values":[{"label":"--Select--","value":"--select--","selected":true},{"label":"Jai Shree Krishna","value":"Jai Shree Krishna","selected":false},{"label":"Jai Sia Ram","value":"Jai Sia Ram","selected":false},{"label":"Jai Swaminarayan","value":"Jai Swaminarayan","selected":false},{"label":"Jai Jalaram","value":"Jai Jalaram","selected":false},{"label":"Jai Prabhu","value":"Jai Prabhu","selected":false}],"value":"Jai Shree Krishna"}, "submittedby": {"type":"text","subtype":"text","label":"Submitted by","name":"submittedby","required":true,"className":"form-control","access":false,"maxlength":1000,"minlength":null,"multiple":null,"values":null,"value":"shiva"}, "relationtoDeceasedperson": {"type":"text","subtype":"text","label":"Relation to Deceased Person","name":"relationtoDeceasedperson","required":true,"className":"form-control","access":false,"maxlength":1000,"minlength":null,"multiple":null,"values":null,"value":"brother"}, "submittedEmail": {"type":"text","subtype":"email","label":"Submitted Email","name":"submittedEmail","required":true,"className":"form-control","access":false,"maxlength":1000,"minlength":null,"multiple":null,"values":null,"value":"abc@gmail.com"}}',
      qrImage: '',
      deleteStatus: 0,
      createdAt: '2025-08-25T07:13:02.417',
      updatedAt: '2025-08-26T00:44:32.17',
    },
    {
      configurationId: 8456,
      moduleId: 53,
      keys: '["detailsOfDeceasedPerson","member","fullname","age","village","gender","city","state","dateDemise","dayofDemise","placeofDemise","personImage","specialcomments","survivedBy","spouse","fatherandmother","brotherandSisterinLaw","sonandDaughterinLaw","daughterandSoninLaw","grandChildren","greatGrandChildren","prayerInformation","prayerDate","prayerTime","prayerLocation","funeralInformation","funeralDate","funeralTime","funeralLocation","funeralLinkOptional","funerallimitedtoFamily","contactInformation","contactPersonName","phone","contactemail","submissionDetails","salutation","submittedby","relationtoDeceasedperson","submittedEmail"]',
      contentType: 'SAD DEMISES',
      content:
        '{"detailsOfDeceasedPerson": {"type":"header","subtype":"h1","label":"Details Of Deceased Person","name":"detailsOfDeceasedPerson","required":null,"className":null,"access":false,"maxlength":null,"minlength":null,"multiple":null,"values":null,"value":null}, "member": {"type":"select","subtype":null,"label":"Member","name":"member","required":true,"className":"form-control","access":true,"maxlength":null,"minlength":null,"multiple":false,"values":[{"value":8408,"label":"Jackson M Patel - jacksonpoll05@gmail.com","totalMembershipAmount":450.00,"selected":false},{"value":8409,"label":"Owner K Patel - slad3581@gmail.com","totalMembershipAmount":0.00,"selected":false},{"value":8410,"label":"Rony N Patel - Rony@gm.in","totalMembershipAmount":225.00,"selected":false}],"value":"Jackson M Patel - jacksonpoll05@gmail.com"}, "fullname": {"type":"text","subtype":"text","label":"Full Name","name":"fullname","required":true,"className":"form-control","access":false,"maxlength":250,"minlength":null,"multiple":null,"values":null,"value":"vaibhav"}, "age": {"type":"number","subtype":null,"label":"Age","name":"age","required":true,"className":"form-control","access":false,"maxlength":null,"minlength":null,"multiple":null,"values":null,"value":"22"}, "village": {"type":"text","subtype":"text","label":"Village","name":"village","required":true,"className":"form-control","access":false,"maxlength":250,"minlength":null,"multiple":null,"values":null,"value":"vghrech"}, "gender": {"type":"select","subtype":null,"label":"Gender","name":"gender","required":true,"className":"form-control","access":false,"maxlength":null,"minlength":null,"multiple":false,"values":[{"label":"--Select Gender--","value":"Gender","selected":true},{"label":"Male","value":"Male","selected":false},{"label":"Female","value":"Female","selected":false}],"value":"Male"}, "city": {"type":"text","subtype":"text","label":"City","name":"city","required":false,"className":"form-control","access":false,"maxlength":150,"minlength":null,"multiple":null,"values":null,"value":"bilimora"}, "state": {"type":"select","subtype":null,"label":"State","name":"state","required":true,"className":"form-control","access":false,"maxlength":null,"minlength":null,"multiple":false,"values":[{"label":"--Select State--","value":"0","selected":true},{"label":"NC","value":"NC","selected":false},{"label":"TX","value":"TX","selected":false}],"value":"NC"}, "dateDemise": {"type":"date","subtype":null,"label":"Date Of Demise","name":"dateDemise","required":true,"className":"form-control","access":false,"maxlength":null,"minlength":null,"multiple":null,"values":null,"value":"08\\/25\\/2025"}, "dayofDemise": {"type":"text","subtype":"text","label":"Day of Demise","name":"dayofDemise","required":true,"className":"form-control","access":false,"maxlength":100,"minlength":null,"multiple":null,"values":null,"value":"sunday"}, "placeofDemise": {"type":"text","subtype":"text","label":"Place of Demise","name":"placeofDemise","required":true,"className":"form-control","access":false,"maxlength":200,"minlength":null,"multiple":null,"values":null,"value":"nc"}, "personImage": {"type":"file","subtype":"file","label":"Person Image","name":"personImage","required":true,"className":"form-control","access":false,"maxlength":null,"minlength":null,"multiple":false,"values":null,"value":"[\\"content\\/content-250825040823610.jpg\\"]"}, "specialcomments": {"type":"textarea","subtype":"textarea","label":"Special Comments","name":"specialcomments","required":true,"className":"form-control","access":false,"maxlength":1000,"minlength":null,"multiple":null,"values":null,"value":"please come to the time."}, "survivedBy": {"type":"header","subtype":"h1","label":"Survived By","name":"survivedBy","required":null,"className":null,"access":false,"maxlength":null,"minlength":null,"multiple":null,"values":null,"value":null}, "spouse": {"type":"textarea","subtype":"textarea","label":"spouse","name":"spouse","required":false,"className":"form-control","access":false,"maxlength":1000,"minlength":null,"multiple":null,"values":null,"value":"spouse"}, "fatherandmother": {"type":"textarea","subtype":"textarea","label":"Father and Mother","name":"fatherandmother","required":true,"className":"form-control","access":false,"maxlength":1000,"minlength":null,"multiple":null,"values":null,"value":"father and mother"}, "brotherandSisterinLaw": {"type":"textarea","subtype":"textarea","label":"Brother and Sister-in-Law","name":"brotherandSisterinLaw","required":false,"className":"form-control","access":false,"maxlength":1000,"minlength":null,"multiple":null,"values":null,"value":"brother and sister-in-law"}, "sonandDaughterinLaw": {"type":"textarea","subtype":"textarea","label":"Son and Daughter-in-Law","name":"sonandDaughterinLaw","required":false,"className":"form-control","access":false,"maxlength":1000,"minlength":null,"multiple":null,"values":null,"value":"son and daughter-in-law"}, "daughterandSoninLaw": {"type":"textarea","subtype":"textarea","label":"Daughter and Son-in-law","name":"daughterandSoninLaw","required":false,"className":"form-control","access":false,"maxlength":1000,"minlength":null,"multiple":null,"values":null,"value":"daughter and son-in-law"}, "grandChildren": {"type":"textarea","subtype":"textarea","label":"Grand Children","name":"grandChildren","required":false,"className":"form-control","access":false,"maxlength":1000,"minlength":null,"multiple":null,"values":null,"value":"grand children"}, "greatGrandChildren": {"type":"textarea","subtype":"textarea","label":"Great Grand Children","name":"greatGrandChildren","required":false,"className":"form-control","access":false,"maxlength":1000,"minlength":null,"multiple":null,"values":null,"value":"great grand children"}, "prayerInformation": {"type":"header","subtype":"h1","label":"Prayer Information","name":"prayerInformation","required":null,"className":null,"access":false,"maxlength":null,"minlength":null,"multiple":null,"values":null,"value":null}, "prayerDate": {"type":"date","subtype":null,"label":"Prayer Date","name":"prayerDate","required":true,"className":"form-control","access":false,"maxlength":null,"minlength":null,"multiple":null,"values":null,"value":"08\\/25\\/2025"}, "prayerTime": {"type":"time","subtype":null,"label":"Prayer Time","name":"prayerTime","required":true,"className":null,"access":false,"maxlength":null,"minlength":null,"multiple":null,"values":null,"value":"4:39 PM"}, "prayerLocation": {"type":"text","subtype":"text","label":"Prayer Location","name":"prayerLocation","required":true,"className":"form-control","access":false,"maxlength":1000,"minlength":null,"multiple":null,"values":null,"value":"nc"}, "funeralInformation": {"type":"header","subtype":"h1","label":"Funeral Information","name":"funeralInformation","required":null,"className":null,"access":false,"maxlength":null,"minlength":null,"multiple":null,"values":null,"value":null}, "funeralDate": {"type":"date","subtype":null,"label":"Funeral Date","name":"funeralDate","required":true,"className":"form-control","access":false,"maxlength":null,"minlength":null,"multiple":null,"values":null,"value":"08\\/25\\/2025"}, "funeralTime": {"type":"time","subtype":null,"label":"Funeral Time","name":"funeralTime","required":true,"className":null,"access":false,"maxlength":null,"minlength":null,"multiple":null,"values":null,"value":"4:39 PM"}, "funeralLocation": {"type":"text","subtype":"text","label":"Funeral Location","name":"funeralLocation","required":false,"className":"form-control","access":false,"maxlength":1000,"minlength":null,"multiple":null,"values":null,"value":"north colia"}, "funeralLinkOptional": {"type":"text","subtype":"text","label":"funeral Link (Optional)","name":"funeralLinkOptional","required":false,"className":"form-control","access":false,"maxlength":1000,"minlength":null,"multiple":null,"values":null,"value":null}, "funerallimitedtoFamily": {"type":"checkbox-group","subtype":null,"label":"Funeral Limited to Family","name":"funerallimitedtoFamily","required":false,"className":null,"access":false,"maxlength":null,"minlength":null,"multiple":null,"values":[{"label":"true","value":"true","selected":false}],"value":null}, "contactInformation": {"type":"header","subtype":"h1","label":"Contact Information","name":"contactInformation","required":null,"className":null,"access":false,"maxlength":null,"minlength":null,"multiple":null,"values":null,"value":null}, "contactPersonName": {"type":"text","subtype":"text","label":"Contact Person Name","name":"contactPersonName","required":false,"className":"form-control","access":false,"maxlength":100,"minlength":null,"multiple":null,"values":null,"value":"keshav"}, "phone": {"type":"text","subtype":"tel","label":"Phone","name":"phone","required":true,"className":"form-control","access":false,"maxlength":11,"minlength":null,"multiple":null,"values":null,"value":"55665566666"}, "contactemail": {"type":"text","subtype":"email","label":"Contact Person Email","name":"contactemail","required":true,"className":"form-control","access":false,"maxlength":null,"minlength":null,"multiple":null,"values":null,"value":"ffff@GMAIL.COM"}, "submissionDetails": {"type":"header","subtype":"h1","label":"Submission Details","name":"submissionDetails","required":null,"className":null,"access":false,"maxlength":null,"minlength":null,"multiple":null,"values":null,"value":null}, "salutation": {"type":"select","subtype":null,"label":"Salutation","name":"salutation","required":true,"className":"form-control","access":false,"maxlength":null,"minlength":null,"multiple":false,"values":[{"label":"--Select--","value":"--select--","selected":true},{"label":"Jai Shree Krishna","value":"Jai Shree Krishna","selected":false},{"label":"Jai Sia Ram","value":"Jai Sia Ram","selected":false},{"label":"Jai Swaminarayan","value":"Jai Swaminarayan","selected":false},{"label":"Jai Jalaram","value":"Jai Jalaram","selected":false},{"label":"Jai Prabhu","value":"Jai Prabhu","selected":false}],"value":"Jai Shree Krishna"}, "submittedby": {"type":"text","subtype":"text","label":"Submitted by","name":"submittedby","required":true,"className":"form-control","access":false,"maxlength":1000,"minlength":null,"multiple":null,"values":null,"value":"shiva"}, "relationtoDeceasedperson": {"type":"text","subtype":"text","label":"Relation to Deceased Person","name":"relationtoDeceasedperson","required":true,"className":"form-control","access":false,"maxlength":1000,"minlength":null,"multiple":null,"values":null,"value":"brother"}, "submittedEmail": {"type":"text","subtype":"email","label":"Submitted Email","name":"submittedEmail","required":true,"className":"form-control","access":false,"maxlength":1000,"minlength":null,"multiple":null,"values":null,"value":"abc@gmail.com"}}',
      qrImage: '',
      deleteStatus: 0,
      createdAt: '2025-08-25T07:13:02.417',
      updatedAt: '2025-08-26T00:44:32.17',
    },
  ];

  const combinedLoading = networkLoading || isLoading || filterLoading;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.BACKGROUNDCOLOR,
      }}>
      <CustomHeader
        leftOnPress={() => {
          navigation.goBack();
        }}
        leftIcon={
          <FontAwesome6 name="angle-left" size={26} color={COLORS.LABELCOLOR} />
        }
        title={item?.name}
      />
      {combinedLoading ? (
        <Loader />
      ) : isConnected ? (
        <View
          style={{
            overflow: 'hidden',
            flex: 1,
          }}>
          <View style={{flex: 1}}>
            {(item?.constantName === 'HOTELS' ||
              item?.constantName === 'ENTERTAINMENT' ||
              item?.constantName === 'EXPENSE') && (
              <TouchableOpacity
                activeOpacity={0.35}
                onPress={() => setIsEventDataModal(true)}
                style={styles.filterContainer}>
                <Text
                  numberOfLines={2}
                  style={{
                    fontSize: FONTS.FONTSIZE.SMALL,
                    fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                    color: COLORS.PRIMARYWHITE,
                    maxWidth: width / 1.2,
                  }}>
                  {selectedEvent?.name || 'Events'}
                </Text>
                <AntDesign name="down" size={18} color={COLORS.PRIMARYWHITE} />
              </TouchableOpacity>
            )}
            <View>
              {tabValues?.length > 0 &&
                selectedTab &&
                item?.constantName === 'FOOD TEAM' &&
                renderTabs()}
            </View>
            {data.length > 0 ? (
              item?.constantName === 'HOTELS' ? (
                <Hotels data={data} />
              ) : item?.constantName === 'ENTERTAINMENT' ? (
                <Entertainment data={data} />
              ) : item?.constantName === 'NEWS' ? (
                <NewsView data={data} />
              ) : item?.constantName === 'SAD DEMISES' ? (
                <SadDemises data={data} />
              ) : item?.constantName === 'DONATION' ? (
                <DonationView
                  data={data}
                  pageNumber={pageNumber}
                  PAGE_SIZE={PAGE_SIZE}
                />
              ) : item?.constantName == 'EXPENSE' ? (
                <CustomTable data={data} />
              ) : item?.constantName == 'FOOD TEAM' ? (
                <CustomTable
                  data={data}
                  isTabbing={item?.constantName === 'FOOD TEAM'}
                />
              ) : item?.layout === '1' ? (
                <DetailsLayout data={data} />
              ) : item?.layout === '2' ? (
                <ListLayout data={data} />
              ) : item?.layout === '3' ? (
                <SingleCollapse
                  data={data}
                  isMultiCollapse={false}
                  pageNumber={pageNumber}
                  PAGE_SIZE={PAGE_SIZE}
                />
              ) : item?.layout === '4' ? (
                <SingleCollapse
                  data={data}
                  isMultiCollapse={true}
                  pageNumber={pageNumber}
                  PAGE_SIZE={PAGE_SIZE}
                />
              ) : item?.layout === '5' ? (
                <CustomTable data={data} />
              ) : item?.layout === '6' ? (
                <ProfileLayout data={data} />
              ) : item?.layout === '7' ? (
                <OrderView
                  data={data}
                  pageNumber={pageNumber}
                  PAGE_SIZE={PAGE_SIZE}
                />
              ) : null
            ) : (
              <NoDataFound />
            )}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: heightPercentageToDP('1%'),
                paddingHorizontal: widthPercentageToDP('5%'),
                gap: 30,
              }}>
              {pageNumber > 1 && (
                <TouchableOpacity
                  onPress={() =>
                    setPageNumber(prevPage => Math.max(prevPage - 1, 1))
                  }
                  style={{}}>
                  <Text style={styles.paginationText}>Previous</Text>
                </TouchableOpacity>
              )}
              {hasMore && (
                <TouchableOpacity onPress={loadMore} style={{}}>
                  <Text style={styles.paginationText}>Load More</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <Modal
            animationType="none"
            transparent={true}
            visible={isEventDataModal}
            onRequestClose={() => setIsEventDataModal(false)}
            style={{flex: 1}}>
            <View style={styles.eventModalContainer}>
              <TouchableWithoutFeedback
                onPress={() => setIsEventDataModal(false)}>
                <View style={styles.backdrop} />
              </TouchableWithoutFeedback>

              <View style={styles.eventModalContent}>
                <FlatList
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={30}
                  updateCellsBatchingPeriod={200}
                  windowSize={40}
                  initialNumToRender={10}
                  data={eventData}
                  keyExtractor={item => item.id.toString()}
                  contentContainerStyle={{flexGrow: 1}}
                  renderItem={({item: item1}) => (
                    <TouchableOpacity
                      style={{
                        borderBottomWidth: 0.5,
                        borderBottomColor: COLORS.LIGHTGREY,
                        padding: 10,
                      }}
                      onPress={() => {
                        setSelectedEvent(item1);
                        setIsEventDataModal(false);
                      }}>
                      <Text
                        style={{
                          color: COLORS.TABLEROW,
                          fontSize: FONTS.FONTSIZE.EXTRASMALL,
                          fontFamily: FONTS.FONT_FAMILY.REGULAR,
                        }}>
                        {item1?.name}
                      </Text>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <View style={{flex: 1, height: 40}}>
                      <NoDataFound />
                    </View>
                  }
                />
              </View>
            </View>
          </Modal>
        </View>
      ) : (
        <Offline />
      )}
    </View>
  );
};

export default ViewScreen;
