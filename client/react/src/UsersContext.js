import { useContext, useState, createContext } from "react";

const UsersContext = createContext();

const UsersProvider = ({ users: initial, children }) => {
  const [users, setUsers] = useState(initial);
  return (
    <UsersContext.Provider value={{ users, setUsers }}>
      {children}
    </UsersContext.Provider>
  );
};

export default UsersProvider;

export const useUsers = () => useContext(UsersContext);
