import React, { createContext, useContext, useState } from 'react';

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [currentUsername, setCurrentUsername] = useState(null);

  return (
    <UserContext.Provider value={{ currentUsername, setCurrentUsername }}>
      {children}
    </UserContext.Provider>
  );
};
