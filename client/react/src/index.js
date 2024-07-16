import * as React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

import AuthnProvider from "./AuthnContext";
import App from "./components/App";
import NewTicket from "./components/NewTicket";
import Tickets from "./components/Tickets";
import Ticket from "./components/Ticket";
import BatchDemo from "./components/BatchDemo";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AuthnProvider>
        <App />
      </AuthnProvider>
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
      {
        path: "demo",
        element: <BatchDemo />,
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
