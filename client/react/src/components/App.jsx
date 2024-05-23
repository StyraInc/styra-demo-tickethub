import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import Nav from "./Nav";

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

export default function App() {
  const auth = useAuth();

  switch (auth.activeNavigator) {
    case "signinSilent":
      return <div>Signing you in...</div>;
    case "signoutRedirect":
      return <div>Signing you out...</div>;
  }

  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  if (auth.error) {
    return <div>Oops... {auth.error.message}</div>;
  }

  if (auth.isAuthenticated) {
    console.log(auth.user?.profile);

    const location = useLocation();

    const [, type] =
      Object.entries(paths).find(([path]) =>
        location.pathname.startsWith(path),
      ) ?? [];

    // useEffect(() => {
    //   document.title = `${titles[type]} - ${current?.tenant}`;
    // }, [type, current]);

    return (
      <div>
        <Nav type={type} />
        <Outlet />
      </div>
    );
  }
  return <button onClick={() => void auth.signinRedirect()}>Log in</button>;
}
