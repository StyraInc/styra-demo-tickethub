import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthn } from "../AuthnContext";
import { Authz } from "@styra/opa-react";
import Assignee from "./Assignee";

export default function Tickets() {
  const { user, tenant } = useAuthn();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState();
  const [canAssign, setCanAssign] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetch("/api/tickets", {
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${tenant} / ${user}`,
      },
    })
      .then((res) => res.json())
      .then(({ tickets }) => {
        tickets.sort(
          (a, b) =>
            new Date(b.last_updated).getTime() -
            new Date(a.last_updated).getTime(),
        );
        setTickets(tickets);
      });
  }, [tenant, user]);

  // figure out if the backend can do assignments
  useEffect(() => {
    if (!tickets || canAssign) return;
    if (tickets.some(({ assignee }) => assignee == null || !!assignee))
      setCanAssign(true);
  }, [tickets, canAssign]);

  return (
    <main>
      <table id="ticket-list">
        <thead>
          <tr>
            <th>ID</th>
            <th>Last Updated</th>
            <th>Customer</th>
            <th>Description</th>
            {canAssign && <th>Assignee</th>}
            <th colSpan="2">Resolved</th>
          </tr>
        </thead>
        <tbody>
          {tickets?.map((ticket) => (
            <tr key={ticket.id} id={`ticket-${ticket.id}`}>
              <td onClick={() => navigate(`/tickets/${ticket.id}`)}>
                {ticket.id}
              </td>
              <td onClick={() => navigate(`/tickets/${ticket.id}`)}>
                {ticket.last_updated}
              </td>
              <td onClick={() => navigate(`/tickets/${ticket.id}`)}>
                {ticket.customer}
              </td>
              <td onClick={() => navigate(`/tickets/${ticket.id}`)}>
                {ticket.description}
              </td>
              {canAssign && (
                <td>
                  <Assignee ticket={ticket} />
                </td>
              )}
              <td onClick={() => navigate(`/tickets/${ticket.id}`)}>
                {ticket.resolved ? "yes" : "no"}
              </td>
              <td onClick={() => navigate(`/tickets/${ticket.id}`)}>
                <Authz
                  path={"tickets/allow"}
                  input={{ action: "resolve", resource: "ticket", ticket }}
                  fallback={
                    <button disabled={true} type="submit">
                      {ticket.resolved ? "Unresolve" : "Resolve"}
                    </button>
                  }
                >
                  {/* NOTE(sr): This button does not work? It's just to show off disabled/enabled based on authz
                   and batch queries. */}
                  <button type="submit">
                    {ticket.resolved ? "Unresolve" : "Resolve"}
                  </button>
                </Authz>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Authz
        path="tickets/allow"
        input={{ action: "create", resource: "ticket" }}
        fallback={
          <Link disabled={true} to="/tickets/new">
            <button disabled={true}>+ New ticket</button>
          </Link>
        }
      >
        <Link to="/tickets/new">
          <button>+ New ticket</button>
        </Link>
      </Authz>
    </main>
  );
}
