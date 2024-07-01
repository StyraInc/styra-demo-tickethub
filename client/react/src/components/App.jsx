import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Nav from "./Nav";
import { useAuthn } from "../AuthnContext";
import { AuthzProvider } from "@styra/opa-react";
import { WasmSDK } from "opa-wasm";
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

export default function App() {
  const [sdk, setSDK] = useState();
  const { user, tenant } = useAuthn();
  const location = useLocation();
  const [, type] =
    Object.entries(paths).find(([path]) =>
      location.pathname.startsWith(path),
    ) ?? [];

  useEffect(() => {
    document.title = `${titles[type]} - ${tenant}`;
  }, [type, tenant]);

  const wasm = process.env.REACT_APP_USE_WASM;

  useEffect(() => {
    if (wasm) {
      async function wasmInit() {
        const userData = await getUserData(user, tenant);
        const sdk0 = new WasmSDK(wasm);
        await sdk0.init();
        sdk0.setData(userData);
        setSDK(sdk0);
      }
      if (wasm) wasmInit();
    } else {
      // HTTP SDK
      const href = window.location.toString();
      const u = new URL(href); // TODO(sr): better way?!
      u.pathname = "opa";
      u.search = "";
      setSDK(
        new OPAClient(u.toString(), {
          headers: {
            Authorization: `Bearer ${tenant} / ${user}`,
          },
        }),
      );
    }
  }, [user, tenant]);
  return (
    <AuthzProvider sdk={sdk} path="tickets" defaultInput={{ user, tenant }}>
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
