import { useEffect, useState } from "react";
import { Outlet, useNavigate, useSearchParams } from "react-router-dom";
import Nav from "./Nav";
import { useAuthn } from "../AuthnContext";
import { AuthzProvider } from "@styra/opa-react";
import { OPAClient } from "@styra/opa";

import { Types } from "../types";
import "../style.css";

const paths = {
  "/tickets/new": Types.NEW_TICKET,
  "/tickets": Types.TICKET,
  "/demo": Types.BATCH_DEMO,
  "/": Types.TICKETS,
};

const titles = {
  [Types.NEW_TICKET]: "New ticket",
  [Types.TICKET]: "Ticket",
  [Types.TICKETS]: "Tickets",
  [Types.BATCH_DEMO]: "Batch Demo Page",
};

export default function App() {
  let [searchParams] = useSearchParams();
  const [batch, setBatch] = useState(
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
  }, [user]);

  if (!user || !tenant) return <div>Loading</div>;

  return (
    <AuthzProvider
      opaClient={opaClient}
      defaultPath="tickets"
      defaultInput={{ user, tenant }}
      batch={batch}
      retry={3}
    >
      <Nav type={type} accounts={accounts} />
      <ToggleBatchingButton batch={batch} setBatch={setBatch} />
      <Outlet />
    </AuthzProvider>
  );
}

function ToggleBatchingButton({ batch, setBatch }) {
  const [_, setSearchParams] = useSearchParams();
  const handleChange = () => {
    setBatch(!batch);
    setSearchParams({ batch: !batch });
  };

  return (
    <button
      onClick={handleChange}
      className={`toggle-batching-button ${batch ? "on" : "off"}`}
    >
      {batch ? "disable" : "enable"} batching
    </button>
  );
}
