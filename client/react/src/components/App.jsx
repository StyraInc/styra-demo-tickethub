import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Nav from "./Nav";

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

  return (
    <div>
      <Nav type={type} />
      <Outlet />
    </div>
  );
}
