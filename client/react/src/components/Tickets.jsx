import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Tickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState();

  useEffect(() => {
    fetch("/api/tickets")
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
      <Link className="button-large" to="/tickets/new">
        + New ticket
      </Link>
    </main>
  );
}
