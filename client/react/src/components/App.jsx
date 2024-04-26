import React from "react";
import Nav from "./Nav";

import { Types } from "../types";

import NewTicket from "./NewTicket";
import Ticket from "./Ticket";
import Tickets from "./Tickets";

import useAccounts from "../useAccounts";

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

const components = {
  [Types.NEW_TICKET]: NewTicket,
  [Types.TICKET]: Ticket,
  [Types.TICKETS]: Tickets,
};

export default function App() {
  const { current } = useAccounts();
  const [, type] =
    Object.entries(paths).find(([path]) =>
      location.pathname.startsWith(path),
    ) ?? [];

  const ticketId =
    type === Types.TICKET ? location.pathname.split("/").at(-1) : undefined;
  const Component = components[type];

  React.useEffect(() => {
    document.title = `${titles[type]} - ${current?.tenant}`;
  }, [type, current]);

  return (
    <div>
      <Nav type={type} ticketId={ticketId} />
      {current && <Component ticketId={ticketId} />}
    </div>
  );
}
