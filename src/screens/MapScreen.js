// import React, {useEffect, useState} from 'react';
// import {
//   View,
//   TextInput,
//   FlatList,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   ActivityIndicator,
//   Dimensions,
// } from 'react-native';
// import axios from 'axios';
// import * as MapLibreRN from '@maplibre/maplibre-react-native';
// import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
// import {AntDesign} from '@react-native-vector-icons/ant-design';
// import {Feather} from '@react-native-vector-icons/feather';
// import COLORS from '../theme/Color';
// import FONTS from '../theme/Fonts';
// import CustomHeader from '../components/root/CustomHeader';
// import {useNavigation} from '@react-navigation/native';
// import NetInfo from '@react-native-community/netinfo';
// import Offline from '../components/root/Offline';
// import ButtonComponent from '../components/root/ButtonComponent';

// const windowWidth = Dimensions.get('window').width;

// const MapScreen = ({route}) => {
//   const {onLocationSelect, onLabelSelect, currentLocation} = route.params;

//   const navigation = useNavigation();
//   const [searchQuery, setSearchQuery] = useState('');
//   const [results, setResults] = useState([]);
//   const [selectedLocation, setSelectedLocation] = useState([]);
//   const [label, setLabel] = useState('');

//   const [searchLoading, setSearchLoading] = useState(false);
//   const [isOnline, setIsOnline] = useState(true);

  // const apiKeys = [
  //   '634fc5372c154780b0856a1cd18932ff',
  //   '217b31c8acb045d9a31d3319ea9f4875',
  //   'c6b353e96f9a456796f8004d6c600234',
  //   'e80a242e57d24c4eaf30ea8f448d194a',
  //   'ceafee16de904b7da61cec2fa0be9d3f',
  //   'e5414f3130ab4dba85381256091884ae',
  //   'ac227cc474944266b2fffea1c371128c',
  //   '26d64443025a4162826c67c6df59d97d',
  //   '02d5fe32ddf94e1da7d85d3b98cf3237',
  //   'f80d9dc7b2804c05ba1b891d90610b48',
  //   '7e66e73054da43ce87a279e184110edf',
  //   '66ad375eb7514b32835d8c91fe295419',
  //   '6b28bda8af634d2a92d2b843b1691c8a',
  // ];

//   const [currentApiKeyIndex, setCurrentApiKeyIndex] = useState(0);

//   useEffect(() => {
//     const unsubscribe = NetInfo.addEventListener(state => {
//       setIsOnline(state.isConnected);
//     });

//     return () => unsubscribe();
//   }, []);

//   const fetchResults = async key => {
//     const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${searchQuery}&format=json&apiKey=${key}`;

