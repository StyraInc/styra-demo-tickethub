import { useContext, createContext } from "react";
const AuthnContext = createContext();
import useAccounts from "./useAccounts";

const AuthnProvider = ({ children }) => {
  const { current, accounts, handleSetAccount } = useAccounts();
  return (
    <AuthnContext.Provider value={{ current, accounts, handleSetAccount }}>
      {children}
    </AuthnContext.Provider>
  );
};

export default AuthnProvider;

export const useAuthn = () => useContext(AuthnContext);
