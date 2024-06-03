import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Nav from "./Nav";
import { useAuthn } from "../AuthnContext";
import AuthzProvider from "opa-react";
import { WasmSDK } from "opa-react";
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

  let sdk;
  async function wasmInit() {
    sdk = new WasmSDK(wasm);
    await sdk.init();
    sdk.setData({
      roles: {
        acmecorp: {
          alice: ["admin"],
          bob: ["reader"],
          ceasar: ["reader", "resolver"],
        },
        hooli: {
          dylan: ["admin"],
        },
      },
    });
  }
  if (wasm) wasmInit();
  // TODO(sr): Fix Wasm vs API selection here
  // useEffect(() => {
  //   async function wasmInit() {
  //     sdk = new WasmSDK(wasm);
  //     await sdk.init();
  //   }
  //   if (wasm) {
  //     wasmInit();
  //   } else {
  //     const href = window.location.toString();
  //     // TODO(sr): better way?!
  //     const u = new URL(href);
  //     u.pathname = "opa";
  //     u.search = "";
  //     sdk = new OPAClient(u.toString(), {
  //       headers: {
  //         Authorization: `Bearer ${tenant} / ${user}`,
  //       },
  //     });
  //   }
  // }, [wasm, tenant, user]);
  return (
    <AuthzProvider sdk={sdk} path="tickets" defaultInput={{ user, tenant }}>
      <Nav type={type} />
      <Outlet />
    </AuthzProvider>
  );
}
