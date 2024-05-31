import { useEffect, useMemo, useState } from "react";
import { useAuthn } from "./AuthnContext";

// useAccounts is only t here for fetching the accounts.json from the mock
// backend and providing it to Nav's Menu.
export default function useAccounts() {
  const { user, setTenant, setUser } = useAuthn();
  const [accounts, setAccounts] = useState();

  // This should only happen ONCE
  useEffect(() => {
    if (user) return;
    fetch("/accounts.json")
      .then((res) => res.json())
      .then(({ accounts }) => {
        const accs = accounts.reduce((acc, account) => {
          const [tenant, name] = account.split(" / ");
          acc[tenant] ??= [];
          acc[tenant].push({ account, name });
          return acc;
        }, {});
        setAccounts(accs);

        // if unset, pick first
        if (!user) {
          const [account] = accounts;
          const [tenant0, user0] = account.split(" / ");
          setUser(user0);
          setTenant(tenant0);
        }
      });
  }, [user]);

  return useMemo(() => {
    return {
      accounts,
    };
  }, [accounts]);
}
