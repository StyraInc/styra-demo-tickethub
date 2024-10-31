import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthn } from "../AuthnContext";
import { Authz, useAuthz } from "@styra/opa-react";

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

  // TODO(sr): take these from somewhere else
  const users = [
    { value: "none", label: "unassigned" },
    { value: "alice", label: "Alice" },
    { value: "bob", label: "Bob" },
    { value: "ceasar", label: "Ceasar" },
  ];

  const { result: authorizedAssigner } = useAuthz("tickets/allow", {
    action: "assign",
    resource: "ticket",
  });

  const handleAssigneeChange = (ticket, assignee) => {
    ticket.assignee = assignee;
    fetch(`/api/tickets/${ticket.id}/assign`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${tenant} / ${user}`,
      },
      body: JSON.stringify({ assignee }),
    });
  };

  return (
    <main>
      <table id="ticket-list">
        <thead>
          <tr>
            <th>ID</th>
            <th>Last Updated</th>
            <th>Customer</th>
            <th>Description</th>
            <th>Assignee</th>
            <th colSpan="2">Resolved</th>
          </tr>
        </thead>
        <tbody>
          {tickets?.map((ticket) => (
            <tr key={ticket.id}>
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
              <td>
                <select
                  defaultValue={ticket.assignee}
                  onChange={(e) => handleAssigneeChange(ticket, e.target.value)}
                  disabled={!authorizedAssigner}
                >
                  {users.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </td>
              <td>{ticket.resolved ? "yes" : "no"}</td>
              <td>
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
