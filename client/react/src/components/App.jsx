import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Nav from "./Nav";
import { useAuthn } from "../AuthnContext";
import { AuthzProvider } from "@styra/opa-react";
import { OPAClient } from "@styra/opa";

import { Types } from "../types";
import "../style.css";

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

const batch = false;

export default function App() {
  const { user, tenant } = useAuthn();
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
  const location = useLocation();
  const [, type] =
    Object.entries(paths).find(([path]) =>
      location.pathname.startsWith(path),
    ) ?? [];

  useEffect(() => {
    document.title = `${titles[type]} - ${tenant}`;
  }, [type, tenant]);

  return (
    <AuthzProvider
      opaClient={opaClient}
      defaultPath="tickets"
      defaultInput={{ user, tenant }}
      batch={batch}
    >
      <Nav type={type} />
      <Outlet />
    </AuthzProvider>
  );
}

async function getUserData(user, tenant) {
  const href = window.location.toString();
  // TODO(sr): better way?!
  const u = new URL(href);
  u.pathname = "opa";
  u.search = "";
  const sdk = new OPAClient(u.toString(), {
    headers: {
      Authorization: `Bearer ${tenant} / ${user}`,
    },
  });

  return sdk.evaluate("userdata", { user, tenant });
}