//     try {
//       const response = await axios.get(url);
//       if (response.data && response.data.results) {
//         setResults(response.data.results);
//       } else if (response?.status === 401) {
//         if (currentApiKeyIndex < apiKeys.length - 1) {
//           setCurrentApiKeyIndex(currentApiKeyIndex + 1);
//           await fetchResults(apiKeys[currentApiKeyIndex]);
//         } else {
//         }
//       } else {
//         setResults([]);
//       }
//     } catch (error) {
//       if (error.response && error.response.status === 401) {
//         if (currentApiKeyIndex < apiKeys.length - 1) {
//           setCurrentApiKeyIndex(currentApiKeyIndex + 1);
//           await fetchResults(apiKeys[currentApiKeyIndex]);
//         } else {
//           setResults([]);
//         }
//       } else {
//         setResults([]);
//       }
//     }
//   };

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       if (searchQuery.length > 0) {
//         setSearchLoading(true);
//         fetchResults(apiKeys[currentApiKeyIndex]);
//       } else {
//         setResults([]);
//       }
//     }, 1000);

//     return () => {
//       clearTimeout(timer);
//     };
//   }, [searchQuery, currentApiKeyIndex]);

//   const handleSelectLocation = location => {
//     const {formatted} = location;
//     const latitude = location?.lat;
//     const longitude = location?.lon;
//     setSelectedLocation([latitude, longitude]);
//     setResults([]);
//     setSearchQuery('');
//     setLabel(formatted);
//     onLabelSelect(formatted);
//   };

//   const clearSearch = () => {
//     setSearchQuery('');
//     setResults([]);
//   };

//   useEffect(() => {
//     if (results.length > 0 || searchQuery.length === 0) {
//       const timer = setTimeout(() => {
//         setSearchLoading(false);
//       }, 1000);

//       return () => clearTimeout(timer);
//     }
//   }, [results, searchQuery]);

//   const styleUrl = `https://maps.geoapify.com/v1/styles/osm-bright/style.json?apiKey=${apiKeys[currentApiKeyIndex]}`;

//   const requestPermissions = async () => {
//     const granted = await MapLibreRN.requestAndroidLocationPermissions();
//     if (!granted) {
//       return;
//     }
//   };

//   useEffect(() => {
//     requestPermissions();
//   }, []);

//   useEffect(() => {
//     if (currentLocation) {
//       // Perform geocoding to get coordinates from currentLocation string
//       const fetchInitialLocationCoordinates = async () => {
//         const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
//           currentLocation,
//         )}&format=json&apiKey=${apiKeys[currentApiKeyIndex]}`;

//         try {
//           const response = await axios.get(url);
//           if (
//             response.data &&
//             response.data.results &&
//             response.data.results.length > 0
//           ) {
//             const firstResult = response.data.results[0];
//             setSelectedLocation([firstResult.lat, firstResult.lon]);
//             setLabel(firstResult.formatted || currentLocation);
//           }
//         } catch (error) {
//           // Handle error silently or show message
//         }
//       };

//       fetchInitialLocationCoordinates();
//     }
//   }, [currentLocation, currentApiKeyIndex]);

//   return (
//     <View
//       style={{
//         flex: 1,
//         backgroundColor: COLORS.BACKGROUNDCOLOR,
//       }}>
//       <CustomHeader
//         leftOnPress={() => {
//           navigation.goBack();
//         }}
//         leftIcon={
//           <FontAwesome6
//             iconStyle="solid"
//             name="angle-left"
//             size={26}
//             color={COLORS.LABELCOLOR}
//           />
//         }
//         title={'Map'}
//       />
//       {isOnline ? (
//         <>
//           <View style={{margin: 10, flex: 1}}>
//             <View
//               style={{
//                 backgroundColor: COLORS.PRIMARYWHITE,
//                 borderWidth: 1,
//                 borderRadius: 10,
//                 flexDirection: 'row',
//                 justifyContent: 'space-between',
//                 alignItems: 'center',
//                 borderColor: COLORS.TABLEBORDER,
//                 paddingHorizontal: 4,
//                 height: 36,
//               }}>
//               <View
//                 style={{
//                   flexDirection: 'row',
//                   alignItems: 'center',
//                   gap: 2,
//                 }}>
//                 {searchLoading ? (
//                   <ActivityIndicator size="small" color={COLORS.TITLECOLOR} />
//                 ) : (
//                   <Feather
//                     name="search"
//                     size={22}
//                     style={{marginLeft: 8}}
//                     color={COLORS.PRIMARYBLACK}
//                   />
//                 )}
//                 <TextInput
//                   value={searchQuery}
//                   onChangeText={text => {
//                     setSearchQuery(text);
//                   }}
//                   placeholder="Search Your City"
//                   placeholderTextColor={COLORS.PLACEHOLDERCOLOR}
//                   style={{
//                     fontSize: FONTS.FONTSIZE.SMALL,
//                     fontFamily: FONTS.FONT_FAMILY.LIGHT,
//                     width: windowWidth / 1.3,
//                     color: COLORS.PRIMARYBLACK,
//                     paddingVertical: 0,
//                   }}
//                 />
//               </View>
//               <TouchableOpacity onPress={clearSearch} style={{marginRight: 4}}>
//                 <AntDesign name="close" size={22} color={COLORS.PRIMARYBLACK} />
//               </TouchableOpacity>
//             </View>
//             {results.length > 0 && (
//               <FlatList
//                 removeClippedSubviews={true}
//                 maxToRenderPerBatch={30}
//                 updateCellsBatchingPeriod={200}
//                 windowSize={40}
//                 initialNumToRender={10}
//                 data={results}
//                 keyExtractor={(item, index) => index.toString()}
//                 renderItem={({item}) => {
//                   return (
//                     <Text
//                       onPress={() => handleSelectLocation(item)}
//                       style={styles.resultItem}>
//                       {item?.formatted}
//                     </Text>
//                   );
//                 }}
//                 style={styles.resultsList}
//               />
//             )}
//             {selectedLocation.length ? (
//               <View
//                 style={{
//                   flex: 1,
//                   borderRadius: 10,
//                   overflow: 'hidden',
//                   marginTop: 10,
//                   borderWidth: 1,
//                   borderColor: COLORS.PRIMARYWHITE,
//                 }}>
//                 <MapLibreRN.MapView style={styles.map} mapStyle={styleUrl}>
//                   <MapLibreRN.Camera
//                     centerCoordinate={[
//                       selectedLocation[1],
//                       selectedLocation[0],
//                     ]}
//                     zoomLevel={10}
//                     pitch={50}
//                   />
//                   <MapLibreRN.MarkerView
//                     coordinate={[selectedLocation[1], selectedLocation[0]]}>
//                     <MapLibreRN.Callout style={{alignItems: 'center'}}>
//                       <FontAwesome6
//                         iconStyle="solid"
//                         name="location-dot"
//                         size={24}
//                         color={COLORS.red700}
//                       />
//                       <Text
//                         numberOfLines={2}
//                         style={{
//                           fontSize: FONTS.FONTSIZE.MEDIUM,
//                           fontFamily: FONTS.FONT_FAMILY.MEDIUM,
//                           color: COLORS.TITLECOLOR,
//                           textAlign: 'center',
//                         }}>
//                         {label}
//                       </Text>
//                     </MapLibreRN.Callout>
//                   </MapLibreRN.MarkerView>
//                 </MapLibreRN.MapView>
//               </View>
//             ) : (
//               <View
//                 style={{
//                   flex: 1,
//                   borderRadius: 10,
//                   overflow: 'hidden',
//                   marginTop: 10,
//                   borderWidth: 1,
//                   borderColor: COLORS.PRIMARYWHITE,
//                 }}>
//                 <MapLibreRN.MapView style={styles.map} mapStyle={styleUrl}>
//                   <MapLibreRN.Camera
//                     centerCoordinate={[72.9824, 20.7702]}
//                     zoomLevel={5}
//                     pitch={50}
//                   />
//                 </MapLibreRN.MapView>
//               </View>
//             )}
//           </View>

//           {selectedLocation?.length > 0 && (
//             <View style={{alignItems: 'center'}}>
//               <ButtonComponent
//                 title={'Save'}
//                 width={'80%'}
//                 onPress={() => {
//                   if (selectedLocation?.length) {
//                     onLocationSelect(selectedLocation);
//                     navigation.goBack();
//                   }
//                 }}
//               />
//             </View>
//           )}
//         </>
//       ) : (
//         <Offline />
//       )}
//     </View>
//   );
// };
// const styles = StyleSheet.create({
//   resultItem: {
//     padding: 10,
//     borderBottomWidth: 1,
//     backgroundColor: COLORS.PRIMARYWHITE,
//     borderBottomColor: COLORS.primary,
//     marginBottom: 5,
//     fontFamily: FONTS.FONT_FAMILY.REGULAR,
//     fontSize: FONTS.FONTSIZE.SMALL,
//     color: COLORS.PRIMARYBLACK,
//   },
//   resultsList: {
//     position: 'absolute',
//     top: 52,
//     zIndex: 1,
//     backgroundColor: COLORS.PRIMARYWHITE,
//     maxHeight: 200,
//     elevation: 4,
//     shadowColor: COLORS.PRIMARYBLACK,
//     shadowOffset: {height: 2, width: 0},
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//     width: '95%',
//     alignSelf: 'center',
//   },
//   map: {
//     flex: 1,
//   },
// });

// export default MapScreen;



import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import axios from 'axios';
import * as MapLibreRN from '@maplibre/maplibre-react-native';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import COLORS from '../theme/Color';
import FONTS from '../theme/Fonts';
import CustomHeader from '../components/root/CustomHeader';
import {useNavigation} from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import Offline from '../components/root/Offline';
import ButtonComponent from '../components/root/ButtonComponent';

const windowWidth = Dimensions.get('window').width;

const MapScreen = ({route}) => {
  const {onLocationSelect, onLabelSelect, currentLocation} = route.params;

  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null); // Changed to null initially
  const [label, setLabel] = useState('');
  const [mapKey, setMapKey] = useState(0); // Force map re-render on iOS

  const [searchLoading, setSearchLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  
  const cameraRef = useRef(null); // Add camera ref

  const apiKeys = [
    '634fc5372c154780b0856a1cd18932ff',
    '217b31c8acb045d9a31d3319ea9f4875',
    'c6b353e96f9a456796f8004d6c600234',
    'e80a242e57d24c4eaf30ea8f448d194a',
    'ceafee16de904b7da61cec2fa0be9d3f',
    'e5414f3130ab4dba85381256091884ae',
    'ac227cc474944266b2fffea1c371128c',
    '26d64443025a4162826c67c6df59d97d',
    '02d5fe32ddf94e1da7d85d3b98cf3237',
    'f80d9dc7b2804c05ba1b891d90610b48',
    '7e66e73054da43ce87a279e184110edf',
    '66ad375eb7514b32835d8c91fe295419',
    '6b28bda8af634d2a92d2b843b1691c8a',
  ];

  const [currentApiKeyIndex, setCurrentApiKeyIndex] = useState(0);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  const fetchResults = async key => {
    const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${searchQuery}&format=json&apiKey=${key}`;

    try {
      const response = await axios.get(url);
      if (response.data && response.data.results) {
        setResults(response.data.results);
      } else if (response?.status === 401) {
        if (currentApiKeyIndex < apiKeys.length - 1) {
          setCurrentApiKeyIndex(currentApiKeyIndex + 1);
          await fetchResults(apiKeys[currentApiKeyIndex]);
        }
      } else {
        setResults([]);
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        if (currentApiKeyIndex < apiKeys.length - 1) {
          setCurrentApiKeyIndex(currentApiKeyIndex + 1);
          await fetchResults(apiKeys[currentApiKeyIndex]);
        } else {
          setResults([]);
        }
      } else {
        setResults([]);
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length > 0) {
        setSearchLoading(true);
        fetchResults(apiKeys[currentApiKeyIndex]);
      } else {
        setResults([]);
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery, currentApiKeyIndex]);

  const handleSelectLocation = location => {
    const {formatted} = location;
    const latitude = location?.lat;
    const longitude = location?.lon;
    
    // Update state with proper structure
    const newLocation = {
      latitude,
      longitude,
      coordinates: [longitude, latitude], // [lng, lat] for MapLibre
    };
    
    setSelectedLocation(newLocation);
    setLabel(formatted);
    onLabelSelect(formatted);
    setResults([]);
    setSearchQuery('');
    
    // Force re-render on iOS
    if (Platform.OS === 'ios') {
      setMapKey(prev => prev + 1);
    }

    // Update camera after state is set
    setTimeout(() => {
      if (cameraRef.current) {
        cameraRef.current.setCamera({
          centerCoordinate: [longitude, latitude],
          zoomLevel: 15,
          animationDuration: 1000,
        });
      }
    }, 100);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setResults([]);
  };

  useEffect(() => {
    if (results.length > 0 || searchQuery.length === 0) {
      const timer = setTimeout(() => {
        setSearchLoading(false);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [results, searchQuery]);

  const styleUrl = `https://maps.geoapify.com/v1/styles/osm-bright/style.json?apiKey=${apiKeys[currentApiKeyIndex]}`;

  const requestPermissions = async () => {
    const granted = await MapLibreRN.requestAndroidLocationPermissions();
    if (!granted) {
      return;
    }
  };

  useEffect(() => {
    requestPermissions();
  }, []);

  useEffect(() => {
    if (currentLocation) {
      const fetchInitialLocationCoordinates = async () => {
        const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
          currentLocation,
        )}&format=json&apiKey=${apiKeys[currentApiKeyIndex]}`;

        try {
          const response = await axios.get(url);
          if (
            response.data &&
            response.data.results &&
            response.data.results.length > 0
          ) {
            const firstResult = response.data.results[0];
            const newLocation = {
              latitude: firstResult.lat,
              longitude: firstResult.lon,
              coordinates: [firstResult.lon, firstResult.lat],
            };
            setSelectedLocation(newLocation);
            setLabel(firstResult.formatted || currentLocation);
            
            if (Platform.OS === 'ios') {
              setMapKey(prev => prev + 1);
            }
          }
        } catch (error) {
          console.log('Error fetching initial location:', error);
        }
      };

      fetchInitialLocationCoordinates();
    }
  }, [currentLocation, currentApiKeyIndex]);

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
        title={'Map'}
      />
      {isOnline ? (
        <>
          <View style={{margin: 10, flex: 1}}>
            <View
              style={{
                backgroundColor: COLORS.PRIMARYWHITE,
                borderWidth: 1,
                borderRadius: 10,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderColor: '#D2F4FA',
                paddingHorizontal: 4,
                height: 36,
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 2,
                }}>
                {searchLoading ? (
                  <ActivityIndicator size="small" color={COLORS.TITLECOLOR} />
                ) : (
                  <Feather
                    name="search"
                    size={22}
                    style={{marginLeft: 8}}
                    color={COLORS.PRIMARYBLACK}
                  />
                )}
                <TextInput
                  value={searchQuery}
                  onChangeText={text => {
                    setSearchQuery(text);
                  }}
                  placeholder="Search Your City"
                  placeholderTextColor={COLORS.PLACEHOLDERCOLOR}
                  style={{
                    fontSize: FONTS.FONTSIZE.SMALL,
                    fontFamily: FONTS.FONT_FAMILY.LIGHT,
                    width: windowWidth / 1.3,
                    color: COLORS.PRIMARYBLACK,
                    paddingVertical: 0,
                  }}
                />
              </View>
              <TouchableOpacity onPress={clearSearch} style={{marginRight: 4}}>
                <AntDesign name="close" size={22} color={COLORS.PRIMARYBLACK} />
              </TouchableOpacity>
            </View>
            {results.length > 0 && (
              <FlatList
                removeClippedSubviews={true}
                maxToRenderPerBatch={30}
                updateCellsBatchingPeriod={200}
                windowSize={40}
                initialNumToRender={10}
                data={results}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({item}) => {
                  return (
                    <Text
                      onPress={() => handleSelectLocation(item)}
                      style={styles.resultItem}>
                      {item?.formatted}
                    </Text>
                  );
                }}
                style={styles.resultsList}
              />
            )}
            
            {/* Map Container */}
            <View
              style={{
                flex: 1,
                borderRadius: 10,
                overflow: 'hidden',
                marginTop: 10,
                borderWidth: 1,
                borderColor: COLORS.PRIMARYWHITE,
              }}>
              <MapLibreRN.MapView 
                key={mapKey} // Force re-render on iOS
                style={styles.map} 
                mapStyle={styleUrl}
              >
                <MapLibreRN.Camera
                  ref={cameraRef}
                  centerCoordinate={
                    selectedLocation
                      ? selectedLocation.coordinates
                      : [72.9824, 20.7702]
                  }
                  zoomLevel={selectedLocation ? 15 : 5}
                  pitch={50}
                  animationMode="flyTo"
                  animationDuration={1000}
                />
                
                {selectedLocation && (
                  <MapLibreRN.MarkerView
                    key={`marker-${selectedLocation.latitude}-${selectedLocation.longitude}`}
                    id="selected-marker"
                    coordinate={selectedLocation.coordinates}
                  >
                    <View style={{alignItems: 'center'}}>
                      <FontAwesome6
                        name="location-dot"
                        size={32}
                        color={COLORS.red700}
                      />
                      <MapLibreRN.Callout 
                        title={label}
                        style={{
                          backgroundColor: COLORS.PRIMARYWHITE,
                          padding: 8,
                          borderRadius: 8,
                          maxWidth: 200,
                        }}
                      >
                        <Text
                          numberOfLines={2}
                          style={{
                            fontSize: FONTS.FONTSIZE.SMALL,
                            fontFamily: FONTS.FONT_FAMILY.MEDIUM,
                            color: COLORS.TITLECOLOR,
                            textAlign: 'center',
                          }}>
                          {label}
                        </Text>
                      </MapLibreRN.Callout>
                    </View>
                  </MapLibreRN.MarkerView>
                )}
              </MapLibreRN.MapView>
            </View>
          </View>

          {selectedLocation && (
            <View style={{alignItems: 'center', paddingBottom: 10}}>
              <ButtonComponent
                title={'Save'}
                width={'80%'}
                onPress={() => {
                  if (selectedLocation) {
                    onLocationSelect([
                      selectedLocation.latitude,
                      selectedLocation.longitude,
                    ]);
                    navigation.goBack();
                  }
                }}
              />
            </View>
          )}
        </>
      ) : (
        <Offline />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  resultItem: {
    padding: 10,
    borderBottomWidth: 1,
    backgroundColor: COLORS.PRIMARYWHITE,
    borderBottomColor: COLORS.primary,
    marginBottom: 5,
    fontFamily: FONTS.FONT_FAMILY.REGULAR,
    fontSize: FONTS.FONTSIZE.SMALL,
    color: COLORS.PRIMARYBLACK,
  },
  resultsList: {
    position: 'absolute',
    top: 52,
    zIndex: 1,
    backgroundColor: COLORS.PRIMARYWHITE,
    maxHeight: 200,
    elevation: 4,
    shadowColor: COLORS.PRIMARYBLACK,
    shadowOffset: {height: 2, width: 0},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    width: '95%',
    alignSelf: 'center',
  },
  map: {
    flex: 1,
  },
});

export default MapScreen;
