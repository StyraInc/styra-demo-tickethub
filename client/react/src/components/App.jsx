import { useEffect, useState } from "react";
import { Outlet, useSearchParams } from "react-router-dom";
import Nav from "./Nav";
import { useAuthn } from "../AuthnContext";
import { AuthzProvider } from "@styra/opa-react";
import { OPAClient } from "@styra/opa";

import { Types } from "../types";
import "../style.css";
import UsersProvider from "../UsersContext";

const paths = {
  "/tickets/new": Types.NEW_TICKET,
  "/tickets": Types.TICKET,
  "/": Types.TICKETS,
};

const titles = {
  [Types.NEW_TICKET]: "New ticket",
  [Types.TICKET]: "Ticket",
  [Types.TICKETS]: "Tickets",
};

export default function App() {
  const [searchParams] = useSearchParams();
  const [batch] = useState(
    () => searchParams.get("batch") === "true",
    [searchParams],
  );

  const { user, tenant, setTenant, setUser } = useAuthn();
  const [accounts, setAccounts] = useState();
  const [opaClient] = useState(() => {
    const href = window.location.toString();
    const u = new URL(href); // TODO(sr): better way?!
    u.pathname = "opa";
    u.search = "";
    return new OPAClient(u.toString(), {
      headers: {
        Authorization: `Bearer ${tenant} / ${user}`,
      },
    });
  }, [user, tenant]);
  const [, type] =
    Object.entries(paths).find(([path]) =>
      location.pathname.startsWith(path),
    ) ?? [];

  useEffect(() => {
    document.title = `${titles[type]} - ${tenant}`;
  }, [type, tenant]);

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
          document.cookie = `user=${tenant0} / ${user0}; Path=/; SameSite=Lax`;
        }
      });
  }, [user, setUser, setTenant]);

  if (!user || !tenant) return <div>Loading</div>;

  return (
    <AuthzProvider
      opaClient={opaClient}
      defaultPath="tickets"
      defaultInput={{ user, tenant }}
      batch={batch}
      retry={3}
    >
      <UsersProvider users={accounts[tenant]}>
        <Nav type={type} accounts={accounts} />
        <Outlet />
      </UsersProvider>
    </AuthzProvider>
  );
}
