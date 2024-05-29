import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

export default function useAccounts() {
  const location = useLocation();
  const [current, setCurrent] = useState();
  const [accounts, setAccounts] = useState();

  useEffect(() => {
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

        // use query string or pick first
        const [account] = getUser(location) ?? accounts;
        const [tenant, user] = account.split(" / ");
        setCurrent({ user, tenant, account });
      });
  }, [location]);

  return useMemo(() => {
    return {
      current,
      accounts,
      handleSetAccount: (account) => {
        const [tenant, user] = account.split(" / ");
        setCurrent({ account, user, tenant });
      },
    };
  }, [current, accounts]);
}

function getUser(loc) {
  const u = new URLSearchParams(loc.search).get("user");
  return u ? [u] : undefined;
}
