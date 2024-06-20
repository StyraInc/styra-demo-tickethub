import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthn } from "../AuthnContext";
import { Authz, Denied } from "opa-react";

export default function Tickets() {
  const { user, tenant } = useAuthn();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState();

  useEffect(() => {
    if (!user) return;
    fetch("/api/tickets", {
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${tenant} / ${user}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setTickets(data.tickets));
  }, [tenant, user]);

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
        {(result) => (
          <Link disabled={!result} to="/tickets/new">
            <button disabled={!result}>+ New ticket</button>
          </Link>
        )}
      </Authz>
    </main>
  );
}
