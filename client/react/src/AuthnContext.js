import { useContext, useState, createContext } from "react";

const AuthnContext = createContext();

const AuthnProvider = ({ children }) => {
  const [user, setUser] = useState();
  const [tenant, setTenant] = useState();
  return (
    <AuthnContext.Provider value={{ user, tenant, setUser, setTenant }}>
      {children}
    </AuthnContext.Provider>
  );
};

export default AuthnProvider;

export const useAuthn = () => useContext(AuthnContext);
