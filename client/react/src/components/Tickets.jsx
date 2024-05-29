import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthn } from "../AuthnContext";
import { /* useAuthz,*/ Authz, Denied } from "opa-react";

export default function Tickets() {
  const { current } = useAuthn();
  if (!current) return null;
  const { account } = current;
  // const resource = { resource: "ticket", action: "create" };
  // const { isLoading, decision } = useAuthz([resource]);
  // console.log({ isLoading, decision });
  // if (isLoading) {
  //   // return null;
  // }
  const navigate = useNavigate();
  const [tickets, setTickets] = useState();

  useEffect(() => {
    fetch("/api/tickets", {
      headers: {
        "content-type": "application/json",
        authorization: "Bearer " + account,
      },
    })
      .then((res) => res.json())
      .then((data) => setTickets(data.tickets));
  }, []);

  return (
    <main>
      <table id="ticket-list">
        <thead>
          <tr>
            <th>ID</th>
            <th>Last Updated</th>
            <th>Customer</th>
            <th>Description</th>
            <th>Resolved</th>
          </tr>
        </thead>
        <tbody>
          {tickets?.map((ticket) => (
            <tr
              key={ticket.id}
              onClick={() => navigate(`/tickets/${ticket.id}`)}
            >
              <td>{ticket.id}</td>
              <td>{ticket.last_updated}</td>
              <td>{ticket.customer}</td>
              <td>{ticket.description}</td>
              <td>{ticket.resolved ? "yes" : "no"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Authz
        path="tickets/allow"
        input={{ action: "create", resource: "ticket" }}
      >
        {
          // TODO(sr): DISABLED doesn't work, it's hidden
        }
        <Link
          authz={Denied.DISABLED}
          className="button-large"
          to="/tickets/new"
        >
          + New ticket
        </Link>
      </Authz>
    </main>
  );
}
