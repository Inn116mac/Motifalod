import {View} from 'react-native';
import {useEffect, useState} from 'react';
import NetInfo from '@react-native-community/netinfo';
import {NOTIFY_MESSAGE} from '../../constant/Module';
import COLORS from '../../theme/Color';
import Loader from '../../components/root/Loader';
import {useNavigation} from '@react-navigation/native';
import CustomTab from '../../components/root/CustomTab';
import CustomHeader from '../../components/root/CustomHeader';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import Offline from '../../components/root/Offline';
import httpClient from '../../connection/httpClient';
import {useNetworkStatus} from '../../connection/UseNetworkStatus';

const SignUpScreen = () => {
  const [moduleData, setModuleData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [response, setResponse] = useState(null);
  const {isConnected, networkLoading} = useNetworkStatus();
  const navigation = useNavigation();

  useEffect(() => {
    getSignUpForm();
  }, []);

  const getSignUpForm = () => {
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        httpClient
          .get(`module/get?name=SIGN%20UP&isMobile=true&isTabView=false`)
          .then(response => {
            const temp = JSON.parse(response?.data?.result?.configuration);
            const name = response?.data?.result?.constantName;
            const temp1 = response?.data?.result;

            if (response?.data?.status && temp?.length && temp1) {
              setResponse(temp1);
              setModuleData(temp);
              setName(name);
              setLoading(true);
            } else {
              setLoading(false);
              NOTIFY_MESSAGE(
                response?.data?.message
                  ? response?.data?.message
                  : 'Something Went Wrong',
              );
            }
          })
          .catch(err => {
            setLoading(false);
            NOTIFY_MESSAGE(err || err?.message ? 'Something Went Wrong' : null);

            navigation.goBack();
          });
      } else {
        NOTIFY_MESSAGE('Please check your internet connectivity');
      }
    });
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.BACKGROUNDCOLOR,
      }}>
      <CustomHeader
        title={'Sign Up'}
        leftIcon={
          <FontAwesome6 name="angle-left" size={26} color={COLORS.LABELCOLOR} />
        }
        leftOnPress={() => {
          navigation.goBack();
        }}
      />

      {isConnected ? (
        loading && moduleData.length > 0 && response ? (
          <>
            <CustomTab
              data={moduleData}
              name={name}
              response1={response}
              isSignUp={true}
            />
          </>
        ) : (
          <Loader />
        )
      ) : (
        <Offline />
      )}
    </View>
  );
};

export default SignUpScreen;
