import * as React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { AuthProvider } from "react-oidc-context";

import App from "./components/App";
import NewTicket from "./components/NewTicket";
import Tickets from "./components/Tickets";
import Ticket from "./components/Ticket";

const oidcConfig = {
  authority: "http://localhost/dex",
  client_id: "react",
  redirect_uri: "http://localhost/",
  // ...
};
const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AuthProvider {...oidcConfig}>
        <App />
      </AuthProvider>
    ),
    children: [
      {
        path: "",
        element: <Tickets />,
      },
      {
        path: "tickets/new",
        element: <NewTicket />,
      },
      {
        path: "tickets/:ticketId",
        element: <Ticket />,
      },
    ],
  },
]);
const root = createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
