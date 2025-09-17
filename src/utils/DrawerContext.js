import {createContext, useState} from 'react';

export const DrawerContext = createContext(null);

export const DrawerProvider = ({children}) => {
  const [drawerData, setDrawerData] = useState([]);

  return (
    <DrawerContext.Provider value={{drawerData, setDrawerData}}>
      {children}
    </DrawerContext.Provider>
  );
};
