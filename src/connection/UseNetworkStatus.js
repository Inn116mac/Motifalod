import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(false); 
  const [networkLoading, setNetworkLoading] = useState(true);

  useEffect(() => {
    const updateNetworkStatus = state => {
      setIsConnected(state.isConnected);
      setNetworkLoading(false); 
    };

    const fetchInitialNetworkState = async () => {
      const state = await NetInfo.fetch();
      updateNetworkStatus(state);
    };

    fetchInitialNetworkState();

    const unsubscribe = NetInfo.addEventListener(updateNetworkStatus);

    return () => {
      unsubscribe();
    };
  }, []);

  return { isConnected, networkLoading }; 
};