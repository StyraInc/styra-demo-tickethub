import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthn } from "../AuthnContext";
import { Authz, Denied } from "opa-react";

export default function Tickets() {
  const { current } = useAuthn();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState();

  useEffect(() => {
    if (!current) return;
    const { account } = current;
    fetch("/api/tickets", {
      headers: {
        "content-type": "application/json",
        authorization: "Bearer " + account,
      },
    })
      .then((res) => res.json())
      .then((data) => setTickets(data.tickets));
  }, [current]);

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
