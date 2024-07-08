import { useCallback, useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useAuthn } from "../AuthnContext";
import { Authz } from "@styra/opa-react";

export default function Ticket() {
  const { state } = useLocation();
  const { user, tenant } = useAuthn();
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(state);
  const [message, setMessage] = useState();

  const loadTicket = async function (ticketId, user, tenant, setTicket) {
    fetch(`/api/tickets/${ticketId}`, {
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${tenant} / ${user}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setTicket(data));
  };

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      const response = await fetch(`/api/tickets/${ticketId}/resolve`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${tenant} / ${user}`,
        },
        body: JSON.stringify({ resolved: !ticket.resolved }),
      });

      if (response.status === 200) {
        const resolved = !ticket.resolved
          ? "unresolved → resolved"
          : "resolved → unresolved";
        setMessage(`Ticket updated: ${resolved}`);
      } else {
        setMessage("Error: user unauthorized to perform operation");
      }

      await loadTicket(ticketId, user, tenant, setTicket);
    },
    [ticketId, ticket, user, tenant],
  );

  if (!ticket) {
    return null;
  }
  const { customer, last_updated, description, resolved, resolveAllowed } =
    ticket;

  return (
    <main>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label htmlFor="customer">Customer</label>
        <div id="customer">{customer}</div>

        <label htmlFor="last_updated">Last Updated</label>
        <div id="last_updated">{last_updated}</div>

        <label htmlFor="description">Description</label>
        <div id="description">{description}</div>

        <label htmlFor="resolved">Resolved</label>
        <div id="resolved">{resolved ? "yes" : "no"}</div>

        <button disabled={!resolveAllowed} type="submit">
          {ticket.resolved ? "Unresolve" : "Resolve"}
        </button>
        <div>{message && <span className="update-status">{message}</span>}</div>
      </form>
    </main>
  );
}
