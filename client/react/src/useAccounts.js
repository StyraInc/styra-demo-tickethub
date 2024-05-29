import { useEffect, useMemo, useState } from "react";

export default function useAccounts() {
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
        // pick first
        const [account] = accounts;
        const [user, tenant] = account.split(" / ");
        console.log({ setCurrent: { user, tenant, account } });
        setCurrent({ user, tenant, account });
      });
  }, []);

  return useMemo(() => {
    return {
      current,
      accounts,
      handleSetAccount: (account) => {
        console.log("handleSetAccount");
        setCurrent({ account });
      },
    };
  }, [current, accounts]);
}
