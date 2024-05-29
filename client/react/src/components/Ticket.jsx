import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuthn } from "../AuthnContext";
export default function Ticket() {
  const { current } = useAuthn();
  const account = current?.account;
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState();
  const [fetchTicket, setFetchTicket] = useState(true);
  const [message, setMessage] = useState();

  useEffect(() => {
    if (!fetchTicket || !account) return;

    fetch(`/api/tickets/${ticketId}`, {
      headers: {
        "content-type": "application/json",
        authorization: "Bearer " + account,
      },
    })
      .then((res) => res.json())
      .then((data) => setTicket(data));

    setFetchTicket(false);
  }, [ticketId, account, fetchTicket]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      const response = await fetch(`/api/tickets/${ticketId}/resolve`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer " + account,
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

      setFetchTicket(true);
    },
    [ticketId, ticket],
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

        <label htmlFor="resolved">Resolved</label>
        <div id="resolved">{ticket.resolved ? "yes" : "no"}</div>

        <div>
          <button type="submit">
            {ticket.resolved ? "Unresolve" : "Resolve"}
          </button>
        </div>
        <div>{message && <span className="update-status">{message}</span>}</div>
      </form>
    </main>
  );
}
