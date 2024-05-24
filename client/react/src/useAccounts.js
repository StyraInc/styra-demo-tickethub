import { useEffect, useMemo, useState } from "react";

export default function useAccounts() {
  const [current, setCurrent] = useState(getAccountFromCookie());
  const [accounts, setAccounts] = useState();

  useEffect(() => {
    fetch("/accounts.json")
      .then((res) => res.json())
      .then(({ accounts }) => {
        setAccounts(
          accounts.reduce((acc, account) => {
            const { tenant, user: name } = getTenantUser(account);
            acc[tenant] ??= [];
            acc[tenant].push({ account, name });
            return acc;
          }, {}),
        );
      });
  }, []);

  useEffect(() => {
    if (!accounts || current) {
      return;
    }

    // pick first
    const [tenant] = Object.values(accounts);
    const [user] = tenant;

    setAccountCookie(user.account);
    setCurrent(getTenantUser(user.account));
  }, [accounts, current]);

  return useMemo(() => {
    return {
      current,
      accounts,
      handleSetAccount: (account) => {
        setAccountCookie(account);
        setCurrent({ account });
      },
    };
  }, [current, accounts]);
}

function getAccountFromCookie() {
  let current;
  document.cookie.split("; ").forEach((cookie) => {
    const [cookieName, cookieAccount] = cookie.split("=");
    if (cookieName === "user") {
      current = getTenantUser(cookieAccount);
    }
  });
  return current;
}

function setAccountCookie(account) {
  document.cookie = `user=${account}; Path=/; SameSite=Lax`;
}

function getTenantUser(account) {
  const [tenant, user] = account.split(" / ");
  return { tenant, user, account };
}
