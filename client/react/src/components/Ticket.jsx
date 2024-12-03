import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuthn } from "../AuthnContext";
import { Authz } from "@styra/opa-react";
import Assignee from "./Assignee";

const loadTicket = async (ticketId, user, tenant, setTicket) => {
  fetch(`/api/tickets/${ticketId}`, {
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${tenant} / ${user}`,
    },
  })
    .then((res) => res.json())
    .then((data) => setTicket(data));
};

export default function Ticket() {
  const { user, tenant } = useAuthn();
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState();
  const [canAssign, setCanAssign] = useState(false);
  const [message, setMessage] = useState();

  useEffect(() => {
    if (!user) return; // wait for user to be set
    loadTicket(ticketId, user, tenant, setTicket);
  }, [user, tenant, ticketId]);

  // figure out if the backend can do assignments
  useEffect(() => {
    if (!ticket || canAssign) return;
    if ("assignee" in ticket) setCanAssign(true);
  }, [ticket, canAssign]);

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
        const { reason } = await response.json();
        setMessage(
          `Error: user unauthorized to perform operation.${reason !== undefined ? ` ${reason}` : ""}`,
        );
      }

      await loadTicket(ticketId, user, tenant, setTicket);
    },
    [ticketId, ticket, user, tenant],
  );

  if (!ticket) {
    return null;
  }

  return (
    <main>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label htmlFor="customer">Customer</label>
        <div id="customer">{ticket.customer}</div>

        <label htmlFor="last_updated">Last Updated</label>
        <div id="last_updated">{ticket.last_updated}</div>

        <label htmlFor="description">Description</label>
        <div id="description">{ticket.description}</div>

        {canAssign && (
          <>
            <label htmlFor="assignee">Assignee</label>
            <div id="assignee">
              <Assignee ticket={ticket} />
            </div>
          </>
        )}

        <label htmlFor="resolved">Resolved</label>
        <div id="resolved">{ticket.resolved ? "yes" : "no"}</div>

        <Authz
          path="tickets/allow"
          input={{ action: "resolve", resource: "ticket" }}
          fallback={
            <button disabled={true} type="submit">
              {ticket.resolved ? "Unresolve" : "Resolve"}
            </button>
          }
        >
          <button type="submit">
            {ticket.resolved ? "Unresolve" : "Resolve"}
          </button>
        </Authz>
        <div>{message && <span className="update-status">{message}</span>}</div>
      </form>
    </main>
  );
}
