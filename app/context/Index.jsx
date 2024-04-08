'use client';
import { createContext, useState } from "react";

const AppContext = createContext();

export function ActiveProvider({ children }) { // Include children here
  const [isActive, setIsActive] = useState(false);

  const changeIsActive = () => {
    setIsActive(!isActive);
  }

  return (
    <AppContext.Provider value={{
      isActive,
      changeIsActive,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export default AppContext;