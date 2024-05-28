import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Nav from "./Nav";
import AuthnProvider from "../AuthnContext";
import AuthzProvider from "opa-react";
import { OPAClient } from "@styra/opa";

import { Types } from "../types";
import "../style.css";

import useAccounts from "../useAccounts";

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
  const { current } = useAccounts();
  const location = useLocation();

  const [, type] =
    Object.entries(paths).find(([path]) =>
      location.pathname.startsWith(path),
    ) ?? [];

  useEffect(() => {
    document.title = `${titles[type]} - ${current?.tenant}`;
  }, [type, current]);

  const href = window.location.toString();
  // TODO(sr): better way?!
  const u = new URL(href);
  u.pathname = "";
  const sdk = new OPAClient(u.toString());
  return (
    <div>
      <AuthnProvider>
        <AuthzProvider sdk={sdk} path="tickets">
          <Nav type={type} />
          <Outlet />
        </AuthzProvider>
      </AuthnProvider>
    </div>
  );
}
